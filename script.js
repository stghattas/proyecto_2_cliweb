const setupForm = document.getElementById('setupForm');
const gameDiv = document.getElementById('game');
const loadingDiv = document.getElementById('loading');
const resultsDiv = document.getElementById('results');
const progressDiv = document.getElementById('progress');
const questionDiv = document.getElementById('question');
const optionsDiv = document.getElementById('options');
const timerDiv = document.getElementById('timer');
const scoreboardDiv = document.getElementById('scoreboard');

let playerName = "";
let totalQuestions = 5;
let questions = [];
let currentQuestion = 0;
let score = 0;
let correctAnswers = 0;
let timePerQuestion = [];
let timer;
let timeLeft = 20;
let savedConfig = null;

const errorDiv = document.getElementById('errorMessage');

setupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorDiv.style.display = 'none';
  errorDiv.textContent = '';

  playerName = document.getElementById('playerName').value.trim();
  totalQuestions = parseInt(document.getElementById('questionCount').value);
  const difficulty = document.getElementById('difficulty').value;
  const category = document.getElementById('category').value;
  savedConfig = {
    playerName,
    totalQuestions,
    difficulty,
    category
  };

  if (playerName.length < 2 || playerName.length > 20) {
    showError("El nombre debe tener entre 2 y 20 caracteres.");
    return;
  }

  if (isNaN(totalQuestions) || totalQuestions < 5 || totalQuestions > 20) {
    showError("La cantidad de preguntas debe estar entre 5 y 20.");
    return;
  }

  loadingDiv.classList.remove('hidden');
  setupForm.parentElement.classList.add('hidden');

  try {
    const url = `https://opentdb.com/api.php?amount=${totalQuestions}`
      + (category ? `&category=${category}` : "")
      + `&difficulty=${difficulty}&type=multiple`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.response_code !== 0) throw new Error("Sin preguntas válidas.");
    questions = data.results;
    startGame();
  } catch (err) {
    showError("Error al cargar preguntas: " + err.message);
    setupForm.parentElement.classList.remove('hidden');
  } finally {
    loadingDiv.classList.add('hidden');
  }
});

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}


function startGame() {
  currentQuestion = 0;
  score = 0;
  correctAnswers = 0;
  timePerQuestion = [];
  gameDiv.classList.remove('hidden');
  resultsDiv.classList.add('hidden');
  showQuestion();
}

function showQuestion() {
  if (currentQuestion >= questions.length) {
    return showResults();
  }

  const q = questions[currentQuestion];
  const options = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);

  progressDiv.innerHTML = `<span>Pregunta ${currentQuestion + 1} de ${totalQuestions}</span>`;
  questionDiv.innerHTML = decodeHTMLEntities(q.question);
  optionsDiv.innerHTML = "";
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.innerHTML = decodeHTMLEntities(option);
    btn.onclick = () => handleAnswer(option, q.correct_answer);
    optionsDiv.appendChild(btn);
  });

  startTimer();
  updateScoreboard();
}

function startTimer() {
  clearInterval(timer);
  timeLeft = 20;
  timerDiv.classList.remove('warning');
  timerDiv.textContent = `Tiempo restante: ${timeLeft}s`;

  timer = setInterval(() => {
    timeLeft--;
    timerDiv.textContent = `Tiempo restante: ${timeLeft}s`;
    if (timeLeft <= 5) {
      timerDiv.classList.add('warning');
    }
    if (timeLeft <= 0) {
      clearInterval(timer);
      timePerQuestion.push(20);
      currentQuestion++;
      showQuestion();
    }
  }, 1000);
}

function handleAnswer(selected, correct) {
  clearInterval(timer);
  const timeUsed = 20 - timeLeft;
  timePerQuestion.push(timeUsed);

  // Obtener todos los botones de opciones
  const optionButtons = optionsDiv.querySelectorAll('button');

  // Deshabilitar todos los botones para evitar mas clicks
  optionButtons.forEach(btn => btn.disabled = true);

  // Marcar colores
  optionButtons.forEach(btn => {
    const btnText = btn.innerHTML;
    if (btnText === decodeHTMLEntities(correct)) {
      btn.classList.add('correct'); // marca la correcta en verde
    }
  });

  // Si la seleccion es incorrecta, marca esa opcion en rojo
  if (selected !== correct) {
    optionButtons.forEach(btn => {
      if (btn.innerHTML === decodeHTMLEntities(selected)) {
        btn.classList.add('incorrect');
      }
    });
  } else {
    score += 10;
    correctAnswers++;
  }

  // Espera 2 segundos para mostrar el color y luego avanzar
  setTimeout(() => {
    currentQuestion++;
    showQuestion();
  }, 2000);
}


function updateScoreboard() {
  scoreboardDiv.innerHTML = `
    Puntuación: ${score} <br/>
    Correctas: ${correctAnswers}/${currentQuestion}
  `;
}

function showResults() {
  gameDiv.classList.add('hidden');
  resultsDiv.classList.remove('hidden');
  const avgTime = (timePerQuestion.reduce((a, b) => a + b, 0) / timePerQuestion.length).toFixed(2);
  const percent = ((correctAnswers / totalQuestions) * 100).toFixed(1);

  resultsDiv.innerHTML = `
    <h2>Resultados de ${playerName}</h2>
    <p>Puntuación total: ${score}</p>
    <p>Respuestas correctas: ${correctAnswers} de ${totalQuestions}</p>
    <p>Porcentaje de aciertos: ${percent}%</p>
    <p>Tiempo promedio por pregunta: ${avgTime}s</p>
    <button onclick="restartWithSameConfig()">Reiniciar con la misma configuración</button>
    <button onclick="resetGame()">Cambiar configuración</button>
    <button onclick="window.location.reload()">Finalizar</button>
  `;
}

function resetGame() {
  resultsDiv.classList.add('hidden');
  setupForm.parentElement.classList.remove('hidden');
}

function decodeHTMLEntities(str) {
  var txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

async function restartWithSameConfig() {
  if (!savedConfig) return;

  playerName = savedConfig.playerName;
  totalQuestions = savedConfig.totalQuestions;
  const difficulty = savedConfig.difficulty;
  const category = savedConfig.category;

  errorDiv.style.display = 'none';
  errorDiv.textContent = '';

  loadingDiv.classList.remove('hidden');
  setupForm.parentElement.classList.add('hidden');

  try {
    const url = `https://opentdb.com/api.php?amount=${totalQuestions}`
      + (category ? `&category=${category}` : "")
      + `&difficulty=${difficulty}&type=multiple`;

    const res = await fetch(url);
    const data = await res.json();
    if (data.response_code !== 0) throw new Error("Sin preguntas válidas.");
    questions = data.results;
    startGame();
  } catch (err) {
    showError("Error al cargar preguntas: " + err.message);
    setupForm.parentElement.classList.remove('hidden');
  } finally {
    loadingDiv.classList.add('hidden');
  }
}