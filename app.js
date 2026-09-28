const STORAGE_KEY = "mnemonic_lab_progress_v1";
const MEMORY_CARDS_KEY = "mnemonic_lab_memory_cards_v1";
const LEGACY_MEMORY_PROFILES_KEY = "memory-number-cards-by-login";
const LEGACY_MEMORY_CARDS_KEY = "memory-number-cards";

const defaults = {
  math: { attempts: 0, correct: 0, bestStreak: 0, streak: 0, bestTimeSec: null },
  numbers: { attempts: 0, correct: 0, bestLength: 0, streak: 0, bestTimeSec: null },
  words: { attempts: 0, correct: 0, bestCount: 0, streak: 0, bestTimeSec: null },
  memory: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  balda: { attempts: 0, correct: 0, streak: 0, bestStreak: 0, bestTimeSec: null },
  attention: { attempts: 0, correct: 0, streak: 0, bestStreak: 0 },
  schulte: { attempts: 0, correct: 0, bestStreak: 0, streak: 0, bestTimeSec: null, bestSize: 0 },
  exam: { bestTimeSec: null },
  sessions: [],
};

const state = {
  progress: loadProgress(),
  math: {
    answer: null,
    startedAt: null,
    timerId: null,
    seriesActive: false,
    seriesIndex: 0,
    totalRounds: 5,
    correctInSeries: 0,
    reviewRows: [],
    taskConfig: null,
  },
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
    showSeconds: 1,
    allowedDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    correctInSeries: 0,
    awaitingAnswer: false,
    reviewRows: [],
    phase: "prep",
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
    stage: "prep",
  },
  balda: {
    chain: ["маска", "миска", "мишка", "мышка", "мышца"],
    chains: {
      3: [["лук", "лак", "мак", "май", "рай"]],
      4: [["коза", "роза", "роса", "коса", "кора"]],
      5: [["маска", "миска", "мишка", "мышка", "мышца"]],
    },
    currentStep: 0,
    active: false,
    startedAt: null,
    timerId: null,
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
    useLetters: false,
    startedAt: null,
    timerId: null,
    active: false,
    errors: 0,
    stage: "prep",
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

let wordPoolRuSimple = [
  "солнце", "ручка", "река", "книга", "кофе", "мост", "парус", "яблоко",
  "огонь", "дверь", "зебра", "океан", "память", "часы", "камень", "птица",
  "карандаш", "город", "весна", "снег", "груша", "чашка", "лес", "волна",
  "театр", "карта", "лист", "лампа", "ветер", "стакан", "музыка", "площадь",
  "хлеб", "свеча", "цветок", "дорога", "письмо", "звезда", "щит", "метро",
  "сыр", "космос", "клавиша", "фонарь", "озеро", "радуга", "сахар", "школа",
];
let wordPoolRuComplex = [
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
let wordPoolEnSimple = [
  "sun", "pen", "river", "book", "coffee", "bridge", "apple", "fire",
  "door", "ocean", "memory", "clock", "stone", "bird", "city", "spring",
  "snow", "cup", "forest", "wave", "map", "leaf", "lamp", "wind",
  "music", "flower", "road", "letter", "star", "shield", "metro", "lake",
  "rainbow", "sugar", "school", "bread", "candle", "planet", "window", "garden",
  "smile", "voice", "pencil", "table", "mountain", "cloud", "beach", "island",
];
let wordPoolEnComplex = [
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
const trainerFilters = [...document.querySelectorAll(".trainer-filter")];
const trainerCards = [...document.querySelectorAll(".trainer-card")];
const trainerDetailHeader = document.getElementById("trainer-detail-header");
const trainerDetailIntro = document.getElementById("trainer-detail-intro");
const trainerMenuToggle = document.getElementById("trainer-menu-toggle");
const trainerDrawerLayer = document.getElementById("trainer-drawer-layer");
const trainerDrawerBackdrop = document.getElementById("trainer-drawer-backdrop");
const trainerDrawerHome = document.getElementById("trainer-drawer-home");
const trainerCatalogLink = document.getElementById("trainer-catalog-link");
const trainerCurrentName = document.getElementById("trainer-current-name");
const trainerDetailTitle = document.getElementById("trainer-detail-title");
const trainerDetailDescription = document.getElementById("trainer-detail-description");
const trainerSteps = [...document.querySelectorAll(".trainer-step")];
const trainerStepsEl = document.querySelector(".trainer-steps");
const syncStickyHeader = () => {
  trainerDetailHeader.classList.toggle("is-scrolled", window.scrollY > 12);
};

window.addEventListener("scroll", syncStickyHeader, { passive: true });
syncStickyHeader();
const panels = {
  math: document.getElementById("math-panel"),
  "number-series": document.getElementById("number-series-panel"),
  numbers: document.getElementById("numbers-panel"),
  words: document.getElementById("words-panel"),
  attention: document.getElementById("attention-panel"),
  schulte: document.getElementById("schulte-panel"),
  balda: document.getElementById("balda-panel"),
  exam: document.getElementById("exam-panel"),
  progress: document.getElementById("progress-panel"),
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const key = tab.dataset.tab;
    closeTrainerDrawer();
    if (window.location.hash === `#${key}`) {
      openTrainerPage(key);
      return;
    }
    window.location.hash = key;
  });
});

trainerMenuToggle.addEventListener("click", openTrainerDrawer);
trainerDrawerBackdrop.addEventListener("click", closeTrainerDrawer);
trainerCatalogLink.addEventListener("click", openCatalogRoute);
trainerDrawerHome.addEventListener("click", openCatalogRoute);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeTrainerDrawer();
});

window.addEventListener("hashchange", syncTrainerRoute);

trainerFilters.forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    const filter = filterButton.dataset.filter;
    trainerFilters.forEach((button) => {
      const isActive = button === filterButton;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    trainerCards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

function openTrainerPage(key) {
  if (!panels[key]) return;
  document.body.classList.add("trainer-page-open");
  document.body.classList.remove("trainer-home");
  trainerDetailIntro.hidden = false;
  tabs.forEach((button) => button.classList.toggle("active", button.dataset.tab === key));
  Object.entries(panels).forEach(([name, panel]) => {
    panel.classList.toggle("active", name === key);
  });
  if (key === "progress") renderProgress();
  const title = panels[key].querySelector(".panel-head h2")?.textContent?.trim();
  const description = panels[key].querySelector(".panel-head p")?.textContent?.trim();
  trainerCurrentName.textContent = title || "Тренажёр";
  trainerDetailTitle.textContent = title || "Тренажёр";
  trainerDetailDescription.textContent = description || "";
  trainerStepsEl.hidden = key === "progress";
  setTrainerStage(1);
  if (key === "math") setMathStage(state.math.answer === null ? "prep" : "task");
  if (key === "number-series") setNumberStage(state.numbers.phase);
  if (key === "words") setWordStage(state.words.stage);
  if (key === "schulte") setSchulteStage(state.schulte.stage);
  document.title = title ? `${title} — Mnemonic Lab` : "Mnemonic Lab";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setTrainerStage(stage) {
  trainerSteps.forEach((step, index) => {
    step.classList.toggle("active", index + 1 === stage);
  });
}

function openTrainerCatalog() {
  closeTrainerDrawer();
  document.body.classList.remove("trainer-page-open");
  document.body.classList.add("trainer-home");
  trainerDetailIntro.hidden = true;
  trainerCurrentName.textContent = "";
  tabs.forEach((button) => button.classList.remove("active"));
  Object.values(panels).forEach((panel) => panel.classList.remove("active"));
  document.title = "Mnemonic Lab";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openCatalogRoute() {
  if (window.location.hash === "#home" || !window.location.hash) {
    openTrainerCatalog();
    return;
  }
  window.location.hash = "home";
}

function openTrainerDrawer() {
  trainerDrawerLayer.hidden = false;
  document.body.classList.add("trainer-drawer-open");
  trainerDrawerHome.focus();
}

function closeTrainerDrawer() {
  trainerDrawerLayer.hidden = true;
  document.body.classList.remove("trainer-drawer-open");
}

function syncTrainerRoute() {
  const key = window.location.hash.slice(1);
  if (panels[key]) {
    openTrainerPage(key);
  } else {
    openTrainerCatalog();
  }
}

window.addEventListener("load", syncTrainerRoute);

const mathTaskEl = document.getElementById("math-task");
const mathPanelEl = document.getElementById("math-panel");
const mathForm = document.getElementById("math-form");
const mathAnswer = document.getElementById("math-answer");
const mathFeedback = document.getElementById("math-feedback");
const mathSubmitBtn = mathForm.querySelector('button[type="submit"]');
const mathTimerEl = document.getElementById("math-timer");
const mathBestTimeEl = document.getElementById("math-best-time");
const mathDifficultyEl = document.getElementById("math-difficulty");
const mathTotalRoundsEl = document.getElementById("math-total-rounds");
const mathSeriesProgressEl = document.getElementById("math-series-progress");
const mathReviewEl = document.getElementById("math-review");
const mathDifficultyWrap = document.getElementById("math-difficulty-wrap");
const mathDifficultyPreviewEl = document.getElementById("math-difficulty-preview");
const mathPreviewTagsEl = document.getElementById("math-preview-tags");
const mathPreviewRangesEl = document.getElementById("math-preview-ranges");
const mathPreviewNumberTypeEl = document.getElementById("math-preview-number-type");
const mathPreviewExamplesEl = document.getElementById("math-preview-examples");
const mathChoiceDividerEl = document.querySelector(".math-choice-divider");
const mathCustomToggleBtn = document.getElementById("math-custom-toggle");
const mathCustomSettingsEl = document.getElementById("math-custom-settings");
const mathNumberSizeEl = document.getElementById("math-number-size");
const mathOperationEl = document.getElementById("math-operation");
const mathMulLimitWrap = document.getElementById("math-mul-limit-wrap");
const mathMulLimitEl = document.getElementById("math-mul-limit");
const mathNewBtn = document.getElementById("math-new");
const mathAgainBtn = document.getElementById("math-again");
const mathStopBtn = document.getElementById("math-stop");
const mathHelpEl = document.getElementById("math-help");
mathNewBtn.addEventListener("click", generateMathTask);
mathAgainBtn.addEventListener("click", resetMathExercise);
mathStopBtn.addEventListener("click", stopMathExercise);
mathCustomToggleBtn.addEventListener("click", toggleCustomMathSettings);
mathDifficultyEl.addEventListener("change", updateMathDifficultyPreview);
mathNumberSizeEl.addEventListener("change", updateCustomMathControls);
mathOperationEl.addEventListener("change", updateCustomMathControls);
mathAnswer.addEventListener("input", syncMathControls);

mathForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.math.answer === null) return;
  const value = Number((mathAnswer.value || "").trim());
  const correct = value === state.math.answer;
  if (correct) state.math.correctInSeries += 1;
  state.math.reviewRows.push({
    index: state.math.seriesIndex,
    expression: mathTaskEl.textContent,
    expected: state.math.answer,
    actual: value,
    correct,
  });
  mathForm.reset();
  state.math.answer = null;
  if (state.math.seriesIndex >= state.math.totalRounds) {
    finishMathSeries();
  } else {
    showNextMathTask();
  }
});

function getMathTaskConfig() {
  if (!mathCustomSettingsEl.hidden) {
    const operation = mathOperationEl.value;
    const bounds = mathNumberSizeEl.value === "two"
      ? { min: 10, max: Number(mathMulLimitEl.value) || 20 }
      : { min: 1, max: 9 };

    return { operation, bounds };
  }

  const difficulty = mathDifficultyEl.value;
  const operations = difficulty === "hard" || difficulty === "expert"
    ? ["mul"]
    : difficulty === "medium"
      ? ["add", "sub"]
      : ["add", "sub", "mul"];
  const operation = operations[randomInt(0, operations.length - 1)];

  if (difficulty === "easy") {
    return { operation, bounds: { min: 1, max: 9 } };
  }

  if (difficulty === "hard") {
    return { operation, bounds: { min: 1, max: 9 } };
  }

  if (difficulty === "expert") {
    return { operation, bounds: { min: 10, max: 99 } };
  }

  return { operation, bounds: { min: 10, max: 99 } };
}

function toggleCustomMathSettings() {
  setCustomMathSettingsVisible(mathCustomSettingsEl.hidden);
}

function setCustomMathSettingsVisible(visible) {
  mathCustomSettingsEl.hidden = !visible;
  mathCustomSettingsEl.closest(".math-action-controls").classList.toggle("custom-mode", visible);
  mathDifficultyWrap.hidden = visible;
  mathDifficultyPreviewEl.hidden = visible;
  mathChoiceDividerEl.hidden = visible;
  mathCustomToggleBtn.setAttribute("aria-expanded", String(visible));
  mathCustomToggleBtn.classList.toggle("active", visible);
  mathCustomToggleBtn.textContent = visible ? "Готовое упражнение" : "Свой пример";
  updateCustomMathControls();
  syncMathControls();
}

const mathDifficultyPreviews = {
  easy: {
    tags: ["Сложение", "Вычитание", "Умножение"],
    ranges: ["1–9"],
    numberType: "Однозначные",
    examples: ["7 + 4", "9 − 3", "6 × 8"],
  },
  medium: {
    tags: ["Сложение", "Вычитание"],
    ranges: ["До 100"],
    numberType: "Двузначные",
    examples: ["47 + 28", "83 − 36", "64 + 19"],
  },
  hard: {
    tags: ["Умножение"],
    ranges: ["До 10"],
    numberType: "Однозначные",
    examples: ["7 × 4", "9 × 3", "6 × 8"],
  },
  expert: {
    tags: ["Умножение"],
    ranges: ["До 100"],
    numberType: "Двузначные",
    examples: ["24 × 36", "57 × 42", "83 × 69"],
  },
};

function updateMathDifficultyPreview() {
  const preview = mathDifficultyPreviews[mathDifficultyEl.value] || mathDifficultyPreviews.easy;
  const createPill = (text) => {
    const element = document.createElement("span");
    element.textContent = text;
    return element;
  };
  mathPreviewTagsEl.replaceChildren(...preview.tags.map(createPill));
  mathPreviewRangesEl.replaceChildren(...preview.ranges.map(createPill));
  mathPreviewNumberTypeEl.replaceChildren(createPill(preview.numberType));
  mathPreviewExamplesEl.replaceChildren(...preview.examples.map((example) => {
    const element = document.createElement("span");
    element.textContent = example;
    return element;
  }));
}

function updateCustomMathControls() {
  const showRange = mathNumberSizeEl.value === "two";
  mathMulLimitWrap.hidden = !showRange;
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
  state.math.seriesActive = true;
  state.math.seriesIndex = 0;
  state.math.totalRounds = Number(mathTotalRoundsEl.value) || 1;
  state.math.correctInSeries = 0;
  state.math.reviewRows = [];
  state.math.taskConfig = getMathTaskConfig();
  mathReviewEl.hidden = true;
  mathReviewEl.innerHTML = "";
  mathFeedback.textContent = "";
  mathSeriesProgressEl.hidden = false;
  startMathTimer();
  setMathStage("task");
  showNextMathTask();
}

function showNextMathTask() {
  const task = buildMathTask(state.math.taskConfig);
  state.math.seriesIndex += 1;
  state.math.answer = task.answer;
  mathSeriesProgressEl.textContent = `Пример: ${state.math.seriesIndex}/${state.math.totalRounds}`;
  mathSubmitBtn.textContent = state.math.seriesIndex === state.math.totalRounds
    ? "Проверить"
    : "Дальше";
  mathTaskEl.hidden = false;
  mathTaskEl.textContent = task.expression.replace("*", "×");
  mathTaskEl.classList.remove("challenge-hint");
  mathAnswer.focus();
  syncMathControls();
}

function finishMathSeries() {
  const tookSec = stopMathTimer();
  const success = state.math.correctInSeries === state.math.totalRounds;
  applyModeResult("math", success, { timeSec: tookSec });
  const bestTimeSec = state.progress.math.bestTimeSec;
  mathFeedback.innerHTML = `
    <span class="math-result-title">${success ? "Верно!" : "Неверно"}</span>
    <span class="math-result-answer">Правильных ответов: ${state.math.correctInSeries}/${state.math.totalRounds}</span>
    <span class="math-result-details">
      <span class="math-result-stat math-result-time"><span>Время</span><strong>${formatSeconds(tookSec)}</strong></span>
      <span class="math-result-stat math-result-record"><span>Рекорд</span><strong>${formatSeconds(bestTimeSec)}</strong></span>
    </span>`;
  mathFeedback.className = `feedback ${success ? "ok" : "bad"}`;
  renderMathReview();
  state.math.seriesActive = false;
  state.math.answer = null;
  mathSeriesProgressEl.hidden = true;
  setMathStage("result");
  syncMathControls();
}

function renderMathReview() {
  mathReviewEl.innerHTML = `
    <div class="word-review-head"><strong>Разбор упражнения</strong></div>
    <div class="word-review-grid">${state.math.reviewRows.map((row) => `
      <div class="word-review-row ${row.correct ? "is-ok" : "is-bad"}">
        <div class="word-review-index">${row.index}</div>
        <div class="word-review-columns">
          <div class="word-review-col">
            <span class="word-review-label">Правильный ответ</span>
            <span class="word-chip expected">${escapeHtml(row.expression)} = ${row.expected}</span>
          </div>
          <div class="word-review-col">
            <span class="word-review-label">Твой ответ</span>
            <span class="word-chip actual ${row.correct ? "ok" : "bad"}">${row.actual}</span>
          </div>
        </div>
      </div>`).join("")}</div>`;
  mathReviewEl.hidden = false;
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
  state.math.seriesActive = false;
  state.math.seriesIndex = 0;
  state.math.reviewRows = [];
  mathSeriesProgressEl.hidden = true;
  mathReviewEl.hidden = true;
  mathReviewEl.innerHTML = "";
  setMathTaskPlaceholder("Нажми «Решать»");
  setMathStage("prep");
  mathForm.reset();
  if (hadActive) {
    mathFeedback.textContent = "Упражнение остановлено.";
    mathFeedback.className = "feedback";
  }
  syncMathControls();
}

function resetMathExercise() {
  stopMathTimer();
  state.math.answer = null;
  state.math.seriesActive = false;
  state.math.seriesIndex = 0;
  state.math.reviewRows = [];
  mathSeriesProgressEl.hidden = true;
  mathReviewEl.hidden = true;
  mathReviewEl.innerHTML = "";
  mathForm.reset();
  mathFeedback.textContent = "";
  mathFeedback.className = "feedback";
  setMathTaskPlaceholder("Нажми «Решать»");
  setMathStage("prep");
  syncMathControls();
  mathNewBtn.focus();
}

function setMathStage(stage) {
  mathPanelEl.classList.remove("math-stage-prep", "math-stage-task", "math-stage-result");
  mathPanelEl.classList.add(`math-stage-${stage}`);
  mathHelpEl.hidden = stage !== "prep";
  setTrainerStage(stage === "prep" ? 1 : stage === "task" ? 2 : 3);
}

function syncMathControls() {
  const hasActiveTask = state.math.seriesActive;
  mathNewBtn.disabled = hasActiveTask;
  mathDifficultyEl.disabled = hasActiveTask;
  mathCustomToggleBtn.disabled = hasActiveTask;
  mathNumberSizeEl.disabled = hasActiveTask;
  mathOperationEl.disabled = hasActiveTask;
  mathMulLimitEl.disabled = hasActiveTask;
  mathTotalRoundsEl.disabled = hasActiveTask;
  mathSubmitBtn.disabled = state.math.answer === null || !mathAnswer.value.trim();
  mathStopBtn.disabled = state.math.answer === null && !state.math.startedAt;
  mathAnswer.disabled = state.math.answer === null;
}

function setMathTaskPlaceholder(text) {
  mathTaskEl.textContent = text;
  mathTaskEl.classList.add("challenge-hint");
  mathTaskEl.hidden = true;
}

const numTaskEl = document.getElementById("num-task");
const numForm = document.getElementById("num-form");
const numFeedback = document.getElementById("num-feedback");
const numAnswer = document.getElementById("num-answer");
const numSubmitBtn = numForm.querySelector('button[type="submit"]');
const numTotalRoundsEl = document.getElementById("num-total-rounds");
const numDigitsCountEl = document.getElementById("num-digits-count");
const numShowSecondsEl = document.getElementById("num-show-seconds");
const numSeriesProgressEl = document.getElementById("num-series-progress");
const numTimerEl = document.getElementById("num-timer");
const numBestTimeEl = document.getElementById("num-best-time");
const numReviewEl = document.getElementById("num-review");
const numDifficultyEl = document.getElementById("num-difficulty");
const numDifficultyWrap = document.getElementById("num-difficulty-wrap");
const numDifficultyPreviewEl = document.getElementById("num-difficulty-preview");
const numPreviewDigitsEl = document.getElementById("num-preview-digits");
const numPreviewDurationEl = document.getElementById("num-preview-duration");
const numPreviewExamplesEl = document.getElementById("num-preview-examples");
const numChoiceDividerEl = document.querySelector(".num-choice-divider");
const numCustomToggleBtn = document.getElementById("num-custom-toggle");
const numCustomSettingsEl = document.getElementById("num-custom-settings");
const numStartBtn = document.getElementById("num-start");
const numAgainBtn = document.getElementById("num-again");
const numNextBtn = document.getElementById("num-next");
const numStopBtn = document.getElementById("num-stop");
numStartBtn.addEventListener("click", startNumberSeries);
numAgainBtn.addEventListener("click", resetNumberExercise);
numCustomToggleBtn.addEventListener("click", toggleCustomNumberSettings);
numNextBtn.addEventListener("click", runNextNumberRound);
numStopBtn.addEventListener("click", stopNumberExercise);
numAnswer.addEventListener("input", syncNumberControls);
numDifficultyEl.addEventListener("change", updateNumberDifficultyPreview);
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
  const config = getNumberSeriesConfig();
  state.numbers.totalRounds = config.totalRounds;
  state.numbers.digitsPerRound = config.digitsPerRound;
  state.numbers.showSeconds = config.showSeconds;
  state.numbers.allowedDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
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
  numFeedback.textContent = "";
  numSeriesProgressEl.hidden = false;
  numTimerEl.hidden = false;
  numBestTimeEl.hidden = false;
  numTaskEl.hidden = false;
  numTaskEl.textContent = "Подготовься, начнется первый ряд";
  numTaskEl.classList.add("challenge-hint");
  startNumberTimer();
  setNumberStage("task");
  runNextNumberRound();
  syncNumberControls();
}

function getNumberSeriesConfig() {
  if (!numCustomSettingsEl.hidden) {
    return {
      totalRounds: Number(numTotalRoundsEl.value) || 6,
      digitsPerRound: Number(numDigitsCountEl.value) || 6,
      showSeconds: Number(numShowSecondsEl.value) || 1,
    };
  }

  const presets = {
    easy: { totalRounds: 3, digitsPerRound: 3, showSeconds: 2 },
    medium: { totalRounds: 4, digitsPerRound: 4, showSeconds: 1.5 },
    hard: { totalRounds: 5, digitsPerRound: 5, showSeconds: 1 },
    expert: { totalRounds: 6, digitsPerRound: 6, showSeconds: 0.5 },
  };
  return presets[numDifficultyEl.value] || presets.easy;
}

function toggleCustomNumberSettings() {
  setCustomNumberSettingsVisible(numCustomSettingsEl.hidden);
}

function setCustomNumberSettingsVisible(visible) {
  numCustomSettingsEl.hidden = !visible;
  numCustomSettingsEl.closest(".num-action-controls").classList.toggle("custom-mode", visible);
  numDifficultyWrap.hidden = visible;
  numDifficultyPreviewEl.hidden = visible;
  numChoiceDividerEl.hidden = visible;
  numCustomToggleBtn.setAttribute("aria-expanded", String(visible));
  numCustomToggleBtn.classList.toggle("active", visible);
  numCustomToggleBtn.textContent = visible ? "Готовое упражнение" : "Свой пример";
  updateNumberDifficultyPreview();
  syncNumberControls();
}

const numberDifficultyPreviews = {
  easy: {
    digits: "3",
    duration: "2 сек.",
    examples: ["4 8 2", "7 1 9", "3 6 5"],
  },
  medium: {
    digits: "4",
    duration: "1,5 сек.",
    examples: ["5 2 8 1", "9 4 6 3", "7 0 2 5"],
  },
  hard: {
    digits: "5",
    duration: "1 сек.",
    examples: ["8 3 7 1 6", "4 9 2 5 0", "6 1 8 4 7"],
  },
  expert: {
    digits: "6",
    duration: "0,5 сек.",
    examples: ["9 2 6 4 1 8", "3 7 0 5 9 2", "6 1 8 3 7 4"],
  },
};

function updateNumberDifficultyPreview() {
  const config = getNumberSeriesConfig();
  state.numbers.totalRounds = config.totalRounds;
  if (!state.numbers.seriesActive) {
    numSeriesProgressEl.textContent = `Ряд: 0/${config.totalRounds}`;
  }
  if (!numCustomSettingsEl.hidden) return;

  const preview = numberDifficultyPreviews[numDifficultyEl.value] || numberDifficultyPreviews.easy;
  const createPill = (text) => {
    const element = document.createElement("span");
    element.textContent = text;
    return element;
  };
  numPreviewDigitsEl.replaceChildren(createPill(preview.digits));
  numPreviewDurationEl.replaceChildren(createPill(preview.duration));
  numPreviewExamplesEl.replaceChildren(...preview.examples.map((example) => {
    const element = document.createElement("span");
    element.textContent = example;
    return element;
  }));
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

  if (!state.numbers.seriesActive) return;
  numTaskEl.textContent = value;
  numTaskEl.classList.remove("challenge-hint");
  numTaskEl.classList.add("mono");
  await sleep(state.numbers.showSeconds * 1000);
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

  const bestTimeSec = state.progress.numbers.bestTimeSec;
  numFeedback.innerHTML = `
    <span class="math-result-title">${success ? "Верно!" : "Неверно"}</span>
    <span class="math-result-answer">Правильных рядов: ${state.numbers.correctInSeries}/${state.numbers.totalRounds}</span>
    <span class="math-result-details">
      <span class="math-result-stat math-result-time"><span>Время</span><strong>${formatSeconds(tookSec)}</strong></span>
      <span class="math-result-stat math-result-record"><span>Рекорд</span><strong>${formatSeconds(bestTimeSec)}</strong></span>
    </span>
  `;
  numFeedback.className = `feedback ${success ? "ok" : "bad"}`;
  renderNumberReview(state.numbers.reviewRows);
  state.numbers.seriesActive = false;
  state.numbers.awaitingAnswer = false;
  state.numbers.value = "";
  setNumberTaskPlaceholder("Нажми «Новый пример»");
  numStartBtn.disabled = false;
  numNextBtn.disabled = true;
  numNextBtn.hidden = true;
  setNumberStage("result");
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
  state.numbers.totalRounds = getNumberSeriesConfig().totalRounds;
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
  setNumberStage("prep");
  syncNumberControls();
}

function resetNumberExercise() {
  stopNumberExercise();
  numFeedback.textContent = "";
  numFeedback.className = "feedback";
  numStartBtn.focus();
}

function setNumberStage(stage) {
  const numPanelEl = document.getElementById("number-series-panel");
  numPanelEl.classList.remove("num-stage-prep", "num-stage-task", "num-stage-result");
  numPanelEl.classList.add(`num-stage-${stage}`);
  state.numbers.phase = stage;
  setTrainerStage(stage === "prep" ? 1 : stage === "task" ? 2 : 3);
}

function renderNumberReview(reviewRows) {
  const rows = [];
  for (const row of reviewRows) {
    const actual = row.actual || "Пропуск";
    rows.push(`
      <div class="num-review-row ${row.correct ? "is-ok" : "is-bad"}">
        <div class="num-review-index">${row.index}</div>
        <div class="num-review-columns">
          <div class="num-review-col">
            <span class="num-review-label">Правильный ответ</span>
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
      <strong>Разбор упражнения</strong>
    </div>
    <div class="num-review-grid">${rows.join("")}</div>
  `;
  numReviewEl.hidden = false;
}

function syncNumberControls() {
  numStartBtn.disabled = state.numbers.seriesActive;
  numDifficultyEl.disabled = state.numbers.seriesActive;
  numCustomToggleBtn.disabled = state.numbers.seriesActive;
  numTotalRoundsEl.disabled = state.numbers.seriesActive;
  numDigitsCountEl.disabled = state.numbers.seriesActive;
  numShowSecondsEl.disabled = state.numbers.seriesActive;
  numSubmitBtn.disabled =
    !state.numbers.seriesActive || !state.numbers.awaitingAnswer || !state.numbers.value || !numAnswer.value.trim();
  numStopBtn.disabled = !state.numbers.seriesActive && !state.numbers.startedAt;
  numAnswer.disabled = !state.numbers.seriesActive || !state.numbers.awaitingAnswer || !state.numbers.value;
}

function setNumberTaskPlaceholder(text) {
  numTaskEl.textContent = text;
  numTaskEl.classList.add("challenge-hint");
  numTaskEl.classList.remove("mono");
  numTaskEl.hidden = true;
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
  const config = getNumberSeriesConfig();
  return {
    digitsPerRound: config.digitsPerRound,
    showSeconds: config.showSeconds,
    allowedDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
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
const examReviewEl = document.getElementById("exam-review");
const examSubmitBtn = document.getElementById("exam-submit");
const examSkipBtn = document.getElementById("exam-skip");
const examDifficultyEl = document.getElementById("exam-difficulty");
const examStartBtn = document.getElementById("exam-start");
const examStopBtn = document.getElementById("exam-stop");
const examProgressEl = document.getElementById("exam-progress");
const examTimerEl = document.getElementById("exam-timer");
const examBestTimeEl = document.getElementById("exam-best-time");
const examResultMetricsEl = document.getElementById("exam-result-metrics");

examStartBtn.addEventListener("click", startExam);
examSkipBtn.addEventListener("click", skipExamTask);
examStopBtn.addEventListener("click", stopExamExercise);
examAnswer.addEventListener("input", syncExamControls);
examDifficultyEl.addEventListener("change", updateExamStats);

examForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.exam.active || state.exam.phase !== "answering" || !state.exam.currentTask) return;

  const task = state.exam.currentTask;
  const rawValue = (examAnswer.value || "").trim();
  let correct = false;
  let expected = "";
  let actual = rawValue;

  if (task.kind === "math") {
    correct = Number(rawValue) === task.answer;
    expected = String(task.answer);
  } else if (task.kind === "numbers") {
    const actualRows = rawValue.match(/\d+/g) || [];
    correct = arraysEqual(actualRows, task.values);
    expected = task.values.join(" / ");
    actual = actualRows.join(" / ");
  } else if (task.kind === "words") {
    const actualWords = normalizeWords(rawValue);
    const expectedWords = task.words.map(normalizeWordToken);
    correct = arraysEqual(actualWords, expectedWords);
    expected = task.words.join(" / ");
    actual = actualWords.join(" / ");
  } else if (task.kind === "balda") {
    const actualWords = normalizeWords(rawValue);
    const expectedWords = task.chain.slice(1).map(normalizeWordToken);
    correct = arraysEqual(actualWords, expectedWords);
    expected = task.chain.slice(1).join(" / ");
    actual = actualWords.join(" / ");
  }

  state.exam.results.push({
    index: state.exam.results.length + 1,
    kind: task.kind,
    prompt: getExamTaskPrompt(task),
    expected,
    actual,
    correct,
  });
  if (correct) state.exam.correctCount += 1;

  examFeedback.textContent = "";
  examFeedback.className = "feedback";
  examForm.reset();
  state.exam.phase = "transition";
  updateExamStats();
  syncExamControls();

  await sleep(800);
  if (!state.exam.active || state.exam.currentTask !== task) return;
  runNextExamTask();
});

function buildExamQueue() {
  const difficulty = examDifficultyEl.value;
  const mathOperations = difficulty === "easy" || difficulty === "medium"
    ? ["add", "sub", "mul"]
    : ["mul"];
  const mathOperation = mathOperations[randomInt(0, mathOperations.length - 1)];
  const mathBounds = difficulty === "easy"
    ? { min: 1, max: 9 }
    : difficulty === "medium" && mathOperation === "mul"
      ? { min: 10, max: 20 }
      : difficulty === "medium"
        ? { min: 10, max: 99 }
        : { min: 20, max: 100 };
  const numberPresets = {
    easy: { totalRounds: 3, digitsPerRound: 3, showSeconds: 2 },
    medium: { totalRounds: 4, digitsPerRound: 4, showSeconds: 1.5 },
    hard: { totalRounds: 5, digitsPerRound: 5, showSeconds: 1 },
    expert: { totalRounds: 6, digitsPerRound: 6, showSeconds: 0.5 },
  };
  const wordPresets = {
    easy: { count: 10, showSeconds: 5, isComplex: false },
    medium: { count: 20, showSeconds: 4, isComplex: false },
    hard: { count: 10, showSeconds: 3, isComplex: true },
    expert: { count: 20, showSeconds: 2, isComplex: true },
  };
  const numberConfig = numberPresets[difficulty] || numberPresets.easy;
  const wordConfig = wordPresets[difficulty] || wordPresets.easy;
  const wordPool = wordConfig.isComplex ? wordPoolRuComplex : wordPoolRuSimple;
  const schulteSize = difficulty === "easy" ? 4 : difficulty === "medium" ? 5 : 6;
  const baldaLength = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  const baldaChains = state.balda.chains[baldaLength] || state.balda.chains[5];

  const tasks = [
    buildMathTask({ operation: mathOperation, bounds: mathBounds }),
    {
      kind: "numbers",
      values: Array.from(
        { length: numberConfig.totalRounds },
        () => generateDigits(numberConfig.digitsPerRound, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      ),
      showSeconds: numberConfig.showSeconds,
    },
    {
      kind: "words",
      words: shuffle(wordPool).slice(0, wordConfig.count),
      showSeconds: wordConfig.showSeconds,
    },
    {
      kind: "schulte",
      size: schulteSize,
      useLetters: difficulty === "hard" || difficulty === "expert",
      values: shuffle(Array.from({ length: schulteSize * schulteSize }, (_, index) => index + 1)),
      nextValue: 1,
    },
    {
      kind: "balda",
      chain: [...baldaChains[randomInt(0, baldaChains.length - 1)]],
    },
  ];

  return shuffle(difficulty === "expert"
    ? tasks.filter((task) => task.kind === "numbers" || task.kind === "words")
    : tasks);
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
  examReviewEl.hidden = true;
  examReviewEl.innerHTML = "";
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
  state.exam.phase = task.kind === "math" || task.kind === "balda" ? "answering" : "showing";
  examFeedback.textContent = "";
  examFeedback.className = "feedback";
  examForm.reset();
  examSummaryEl.hidden = true;
  examReviewEl.hidden = true;
  updateExamStats();

  if (task.kind === "math") presentExamMathTask(task);
  if (task.kind === "numbers") presentExamNumberTask(task);
  if (task.kind === "words") presentExamWordsTask(task);
  if (task.kind === "schulte") presentExamSchulteTask(task);
  if (task.kind === "balda") presentExamBaldaTask(task);

  syncExamControls();
}

function presentExamMathTask(task) {
  examTaskEl.textContent = task.expression;
  examTaskEl.classList.remove("challenge-hint", "mono", "words");
  examAnswer.focus();
}

async function presentExamNumberTask(task) {
  const revealToken = state.exam.revealToken;
  examTaskEl.classList.remove("challenge-hint");
  examTaskEl.classList.add("mono");
  syncExamControls();

  for (let index = 0; index < task.values.length; index += 1) {
    if (!isCurrentExamReveal(task, revealToken)) return;
    examTaskEl.textContent = `Ряд ${index + 1}/${task.values.length}: ${task.values[index]}`;
    await sleep(task.showSeconds * 1000);
  }

  if (!isCurrentExamReveal(task, revealToken)) return;
  state.exam.phase = "answering";
  examTaskEl.textContent = "Введи показанные ряды по порядку";
  examTaskEl.classList.add("challenge-hint");
  examTaskEl.classList.remove("mono");
  examAnswer.focus();
  syncExamControls();
}

async function presentExamWordsTask(task) {
  const revealToken = state.exam.revealToken;
  examTaskEl.classList.remove("challenge-hint", "mono");
  examTaskEl.classList.add("words");
  syncExamControls();

  for (let index = 0; index < task.words.length; index += 1) {
    if (!isCurrentExamReveal(task, revealToken)) return;
    examTaskEl.textContent = task.words.slice(0, index + 1).join(" • ");
    await sleep(task.showSeconds * 1000);
  }

  if (!isCurrentExamReveal(task, revealToken)) return;
  state.exam.phase = "answering";
  examTaskEl.textContent = "Введи слова по порядку";
  examTaskEl.classList.add("challenge-hint");
  examTaskEl.classList.remove("words");
  examAnswer.focus();
  syncExamControls();
}

function presentExamBaldaTask(task) {
  examTaskEl.textContent = `Начальное слово — ${task.chain[0]}`;
  examTaskEl.classList.remove("challenge-hint", "mono", "words");
  examAnswer.focus();
}

function presentExamSchulteTask(task) {
  state.exam.phase = "interacting";
  examTaskEl.classList.remove("challenge-hint", "mono", "words");
  examTaskEl.innerHTML = "";

  const board = document.createElement("div");
  board.className = "schulte-board exam-schulte-board";
  board.dataset.size = String(task.size);
  board.setAttribute("role", "grid");
  board.setAttribute("aria-label", `Экзаменационная таблица Шульте ${task.size} на ${task.size}`);

  task.values.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "schulte-cell";
    button.dataset.value = String(value);
    button.textContent = formatExamSchulteValue(value, task.useLetters);
    button.addEventListener("click", () => handleExamSchulteClick(button, task));
    board.appendChild(button);
  });

  examTaskEl.appendChild(board);
  syncExamControls();
}

function handleExamSchulteClick(button, task) {
  if (!state.exam.active || state.exam.currentTask !== task || state.exam.phase !== "interacting") return;
  const value = Number(button.dataset.value);
  if (value !== task.nextValue) {
    button.classList.remove("is-wrong");
    void button.offsetWidth;
    button.classList.add("is-wrong");
    window.setTimeout(() => button.classList.remove("is-wrong"), 260);
    return;
  }

  button.disabled = true;
  button.classList.add("is-found");
  task.nextValue += 1;
  if (task.nextValue <= task.size * task.size) return;
  completeExamSchulteTask(task);
}

async function completeExamSchulteTask(task) {
  if (!state.exam.active || state.exam.currentTask !== task) return;
  state.exam.results.push({
    index: state.exam.results.length + 1,
    kind: task.kind,
    prompt: getExamTaskPrompt(task),
    expected: "Таблица пройдена",
    actual: "Таблица пройдена",
    correct: true,
  });
  state.exam.correctCount += 1;
  state.exam.phase = "transition";
  updateExamStats();
  syncExamControls();
  await sleep(650);
  if (!state.exam.active || state.exam.currentTask !== task) return;
  runNextExamTask();
}

function skipExamTask() {
  if (!state.exam.active || !state.exam.currentTask || state.exam.phase === "transition") return;
  state.exam.revealToken += 1;
  const [skippedTask] = state.exam.queue.splice(state.exam.currentIndex, 1);
  if (!skippedTask) return;
  state.exam.queue.push(skippedTask);
  state.exam.currentIndex -= 1;
  state.exam.currentTask = null;
  state.exam.phase = "transition";
  examForm.reset();
  runNextExamTask();
}

function isCurrentExamReveal(task, revealToken) {
  return state.exam.active
    && state.exam.currentTask === task
    && state.exam.revealToken === revealToken;
}

function formatExamSchulteValue(value, useLetters) {
  if (!useLetters) return String(value);
  const russianAlphabet = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  if (value % 2 === 1) return String(Math.ceil(value / 2));
  return russianAlphabet[value / 2 - 1] || String(value);
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function getExamTaskPrompt(task) {
  if (task.kind === "math") return task.expression;
  if (task.kind === "numbers") return `${task.values.length} ряда`;
  if (task.kind === "words") return `${task.words.length} слов`;
  if (task.kind === "schulte") return `${task.size} × ${task.size}${task.useLetters ? ", числа и буквы" : ""}`;
  if (task.kind === "balda") return `Начальное слово: ${task.chain[0]}`;
  return "Упражнение";
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
  const totalTasks = state.exam.results.length;
  const modeLabels = {
    math: "Счет в уме",
    numbers: "Числовой ряд",
    words: "Запоминание слов",
    schulte: "Таблицы Шульте",
    balda: "Балда",
  };
  const modeSummary = state.exam.results
    .map((result) => `${modeLabels[result.kind] || "Упражнение"}: ${result.correct ? "1/1" : "0/1"}`)
    .join("<br />");

  const prevBest = state.progress.exam.bestTimeSec ?? Number.POSITIVE_INFINITY;
  state.progress.exam.bestTimeSec = Math.min(prevBest, tookSec);
  persist();
  updateExamBestTime();

  state.exam.active = false;
  state.exam.currentTask = null;
  state.exam.phase = "done";
  examTaskEl.textContent = "Экзамен завершен";
  examTaskEl.classList.add("challenge-hint");
  examTaskEl.classList.remove("mono");
  examSummaryEl.innerHTML = `
    <strong>Итог: ${state.exam.correctCount}/${totalTasks}</strong><br />
    ${modeSummary}
  `;
  examSummaryEl.hidden = false;
  renderExamReview(state.exam.results);
  examFeedback.textContent = "";
  examFeedback.className = "feedback";
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
  examReviewEl.hidden = true;
  examReviewEl.innerHTML = "";
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
  const defaultTotal = examDifficultyEl.value === "expert" ? 2 : 5;
  const totalTasks = state.exam.queue.length || defaultTotal;
  const currentTaskNumber = state.exam.currentTask
    ? state.exam.results.length + 1
    : state.exam.phase === "done"
      ? totalTasks
      : 0;
  examProgressEl.textContent = `Задание: ${currentTaskNumber}/${totalTasks}`;
}

function syncExamControls() {
  examResultMetricsEl.hidden = state.exam.phase !== "done";
  const readyForAnswer =
    state.exam.active
    && state.exam.phase === "answering"
    && Boolean(state.exam.currentTask);
  examStartBtn.disabled = state.exam.active;
  examDifficultyEl.disabled = state.exam.active;
  examSubmitBtn.disabled = !readyForAnswer || !examAnswer.value.trim();
  examSkipBtn.disabled = !state.exam.active
    || !state.exam.currentTask
    || state.exam.phase === "transition";
  examStopBtn.disabled = !state.exam.active && !state.exam.startedAt;
  examAnswer.disabled = !readyForAnswer;
  const taskKind = state.exam.currentTask?.kind;
  examAnswer.placeholder = taskKind === "numbers"
    ? "Введи ряды по порядку через пробел или с новой строки"
    : taskKind === "words"
      ? "Введи слова по порядку через пробел или с новой строки"
      : taskKind === "balda"
        ? "Введи цепочку слов после начального слова"
        : "Введи ответ";
}

function setExamTaskPlaceholder(text) {
  examTaskEl.textContent = text;
  examTaskEl.classList.add("challenge-hint");
  examTaskEl.classList.remove("mono");
}

function updateExamBestTime() {
  const best = state.progress.exam.bestTimeSec;
  examBestTimeEl.textContent = Number.isFinite(best)
    ? `Рекорд: ${best.toFixed(1)}с`
    : "Рекорд: --";
}

function renderExamReview(results) {
  const modeLabels = {
    math: "Счет в уме",
    numbers: "Числовой ряд",
    words: "Запоминание слов",
    schulte: "Таблицы Шульте",
    balda: "Балда",
  };
  const rows = [];
  for (const row of results) {
    const actual = row.actual || "Пропуск";
    const modeLabel = modeLabels[row.kind] || "Упражнение";
    rows.push(`
      <div class="num-review-row ${row.correct ? "is-ok" : "is-bad"}">
        <div class="num-review-row-title">Задание ${row.index} • ${modeLabel} • ${row.prompt}</div>
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

  examReviewEl.innerHTML = `
    <div class="num-review-head">
      <strong>Разбор экзамена</strong>
      <span>Сравнение твоих ответов с правильными по каждому заданию.</span>
    </div>
    <div class="num-review-grid">${rows.join("")}</div>
  `;
  examReviewEl.hidden = false;
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
  resultRecorded: false,
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
  if (!memoryState.resultRecorded) {
    memoryState.resultRecorded = true;
    applyModeResult("memory", isFullyCorrect, { count: expectedValues.length });
  }
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
  memoryState.resultRecorded = false;
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
const wordLevelEl = document.getElementById("word-level");
const wordLevelWrap = document.getElementById("word-level-wrap");
const wordDifficultyPreviewEl = document.getElementById("word-difficulty-preview");
const wordPreviewCountEl = document.getElementById("word-preview-count");
const wordPreviewTypeEl = document.getElementById("word-preview-type");
const wordPreviewDurationEl = document.getElementById("word-preview-duration");
const wordPreviewLanguageEl = document.getElementById("word-preview-language");
const wordPreviewExamplesEl = document.getElementById("word-preview-examples");
const wordChoiceDividerEl = document.querySelector(".word-choice-divider");
const wordCustomToggleBtn = document.getElementById("word-custom-toggle");
const wordCustomSettingsEl = document.getElementById("word-custom-settings");
const wordTargetCountEl = document.getElementById("word-target-count");
const wordShowSecondsEl = document.getElementById("word-show-seconds");
const wordTaskEl = document.getElementById("word-task");
const wordForm = document.getElementById("word-form");
const wordFeedback = document.getElementById("word-feedback");
const wordAnswer = document.getElementById("word-answer");
const wordSubmitBtn = wordForm.querySelector('button[type="submit"]');
const wordReviewEl = document.getElementById("word-review");
const wordStartBtn = document.getElementById("word-start");
const wordAgainBtn = document.getElementById("word-again");
const wordStopBtn = document.getElementById("word-stop");
const wordTimerEl = document.getElementById("word-timer");
const wordBestTimeEl = document.getElementById("word-best-time");
wordStartBtn.addEventListener("click", startWordRound);
wordAgainBtn.addEventListener("click", resetWordExercise);
wordCustomToggleBtn.addEventListener("click", toggleCustomWordSettings);
wordStopBtn.addEventListener("click", stopWordExercise);
wordAnswer.addEventListener("input", syncWordControls);
wordLevelEl.addEventListener("change", updateWordDifficultyPreview);
wordLanguageEl.addEventListener("change", updateWordDifficultyPreview);

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

  const bestTimeSec = state.progress.words.bestTimeSec;
  wordFeedback.innerHTML = `
    <span class="math-result-title">${perfect ? "Верно!" : "Неверно"}</span>
    <span class="math-result-answer">Правильных слов: ${hitByPosition}/${expected.length}</span>
    <span class="math-result-details">
      <span class="math-result-stat math-result-time"><span>Время</span><strong>${formatSeconds(elapsedSec)}</strong></span>
      <span class="math-result-stat math-result-record"><span>Рекорд</span><strong>${formatSeconds(bestTimeSec)}</strong></span>
    </span>
  `;
  wordFeedback.className = `feedback ${perfect ? "ok" : "bad"}`;
  clearWordRevealTimer();
  state.words.running = false;
  state.words.phase = "idle";
  state.words.value = [];
  state.words.revealedCount = 0;
  setWordTaskPlaceholder();
  wordForm.reset();
  setWordStage("result");
  syncWordControls();
});

function startWordRound() {
  clearWordRevealTimer();
  stopWordTimer();
  const config = getWordConfig();
  state.words.targetCount = config.targetCount;
  state.words.revealSeconds = config.revealSeconds;
  const isRu = wordLanguageEl.value !== "en";
  const isComplex = config.isComplex;
  const pool = isRu
    ? (isComplex ? wordPoolRuComplex : wordPoolRuSimple)
    : (isComplex ? wordPoolEnComplex : wordPoolEnSimple);
  const chosen = shuffle(pool).slice(0, state.words.targetCount);
  state.words.targetCount = chosen.length;
  state.words.running = true;
  state.words.phase = "memorize";
  state.words.value = chosen;
  state.words.revealedCount = 0;
  wordFeedback.textContent = "";
  wordReviewEl.hidden = true;
  wordReviewEl.innerHTML = "";
  wordTaskEl.hidden = false;
  wordTaskEl.textContent = `Слова появляются автоматически каждые ${state.words.revealSeconds} сек.`;
  wordTaskEl.classList.add("challenge-hint");
  startWordTimer();
  setWordStage("task");
  wordForm.reset();
  revealNextWord();
  startWordRevealSequence();
  syncWordControls();
}

function getWordConfig() {
  if (!wordCustomSettingsEl.hidden) {
    return {
      targetCount: Number(wordTargetCountEl.value) || 20,
      revealSeconds: Number(wordShowSecondsEl.value) || 3,
      isComplex: wordDifficulty.value === "complex",
    };
  }

  const presets = {
    easiest: { targetCount: 2, revealSeconds: 2, isComplex: false },
    easy: { targetCount: 10, revealSeconds: 5, isComplex: false },
    medium: { targetCount: 20, revealSeconds: 4, isComplex: false },
    hard: { targetCount: 10, revealSeconds: 3, isComplex: true },
    expert: { targetCount: 10, revealSeconds: 2, isComplex: true },
  };
  return presets[wordLevelEl.value] || presets.easy;
}

function toggleCustomWordSettings() {
  const visible = wordCustomSettingsEl.hidden;
  wordCustomSettingsEl.hidden = !visible;
  wordCustomSettingsEl.closest(".word-action-controls").classList.toggle("custom-mode", visible);
  wordLevelWrap.hidden = visible;
  wordDifficultyPreviewEl.hidden = visible;
  wordChoiceDividerEl.hidden = visible;
  wordCustomToggleBtn.setAttribute("aria-expanded", String(visible));
  wordCustomToggleBtn.classList.toggle("active", visible);
  wordCustomToggleBtn.textContent = visible ? "Готовое упражнение" : "Свой пример";
  if (!visible) updateWordDifficultyPreview();
}

const wordDifficultyPreviews = {
  easiest: {
    count: "2",
    type: "Простые",
    duration: "2 сек.",
    ru: ["лес", "мост"],
    en: ["forest", "bridge"],
  },
  easy: {
    count: "10",
    type: "Простые",
    duration: "5 сек.",
    ru: ["лес", "книга", "мост"],
    en: ["forest", "book", "bridge"],
  },
  medium: {
    count: "20",
    type: "Простые",
    duration: "4 сек.",
    ru: ["окно", "река", "фонарь"],
    en: ["window", "river", "lantern"],
  },
  hard: {
    count: "10",
    type: "Сложные",
    duration: "3 сек.",
    ru: ["лабиринт", "созвездие", "равновесие"],
    en: ["labyrinth", "constellation", "equilibrium"],
  },
  expert: {
    count: "10",
    type: "Сложные",
    duration: "2 сек.",
    ru: ["метаморфоза", "противоречие", "воображение"],
    en: ["metamorphosis", "contradiction", "imagination"],
  },
};

function updateWordDifficultyPreview() {
  if (!wordCustomSettingsEl.hidden) return;
  const preview = wordDifficultyPreviews[wordLevelEl.value] || wordDifficultyPreviews.easy;
  const language = wordLanguageEl.value === "en" ? "en" : "ru";
  const createPill = (text) => {
    const element = document.createElement("span");
    element.textContent = text;
    return element;
  };
  wordPreviewCountEl.replaceChildren(createPill(preview.count));
  wordPreviewTypeEl.replaceChildren(createPill(preview.type));
  wordPreviewDurationEl.replaceChildren(createPill(preview.duration));
  wordPreviewLanguageEl.replaceChildren(createPill(language === "ru" ? "Русский" : "Английский"));
  wordPreviewExamplesEl.replaceChildren(...preview[language].map((word) => {
    const element = document.createElement("span");
    element.textContent = word;
    return element;
  }));
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
  wordTaskEl.textContent = "Показ завершен";
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
  setWordTaskPlaceholder();
  wordForm.reset();
  wordReviewEl.hidden = true;
  wordReviewEl.innerHTML = "";
  if (hadActive) {
    wordFeedback.textContent = "Упражнение остановлено.";
    wordFeedback.className = "feedback";
  }
  setWordStage("prep");
  syncWordControls();
}

function resetWordExercise() {
  stopWordExercise();
  wordFeedback.textContent = "";
  wordFeedback.className = "feedback";
  wordStartBtn.focus();
}

function setWordStage(stage) {
  const wordsPanelEl = document.getElementById("words-panel");
  wordsPanelEl.classList.remove("word-stage-prep", "word-stage-task", "word-stage-result");
  wordsPanelEl.classList.add(`word-stage-${stage}`);
  state.words.stage = stage;
  setTrainerStage(stage === "prep" ? 1 : stage === "task" ? 2 : 3);
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
            <span class="word-review-label">Правильный ответ</span>
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
            <span class="word-review-label">Правильный ответ</span>
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
      <strong>Разбор упражнения</strong>
    </div>
    <div class="word-review-grid">${rows.join("")}</div>
  `;
  wordReviewEl.hidden = false;
}

function setWordTaskPlaceholder() {
  wordTaskEl.textContent = "";
  wordTaskEl.classList.add("challenge-hint");
  wordTaskEl.hidden = true;
}

async function loadWordPoolsFromCsv() {
  try {
    const response = await fetch("./data/words.csv", { cache: "no-store" });
    if (!response.ok) throw new Error(`Не удалось загрузить CSV: ${response.status}`);
    const rows = (await response.text())
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trimStart().startsWith("#"));
    if (rows.length < 2) return;

    const headers = parseCsvRow(rows[0]).map((value) => value.trim());
    const pools = {
      ru_simple: [],
      ru_complex: [],
      en_simple: [],
      en_complex: [],
    };

    for (const line of rows.slice(1)) {
      const values = parseCsvRow(line);
      headers.forEach((header, index) => {
        if (!(header in pools)) return;
        const word = (values[index] || "").trim();
        if (word && !pools[header].includes(word)) pools[header].push(word);
      });
    }

    if (pools.ru_simple.length) wordPoolRuSimple = pools.ru_simple;
    if (pools.ru_complex.length) wordPoolRuComplex = pools.ru_complex;
    if (pools.en_simple.length) wordPoolEnSimple = pools.en_simple;
    if (pools.en_complex.length) wordPoolEnComplex = pools.en_complex;
  } catch (error) {
    console.warn("Используются встроенные списки слов:", error);
  }
}

function parseCsvRow(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

function syncWordControls() {
  wordStartBtn.disabled = state.words.running;
  wordLanguageEl.disabled = state.words.running;
  wordLevelEl.disabled = state.words.running;
  wordCustomToggleBtn.disabled = state.words.running;
  wordDifficulty.disabled = state.words.running;
  wordTargetCountEl.disabled = state.words.running;
  wordShowSecondsEl.disabled = state.words.running;
  wordSubmitBtn.disabled = state.words.phase !== "recall" || !wordAnswer.value.trim();
  wordStopBtn.disabled = !state.words.running && !state.words.startedAt;
  wordAnswer.disabled = state.words.phase !== "recall";
}

const baldaStartBtn = document.getElementById("balda-start");
const baldaDifficultyEl = document.getElementById("balda-difficulty");
const baldaDifficultyWrap = document.getElementById("balda-difficulty-wrap");
const baldaCustomToggleBtn = document.getElementById("balda-custom-toggle");
const baldaCustomSettingsEl = document.getElementById("balda-custom-settings");
const baldaStopBtn = document.getElementById("balda-stop");
const baldaCheckBtn = document.getElementById("balda-check");
const baldaWordLengthEl = document.getElementById("balda-word-length");
const baldaForm = document.getElementById("balda-form");
const baldaLadderEl = document.getElementById("balda-ladder");
const baldaFeedbackEl = document.getElementById("balda-feedback");
const baldaStartWordEl = document.getElementById("balda-start-word");

baldaStartBtn.addEventListener("click", startBaldaGame);
baldaCustomToggleBtn.addEventListener("click", toggleCustomBaldaSettings);
baldaStopBtn.addEventListener("click", stopBaldaGame);
baldaForm.addEventListener("submit", checkBaldaStep);

function getBaldaWordLength() {
  if (!baldaCustomSettingsEl.hidden) {
    return Number(baldaWordLengthEl.value) || 5;
  }

  const wordLengths = { easy: 3, medium: 4, hard: 5 };
  return wordLengths[baldaDifficultyEl.value] || wordLengths.easy;
}

function toggleCustomBaldaSettings() {
  setCustomBaldaSettingsVisible(baldaCustomSettingsEl.hidden);
}

function setCustomBaldaSettingsVisible(visible) {
  baldaCustomSettingsEl.hidden = !visible;
  baldaDifficultyWrap.hidden = visible;
  baldaCustomToggleBtn.setAttribute("aria-expanded", String(visible));
  baldaCustomToggleBtn.classList.toggle("active", visible);
  baldaCustomToggleBtn.textContent = visible ? "Выбрать сложность" : "Свой пример";
}

function startBaldaGame() {
  stopBaldaTimer();
  const selectedLength = getBaldaWordLength();
  const availableChains = state.balda.chains[selectedLength] || state.balda.chains[5];
  state.balda.chain = availableChains[randomInt(0, availableChains.length - 1)];
  state.balda.currentStep = 0;
  state.balda.active = true;
  baldaFeedbackEl.textContent = "";
  baldaFeedbackEl.className = "feedback";
  baldaForm.hidden = false;
  baldaStartBtn.disabled = true;
  baldaDifficultyEl.disabled = true;
  baldaCustomToggleBtn.disabled = true;
  baldaCheckBtn.disabled = false;
  baldaWordLengthEl.disabled = true;
  baldaStopBtn.disabled = false;
  baldaStartWordEl.textContent = `Начальное слово — ${state.balda.chain[0]}`;
  renderBaldaLadder();
  startBaldaTimer();
  focusCurrentBaldaInput();
}

function renderBaldaLadder() {
  const { chain, currentStep } = state.balda;
  baldaLadderEl.innerHTML = chain.slice(1).map((word, rowIndex) => {
    const index = rowIndex + 1;
    const completed = index <= currentStep;
    const current = index === currentStep + 1;
    return `
      <div class="balda-row ${completed ? "is-complete" : ""} ${current ? "is-current" : ""}">
        <span class="balda-row-index">${index}</span>
        <input
          class="balda-word-input"
          data-balda-step="${index}"
          type="text"
          maxlength="${word.length}"
          autocomplete="off"
          spellcheck="false"
          placeholder="Введи следующее слово"
          value="${completed ? word : ""}"
          ${current ? "" : "disabled"}
          aria-label="Слово для ряда ${index}"
        />
      </div>`;
  }).join("");
}

function checkBaldaStep(event) {
  event.preventDefault();
  if (!state.balda.active) return;
  const nextIndex = state.balda.currentStep + 1;
  const input = baldaLadderEl.querySelector(`[data-balda-step="${nextIndex}"]`);
  if (!input) return;
  const value = input.value.trim().toLowerCase().replace(/ё/g, "е");
  const previous = state.balda.chain[nextIndex - 1];
  const expected = state.balda.chain[nextIndex];

  if (!value) return showBaldaError("Введи слово для следующего ряда.", input);
  if (!/^[а-я]+$/i.test(value)) return showBaldaError("Используй только русские буквы.", input);
  if (value.length !== previous.length) {
    return showBaldaError(`В слове должно быть ${previous.length} букв.`, input);
  }
  const changedLetters = [...value].filter((letter, index) => letter !== previous[index]).length;
  if (changedLetters === 0) return showBaldaError("Нужно изменить одну букву.", input);
  if (changedLetters !== 1) return showBaldaError("Можно изменить только одну букву.", input);
  if (value !== expected) return showBaldaError("Такое слово не подходит для этой цепочки. Попробуй другой вариант.", input);

  state.balda.currentStep = nextIndex;
  baldaFeedbackEl.textContent = "";
  baldaFeedbackEl.className = "feedback";
  renderBaldaLadder();

  if (nextIndex === state.balda.chain.length - 1) {
    finishBaldaGame();
    return;
  }
  focusCurrentBaldaInput();
}

function showBaldaError(message, input) {
  baldaFeedbackEl.textContent = `Ошибка. ${message}`;
  baldaFeedbackEl.className = "feedback bad";
  input.classList.add("is-invalid");
  input.focus();
}

function focusCurrentBaldaInput() {
  const input = baldaLadderEl.querySelector(`[data-balda-step="${state.balda.currentStep + 1}"]`);
  if (input) input.focus();
}

function startBaldaTimer() {
  state.balda.startedAt = Date.now();
}

function stopBaldaTimer() {
  if (state.balda.timerId) clearInterval(state.balda.timerId);
  state.balda.timerId = null;
  if (!state.balda.startedAt) return 0;
  const elapsed = (Date.now() - state.balda.startedAt) / 1000;
  state.balda.startedAt = null;
  return elapsed;
}

function finishBaldaGame() {
  const tookSec = stopBaldaTimer();
  state.balda.active = false;
  baldaStartBtn.disabled = false;
  baldaDifficultyEl.disabled = false;
  baldaCustomToggleBtn.disabled = false;
  baldaCheckBtn.disabled = true;
  baldaWordLengthEl.disabled = false;
  baldaStopBtn.disabled = true;
  baldaFeedbackEl.textContent = "Верно!";
  baldaFeedbackEl.className = "feedback ok";
  applyModeResult("balda", true, { timeSec: tookSec });
}

function stopBaldaGame() {
  const wasActive = state.balda.active;
  const tookSec = stopBaldaTimer();
  state.balda.active = false;
  state.balda.currentStep = 0;
  baldaForm.hidden = true;
  baldaLadderEl.innerHTML = "";
  baldaStartBtn.disabled = false;
  baldaDifficultyEl.disabled = false;
  baldaCustomToggleBtn.disabled = false;
  baldaCheckBtn.disabled = false;
  baldaWordLengthEl.disabled = false;
  baldaStopBtn.disabled = true;
  if (wasActive) {
    applyModeResult("balda", false, { timeSec: tookSec });
    baldaFeedbackEl.textContent = "Упражнение остановлено.";
    baldaFeedbackEl.className = "feedback";
  }
}

async function loadBaldaChainsFromCsv() {
  try {
    const response = await fetch("./data/balda.csv", { cache: "no-store" });
    if (!response.ok) throw new Error(`Не удалось загрузить CSV: ${response.status}`);
    const rows = (await response.text())
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trimStart().startsWith("#"));
    if (rows.length < 2) return;

    const headers = parseCsvRow(rows[0]).map((value) => value.trim());
    const lengthIndex = headers.indexOf("length");
    const wordIndexes = headers
      .map((header, index) => (/^word_\d+$/.test(header) ? index : -1))
      .filter((index) => index >= 0);
    if (lengthIndex < 0 || wordIndexes.length < 2) return;

    const loadedChains = { 3: [], 4: [], 5: [] };
    rows.slice(1).forEach((line) => {
      const values = parseCsvRow(line);
      const wordLength = Number(values[lengthIndex]);
      if (!(wordLength in loadedChains)) return;
      const chain = wordIndexes
        .map((index) => (values[index] || "").trim().toLowerCase().replace(/ё/g, "е"))
        .filter(Boolean);
      if (isValidBaldaChain(chain, wordLength)) loadedChains[wordLength].push(chain);
    });

    [3, 4, 5].forEach((length) => {
      if (loadedChains[length].length) state.balda.chains[length] = loadedChains[length];
    });
  } catch (error) {
    console.warn("Используются встроенные цепочки для «Балды»:", error);
  }
}

function isValidBaldaChain(chain, wordLength) {
  if (chain.length < 2) return false;
  return chain.every((word, index) => {
    if (!new RegExp(`^[а-я]{${wordLength}}$`, "i").test(word)) return false;
    if (index === 0) return true;
    return [...word].filter((letter, letterIndex) => letter !== chain[index - 1][letterIndex]).length === 1;
  });
}

const attentionImageInput = document.getElementById("attention-image-input");
const attentionUploadTriggerBtn = document.getElementById("attention-upload-trigger");
const attentionShowSecondsEl = document.getElementById("attention-show-seconds");
const attentionRandomBtn = document.getElementById("attention-random");
const attentionStartBtn = document.getElementById("attention-start");
const attentionStopBtn = document.getElementById("attention-stop");
const attentionCompareBtn = document.getElementById("attention-compare");
const attentionStageEl = document.getElementById("attention-stage");
const attentionPreviewEl = document.getElementById("attention-preview");
const attentionAnswerEl = document.getElementById("attention-answer");
const attentionFeedbackEl = document.getElementById("attention-feedback");
const attentionCompareResultEl = document.getElementById("attention-compare-result");
const attentionCompareDefaultLabel = attentionCompareBtn.textContent;
const attentionRandomDefaultLabel = attentionRandomBtn.textContent;

attentionImageInput.addEventListener("change", handleAttentionImageUpload);
attentionUploadTriggerBtn.addEventListener("click", () => attentionImageInput.click());
attentionRandomBtn.addEventListener("click", loadRandomAttentionImage);
attentionStartBtn.addEventListener("click", startAttentionRound);
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
    attentionFeedbackEl.textContent = "";
    attentionFeedbackEl.className = "feedback";
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
    state.attention.visible = true;
    showAttentionImage();
    attentionStartBtn.hidden = false;
    attentionFeedbackEl.textContent = "";
    attentionFeedbackEl.className = "feedback";
    syncAttentionDescribeAvailability();
  };
  attentionPreviewEl.src = imageUrl;
  attentionPreviewEl.hidden = false;
  attentionStageEl.hidden = false;
  attentionAnswerEl.value = "";
  attentionStartBtn.hidden = true;
  attentionFeedbackEl.textContent = "";
  attentionFeedbackEl.className = "feedback";
  attentionCompareResultEl.hidden = true;
  attentionCompareResultEl.innerHTML = "";
  syncAttentionDescribeAvailability();
}

function hideAttentionStage() {
  attentionStageEl.hidden = true;
  attentionPreviewEl.hidden = true;
  attentionPreviewEl.removeAttribute("src");
}

function showAttentionImage() {
  attentionStageEl.hidden = false;
  attentionPreviewEl.hidden = false;
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
  attentionStartBtn.hidden = true;
  hideAttentionStage();
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
  attentionFeedbackEl.textContent = "";
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
  hideAttentionStage();
  attentionAnswerEl.focus();
  syncAttentionDescribeAvailability();
}

function startAttentionTimer() {
  state.attention.startedAt = Date.now();
}

function stopAttentionTimer() {
  if (state.attention.timerId) {
    clearInterval(state.attention.timerId);
    state.attention.timerId = null;
  }
  if (!state.attention.startedAt) return 0;
  const elapsedSec = (Date.now() - state.attention.startedAt) / 1000;
  state.attention.startedAt = null;
  return elapsedSec;
}

function clearAttentionHideTimer() {
  if (state.attention.hideTimerId) {
    clearTimeout(state.attention.hideTimerId);
    state.attention.hideTimerId = null;
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

  const tookSec = stopAttentionTimer();
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
    const totalDetails = Number(payload?.totalDetails) || 0;
    const rememberedDetails = Number(payload?.rememberedDetails) || 0;
    const success = totalDetails > 0 && rememberedDetails / totalDetails >= 0.6;
    applyModeResult("attention", success, { count: rememberedDetails });
    attentionFeedbackEl.innerHTML = `
      <span class="math-result-title">Сравнение готово.</span>
      <span class="math-result-details">
        <span class="math-result-stat math-result-time">
          <span>Время</span>
          <strong>${formatSeconds(tookSec)}</strong>
        </span>
      </span>`;
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
  attentionStartBtn.hidden = true;
  hideAttentionStage();
  attentionFeedbackEl.textContent = "";
  attentionAnswerEl.value = "";
  attentionCompareResultEl.hidden = true;
  attentionCompareResultEl.innerHTML = "";
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
const schulteLettersEl = document.getElementById("schulte-letters");
const schulteDifficultyEl = document.getElementById("schulte-difficulty");
const schulteSymbolModeEl = document.getElementById("schulte-symbol-mode");
const schulteDifficultyWrap = document.getElementById("schulte-difficulty-wrap");
const schultePreviewSizeEl = document.getElementById("schulte-preview-size");
const schultePreviewElementsEl = document.getElementById("schulte-preview-elements");
const schultePreviewExamplesEl = document.getElementById("schulte-preview-examples");
const schulteActionControlsEl = document.querySelector(".schulte-action-controls");
const schulteCustomToggleBtn = document.getElementById("schulte-custom-toggle");
const schulteCustomSettingsEl = document.getElementById("schulte-custom-settings");
const schulteStartBtn = document.getElementById("schulte-start");
const schulteNextEl = document.getElementById("schulte-next");
const schulteTimerEl = document.getElementById("schulte-timer");
const schulteBestTimeEl = document.getElementById("schulte-best-time");
const schulteBoardWrapEl = document.getElementById("schulte-board-wrap");
const schulteBoardEl = document.getElementById("schulte-board");
const schulteFeedbackEl = document.getElementById("schulte-feedback");
const schulteStopBtn = document.getElementById("schulte-stop");
const schulteAgainBtn = document.getElementById("schulte-again");

schulteSizeEl.addEventListener("change", () => {
  state.schulte.size = Number(schulteSizeEl.value) || 5;
  if (!state.schulte.active && !state.schulte.values.length) {
    renderSchulteBoard();
  }
});
schulteLettersEl.addEventListener("change", () => {
  state.schulte.useLetters = schulteLettersEl.checked;
  if (!state.schulte.active) renderSchulteBoard();
});
schulteStartBtn.addEventListener("click", startSchulteRound);
schulteCustomToggleBtn.addEventListener("click", toggleCustomSchulteSettings);
schulteStopBtn.addEventListener("click", stopSchulteExercise);
schulteAgainBtn.addEventListener("click", resetSchulteExercise);
schulteDifficultyEl.addEventListener("change", updateSchulteDifficultyPreview);
schulteSymbolModeEl.addEventListener("change", updateSchulteDifficultyPreview);

function getSchulteConfig() {
  if (!schulteCustomSettingsEl.hidden) {
    return {
      size: Number(schulteSizeEl.value) || 5,
      useLetters: schulteLettersEl.checked,
    };
  }

  const presets = {
    easy: { size: 4 },
    medium: { size: 5 },
    hard: { size: 6 },
  };
  const preset = presets[schulteDifficultyEl.value] || presets.easy;
  return {
    ...preset,
    useLetters: schulteSymbolModeEl.value === "mixed",
  };
}

const schulteDifficultyPreviews = {
  easy: {
    size: "4 × 4",
    cells: "16",
    numberExamples: ["1", "8", "16"],
    mixedExamples: ["1", "А", "8"],
  },
  medium: {
    size: "5 × 5",
    cells: "25",
    numberExamples: ["1", "13", "25"],
    mixedExamples: ["1", "А", "12"],
  },
  hard: {
    size: "6 × 6",
    cells: "36",
    numberExamples: ["1", "18", "36"],
    mixedExamples: ["1", "А", "18"],
  },
};

function updateSchulteDifficultyPreview() {
  const preview = schulteDifficultyPreviews[schulteDifficultyEl.value] || schulteDifficultyPreviews.easy;
  const useLetters = schulteSymbolModeEl.value === "mixed";
  const createPill = (text) => {
    const element = document.createElement("span");
    element.textContent = text;
    return element;
  };
  schultePreviewSizeEl.replaceChildren(createPill(preview.size));
  schultePreviewElementsEl.replaceChildren(createPill(useLetters ? "Числа и буквы" : "Только числа"));
  const examples = useLetters ? preview.mixedExamples : preview.numberExamples;
  schultePreviewExamplesEl.replaceChildren(...examples.map(createPill));
}

function toggleCustomSchulteSettings() {
  const visible = schulteCustomSettingsEl.hidden;
  schulteCustomSettingsEl.hidden = !visible;
  schulteDifficultyWrap.hidden = visible;
  schulteCustomToggleBtn.setAttribute("aria-expanded", String(visible));
  schulteCustomToggleBtn.classList.toggle("active", visible);
  schulteActionControlsEl.classList.toggle("custom-mode", visible);
  schulteCustomToggleBtn.textContent = visible ? "Выбрать сложность" : "Свой пример";
}

function startSchulteRound() {
  stopSchulteTimer();
  const config = getSchulteConfig();
  state.schulte.size = config.size;
  state.schulte.useLetters = config.useLetters;
  state.schulte.values = shuffle(
    Array.from({ length: state.schulte.size * state.schulte.size }, (_, index) => index + 1),
  );
  state.schulte.nextValue = 1;
  state.schulte.errors = 0;
  state.schulte.active = true;
  schulteFeedbackEl.textContent = "";
  schulteFeedbackEl.className = "feedback";
  renderSchulteBoard();
  startSchulteTimer();
  setSchulteStage("task");
  syncSchulteControls();
}

function renderSchulteBoard() {
  schulteBoardEl.dataset.size = String(state.schulte.size);
  schulteBoardEl.innerHTML = "";

  if (!state.schulte.values.length) {
    schulteBoardWrapEl.hidden = true;
    schulteBoardEl.hidden = true;
    schulteNextEl.hidden = true;
    schulteNextEl.textContent = `${state.schulte.useLetters ? "Следующий символ" : "Следующее число"}: --`;
    return;
  }

  schulteBoardWrapEl.hidden = false;
  schulteBoardEl.hidden = false;
  schulteBoardEl.classList.remove("is-empty", "challenge", "challenge-hint");

  state.schulte.values.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "schulte-cell";
    button.dataset.value = String(value);
    const displayValue = formatSchulteValue(value);
    button.textContent = displayValue;
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", state.schulte.useLetters ? `Символ ${displayValue}` : `Число ${value}`);
    button.addEventListener("click", () => handleSchulteCellClick(button));
    schulteBoardEl.appendChild(button);
  });

  updateSchulteProgress();
}

function handleSchulteCellClick(button) {
  if (!state.schulte.active) return;

  const value = Number(button.dataset.value);
  if (value !== state.schulte.nextValue) {
    state.schulte.errors += 1;
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
  const success = state.schulte.errors === 0;
  state.schulte.active = false;
  updateSchulteProgress(true);
  applyModeResult("schulte", success, {
    size: state.schulte.size,
    timeSec: tookSec,
    errors: state.schulte.errors,
  });
  const bestTimeSec = state.progress.schulte.bestTimeSec;
  schulteFeedbackEl.innerHTML = `
    <span class="math-result-title">${success ? "Верно!" : "Неверно"}</span>
    <span class="math-result-answer">${success
      ? "Таблица пройдена без ошибок"
      : `Таблица пройдена с ${state.schulte.errors} ${formatSchulteErrorWord(state.schulte.errors)}`}</span>
    <span class="math-result-details">
      <span class="math-result-stat math-result-time">
        <span>Время</span>
        <strong>${formatSeconds(tookSec)}</strong>
      </span>
      <span class="math-result-stat math-result-record">
        <span>Рекорд</span>
        <strong>${formatSeconds(bestTimeSec)}</strong>
      </span>
    </span>
  `;
  schulteFeedbackEl.className = `feedback ${success ? "ok" : "bad"}`;
  setSchulteStage("result");
  syncSchulteControls();
}

function formatSchulteErrorWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  return mod10 === 1 && mod100 !== 11 ? "ошибкой" : "ошибками";
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
  const label = state.schulte.useLetters ? "Следующий символ" : "Следующее число";
  const value = isCompleted || !state.schulte.values.length
    ? "--"
    : formatSchulteValue(state.schulte.nextValue);
  schulteNextEl.hidden = isCompleted || !state.schulte.active || !state.schulte.values.length;
  schulteNextEl.textContent = `${label}: ${value}`;
}

function formatSchulteValue(value) {
  if (!state.schulte.useLetters) return String(value);
  const russianAlphabet = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  if (value % 2 === 1) return String(Math.ceil(value / 2));
  return russianAlphabet[value / 2 - 1] || String(value);
}

function resetSchulteExercise() {
  stopSchulteTimer();
  const config = getSchulteConfig();
  state.schulte.size = config.size;
  state.schulte.useLetters = config.useLetters;
  state.schulte.values = [];
  state.schulte.nextValue = 1;
  state.schulte.errors = 0;
  state.schulte.active = false;
  schulteTimerEl.textContent = "Таймер: 0.0с";
  renderSchulteBoard();
  schulteFeedbackEl.textContent = "";
  schulteFeedbackEl.className = "feedback";
  setSchulteStage("prep");
  syncSchulteControls();
  schulteStartBtn.focus();
}

function stopSchulteExercise() {
  const hadActive = state.schulte.active || Boolean(state.schulte.startedAt);
  stopSchulteTimer();
  const config = getSchulteConfig();
  state.schulte.size = config.size;
  state.schulte.useLetters = config.useLetters;
  state.schulte.values = [];
  state.schulte.nextValue = 1;
  state.schulte.errors = 0;
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
  setSchulteStage("prep");
  syncSchulteControls();
}

function setSchulteStage(stage) {
  const schultePanelEl = document.getElementById("schulte-panel");
  schultePanelEl.classList.remove("schulte-stage-prep", "schulte-stage-task", "schulte-stage-result");
  schultePanelEl.classList.add(`schulte-stage-${stage}`);
  state.schulte.stage = stage;
  setTrainerStage(stage === "prep" ? 1 : stage === "task" ? 2 : 3);
}

function syncSchulteControls() {
  schulteStartBtn.disabled = state.schulte.active;
  schulteDifficultyEl.disabled = state.schulte.active;
  schulteSymbolModeEl.disabled = state.schulte.active;
  schulteCustomToggleBtn.disabled = state.schulte.active;
  schulteSizeEl.disabled = state.schulte.active;
  schulteLettersEl.disabled = state.schulte.active;
  schulteStopBtn.disabled = !state.schulte.active && !state.schulte.startedAt;
}

document.getElementById("reset-progress").addEventListener("click", async () => {
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
  state.numbers.totalRounds = getNumberSeriesConfig().totalRounds;
  numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
  wordTimerEl.textContent = "Таймер: 0.0с";
  state.progress = structuredClone(defaults);
  persist();
  await deleteRemoteProgress();
  updateMathBestTime();
  updateNumberBestTime();
  updateWordBestTime();
  updateSchulteBestTime();
  updateExamBestTime();
  renderProgress();
});

document.getElementById("progress-mode").addEventListener("change", renderProgress);

function applyModeResult(mode, success, extra = {}) {
  addResultToProgress(state.progress, mode, success, extra, new Date().toISOString());

  persist();
  renderProgress();
  saveRemoteAttempt(mode, success, extra);
}

function addResultToProgress(progress, mode, success, extra = {}, at = new Date().toISOString()) {
  const bucket = progress[mode];
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
  if (mode === "balda" && success && extra.timeSec) {
    const prev = bucket.bestTimeSec ?? Number.POSITIVE_INFINITY;
    bucket.bestTimeSec = Math.min(prev, extra.timeSec);
  }
  if (mode === "schulte" && success) {
    bucket.bestSize = Math.max(bucket.bestSize || 0, extra.size || 0);
    if (extra.timeSec) {
      const prev = bucket.bestTimeSec ?? Number.POSITIVE_INFINITY;
      bucket.bestTimeSec = Math.min(prev, extra.timeSec);
      updateSchulteBestTime();
    }
  }

  progress.sessions.unshift({
    mode,
    success,
    at,
    score: extra.span || extra.count || extra.size || null,
  });
  progress.sessions = progress.sessions.slice(0, 20);
}

async function saveRemoteAttempt(mode, success, score) {
  const auth = window.mnemonicAuth;
  const user = auth?.getUser();
  if (!user) return;

  const { error } = await auth.client.from("attempts").insert({
    user_id: user.id,
    exercise: mode,
    success,
    score,
  });
  if (error) console.error("Не удалось сохранить попытку:", error.message);
}

async function deleteRemoteProgress() {
  const auth = window.mnemonicAuth;
  const user = auth?.getUser();
  if (!user) return;

  const { error } = await auth.client.from("attempts").delete().eq("user_id", user.id);
  if (error) console.error("Не удалось сбросить прогресс аккаунта:", error.message);
}

async function syncProgressForUser(user) {
  if (!user || !window.mnemonicAuth) {
    state.progress = loadProgress();
    refreshProgressUi();
    return;
  }

  const auth = window.mnemonicAuth;
  const migrationKey = `mnemonic_lab_migrated_${user.id}`;
  let { data: rows, error } = await auth.client
    .from("attempts")
    .select("exercise, success, score, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Не удалось загрузить прогресс:", error.message);
    return;
  }

  const localProgress = loadProgress(STORAGE_KEY);
  if (!rows.length && localProgress.sessions.length && !localStorage.getItem(migrationKey)) {
    const legacyRows = localProgress.sessions.map((entry) => ({
      user_id: user.id,
      exercise: entry.mode,
      success: Boolean(entry.success),
      score: entry.score == null ? {} : { value: entry.score },
      created_at: entry.at,
    }));
    const migration = await auth.client.from("attempts").insert(legacyRows);
    if (!migration.error) {
      localStorage.setItem(migrationKey, "1");
      rows = legacyRows;
    } else {
      console.error("Не удалось перенести локальный прогресс:", migration.error.message);
    }
  }

  const remoteProgress = structuredClone(defaults);
  rows.forEach((row) => {
    const score = row.score && typeof row.score === "object" ? row.score : {};
    addResultToProgress(remoteProgress, row.exercise, Boolean(row.success), score, row.created_at);
  });
  state.progress = remoteProgress;
  persist();
  refreshProgressUi();
}

function refreshProgressUi() {
  updateMathBestTime();
  updateNumberBestTime();
  updateWordBestTime();
  updateSchulteBestTime();
  updateExamBestTime();
  renderProgress();
}

window.addEventListener("mnemonic-auth-changed", (event) => {
  syncProgressForUser(event.detail?.user || null);
});

function renderProgress() {
  const math = state.progress.math;
  const numbers = state.progress.numbers;
  const words = state.progress.words;
  const memory = state.progress.memory;
  const balda = state.progress.balda;
  const attention = state.progress.attention;
  const schulte = state.progress.schulte;

  const modeMap = {
    math: {
      label: "Счет в уме",
      shortLabel: "Счет",
      correct: math.correct,
      attempts: math.attempts,
      best: formatSeconds(math.bestTimeSec),
      metrics: [
        ["Серия", math.streak || 0],
        ["Лучшая серия", math.bestStreak || 0],
        ["Рекорд", formatSeconds(math.bestTimeSec)],
        ["Попытки", math.attempts],
      ],
    },
    numbers: {
      label: "Числовой ряд",
      shortLabel: "Ряд",
      correct: numbers.correct,
      attempts: numbers.attempts,
      best: formatSeconds(numbers.bestTimeSec),
      metrics: [
        ["Серия", numbers.streak || 0],
        ["Лучший ряд", numbers.bestLength || 0],
        ["Рекорд", formatSeconds(numbers.bestTimeSec)],
        ["Попытки", numbers.attempts],
      ],
    },
    words: {
      label: "Запоминание слов",
      shortLabel: "Слова",
      correct: words.correct,
      attempts: words.attempts,
      best: formatSeconds(words.bestTimeSec),
      metrics: [
        ["Серия", words.streak || 0],
        ["Лучший объем", words.bestCount || 0],
        ["Рекорд", formatSeconds(words.bestTimeSec)],
        ["Попытки", words.attempts],
      ],
    },
    memory: {
      label: "Запоминание чисел",
      correct: memory.correct,
      attempts: memory.attempts,
      metrics: [
        ["Лучшая серия", memory.bestStreak || 0],
      ],
    },
    balda: {
      label: "Балда",
      correct: balda.correct,
      attempts: balda.attempts,
      metrics: [
        ["Лучшая серия", balda.bestStreak || 0],
        ["Рекорд", formatSeconds(balda.bestTimeSec)],
      ],
    },
    attention: {
      label: "Детали на фото",
      correct: attention.correct,
      attempts: attention.attempts,
      metrics: [
        ["Лучшая серия", attention.bestStreak || 0],
      ],
    },
    schulte: {
      label: "Таблицы Шульте",
      shortLabel: "Шульте",
      correct: schulte.correct,
      attempts: schulte.attempts,
      best: formatSeconds(schulte.bestTimeSec),
      metrics: [
        ["Пройдено", schulte.correct || 0],
        ["Лучшая серия", schulte.bestStreak || 0],
        ["Размер", schulte.bestSize ? `${schulte.bestSize}x${schulte.bestSize}` : "--"],
        ["Рекорд", formatSeconds(schulte.bestTimeSec)],
      ],
    },
  };
  const modeOrder = ["numbers", "words", "memory", "math", "balda", "attention", "schulte"];
  const allAttempts = modeOrder.reduce((sum, mode) => sum + modeMap[mode].attempts, 0);
  const allCorrect = modeOrder.reduce((sum, mode) => sum + modeMap[mode].correct, 0);
  const selectedMode = document.getElementById("progress-mode").value;
  const recentEntries = state.progress.sessions
    .filter((entry) => selectedMode === "all" || entry.mode === selectedMode)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  const lastAttempt = recentEntries[0];
  const currentStreak = countSuccessStreak(recentEntries);
  const selected = selectedMode === "all"
    ? {
        label: "Все упражнения",
        shortLabel: "Все",
        correct: allCorrect,
        attempts: allAttempts,
        metrics: [
          ["Всего попыток", allAttempts],
          ["Верно", allCorrect],
          ["Подряд без ошибок", currentStreak],
          ["Последняя", lastAttempt ? formatShortDate(lastAttempt.at) : "--"],
        ],
      }
    : modeMap[selectedMode];
  if (selectedMode !== "all") {
    selected.metrics = [
      ["Подряд без ошибок", currentStreak],
      ["Верно", selected.correct],
      ["Попытки", selected.attempts],
      ["Последняя", lastAttempt ? formatShortDate(lastAttempt.at) : "--"],
    ];
  }
  const selectedAcc = percentage(selected.correct, selected.attempts);

  document.getElementById("progress-main-value").textContent = `${selectedAcc}%`;
  document.getElementById("progress-main-label").textContent =
    selectedMode === "all" ? "общая точность" : "точность упражнения";
  document.getElementById("progress-ring-value").textContent = `${selectedAcc}%`;
  document.getElementById("progress-ring-fill").parentElement.style.setProperty("--progress-angle", `${selectedAcc * 3.6}deg`);
  document.getElementById("progress-bar-label").textContent =
    selectedMode === "schulte" ? "Пройденные раунды" : "Верные ответы";
  document.getElementById("progress-bar-value").textContent = `${selected.correct} из ${selected.attempts}`;
  document.getElementById("progress-bar-fill").style.width = `${selectedAcc}%`;

  const metricsEl = document.getElementById("progress-metrics");
  metricsEl.innerHTML = "";
  selected.metrics.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "progress-metric";
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    item.append(labelEl, valueEl);
    metricsEl.appendChild(item);
  });

  const compareEl = document.getElementById("exercise-compare");
  compareEl.innerHTML = "";
  compareEl.hidden = selectedMode !== "all";
  if (selectedMode === "all") {
    modeOrder.forEach((mode) => {
      const item = modeMap[mode];
      const acc = percentage(item.correct, item.attempts);
      const row = document.createElement("div");
      row.className = "exercise-row";
      const title = document.createElement("strong");
      title.textContent = item.label;
      const bar = document.createElement("div");
      bar.className = "exercise-row-bar";
      const fill = document.createElement("span");
      fill.style.width = `${acc}%`;
      bar.appendChild(fill);
      const value = document.createElement("span");
      value.className = "exercise-row-value";
      value.textContent = `${acc}%`;
      row.append(title, bar, value);
      compareEl.appendChild(row);
    });
  }

  const recentList = document.getElementById("recent-list");
  recentList.innerHTML = "";
  const visibleRecentEntries = recentEntries.slice(0, 5);
  document.getElementById("recent-count").textContent = visibleRecentEntries.length;
  if (!recentEntries.length) {
    const li = document.createElement("li");
    li.textContent = "Пока нет попыток.";
    recentList.appendChild(li);
    return;
  }

  visibleRecentEntries.forEach((entry) => {
    const li = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = `attempt-dot${entry.success ? " ok" : ""}`;
    const name = document.createElement("span");
    name.className = "attempt-name";
    name.textContent = `${modeMap[entry.mode]?.label || "Упражнение"}: ${entry.success ? "верно" : "неверно"}`;
    const time = document.createElement("span");
    time.className = "attempt-time";
    time.textContent = formatShortDate(entry.at);
    li.append(dot, name, time);
    recentList.appendChild(li);
  });
}

function countSuccessStreak(entries) {
  let streak = 0;
  for (const entry of entries) {
    if (!entry.success) break;
    streak += 1;
  }
  return streak;
}

function formatSeconds(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)}с` : "--";
}

function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function progressStorageKey() {
  const userId = window.mnemonicAuth?.getUser()?.id;
  return userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
}

function loadProgress(storageKey = progressStorageKey()) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!parsed) return structuredClone(defaults);
    return {
      ...structuredClone(defaults),
      ...parsed,
      math: { ...defaults.math, ...(parsed.math || {}) },
      numbers: { ...defaults.numbers, ...(parsed.numbers || {}) },
      words: { ...defaults.words, ...(parsed.words || {}) },
      memory: { ...defaults.memory, ...(parsed.memory || {}) },
      balda: { ...defaults.balda, ...(parsed.balda || {}) },
      attention: { ...defaults.attention, ...(parsed.attention || {}) },
      schulte: { ...defaults.schulte, ...(parsed.schulte || {}) },
      exam: { ...defaults.exam, ...(parsed.exam || {}) },
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
  localStorage.setItem(progressStorageKey(), JSON.stringify(state.progress));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
  const attentionHasStarted = Boolean(state.attention.startedAt) || Boolean(state.attention.notes);
  attentionUploadTriggerBtn.disabled =
    attentionSourceLocked || state.attention.randomLoading || state.attention.loadingDescription || state.attention.comparing;
  attentionImageInput.disabled = attentionUploadTriggerBtn.disabled;
  attentionStartBtn.disabled =
    !state.attention.file || attentionHasStarted || attentionLocked || state.attention.comparing;
  attentionAnswerEl.disabled =
    !attentionHasStarted || attentionLocked || state.attention.comparing;
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

loadWordPoolsFromCsv();
loadBaldaChainsFromCsv();
setMathTaskPlaceholder("Нажми «Решать»");
state.numbers.totalRounds = getNumberSeriesConfig().totalRounds;
numSeriesProgressEl.textContent = `Ряд: 0/${state.numbers.totalRounds}`;
updateNumberDifficultyPreview();
setNumberTaskPlaceholder("Нажми «Новый пример»");
setExamTaskPlaceholder("Нажми «Начать экзамен»");
updateMathBestTime();
updateMathDifficultyPreview();
updateNumberBestTime();
updateWordBestTime();
updateWordDifficultyPreview();
updateSchulteDifficultyPreview();
updateSchulteBestTime();
updateExamBestTime();
syncMathControls();
syncNumberControls();
syncExamControls();
syncWordControls();
syncAttentionDescribeAvailability();
resetSchulteExercise();
memoryRender();
memoryResetTrainerState();
renderProgress();
