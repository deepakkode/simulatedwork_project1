const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public')); // assuming your HTML, CSS, and JS are in /public

const PORT = process.env.PORT || 3000;

let players = [];
let secretNumber = Math.floor(Math.random() * 10) + 1;
let round = 1;
let scores = {};

io.on('connection', (socket) => {
  console.log(`New player connected: ${socket.id}`);
  players.push(socket.id);
  scores[socket.id] = 0;

  if (players.length < 2) {
    socket.emit('waitingForPlayers', '⚠️ Waiting for at least 2 players...');
  }

  socket.on('submitNumber', (num) => {
    console.log(`Player ${socket.id} guessed ${num}`);
    if (players.length < 2) {
      socket.emit('waitingForPlayers', '⚠️ Need at least 2 players to play!');
      return;
    }

    if (num === secretNumber) {
      scores[socket.id] += 1;
      io.emit('roundResult', {
        round,
        winnerMessage: `🎉 Player ${socket.id} won with number ${num}!`,
        scores
      });

      round++;
      secretNumber = Math.floor(Math.random() * 10) + 1;
    } else {
      socket.emit('roundResult', {
        round,
        winnerMessage: `❌ Wrong guess ${num}, try again!`,
        scores
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    players = players.filter(id => id !== socket.id);
    delete scores[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
