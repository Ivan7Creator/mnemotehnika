const STORAGE_KEY = "mnemonic_lab_progress_v1";

const defaults = {
  math: { attempts: 0, correct: 0, bestStreak: 0, streak: 0, bestTimeSec: null },
  numbers: { attempts: 0, correct: 0, bestLength: 0, streak: 0, bestTimeSec: null },
  words: { attempts: 0, correct: 0, bestCount: 0, streak: 0, bestTimeSec: null },
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
  },
  words: {
    value: [],
    revealedCount: 0,
    targetCount: 20,
    running: false,
    phase: "idle",
    startedAt: null,
    timerId: null,
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
  numbers: document.getElementById("numbers-panel"),
  words: document.getElementById("words-panel"),
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
const mathTimerEl = document.getElementById("math-timer");
const mathBestTimeEl = document.getElementById("math-best-time");
const mathNumberSizeEl = document.getElementById("math-number-size");
const mathOperationEl = document.getElementById("math-operation");
const mathMulLimitWrap = document.getElementById("math-mul-limit-wrap");
const mathMulLimitEl = document.getElementById("math-mul-limit");
const mathStopBtn = document.getElementById("math-stop");
document.getElementById("math-new").addEventListener("click", generateMathTask);
mathStopBtn.addEventListener("click", stopMathExercise);
mathNumberSizeEl.addEventListener("change", updateMathControls);
mathOperationEl.addEventListener("change", updateMathControls);

mathForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.math.answer === null) return;
  const value = Number(mathAnswer.value);
  const correct = value === state.math.answer;
  const tookSec = stopMathTimer();
  applyModeResult("math", correct, { timeSec: tookSec });

  if (correct) {
    mathFeedback.textContent = `Верно. Время: ${tookSec.toFixed(1)} сек`;
    mathFeedback.className = "feedback ok";
  } else {
    mathFeedback.textContent = `Ошибка. Правильный ответ: ${state.math.answer}`;
    mathFeedback.className = "feedback bad";
  }
  mathForm.reset();
  state.math.answer = null;
  mathTaskEl.textContent = "Нажми «Новый пример»";
});

function generateMathTask() {
  stopMathTimer();
  const numberSize = mathNumberSizeEl.value;
  const operation = mathOperationEl.value;
  let bounds = numberSize === "two" ? { min: 10, max: 99 } : { min: 1, max: 9 };

  if (numberSize === "two") {
    bounds = { min: 10, max: Number(mathMulLimitEl.value) || 20 };
  }
  let a = 0;
  let b = 0;
  let op = "+";

  a = randomInt(bounds.min, bounds.max);
  b = randomInt(bounds.min, bounds.max);
  op = operation === "sub" ? "-" : operation === "mul" ? "*" : "+";
  if (op === "-" && b > a) [a, b] = [b, a];

  let expression = `${a} ${op} ${b}`;
  let answer = 0;
  if (op === "+") answer = a + b;
  if (op === "-") answer = a - b;
  if (op === "*") answer = a * b;

  state.math.answer = answer;
  startMathTimer();
  mathTaskEl.textContent = expression;
  mathFeedback.textContent = "";
  mathAnswer.focus();
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
  mathTaskEl.textContent = "Нажми «Новый пример»";
  mathForm.reset();
  if (hadActive) {
    mathFeedback.textContent = "Упражнение остановлено.";
    mathFeedback.className = "feedback";
  }
}

const numTaskEl = document.getElementById("num-task");
const numForm = document.getElementById("num-form");
const numFeedback = document.getElementById("num-feedback");
const numAnswer = document.getElementById("num-answer");
const numTotalRoundsEl = document.getElementById("num-total-rounds");
const numDigitPoolEl = document.getElementById("num-digit-pool");
const numDigitsCountEl = document.getElementById("num-digits-count");
const numShowSecondsEl = document.getElementById("num-show-seconds");
const numSeriesProgressEl = document.getElementById("num-series-progress");
const numTimerEl = document.getElementById("num-timer");
const numBestTimeEl = document.getElementById("num-best-time");
const numStartBtn = document.getElementById("num-start");
const numNextBtn = document.getElementById("num-next");
const numStopBtn = document.getElementById("num-stop");
numStartBtn.addEventListener("click", startNumberSeries);
numNextBtn.addEventListener("click", runNextNumberRound);
numStopBtn.addEventListener("click", stopNumberExercise);
numTotalRoundsEl.addEventListener("change", () => {
  state.numbers.totalRounds = Number(numTotalRoundsEl.value) || 6;
  if (!state.numbers.seriesActive) {
    numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
  }
});

numForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.numbers.seriesActive || !state.numbers.awaitingAnswer || !state.numbers.value) return;
  const cleanInput = (numAnswer.value || "").replace(/\D/g, "");
  const correct = cleanInput === state.numbers.value;
  if (correct) state.numbers.correctInSeries += 1;

  numFeedback.textContent = correct
    ? `Ряд ${state.numbers.seriesIndex}/${state.numbers.totalRounds}: верно`
    : `Ряд ${state.numbers.seriesIndex}/${state.numbers.totalRounds}: ошибка, было ${state.numbers.value}`;
  numFeedback.className = correct ? "feedback ok" : "feedback bad";

  state.numbers.awaitingAnswer = false;
  state.numbers.value = "";
  numForm.reset();
  if (state.numbers.seriesIndex >= state.numbers.totalRounds) {
    finishNumberSeries();
    return;
  }
  numTaskEl.textContent = "Нажми «Следующий ряд»";
  numNextBtn.disabled = false;
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
  numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
  numStartBtn.disabled = true;
  numNextBtn.disabled = true;
  if (!hadEmptyPool) numFeedback.textContent = "";
  numTaskEl.textContent = "Подготовься, начнется первый ряд";
  startNumberTimer();
  runNextNumberRound();
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
    numTaskEl.textContent = `Ряд ${state.numbers.seriesIndex}: ${value}  •  ${i}`;
    await sleep(1000);
  }
  if (!state.numbers.seriesActive) return;
  numTaskEl.textContent = `Ряд ${state.numbers.seriesIndex}: введи ${state.numbers.digitsPerRound} цифр`;
  state.numbers.awaitingAnswer = true;
  numAnswer.focus();
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
    `Серия завершена: ${state.numbers.correctInSeries}/${state.numbers.totalRounds}. Время: ${tookSec.toFixed(1)}с`;
  numFeedback.className = success ? "feedback ok" : "feedback bad";
  state.numbers.seriesActive = false;
  state.numbers.awaitingAnswer = false;
  state.numbers.value = "";
  numTaskEl.textContent = "---";
  numStartBtn.disabled = false;
  numNextBtn.disabled = true;
}

function stopNumberExercise() {
  const hadActive = state.numbers.seriesActive || Boolean(state.numbers.startedAt);
  stopNumberTimer();
  state.numbers.seriesActive = false;
  state.numbers.awaitingAnswer = false;
  state.numbers.value = "";
  state.numbers.seriesIndex = 0;
  state.numbers.correctInSeries = 0;
  state.numbers.totalRounds = Number(numTotalRoundsEl.value) || 6;
  numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
  numTaskEl.textContent = "---";
  numStartBtn.disabled = false;
  numNextBtn.disabled = true;
  numForm.reset();
  if (hadActive) {
    numFeedback.textContent = "Упражнение остановлено.";
    numFeedback.className = "feedback";
  }
}

const wordDifficulty = document.getElementById("word-difficulty");
const wordLanguageEl = document.getElementById("word-language");
const wordTargetCountEl = document.getElementById("word-target-count");
const wordTaskEl = document.getElementById("word-task");
const wordForm = document.getElementById("word-form");
const wordFeedback = document.getElementById("word-feedback");
const wordAnswer = document.getElementById("word-answer");
const wordStartBtn = document.getElementById("word-start");
const wordNextBtn = document.getElementById("word-next");
const wordReadyBtn = document.getElementById("word-ready");
const wordStopBtn = document.getElementById("word-stop");
const wordTimerEl = document.getElementById("word-timer");
const wordBestTimeEl = document.getElementById("word-best-time");
wordStartBtn.addEventListener("click", startWordRound);
wordNextBtn.addEventListener("click", revealNextWord);
wordReadyBtn.addEventListener("click", finishWordMemorizing);
wordStopBtn.addEventListener("click", stopWordExercise);

wordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.words.running || !state.words.value.length) return;
  if (state.words.phase !== "recall") {
    wordFeedback.textContent = "Нажми «Готов», чтобы скрыть слова и начать проверку.";
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

  wordFeedback.textContent = perfect
    ? `Идеально, все ${state.words.targetCount} слов по порядку. Время: ${elapsedSec.toFixed(1)}с`
    : `Верные позиции: ${hitByPosition}/${expected.length}. Время: ${elapsedSec.toFixed(1)}с`;
  wordFeedback.className = perfect ? "feedback ok" : "feedback bad";
  state.words.running = false;
  state.words.phase = "idle";
  state.words.value = [];
  state.words.revealedCount = 0;
  wordNextBtn.disabled = true;
  wordReadyBtn.disabled = true;
  wordTaskEl.textContent = "---";
  wordForm.reset();
});

function startWordRound() {
  stopWordTimer();
  state.words.targetCount = Number(wordTargetCountEl.value) || 20;
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
  wordTaskEl.textContent = "Нажми «Добавить слово», чтобы показать первое слово.";
  wordNextBtn.disabled = false;
  wordReadyBtn.disabled = false;
  startWordTimer();
  wordForm.reset();
}

function revealNextWord() {
  if (!state.words.running || !state.words.value.length) return;
  if (state.words.revealedCount >= state.words.targetCount) return;
  state.words.revealedCount += 1;
  const visibleWords = state.words.value.slice(0, state.words.revealedCount);
  wordTaskEl.textContent = visibleWords.join(" • ");
  if (state.words.revealedCount >= state.words.targetCount) {
    wordNextBtn.disabled = true;
  }
}

function finishWordMemorizing() {
  if (!state.words.running || !state.words.value.length) return;
  if (state.words.revealedCount < state.words.targetCount) {
    wordFeedback.textContent = `Открой все слова (${state.words.targetCount}/${state.words.targetCount}), затем нажми «Готов».`;
    wordFeedback.className = "feedback bad";
    return;
  }
  state.words.phase = "recall";
  wordNextBtn.disabled = true;
  wordReadyBtn.disabled = true;
  wordTaskEl.textContent = "Слова скрыты. Вводи ответ ниже.";
  wordFeedback.textContent = "";
  wordAnswer.focus();
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
  stopWordTimer();
  state.words.running = false;
  state.words.phase = "idle";
  state.words.value = [];
  state.words.revealedCount = 0;
  wordTaskEl.textContent = "---";
  wordNextBtn.disabled = true;
  wordReadyBtn.disabled = true;
  wordForm.reset();
  if (hadActive) {
    wordFeedback.textContent = "Упражнение остановлено.";
    wordFeedback.className = "feedback";
  }
}

document.getElementById("reset-progress").addEventListener("click", () => {
  if (!window.confirm("Сбросить весь сохраненный прогресс?")) return;
  stopMathTimer();
  stopNumberTimer();
  stopWordTimer();
  mathTimerEl.textContent = "Таймер: 0.0с";
  numTimerEl.textContent = "Таймер: 0.0с";
  state.numbers.totalRounds = Number(numTotalRoundsEl.value) || 6;
  numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
  wordTimerEl.textContent = "Таймер: 0.0с";
  state.progress = structuredClone(defaults);
  persist();
  updateMathBestTime();
  updateNumberBestTime();
  updateWordBestTime();
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

  state.progress.sessions.unshift({
    mode,
    success,
    at: new Date().toISOString(),
    score: extra.span || extra.count || null,
  });
  state.progress.sessions = state.progress.sessions.slice(0, 20);

  persist();
  renderProgress();
}

function renderProgress() {
  const math = state.progress.math;
  const numbers = state.progress.numbers;
  const words = state.progress.words;

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
    const modeLabel = { math: "Счет", numbers: "Числа", words: "Слова" }[entry.mode];
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

updateMathControls();
state.numbers.totalRounds = Number(numTotalRoundsEl.value) || state.numbers.totalRounds;
numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
updateMathBestTime();
updateNumberBestTime();
updateWordBestTime();
renderProgress();
