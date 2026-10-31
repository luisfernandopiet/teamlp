/*
 * Desenha o plano (saída de MDT.montarPlano) em folhas A4 e gera o PDF.
 * desenharPlano(plano, elemento) → monta as páginas dentro do elemento.
 * gerarPdf(elemento) → Promise com o PDF em base64 (precisa de html2canvas e jsPDF carregados).
 */
var PlanoPDF = (function () {
  var WHATSAPP = 'https://wa.me/5541984236821?text=' + encodeURIComponent('Olá Luis, recebi o meu plano MDT e quero saber da consultoria');
  var PAPEL = { P: 'Prioritário', S: 'Secundário', D: 'Demais' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(v) { return String(Math.round(v)); }

  function desenharPlano(plano, raiz) {
    raiz.innerHTML = '';
    raiz.classList.add('plano');
    var pagina = 1;

    function novaPagina(cls, rodape) {
      var s = document.createElement('section');
      s.className = 'page ' + (cls || '');
      s.innerHTML = '<div class="body"></div>' + (rodape === false ? '' :
        '<div class="foot"><span><b>MDT</b> · Plano de ' + esc(plano.aluno) + '</span><span>' + String(pagina).padStart(2, '0') + '</span></div>');
      raiz.appendChild(s); pagina++;
      return s.querySelector('.body');
    }
    function cabe(b) { return b.scrollHeight <= b.clientHeight + 1; }

    // Capa
    var b = novaPagina('cover', false);
    b.innerHTML = '<div class="frame"></div><div class="content"><div class="kicker">MDT · Método Destrava Treino</div>' +
      '<h1 style="margin-top:15px">O seu plano<br><span class="g">de 4 semanas</span></h1><div class="name">' + esc(plano.aluno) + '</div>' +
      '<div class="meta"><div><b>' + plano.frequencia + 'x</b>treinos por semana</div><div><b>' + plano.numeroTreinos + '</b>treinos diferentes</div>' +
      '<div><b>' + esc(plano.prioritarios.join(' · ')) + '</b>prioridade</div></div></div><div class="by">Luis Pietchaki · Coach</div>';

    // Como o plano foi montado
    b = novaPagina();
    var vol = '<table><tr><th>Grupo</th><th>Papel</th><th class="c">Hoje</th><th class="c">S1</th><th class="c">S2</th><th class="c">S3</th><th class="c">S4</th></tr>';
    plano.semanas[0].volume.forEach(function (v, i) {
      var hoje = (plano.atual.filter(function (a) { return a.grupo === v.grupo; })[0] || { series: 0 }).series;
      vol += '<tr><td><b class="' + (v.papel === 'P' ? 'g' : '') + '">' + esc(v.nome) + '</b></td><td>' + PAPEL[v.papel] + '</td><td class="c muted">' + fmt(hoje) + '</td>' +
        plano.semanas.map(function (s) { return '<td class="c">' + fmt(s.volume[i].series) + '</td>'; }).join('') + '</tr>';
    });
    vol += '</table>';
    b.innerHTML = '<div class="kicker">Como o seu plano foi montado</div><h2>Os seus <span class="g">números</span></h2>' +
      '<p>O seu plano usa os seus próprios exercícios. O que muda de uma semana para outra é o número de séries e a faixa de repetições, seguindo as regras do MDT.</p>' +
      '<div class="grid3 mt"><div class="card gold"><h4>Prioritário</h4>' + esc(plano.prioritarios.join(', ')) + '</div><div class="card"><h4>Secundários</h4>' +
      esc(plano.secundarios.join(', ')) + '</div><div class="card"><h4>Demais</h4><span class="small">' + esc(plano.demais.join(', ')) + '</span></div></div>' +
      '<h3 class="mt">Séries por semana de cada grupo</h3>' + vol +
      '<p class="small muted" style="margin-top:8px">"Hoje" é o seu treino como você mandou. Os números são o total da semana, somando todos os treinos.</p>' +
      (plano.mudancas.length ? '<h3 class="mt">O que mudou no seu treino</h3><ul class="clean">' +
        plano.mudancas.slice(0, 12).map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' : '');

    // Semanas
    plano.semanas.forEach(function (s) {
      function cabecalho(cont) {
        return '<div class="weekhead"><div><div class="kicker">Semana ' + s.n + (cont ? ' · continuação' : '') + '</div><h2>' + esc(s.nome) +
          '</h2></div><div class="wnum">S' + s.n + '</div></div>' + (cont ? '' : '<p class="muted" style="margin:0">' + esc(s.objetivo) +
          '</p><div class="repsbar"><span>Repetições: <b>A</b> ' + s.reps.A + ' · <b>B</b> ' + s.reps.B + ' · <b>C</b> ' + s.reps.C +
          '</span><span>Cada série <b>até a falha</b></span></div>');
      }
      var corpo = novaPagina(); corpo.innerHTML = cabecalho(false);
      s.dias.forEach(function (d) {
        var total = d.exercicios.reduce(function (t, e) { return t + e.series; }, 0);
        var html = '<div class="day"><h3>' + esc(d.nome) + '<small>' + total + ' séries</small></h3><table><tr><th>Exercício</th><th>Grupo</th>' +
          '<th class="c">Tipo</th><th class="c">Séries</th><th class="c">Repetições</th></tr>' +
          d.exercicios.map(function (e) {
            return '<tr><td>' + esc(e.nome) + (e.novo ? '<span class="novo">NOVO</span>' : '') + '</td><td class="muted">' + esc(e.nomeGrupo) +
              '</td><td class="c"><span class="tag">' + e.tipo + '</span></td><td class="c"><b>' + e.series + '</b></td><td class="c">' + e.repeticoes + '</td></tr>';
          }).join('') + '</table></div>';
        corpo.insertAdjacentHTML('beforeend', html);
        if (!cabe(corpo)) {
          corpo.lastElementChild.remove();
          corpo = novaPagina(); corpo.innerHTML = cabecalho(true);
          corpo.insertAdjacentHTML('beforeend', html);
        }
      });
    });

    // Check-in, semana leve e consultoria
    b = novaPagina();
    b.innerHTML = '<div class="kicker">Toda semana</div><h2>O seu <span class="g">check-in</span></h2>' +
      '<p>No fim de cada semana, responda: quantos treinos fiz, como me senti, se as cargas subiram, se fiz as repetições, como foi o esforço e se senti dor. Depois, veja qual linha descreve a sua semana:</p>' +
      '<table class="ci"><tr><th class="c">Regra</th><th>Se a semana foi assim…</th><th>…faça isso</th></tr>' +
      '<tr><td class="ok">A</td><td>Cargas ou repetições subiram e você está se recuperando bem</td><td>Siga o plano e continue subindo repetições e carga</td></tr>' +
      '<tr><td class="ok">F</td><td>Você está evoluindo, mesmo com poucas séries</td><td>Siga o plano. Não precisa acrescentar nada</td></tr>' +
      '<tr><td class="n">B</td><td>2 semanas seguidas sem evoluir, com os treinos em dia e boa recuperação</td><td>Revise sono e alimentação. Depois, acrescente 1 a 2 séries no prioritário</td></tr>' +
      '<tr><td class="stop">C</td><td>As cargas caíram e o cansaço acumulou</td><td>Não acrescente séries. Mantenha ou tire algumas</td></tr>' +
      '<tr><td class="stop">D</td><td>Apareceu dor ligada ao treino</td><td>Não acrescente séries. Revise exercício, técnica, amplitude e carga</td></tr>' +
      '<tr><td class="stop">E</td><td>Faltaram treinos: menos de 80% do planejado</td><td>Ajuste a rotina antes de mudar o treino</td></tr></table>' +
      '<div class="grid2 mt"><div class="card" style="border-style:dashed;border-color:#2f5a35;background:#111a13"><h4 style="color:var(--green)">Depois da semana 4: semana leve</h4>' +
      '<p class="small" style="margin:0">Opcional, antes de um novo plano: Prioritário 8–10, Secundário 6–8, Demais 4–6 séries, repetições da semana 1 e cada série terminando com folga.</p></div>' +
      '<div class="card gold"><h4>Quer que eu acompanhe?</h4><p class="small" style="margin:0 0 11px">Na consultoria eu monto e ajusto o seu treino com você, semana a semana.</p>' +
      '<a class="btn" href="' + WHATSAPP + '">Falar comigo</a></div></div>' +
      (plano.avisos.length ? '<h3 class="mt">Observações</h3><ul class="clean">' + plano.avisos.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' : '');

    return pagina - 1;
  }

  // Cada folha vira uma imagem numa página A4 do PDF.
  function gerarPdf(raiz, escala) {
    var paginas = Array.prototype.slice.call(raiz.querySelectorAll('.page'));
    var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
    var cadeia = (document.fonts && document.fonts.ready) || Promise.resolve();
    paginas.forEach(function (p, i) {
      cadeia = cadeia.then(function () {
        return html2canvas(p, { scale: escala || 2, backgroundColor: '#0c0c0d', useCORS: true, logging: false });
      }).then(function (canvas) {
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.86), 'JPEG', 0, 0, 210, 297);
      });
    });
    return cadeia.then(function () { return pdf.output('datauristring').split(',')[1]; });
  }

  return { desenharPlano: desenharPlano, gerarPdf: gerarPdf };
})();
