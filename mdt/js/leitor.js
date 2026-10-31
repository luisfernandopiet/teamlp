/*
 * Leitor da ficha: transforma o texto do treino (digitado ou lido da foto) em treinos e exercícios.
 * Reconhece o exercício pelo banco abaixo e já traz o grupo muscular e o tipo (A, B ou C).
 * O aluno confere e corrige a lista antes de gerar o plano.
 */
var Leitor = (function () {
  // [nome padrão, grupo, tipo, outras formas de escrever]
  var BANCO = [
    ['Supino reto com barra', 'peito', 'A', ['supino reto', 'supino barra', 'supino plano', 'supino']],
    ['Supino inclinado com barra', 'peito', 'A', ['supino inclinado barra', 'supino inclinado com barra']],
    ['Supino inclinado com halter', 'peito', 'A', ['supino inclinado halter', 'supino inclinado halteres', 'supino inclinado', 'inclinado com halter']],
    ['Supino reto com halter', 'peito', 'A', ['supino reto halter', 'supino halter', 'supino com halteres']],
    ['Supino declinado', 'peito', 'A', ['supino declinado']],
    ['Supino máquina', 'peito', 'B', ['supino maquina', 'supino articulado', 'supino na maquina']],
    ['Chest press', 'peito', 'B', ['chest press', 'chest', 'peck press']],
    ['Crucifixo', 'peito', 'C', ['crucifixo', 'crucifixo reto', 'crucifixo inclinado', 'crucifixo halter']],
    ['Crucifixo na polia', 'peito', 'C', ['crucifixo polia', 'crucifixo no cabo']],
    ['Voador', 'peito', 'C', ['voador', 'peck deck', 'pec deck', 'fly', 'fly maquina']],
    ['Cross over', 'peito', 'C', ['cross over', 'crossover', 'cross']],
    ['Flexão de braço', 'peito', 'B', ['flexao', 'flexao de braco', 'flexoes']],

    ['Puxada alta', 'costas', 'A', ['puxada alta', 'puxada frente', 'puxada aberta', 'puxada fechada', 'pulldown frente', 'puxador', 'puxada', 'pulley frente', 'pulley']],
    ['Barra fixa', 'costas', 'A', ['barra fixa', 'pull up', 'pullup', 'chin up']],
    ['Remada curvada', 'costas', 'A', ['remada curvada', 'remada barra', 'remada curvada barra']],
    ['Remada unilateral com halter', 'costas', 'A', ['remada unilateral', 'serrote', 'remada serrote', 'remada halter']],
    ['Remada baixa', 'costas', 'B', ['remada baixa', 'remada sentada', 'remada no cabo', 'remada triangulo']],
    ['Remada máquina', 'costas', 'B', ['remada maquina', 'remada articulada', 'remada na maquina', 'remada cavalinho', 'remada t']],
    ['Pulldown com corda', 'costas', 'C', ['pulldown', 'pull down', 'pullover polia', 'pull over', 'pullover']],
    ['Levantamento terra', 'costas', 'A', ['levantamento terra', 'terra', 'deadlift']],
    ['Lombar no banco', 'costas', 'C', ['lombar', 'hiperextensao', 'extensao lombar', 'banco romano']],

    ['Desenvolvimento com halter', 'ombro', 'A', ['desenvolvimento halter', 'desenvolvimento com halteres', 'desenvolvimento', 'arnold']],
    ['Desenvolvimento com barra', 'ombro', 'A', ['desenvolvimento barra', 'desenvolvimento militar', 'militar']],
    ['Desenvolvimento máquina', 'ombro', 'B', ['desenvolvimento maquina', 'desenvolvimento articulado', 'desenvolvimento smith']],
    ['Elevação lateral', 'ombro', 'C', ['elevacao lateral', 'lateral', 'elevacao lateral polia', 'elevacao lateral halter']],
    ['Elevação frontal', 'ombro', 'C', ['elevacao frontal', 'frontal']],
    ['Crucifixo inverso', 'ombro', 'C', ['crucifixo inverso', 'voador inverso', 'posterior de ombro', 'deltoide posterior', 'peck deck inverso']],
    ['Face pull', 'ombro', 'C', ['face pull', 'facepull']],
    ['Encolhimento', 'ombro', 'C', ['encolhimento', 'trapezio']],

    ['Rosca direta', 'biceps', 'C', ['rosca direta', 'rosca barra', 'rosca w', 'rosca']],
    ['Rosca alternada', 'biceps', 'C', ['rosca alternada', 'rosca halter']],
    ['Rosca martelo', 'biceps', 'C', ['rosca martelo', 'martelo']],
    ['Rosca Scott', 'biceps', 'C', ['rosca scott', 'scott']],
    ['Rosca concentrada', 'biceps', 'C', ['rosca concentrada', 'concentrada']],
    ['Rosca na polia', 'biceps', 'C', ['rosca polia', 'rosca no cabo', 'rosca na polia']],

    ['Tríceps corda', 'triceps', 'C', ['triceps corda', 'corda', 'triceps na corda']],
    ['Tríceps na polia', 'triceps', 'C', ['triceps polia', 'triceps pulley', 'triceps barra', 'triceps na polia', 'triceps']],
    ['Tríceps testa', 'triceps', 'C', ['triceps testa', 'testa']],
    ['Tríceps francês', 'triceps', 'C', ['triceps frances', 'frances']],
    ['Tríceps coice', 'triceps', 'C', ['triceps coice', 'coice']],
    ['Mergulho', 'triceps', 'B', ['mergulho', 'paralelas', 'dips']],

    ['Agachamento livre', 'quadriceps', 'A', ['agachamento livre', 'agachamento', 'agachamento barra', 'squat']],
    ['Agachamento hack', 'quadriceps', 'A', ['hack', 'agachamento hack', 'hack machine']],
    ['Agachamento no smith', 'quadriceps', 'A', ['smith', 'agachamento smith', 'agachamento no smith']],
    ['Agachamento sumô', 'quadriceps', 'A', ['agachamento sumo', 'sumo']],
    ['Agachamento búlgaro', 'quadriceps', 'B', ['bulgaro', 'agachamento bulgaro']],
    ['Leg press', 'quadriceps', 'A', ['leg press', 'leg', 'leg 45', 'legpress', 'leg horizontal']],
    ['Afundo', 'quadriceps', 'B', ['afundo', 'passada', 'avanco', 'lunge']],
    ['Cadeira extensora', 'quadriceps', 'B', ['extensora', 'cadeira extensora', 'extensao de pernas']],

    ['Stiff', 'posterior', 'A', ['stiff', 'terra romeno', 'levantamento terra romeno', 'rdl']],
    ['Mesa flexora', 'posterior', 'B', ['mesa flexora', 'flexora deitada', 'flexora', 'flexor']],
    ['Cadeira flexora', 'posterior', 'B', ['cadeira flexora', 'flexora sentada']],

    ['Elevação pélvica', 'gluteos', 'B', ['elevacao pelvica', 'hip thrust', 'pelvica', 'elevacao de quadril']],
    ['Glúteo na polia', 'gluteos', 'C', ['gluteo polia', 'coice gluteo', 'gluteo no cabo', 'gluteo 4 apoios', 'gluteo']],
    ['Cadeira abdutora', 'gluteos', 'C', ['abdutora', 'cadeira abdutora', 'abducao']],

    ['Cadeira adutora', 'adutor', 'C', ['adutora', 'cadeira adutora', 'aducao']],
    ['Panturrilha em pé', 'panturrilha', 'C', ['panturrilha em pe', 'panturrilha', 'gemeos', 'panturrilha no leg']],
    ['Panturrilha sentado', 'panturrilha', 'C', ['panturrilha sentado', 'soleo']],
    ['Abdominal', 'abdomen', 'C', ['abdominal', 'abdomen', 'abdominal maquina', 'abdominal supra', 'abdominal infra', 'crunch', 'prancha', 'abd']]
  ];

  function normal(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Lista de todas as formas, das mais longas para as mais curtas (a mais específica vence).
  var FORMAS = [];
  BANCO.forEach(function (b, i) {
    [b[0]].concat(b[3]).forEach(function (f) { FORMAS.push({ f: normal(f), i: i }); });
  });
  FORMAS.sort(function (a, b) { return b.f.length - a.f.length; });

  function distancia(a, b) {
    var m = a.length, n = b.length, d = [];
    for (var i = 0; i <= m; i++) { d[i] = [i]; }
    for (var j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }

  // Acha o exercício do banco que aparece no texto (aceita pequenos erros da leitura da foto).
  // A leitura da foto às vezes troca letras por números ("inc1inado", "h0rizontal").
  function corrigirLeitura(s) {
    return normal(s).replace(/([a-z])1(?=[a-z])/g, '$1l').replace(/\b1(?=[a-z]{2})/g, 'l')
      .replace(/([a-z])0(?=[a-z])/g, '$1o').replace(/([a-z])5(?=[a-z])/g, '$1s');
  }

  function reconhecer(texto) {
    texto = corrigirLeitura(texto);
    var t = ' ' + normal(texto) + ' ';
    for (var k = 0; k < FORMAS.length; k++) {
      if (t.indexOf(' ' + FORMAS[k].f + ' ') >= 0) return BANCO[FORMAS[k].i];
    }
    var palavras = normal(texto).split(' '), melhor = null, nota = 99;
    FORMAS.forEach(function (fo) {
      if (fo.f.length < 6) return;
      var n = fo.f.split(' ').length;
      for (var p = 0; p + n <= palavras.length; p++) {
        var trecho = palavras.slice(p, p + n).join(' ');
        var dist = distancia(trecho, fo.f) / fo.f.length;
        if (dist < nota) { nota = dist; melhor = BANCO[fo.i]; }
      }
    });
    return nota <= 0.25 ? melhor : null;
  }

  var CABECALHO = /^(treino|dia|ficha|semana|parte)\s*[a-z0-9]{0,3}\b|^[a-f]\s*[-:–)]|^(segunda|terca|quarta|quinta|sexta|sabado|domingo)\b|^(full ?body|superior|inferior|upper|lower|push|pull|legs?)\b/;

  // "4x10", "4 x 8-12", "4 series de 10", "3 x falha"
  function seriesReps(linha) {
    var l = normal(linha).replace(/(\d)\s*[x×]\s*(\d|falha)/g, '$1 x $2');
    var m = l.match(/(\d{1,2})\s*x\s*(\d{1,2}(?:\s*(?:a|-|ate)\s*\d{1,2})?|falha)/);
    if (m) return { series: parseInt(m[1], 10), reps: m[2].replace(/(\d)\s*(?:a|-|ate)\s*(\d)/, '$1-$2').replace(/\s/g, '') };
    m = l.match(/(\d{1,2})\s*(series|serie|sets?)\b/);
    if (m) return { series: parseInt(m[1], 10), reps: '' };
    return null;
  }

  function ler(texto) {
    var dias = [], atual = null, naoReconhecidas = [];
    function novoDia(nome) { atual = { nome: nome, exercicios: [] }; dias.push(atual); }
    String(texto || '').split(/\r?\n/).forEach(function (bruta) {
      var linha = bruta.replace(/[|•·*_]+/g, ' ').trim();
      if (normal(linha).length < 3) return;
      var n = normal(linha), sr = seriesReps(linha), ex = reconhecer(linha);
      if (CABECALHO.test(n) && !sr) {
        var nome = linha.replace(/\s+/g, ' ').replace(/^[-–:]+|[-–:]+$/g, '').trim();
        novoDia(nome.length > 40 ? nome.slice(0, 40) : nome);
        return;
      }
      // "segunda: supino reto 4x8" → novo treino "Segunda" e o exercício na mesma linha.
      var dia = linha.match(/^\s*((?:treino|dia)\s*[A-Za-z0-9]{1,2}|segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo)\s*[-–:]\s*(.+)$/i);
      if (dia && (ex || sr)) {
        novoDia(dia[1].charAt(0).toUpperCase() + dia[1].slice(1));
        linha = dia[2];
      }
      if (!ex && !sr) return;
      if (!atual) novoDia('Treino A');
      if (ex) {
        atual.exercicios.push({ nome: ex[0], escrito: linha, grupo: ex[1], tipo: ex[2], series: sr ? sr.series : 3, reps: sr ? sr.reps : '' });
      } else {
        atual.exercicios.push({ nome: linha.replace(/\d+\s*[x×].*$/i, '').trim() || linha, escrito: linha, grupo: '', tipo: 'B', series: sr.series, reps: sr.reps });
        naoReconhecidas.push(linha);
      }
    });
    dias = dias.filter(function (d) { return d.exercicios.length; });
    dias.forEach(function (d, i) { if (!d.nome) d.nome = 'Treino ' + String.fromCharCode(65 + i); });
    return { dias: dias, naoReconhecidas: naoReconhecidas };
  }

  return { ler: ler, reconhecer: reconhecer, BANCO: BANCO, normal: normal };
})();
