import assert from "node:assert/strict";
import test from "node:test";

import {
  createTimer,
  formatTime,
  localDateKey,
  pauseTimer,
  resetTimer,
  setDuration,
  startTimer,
  tickTimer,
} from "../src/timer.js";

test("creates an idle timer for the requested duration", () => {
  assert.deepEqual(createTimer(25 * 60), {
    durationSeconds: 1500,
    remainingSeconds: 1500,
    running: false,
    endsAt: null,
    completionCount: 0,
  });
});

test("start and pause preserve the elapsed time", () => {
  const started = startTimer(createTimer(60), 1_000);
  assert.equal(started.endsAt, 61_000);

  const paused = pauseTimer(started, 11_000);
  assert.equal(paused.remainingSeconds, 50);
  assert.equal(paused.running, false);
  assert.equal(paused.endsAt, null);
});

test("tick completes a session exactly once", () => {
  const started = startTimer(createTimer(5), 10_000);
  const completed = tickTimer(started, 15_000);

  assert.equal(completed.remainingSeconds, 0);
  assert.equal(completed.running, false);
  assert.equal(completed.completionCount, 1);
  assert.equal(tickTimer(completed, 20_000).completionCount, 1);
});

test("reset and duration changes return the timer to idle", () => {
  const running = startTimer(createTimer(60), 1_000);
  assert.deepEqual(resetTimer(running), createTimer(60));
  assert.deepEqual(setDuration(running, 15 * 60), createTimer(15 * 60));
});

test("formats time with padded minutes and seconds", () => {
  assert.equal(formatTime(0), "00:00");
  assert.equal(formatTime(65), "01:05");
  assert.equal(formatTime(3599), "59:59");
});

test("rejects invalid durations", () => {
  assert.throws(() => createTimer(0), /positive integer/);
  assert.throws(() => setDuration(createTimer(60), 1.5), /positive integer/);
});

test("builds the statistics key from the local calendar date", () => {
  assert.equal(localDateKey(new Date(2026, 8, 2, 0, 30)), "2026-09-02");
});
