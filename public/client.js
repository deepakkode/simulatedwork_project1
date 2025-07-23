const socket = io();

const hero = document.getElementById("hero");
const gameArea = document.getElementById("gameArea");
const startButton = document.getElementById("startButton");
const submitBtn = document.getElementById("submit-btn");
const numberInput = document.getElementById("number");
const log = document.getElementById("log");
const playersBody = document.getElementById("players-body");
const timer = document.getElementById("timer");

startButton.onclick = () => {
  hero.classList.add("hidden");
  gameArea.classList.remove("hidden");
  socket.emit("joinGame"); // start first round
};

submitBtn.onclick = () => {
  const guess = parseInt(numberInput.value);
  if (guess >= 1 && guess <= 10) {
    socket.emit("guess", guess);
    numberInput.value = "";
    submitBtn.disabled = true;
  }
};

socket.on("roundStart", (data) => {
  log.innerHTML = `<p>🚦 Round ${data.round} started! Submit in 10s.</p>` + log.innerHTML;
  submitBtn.disabled = false;
  numberInput.disabled = false;

  let timeLeft = data.duration / 1000;
  timer.textContent = `⏳ ${timeLeft}s`;

  const interval = setInterval(() => {
    timeLeft--;
    timer.textContent = `⏳ ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(interval);
      submitBtn.disabled = true;
      numberInput.disabled = true;
    }
  }, 1000);
});

socket.on("roundResult", (data) => {
  const { guesses, scores, round } = data;
  let results = "<ul>";
  for (const id in guesses) {
    results += `<li>Player ${id.slice(0, 4)}: ${
      guesses[id] ?? "No Guess"
    }</li>`;
  }
  results += "</ul>";

  log.innerHTML = `<p>✅ Round ${round} ended:</p>${results}` + log.innerHTML;

  playersBody.innerHTML = "";
  let count = 1;
  for (const id in scores) {
    const row = document.createElement("tr");
    row.innerHTML = `<td>Player ${count}</td><td>${scores[id]}</td>`;
    playersBody.appendChild(row);
    count++;
  }
});

socket.on("tieBreakerStart", () => {
  log.innerHTML = `<p>⚔️ Tie-breaker started! Number range is 1–3 now!</p>` + log.innerHTML;
});

socket.on("gameOver", ({ scores }) => {
  log.innerHTML = `<p>🏆 Game Over! Final Scores:</p>` + log.innerHTML;
});
