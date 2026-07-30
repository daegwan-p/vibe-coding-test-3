import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  update,
  remove,
  onValue,
  off,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0ysCTc_AX2791Oxl2nTmau01tEAl0tRc",
  authDomain: "vibe-coding-test-3.firebaseapp.com",
  projectId: "vibe-coding-test-3",
  storageBucket: "vibe-coding-test-3.firebasestorage.app",
  messagingSenderId: "482387984836",
  appId: "1:482387984836:web:0ae9091578d7713477e491",
  databaseURL: "https://vibe-coding-test-3-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const todosRef = ref(db, "todos");

const form = document.getElementById("add-form");
const input = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const listSection = document.getElementById("list-section");
const list = document.getElementById("todo-list");
const doneSection = document.getElementById("done-section");
const doneList = document.getElementById("done-list");
const doneToggle = document.getElementById("done-toggle");
const doneSectionCount = document.getElementById("done-section-count");
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyDesc = document.getElementById("empty-desc");
const countEl = document.getElementById("todo-count");
const filtersEl = document.getElementById("filters");
const clearDoneBtn = document.getElementById("clear-done");
const statusEl = document.getElementById("status");
const errorPanel = document.getElementById("error-panel");
const errorMessage = document.getElementById("error-message");
const retryBtn = document.getElementById("retry-btn");
const dateLine = document.getElementById("date-line");
const greetingEl = document.getElementById("greeting");
const fabAdd = document.getElementById("fab-add");
const statTotal = document.getElementById("stat-total");
const statActive = document.getElementById("stat-active");
const statDone = document.getElementById("stat-done");
const progressPercent = document.getElementById("progress-percent");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const badgeAll = document.getElementById("badge-all");
const badgeToday = document.getElementById("badge-today");
const badgeDaily = document.getElementById("badge-daily");
const badgeActive = document.getElementById("badge-active");
const badgeDone = document.getElementById("badge-done");

/**
 * @typedef {"all" | "today" | "daily" | "active" | "done"} FilterMode
 * @typedef {"once" | "daily"} TodoType
 * @typedef {{
 *   id: string,
 *   text: string,
 *   createdAt: number,
 *   type: TodoType,
 *   done: boolean,
 *   completions: Record<string, boolean>
 * }} Todo
 */

/** @type {Todo[]} */
let todos = [];
/** @type {string | undefined} */
let editingId;
/** @type {FilterMode} */
let filter = "all";
let isLoading = true;
let hasError = false;
let busy = false;
let doneCollapsed = true;

const EMPTY_COPY = {
  all: {
    title: "할 일이 없습니다",
    desc: "위에서 새 할 일을 추가해 보세요",
  },
  today: {
    title: "오늘 할 일이 없습니다",
    desc: "매일 할 일이나 오늘 추가한 일이 여기에 표시됩니다",
  },
  daily: {
    title: "매일 할 일이 없습니다",
    desc: "추가할 때 ‘매일’을 선택해 보세요",
  },
  active: {
    title: "진행 중인 일이 없습니다",
    desc: "모두 완료했거나 아직 추가하지 않았습니다",
  },
  done: {
    title: "오늘 완료한 일이 없습니다",
    desc: "체크하면 여기에 모입니다",
  },
};

function refreshIcons() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}

/** @param {Date} [date] */
function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isCalendarToday(timestamp) {
  return dateKey(new Date(timestamp)) === dateKey();
}

/** @param {Todo} todo */
function isDaily(todo) {
  return todo.type === "daily";
}

/** @param {Todo} todo */
function isDoneToday(todo) {
  if (isDaily(todo)) return Boolean(todo.completions?.[dateKey()]);
  return Boolean(todo.done);
}

/** @param {Todo} todo */
function isForToday(todo) {
  return isDaily(todo) || isCalendarToday(todo.createdAt);
}

/** @param {number} daysAgo */
function pastDateKey(daysAgo) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return dateKey(date);
}

function renderDateLine() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = "좋은 하루";
  if (hour < 12) greeting = "좋은 아침";
  else if (hour < 18) greeting = "좋은 오후";
  else greeting = "좋은 저녁";

  if (greetingEl) greetingEl.textContent = greeting;

  if (!dateLine) return;
  const datePart = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weekday = now.toLocaleDateString("ko-KR", { weekday: "long" });
  dateLine.textContent = `${datePart} · ${weekday}`;
}

function updateStatsUI() {
  const total = todos.length;
  const doneToday = todos.filter((todo) => isDoneToday(todo)).length;
  const active = todos.filter((todo) => !isDoneToday(todo)).length;
  const todayCount = todos.filter((todo) => isForToday(todo)).length;
  const dailyCount = todos.filter((todo) => isDaily(todo)).length;
  const percent = total === 0 ? 0 : Math.round((doneToday / total) * 100);

  if (statTotal) statTotal.textContent = String(total);
  if (statActive) statActive.textContent = String(active);
  if (statDone) statDone.textContent = String(doneToday);
  if (badgeAll) badgeAll.textContent = String(total);
  if (badgeToday) badgeToday.textContent = String(todayCount);
  if (badgeDaily) badgeDaily.textContent = String(dailyCount);
  if (badgeActive) badgeActive.textContent = String(active);
  if (badgeDone) badgeDone.textContent = String(doneToday);
  if (progressPercent) progressPercent.textContent = `${percent}%`;
  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressBar) progressBar.setAttribute("aria-valuenow", String(percent));
}

/** @param {Todo} todo */
function weekDotsHtml(todo) {
  if (!isDaily(todo)) return "";

  const dots = [];
  for (let i = 6; i >= 0; i -= 1) {
    const key = pastDateKey(i);
    const done = Boolean(todo.completions?.[key]);
    const label = key.slice(5).replace("-", "/");
    dots.push(
      `<span class="week-dot${done ? " is-done" : ""}" title="${label}"></span>`
    );
  }

  return `<div class="week-dots" aria-label="최근 7일 완료 기록">${dots.join("")}</div>`;
}

/** @param {Todo} todo */
function todoItemHtml(todo) {
  const done = isDoneToday(todo);

  if (todo.id === editingId) {
    return `
      <li class="todo-item editing" data-id="${todo.id}">
        <div class="edit-row">
          <input
            class="edit-input"
            type="text"
            value="${escapeAttr(todo.text)}"
            maxlength="120"
            aria-label="할 일 수정"
          />
          <button type="button" class="btn btn-primary" data-action="save">저장</button>
          <button type="button" class="btn btn-ghost" data-action="cancel">취소</button>
        </div>
      </li>
    `;
  }

  const typeBadge = isDaily(todo)
    ? `<span class="type-badge">매일</span>`
    : `<span class="type-badge type-badge-once">하루</span>`;

  return `
    <li class="todo-item${done ? " is-done" : ""}${isDaily(todo) ? " is-daily" : ""}" data-id="${todo.id}">
      <label class="todo-main">
        <span class="check-wrap">
          <input
            class="todo-check"
            type="checkbox"
            ${done ? "checked" : ""}
            aria-label="${isDaily(todo) ? "오늘 완료 표시" : "완료 표시"}"
          />
          <i data-lucide="check" class="check-icon" aria-hidden="true"></i>
        </span>
        <span class="todo-body">
          <span class="todo-text-row">
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            ${typeBadge}
          </span>
          ${weekDotsHtml(todo)}
        </span>
      </label>
      <div class="todo-actions">
        <button type="button" class="btn btn-ghost" data-action="edit" aria-label="수정">
          <i data-lucide="pencil" aria-hidden="true"></i>
        </button>
        <button type="button" class="btn btn-danger" data-action="delete" aria-label="삭제">
          <i data-lucide="trash-2" aria-hidden="true"></i>
        </button>
      </div>
    </li>
  `;
}

function selectedTodoType() {
  const checked = form.querySelector('input[name="todo-type"]:checked');
  if (checked instanceof HTMLInputElement && checked.value === "daily") {
    return "daily";
  }
  return "once";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;

  const text = input.value.trim();
  if (!text) return;

  const type = selectedTodoType();
  input.value = "";
  setBusy(true);
  try {
    /** @type {Record<string, unknown>} */
    const payload = {
      text,
      type,
      createdAt: Date.now(),
    };
    if (type === "daily") {
      payload.completions = {};
      payload.done = false;
    } else {
      payload.done = false;
    }
    await push(todosRef, payload);
  } catch (error) {
    console.error("추가 실패:", error);
    alert("할 일을 추가하지 못했습니다. Realtime Database 규칙을 확인해 주세요.");
  } finally {
    setBusy(false);
    input.focus();
  }
});

filtersEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const btn = target.closest("[data-filter]");
  if (!(btn instanceof HTMLElement)) return;

  const next = btn.dataset.filter;
  if (
    next !== "all" &&
    next !== "today" &&
    next !== "daily" &&
    next !== "active" &&
    next !== "done"
  ) {
    return;
  }

  filter = next;
  syncFilterButtons();
  render();
});

filtersEl.addEventListener("keydown", (event) => {
  const tabs = [...filtersEl.querySelectorAll("[data-filter]")];
  const currentIndex = tabs.findIndex((tab) => tab.classList.contains("is-active"));
  if (currentIndex < 0) return;

  let nextIndex = currentIndex;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = tabs.length - 1;
  else return;

  event.preventDefault();
  const nextTab = tabs[nextIndex];
  if (!(nextTab instanceof HTMLElement)) return;
  nextTab.focus();
  nextTab.click();
});

clearDoneBtn.addEventListener("click", async () => {
  if (busy) return;

  const onceDone = todos.filter((todo) => !isDaily(todo) && todo.done);
  const dailyDoneToday = todos.filter((todo) => isDaily(todo) && isDoneToday(todo));
  if (onceDone.length === 0 && dailyDoneToday.length === 0) return;

  setBusy(true);
  try {
    const today = dateKey();
    await Promise.all([
      ...onceDone.map((todo) => remove(ref(db, `todos/${todo.id}`))),
      ...dailyDoneToday.map((todo) =>
        update(ref(db, `todos/${todo.id}`), { [`completions/${today}`]: null })
      ),
    ]);
  } catch (error) {
    console.error("일괄 삭제 실패:", error);
    alert("완료된 할 일을 지우지 못했습니다.");
  } finally {
    setBusy(false);
  }
});

retryBtn.addEventListener("click", () => {
  startListening();
});

if (fabAdd) {
  fabAdd.addEventListener("click", () => {
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus();
  });
}

doneToggle.addEventListener("click", () => {
  doneCollapsed = !doneCollapsed;
  render();
});

listSection.addEventListener("change", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (!target.classList.contains("todo-check")) return;
  if (busy) return;

  const item = target.closest(".todo-item");
  if (!item) return;
  const id = item.dataset.id;
  if (!id) return;

  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  const done = target.checked;
  setBusy(true);
  try {
    if (isDaily(todo)) {
      const today = dateKey();
      const nextCompletions = { ...todo.completions };
      if (done) nextCompletions[today] = true;
      else delete nextCompletions[today];

      todos = todos.map((t) =>
        t.id === id ? { ...t, completions: nextCompletions } : t
      );
      render();
      await update(ref(db, `todos/${id}`), {
        [`completions/${today}`]: done ? true : null,
      });
    } else {
      todos = todos.map((t) => (t.id === id ? { ...t, done } : t));
      render();
      await update(ref(db, `todos/${id}`), { done });
    }
  } catch (error) {
    console.error("완료 상태 변경 실패:", error);
    render();
    alert("완료 상태를 바꾸지 못했습니다.");
  } finally {
    setBusy(false);
  }
});

listSection.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const actionBtn = target.closest("[data-action]");
  if (!(actionBtn instanceof HTMLElement)) return;
  if (busy && actionBtn.dataset.action !== "cancel") return;

  const item = actionBtn.closest(".todo-item");
  if (!item) return;

  const id = item.dataset.id;
  if (!id) return;

  const action = actionBtn.dataset.action;

  if (action === "delete") {
    await removeTodo(id, item);
    return;
  }

  if (action === "edit") {
    startEditing(id);
    return;
  }

  if (action === "save") {
    const editInput = item.querySelector(".edit-input");
    if (!(editInput instanceof HTMLInputElement)) return;
    const next = editInput.value.trim();
    if (!next) {
      editInput.focus();
      return;
    }
    await updateTodo(id, next);
    return;
  }

  if (action === "cancel") {
    editingId = undefined;
    render();
  }
});

listSection.addEventListener("keydown", async (event) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  if (!event.target.classList.contains("edit-input")) return;

  const item = event.target.closest(".todo-item");
  if (!item) return;
  const id = item.dataset.id;
  if (!id) return;

  if (event.key === "Enter") {
    event.preventDefault();
    if (busy) return;
    const next = event.target.value.trim();
    if (!next) return;
    await updateTodo(id, next);
  }

  if (event.key === "Escape") {
    event.preventDefault();
    editingId = undefined;
    render();
  }
});

async function updateTodo(id, text) {
  setBusy(true);
  try {
    editingId = undefined;
    todos = todos.map((todo) => (todo.id === id ? { ...todo, text } : todo));
    render();
    await update(ref(db, `todos/${id}`), { text });
  } catch (error) {
    console.error("수정 실패:", error);
    editingId = id;
    render();
    alert("할 일을 수정하지 못했습니다.");
  } finally {
    setBusy(false);
  }
}

async function removeTodo(id, itemEl) {
  setBusy(true);
  itemEl.classList.add("leaving");
  window.setTimeout(async () => {
    try {
      await remove(ref(db, `todos/${id}`));
      if (editingId === id) editingId = undefined;
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("할 일을 삭제하지 못했습니다.");
      render();
    } finally {
      setBusy(false);
    }
  }, 200);
}

function startEditing(id) {
  editingId = id;
  render();
  const editInput = listSection.querySelector(`[data-id="${id}"] .edit-input`);
  if (editInput instanceof HTMLInputElement) {
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  }
}

function getScopedTodos() {
  if (filter === "today") return todos.filter((todo) => isForToday(todo));
  if (filter === "daily") return todos.filter((todo) => isDaily(todo));
  if (filter === "active") return todos.filter((todo) => !isDoneToday(todo));
  if (filter === "done") return todos.filter((todo) => isDoneToday(todo));
  return todos;
}

function syncFilterButtons() {
  filtersEl.querySelectorAll("[data-filter]").forEach((btn) => {
    if (!(btn instanceof HTMLElement)) return;
    const active = btn.dataset.filter === filter;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
    btn.tabIndex = active ? 0 : -1;
  });
}

function setBusy(next) {
  busy = next;
  applyBusyState();
}

function applyBusyState() {
  addBtn.disabled = busy;
  clearDoneBtn.disabled = busy;
  input.disabled = busy;
  form.querySelectorAll('input[name="todo-type"]').forEach((el) => {
    if (el instanceof HTMLInputElement) el.disabled = busy;
  });
  listSection.querySelectorAll("button, .todo-check").forEach((el) => {
    if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
      if (el.dataset.action === "cancel") return;
      if (el.id === "done-toggle") return;
      el.disabled = busy;
    }
  });
}

function render() {
  updateStatsUI();

  if (isLoading) {
    statusEl.hidden = false;
    statusEl.textContent = "불러오는 중…";
    list.hidden = true;
    doneSection.hidden = true;
    emptyState.hidden = true;
    errorPanel.hidden = true;
    clearDoneBtn.hidden = true;
    refreshIcons();
    return;
  }

  if (hasError) {
    statusEl.hidden = true;
    list.hidden = true;
    doneSection.hidden = true;
    emptyState.hidden = true;
    errorPanel.hidden = false;
    clearDoneBtn.hidden = true;
    refreshIcons();
    return;
  }

  statusEl.hidden = true;
  errorPanel.hidden = true;

  const scoped = getScopedTodos();
  const doneTodayCount = todos.filter((todo) => isDoneToday(todo)).length;
  const showDoneDrawer = filter === "all" || filter === "today" || filter === "daily";

  /** @type {Todo[]} */
  let primary = [];
  /** @type {Todo[]} */
  let collapsedDone = [];

  if (showDoneDrawer) {
    primary = scoped.filter((todo) => !isDoneToday(todo));
    collapsedDone = scoped.filter((todo) => isDoneToday(todo));
  } else {
    primary = scoped;
  }

  list.innerHTML = primary.map(todoItemHtml).join("");
  doneList.innerHTML = collapsedDone.map(todoItemHtml).join("");

  const showingPrimary = primary.length;
  const total = todos.length;
  countEl.textContent =
    filter === "all" ? `${total}개` : `${scoped.length}개 / 전체 ${total}개`;

  clearDoneBtn.hidden = doneTodayCount === 0;
  const clearText = clearDoneBtn.querySelector("span:last-of-type");
  if (clearText) clearText.textContent = "오늘 완료 정리";

  if (showDoneDrawer && collapsedDone.length > 0) {
    doneSection.hidden = false;
    doneSection.classList.toggle("is-open", !doneCollapsed);
    doneToggle.setAttribute("aria-expanded", doneCollapsed ? "false" : "true");
    if (doneSectionCount) doneSectionCount.textContent = String(collapsedDone.length);
    doneList.hidden = doneCollapsed;
  } else {
    doneSection.hidden = true;
    doneList.hidden = true;
  }

  if (showingPrimary === 0 && !(showDoneDrawer && collapsedDone.length > 0)) {
    list.hidden = true;
    emptyState.hidden = false;
    const copy = EMPTY_COPY[filter];
    if (emptyTitle) emptyTitle.textContent = copy.title;
    if (emptyDesc) emptyDesc.textContent = copy.desc;
  } else if (showingPrimary === 0 && showDoneDrawer && collapsedDone.length > 0) {
    list.hidden = true;
    emptyState.hidden = true;
  } else {
    list.hidden = false;
    emptyState.hidden = true;
  }

  syncFilterButtons();
  applyBusyState();
  refreshIcons();
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(text) {
  return escapeHtml(text);
}

/** @param {unknown} value */
function normalizeTodo(id, value) {
  const raw = value && typeof value === "object" ? value : {};
  const type = raw.type === "daily" ? "daily" : "once";
  /** @type {Record<string, boolean>} */
  const completions = {};
  if (raw.completions && typeof raw.completions === "object") {
    for (const [key, flag] of Object.entries(raw.completions)) {
      if (flag) completions[key] = true;
    }
  }

  return {
    id,
    text: String(raw.text ?? ""),
    createdAt: Number(raw.createdAt ?? 0),
    type,
    done: Boolean(raw.done),
    completions,
  };
}

function startListening() {
  off(todosRef);
  isLoading = true;
  hasError = false;
  render();

  onValue(
    todosRef,
    (snapshot) => {
      isLoading = false;
      hasError = false;

      const data = snapshot.val();
      if (!data) {
        todos = [];
        render();
        return;
      }

      todos = Object.entries(data)
        .map(([id, value]) => normalizeTodo(id, value))
        .sort((a, b) => b.createdAt - a.createdAt);

      render();
    },
    (error) => {
      console.error("불러오기 실패:", error);
      isLoading = false;
      hasError = true;
      errorMessage.textContent =
        "할 일 목록을 불러오지 못했습니다. Realtime Database를 활성화하고 규칙을 확인해 주세요.";
      render();
    }
  );
}

renderDateLine();
syncFilterButtons();
refreshIcons();
startListening();
