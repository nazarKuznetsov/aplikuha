function assertDuration(seconds) {
  if (!Number.isInteger(seconds) || seconds <= 0) {
    throw new TypeError("Duration must be a positive integer");
  }
}

export function createTimer(durationSeconds) {
  assertDuration(durationSeconds);

  return {
    durationSeconds,
    remainingSeconds: durationSeconds,
    running: false,
    endsAt: null,
    completionCount: 0,
  };
}

export function startTimer(timer, now = Date.now()) {
  if (timer.running) return timer;

  const remainingSeconds = timer.remainingSeconds || timer.durationSeconds;
  return {
    ...timer,
    remainingSeconds,
    running: true,
    endsAt: now + remainingSeconds * 1000,
  };
}

export function tickTimer(timer, now = Date.now()) {
  if (!timer.running || timer.endsAt === null) return timer;

  const remainingSeconds = Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
  if (remainingSeconds > 0) return { ...timer, remainingSeconds };

  return {
    ...timer,
    remainingSeconds: 0,
    running: false,
    endsAt: null,
    completionCount: timer.completionCount + 1,
  };
}

export function pauseTimer(timer, now = Date.now()) {
  const current = tickTimer(timer, now);
  if (!current.running) return current;

  return {
    ...current,
    running: false,
    endsAt: null,
  };
}

export function resetTimer(timer) {
  return createTimer(timer.durationSeconds);
}

export function setDuration(_timer, durationSeconds) {
  return createTimer(durationSeconds);
}

export function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}
