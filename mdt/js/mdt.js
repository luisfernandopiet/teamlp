/*
 * Motor do MDT – Método Destrava Treino.
 * Recebe o treino atual do aluno (já organizado) e devolve as 4 semanas do plano.
 * Sem dependências: o mesmo arquivo roda no navegador (testes e prévia) e no Google Apps Script.
 */
var MDT = (function () {
  var GRUPOS = {
    peito: 'Peito', costas: 'Costas', ombro: 'Ombro', biceps: 'Bíceps', triceps: 'Tríceps',
    quadriceps: 'Quadríceps', posterior: 'Posterior de coxa', gluteos: 'Glúteos',
    adutor: 'Adutor', panturrilha: 'Panturrilha', abdomen: 'Abdômen'
  };
  // Grupos que entram no plano mesmo que não estejam no treino atual.
  var GRUPOS_PRINCIPAIS = ['peito', 'costas', 'ombro', 'biceps', 'triceps', 'quadriceps', 'posterior', 'gluteos'];
  // Candidatos a Secundário quando o aluno não escolhe, em ordem de preferência.
  var CANDIDATOS_SECUNDARIO = ['costas', 'quadriceps', 'peito', 'posterior', 'gluteos', 'ombro'];

  var SEMANAS = [
    { n: 1, nome: 'Ajuste', objetivo: 'Acertar a técnica e descobrir a carga certa de cada exercício.',
      P: [10, 12], S: [8, 10], D: [5, 6], reps: { A: '10–15', B: '12–15', C: '15–20' } },
    { n: 2, nome: 'Construção', objetivo: 'Um pouco mais de séries, com as cargas já acertadas.',
      P: [12, 14], S: [8, 10], D: [6, 8], reps: { A: '8–12', B: '10–15', C: '12–15' } },
    { n: 3, nome: 'Progressão', objetivo: 'A semana com mais séries. Foco em subir repetições e carga.',
      P: [14, 16], S: [10, 12], D: [6, 8], reps: { A: '8–10', B: '8–12', C: '10–15' } },
    { n: 4, nome: 'Carga', objetivo: 'Menos séries e mais peso, para fechar no ponto mais forte.',
      P: [12, 14], S: [8, 10], D: [5, 7], reps: { A: '6–10', B: '8–12', C: '10–15' } }
  ];
  var SEMANA_LEVE = { P: [8, 10], S: [6, 8], D: [4, 6] };
  var LIMITE_POR_TREINO = { P: 8, S: 6, D: 4 };
  var MAX_SERIES = 5, MIN_SERIES = 2;

  // Exercício usado quando um grupo precisa entrar e não existe no treino.
  var EXERCICIO_PADRAO = {
    peito: ['Supino inclinado com halter', 'A'], costas: ['Puxada alta', 'A'], ombro: ['Elevação lateral', 'C'],
    biceps: ['Rosca direta', 'C'], triceps: ['Tríceps na polia', 'C'], quadriceps: ['Leg press', 'A'],
    posterior: ['Flexora sentada', 'B'], gluteos: ['Elevação pélvica na máquina', 'B'],
    adutor: ['Adutora', 'C'], panturrilha: ['Panturrilha em pé', 'C'], abdomen: ['Abdominal na máquina', 'C']
  };
  var INFERIORES = ['quadriceps', 'posterior', 'gluteos', 'adutor', 'panturrilha'];
  var TIPO_PADRAO ={ biceps: 'C', triceps: 'C', adutor: 'C', panturrilha: 'C', abdomen: 'C' };

  function copiar(o) { return JSON.parse(JSON.stringify(o)); }
  function nomeGrupo(g) { return GRUPOS[g] || g; }

  // Grupo que recebe meia série (só para quem treina até 2x por semana).
  function grupoIndireto(ex) {
    if ((ex.grupo === 'peito' || ex.grupo === 'ombro') && ex.tipo !== 'C') return 'triceps';
    if (ex.grupo === 'costas' && ex.tipo !== 'C') return 'biceps';
    if (ex.grupo === 'quadriceps' && ex.tipo === 'A') return 'gluteos';
    return null;
  }

  function normalizar(entrada) {
    var dias = (entrada.dias || []).filter(function (d) { return d && d.exercicios && d.exercicios.length; })
      .map(function (d, i) {
        return {
          nome: d.nome || ('Treino ' + String.fromCharCode(65 + i)),
          exercicios: d.exercicios.map(function (e) {
            var g = String(e.grupo || '').toLowerCase();
            var t = String(e.tipo || '').toUpperCase();
            if (!GRUPOS[g]) g = 'outro';
            if (['A', 'B', 'C'].indexOf(t) < 0) t = TIPO_PADRAO[g] || 'B';
            var s = parseInt(e.series, 10);
            return { nome: String(e.nome || 'Exercício').trim(), grupo: g, tipo: t,
              series: isNaN(s) ? 3 : Math.max(1, Math.min(8, s)), original: isNaN(s) ? 3 : s };
          })
        };
      });
    var freq = parseInt(entrada.frequencia, 10);
    if (isNaN(freq) || freq < 1) freq = dias.length || 3;
    return { dias: dias, frequencia: Math.min(7, freq) };
  }

  // Séries semanais por grupo. Cada treino da lista é repetido frequencia/nº de treinos vezes na semana.
  function contar(dias, frequencia) {
    var fator = frequencia / Math.max(1, dias.length);
    var c = {};
    Object.keys(GRUPOS).forEach(function (g) { c[g] = 0; });
    dias.forEach(function (d) {
      d.exercicios.forEach(function (e) {
        if (e.removido || !GRUPOS[e.grupo]) return;
        c[e.grupo] += e.series * fator;
        var ind = frequencia <= 2 ? grupoIndireto(e) : null;
        if (ind) c[ind] += e.series * fator * 0.5;
      });
    });
    Object.keys(c).forEach(function (g) { c[g] = Math.round(c[g] * 10) / 10; });
    return c;
  }

  function definirPapeis(base, entrada) {
    var atual = contar(base.dias, base.frequencia);
    var P = (entrada.prioritarios || []).filter(function (g) { return GRUPOS[g]; }).slice(0, 2);
    if (!P.length) P = ['peito'];
    var S = (entrada.secundarios || []).filter(function (g) { return GRUPOS[g] && P.indexOf(g) < 0; }).slice(0, 3);
    if (!S.length) {
      S = CANDIDATOS_SECUNDARIO.filter(function (g) { return P.indexOf(g) < 0; })
        .sort(function (a, b) { return (atual[b] - atual[a]) || (CANDIDATOS_SECUNDARIO.indexOf(a) - CANDIDATOS_SECUNDARIO.indexOf(b)); })
        .slice(0, 2);
    }
    var papel = {};
    Object.keys(GRUPOS).forEach(function (g) { papel[g] = P.indexOf(g) >= 0 ? 'P' : (S.indexOf(g) >= 0 ? 'S' : 'D'); });
    return papel;
  }

  function seriesNoTreino(dia, grupo) {
    return dia.exercicios.reduce(function (s, e) { return s + (!e.removido && e.grupo === grupo ? e.series : 0); }, 0);
  }

  // Acrescenta 1 série ao grupo. Devolve false se não houver onde.
  function acrescentar(plano, grupo, papel, notas) {
    var limite = LIMITE_POR_TREINO[papel];
    var opcoes = [];
    plano.dias.forEach(function (d) {
      d.exercicios.forEach(function (e) {
        if (!e.removido && e.grupo === grupo && e.series < MAX_SERIES)
          opcoes.push({ e: e, cheio: seriesNoTreino(d, grupo) >= limite });
      });
    });
    opcoes.sort(function (a, b) { return (a.cheio - b.cheio) || (a.e.series - b.e.series); });
    if (opcoes.length && !opcoes[0].cheio) { opcoes[0].e.series++; return true; }
    // Sem espaço: novo exercício, de preferência num treino da mesma região (superior/inferior),
    // com menos séries desse grupo e menos séries no total.
    var regiao = function (d) {
      return d.exercicios.filter(function (e) { return !e.removido && INFERIORES.indexOf(e.grupo) >= 0; }).length * 2 >
        d.exercicios.filter(function (e) { return !e.removido; }).length;
    };
    var querInferior = INFERIORES.indexOf(grupo) >= 0;
    var dias = plano.dias.slice().sort(function (a, b) {
      return ((regiao(b) === querInferior) - (regiao(a) === querInferior)) ||
        (seriesNoTreino(a, grupo) - seriesNoTreino(b, grupo)) ||
        (a.exercicios.reduce(function (s, e) { return s + (e.removido ? 0 : e.series); }, 0) -
         b.exercicios.reduce(function (s, e) { return s + (e.removido ? 0 : e.series); }, 0));
    });
    var alvo = dias[0];
    if (seriesNoTreino(alvo, grupo) + MIN_SERIES > limite && opcoes.length) { opcoes[0].e.series++; return true; }
    var p = EXERCICIO_PADRAO[grupo];
    var mesmoNome = alvo.exercicios.filter(function (e) { return e.nome === p[0] && !e.removido; })[0];
    if (mesmoNome) { if (mesmoNome.series >= MAX_SERIES) return false; mesmoNome.series++; return true; }
    alvo.exercicios.push({ nome: p[0], grupo: grupo, tipo: p[1], series: MIN_SERIES, original: 0, novo: true });
    notas.push('Entrou "' + p[0] + '" (' + nomeGrupo(grupo) + ') no ' + alvo.nome + '.');
    return true;
  }

  // Tira 1 série do grupo; se todos os exercícios já estão no mínimo, tira um exercício inteiro.
  function tirar(plano, grupo, notas) {
    var lista = [];
    plano.dias.forEach(function (d) {
      d.exercicios.forEach(function (e, i) { if (!e.removido && e.grupo === grupo) lista.push({ e: e, d: d, i: i }); });
    });
    if (!lista.length) return false;
    var semIndireto = plano.frequencia > 2;
    var acima = lista.filter(function (x) { return x.e.series > MIN_SERIES; });
    if (acima.length) {
      acima.sort(function (a, b) {
        return (b.e.series - a.e.series) || (seriesNoTreino(b.d, grupo) - seriesNoTreino(a.d, grupo)) ||
          ((b.e.tipo === 'C') - (a.e.tipo === 'C'));
      });
      acima[0].e.series--; return true;
    }
    // O último exercício do grupo só sai se o grupo ainda recebe meia série de outros exercícios.
    if (lista.length < 2 && semIndireto) return false;
    // Sai o último exercício do grupo, de preferência um tipo C.
    lista.sort(function (a, b) { return ((b.e.tipo === 'C') - (a.e.tipo === 'C')) || (b.i - a.i); });
    lista[0].e.removido = true;
    notas.push('Saiu "' + lista[0].e.nome + '" do ' + lista[0].d.nome + ' (' + nomeGrupo(grupo) + ' já tinha séries de sobra).');
    return true;
  }

  function distancia(v, f) { return v < f[0] ? f[0] - v : (v > f[1] ? v - f[1] : 0); }

  // Aproxima cada grupo da faixa, um passo por vez, e só aceita o passo se ele aproximar de verdade.
  // (Com treinos que se repetem na semana, nem sempre dá para cair exatamente dentro.)
  function ajustarFaixas(plano, faixas, papel, ativos, notas) {
    for (var volta = 0; volta < 3; volta++) {
      ativos.forEach(function (g) {
        var f = faixas[papel[g]];
        for (var passo = 0; passo < 40; passo++) {
          var d0 = distancia(contar(plano.dias, plano.frequencia)[g], f);
          if (d0 === 0) break;
          var teste = copiar(plano), notasPasso = [];
          var abaixo = contar(teste.dias, teste.frequencia)[g] < f[0];
          var feito = abaixo ? acrescentar(teste, g, papel[g], notasPasso) : tirar(teste, g, notasPasso);
          if (!feito || distancia(contar(teste.dias, teste.frequencia)[g], f) >= d0 - 1e-9) break;
          plano.dias = teste.dias;
          Array.prototype.push.apply(notas, notasPasso);
        }
      });
    }
  }

  function ordenarPrioritarios(plano, papel) {
    plano.dias.forEach(function (d) {
      d.exercicios = d.exercicios.map(function (e, i) { return { e: e, i: i }; })
        .sort(function (a, b) { return ((papel[b.e.grupo] === 'P') - (papel[a.e.grupo] === 'P')) || (a.i - b.i); })
        .map(function (x) { return x.e; });
    });
  }

  function montarPlano(entrada) {
    var base = normalizar(entrada);
    if (!base.dias.length) throw new Error('Nenhum exercício encontrado no treino enviado.');
    var papel = definirPapeis(base, entrada);
    var atual = contar(base.dias, base.frequencia);
    var notas = [], avisos = [];

    var ativos = Object.keys(GRUPOS).filter(function (g) {
      return atual[g] > 0 || papel[g] !== 'D' || GRUPOS_PRINCIPAIS.indexOf(g) >= 0;
    });
    Object.keys(GRUPOS).forEach(function (g) {
      if (ativos.indexOf(g) < 0) avisos.push(nomeGrupo(g) + ' não estava no seu treino e ficou de fora.');
    });
    base.dias.forEach(function (d) {
      d.exercicios.forEach(function (e) { if (e.grupo === 'outro') avisos.push('"' + e.nome + '" ficou como está: não deu para identificar o grupo muscular.'); });
    });

    // Semana 1: o treino atual entra nas faixas com o mínimo de mudanças.
    var s1 = copiar(base);
    ajustarFaixas(s1, SEMANAS[0], papel, ativos, notas);
    ordenarPrioritarios(s1, papel);

    var semanas = SEMANAS.map(function (sem, i) {
      var p = i === 0 ? s1 : copiar(s1), notasSemana = [];
      if (i > 0) { ajustarFaixas(p, sem, papel, ativos, notasSemana); ordenarPrioritarios(p, papel); }
      var cont = contar(p.dias, p.frequencia);
      return {
        n: sem.n, nome: sem.nome, objetivo: sem.objetivo, reps: sem.reps, notas: notasSemana,
        dias: p.dias.map(function (d) {
          return { nome: d.nome, exercicios: d.exercicios.filter(function (e) { return !e.removido; }).map(function (e) {
            return { nome: e.nome, grupo: e.grupo, nomeGrupo: nomeGrupo(e.grupo), tipo: e.tipo, series: e.series,
              repeticoes: e.grupo === 'outro' ? 'como antes' : sem.reps[e.tipo], novo: !!e.novo };
          }) };
        }),
        volume: ativos.map(function (g) {
          var f = sem[papel[g]], v = cont[g], passo = p.frequencia / Math.max(1, p.dias.length);
          var d = distancia(v, f);
          return { grupo: g, nome: nomeGrupo(g), papel: papel[g], series: v, faixa: f,
            situacao: d === 0 ? 'dentro' : (d < passo ? 'perto' : (v < f[0] ? 'abaixo' : 'acima')) };
        })
      };
    });

    // O que mudou do treino original para a semana 1.
    var mudancas = [];
    s1.dias.forEach(function (d) {
      d.exercicios.forEach(function (e) {
        if (e.removido || e.novo || e.grupo === 'outro') return;
        if (e.series !== e.original) mudancas.push(e.nome + ' (' + d.nome + '): ' + e.original + ' → ' + e.series + ' séries');
      });
    });

    var nomes = function (x) { return Object.keys(papel).filter(function (g) { return papel[g] === x && ativos.indexOf(g) >= 0; }).map(nomeGrupo); };
    return {
      aluno: entrada.nome || '', frequencia: base.frequencia, numeroTreinos: base.dias.length,
      prioritarios: nomes('P'), secundarios: nomes('S'), demais: nomes('D'),
      atual: ativos.map(function (g) { return { grupo: g, nome: nomeGrupo(g), series: atual[g] }; }),
      semanas: semanas, mudancas: mudancas.concat(notas), avisos: avisos,
      semanaLeve: SEMANA_LEVE
    };
  }

  return { GRUPOS: GRUPOS, SEMANAS: SEMANAS, montarPlano: montarPlano, contar: contar };
})();
