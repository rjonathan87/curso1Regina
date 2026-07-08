// ===== PYTHON CONSOLE FLOATING BUTTON — Curso Informática Regina =====
// Botón flotante + modal con Pyodide + botones "Ejecutar" en bloques de código.
// Disponible desde cualquier página del curso.
// Soporta input() del usuario mediante un campo de entrada en el modal.

(function() {
  'use strict';

  let pyodide = null;
  let pendingInput = null;  // Resolve callback para input()

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
        <!-- Campo de entrada para input() -->
        <div id="py-input-area" style="display:none;border-top:1px solid #334155;padding:.5rem .75rem;background:#0f172a;">
          <div style="display:flex;gap:.5rem;align-items:center;">
            <span style="color:#22d3ee;font-family:'Fira Code',monospace;font-size:.8rem;">&gt;&gt;&gt;</span>
            <input id="py-fab-input" type="text" spellcheck="false" autocomplete="off"
              style="flex:1;background:#1e293b;border:1px solid #334155;border-radius:.4rem;
                     color:#e2e8f0;font-family:'Fira Code',monospace;font-size:.82rem;
                     padding:.4rem .6rem;outline:none;transition:border-color .2s;"
              placeholder="Escribe tu respuesta aquí y presiona Enter…"
              onfocus="this.style.borderColor='#22d3ee'" onblur="this.style.borderColor='#334155'">
            <button id="py-input-send"
              style="background:linear-gradient(90deg,#22d3ee,#06b6d4);border:none;color:#0f172a;
                     padding:.35rem .7rem;border-radius:.4rem;font-weight:700;font-size:.75rem;
                     cursor:pointer;white-space:nowrap;">Enviar</button>
          </div>
        </div>
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
    document.getElementById('py-input-send').addEventListener('click', sendInput);
    document.getElementById('py-fab-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendInput();
    });
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
    hideInput();
  }

  // ── Manejo de input() ────────────────────────────────────────────────
  function showInput() {
    const area = document.getElementById('py-input-area');
    const inp = document.getElementById('py-fab-input');
    area.style.display = 'block';
    inp.value = '';
    inp.focus();
  }

  function hideInput() {
    document.getElementById('py-input-area').style.display = 'none';
  }

  function sendInput() {
    if (!pendingInput) return;
    const value = document.getElementById('py-fab-input').value;
    // Mostrar lo que el usuario escribió en el output
    const output = document.getElementById('py-fab-output');
    output.textContent += value + '\n';
    hideInput();
    pendingInput(value);
    pendingInput = null;
  }

  // ── Botones "▶ Ejecutar" en bloques de código ────────────────────────
  function addRunButtonsToCodeBlocks() {
    const codeBlocks = document.querySelectorAll('.code-body');

    codeBlocks.forEach(block => {
      if (block.querySelector('.py-run-code-btn')) return;

      const text = block.textContent.trim();
      const isPython = /^(print|if |for |while |def |import |from |class |try:|elif |else:|return |# )/m.test(text)
        || /\b(input|int\(|float\(|range\(|len\(|random\.|datetime\.|\.append\(|\.strip\(|\.lower\(|\.upper\()/.test(text)
        || /^[a-zA-Z_]\w*\s*[=<>]/.test(text.split('\n')[0]);

      if (!isPython) return;

      const btn = document.createElement('button');
      btn.className = 'py-run-code-btn';
      btn.textContent = '▶ Ejecutar';
      btn.title = 'Ejecutar este código en la consola Python';
      btn.setAttribute('aria-label', 'Ejecutar código Python');

      const header = block.closest('.code-block')?.querySelector('.code-header');
      if (header) {
        const wrapper = document.createElement('span');
        wrapper.style.cssText = 'display:inline-flex;align-items:center;gap:.3rem;';
        wrapper.appendChild(btn);
        header.querySelector('span')?.after(wrapper);
      }

      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const code = extractPythonCode(block);
        openModalAndRun(code);
      });
    });
  }

  function extractPythonCode(block) {
    let html = block.innerHTML;
    html = html.replace(/<br\s*\/?>/gi, '\n');
    const text = html.replace(/<[^>]+>/g, '');
    const lines = text.split('\n').map(l => l.replace(/\u00a0/g, ' ').trimEnd());
    return lines.join('\n').trim();
  }

  function openModalAndRun(code) {
    openModal();
    const codeEl = document.getElementById('py-fab-code');
    codeEl.value = code;
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
    hideInput();

    try {
      // Redefinir input() para que use el campo de entrada del modal
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stdin = StringIO()
      `);

      // Ejecutar el código del usuario
      pyodide.runPython(code);
      const result = pyodide.runPython('sys.stdout.getvalue()');

      if (result && result.trim()) {
        output.textContent = result;
        output.className = 'py-output success';
      } else {
        output.textContent = '✅ Código ejecutado sin errores.';
        output.className = 'py-output success';
      }
    } catch (e) {
      const msg = e.message;

      // Detectar si el error es porque el código necesita input()
      if (msg.includes('input())') || msg.includes('input() called') ||
          msg.includes('EOFError') || msg.includes('eof') ||
          msg.includes('input') && msg.includes('EOF')) {
        output.textContent = '✏️ El programa necesita tu respuesta. Escribe abajo y presiona Enter:';
        output.className = 'py-output';
        showInput();
        btn.disabled = false;
        btn.textContent = '▶ Ejecutar';

        // Re-ejecutar con un input() personalizado
        pendingInput = (userValue) => {
          reRunWithInput(code, userValue);
        };
        return;
      }

      output.textContent = '❌ ' + msg;
      output.className = 'py-output error';
    }

    btn.disabled = false;
    btn.textContent = '▶ Ejecutar';
  }

  async function reRunWithInput(code, userValue) {
    const output = document.getElementById('py-fab-output');
    const btn = document.getElementById('py-fab-run');
    btn.disabled = true;
    btn.textContent = '⏳ Ejecutando…';

    try {
      // Redefinir input() para que devuelva el valor del usuario
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
      `);

      // Reemplazar input() en el código del usuario
      const safeValue = userValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const patchedCode = code.replace(
        /input\s*\(([^)]*)\)/g,
        `'${safeValue}' /* input reemplazado */`
      );

      pyodide.runPython(patchedCode);
      const result = pyodide.runPython('sys.stdout.getvalue()');

      if (result && result.trim()) {
        output.textContent = result;
        output.className = 'py-output success';
      } else {
        output.textContent = '✅ Código ejecutado sin errores.';
        output.className = 'py-output success';
      }
    } catch (e) {
      output.textContent = '❌ ' + e.message;
      output.className = 'py-output error';
    }

    btn.disabled = false;
    btn.textContent = '▶ Ejecutar';
    hideInput();
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
