import {
  createTimer,
  formatTime,
  localDateKey,
  pauseTimer,
  resetTimer,
  setDuration,
  startTimer,
  tickTimer,
} from "./timer.js";

const STATS_KEY = "focus-timer.stats.v1";
const TASK_KEY = "focus-timer.task.v1";
const DEFAULT_DURATION = 25 * 60;

const timerShell = document.querySelector("[data-timer-shell]");
const timeDisplay = document.querySelector("[data-time]");
const statusDisplay = document.querySelector("[data-status]");
const primaryButton = document.querySelector("[data-primary]");
const resetButton = document.querySelector("[data-reset]");
const taskInput = document.querySelector("[data-task]");
const sessionsDisplay = document.querySelector("[data-sessions]");
const minutesDisplay = document.querySelector("[data-minutes]");
const presetButtons = [...document.querySelectorAll("[data-duration]")];

let timer = createTimer(DEFAULT_DURATION);
let lastCompletionCount = timer.completionCount;
let completionFlashId = null;

function todayKey() {
  return localDateKey();
}

function emptyStats() {
  return { date: todayKey(), completedSessions: 0, focusedMinutes: 0 };
}

function loadStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY));
    if (
      parsed?.date === todayKey() &&
      Number.isInteger(parsed.completedSessions) &&
      Number.isInteger(parsed.focusedMinutes)
    ) {
      return parsed;
    }
  } catch {
    // A damaged local value should never prevent the timer from opening.
  }
  return emptyStats();
}

let stats = loadStats();

function saveStats() {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function renderStats() {
  if (stats.date !== todayKey()) {
    stats = emptyStats();
    saveStats();
  }
  sessionsDisplay.textContent = String(stats.completedSessions);
  minutesDisplay.textContent = String(stats.focusedMinutes);
}

function recordCompletion() {
  stats.completedSessions += 1;
  stats.focusedMinutes += Math.round(timer.durationSeconds / 60);
  saveStats();
  renderStats();

  timerShell.classList.remove("is-complete");
  requestAnimationFrame(() => timerShell.classList.add("is-complete"));
  clearTimeout(completionFlashId);
  completionFlashId = setTimeout(() => timerShell.classList.remove("is-complete"), 1600);

  if ("vibrate" in navigator) navigator.vibrate([120, 80, 120]);
}

function render() {
  const progress = timer.remainingSeconds === 0
    ? 1
    : 1 - timer.remainingSeconds / timer.durationSeconds;

  timerShell.style.setProperty("--progress", String(progress));
  timerShell.classList.toggle("is-running", timer.running);
  timeDisplay.textContent = formatTime(timer.remainingSeconds);
  document.title = `${formatTime(timer.remainingSeconds)} · Фокус`;

  if (timer.running) {
    primaryButton.textContent = "Пауза";
    statusDisplay.textContent = "Сессия идёт — оставьте только одну задачу";
  } else if (timer.remainingSeconds === 0) {
    primaryButton.textContent = "Ещё сессию";
    statusDisplay.textContent = "Готово. Сделайте короткий перерыв";
  } else if (timer.remainingSeconds < timer.durationSeconds) {
    primaryButton.textContent = "Продолжить";
    statusDisplay.textContent = "Таймер на паузе";
  } else {
    primaryButton.textContent = "Начать фокус";
    statusDisplay.textContent = "Готовы начать?";
  }

  for (const button of presetButtons) {
    const isActive = Number(button.dataset.duration) === timer.durationSeconds;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function updateFromClock() {
  const nextTimer = tickTimer(timer);
  timer = nextTimer;

  if (timer.completionCount > lastCompletionCount) {
    lastCompletionCount = timer.completionCount;
    recordCompletion();
  }

  render();
}

primaryButton.addEventListener("click", () => {
  timer = timer.running ? pauseTimer(timer) : startTimer(timer);
  render();
});

resetButton.addEventListener("click", () => {
  timer = resetTimer(timer);
  lastCompletionCount = timer.completionCount;
  render();
});

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    timer = setDuration(timer, Number(button.dataset.duration));
    lastCompletionCount = timer.completionCount;
    render();
  });
}

taskInput.value = localStorage.getItem(TASK_KEY) ?? "";
taskInput.addEventListener("input", () => {
  localStorage.setItem(TASK_KEY, taskInput.value);
});

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.target instanceof HTMLInputElement) return;
  event.preventDefault();
  primaryButton.click();
});

renderStats();
render();
setInterval(updateFromClock, 250);
