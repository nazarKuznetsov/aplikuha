import assert from "node:assert/strict";
import test from "node:test";

import {
  addTask,
  clearCompleted,
  createState,
  decodeState,
  deleteTask,
  encodeState,
  filterTasks,
  setFilter,
  toggleTask,
} from "../src/tasks.js";

test("adds valid tasks without mutating the previous state", () => {
  const initial = createState();
  const next = addTask(initial, { id: "buy-milk", title: "Buy milk" });

  assert.deepEqual(initial, { tasks: [], filter: "all" });
  assert.deepEqual(next, {
    tasks: [{ id: "buy-milk", title: "Buy milk", completed: false }],
    filter: "all",
  });
  assert.equal(addTask(next, { id: "buy-milk", title: "Duplicate" }), next);
  assert.equal(addTask(next, { id: "", title: "Missing id" }), next);
  assert.equal(addTask(next, { id: "blank", title: "   " }), next);
});

test("toggles, deletes, and clears completed tasks by id", () => {
  const initial = createState([
    { id: "first", title: "First", completed: false },
    { id: "second", title: "Second", completed: true },
    { id: "third", title: "Third", completed: false },
  ]);
  const toggled = toggleTask(initial, "first");

  assert.equal(toggled.tasks[0].completed, true);
  assert.equal(toggleTask(initial, "missing"), initial);
  assert.deepEqual(deleteTask(toggled, "second").tasks.map(({ id }) => id), ["first", "third"]);
  assert.deepEqual(clearCompleted(toggled).tasks.map(({ id }) => id), ["third"]);
  assert.equal(deleteTask(initial, "missing"), initial);
});

test("sets a valid filter and returns the matching tasks", () => {
  const state = createState([
    { id: "open", title: "Open", completed: false },
    { id: "done", title: "Done", completed: true },
  ]);

  assert.deepEqual(filterTasks(setFilter(state, "active")).map(({ id }) => id), ["open"]);
  assert.deepEqual(filterTasks(setFilter(state, "completed")).map(({ id }) => id), ["done"]);
  assert.deepEqual(filterTasks(state).map(({ id }) => id), ["open", "done"]);
  assert.equal(setFilter(state, "unknown"), state);
});

test("round-trips a normalized state through the storage codec", () => {
  const state = createState(
    [{ id: "one", title: "One", completed: false }],
    "active",
  );

  assert.equal(encodeState(state), '{"tasks":[{"id":"one","title":"One","completed":false}],"filter":"active"}');
  assert.deepEqual(decodeState(encodeState(state)), state);
});

test("decodes corrupt or malformed storage into safe state", () => {
  assert.deepEqual(decodeState("not json"), createState());
  assert.deepEqual(decodeState('{"tasks":"not-an-array","filter":"bad"}'), createState());
  assert.deepEqual(
    decodeState('{"tasks":[{"id":"ok","title":"Safe","completed":true},{"id":"","title":"Bad","completed":false}],"filter":"completed"}'),
    createState([{ id: "ok", title: "Safe", completed: true }], "completed"),
  );
});
