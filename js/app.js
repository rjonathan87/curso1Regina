// ===== MAIN APP JS - Curso Informática Regina =====

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
  const allItems = document.querySelectorAll('.checklist-item[data-id]');
  const checked = document.querySelectorAll('.checklist-item.checked');
  const pct = allItems.length > 0 ? Math.round((checked.length / allItems.length) * 100) : 0;
  const bars = document.querySelectorAll('.main-progress-fill');
  bars.forEach(b => b.style.width = pct + '%');
  const labels = document.querySelectorAll('.main-progress-label');
  labels.forEach(l => l.textContent = pct + '%');
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
