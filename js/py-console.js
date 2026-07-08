// ===== PYTHON CONSOLE FLOATING BUTTON — Curso Informática Regina =====
// Botón flotante + modal con Pyodide + botones "Ejecutar" en bloques de código.
// Disponible desde cualquier página del curso.

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
        <textarea id="py-fab-code" spellcheck="false" placeholder="# Escribe tu código Python aquí" style="min-height:120px;">print('¡Hola desde la consola!')</textarea>
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

    // Agregar botones a bloques de código Python
    setTimeout(addRunButtonsToCodeBlocks, 500);
  }

  function openModal() {
    document.getElementById('py-console-overlay').classList.add('open');
    document.getElementById('py-fab-code').focus();
    loadPyodideRuntime();
  }

  function closeModal() {
    document.getElementById('py-console-overlay').classList.remove('open');
  }

  // ── Botones "▶ Ejecutar" en bloques de código ────────────────────────
  function addRunButtonsToCodeBlocks() {
    const codeBlocks = document.querySelectorAll('.code-body');

    codeBlocks.forEach(block => {
      // No agregar si ya tiene botón
      if (block.querySelector('.py-run-code-btn')) return;

      const text = block.textContent.trim();

      // Detectar si es código Python (keywords del lenguaje)
      const isPython = /^(print|if |for |while |def |import |from |class |try:|elif |else:|return |# )/m.test(text)
        || /\b(input|int\(|float\(|range\(|len\(|random\.|datetime\.|\.append\(|\.strip\(|\.lower\(|\.upper\()/.test(text)
        || /^[a-zA-Z_]\w*\s*[=<>]/.test(text.split('\n')[0]);  // variable = algo

      if (!isPython) return;

      // Crear botón ▶
      const btn = document.createElement('button');
      btn.className = 'py-run-code-btn';
      btn.textContent = '▶ Ejecutar';
      btn.title = 'Ejecutar este código en la consola Python';
      btn.setAttribute('aria-label', 'Ejecutar código Python');

      // Insertar botón dentro del code-header o al inicio del bloque
      const header = block.closest('.code-block')?.querySelector('.code-header');
      if (header) {
        const wrapper = document.createElement('span');
        wrapper.style.cssText = 'display:inline-flex;align-items:center;gap:.3rem;';
        wrapper.appendChild(btn);
        header.querySelector('span')?.after(wrapper);
      }

      // Evento: abrir modal + pegar código + ejecutar
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const code = extractPythonCode(block);
        openModalAndRun(code);
      });
    });
  }

  // Extraer código limpio, eliminando números de línea si existen
  function extractPythonCode(block) {
    let html = block.innerHTML;
    // Reemplazar <br/> con saltos de línea
    html = html.replace(/<br\s*\/?>/gi, '\n');
    // Quitar etiquetas HTML
    const text = html.replace(/<[^>]+>/g, '');
    // Limpiar espacios al inicio de cada línea (sangría)
    const lines = text.split('\n').map(l => l.replace(/\u00a0/g, ' ').trimEnd());
    return lines.join('\n').trim();
  }

  function openModalAndRun(code) {
    openModal();
    const codeEl = document.getElementById('py-fab-code');
    codeEl.value = code;
    // Ejecutar después de un breve delay para que Pyodide cargue
    setTimeout(() => runPython(), 300);
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

  // Exponer función para que pueda ser llamada desde cualquier lado
  window.runPythonCode = openModalAndRun;

  // ── Init ─────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }

})();
