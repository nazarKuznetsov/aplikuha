const FILTERS = new Set(["all", "active", "completed"]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTask(value) {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return null;
  }

  const id = value.id.trim();
  const title = value.title.trim();
  if (!id || !title || typeof value.completed !== "boolean") {
    return null;
  }

  return { id, title, completed: value.completed };
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  const ids = new Set();
  return tasks.reduce((normalized, task) => {
    const nextTask = normalizeTask(task);
    if (nextTask && !ids.has(nextTask.id)) {
      ids.add(nextTask.id);
      normalized.push(nextTask);
    }
    return normalized;
  }, []);
}

function isCanonicalState(state) {
  if (!isRecord(state) || !Array.isArray(state.tasks) || !FILTERS.has(state.filter)) {
    return false;
  }

  const ids = new Set();
  return state.tasks.every((task) => {
    const normalized = normalizeTask(task);
    if (!normalized || normalized.id !== task.id || normalized.title !== task.title || ids.has(task.id)) {
      return false;
    }
    ids.add(task.id);
    return true;
  });
}

function safeState(state) {
  return isCanonicalState(state) ? state : createState(state?.tasks, state?.filter);
}

export function createState(tasks = [], filter = "all") {
  return {
    tasks: normalizeTasks(tasks),
    filter: FILTERS.has(filter) ? filter : "all",
  };
}

export function addTask(state, task) {
  const current = safeState(state);
  if (!isRecord(task) || typeof task.id !== "string" || typeof task.title !== "string") {
    return current;
  }

  const id = task.id.trim();
  const title = task.title.trim();
  if (!id || !title || current.tasks.some((item) => item.id === id)) {
    return current;
  }

  return { ...current, tasks: [...current.tasks, { id, title, completed: false }] };
}

export function toggleTask(state, id) {
  const current = safeState(state);
  const taskIndex = current.tasks.findIndex((task) => task.id === id);
  if (taskIndex === -1) {
    return current;
  }

  return {
    ...current,
    tasks: current.tasks.map((task, index) => (
      index === taskIndex ? { ...task, completed: !task.completed } : task
    )),
  };
}

export function deleteTask(state, id) {
  const current = safeState(state);
  const tasks = current.tasks.filter((task) => task.id !== id);
  return tasks.length === current.tasks.length ? current : { ...current, tasks };
}

export function clearCompleted(state) {
  const current = safeState(state);
  const tasks = current.tasks.filter((task) => !task.completed);
  return tasks.length === current.tasks.length ? current : { ...current, tasks };
}

export function setFilter(state, filter) {
  const current = safeState(state);
  if (!FILTERS.has(filter) || filter === current.filter) {
    return current;
  }

  return { ...current, filter };
}

export function filterTasks(state) {
  const current = safeState(state);
  if (current.filter === "active") {
    return current.tasks.filter((task) => !task.completed);
  }
  if (current.filter === "completed") {
    return current.tasks.filter((task) => task.completed);
  }
  return [...current.tasks];
}

export function encodeState(state) {
  return JSON.stringify(safeState(state));
}

export function decodeState(serialized) {
  if (typeof serialized !== "string") {
    return createState();
  }

  try {
    const parsed = JSON.parse(serialized);
    return isRecord(parsed) ? createState(parsed.tasks, parsed.filter) : createState();
  } catch {
    return createState();
  }
}
