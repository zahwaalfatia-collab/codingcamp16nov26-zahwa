/* =====================================================
   FOCUS DASHBOARD — app.js
   Challenges: Light/Dark mode, Custom name in greeting,
               Change Pomodoro time
   ===================================================== */

'use strict';

// ── Helpers ──────────────────────────────────────────
const $ = id => document.getElementById(id);
const LS = {
  get:    key        => JSON.parse(localStorage.getItem(key)),
  set:    (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  remove: key        => localStorage.removeItem(key),
};

// =====================================================
// 1. GREETING & DATE/TIME
// =====================================================
function updateDateTime() {
  const now  = new Date();
  const hour = now.getHours();

  // Date string
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  $('datetime').textContent = `${dateStr} · ${timeStr}`;

  // Greeting based on time
  let salutation;
  if (hour >= 5 && hour < 12)       salutation = 'Good morning';
  else if (hour >= 12 && hour < 17) salutation = 'Good afternoon';
  else if (hour >= 17 && hour < 21) salutation = 'Good evening';
  else                               salutation = 'Good night';

  const name = LS.get('userName') || '';
  $('greeting').textContent = name
    ? `${salutation}, ${name}! 👋`
    : `${salutation}! 👋`;
}

setInterval(updateDateTime, 1000);
updateDateTime();

// ── Custom name (Challenge) ─────────────────────────
const nameInput   = $('nameInput');
const saveNameBtn = $('saveNameBtn');

// Pre-fill saved name
const savedName = LS.get('userName');
if (savedName) nameInput.value = savedName;

saveNameBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (name) {
    LS.set('userName', name);
  } else {
    LS.remove('userName');
  }
  updateDateTime();
});

nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveNameBtn.click();
});

// =====================================================
// 2. LIGHT / DARK MODE (Challenge)
// =====================================================
const themeToggle = $('themeToggle');
const html        = document.documentElement;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  LS.set('theme', theme);
}

// Restore saved theme
const savedTheme = LS.get('theme') || 'light';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// =====================================================
// 3. FOCUS TIMER  (Challenge: custom duration)
// =====================================================
const timerDisplay  = $('timerDisplay');
const startBtn      = $('startBtn');
const stopBtn       = $('stopBtn');
const resetBtn      = $('resetBtn');
const durationInput = $('durationInput');
const setDurationBtn = $('setDurationBtn');

let totalSeconds  = (LS.get('pomoDuration') || 25) * 60;
let remaining     = totalSeconds;
let timerInterval = null;
let running       = false;

// Restore saved duration
durationInput.value = LS.get('pomoDuration') || 25;

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(remaining);
  timerDisplay.classList.toggle('running',  running && remaining > 0);
  timerDisplay.classList.toggle('finished', remaining === 0);
}

function tick() {
  if (remaining <= 0) {
    clearInterval(timerInterval);
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled  = true;
    renderTimer();
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus session complete! 🎉');
    } else {
      alert('⏰ Focus session complete!');
    }
    return;
  }
  remaining--;
  renderTimer();
}

startBtn.addEventListener('click', () => {
  if (running) return;
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  running = true;
  startBtn.disabled = true;
  stopBtn.disabled  = false;
  timerInterval = setInterval(tick, 1000);
  renderTimer();
});

stopBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  running = false;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  renderTimer();
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  running    = false;
  remaining  = totalSeconds;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  renderTimer();
});

// Set custom duration (Challenge)
setDurationBtn.addEventListener('click', () => {
  let mins = parseInt(durationInput.value, 10);
  if (isNaN(mins) || mins < 1)   mins = 1;
  if (mins > 120)                mins = 120;
  durationInput.value = mins;
  LS.set('pomoDuration', mins);

  clearInterval(timerInterval);
  running       = false;
  totalSeconds  = mins * 60;
  remaining     = totalSeconds;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  renderTimer();
});

durationInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') setDurationBtn.click();
});

renderTimer();

// =====================================================
// 4. TO-DO LIST
// =====================================================
const todoInput  = $('todoInput');
const addTodoBtn = $('addTodoBtn');
const todoList   = $('todoList');

let tasks      = LS.get('tasks') || [];
let sortMode   = 'default'; // 'default' | 'az' | 'za'

function saveTasks() { LS.set('tasks', tasks); }

function getSortedTasks() {
  if (sortMode === 'az') {
    return [...tasks].sort((a, b) => a.text.localeCompare(b.text));
  }
  if (sortMode === 'za') {
    return [...tasks].sort((a, b) => b.text.localeCompare(a.text));
  }
  return tasks; // default order
}

function renderTasks() {
  todoList.innerHTML = '';
  const list = getSortedTasks();

  list.forEach(task => {
    const li = document.createElement('li');
    li.className = 'todo__item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" ${task.done ? 'checked' : ''} title="Mark done" />
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="btn-icon edit-btn" title="Edit">✏️</button>
      <button class="btn-icon delete-btn" title="Delete">🗑️</button>
    `;

    // Toggle done
    li.querySelector('input[type="checkbox"]').addEventListener('change', () => {
      const t = tasks.find(t => t.id === task.id);
      if (t) t.done = !t.done;
      saveTasks();
      renderTasks();
    });

    // Edit — inline
    li.querySelector('.edit-btn').addEventListener('click', () => {
      const span = li.querySelector('.task-text');
      const input = document.createElement('input');
      input.type      = 'text';
      input.className = 'edit-input';
      input.value     = task.text;
      input.maxLength = 100;
      span.replaceWith(input);
      input.focus();

      const finishEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== task.text) {
          const t = tasks.find(t => t.id === task.id);
          if (t) t.text = newText;
          saveTasks();
        }
        renderTasks();
      };

      input.addEventListener('blur', finishEdit);
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') {
          input.value = task.text;
          input.blur();
        }
      });
    });

    // Delete
    li.querySelector('.delete-btn').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    todoList.appendChild(li);
  });
}

function addTask() {
  const text = todoInput.value.trim();
  if (!text) return;

  // Prevent duplicate tasks
  const duplicate = tasks.some(
    t => t.text.toLowerCase() === text.toLowerCase()
  );
  if (duplicate) {
    todoInput.style.borderColor = 'var(--danger)';
    todoInput.title = 'Task already exists!';
    setTimeout(() => {
      todoInput.style.borderColor = '';
      todoInput.title = '';
    }, 1500);
    return;
  }

  tasks.push({ id: Date.now(), text, done: false });
  saveTasks();
  todoInput.value = '';
  renderTasks();
}

addTodoBtn.addEventListener('click', addTask);
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

// Sort buttons
$('sortAZ').addEventListener('click', () => { sortMode = 'az'; renderTasks(); });
$('sortZA').addEventListener('click', () => { sortMode = 'za'; renderTasks(); });
$('sortDefault').addEventListener('click', () => { sortMode = 'default'; renderTasks(); });

renderTasks();

// =====================================================
// 5. QUICK LINKS
// =====================================================
const linkName   = $('linkName');
const linkUrl    = $('linkUrl');
const addLinkBtn = $('addLinkBtn');
const linkGrid   = $('linkGrid');

let links = LS.get('links') || [];

function saveLinks() { LS.set('links', links); }

function getFavicon(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?sz=16&domain=${origin}`;
  } catch {
    return '';
  }
}

function renderLinks() {
  linkGrid.innerHTML = '';
  links.forEach(link => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';

    const a = document.createElement('a');
    a.className = 'link-chip';
    a.href      = link.url;
    a.target    = '_blank';
    a.rel       = 'noopener noreferrer';

    const faviconSrc = getFavicon(link.url);
    a.innerHTML = `
      ${faviconSrc ? `<img src="${faviconSrc}" alt="" width="16" height="16" style="border-radius:3px;flex-shrink:0" />` : ''}
      <span>${escapeHtml(link.label)}</span>
      <button class="del-link" title="Remove link" data-id="${link.id}">✕</button>
    `;

    // Stop click on delete button from following the link
    a.querySelector('.del-link').addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    wrapper.appendChild(a);
    linkGrid.appendChild(wrapper);
  });
}

function addLink() {
  const label = linkName.value.trim();
  let   url   = linkUrl.value.trim();
  if (!label || !url) return;

  // Auto-prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  links.push({ id: Date.now(), label, url });
  saveLinks();
  linkName.value = '';
  linkUrl.value  = '';
  renderLinks();
}

addLinkBtn.addEventListener('click', addLink);
linkUrl.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });
linkName.addEventListener('keydown', e => { if (e.key === 'Enter') linkUrl.focus(); });

renderLinks();

// ── Utility ──────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
