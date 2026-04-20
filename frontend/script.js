// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = window.API_BASE || 'http://localhost:8000';

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('tm_token'),
  getUser:  () => JSON.parse(localStorage.getItem('tm_user') || 'null'),
  set: (token, user) => {
    localStorage.setItem('tm_token', token);
    localStorage.setItem('tm_user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('tm_token');
    localStorage.removeItem('tm_user');
  },
  isLoggedIn: () => !!localStorage.getItem('tm_token'),
};

// ─── API Client ───────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) { Auth.clear(); window.location.href = 'login.html'; return; }
  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Something went wrong');
  return data;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.innerHTML = (type === 'error' ? '⚠ ' : '✓ ') + msg;
  setTimeout(() => el.classList.remove('show'), 5000);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait…' : btn.dataset.label;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function priorityBadge(p) {
  return `<span class="badge badge-${p}">${p}</span>`;
}

// ─── Time tag helper ──────────────────────────────────────────────────────────
function timeTag(start_time, end_time, completed) {
  if (!start_time && !end_time) return '';
  if (completed) {
    return `<span class="time-tag ok">✓ ${start_time ? formatDateTime(start_time) : ''} ${end_time ? '→ ' + formatDateTime(end_time) : ''}</span>`;
  }

  const now = new Date();
  const end = end_time ? new Date(end_time) : null;
  const diffMs = end ? end - now : null;
  const diffHrs = diffMs ? diffMs / 3600000 : null;

  let cls = 'ok', icon = '🕐';
  if (end) {
    if (diffMs < 0)        { cls = 'overdue'; icon = '⚠ Overdue!'; }
    else if (diffHrs < 2)  { cls = 'soon';    icon = '⏰ Due soon!'; }
    else                   { cls = 'ok';       icon = '📅'; }
  }

  const startStr = start_time ? `${formatDateTime(start_time)}` : '';
  const endStr   = end_time   ? ` → ${formatDateTime(end_time)}` : '';
  return `<span class="time-tag ${cls}">${icon} ${startStr}${endStr}</span>`;
}

// ─── Reward Toast ─────────────────────────────────────────────────────────────
function showReward(message, quote) {
  const toast = document.getElementById('reward-toast');
  if (!toast) return;
  toast.innerHTML = `
    <div style="font-size:16px;margin-bottom:6px;">${message}</div>
    <div style="font-size:12px;opacity:0.85;font-style:italic;">${quote}</div>
  `;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 5000);
}

// ─── Motivation Quotes ────────────────────────────────────────────────────────
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
];

const GOALS = [
  "Complete at least 1 task today! 💪",
  "You can do this — one task at a time! 🚀",
  "Every completed task is a win! 🏆",
  "Stay focused, you've got this! 🎯",
  "Make today count — finish your tasks! ⚡",
  "Small progress is still progress! 🌱",
];

let quoteIndex = Math.floor(Date.now() / 86400000) % QUOTES.length;

function showQuote(q) {
  const textEl   = document.getElementById('quote-text');
  const authorEl = document.getElementById('quote-author');
  const goalEl   = document.getElementById('task-goal');
  if (!textEl) return;

  textEl.style.opacity   = '0';
  textEl.style.transform = 'translateY(8px)';
  setTimeout(() => {
    textEl.textContent   = q.text;
    if (authorEl) authorEl.textContent = '— ' + q.author;
    if (goalEl)   goalEl.textContent   = GOALS[Math.floor(Math.random() * GOALS.length)];
    textEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    textEl.style.opacity    = '1';
    textEl.style.transform  = 'translateY(0)';
  }, 200);
}

async function refreshMotivation() {
  try {
    const mot = await apiFetch('/profile/motivation');
    const textEl   = document.getElementById('quote-text');
    const authorEl = document.getElementById('quote-author');
    const goalEl   = document.getElementById('task-goal');
    if (textEl)   textEl.textContent   = mot.message;
    if (authorEl) authorEl.textContent = '💬 ' + mot.quote;
    if (goalEl)   goalEl.textContent   = GOALS[Math.floor(Math.random() * GOALS.length)];
  } catch {
    quoteIndex = (quoteIndex + 1) % QUOTES.length;
    showQuote(QUOTES[quoteIndex]);
  }
}

// ─── Password Strength ────────────────────────────────────────────────────────
function checkPasswordStrength(password) {
  const checks = {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let strength = 'Weak', color = '#ef4444';
  if (passed === 3) { strength = 'Fair';   color = '#f59e0b'; }
  if (passed === 4) { strength = 'Good';   color = '#3b82f6'; }
  if (passed === 5) { strength = 'Strong'; color = '#10b981'; }
  return { checks, passed, strength, color };
}

function updateStrengthUI(password) {
  const bar   = document.getElementById('strength-bar');
  const text  = document.getElementById('strength-text');
  const hints = document.getElementById('strength-hints');
  if (!bar) return;
  if (!password) { bar.style.width = '0%'; text.textContent = ''; hints.innerHTML = ''; return; }
  const { checks, passed, strength, color } = checkPasswordStrength(password);
  bar.style.width      = (passed / 5 * 100) + '%';
  bar.style.background = color;
  text.textContent     = strength;
  text.style.color     = color;
  const h = (ok, label) => `<span style="font-size:11px;padding:2px 8px;border-radius:4px;
    background:${ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)'};
    color:${ok ? '#10b981' : '#94a3b8'};
    border:1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'transparent'};">
    ${ok ? '✓' : '○'} ${label}</span>`;
  hints.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
    ${h(checks.length,'8+ chars')}${h(checks.upper,'Uppercase')}
    ${h(checks.lower,'Lowercase')}${h(checks.number,'Number')}${h(checks.special,'Special char')}
  </div>`;
}

// ─── Register Page ────────────────────────────────────────────────────────────
function initRegister() {
  Auth.clear();

  document.getElementById('password')?.addEventListener('input', (e) => {
    updateStrengthUI(e.target.value);
  });

  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('confirm').value;

    if (password !== confirm) { showAlert('alert', 'Passwords do not match!'); return; }

    const { passed } = checkPasswordStrength(password);
    if (passed < 3) {
      showAlert('alert', 'Password too weak! Use 8+ chars with uppercase, lowercase and a number.');
      return;
    }

    setLoading('submit-btn', true);
    try {
      await apiFetch('/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      const data = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      Auth.set(data.access_token, data.user);
      showAlert('alert', 'Account created! Taking you to dashboard…', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } catch (err) {
      if (err.message.includes('Username already taken')) {
        showAlert('alert', 'Username already taken! Choose a different one.');
      } else if (err.message.includes('Email already registered')) {
        showAlert('alert', 'Email already registered! Please login instead.');
      } else {
        showAlert('alert', err.message);
      }
    } finally {
      setLoading('submit-btn', false);
    }
  });
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function initLogin() {
  if (Auth.isLoggedIn()) { window.location.href = 'dashboard.html'; return; }

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) { showAlert('alert', 'Please enter username and password.'); return; }

    setLoading('submit-btn', true);
    try {
      const data = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      Auth.set(data.access_token, data.user);
      window.location.href = 'dashboard.html';
    } catch (err) {
      showAlert('alert', "Username or password is incorrect. Don't have an account? Please create one.");
    } finally {
      setLoading('submit-btn', false);
    }
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
let dashState = {
  tasks: [], total: 0, page: 1, perPage: 10,
  filter: null, priority: '',
};

async function initDashboard() {
  if (!Auth.isLoggedIn()) { window.location.href = 'login.html'; return; }

  const user = Auth.getUser();
  const displayName = user?.full_name || user?.username || 'user';
  const badge = document.getElementById('user-badge');
  if (badge) badge.textContent = `@${user?.username || 'user'}`;

  // Avatar in topbar
  if (user?.profile_picture) {
    const img = document.getElementById('avatar-sm-img');
    const ph  = document.getElementById('avatar-sm-placeholder');
    if (img) { img.src = `${API_BASE}/uploads/profiles/${user.profile_picture}`; img.style.display = 'block'; }
    if (ph)  ph.style.display = 'none';
  } else {
    const ph = document.getElementById('avatar-sm-placeholder');
    if (ph) ph.textContent = (displayName[0] || '?').toUpperCase();
  }

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    Auth.clear(); window.location.href = 'login.html';
  });

  document.getElementById('task-form')?.addEventListener('submit', handleCreateTask);
  document.getElementById('filter-all')?.addEventListener('click', () => setFilter(null));
  document.getElementById('filter-active')?.addEventListener('click', () => setFilter(false));
  document.getElementById('filter-done')?.addEventListener('click', () => setFilter(true));
  document.getElementById('priority-filter')?.addEventListener('change', (e) => {
    dashState.priority = e.target.value; dashState.page = 1; loadTasks();
  });

  // Load motivation from API (personalized with name)
  try {
    const mot = await apiFetch('/profile/motivation');
    const textEl   = document.getElementById('quote-text');
    const authorEl = document.getElementById('quote-author');
    const goalEl   = document.getElementById('task-goal');
    if (textEl)   textEl.textContent   = mot.message;
    if (authorEl) authorEl.textContent = '💬 ' + mot.quote;
    if (goalEl)   goalEl.textContent   = GOALS[Math.floor(Math.random() * GOALS.length)];
  } catch {
    showQuote(QUOTES[quoteIndex]);
  }

  loadTasks();
}

function setFilter(val) {
  dashState.filter = val; dashState.page = 1;
  ['filter-all','filter-active','filter-done'].forEach(id =>
    document.getElementById(id)?.classList.remove('active'));
  if (val === null)  document.getElementById('filter-all')?.classList.add('active');
  if (val === false) document.getElementById('filter-active')?.classList.add('active');
  if (val === true)  document.getElementById('filter-done')?.classList.add('active');
  loadTasks();
}

async function loadTasks() {
  const list = document.getElementById('task-list');
  if (!list) return;
  list.innerHTML = '<div class="loading">Loading tasks…</div>';

  const params = new URLSearchParams({ page: dashState.page, per_page: dashState.perPage });
  if (dashState.filter !== null) params.set('completed', dashState.filter);
  if (dashState.priority) params.set('priority', dashState.priority);

  try {
    const data = await apiFetch(`/tasks?${params}`);
    dashState.tasks = data.tasks;
    dashState.total = data.total;
    renderTasks(data.tasks, data.total);
    updateStats();
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠</div>
      <div class="empty-title">${err.message}</div></div>`;
  }
}

function renderTasks(tasks, total) {
  const list = document.getElementById('task-list');
  if (!list) return;

  if (!tasks.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-title">No tasks found</div>
      <div class="empty-sub">Create your first task above</div>
    </div>`;
    return;
  }

  list.innerHTML = tasks.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}" id="task-${task.id}">
      <div class="task-check ${task.completed ? 'done' : ''}"
           onclick="toggleTask(${task.id}, ${task.completed})"
           title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
        ${task.completed ? '✓' : ''}
      </div>
      <div class="task-body">
        <div class="task-title">${escHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          ${priorityBadge(task.priority)}
          ${task.completed ? '<span class="badge badge-done">Completed</span>' : ''}
          ${timeTag(task.start_time, task.end_time, task.completed)}
          <span class="task-date">${formatDate(task.created_at)}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-danger" onclick="deleteTask(${task.id})" title="Delete">✕</button>
      </div>
    </div>
  `).join('');

  renderPagination(total);
}

function renderPagination(total) {
  const container = document.getElementById('pagination');
  if (!container) return;
  const totalPages = Math.ceil(total / dashState.perPage);
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = '<div class="filter-bar" style="justify-content:center;margin-top:16px">';
  if (dashState.page > 1) html += `<button class="filter-chip" onclick="goPage(${dashState.page-1})">← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="filter-chip ${i===dashState.page?'active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  if (dashState.page < totalPages) html += `<button class="filter-chip" onclick="goPage(${dashState.page+1})">Next →</button>`;
  html += '</div>';
  container.innerHTML = html;
}

function goPage(p) { dashState.page = p; loadTasks(); }

async function updateStats() {
  try {
    const [all, done] = await Promise.all([
      apiFetch('/tasks?per_page=1'),
      apiFetch('/tasks?completed=true&per_page=1'),
    ]);
    document.getElementById('stat-total').textContent   = all.total;
    document.getElementById('stat-done').textContent    = done.total;
    document.getElementById('stat-pending').textContent = all.total - done.total;
  } catch (_) {}
}

async function handleCreateTask(e) {
  e.preventDefault();
  const title    = document.getElementById('new-title').value.trim();
  const desc     = document.getElementById('new-desc').value.trim();
  const priority = document.getElementById('new-priority').value;
  const startRaw = document.getElementById('new-start').value;
  const endRaw   = document.getElementById('new-end').value;

  if (!title) return;

  const body = {
    title,
    description: desc || null,
    priority,
    start_time: startRaw ? startRaw : null,
    end_time:   endRaw   ? endRaw   : null,
    
  };

  const btn = document.getElementById('create-btn');
  btn.disabled = true;
  try {
    await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(body) });
    e.target.reset();
    dashState.page = 1;
    await loadTasks();
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
  }
}

async function toggleTask(id, currentlyCompleted) {
  try {
    const result = await apiFetch(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: !currentlyCompleted }),
    });
    // Show reward toast if task was just completed
    if (!currentlyCompleted && result.reward) {
      showReward(result.reward, result.quote || '');
    }
    await loadTasks();
  } catch (err) { alert(err.message); }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
    await loadTasks();
  } catch (err) { alert(err.message); }
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Auto-init ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'register')  initRegister();
  if (page === 'login')     initLogin();
  if (page === 'dashboard') initDashboard();
});


