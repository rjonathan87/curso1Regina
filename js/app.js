// ===== MAIN APP JS - Curso Informática Regina =====

// ── Endpoint de la API ──────────────────────────────────────────────────────
// • Live Server (puerto 5500)  → apunta al servidor Express local en :3000
// • Vercel / Express (:3000)   → ruta relativa /api (mismo origen)
const API_BASE =
  (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') &&
  window.location.port === '5500'
    ? 'http://localhost:3000/api'
    : '/api';

// ── Perfil del usuario activo (cargado desde localStorage o del servidor) ────
let currentUser = null;  // { userId, name, email }

// ---- Lista maestra de todos los ítems del curso (para progreso global) ----
const ALL_CHECKLIST_IDS = [
  // Fase 0 · Bienvenida
  'f0-1-1','f0-1-2','f0-1-3','f0-1-4','f0-1-5','f0-1-6',
  'f0-2-1','f0-2-2','f0-2-3','f0-2-4',
  // Unidad 1 · Información Digital
  'u1-1-1','u1-1-2','u1-1-3','u1-1-4',
  'u1-2-1','u1-2-2','u1-2-3',
  'u1-3-1','u1-3-2','u1-3-3',
  'u1-4-1','u1-4-2','u1-4-3','u1-4-4',
  // Unidad 2 · Procesamiento
  'u2-1-1','u2-1-2','u2-1-3',
  'u2-2-1','u2-2-2','u2-2-3',
  'u2-3-1','u2-3-2','u2-3-3',
  'u2-4-1','u2-4-2','u2-4-3','u2-4-4',
  // Unidad 3 · Algoritmos
  'u3-1-1','u3-1-2','u3-1-3',
  'u3-2-1','u3-2-2','u3-2-3','u3-2-4',
  'u3-3-1','u3-3-2','u3-3-3',
  'u3-4-1','u3-4-2','u3-4-3','u3-4-4',
  'u3-5-1','u3-5-2','u3-5-3',
  // Proyecto Final
  'proy-1-1',
  'proy-2-1','proy-2-2',
  'proy-3-1','proy-3-2',
  'proy-4-1','proy-4-2','proy-4-3'
];

// ---- Navigation ----
function initNav() {
  const links = document.querySelectorAll('.sidebar-nav a');
  links.forEach(link => {
    link.addEventListener('click', function () {
      links.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      // Close sidebar on mobile
      if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });
}

// ---- Mobile sidebar toggle ----
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ---- Accordion Sessions ----
function toggleSession(el) {
  const content = el.nextElementSibling;
  const icon = el.querySelector('.toggle-icon');
  content.classList.toggle('open');
  if (icon) icon.style.transform = content.classList.contains('open') ? 'rotate(180deg)' : '';
}

// ---- Tabs ----
function switchTab(groupId, tabIndex) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === tabIndex);
  });
  group.querySelectorAll('.tab-panel').forEach((panel, i) => {
    panel.classList.toggle('active', i === tabIndex);
  });
}

// ---- Checklist (persisted in localStorage) ----
function initChecklists() {
  document.querySelectorAll('.checklist-item').forEach(item => {
    const key = 'check_' + item.dataset.id;
    if (localStorage.getItem(key) === '1') {
      item.classList.add('checked');
      const box = item.querySelector('.check-box');
      if (box) box.innerHTML = '✓';
    }
    item.addEventListener('click', () => toggleCheck(item));
  });
  updateProgress();
}

function toggleCheck(item) {
  const key = 'check_' + item.dataset.id;
  const box = item.querySelector('.check-box');
  item.classList.toggle('checked');
  if (item.classList.contains('checked')) {
    localStorage.setItem(key, '1');
    if (box) box.innerHTML = '✓';
  } else {
    localStorage.removeItem(key);
    if (box) box.innerHTML = '';
  }
  updateProgress();
}

function updateProgress() {
  const total = ALL_CHECKLIST_IDS.length;
  const checked = ALL_CHECKLIST_IDS.filter(id => localStorage.getItem('check_' + id) === '1').length;
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  document.querySelectorAll('.main-progress-fill').forEach(b => b.style.width = pct + '%');
  document.querySelectorAll('.main-progress-label').forEach(l => l.textContent = pct + '%');
}

// ---- Module page active highlight in sidebar ----
function highlightCurrentModule() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page) a.classList.add('active');
  });
}

// ── Modal de bienvenida / captura de correo ───────────────────────────────────

function injectWelcomeModal() {
  if (document.getElementById('welcome-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'welcome-modal';
  modal.innerHTML = `
<div id="welcome-overlay" style="
  position:fixed;inset:0;z-index:9999;
  background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);
  display:flex;align-items:center;justify-content:center;padding:1rem;">
  <div style="
    background:#1e293b;border:1px solid #334155;border-radius:1.25rem;
    padding:2.5rem 2rem;max-width:440px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.6);">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:1.75rem;">
      <div style="font-size:2.5rem;margin-bottom:0.5rem;">💻</div>
      <div style="font-size:1.3rem;font-weight:800;color:#f1f5f9;">Curso de Informática</div>
      <div style="font-size:0.8rem;color:#94a3b8;margin-top:0.25rem;">Introducción · Con Regina</div>
    </div>
    <!-- Copy -->
    <p style="color:#cbd5e1;font-size:0.9rem;line-height:1.7;text-align:center;margin-bottom:2rem;">
      ¡Bienvenida! Deja tu nombre y correo para guardar tu progreso en el curso y que puedas retomarlo cuando quieras. 🎉
    </p>
    <!-- Form -->
    <form id="welcome-form" novalidate autocomplete="off">
      <div style="margin-bottom:1rem;">
        <label for="wm-name" style="display:block;font-size:0.8rem;color:#94a3b8;margin-bottom:0.4rem;font-weight:600;">Tu nombre</label>
        <input id="wm-name" type="text" placeholder="Ej: Regina" maxlength="100"
          style="width:100%;background:#0f172a;border:1px solid #334155;border-radius:0.6rem;
                 padding:0.65rem 1rem;color:#f1f5f9;font-size:0.95rem;outline:none;
                 transition:border-color 0.2s;" />
      </div>
      <div style="margin-bottom:1.5rem;">
        <label for="wm-email" style="display:block;font-size:0.8rem;color:#94a3b8;margin-bottom:0.4rem;font-weight:600;">Tu correo electrónico</label>
        <input id="wm-email" type="email" placeholder="nombre@correo.com" maxlength="254"
          style="width:100%;background:#0f172a;border:1px solid #334155;border-radius:0.6rem;
                 padding:0.65rem 1rem;color:#f1f5f9;font-size:0.95rem;outline:none;
                 transition:border-color 0.2s;" />
      </div>
      <div id="wm-error" style="display:none;color:#f87171;font-size:0.82rem;margin-bottom:1rem;text-align:center;"></div>
      <button type="submit" id="wm-btn"
        style="width:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);
               color:white;border:none;border-radius:0.6rem;padding:0.8rem 1rem;
               font-weight:700;font-size:1rem;cursor:pointer;transition:opacity 0.2s;">
        Comenzar el curso →
      </button>
      <p style="text-align:center;font-size:0.75rem;color:#64748b;margin-top:1rem;line-height:1.5;">
        Tu correo solo se usa para guardar tu progreso.<br>No se comparte con nadie.
      </p>
    </form>
  </div>
</div>`;
  document.body.appendChild(modal);

  // Focus en el primer campo
  setTimeout(() => document.getElementById('wm-name').focus(), 100);

  document.getElementById('welcome-form').addEventListener('submit', handleWelcomeSubmit);
}

async function handleWelcomeSubmit(e) {
  e.preventDefault();
  const name   = document.getElementById('wm-name').value.trim();
  const email  = document.getElementById('wm-email').value.trim();
  const errEl  = document.getElementById('wm-error');
  const btn    = document.getElementById('wm-btn');

  errEl.style.display = 'none';

  if (!name)  return showModalError('Por favor ingresa tu nombre.');
  if (!email) return showModalError('Por favor ingresa tu correo electrónico.');

  btn.disabled    = true;
  btn.textContent = 'Guardando…';

  try {
    const res  = await fetch(`${API_BASE}/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email })
    });
    const data = await res.json();

    if (!res.ok) {
      showModalError(data.error || 'Error al registrar. Intenta de nuevo.');
      btn.disabled    = false;
      btn.textContent = 'Comenzar el curso →';
      return;
    }

    // Guardar en localStorage
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userName', data.name);
    localStorage.setItem('userEmail', data.email);
    currentUser = { userId: data.userId, name: data.name, email: data.email };

    // Mostrar saludo y cerrar modal
    const overlay = document.getElementById('welcome-overlay');
    overlay.innerHTML = `
      <div style="background:#1e293b;border:1px solid #22d3ee;border-radius:1.25rem;padding:2.5rem 2rem;
                  max-width:380px;width:100%;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,0.6);">
        <div style="font-size:3rem;margin-bottom:1rem;">🎉</div>
        <h2 style="color:#f1f5f9;font-size:1.3rem;font-weight:800;margin-bottom:0.75rem;">
          ¡Hola, ${escapeHtml(data.name)}!
        </h2>
        <p style="color:#94a3b8;font-size:0.9rem;line-height:1.7;">
          Tu progreso se irá guardando automáticamente. ¡Que empiece el aprendizaje!
        </p>
      </div>`;
    setTimeout(closeWelcomeModal, 1800);

  } catch (err) {
    showModalError('No se pudo conectar con el servidor. Verifica que esté activo.');
    btn.disabled    = false;
    btn.textContent = 'Comenzar el curso →';
  }
}

function showModalError(msg) {
  const el = document.getElementById('wm-error');
  el.textContent   = msg;
  el.style.display = 'block';
}

function closeWelcomeModal() {
  const modal = document.getElementById('welcome-modal');
  if (modal) modal.remove();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Mostrar badge con nombre de usuario en el topbar ─────────────────────────

function renderUserBadge() {
  if (!currentUser) return;
  const topbar = document.querySelector('.topbar');
  if (!topbar || document.getElementById('user-badge')) return;

  const badge = document.createElement('div');
  badge.id = 'user-badge';
  badge.title = currentUser.email;
  badge.style.cssText = `
    display:flex;align-items:center;gap:0.5rem;
    background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);
    border-radius:2rem;padding:0.35rem 0.85rem;cursor:default;`;
  badge.innerHTML = `
    <span style="width:8px;height:8px;background:#22d3ee;border-radius:50%;flex-shrink:0;"></span>
    <span style="font-size:0.78rem;color:#94a3b8;max-width:140px;overflow:hidden;
                 text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(currentUser.name)}</span>`;
  topbar.appendChild(badge);
}

// ── Sincronización de progreso con el servidor ────────────────────────────────

async function syncProgressToServer(checklistId, checked) {
  if (!currentUser) return;
  try {
    await fetch(`${API_BASE}/progress`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        userId:      currentUser.userId,
        checklistId,
        checked,
        totalItems:  ALL_CHECKLIST_IDS.length
      })
    });
  } catch (_) {
    // Fallo silencioso — el progreso ya está en localStorage
  }
}

// ── Init del sistema de usuarios ─────────────────────────────────────────────

function initUserSystem() {
  const userId = localStorage.getItem('userId');
  const name   = localStorage.getItem('userName');
  const email  = localStorage.getItem('userEmail');

  if (userId && name && email) {
    currentUser = { userId, name, email };
    renderUserBadge();
  } else {
    injectWelcomeModal();
  }
}

// ── Navigation ───────────────────────────────────────────────────────────────
function initNav() {
  const links = document.querySelectorAll('.sidebar-nav a');
  links.forEach(link => {
    link.addEventListener('click', function () {
      links.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });
}

// ---- Mobile sidebar toggle ----
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ---- Accordion Sessions ----
function toggleSession(el) {
  const content = el.nextElementSibling;
  const icon = el.querySelector('.toggle-icon');
  content.classList.toggle('open');
  if (icon) icon.style.transform = content.classList.contains('open') ? 'rotate(180deg)' : '';
}

// ---- Tabs ----
function switchTab(groupId, tabIndex) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === tabIndex);
  });
  group.querySelectorAll('.tab-panel').forEach((panel, i) => {
    panel.classList.toggle('active', i === tabIndex);
  });
}

// ---- Checklist (persisted in localStorage + sincronizado con servidor) ----
function initChecklists() {
  document.querySelectorAll('.checklist-item').forEach(item => {
    const key = 'check_' + item.dataset.id;
    if (localStorage.getItem(key) === '1') {
      item.classList.add('checked');
      const box = item.querySelector('.check-box');
      if (box) box.innerHTML = '✓';
    }
    item.addEventListener('click', () => toggleCheck(item));
  });
  updateProgress();
}

function toggleCheck(item) {
  const key     = 'check_' + item.dataset.id;
  const box     = item.querySelector('.check-box');
  item.classList.toggle('checked');
  const checked = item.classList.contains('checked');
  if (checked) {
    localStorage.setItem(key, '1');
    if (box) box.innerHTML = '✓';
  } else {
    localStorage.removeItem(key);
    if (box) box.innerHTML = '';
  }
  updateProgress();
  syncProgressToServer(item.dataset.id, checked);
}

function updateProgress() {
  const total   = ALL_CHECKLIST_IDS.length;
  const checked = ALL_CHECKLIST_IDS.filter(id => localStorage.getItem('check_' + id) === '1').length;
  const pct     = total > 0 ? Math.round((checked / total) * 100) : 0;
  document.querySelectorAll('.main-progress-fill').forEach(b => b.style.width = pct + '%');
  document.querySelectorAll('.main-progress-label').forEach(l => l.textContent = pct + '%');
}

// ---- Module page active highlight in sidebar ----
function highlightCurrentModule() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page) a.classList.add('active');
  });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initChecklists();
  highlightCurrentModule();
  initUserSystem();
});
