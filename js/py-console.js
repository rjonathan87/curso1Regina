// ===== PYTHON CONSOLE FLOATING BUTTON — Curso Informática Regina =====
// Botón flotante + modal con Pyodide, disponible desde cualquier página.
// Se auto-inicializa al cargar el script.

(function() {
  'use strict';

  let pyodide = null;

  // ── Crear elementos DOM ──────────────────────────────────────────────
  function createUI() {
    // Botón flotante
    const fab = document.createElement('button');
    fab.id = 'py-console-fab';
    fab.setAttribute('aria-label', 'Abrir consola Python');
    fab.innerHTML = '🐍';
    fab.title = 'Consola Python (haz clic para abrir)';
    document.body.appendChild(fab);

    // Overlay + Modal
    const overlay = document.createElement('div');
    overlay.id = 'py-console-overlay';
    overlay.innerHTML = `
      <div id="py-console-modal">
        <div class="py-editor-header">
          <span>🐍 Python 3.12 (en tu navegador)</span>
          <div style="display:flex;align-items:center;gap:.5rem;">
            <button class="py-run-btn" id="py-fab-run">▶ Ejecutar</button>
            <button id="py-console-close">✕</button>
          </div>
        </div>
        <textarea id="py-fab-code" spellcheck="false" placeholder="# Escribe tu código Python aquí y presiona Ejecutar">print('¡Hola desde la consola!')</textarea>
        <div class="py-output" id="py-fab-output">💡 Escribe código arriba y presiona "Ejecutar".</div>
        <div class="py-loading" id="py-fab-loading" style="display:none;">
          <div class="spinner"></div>
          Cargando Python…
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // ── Eventos ──
    fab.addEventListener('click', openModal);
    document.getElementById('py-console-close').addEventListener('click', closeModal);
    document.getElementById('py-fab-run').addEventListener('click', runPython);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });

    // Cerrar con Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
  }

  function openModal() {
    document.getElementById('py-console-overlay').classList.add('open');
    document.getElementById('py-fab-code').focus();
    loadPyodideRuntime();
  }

  function closeModal() {
    document.getElementById('py-console-overlay').classList.remove('open');
  }

  // ── Pyodide ──────────────────────────────────────────────────────────
  async function loadPyodideRuntime() {
    if (pyodide) return;
    const loading = document.getElementById('py-fab-loading');
    const output = document.getElementById('py-fab-output');
    loading.style.display = 'flex';
    output.textContent = '⏳ Cargando Python en tu navegador… (solo la primera vez)';
    try {
      if (typeof globalThis.loadPyodide !== 'function') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      pyodide = await globalThis.loadPyodide();
      loading.style.display = 'none';
      output.textContent = '✅ Python listo. Escribe código y presiona "Ejecutar".';
      output.className = 'py-output success';
    } catch (e) {
      loading.style.display = 'none';
      output.textContent = '❌ Error al cargar Python: ' + e.message;
      output.className = 'py-output error';
    }
  }

  async function runPython() {
    const btn = document.getElementById('py-fab-run');
    const codeEl = document.getElementById('py-fab-code');
    const output = document.getElementById('py-fab-output');

    if (!pyodide) {
      output.textContent = '⏳ Python todavía no termina de cargar. Espera un momento…';
      output.className = 'py-output';
      return;
    }

    const code = codeEl.value.trim();
    if (!code) {
      output.textContent = '✏️ Escribe código en el editor antes de ejecutar.';
      output.className = 'py-output';
      return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Ejecutando…';
    output.className = 'py-output';

    try {
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
      `);
      pyodide.runPython(code);
      const result = pyodide.runPython('sys.stdout.getvalue()');
      if (result && result.trim()) {
        output.textContent = result;
        output.className = 'py-output success';
      } else {
        output.textContent = '✅ Código ejecutado sin errores (no hubo output de print())';
        output.className = 'py-output success';
      }
    } catch (e) {
      output.textContent = '❌ ' + e.message;
      output.className = 'py-output error';
    }

    btn.disabled = false;
    btn.textContent = '▶ Ejecutar';
  }

  // ── Init ─────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }

})();
