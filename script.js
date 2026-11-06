// ESTADO DO JOGO E REGRAS
let vidas = 8;
const MAX_VIDAS = 8;
let pontuacao = 0;
let respostaCorreta = 0;
let jogoAtivo = false;
let bloqueado = false;

// SINTETIZADOR DE VOZ (Web Speech API em Português)
function falar(texto) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(texto);
    msg.lang = 'pt-BR';
    msg.rate = 1.05;
    window.speechSynthesis.speak(msg);
  }
}

// AJUSTAR ALTURA DA CÂMERA (VR / 3D)
function ajustarAltura(delta) {
  const rig = document.getElementById('rig');
  if (!rig) return;
  let pos = rig.getAttribute('position');
  pos.y = Math.max(0.4, Math.min(5.5, pos.y + delta));
  rig.setAttribute('position', pos);
}

// CONTROLES DE NAVEGAÇÃO VIA TECLADO
window.addEventListener('keydown', (e) => {
  const rig = document.getElementById('rig');
  if (!rig) return;
  let pos = rig.getAttribute('position');
  
  switch(e.key) {
    case 'w': case 'W': pos.z -= 0.15; break;
    case 's': case 'S': pos.z += 0.15; break;
    case 'a': case 'A': pos.x -= 0.15; break;
    case 'd': case 'D': pos.x += 0.15; break;
    case 'e': case 'E': case ' ': case 'ArrowUp': 
      ajustarAltura(0.3); return;
    case 'q': case 'Q': case 'Shift': case 'ArrowDown': 
      ajustarAltura(-0.3); return;
  }
  rig.setAttribute('position', pos);
});

// INICIALIZAÇÃO DO JOGO
function iniciarJogo() {
  document.getElementById('overlay').style.display = 'none';
  vidas = 8;
  pontuacao = 0;
  jogoAtivo = true;
  atualizarVidasUI();
  falar("Jogo iniciado! Aponte para a resposta certa.");
  proximaPergunta();
}

// GERADOR DE OPERAÇÕES MATEMÁTICAS
function proximaPergunta() {
  if (vidas <= 0) return;
  bloqueado = false;

  // Reseta cor visual dos cartões 3D
  for (let i = 0; i < 4; i++) {
    const card = document.getElementById(`card-${i}`).querySelector('a-box');
    if (card) card.setAttribute('color', '#1e293b');
  }

  // Sorteio de operação (0: Soma, 1: Subtração, 2: Multiplicação, 3: Divisão)
  const op = Math.floor(Math.random() * 4);
  let n1, n2, opSimbolo;

  if (op === 0) { // Soma
    n1 = Math.floor(Math.random() * 20) + 1;
    n2 = Math.floor(Math.random() * 20) + 1;
    opSimbolo = "+";
    respostaCorreta = n1 + n2;
  } else if (op === 1) { // Subtração
    n1 = Math.floor(Math.random() * 25) + 5;
    n2 = Math.floor(Math.random() * n1) + 1;
    opSimbolo = "-";
    respostaCorreta = n1 - n2;
  } else if (op === 2) { // Multiplicação
    n1 = Math.floor(Math.random() * 10) + 1;
    n2 = Math.floor(Math.random() * 10) + 1;
    opSimbolo = "x";
    respostaCorreta = n1 * n2;
  } else { // Divisão Exata
    n2 = Math.floor(Math.random() * 9) + 1;
    respostaCorreta = Math.floor(Math.random() * 10) + 1;
    n1 = n2 * respostaCorreta;
    opSimbolo = "÷";
  }

  // Atualiza o painel principal com a conta
  document.getElementById('txt-pergunta').setAttribute('value', `${n1} ${opSimbolo} ${n2} = ?`);

  // Gerar 4 opções numéricas únicas
  let opcoes = [respostaCorreta];
  while (opcoes.length < 4) {
    let errada = respostaCorreta + (Math.floor(Math.random() * 12) - 6);
    if (errada >= 0 && !opcoes.includes(errada)) {
      opcoes.push(errada);
    }
  }

  // Embaralhar as respostas
  opcoes.sort(() => Math.random() - 0.5);

  // Inserir números nos cartões 3D
  for (let i = 0; i < 4; i++) {
    document.getElementById(`txt-op-${i}`).setAttribute('value', opcoes[i]);
    document.getElementById(`card-${i}`).dataset.valor = opcoes[i];
  }
}

// ATUALIZAÇÃO DA INTERFACE DE CORAÇÕES E PLACAR
function atualizarVidasUI() {
  let coracoesStr = "";
  for (let i = 0; i < MAX_VIDAS; i++) {
    coracoesStr += (i < vidas) ? "❤️ " : "🖤 ";
  }
  document.getElementById('txt-coracoes').setAttribute('value', coracoesStr.trim());
  document.getElementById('txt-vidas-num').setAttribute('value', `${vidas} / 8 Vidas`);
  document.getElementById('txt-score').setAttribute('value', `Pontos: ${pontuacao}`);
}

// VERIFICAÇÃO DA RESPOSTA SELECIONADA
function checarResposta(index) {
  if (!jogoAtivo || bloqueado) return;

  const card = document.getElementById(`card-${index}`);
  if (!card) return;
  const box = card.querySelector('a-box');
  const valorEscolha = parseInt(card.dataset.valor);

  bloqueado = true;

  if (valorEscolha === respostaCorreta) {
    // RESPOSTA CERTA (+1 Vida até o limite de 8, +10 pontos)
    box.setAttribute('color', '#10b981'); // Verde Neon
    pontuacao += 10;

    if (vidas < MAX_VIDAS) {
      vidas++;
      falar("Certo! Você acertou e ganhou uma vida!");
    } else {
      falar("Certo! Resposta correta!");
    }

    atualizarVidasUI();
    setTimeout(proximaPergunta, 1800);

  } else {
    // RESPOSTA ERRADA (-1 Vida)
    box.setAttribute('color', '#ef4444'); // Vermelho
    vidas--;
    atualizarVidasUI();

    if (vidas <= 0) {
      // GAME OVER (Perdeu todas as 8 vidas)
      jogoAtivo = false;
      falar("Errado! Fim de jogo, você perdeu todas as vidas!");
      document.getElementById('txt-pergunta').setAttribute('value', "GAME OVER!");
      
      setTimeout(() => {
        document.getElementById('overlay').style.display = 'flex';
      }, 3200);
    } else {
      falar("Errado! Você perdeu uma vida!");
      setTimeout(proximaPergunta, 1800);
    }
  }
}
