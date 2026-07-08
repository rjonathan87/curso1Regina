// ===== PYTHON CONSOLE FLOATING BUTTON — Curso Informática Regina =====
// Botón flotante + modal con Pyodide + botones "Ejecutar" en bloques de código.
// Disponible desde cualquier página del curso.
// Soporta input() del usuario mediante un campo de entrada en el modal.

(function() {
  'use strict';

  let pyodide = null;
  let pendingInput = null;  // Resolve callback para input()
  let inputQueue = [];      // Cola de valores para input()
  let waitingForInput = false;

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
    // Reemplazar &nbsp; y variantes de espacios duros HTML por espacios normales
    html = html.replace(/&nbsp;/g, ' ');
    html = html.replace(/\u00a0/g, ' ');
    html = html.replace(/&#xa0;/gi, ' ');
    html = html.replace(/&#160;/gi, ' ');
    // Reemplazar &amp;nbsp; (doble escape)
    html = html.replace(/&amp;nbsp;/g, ' ');
    // Reemplazar entidades HTML comunes que pueden aparecer en codigo
    html = html.replace(/&gt;/g, '>');
    html = html.replace(/&lt;/g, '<');
    html = html.replace(/&amp;/g, '&');
    html = html.replace(/&quot;/g, '"');
    html = html.replace(/&#39;/g, "'");
    html = html.replace(/&#x27;/g, "'");
    const text = html.replace(/<[^>]+>/g, '');
    const lines = text.split('\n').map(l => l.trimEnd());
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
    inputQueue = [];
    waitingForInput = false;

    // Limpiar namespace solo en primera ejecucion
    try { pyodide.runPython('_medplat_initialized'); } catch(e) {
      // Primera ejecucion: inicializar
      pyodide.runPython(`
import sys
from io import StringIO
_medplat_initialized = True
_medplat_output = ""
_medplat_input_queue = []
def _medplat_input(prompt=""):
    import js
    if _medplat_input_queue:
        return _medplat_input_queue.pop(0)
    _medplat_last_prompt = prompt
    raise Exception("__INPUT_REQUIRED__:" + prompt)
import builtins
builtins.input = _medplat_input
      `);
    }

    // Limpiar output y cola para empezar fresco (ejecucion manual)
    pyodide.runPython(`
_medplat_output = ""
_medplat_input_queue = []
    `);
    output.textContent = '⏳ Ejecutando…';

    executeWithIO(code, output, btn, true);

    btn.disabled = false;
    btn.textContent = '▶ Ejecutar';
  }

  async function executeWithIO(code, output, btn, isFirstRun) {
    try {
      // Restaurar output previo de Python
      const prevOutput = pyodide.runPython(`
_medplat_output if '_medplat_output' in dir() else ""
      `);
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
if ${JSON.stringify(prevOutput)}:
    sys.stdout.write(${JSON.stringify(prevOutput)})
      `);

      pyodide.runPython(code);

      const result = pyodide.runPython(`
_medplat_output = sys.stdout.getvalue()
_medplat_output
      `);

      if (result && result.trim()) {
        output.textContent = result;
        output.className = 'py-output success';
      } else {
        output.textContent = '✅ Código ejecutado sin errores.';
        output.className = 'py-output success';
      }
      hideInput();

    } catch (e) {
      const msg = e.message;
      if (msg.includes('__INPUT_REQUIRED__:')) {
        // Preservar el output actual
        pyodide.runPython('_medplat_output = sys.stdout.getvalue() if hasattr(sys.stdout, "getvalue") else ""');

        const prompt = msg.split('__INPUT_REQUIRED__:')[1] || '';
        const currentOutput = output.textContent;
        output.textContent = currentOutput + '\n✏️ ' + (prompt || 'Respuesta:');
        output.className = 'py-output';
        showInput();
        waitingForInput = true;

        pendingInput = (userValue) => {
          // Poner el valor en la cola de Python y continuar
          pyodide.runPython(`_medplat_input_queue.append(${JSON.stringify(userValue)})`);
          waitingForInput = false;
          executeWithIO(code, output, btn, false);
        };
        return;
      }

      output.textContent = '❌ ' + msg;
      output.className = 'py-output error';
      hideInput();
    }

    btn.disabled = false;
    btn.textContent = '▶ Ejecutar';
  }

  // Eliminar continueExecution, ya no se necesita

  // Exponer función para que pueda ser llamada desde cualquier lado
  window.runPythonCode = openModalAndRun;

  // ── Init ─────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }

})();
