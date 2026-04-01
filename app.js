const STORAGE_KEY = "mnemonic_lab_progress_v1";
const MEMORY_CARDS_KEY = "mnemonic_lab_memory_cards_v1";
const LEGACY_MEMORY_PROFILES_KEY = "memory-number-cards-by-login";
const LEGACY_MEMORY_CARDS_KEY = "memory-number-cards";

const defaults = {
  math: { attempts: 0, correct: 0, bestStreak: 0, streak: 0, bestTimeSec: null },
  numbers: { attempts: 0, correct: 0, bestLength: 0, streak: 0, bestTimeSec: null },
  words: { attempts: 0, correct: 0, bestCount: 0, streak: 0, bestTimeSec: null },
  schulte: { attempts: 0, correct: 0, bestStreak: 0, streak: 0, bestTimeSec: null, bestSize: 0 },
  sessions: [],
};

const state = {
  progress: loadProgress(),
  math: { answer: null, startedAt: null, timerId: null },
  numbers: {
    value: "",
    roundId: 0,
    running: false,
    startedAt: null,
    timerId: null,
    seriesActive: false,
    seriesIndex: 0,
    totalRounds: 6,
    digitsPerRound: 6,
    showSeconds: 3,
    allowedDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    correctInSeries: 0,
    awaitingAnswer: false,
    reviewRows: [],
  },
  words: {
    value: [],
    revealedCount: 0,
    targetCount: 20,
    revealSeconds: 3,
    running: false,
    phase: "idle",
    startedAt: null,
    timerId: null,
    revealTimerId: null,
  },
  attention: {
    fileName: "",
    imageUrl: "",
    file: null,
    timerId: null,
    hideTimerId: null,
    startedAt: null,
    timeLeft: 0,
    visible: false,
    notes: "",
    loadingDescription: false,
    comparing: false,
    randomLoading: false,
    sourceLabel: "",
    completed: false,
    descriptionReady: false,
    loadToken: 0,
  },
  schulte: {
    values: [],
    size: 5,
    nextValue: 1,
    startedAt: null,
    timerId: null,
    active: false,
  },
  exam: {
    active: false,
    startedAt: null,
    timerId: null,
    queue: [],
    currentIndex: -1,
    currentTask: null,
    phase: "idle",
    revealToken: 0,
    correctCount: 0,
    results: [],
  },
};

const wordPoolRuSimple = [
  "солнце", "ручка", "река", "книга", "кофе", "мост", "парус", "яблоко",
  "огонь", "дверь", "зебра", "океан", "память", "часы", "камень", "птица",
  "карандаш", "город", "весна", "снег", "груша", "чашка", "лес", "волна",
  "театр", "карта", "лист", "лампа", "ветер", "стакан", "музыка", "площадь",
  "хлеб", "свеча", "цветок", "дорога", "письмо", "звезда", "щит", "метро",
  "сыр", "космос", "клавиша", "фонарь", "озеро", "радуга", "сахар", "школа",
];
const wordPoolRuComplex = [
  "абстракция", "алгоритм", "архипелаг", "великолепие", "гипотеза", "гравитация",
  "диаграмма", "интеграция", "комбинаторика", "концентрация", "лаборатория",
  "метафора", "многоугольник", "наблюдательность", "непрерывность", "ориентация",
  "параллелепипед", "перспектива", "последовательность", "предположение",
  "противоречие", "равновесие", "рефлексия", "самоорганизация", "синхронизация",
  "стратегия", "трансформация", "треугольник", "уравновешенность", "ускорение",
  "фантазия", "характеристика", "целеустремленность", "цикличность", "эволюция",
  "эффективность", "эксперимент", "взаимосвязь", "симметрия", "композиция",
  "логистика", "продуктивность", "дисциплина", "мотивация", "сосредоточенность",
  "конфигурация", "кристаллизация", "классификация", "интерпретация", "унификация",
];
const wordPoolEnSimple = [
  "sun", "pen", "river", "book", "coffee", "bridge", "apple", "fire",
  "door", "ocean", "memory", "clock", "stone", "bird", "city", "spring",
  "snow", "cup", "forest", "wave", "map", "leaf", "lamp", "wind",
  "music", "flower", "road", "letter", "star", "shield", "metro", "lake",
  "rainbow", "sugar", "school", "bread", "candle", "planet", "window", "garden",
  "smile", "voice", "pencil", "table", "mountain", "cloud", "beach", "island",
];
const wordPoolEnComplex = [
  "abstraction", "algorithm", "archipelago", "hypothesis", "gravity", "diagram",
  "integration", "combinatorics", "concentration", "laboratory", "metaphor", "observer",
  "continuity", "orientation", "perspective", "sequence", "assumption", "contradiction",
  "equilibrium", "reflection", "synchronization", "strategy", "transformation", "triangle",
  "acceleration", "imagination", "characteristic", "consistency", "evolution", "efficiency",
  "experiment", "symmetry", "composition", "logistics", "productivity", "discipline",
  "motivation", "focus", "configuration", "crystallization", "classification", "interpretation",
  "unification", "adaptability", "optimization", "analysis", "innovation", "resilience",
];

const tabs = [...document.querySelectorAll(".tab-btn")];
const panels = {
  math: document.getElementById("math-panel"),
  "number-series": document.getElementById("number-series-panel"),
  numbers: document.getElementById("numbers-panel"),
  words: document.getElementById("words-panel"),
  attention: document.getElementById("attention-panel"),
  schulte: document.getElementById("schulte-panel"),
  exam: document.getElementById("exam-panel"),
  progress: document.getElementById("progress-panel"),
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const key = tab.dataset.tab;
    tabs.forEach((btn) => btn.classList.toggle("active", btn === tab));
    Object.entries(panels).forEach(([name, panel]) => {
      panel.classList.toggle("active", name === key);
    });
    if (key === "progress") renderProgress();
  });
});

const mathTaskEl = document.getElementById("math-task");
const mathForm = document.getElementById("math-form");
const mathAnswer = document.getElementById("math-answer");
const mathFeedback = document.getElementById("math-feedback");
const mathSubmitBtn = mathForm.querySelector('button[type="submit"]');
const mathTimerEl = document.getElementById("math-timer");
const mathBestTimeEl = document.getElementById("math-best-time");
const mathNumberSizeEl = document.getElementById("math-number-size");
const mathOperationEl = document.getElementById("math-operation");
const mathMulLimitWrap = document.getElementById("math-mul-limit-wrap");
const mathMulLimitEl = document.getElementById("math-mul-limit");
const mathNewBtn = document.getElementById("math-new");
const mathRandomBtn = document.getElementById("math-random");
const mathStopBtn = document.getElementById("math-stop");
mathNewBtn.addEventListener("click", generateMathTask);
mathRandomBtn.addEventListener("click", generateRandomMathTask);
mathStopBtn.addEventListener("click", stopMathExercise);
mathNumberSizeEl.addEventListener("change", updateMathControls);
mathOperationEl.addEventListener("change", updateMathControls);
mathAnswer.addEventListener("input", syncMathControls);

mathForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.math.answer === null) return;
  const value = Number((mathAnswer.value || "").trim());
  const correct = value === state.math.answer;
  const tookSec = stopMathTimer();
  applyModeResult("math", correct, { timeSec: tookSec });

  if (correct) {
    mathFeedback.textContent = "Верно!";
    mathFeedback.className = "feedback ok";
  } else {
    mathFeedback.textContent = `Ошибка. Правильный ответ: ${state.math.answer}`;
    mathFeedback.className = "feedback bad";
  }
  mathForm.reset();
  state.math.answer = null;
  setMathTaskPlaceholder("Нажми «Новый пример»");
  syncMathControls();
});

function getMathTaskConfig() {
  const numberSize = mathNumberSizeEl.value;
  const operation = mathOperationEl.value;
  let bounds = numberSize === "two" ? { min: 10, max: 99 } : { min: 1, max: 9 };

  if (numberSize === "two") {
    bounds = { min: 10, max: Number(mathMulLimitEl.value) || 20 };
  }

  return { numberSize, operation, bounds };
}

function buildMathTask(config = getMathTaskConfig()) {
  let a = randomInt(config.bounds.min, config.bounds.max);
  let b = randomInt(config.bounds.min, config.bounds.max);
  const op = config.operation === "sub" ? "-" : config.operation === "mul" ? "*" : "+";
  if (op === "-" && b > a) [a, b] = [b, a];

  const expression = `${a} ${op} ${b}`;
  let answer = 0;
  if (op === "+") answer = a + b;
  if (op === "-") answer = a - b;
  if (op === "*") answer = a * b;

  return { kind: "math", expression, answer };
}

function generateMathTask() {
  stopMathTimer();
  const task = buildMathTask();
  state.math.answer = task.answer;
  startMathTimer();
  mathTaskEl.textContent = task.expression;
  mathTaskEl.classList.remove("challenge-hint");
  mathFeedback.textContent = "";
  mathAnswer.focus();
  syncMathControls();
}

function generateRandomMathTask() {
  const numberSizes = ["one", "two"];
  const operations = ["add", "sub", "mul"];
  const mulLimits = [...mathMulLimitEl.options].map((option) => option.value);

  mathNumberSizeEl.value = numberSizes[randomInt(0, numberSizes.length - 1)];
  mathOperationEl.value = operations[randomInt(0, operations.length - 1)];
  mathMulLimitEl.value = mulLimits[randomInt(0, mulLimits.length - 1)];
  updateMathControls();
  generateMathTask();
}

function updateMathControls() {
  const showRange = mathNumberSizeEl.value === "two";
  mathMulLimitWrap.hidden = !showRange;
}

function startMathTimer() {
  state.math.startedAt = Date.now();
  mathTimerEl.textContent = "Таймер: 0.0с";
  if (state.math.timerId) clearInterval(state.math.timerId);
  state.math.timerId = setInterval(() => {
    if (!state.math.startedAt) return;
    const elapsedSec = (Date.now() - state.math.startedAt) / 1000;
    mathTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  }, 100);
}

function stopMathTimer() {
  if (state.math.timerId) {
    clearInterval(state.math.timerId);
    state.math.timerId = null;
  }
  if (!state.math.startedAt) return 0;
  const elapsedSec = (Date.now() - state.math.startedAt) / 1000;
  state.math.startedAt = null;
  mathTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  return elapsedSec;
}

function stopMathExercise() {
  const hadActive = state.math.answer !== null || Boolean(state.math.startedAt);
  stopMathTimer();
  state.math.answer = null;
  setMathTaskPlaceholder("Нажми «Новый пример»");
  mathForm.reset();
  if (hadActive) {
    mathFeedback.textContent = "Упражнение остановлено.";
    mathFeedback.className = "feedback";
  }
  syncMathControls();
}

function syncMathControls() {
  const hasActiveTask = state.math.answer !== null;
  mathNewBtn.disabled = hasActiveTask;
  mathRandomBtn.disabled = hasActiveTask;
  mathSubmitBtn.disabled = state.math.answer === null || !mathAnswer.value.trim();
  mathStopBtn.disabled = state.math.answer === null && !state.math.startedAt;
  mathAnswer.disabled = state.math.answer === null;
}

function setMathTaskPlaceholder(text) {
  mathTaskEl.textContent = text;
  mathTaskEl.classList.add("challenge-hint");
}

const numTaskEl = document.getElementById("num-task");
const numForm = document.getElementById("num-form");
const numFeedback = document.getElementById("num-feedback");
const numAnswer = document.getElementById("num-answer");
const numSubmitBtn = numForm.querySelector('button[type="submit"]');
const numTotalRoundsEl = document.getElementById("num-total-rounds");
const numDigitPoolEl = document.getElementById("num-digit-pool");
const numDigitsCountEl = document.getElementById("num-digits-count");
const numShowSecondsEl = document.getElementById("num-show-seconds");
const numSeriesProgressEl = document.getElementById("num-series-progress");
const numTimerEl = document.getElementById("num-timer");
const numBestTimeEl = document.getElementById("num-best-time");
const numReviewEl = document.getElementById("num-review");
const numStartBtn = document.getElementById("num-start");
const numRandomBtn = document.getElementById("num-random");
const numNextBtn = document.getElementById("num-next");
const numStopBtn = document.getElementById("num-stop");
numStartBtn.addEventListener("click", startNumberSeries);
numRandomBtn.addEventListener("click", startRandomNumberSeries);
numNextBtn.addEventListener("click", runNextNumberRound);
numStopBtn.addEventListener("click", stopNumberExercise);
numAnswer.addEventListener("input", syncNumberControls);
numTotalRoundsEl.addEventListener("change", () => {
  state.numbers.totalRounds = Number(numTotalRoundsEl.value) || 6;
  if (!state.numbers.seriesActive) {
    numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
  }
});

numForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.numbers.seriesActive || !state.numbers.awaitingAnswer || !state.numbers.value) return;
  const cleanInput = (numAnswer.value || "").replace(/\D/g, "");
  const expectedValue = state.numbers.value;
  const correct = cleanInput === expectedValue;
  if (correct) state.numbers.correctInSeries += 1;
  state.numbers.reviewRows.push({
    index: state.numbers.seriesIndex,
    expected: expectedValue,
    actual: cleanInput,
    correct,
  });

  numFeedback.textContent = "";
  numFeedback.className = "feedback";
  numReviewEl.hidden = true;
  numReviewEl.innerHTML = "";

  state.numbers.awaitingAnswer = false;
  state.numbers.value = "";
  numForm.reset();
  syncNumberControls();
  if (state.numbers.seriesIndex >= state.numbers.totalRounds) {
    finishNumberSeries();
    return;
  }
  runNextNumberRound();
});

function startNumberSeries() {
  stopNumberTimer();
  numTimerEl.textContent = "Таймер: 0.0с";
  state.numbers.totalRounds = Number(numTotalRoundsEl.value) || 6;
  state.numbers.digitsPerRound = Number(numDigitsCountEl.value) || 6;
  state.numbers.showSeconds = Number(numShowSecondsEl.value) || 3;
  let hadEmptyPool = false;
  state.numbers.allowedDigits = getSelectedNumberDigits();
  if (!state.numbers.allowedDigits.length) {
    hadEmptyPool = true;
    state.numbers.allowedDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    [...numDigitPoolEl.querySelectorAll('input[type="checkbox"]')].forEach((el) => {
      el.checked = true;
    });
    numFeedback.textContent = "Все цифры были сняты, поэтому включены 0-9.";
    numFeedback.className = "feedback bad";
  }
  state.numbers.seriesActive = true;
  state.numbers.seriesIndex = 0;
  state.numbers.correctInSeries = 0;
  state.numbers.awaitingAnswer = false;
  state.numbers.value = "";
  state.numbers.reviewRows = [];
  numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
  numStartBtn.disabled = true;
  numNextBtn.disabled = true;
  numNextBtn.hidden = true;
  numReviewEl.hidden = true;
  numReviewEl.innerHTML = "";
  if (!hadEmptyPool) numFeedback.textContent = "";
  numTaskEl.textContent = "Подготовься, начнется первый ряд";
  numTaskEl.classList.add("challenge-hint");
  startNumberTimer();
  runNextNumberRound();
  syncNumberControls();
}

function startRandomNumberSeries() {
  const totalRoundsOptions = [...numTotalRoundsEl.options].map((option) => option.value);
  const digitsCountOptions = [...numDigitsCountEl.options].map((option) => option.value);
  const showSecondsOptions = [...numShowSecondsEl.options].map((option) => option.value);
  const digitCheckboxes = [...numDigitPoolEl.querySelectorAll('input[type="checkbox"]')];
  const targetDigitCount = randomInt(2, digitCheckboxes.length);
  const digitIndexes = shuffle(Array.from({ length: digitCheckboxes.length }, (_, index) => index))
    .slice(0, targetDigitCount);

  numTotalRoundsEl.value = totalRoundsOptions[randomInt(0, totalRoundsOptions.length - 1)];
  numDigitsCountEl.value = digitsCountOptions[randomInt(0, digitsCountOptions.length - 1)];
  numShowSecondsEl.value = showSecondsOptions[randomInt(0, showSecondsOptions.length - 1)];

  digitCheckboxes.forEach((checkbox, index) => {
    checkbox.checked = digitIndexes.includes(index);
  });

  state.numbers.totalRounds = Number(numTotalRoundsEl.value) || 6;
  numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
  startNumberSeries();
}

async function runNextNumberRound() {
  if (!state.numbers.seriesActive || state.numbers.awaitingAnswer) return;
  if (state.numbers.seriesIndex >= state.numbers.totalRounds) {
    finishNumberSeries();
    return;
  }

  state.numbers.seriesIndex += 1;
  const value = generateDigits(state.numbers.digitsPerRound, state.numbers.allowedDigits);
  state.numbers.value = value;
  numSeriesProgressEl.textContent = `Ряд: ${state.numbers.seriesIndex}/${state.numbers.totalRounds}`;
  numNextBtn.disabled = true;
  numAnswer.value = "";

  for (let i = state.numbers.showSeconds; i > 0; i -= 1) {
    if (!state.numbers.seriesActive) return;
    numTaskEl.textContent = `${value}  •  ${i}`;
    numTaskEl.classList.remove("challenge-hint");
    numTaskEl.classList.add("mono");
    await sleep(1000);
  }
  if (!state.numbers.seriesActive) return;
  numTaskEl.textContent = `Введи ${formatOrdinalRow(state.numbers.seriesIndex)} ряд`;
  numTaskEl.classList.add("challenge-hint");
  numTaskEl.classList.remove("mono");
  state.numbers.awaitingAnswer = true;
  numAnswer.focus();
  syncNumberControls();
}

function startNumberTimer() {
  state.numbers.startedAt = Date.now();
  numTimerEl.textContent = "Таймер: 0.0с";
  if (state.numbers.timerId) clearInterval(state.numbers.timerId);
  state.numbers.timerId = setInterval(() => {
    if (!state.numbers.startedAt) return;
    const elapsedSec = (Date.now() - state.numbers.startedAt) / 1000;
    numTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  }, 100);
}

function stopNumberTimer() {
  if (state.numbers.timerId) {
    clearInterval(state.numbers.timerId);
    state.numbers.timerId = null;
  }
  if (!state.numbers.startedAt) return 0;
  const elapsedSec = (Date.now() - state.numbers.startedAt) / 1000;
  state.numbers.startedAt = null;
  numTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  return elapsedSec;
}

function finishNumberSeries() {
  const tookSec = stopNumberTimer();
  const success = state.numbers.correctInSeries === state.numbers.totalRounds;
  applyModeResult("numbers", success, {
    span: state.numbers.correctInSeries,
    timeSec: tookSec,
  });

  numFeedback.textContent =
    `Серия завершена: ${state.numbers.correctInSeries}/${state.numbers.totalRounds}`;
  numFeedback.className = success ? "feedback ok" : "feedback bad";
  renderNumberReview(state.numbers.reviewRows);
  state.numbers.seriesActive = false;
  state.numbers.awaitingAnswer = false;
  state.numbers.value = "";
  setNumberTaskPlaceholder("Нажми «Новый пример»");
  numStartBtn.disabled = false;
  numNextBtn.disabled = true;
  numNextBtn.hidden = true;
  syncNumberControls();
}

function stopNumberExercise() {
  const hadActive = state.numbers.seriesActive || Boolean(state.numbers.startedAt);
  stopNumberTimer();
  numTimerEl.textContent = "Таймер: 0.0с";
  state.numbers.seriesActive = false;
  state.numbers.awaitingAnswer = false;
  state.numbers.value = "";
  state.numbers.seriesIndex = 0;
  state.numbers.correctInSeries = 0;
  state.numbers.reviewRows = [];
  state.numbers.totalRounds = Number(numTotalRoundsEl.value) || 6;
  numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
  setNumberTaskPlaceholder("Нажми «Новый пример»");
  numStartBtn.disabled = false;
  numNextBtn.disabled = true;
  numNextBtn.hidden = true;
  numForm.reset();
  numReviewEl.hidden = true;
  numReviewEl.innerHTML = "";
  if (hadActive) {
    numFeedback.textContent = "Упражнение остановлено.";
    numFeedback.className = "feedback";
  }
  syncNumberControls();
}

function renderNumberReview(reviewRows) {
  const rows = [];
  for (const row of reviewRows) {
    const actual = row.actual || "Пропуск";
    rows.push(`
      <div class="num-review-row ${row.correct ? "is-ok" : "is-bad"}">
        <div class="num-review-row-title">Ряд ${row.index}</div>
        <div class="num-review-columns">
          <div class="num-review-col">
            <span class="num-review-label">Правильно</span>
            <span class="num-chip expected">${row.expected}</span>
          </div>
          <div class="num-review-col">
            <span class="num-review-label">Твой ответ</span>
            <span class="num-chip actual ${row.correct ? "ok" : "bad"}">${actual}</span>
          </div>
        </div>
      </div>
    `);
  }

  numReviewEl.innerHTML = `
    <div class="num-review-head">
      <strong>Разбор серии</strong>
    </div>
    <div class="num-review-grid">${rows.join("")}</div>
  `;
  numReviewEl.hidden = false;
}

function syncNumberControls() {
  numStartBtn.disabled = state.numbers.seriesActive;
  numRandomBtn.disabled = state.numbers.seriesActive;
  numSubmitBtn.disabled =
    !state.numbers.seriesActive || !state.numbers.awaitingAnswer || !state.numbers.value || !numAnswer.value.trim();
  numStopBtn.disabled = !state.numbers.seriesActive && !state.numbers.startedAt;
  numAnswer.disabled = !state.numbers.seriesActive || !state.numbers.awaitingAnswer || !state.numbers.value;
}

function setNumberTaskPlaceholder(text) {
  numTaskEl.textContent = text;
  numTaskEl.classList.add("challenge-hint");
  numTaskEl.classList.remove("mono");
}

function formatOrdinalRow(index) {
  const mod10 = index % 10;
  const mod100 = index % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${index}-й`;
  if (mod10 === 1) return `${index}-й`;
  if (mod10 >= 2 && mod10 <= 4) return `${index}-й`;
  return `${index}-й`;
}

function getNumberSeriesTaskConfig() {
  const selectedDigits = getSelectedNumberDigits();
  return {
    digitsPerRound: Number(numDigitsCountEl.value) || 6,
    showSeconds: Number(numShowSecondsEl.value) || 3,
    allowedDigits: selectedDigits.length ? selectedDigits : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  };
}

function buildNumberSeriesTask(config = getNumberSeriesTaskConfig()) {
  return {
    kind: "numbers",
    value: generateDigits(config.digitsPerRound, config.allowedDigits),
    showSeconds: config.showSeconds,
  };
}

const examTaskEl = document.getElementById("exam-task");
const examForm = document.getElementById("exam-form");
const examAnswer = document.getElementById("exam-answer");
const examFeedback = document.getElementById("exam-feedback");
const examSummaryEl = document.getElementById("exam-summary");
const examSubmitBtn = examForm.querySelector('button[type="submit"]');
const examStartBtn = document.getElementById("exam-start");
const examStopBtn = document.getElementById("exam-stop");
const examProgressEl = document.getElementById("exam-progress");
const examTimerEl = document.getElementById("exam-timer");

examStartBtn.addEventListener("click", startExam);
examStopBtn.addEventListener("click", stopExamExercise);
examAnswer.addEventListener("input", syncExamControls);

examForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.exam.active || state.exam.phase !== "answering" || !state.exam.currentTask) return;

  const task = state.exam.currentTask;
  const rawValue = (examAnswer.value || "").trim();
  let correct = false;
  let expected = "";

  if (task.kind === "math") {
    correct = Number(rawValue) === task.answer;
    expected = String(task.answer);
  } else {
    const cleanInput = rawValue.replace(/\D/g, "");
    correct = cleanInput === task.value;
    expected = task.value;
  }

  state.exam.results.push({ kind: task.kind, correct });
  if (correct) state.exam.correctCount += 1;

  examFeedback.textContent = correct ? "Верно!" : `Ошибка. Правильный ответ: ${expected}`;
  examFeedback.className = correct ? "feedback ok" : "feedback bad";
  examForm.reset();
  state.exam.phase = "transition";
  updateExamStats();
  syncExamControls();

  await sleep(800);
  if (!state.exam.active || state.exam.currentTask !== task) return;
  runNextExamTask();
});

function buildExamQueue() {
  const mathConfig = getMathTaskConfig();
  const numberConfig = getNumberSeriesTaskConfig();
  return shuffle([
    buildMathTask(mathConfig),
    buildMathTask(mathConfig),
    buildMathTask(mathConfig),
    buildNumberSeriesTask(numberConfig),
    buildNumberSeriesTask(numberConfig),
  ]);
}

function startExam() {
  stopExamTimer();
  state.exam.queue = buildExamQueue();
  state.exam.active = true;
  state.exam.currentIndex = -1;
  state.exam.currentTask = null;
  state.exam.phase = "idle";
  state.exam.revealToken += 1;
  state.exam.correctCount = 0;
  state.exam.results = [];
  examSummaryEl.hidden = true;
  examSummaryEl.innerHTML = "";
  examFeedback.textContent = "";
  examFeedback.className = "feedback";
  examForm.reset();
  examTimerEl.textContent = "Таймер: 0.0с";
  startExamTimer();
  updateExamStats();
  syncExamControls();
  runNextExamTask();
}

function runNextExamTask() {
  state.exam.revealToken += 1;
  state.exam.currentIndex += 1;

  if (state.exam.currentIndex >= state.exam.queue.length) {
    finishExam();
    return;
  }

  const task = state.exam.queue[state.exam.currentIndex];
  state.exam.currentTask = task;
  state.exam.phase = task.kind === "math" ? "answering" : "showing";
  examFeedback.textContent = "";
  examFeedback.className = "feedback";
  examForm.reset();
  examSummaryEl.hidden = true;
  updateExamStats();

  if (task.kind === "math") {
    presentExamMathTask(task);
  } else {
    presentExamNumberTask(task);
  }

  syncExamControls();
}

function presentExamMathTask(task) {
  examTaskEl.textContent = task.expression;
  examTaskEl.classList.remove("challenge-hint", "mono");
  examAnswer.focus();
}

async function presentExamNumberTask(task) {
  const revealToken = state.exam.revealToken;
  examTaskEl.classList.remove("challenge-hint");
  examTaskEl.classList.add("mono");
  syncExamControls();

  for (let secondsLeft = task.showSeconds; secondsLeft > 0; secondsLeft -= 1) {
    if (!state.exam.active || state.exam.currentTask !== task || state.exam.revealToken !== revealToken) return;
    examTaskEl.textContent = `${task.value}  •  ${secondsLeft}`;
    await sleep(1000);
  }

  if (!state.exam.active || state.exam.currentTask !== task || state.exam.revealToken !== revealToken) return;
  state.exam.phase = "answering";
  examTaskEl.textContent = "Введи показанный ряд";
  examTaskEl.classList.add("challenge-hint");
  examTaskEl.classList.remove("mono");
  examAnswer.focus();
  syncExamControls();
}

function startExamTimer() {
  state.exam.startedAt = Date.now();
  examTimerEl.textContent = "Таймер: 0.0с";
  if (state.exam.timerId) clearInterval(state.exam.timerId);
  state.exam.timerId = setInterval(() => {
    if (!state.exam.startedAt) return;
    const elapsedSec = (Date.now() - state.exam.startedAt) / 1000;
    examTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  }, 100);
}

function stopExamTimer() {
  if (state.exam.timerId) {
    clearInterval(state.exam.timerId);
    state.exam.timerId = null;
  }
  if (!state.exam.startedAt) return 0;
  const elapsedSec = (Date.now() - state.exam.startedAt) / 1000;
  state.exam.startedAt = null;
  examTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  return elapsedSec;
}

function finishExam() {
  const tookSec = stopExamTimer();
  const mathCorrect = state.exam.results.filter((entry) => entry.kind === "math" && entry.correct).length;
  const numberCorrect = state.exam.results.filter((entry) => entry.kind === "numbers" && entry.correct).length;

  state.exam.active = false;
  state.exam.currentTask = null;
  state.exam.phase = "done";
  examTaskEl.textContent = "Экзамен завершен";
  examTaskEl.classList.add("challenge-hint");
  examTaskEl.classList.remove("mono");
  examSummaryEl.innerHTML = `
    <strong>Итог: ${state.exam.correctCount}/5</strong><br />
    Счет в уме: ${mathCorrect}/3<br />
    Числовой ряд: ${numberCorrect}/2<br />
    Время: ${tookSec.toFixed(1)}с
  `;
  examSummaryEl.hidden = false;
  examFeedback.textContent = "Экзамен завершен.";
  examFeedback.className = "feedback ok";
  updateExamStats();
  syncExamControls();
}

function stopExamExercise(options = {}) {
  const { silent = false } = options;
  const hadActive = state.exam.active || Boolean(state.exam.startedAt);
  state.exam.revealToken += 1;
  stopExamTimer();
  state.exam.active = false;
  state.exam.queue = [];
  state.exam.currentIndex = -1;
  state.exam.currentTask = null;
  state.exam.phase = "idle";
  state.exam.correctCount = 0;
  state.exam.results = [];
  examForm.reset();
  examSummaryEl.hidden = true;
  examSummaryEl.innerHTML = "";
  examFeedback.textContent = "";
  examFeedback.className = "feedback";
  setExamTaskPlaceholder("Нажми «Начать экзамен»");
  if (hadActive && !silent) {
    examFeedback.textContent = "Экзамен остановлен.";
    examFeedback.className = "feedback";
  }
  updateExamStats();
  syncExamControls();
}

function updateExamStats() {
  const totalTasks = state.exam.queue.length || 5;
  const currentTaskNumber = state.exam.currentTask
    ? state.exam.currentIndex + 1
    : state.exam.phase === "done"
      ? totalTasks
      : 0;
  examProgressEl.textContent = `Задание: ${currentTaskNumber}/${totalTasks}`;
}

function syncExamControls() {
  const readyForAnswer =
    state.exam.active
    && state.exam.phase === "answering"
    && Boolean(state.exam.currentTask);
  examStartBtn.disabled = state.exam.active;
  examSubmitBtn.disabled = !readyForAnswer || !examAnswer.value.trim();
  examStopBtn.disabled = !state.exam.active && !state.exam.startedAt;
  examAnswer.disabled = !readyForAnswer;

  if (!state.exam.active && state.exam.phase !== "done") {
    examAnswer.placeholder = "Ответ появится после старта";
  } else if (state.exam.phase === "done") {
    examAnswer.placeholder = "Экзамен завершен, можно начать заново";
  } else if (!readyForAnswer) {
    examAnswer.placeholder = "Подожди, идет показ задания";
  } else if (state.exam.currentTask?.kind === "math") {
    examAnswer.placeholder = "Введи ответ";
  } else {
    examAnswer.placeholder = "Введи показанный ряд";
  }
}

function setExamTaskPlaceholder(text) {
  examTaskEl.textContent = text;
  examTaskEl.classList.add("challenge-hint");
  examTaskEl.classList.remove("mono");
}

const memoryCardForm = document.getElementById("memory-card-form");
const memoryImageInput = document.getElementById("memory-image-input");
const memoryNumberInput = document.getElementById("memory-number-input");
const memoryText1Input = document.getElementById("memory-text1-input");
const memoryText2Input = document.getElementById("memory-text2-input");
const memoryText3Input = document.getElementById("memory-text3-input");
const memorySubmitBtn = document.getElementById("memory-submit-btn");
const memoryClearAllBtn = document.getElementById("memory-clear-all-btn");
const memoryEditBanner = document.getElementById("memory-edit-banner");
const memoryCancelEditBtn = document.getElementById("memory-cancel-edit");
const memoryCardCountEl = document.getElementById("memory-card-count");
const memoryCardGrid = document.getElementById("memory-card-grid");
const memoryEmptyState = document.getElementById("memory-empty-state");
const memoryCardFilter = document.getElementById("memory-card-filter");
const memoryCardTemplate = document.getElementById("memory-card-template");
const memoryAnswerTemplate = document.getElementById("memory-answer-template");
const memoryRowCountSelect = document.getElementById("memory-row-count-select");
const memoryTrainerProgress = document.getElementById("memory-trainer-progress");
const memoryRandomRows = document.getElementById("memory-random-rows");
const memoryRandomBtn = document.getElementById("memory-random-btn");
const memoryNextRowBtn = document.getElementById("memory-next-row-btn");
const memoryToggleAnswerBtn = document.getElementById("memory-toggle-answer-btn");
const memoryCheckInput = document.getElementById("memory-check-input");
const memoryCheckBtn = document.getElementById("memory-check-btn");
const memoryShowAssociationsBtn = document.getElementById("memory-show-associations-btn");
const memoryRestartBtn = document.getElementById("memory-restart-btn");
const memoryCheckResult = document.getElementById("memory-check-result");
const memoryAnswerCards = document.getElementById("memory-answer-cards");

const memoryState = {
  cards: loadMemoryCards(),
  filterNumber: "all",
  currentCards: [],
  editingCardId: null,
  currentRowIndex: 0,
  currentRowCount: Number(memoryRowCountSelect.value) || 1,
  isChecking: false,
};

memoryNumberInput.addEventListener("input", () => {
  memoryNumberInput.value = memoryNumberInput.value.replace(/\D/g, "").slice(0, 2);
});

memoryCardForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = memoryImageInput.files?.[0];
  if (!file && !memoryState.editingCardId) {
    window.alert("Добавьте фото для новой ассоциации.");
    return;
  }

  const imageDataUrl = file ? await fileToDataUrl(file) : null;
  const baseCard = memoryState.editingCardId
    ? memoryState.cards.find((card) => card.id === memoryState.editingCardId)
    : null;

  const card = {
    id: memoryState.editingCardId ?? crypto.randomUUID(),
    number: memoryNumberInput.value.trim().padStart(2, "0"),
    texts: [
      memoryText1Input.value.trim(),
      memoryText2Input.value.trim(),
      memoryText3Input.value.trim(),
    ],
    image: imageDataUrl ?? baseCard?.image ?? "",
    createdAt: baseCard?.createdAt ?? Date.now(),
  };

  if (card.number.length !== 2) {
    window.alert("Введите двузначное число.");
    return;
  }

  if (card.texts.some((text) => !text)) {
    window.alert("Заполните персонажа, действие и предмет.");
    return;
  }

  if (memoryState.editingCardId) {
    memoryState.cards = memoryState.cards.map((savedCard) => (
      savedCard.id === memoryState.editingCardId ? card : savedCard
    ));
  } else {
    memoryState.cards.unshift(card);
  }

  memoryExitEditMode();
  saveMemoryCards();
  memoryCardForm.reset();
  memoryRender();
});

memoryCancelEditBtn.addEventListener("click", () => {
  memoryExitEditMode();
  memoryCardForm.reset();
});

memoryClearAllBtn.addEventListener("click", () => {
  if (!memoryState.cards.length) return;
  if (!window.confirm("Удалить все ассоциации?")) return;

  memoryState.cards = [];
  memoryState.currentCards = [];
  memoryState.currentRowIndex = 0;
  memoryExitEditMode();
  memoryCardForm.reset();
  memoryResetTrainerState();
  saveMemoryCards();
  memoryRender();
});

memoryRandomBtn.addEventListener("click", () => {
  if (!memoryState.cards.length) {
    window.alert("Сначала добавьте хотя бы одну ассоциацию.");
    return;
  }

  memoryState.currentRowCount = Number(memoryRowCountSelect.value) || 1;
  memoryState.currentCards = memoryGetRandomCards(memoryState.currentRowCount * 3);
  memoryState.currentRowIndex = 0;
  memoryRenderRandomNumbers();
  memoryResetTrainerState();
});

memoryNextRowBtn.addEventListener("click", () => {
  if (!memoryState.currentCards.length) {
    window.alert("Сначала нажмите «Начать запоминание».");
    return;
  }

  const totalRows = Math.ceil(memoryState.currentCards.length / 3);
  if (memoryState.currentRowIndex >= totalRows - 1) return;

  memoryState.currentRowIndex += 1;
  memoryRenderRandomNumbers();
  memoryResetTrainerState();
});

memoryToggleAnswerBtn.addEventListener("click", () => {
  if (!memoryState.currentCards.length) {
    window.alert("Сначала нажмите «Начать запоминание».");
    return;
  }

  if (!memoryState.isChecking) {
    memoryState.isChecking = true;
    memoryRandomRows.classList.add("hidden");
    memoryTrainerProgress.classList.add("hidden");
    memoryNextRowBtn.classList.add("hidden");
    memoryToggleAnswerBtn.textContent = "Показать числа";
  } else {
    memoryState.isChecking = false;
    memoryRandomRows.classList.remove("hidden");
    memoryTrainerProgress.classList.remove("hidden");
    memoryRenderRandomNumbers();
    memoryToggleAnswerBtn.textContent = "Готов";
  }
});

memoryCheckBtn.addEventListener("click", () => {
  if (!memoryState.currentCards.length) {
    window.alert("Сначала нажмите «Начать запоминание».");
    return;
  }

  const userValues = memoryNormalizeNumbers(memoryCheckInput.value);
  if (!userValues.length) {
    window.alert("Введите числа для проверки.");
    return;
  }

  const expectedValues = memoryState.currentCards.map((card) => card.number);
  const matchedCount = expectedValues.filter((value, index) => value === userValues[index]).length;
  const isFullyCorrect =
    userValues.length === expectedValues.length &&
    matchedCount === expectedValues.length;

  memoryCheckResult.hidden = false;
  memoryCheckResult.className = `memory-check-result ${isFullyCorrect ? "success" : "error"}`;
  memoryCheckResult.innerHTML = `
    <strong>${isFullyCorrect ? "Вы молодец, все верно!" : "Есть ошибки."}</strong>
    <div class="memory-check-summary">Вы правильно назвали ${matchedCount} ${memoryPluralizeDigits(matchedCount)} из ${expectedValues.length}.</div>
    <div class="memory-check-grid">${memoryRenderComparisonRows(userValues, expectedValues)}</div>
  `;
});

memoryShowAssociationsBtn.addEventListener("click", () => {
  if (!memoryState.currentCards.length) {
    window.alert("Сначала нажмите «Начать запоминание».");
    return;
  }

  const isHidden = memoryAnswerCards.hidden;
  if (isHidden) {
    memoryShowAnswers(memoryState.currentCards);
  } else {
    memoryAnswerCards.hidden = true;
    memoryAnswerCards.innerHTML = "";
    memoryShowAssociationsBtn.textContent = "Показать ассоциации";
  }
});

memoryRestartBtn.addEventListener("click", () => {
  memoryState.currentCards = [];
  memoryState.currentRowIndex = 0;
  memoryState.currentRowCount = Number(memoryRowCountSelect.value) || 1;
  memoryRenderRandomNumbers();
  memoryResetTrainerState();
});

memoryRowCountSelect.addEventListener("change", () => {
  memoryState.currentCards = [];
  memoryState.currentRowIndex = 0;
  memoryState.currentRowCount = Number(memoryRowCountSelect.value) || 1;
  memoryRenderRandomNumbers();
  memoryResetTrainerState();
});

memoryCardFilter.addEventListener("change", () => {
  memoryState.filterNumber = memoryCardFilter.value;
  memoryRenderGrid();
});

function memoryRender() {
  memoryRenderStats();
  memoryRenderFilter();
  memoryRenderGrid();
  memoryRenderRandomNumbers();
}

function memoryRenderStats() {
  memoryCardCountEl.textContent = String(memoryState.cards.length);
}

function memoryRenderGrid() {
  memoryCardGrid.innerHTML = "";
  const filteredCards = memoryGetFilteredCards();
  memoryEmptyState.hidden = filteredCards.length > 0;
  if (!filteredCards.length) {
    memoryEmptyState.textContent = memoryState.cards.length
      ? "По выбранному числу карточки не найдены."
      : "Пока нет ассоциаций. Добавь первую карточку и сразу можно будет тренироваться.";
    return;
  }

  filteredCards.forEach((card) => {
    const cardNode = memoryCardTemplate.content.firstElementChild.cloneNode(true);
    cardNode.querySelector(".memory-card-image").src = card.image;
    cardNode.querySelector(".memory-card-number").textContent = `Число: ${card.number}`;

    const textsNode = cardNode.querySelector(".memory-card-texts");
    card.texts.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      textsNode.appendChild(item);
    });

    cardNode.querySelector(".memory-edit-btn").addEventListener("click", () => {
      memoryStartEdit(card);
    });

    memoryCardGrid.appendChild(cardNode);
  });
}

function memoryRenderFilter() {
  const uniqueNumbers = [...new Set(memoryState.cards.map((card) => card.number))].sort();
  const selected = uniqueNumbers.includes(memoryState.filterNumber) ? memoryState.filterNumber : "all";
  memoryState.filterNumber = selected;
  memoryCardFilter.innerHTML = `
    <option value="all">Все</option>
    ${uniqueNumbers.map((number) => `<option value="${number}">${number}</option>`).join("")}
  `;
  memoryCardFilter.value = selected;
}

function memoryGetFilteredCards() {
  if (memoryState.filterNumber === "all") return memoryState.cards;
  return memoryState.cards.filter((card) => card.number === memoryState.filterNumber);
}

function memoryShowAnswers(selectedCards) {
  memoryAnswerCards.innerHTML = "";

  const uniqueCards = Array.from(new Map(selectedCards.map((card) => [card.id, card])).values());
  uniqueCards.forEach((card) => {
    const answerNode = memoryAnswerTemplate.content.firstElementChild.cloneNode(true);
    answerNode.querySelector(".memory-answer-image").src = card.image;
    answerNode.querySelector(".memory-answer-number").textContent = `Число: ${card.number}`;

    const textsNode = answerNode.querySelector(".memory-answer-texts");
    card.texts.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      textsNode.appendChild(item);
    });

    memoryAnswerCards.appendChild(answerNode);
  });

  memoryAnswerCards.hidden = false;
  memoryShowAssociationsBtn.textContent = "Скрыть ассоциации";
}

function memoryRenderRandomNumbers() {
  memoryRandomRows.innerHTML = "";
  const rowNode = document.createElement("div");
  rowNode.className = "memory-trainer-numbers";

  const rowCards = memoryGetCurrentRowCards(memoryState.currentCards);
  for (let columnIndex = 0; columnIndex < 3; columnIndex += 1) {
    const numberNode = document.createElement("div");
    numberNode.className = "memory-trainer-number";
    numberNode.textContent = rowCards[columnIndex]?.number ?? "—";
    rowNode.appendChild(numberNode);
  }

  memoryRandomRows.appendChild(rowNode);
  const totalRows = Math.max(
    1,
    memoryState.currentCards.length ? memoryState.currentRowCount : Number(memoryRowCountSelect.value) || 1,
  );
  memoryTrainerProgress.textContent = `Ряд ${Math.min(memoryState.currentRowIndex + 1, totalRows)} из ${totalRows}`;
  memoryNextRowBtn.classList.toggle("hidden", totalRows <= 1 || memoryState.isChecking);
  memoryNextRowBtn.disabled = memoryState.currentRowIndex >= totalRows - 1;
}

function memoryResetTrainerState() {
  memoryState.isChecking = false;
  memoryAnswerCards.hidden = true;
  memoryAnswerCards.innerHTML = "";
  memoryRandomRows.classList.remove("hidden");
  memoryTrainerProgress.classList.remove("hidden");
  memoryToggleAnswerBtn.textContent = "Готов";
  memoryShowAssociationsBtn.textContent = "Показать ассоциации";
  memoryCheckInput.value = "";
  memoryCheckResult.hidden = true;
  memoryCheckResult.className = "memory-check-result";
  memoryCheckResult.innerHTML = "";
  memoryRenderRandomNumbers();
}

function memoryStartEdit(card) {
  memoryState.editingCardId = card.id;
  memoryNumberInput.value = card.number;
  memoryText1Input.value = card.texts[0] ?? "";
  memoryText2Input.value = card.texts[1] ?? "";
  memoryText3Input.value = card.texts[2] ?? "";
  memoryImageInput.value = "";
  memoryEditBanner.hidden = false;
  memorySubmitBtn.textContent = "Сохранить ассоциацию";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function memoryExitEditMode() {
  memoryState.editingCardId = null;
  memoryEditBanner.hidden = true;
  memorySubmitBtn.textContent = "Добавить ассоциацию";
}

function memoryGetRandomCards(count) {
  const selectedCards = [];
  for (let index = 0; index < count; index += 1) {
    const randomIndex = Math.floor(Math.random() * memoryState.cards.length);
    selectedCards.push(memoryState.cards[randomIndex]);
  }
  return selectedCards;
}

function memoryNormalizeNumbers(value) {
  return value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function memoryRenderComparisonRows(userValues, expectedValues) {
  const rows = [];
  for (let index = 0; index < expectedValues.length; index += 3) {
    const rowValues = expectedValues.slice(index, index + 3);
    if (!rowValues.length) continue;

    const cells = [];
    for (let offset = 0; offset < rowValues.length; offset += 1) {
      const currentIndex = index + offset;
      const expected = expectedValues[currentIndex];
      const actual = userValues[currentIndex] ?? "—";
      const isMatch = actual === expected;
      cells.push(isMatch
        ? `<span class="memory-check-cell ok">${actual}</span>`
        : `<span class="memory-check-cell bad"><span class="memory-wrong-value">${actual}</span><span class="memory-correct-value">${expected}</span></span>`);
    }

    rows.push(`<div class="memory-check-row">${cells.join("")}</div>`);
  }
  return rows.join("");
}

function memoryPluralizeDigits(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return "цифр";
  if (mod10 === 1) return "цифру";
  if (mod10 >= 2 && mod10 <= 4) return "цифры";
  return "цифр";
}

function memoryGetCurrentRowCards(selectedCards) {
  const startIndex = memoryState.currentRowIndex * 3;
  return selectedCards.slice(startIndex, startIndex + 3);
}

function loadMemoryCards() {
  try {
    const current = JSON.parse(localStorage.getItem(MEMORY_CARDS_KEY) || "null");
    if (Array.isArray(current)) return normalizeMemoryCards(current);
  } catch {}

  const migrated = migrateLegacyMemoryCards();
  localStorage.setItem(MEMORY_CARDS_KEY, JSON.stringify(migrated));
  return migrated;
}

function saveMemoryCards() {
  localStorage.setItem(MEMORY_CARDS_KEY, JSON.stringify(memoryState.cards));
}

function migrateLegacyMemoryCards() {
  const merged = [];

  try {
    const profiles = JSON.parse(localStorage.getItem(LEGACY_MEMORY_PROFILES_KEY) || "null");
    if (profiles && typeof profiles === "object") {
      Object.values(profiles).forEach((profile) => {
        if (Array.isArray(profile)) {
          merged.push(...profile);
          return;
        }
        if (profile && Array.isArray(profile.cards)) {
          merged.push(...profile.cards);
        }
      });
    }
  } catch {}

  try {
    const legacyCards = JSON.parse(localStorage.getItem(LEGACY_MEMORY_CARDS_KEY) || "null");
    if (Array.isArray(legacyCards)) merged.push(...legacyCards);
  } catch {}

  const normalized = normalizeMemoryCards(merged);
  const unique = Array.from(new Map(normalized.map((card) => [card.id, card])).values());
  return unique.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function normalizeMemoryCards(cards) {
  return cards
    .filter((card) => card && typeof card === "object")
    .map((card) => ({
      id: String(card.id || crypto.randomUUID()),
      number: String(card.number || "").replace(/\D/g, "").slice(0, 2).padStart(2, "0"),
      texts: Array.isArray(card.texts) ? card.texts.slice(0, 3).map((text) => String(text || "").trim()) : [],
      image: String(card.image || ""),
      createdAt: Number(card.createdAt) || Date.now(),
    }))
    .filter((card) => card.number.length === 2 && card.texts.length === 3 && card.texts.every(Boolean) && card.image);
}

const wordDifficulty = document.getElementById("word-difficulty");
const wordLanguageEl = document.getElementById("word-language");
const wordTargetCountEl = document.getElementById("word-target-count");
const wordShowSecondsEl = document.getElementById("word-show-seconds");
const wordTaskEl = document.getElementById("word-task");
const wordForm = document.getElementById("word-form");
const wordFeedback = document.getElementById("word-feedback");
const wordAnswer = document.getElementById("word-answer");
const wordSubmitBtn = wordForm.querySelector('button[type="submit"]');
const wordReviewEl = document.getElementById("word-review");
const wordStartBtn = document.getElementById("word-start");
const wordStopBtn = document.getElementById("word-stop");
const wordTimerEl = document.getElementById("word-timer");
const wordBestTimeEl = document.getElementById("word-best-time");
wordStartBtn.addEventListener("click", startWordRound);
wordStopBtn.addEventListener("click", stopWordExercise);
wordAnswer.addEventListener("input", syncWordControls);

wordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.words.running || !state.words.value.length) return;
  if (state.words.phase !== "recall") {
    wordFeedback.textContent = "Дождись окончания показа слов.";
    wordFeedback.className = "feedback bad";
    return;
  }

  const inputWords = normalizeWords(wordAnswer.value);
  const expected = state.words.value.map(normalizeWordToken);
  let hitByPosition = 0;
  for (let i = 0; i < expected.length; i += 1) {
    if (inputWords[i] === expected[i]) hitByPosition += 1;
  }
  const perfect = hitByPosition === expected.length && inputWords.length === expected.length;
  const elapsedSec = stopWordTimer();
  applyModeResult("words", perfect, { count: expected.length, timeSec: elapsedSec });
  renderWordReview(inputWords, state.words.value);

  wordFeedback.textContent = `Совпадений по порядку: ${hitByPosition}/${expected.length}`;
  wordFeedback.className = perfect ? "feedback ok" : "feedback bad";
  clearWordRevealTimer();
  state.words.running = false;
  state.words.phase = "idle";
  state.words.value = [];
  state.words.revealedCount = 0;
  wordTaskEl.textContent = "Нажми «Новый пример»";
  wordTaskEl.classList.add("challenge-hint");
  wordForm.reset();
  syncWordControls();
});

function startWordRound() {
  clearWordRevealTimer();
  stopWordTimer();
  state.words.targetCount = Number(wordTargetCountEl.value) || 20;
  state.words.revealSeconds = Number(wordShowSecondsEl.value) || 3;
  const isRu = wordLanguageEl.value !== "en";
  const isComplex = wordDifficulty.value === "complex";
  const pool = isRu
    ? (isComplex ? wordPoolRuComplex : wordPoolRuSimple)
    : (isComplex ? wordPoolEnComplex : wordPoolEnSimple);
  const chosen = shuffle(pool).slice(0, state.words.targetCount);
  state.words.running = true;
  state.words.phase = "memorize";
  state.words.value = chosen;
  state.words.revealedCount = 0;
  wordFeedback.textContent = "";
  wordReviewEl.hidden = true;
  wordReviewEl.innerHTML = "";
  wordTaskEl.textContent = `Слова появляются автоматически каждые ${state.words.revealSeconds} сек.`;
  wordTaskEl.classList.add("challenge-hint");
  startWordTimer();
  wordForm.reset();
  revealNextWord();
  startWordRevealSequence();
  syncWordControls();
}

function revealNextWord() {
  if (!state.words.running || !state.words.value.length) return;
  if (state.words.revealedCount >= state.words.targetCount) return;
  state.words.revealedCount += 1;
  const visibleWords = state.words.value.slice(0, state.words.revealedCount);
  wordTaskEl.textContent = visibleWords.join(" • ");
  wordTaskEl.classList.remove("challenge-hint");
}

function startWordRevealSequence() {
  clearWordRevealTimer();
  if (state.words.revealedCount >= state.words.targetCount) {
    scheduleWordRecallTransition();
    return;
  }

  state.words.revealTimerId = setInterval(() => {
    if (!state.words.running || state.words.phase !== "memorize") {
      clearWordRevealTimer();
      return;
    }

    revealNextWord();
    if (state.words.revealedCount >= state.words.targetCount) {
      clearWordRevealTimer();
      scheduleWordRecallTransition();
      return;
    }
    syncWordControls();
  }, state.words.revealSeconds * 1000);
}

function clearWordRevealTimer() {
  if (state.words.revealTimerId) {
    clearInterval(state.words.revealTimerId);
    state.words.revealTimerId = null;
  }
}

function scheduleWordRecallTransition() {
  wordFeedback.textContent = "";
  wordFeedback.className = "feedback";
  syncWordControls();

  state.words.revealTimerId = setTimeout(() => {
    state.words.revealTimerId = null;
    finishWordMemorizing();
  }, state.words.revealSeconds * 1000);
}

function finishWordMemorizing() {
  if (!state.words.running || !state.words.value.length) return;
  if (state.words.revealedCount < state.words.targetCount) {
    wordFeedback.textContent = "Дождись окончания показа слов.";
    wordFeedback.className = "feedback bad";
    return;
  }
  clearWordRevealTimer();
  state.words.phase = "recall";
  wordTaskEl.textContent = "Все слова показаны, выведи теперь их по памяти по порядку.";
  wordTaskEl.classList.add("challenge-hint");
  wordFeedback.textContent = "";
  wordAnswer.focus();
  syncWordControls();
}

function startWordTimer() {
  state.words.startedAt = Date.now();
  wordTimerEl.textContent = "Таймер: 0.0с";
  if (state.words.timerId) clearInterval(state.words.timerId);
  state.words.timerId = setInterval(() => {
    if (!state.words.startedAt) return;
    const elapsedSec = (Date.now() - state.words.startedAt) / 1000;
    wordTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  }, 100);
}

function stopWordTimer() {
  if (state.words.timerId) {
    clearInterval(state.words.timerId);
    state.words.timerId = null;
  }
  if (!state.words.startedAt) return 0;
  const elapsedSec = (Date.now() - state.words.startedAt) / 1000;
  state.words.startedAt = null;
  wordTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  return elapsedSec;
}

function stopWordExercise() {
  const hadActive = state.words.running || Boolean(state.words.startedAt);
  clearWordRevealTimer();
  stopWordTimer();
  state.words.running = false;
  state.words.phase = "idle";
  state.words.value = [];
  state.words.revealedCount = 0;
  wordTaskEl.textContent = "Нажми «Новый пример»";
  wordTaskEl.classList.add("challenge-hint");
  wordForm.reset();
  wordReviewEl.hidden = true;
  wordReviewEl.innerHTML = "";
  if (hadActive) {
    wordFeedback.textContent = "Упражнение остановлено.";
    wordFeedback.className = "feedback";
  }
  syncWordControls();
}

function renderWordReview(inputWords, originalWords) {
  const rows = [];
  for (let index = 0; index < originalWords.length; index += 1) {
    const expectedRaw = originalWords[index];
    const expected = normalizeWordToken(expectedRaw);
    const actualRaw = inputWords[index] || "";
    const isMatch = actualRaw === expected;
    rows.push(`
      <div class="word-review-row ${isMatch ? "is-ok" : "is-bad"}">
        <div class="word-review-index">${index + 1}</div>
        <div class="word-review-columns">
          <div class="word-review-col">
            <span class="word-review-label">Правильно</span>
            <span class="word-chip expected">${expectedRaw}</span>
          </div>
          <div class="word-review-col">
            <span class="word-review-label">Твой ответ</span>
            ${isMatch
              ? `<span class="word-chip actual ok">${actualRaw || expectedRaw}</span>`
              : `<span class="word-chip actual bad">${actualRaw || "Пропуск"}</span>`}
          </div>
        </div>
      </div>
    `);
  }

  for (let index = originalWords.length; index < inputWords.length; index += 1) {
    rows.push(`
      <div class="word-review-row is-bad">
        <div class="word-review-index">+</div>
        <div class="word-review-columns">
          <div class="word-review-col">
            <span class="word-review-label">Правильно</span>
            <span class="word-chip expected">Лишнее слово</span>
          </div>
          <div class="word-review-col">
            <span class="word-review-label">Твой ответ</span>
            <span class="word-chip actual bad">${inputWords[index]}</span>
          </div>
        </div>
      </div>
    `);
  }

  wordReviewEl.innerHTML = `
    <div class="word-review-head">
      <strong>Разбор ответа</strong>
      <span>Правильные слова отмечены отдельно, ошибки зачеркнуты, пропуски добавлены.</span>
    </div>
    <div class="word-review-grid">${rows.join("")}</div>
  `;
  wordReviewEl.hidden = false;
}

function syncWordControls() {
  wordStartBtn.disabled = state.words.running;
  wordSubmitBtn.disabled = state.words.phase !== "recall" || !wordAnswer.value.trim();
  wordStopBtn.disabled = !state.words.running && !state.words.startedAt;
  wordAnswer.disabled = state.words.phase !== "recall";
}

const attentionImageInput = document.getElementById("attention-image-input");
const attentionUploadTriggerBtn = document.getElementById("attention-upload-trigger");
const attentionShowSecondsEl = document.getElementById("attention-show-seconds");
const attentionRandomBtn = document.getElementById("attention-random");
const attentionDescribeBtn = document.getElementById("attention-describe");
const attentionStopBtn = document.getElementById("attention-stop");
const attentionCompareBtn = document.getElementById("attention-compare");
const attentionTimerEl = document.getElementById("attention-timer");
const attentionSourceEl = document.getElementById("attention-source");
const attentionStageEl = document.getElementById("attention-stage");
const attentionPreviewEl = document.getElementById("attention-preview");
const attentionPlaceholderEl = document.getElementById("attention-placeholder");
const attentionDescriptionEl = document.getElementById("attention-description");
const attentionAnswerEl = document.getElementById("attention-answer");
const attentionFeedbackEl = document.getElementById("attention-feedback");
const attentionCompareResultEl = document.getElementById("attention-compare-result");
const attentionDescribeDefaultLabel = attentionDescribeBtn.textContent;
const attentionCompareDefaultLabel = attentionCompareBtn.textContent;
const attentionRandomDefaultLabel = attentionRandomBtn.textContent;

attentionImageInput.addEventListener("change", handleAttentionImageUpload);
attentionUploadTriggerBtn.addEventListener("click", () => attentionImageInput.click());
attentionRandomBtn.addEventListener("click", loadRandomAttentionImage);
attentionDescribeBtn.addEventListener("click", describeAttentionImage);
attentionStopBtn.addEventListener("click", stopAttentionExercise);
attentionCompareBtn.addEventListener("click", compareAttentionAnswer);
attentionAnswerEl.addEventListener("input", syncAttentionDescribeAvailability);

function handleAttentionImageUpload(event) {
  const [file] = event.target.files || [];
  if (!file) {
    clearAttentionMedia();
    syncAttentionDescribeAvailability();
    return;
  }

  applyAttentionFile(file, URL.createObjectURL(file), "Загруженное фото");
}

async function loadRandomAttentionImage() {
  if (state.attention.randomLoading) return;

  state.attention.randomLoading = true;
  attentionRandomBtn.textContent = "Подбираю...";
  attentionFeedbackEl.textContent = "";
  attentionFeedbackEl.className = "feedback";
  syncAttentionDescribeAvailability();

  try {
    const response = await fetch("/api/random-attention-image");
    const payload = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(payload?.error || "Не удалось получить случайное фото.");
    }

    if (!payload?.imageDataUrl) {
      throw new Error("Сервер не вернул случайное фото.");
    }

    const randomFile = dataUrlToFile(
      payload.imageDataUrl,
      `${payload.themeKey || "attention-random"}.jpg`,
    );
    applyAttentionFile(
      randomFile,
      payload.imageDataUrl,
      payload.themeLabel ? `Случайное фото: ${payload.themeLabel}` : "Случайное фото",
    );
    attentionFeedbackEl.textContent = "Случайное фото загружено.";
    attentionFeedbackEl.className = "feedback ok";
  } catch (error) {
    attentionFeedbackEl.textContent = toAttentionErrorMessage(error);
    attentionFeedbackEl.className = "feedback bad";
  } finally {
    state.attention.randomLoading = false;
    attentionRandomBtn.textContent = attentionRandomDefaultLabel;
    syncAttentionDescribeAvailability();
  }
}

function applyAttentionFile(file, imageUrl, sourceLabel) {
  clearAttentionMedia();
  state.attention.fileName = file.name || "";
  state.attention.imageUrl = imageUrl;
  state.attention.file = file;
  state.attention.sourceLabel = sourceLabel || "Загруженное фото";
  state.attention.notes = "";
  state.attention.completed = false;
  state.attention.descriptionReady = false;
  state.attention.loadToken += 1;
  const currentLoadToken = state.attention.loadToken;
  attentionPreviewEl.onload = () => {
    if (state.attention.loadToken !== currentLoadToken) return;
    startAttentionRound();
  };
  attentionPreviewEl.src = imageUrl;
  attentionPreviewEl.hidden = false;
  attentionPlaceholderEl.hidden = true;
  attentionDescriptionEl.value = "";
  attentionAnswerEl.value = "";
  attentionFeedbackEl.textContent = "";
  attentionFeedbackEl.className = "feedback";
  attentionCompareResultEl.hidden = true;
  attentionCompareResultEl.innerHTML = "";
  syncAttentionDescribeAvailability();
}

function showAttentionPlaceholder(text) {
  attentionStageEl.classList.add("is-empty");
  attentionPreviewEl.hidden = true;
  attentionPreviewEl.removeAttribute("src");
  attentionPlaceholderEl.hidden = false;
  attentionPlaceholderEl.textContent = text;
}

function showAttentionImage() {
  attentionStageEl.classList.remove("is-empty");
  attentionPreviewEl.hidden = false;
  attentionPlaceholderEl.hidden = true;
}

function clearAttentionMedia() {
  stopAttentionTimer();
  clearAttentionHideTimer();
  revokeAttentionImageUrl();
  state.attention.fileName = "";
  state.attention.imageUrl = "";
  state.attention.file = null;
  state.attention.timeLeft = 0;
  state.attention.visible = false;
  state.attention.sourceLabel = "";
  state.attention.completed = false;
  state.attention.descriptionReady = false;
  state.attention.startedAt = null;
  showAttentionPlaceholder("Нажми «Выбери файл» или «Случайное фото».");
  attentionTimerEl.textContent = "Таймер: 0с";
  attentionSourceEl.textContent = "Источник: --";
  attentionDescriptionEl.value = "";
  attentionAnswerEl.value = "";
  attentionCompareResultEl.hidden = true;
  attentionCompareResultEl.innerHTML = "";
}

function startAttentionRound() {
  if (!state.attention.imageUrl) return;

  stopAttentionTimer();
  clearAttentionHideTimer();
  state.attention.timeLeft = Number(attentionShowSecondsEl.value) || 10;
  state.attention.visible = true;
  showAttentionImage();
  startAttentionTimer();
  attentionSourceEl.textContent = `Источник: ${state.attention.sourceLabel || "Фото"}`;
  attentionFeedbackEl.textContent = "Фото загружено. Начинай запоминать детали.";
  attentionFeedbackEl.className = "feedback";
  syncAttentionDescribeAvailability();

  state.attention.hideTimerId = setTimeout(() => {
    hideAttentionImage();
  }, state.attention.timeLeft * 1000);
}

function hideAttentionImage() {
  if (!state.attention.imageUrl) return;
  clearAttentionHideTimer();
  state.attention.visible = false;
  showAttentionPlaceholder("Фото скрыто. Опиши увиденные детали по памяти.");
  attentionAnswerEl.focus();
  syncAttentionDescribeAvailability();
}

function startAttentionTimer() {
  state.attention.startedAt = Date.now();
  attentionTimerEl.textContent = "Таймер: 0.0с";
  if (state.attention.timerId) clearInterval(state.attention.timerId);
  state.attention.timerId = setInterval(() => {
    if (!state.attention.startedAt) return;
    const elapsedSec = (Date.now() - state.attention.startedAt) / 1000;
    attentionTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  }, 100);
}

function stopAttentionTimer() {
  if (state.attention.timerId) {
    clearInterval(state.attention.timerId);
    state.attention.timerId = null;
  }
  if (!state.attention.startedAt) return 0;
  const elapsedSec = (Date.now() - state.attention.startedAt) / 1000;
  state.attention.startedAt = null;
  attentionTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  return elapsedSec;
}

function clearAttentionHideTimer() {
  if (state.attention.hideTimerId) {
    clearTimeout(state.attention.hideTimerId);
    state.attention.hideTimerId = null;
  }
}

async function describeAttentionImage() {
  if (!state.attention.file) {
    attentionFeedbackEl.textContent = "Сначала загрузи фотографию.";
    attentionFeedbackEl.className = "feedback bad";
    return;
  }
  if (state.attention.loadingDescription) return;

  state.attention.loadingDescription = true;
  state.attention.descriptionReady = false;
  syncAttentionDescribeAvailability();
  attentionDescriptionEl.value = "";
  attentionFeedbackEl.textContent = "";
  attentionDescribeBtn.textContent = "Анализ...";

  try {
    const formData = new FormData();
    formData.append("image", state.attention.file);

    const response = await fetch("/api/describe-image", {
      method: "POST",
      body: formData,
    });

    const payload = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(payload?.error || "Не удалось получить описание изображения.");
    }

    if (!payload?.description || payload.description === "Не удалось получить описание изображения.") {
      throw new Error("Сервер не вернул корректное описание изображения.");
    }

    attentionDescriptionEl.value = payload.description || "";
    state.attention.descriptionReady = true;
    attentionFeedbackEl.textContent = "Описание получено.";
    attentionFeedbackEl.className = "feedback ok";
  } catch (error) {
    attentionDescriptionEl.value = "";
    state.attention.descriptionReady = false;
    attentionFeedbackEl.textContent = toAttentionErrorMessage(error);
    attentionFeedbackEl.className = "feedback bad";
  } finally {
    state.attention.loadingDescription = false;
    attentionDescribeBtn.textContent = attentionDescribeDefaultLabel;
    syncAttentionDescribeAvailability();
  }
}

async function compareAttentionAnswer() {
  const notes = attentionAnswerEl.value.trim();
  if (!state.attention.file) {
    attentionFeedbackEl.textContent = "Сначала загрузи фотографию.";
    attentionFeedbackEl.className = "feedback bad";
    return;
  }
  if (!notes) {
    attentionFeedbackEl.textContent = "Сначала опиши, что ты заметил.";
    attentionFeedbackEl.className = "feedback bad";
    return;
  }
  if (state.attention.comparing) return;

  stopAttentionTimer();
  clearAttentionHideTimer();
  state.attention.comparing = true;
  state.attention.notes = notes;
  attentionCompareBtn.textContent = "Сравниваю...";
  attentionFeedbackEl.textContent = "";
  attentionCompareResultEl.hidden = true;
  attentionCompareResultEl.innerHTML = "";
  syncAttentionDescribeAvailability();

  try {
    const formData = new FormData();
    formData.append("image", state.attention.file);
    formData.append("notes", notes);

    const response = await fetch("/api/compare-attention", {
      method: "POST",
      body: formData,
    });

    const payload = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(payload?.error || "Не удалось сравнить ответ с фото.");
    }

    renderAttentionComparison(payload);
    state.attention.completed = true;
    attentionFeedbackEl.textContent = "Сравнение готово.";
    attentionFeedbackEl.className = "feedback ok";
  } catch (error) {
    attentionCompareResultEl.hidden = true;
    attentionCompareResultEl.innerHTML = "";
    attentionFeedbackEl.textContent = toAttentionErrorMessage(error);
    attentionFeedbackEl.className = "feedback bad";
  } finally {
    state.attention.comparing = false;
    attentionCompareBtn.textContent = attentionCompareDefaultLabel;
    syncAttentionDescribeAvailability();
  }
}

function renderAttentionComparison(result) {
  const totalDetails = Number(result?.totalDetails) || 0;
  const rememberedDetails = Number(result?.rememberedDetails) || 0;
  const matchedDetails = normalizeAttentionList(result?.matchedDetails);
  const missedDetails = normalizeAttentionList(result?.missedDetails);
  const extraDetails = normalizeAttentionList(result?.extraDetails);
  const summary = String(result?.summary || "").trim();

  attentionCompareResultEl.innerHTML = `
    <div class="attention-compare-head">
      <strong>Сравнение с твоим ответом</strong>
      <span class="attention-score">Внимательность: ${rememberedDetails} из ${totalDetails || Math.max(rememberedDetails, 1)} деталей</span>
    </div>
    ${summary ? `<p class="attention-compare-summary">${escapeHtml(summary)}</p>` : ""}
    <div class="attention-compare-grid">
      <section class="attention-compare-col">
        <h4>Ты заметил</h4>
        ${renderAttentionList(matchedDetails, "AI не выделил совпадающих деталей.")}
      </section>
      <section class="attention-compare-col">
        <h4>Ты пропустил</h4>
        ${renderAttentionList(missedDetails, "Серьезных пропусков нет.")}
      </section>
      <section class="attention-compare-col">
        <h4>Лишнее или спорное</h4>
        ${renderAttentionList(extraDetails, "Лишних деталей нет.")}
      </section>
    </div>
  `;
  attentionCompareResultEl.hidden = false;
}

function renderAttentionList(items, emptyText) {
  if (!items.length) return `<p class="attention-compare-empty">${escapeHtml(emptyText)}</p>`;
  return `<ul class="attention-compare-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function normalizeAttentionList(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function stopAttentionExercise() {
  const hadActive =
    Boolean(state.attention.file)
    || Boolean(state.attention.imageUrl)
    || Boolean(state.attention.startedAt)
    || state.attention.visible
    || state.attention.loadingDescription
    || state.attention.comparing
    || state.attention.randomLoading
    || state.attention.completed;
  stopAttentionTimer();
  clearAttentionHideTimer();
  revokeAttentionImageUrl();
  state.attention.fileName = "";
  state.attention.imageUrl = "";
  state.attention.file = null;
  state.attention.timeLeft = 0;
  state.attention.visible = false;
  state.attention.startedAt = null;
  state.attention.notes = "";
  state.attention.loadingDescription = false;
  state.attention.comparing = false;
  state.attention.randomLoading = false;
  state.attention.sourceLabel = "";
  state.attention.completed = false;
  state.attention.descriptionReady = false;
  state.attention.loadToken += 1;
  attentionImageInput.value = "";
  showAttentionPlaceholder("Нажми «Выбери файл» или «Случайное фото».");
  attentionTimerEl.textContent = "Таймер: 0с";
  attentionSourceEl.textContent = "Источник: --";
  attentionDescriptionEl.value = "";
  attentionFeedbackEl.textContent = "";
  attentionAnswerEl.value = "";
  attentionCompareResultEl.hidden = true;
  attentionCompareResultEl.innerHTML = "";
  attentionDescribeBtn.textContent = attentionDescribeDefaultLabel;
  attentionCompareBtn.textContent = attentionCompareDefaultLabel;
  attentionRandomBtn.textContent = attentionRandomDefaultLabel;
  if (hadActive) {
    attentionFeedbackEl.textContent = "Упражнение остановлено.";
    attentionFeedbackEl.className = "feedback";
  }
  syncAttentionDescribeAvailability();
}

function revokeAttentionImageUrl() {
  if (state.attention.imageUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(state.attention.imageUrl);
  }
}

const schulteSizeEl = document.getElementById("schulte-size");
const schulteStartBtn = document.getElementById("schulte-start");
const schulteNextEl = document.getElementById("schulte-next");
const schulteTimerEl = document.getElementById("schulte-timer");
const schulteBestTimeEl = document.getElementById("schulte-best-time");
const schulteBoardEl = document.getElementById("schulte-board");
const schulteFeedbackEl = document.getElementById("schulte-feedback");
const schulteStopBtn = document.getElementById("schulte-stop");

schulteSizeEl.addEventListener("change", () => {
  state.schulte.size = Number(schulteSizeEl.value) || 5;
  if (!state.schulte.active && !state.schulte.values.length) {
    renderSchulteBoard();
  }
});
schulteStartBtn.addEventListener("click", startSchulteRound);
schulteStopBtn.addEventListener("click", stopSchulteExercise);

function startSchulteRound() {
  stopSchulteTimer();
  state.schulte.size = Number(schulteSizeEl.value) || 5;
  state.schulte.values = shuffle(
    Array.from({ length: state.schulte.size * state.schulte.size }, (_, index) => index + 1),
  );
  state.schulte.nextValue = 1;
  state.schulte.active = true;
  schulteFeedbackEl.textContent = "";
  schulteFeedbackEl.className = "feedback";
  renderSchulteBoard();
  startSchulteTimer();
  syncSchulteControls();
}

function renderSchulteBoard() {
  schulteBoardEl.dataset.size = String(state.schulte.size);
  schulteBoardEl.innerHTML = "";

  if (!state.schulte.values.length) {
    schulteBoardEl.classList.add("is-empty", "challenge", "challenge-hint");
    const placeholder = document.createElement("div");
    placeholder.className = "schulte-empty-text";
    placeholder.textContent = "Нажми «Новый пример»";
    schulteBoardEl.appendChild(placeholder);
    schulteNextEl.textContent = "Следующее число: --";
    return;
  }

  schulteBoardEl.classList.remove("is-empty", "challenge", "challenge-hint");

  state.schulte.values.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "schulte-cell";
    button.dataset.value = String(value);
    button.textContent = String(value);
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", `Число ${value}`);
    button.addEventListener("click", () => handleSchulteCellClick(button));
    schulteBoardEl.appendChild(button);
  });

  updateSchulteProgress();
}

function handleSchulteCellClick(button) {
  if (!state.schulte.active) return;

  const value = Number(button.dataset.value);
  if (value !== state.schulte.nextValue) {
    button.classList.remove("is-wrong");
    void button.offsetWidth;
    button.classList.add("is-wrong");
    window.setTimeout(() => {
      button.classList.remove("is-wrong");
    }, 260);
    return;
  }

  button.disabled = true;
  button.classList.add("is-found");
  state.schulte.nextValue += 1;

  const total = state.schulte.size * state.schulte.size;
  if (state.schulte.nextValue > total) {
    finishSchulteRound();
    return;
  }

  updateSchulteProgress();
}

function finishSchulteRound() {
  const tookSec = stopSchulteTimer();
  state.schulte.active = false;
  updateSchulteProgress(true);
  applyModeResult("schulte", true, {
    size: state.schulte.size,
    timeSec: tookSec,
  });
  schulteFeedbackEl.textContent =
    `Таблица ${state.schulte.size}x${state.schulte.size} пройдена`;
  schulteFeedbackEl.className = "feedback ok";
  syncSchulteControls();
}

function startSchulteTimer() {
  state.schulte.startedAt = Date.now();
  schulteTimerEl.textContent = "Таймер: 0.0с";
  if (state.schulte.timerId) clearInterval(state.schulte.timerId);
  state.schulte.timerId = setInterval(() => {
    if (!state.schulte.startedAt) return;
    const elapsedSec = (Date.now() - state.schulte.startedAt) / 1000;
    schulteTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  }, 100);
}

function stopSchulteTimer() {
  if (state.schulte.timerId) {
    clearInterval(state.schulte.timerId);
    state.schulte.timerId = null;
  }
  if (!state.schulte.startedAt) return 0;
  const elapsedSec = (Date.now() - state.schulte.startedAt) / 1000;
  state.schulte.startedAt = null;
  schulteTimerEl.textContent = `Таймер: ${elapsedSec.toFixed(1)}с`;
  return elapsedSec;
}

function updateSchulteProgress(isCompleted = false) {
  schulteNextEl.textContent = isCompleted
    ? "Следующее число: --"
    : `Следующее число: ${state.schulte.values.length ? state.schulte.nextValue : "--"}`;
}

function resetSchulteExercise() {
  stopSchulteTimer();
  state.schulte.size = Number(schulteSizeEl.value) || 5;
  state.schulte.values = [];
  state.schulte.nextValue = 1;
  state.schulte.active = false;
  schulteTimerEl.textContent = "Таймер: 0.0с";
  renderSchulteBoard();
  schulteFeedbackEl.textContent = "";
  schulteFeedbackEl.className = "feedback";
  syncSchulteControls();
}

function stopSchulteExercise() {
  const hadActive = state.schulte.active || Boolean(state.schulte.startedAt);
  stopSchulteTimer();
  state.schulte.size = Number(schulteSizeEl.value) || 5;
  state.schulte.values = [];
  state.schulte.nextValue = 1;
  state.schulte.active = false;
  schulteTimerEl.textContent = "Таймер: 0.0с";
  renderSchulteBoard();
  if (hadActive) {
    schulteFeedbackEl.textContent = "Упражнение остановлено.";
    schulteFeedbackEl.className = "feedback";
  } else {
    schulteFeedbackEl.textContent = "";
    schulteFeedbackEl.className = "feedback";
  }
  syncSchulteControls();
}

function syncSchulteControls() {
  schulteStartBtn.disabled = state.schulte.active;
  schulteStopBtn.disabled = !state.schulte.active && !state.schulte.startedAt;
}

document.getElementById("reset-progress").addEventListener("click", () => {
  if (!window.confirm("Сбросить весь сохраненный прогресс?")) return;
  stopMathTimer();
  stopNumberTimer();
  stopWordTimer();
  stopAttentionExercise();
  stopExamExercise({ silent: true });
  resetSchulteExercise();
  mathTimerEl.textContent = "Таймер: 0.0с";
  numTimerEl.textContent = "Таймер: 0.0с";
  examTimerEl.textContent = "Таймер: 0.0с";
  state.numbers.totalRounds = Number(numTotalRoundsEl.value) || 6;
  numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
  wordTimerEl.textContent = "Таймер: 0.0с";
  state.progress = structuredClone(defaults);
  persist();
  updateMathBestTime();
  updateNumberBestTime();
  updateWordBestTime();
  updateSchulteBestTime();
  renderProgress();
});

function applyModeResult(mode, success, extra = {}) {
  const bucket = state.progress[mode];
  bucket.attempts += 1;
  if (success) {
    bucket.correct += 1;
    bucket.streak += 1;
    bucket.bestStreak = Math.max(bucket.bestStreak || 0, bucket.streak);
  } else {
    bucket.streak = 0;
  }

  if (mode === "numbers") {
    bucket.bestLength = Math.max(bucket.bestLength || 0, extra.span || 0);
    if (success && extra.timeSec) {
      const prev = bucket.bestTimeSec ?? Number.POSITIVE_INFINITY;
      bucket.bestTimeSec = Math.min(prev, extra.timeSec);
      updateNumberBestTime();
    }
  }
  if (mode === "math" && success) {
    if (extra.timeSec) {
      const prev = bucket.bestTimeSec ?? Number.POSITIVE_INFINITY;
      bucket.bestTimeSec = Math.min(prev, extra.timeSec);
      updateMathBestTime();
    }
  }
  if (mode === "words" && success) {
    bucket.bestCount = Math.max(bucket.bestCount || 0, extra.count || 0);
    if (extra.timeSec) {
      const prev = bucket.bestTimeSec ?? Number.POSITIVE_INFINITY;
      bucket.bestTimeSec = Math.min(prev, extra.timeSec);
      updateWordBestTime();
    }
  }
  if (mode === "schulte" && success) {
    bucket.bestSize = Math.max(bucket.bestSize || 0, extra.size || 0);
    if (extra.timeSec) {
      const prev = bucket.bestTimeSec ?? Number.POSITIVE_INFINITY;
      bucket.bestTimeSec = Math.min(prev, extra.timeSec);
      updateSchulteBestTime();
    }
  }

  state.progress.sessions.unshift({
    mode,
    success,
    at: new Date().toISOString(),
    score: extra.span || extra.count || extra.size || null,
  });
  state.progress.sessions = state.progress.sessions.slice(0, 20);

  persist();
  renderProgress();
}

function renderProgress() {
  const math = state.progress.math;
  const numbers = state.progress.numbers;
  const words = state.progress.words;
  const schulte = state.progress.schulte;

  const mathAcc = percentage(math.correct, math.attempts);
  const numAcc = percentage(numbers.correct, numbers.attempts);
  const wordAcc = percentage(words.correct, words.attempts);

  const allAttempts = math.attempts + numbers.attempts + words.attempts;
  const allCorrect = math.correct + numbers.correct + words.correct;

  document.getElementById("stat-math").textContent =
    `${math.correct}/${math.attempts} (${mathAcc}%), серия: ${math.streak}, рекорд: ${Number.isFinite(math.bestTimeSec) ? `${math.bestTimeSec.toFixed(1)}с` : "--"}`;
  document.getElementById("stat-num").textContent =
    `${numbers.correct}/${numbers.attempts} (${numAcc}%), лучший результат: ${numbers.bestLength || 0}, рекорд: ${Number.isFinite(numbers.bestTimeSec) ? `${numbers.bestTimeSec.toFixed(1)}с` : "--"}`;
  document.getElementById("stat-word").textContent =
    `${words.correct}/${words.attempts} (${wordAcc}%), объем: ${words.bestCount || 0}, рекорд: ${Number.isFinite(words.bestTimeSec) ? `${words.bestTimeSec.toFixed(1)}с` : "--"}`;
  document.getElementById("stat-schulte").textContent =
    `Пройдено: ${schulte.correct}, размер: ${schulte.bestSize ? `${schulte.bestSize}x${schulte.bestSize}` : "--"}, рекорд: ${Number.isFinite(schulte.bestTimeSec) ? `${schulte.bestTimeSec.toFixed(1)}с` : "--"}`;
  document.getElementById("stat-total").textContent = `${percentage(allCorrect, allAttempts)}%`;

  const recentList = document.getElementById("recent-list");
  recentList.innerHTML = "";
  if (!state.progress.sessions.length) {
    const li = document.createElement("li");
    li.textContent = "Пока нет попыток.";
    recentList.appendChild(li);
    return;
  }

  state.progress.sessions.slice(0, 8).forEach((entry) => {
    const li = document.createElement("li");
    const modeLabel = {
      math: "Счет",
      numbers: "Числовой ряд",
      words: "Слова",
      schulte: "Таблицы Шульте",
    }[entry.mode];
    const timeLabel = new Date(entry.at).toLocaleString("ru-RU");
    li.textContent =
      `${modeLabel}: ${entry.success ? "успех" : "ошибка"} • ${timeLabel}`;
    recentList.appendChild(li);
  });
}

function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed) return structuredClone(defaults);
    return {
      ...structuredClone(defaults),
      ...parsed,
      math: { ...defaults.math, ...(parsed.math || {}) },
      numbers: { ...defaults.numbers, ...(parsed.numbers || {}) },
      words: { ...defaults.words, ...(parsed.words || {}) },
      schulte: { ...defaults.schulte, ...(parsed.schulte || {}) },
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return structuredClone(defaults);
  }
}

function updateWordBestTime() {
  const best = state.progress.words.bestTimeSec;
  wordBestTimeEl.textContent = Number.isFinite(best)
    ? `Рекорд: ${best.toFixed(1)}с`
    : "Рекорд: --";
}

function updateMathBestTime() {
  const best = state.progress.math.bestTimeSec;
  mathBestTimeEl.textContent = Number.isFinite(best)
    ? `Рекорд: ${best.toFixed(1)}с`
    : "Рекорд: --";
}

function updateNumberBestTime() {
  const best = state.progress.numbers.bestTimeSec;
  numBestTimeEl.textContent = Number.isFinite(best)
    ? `Рекорд: ${best.toFixed(1)}с`
    : "Рекорд: --";
}

function updateSchulteBestTime() {
  const best = state.progress.schulte.bestTimeSec;
  schulteBestTimeEl.textContent = Number.isFinite(best)
    ? `Рекорд: ${best.toFixed(1)}с`
    : "Рекорд: --";
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSelectedNumberDigits() {
  return [...numDigitPoolEl.querySelectorAll('input[type="checkbox"]:checked')]
    .map((el) => Number(el.value))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 9);
}

function generateDigits(length, digitsPool) {
  let value = "";
  const pool = Array.isArray(digitsPool) && digitsPool.length ? digitsPool : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = 0; i < length; i += 1) {
    value += pool[randomInt(0, pool.length - 1)];
  }
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeWords(raw) {
  return raw
    .split(/[,\s;]+/)
    .map(normalizeWordToken)
    .filter(Boolean);
}

function normalizeWordToken(raw) {
  return raw
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9-]/gi, "")
    .trim();
}

function percentage(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
    reader.readAsDataURL(file);
  });
}

function syncAttentionDescribeAvailability() {
  const attentionLocked = state.attention.completed;
  const attentionSourceLocked = Boolean(state.attention.file) || attentionLocked;
  attentionUploadTriggerBtn.disabled =
    attentionSourceLocked || state.attention.randomLoading || state.attention.loadingDescription || state.attention.comparing;
  attentionImageInput.disabled = attentionUploadTriggerBtn.disabled;
  attentionDescribeBtn.disabled =
    !attentionLocked || !state.attention.file || state.attention.loadingDescription || state.attention.randomLoading || state.attention.descriptionReady;
  attentionCompareBtn.disabled =
    attentionLocked || !state.attention.file || !attentionAnswerEl.value.trim() || state.attention.comparing || state.attention.randomLoading;
  attentionRandomBtn.disabled =
    attentionSourceLocked || state.attention.randomLoading || state.attention.loadingDescription || state.attention.comparing;
  attentionStopBtn.disabled =
    !state.attention.file
    && !state.attention.imageUrl
    && !state.attention.loadingDescription
    && !state.attention.randomLoading
    && !state.attention.completed;
}

function toAttentionErrorMessage(error) {
  const message = error?.message || "";
  if (message.includes("Failed to fetch")) {
    return "Не удалось связаться с backend. Запусти сервер и открой сайт через http://localhost:3000.";
  }
  if (message.includes("quota")) {
    return "У API-ключа закончилась квота или не настроен биллинг.";
  }
  return message || "Ошибка при анализе изображения.";
}

async function parseJsonSafely(response) {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Сервер вернул некорректный ответ.");
  }
}

function dataUrlToFile(dataUrl, fileName) {
  const [header, body] = dataUrl.split(",", 2);
  const mimeMatch = header?.match(/data:(.*?);base64/);
  if (!mimeMatch || !body) {
    throw new Error("Некорректный data URL для изображения.");
  }

  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mimeMatch[1] });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

updateMathControls();
setMathTaskPlaceholder("Нажми «Новый пример»");
state.numbers.totalRounds = Number(numTotalRoundsEl.value) || state.numbers.totalRounds;
numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
setNumberTaskPlaceholder("Нажми «Новый пример»");
setExamTaskPlaceholder("Нажми «Начать экзамен»");
updateMathBestTime();
updateNumberBestTime();
updateWordBestTime();
updateSchulteBestTime();
syncMathControls();
syncNumberControls();
syncExamControls();
syncWordControls();
syncAttentionDescribeAvailability();
resetSchulteExercise();
memoryRender();
memoryResetTrainerState();
renderProgress();
