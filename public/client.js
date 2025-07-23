const socket = io();

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  const hero = document.getElementById('hero');
  const gameArea = document.getElementById('gameArea');

  startButton.addEventListener('click', () => {
    hero.classList.add('hidden');
    gameArea.classList.remove('hidden');
  });

  window.submitNumber = function() {
    const num = parseInt(document.getElementById('numberInput').value);
    if (num >= 1 && num <= 10) {
      socket.emit('submitNumber', num);
      document.getElementById('numberInput').value = '';
    } else {
      alert('Pick a number between 1 and 10!');
    }
  };

  socket.on('roundResult', (data) => {
    const log = document.getElementById('log');
    log.innerHTML += `<p>Round ${data.round}: ${data.winnerMessage}</p>`;
    log.innerHTML += `<p>Scores: ${JSON.stringify(data.scores)}</p>`;
  });

  socket.on('gameOver', (data) => {
    const log = document.getElementById('log');
    log.innerHTML += `<h3>${data.finalMessage}</h3>`;
  });

  socket.on('waitingForPlayers', (msg) => {
    const log = document.getElementById('log');
    log.innerHTML += `<p>${msg}</p>`;
  });
});
