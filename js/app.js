// ===== MAIN APP JS - Curso Informática Regina =====

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

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initChecklists();
  highlightCurrentModule();
});
