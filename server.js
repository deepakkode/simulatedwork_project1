const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};
let scores = {};
let guesses = {};
let round = 1;
let roundDuration = 10000; // 10 sec
let maxRounds = 5;
let inTieBreaker = false;

function startRound() {
  guesses = {};
  io.emit("roundStart", { round, duration: roundDuration });

  console.log(`Round ${round} started.`);

  setTimeout(() => {
    scoreRound();
    round++;

    // After all rounds, check for tie
    if (round > maxRounds && !inTieBreaker) {
      const topScore = Math.max(...Object.values(scores));
      const topPlayers = Object.entries(scores).filter(
        ([, s]) => s === topScore
      );
      if (topPlayers.length > 1) {
        console.log("Tie-breaker needed!");
        inTieBreaker = true;
        round = 1;
        roundDuration = 10000;
        io.emit("tieBreakerStart", {
          players: topPlayers.map(([id]) => id),
        });
        startRound();
      } else {
        io.emit("gameOver", { scores });
      }
    } else if (inTieBreaker) {
      // If in tie-breaker, keep running until only 1 left
      const topScore = Math.max(...Object.values(scores));
      const topPlayers = Object.entries(scores).filter(
        ([, s]) => s === topScore
      );
      if (topPlayers.length > 1) {
        console.log("Still tied! Continuing tie-breaker...");
        startRound();
      } else {
        io.emit("gameOver", { scores });
      }
    } else {
      startRound();
    }
  }, roundDuration);
}

function scoreRound() {
  for (const id in players) {
    if (!guesses[id]) guesses[id] = null;
  }

  // Count guesses
  const countMap = {};
  for (const id in guesses) {
    const guess = guesses[id];
    if (guess != null) {
      countMap[guess] = countMap[guess] || [];
      countMap[guess].push(id);
    }
  }

  const groups = Object.entries(countMap)
    .map(([num, ids]) => ({ num, ids, count: ids.length }))
    .sort((a, b) => a.count - b.count);

  // Check if all same guess
  if (groups.length === 1 && groups[0].count === Object.keys(players).length) {
    groups[0].ids.forEach((id) => {
      scores[id] = scores[id] || 0;
    });
  } else {
    let points = 10;
    let lastCount = -1;
    for (const group of groups) {
      if (group.count !== lastCount) {
        lastCount = group.count;
      }
      group.ids.forEach((id) => {
        scores[id] = (scores[id] || 0) + points;
      });
      points--;
    }
  }

  // Anyone who didn't guess gets 0 (no change needed)
  io.emit("roundResult", { guesses, scores, round });
}

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);
  players[socket.id] = socket.id;
  scores[socket.id] = 0;

  socket.on("guess", (number) => {
    guesses[socket.id] = number;
    console.log(`Player ${socket.id} guessed ${number}`);
  });

  socket.on("joinGame", () => {
    if (Object.keys(players).length === 1 && !inTieBreaker) {
      startRound();
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    delete scores[socket.id];
    delete guesses[socket.id];
    console.log(`Player disconnected: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log("✅ Server running: http://localhost:3000");
});
