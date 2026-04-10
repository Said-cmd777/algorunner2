// ─────────────────────────────────────────
//  Algo Runner — App Controller
//  Handles: editor init, run, C conversion,
//           tabs, examples dropdown, copy,
//           Web Worker interactive terminal
// ─────────────────────────────────────────

// ── Execution state ────────────────────────────────────────────────────────
let _running = false;
let _lastOutputDiv = null;   // reference to the last output-line div (for inline input)
let _inputResolver = null;   // dynamic resolver to unblock interpreter during Read()

// ── Inline error state (CodeMirror markers + widgets) ────────────────────
const _errState = {
  textMarker: null,
  lineWidget: null,
  gutterMarker: null
};

function clearEditorErrors() {
  const ed = window._editor;
  if (!ed) return;
  if (_errState.textMarker)  { _errState.textMarker.clear();  _errState.textMarker  = null; }
  if (_errState.lineWidget)  { _errState.lineWidget.clear();  _errState.lineWidget  = null; }
  if (_errState.gutterMarker !== null) {
    ed.setGutterMarker(_errState.gutterMarker, 'cm-error-gutter', null);
    _errState.gutterMarker = null;
  }
}

// ── Preprocess source ────────────────────────────────────────────────────
function preprocessSource(src) {
  return src
    .replace(/\bEnd\s+If\b/gi,     "EndIf")
    .replace(/\bEnd\s+For\b/gi,    "EndFor")
    .replace(/\bEnd\s+While\b/gi,  "EndWhile")
    .replace(/\bEnd\s+Switch\b/gi, "EndSwitch")
    .replace(/\bElse\s*If\b/gi,    "ElseIf")
    .replace(/\bprint\s*\(/gi,     "Write(")
    .replace(/\\\\/g,              "//");
}

// ── HTML escape ──────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════════════════
//  ERROR DISPLAY  (shared by both sync and worker paths)
// ═══════════════════════════════════════════════════════════════════════════

function showError(errMessage) {
  const outputBox = document.getElementById("output-box");
  const statusBadge = document.getElementById("output-status");

  outputBox.classList.add("has-error");
  const errDiv = document.createElement("div");
  errDiv.className = "error-message";
  errDiv.textContent = "\u26A0\uFE0F  " + errMessage;
  outputBox.appendChild(errDiv);

  statusBadge.textContent = "Error";
  statusBadge.className = "status-badge err";

  // ── Inline editor markers (syntax errors only — have line:col) ─────────
  const locMatch = errMessage.match(/(\d+):(\d+)/);
  if (locMatch && window._editor) {
    const ed      = window._editor;
    const errLine = parseInt(locMatch[1], 10);
    const errCol  = parseInt(locMatch[2], 10);

    const targetLine = Math.max(1, errLine - 1);
    const cmLine     = targetLine - 1;
    const lineText   = ed.getLine(cmLine) || "";

    _errState.textMarker = ed.markText(
      { line: cmLine, ch: 0 },
      { line: cmLine, ch: lineText.length },
      { className: 'cm-error-underline', inclusiveLeft: false, inclusiveRight: false }
    );

    const gutterDot = document.createElement('div');
    gutterDot.className = 'cm-error-gutter-dot';
    gutterDot.title = errMessage;
    ed.setGutterMarker(cmLine, 'cm-error-gutter', gutterDot);
    _errState.gutterMarker = cmLine;

    const widget = document.createElement('div');
    widget.className = 'cm-error-widget';

    let friendlyMsg = errMessage
      .replace(/at \d+:\d+/g, '')
      .replace(/Expected (\S+)/, 'Missing $1')
      .trim();
    if (!friendlyMsg) friendlyMsg = errMessage;

    widget.innerHTML =
      '<span class="ew-icon">\u26A0</span>' +
      '<span class="ew-text">' + escapeHtml(friendlyMsg) + '</span>' +
      '<span class="ew-loc">Line\u00A0' + errLine + ', Col\u00A0' + errCol + '</span>';

    _errState.lineWidget = ed.addLineWidget(cmLine, widget, {
      coverGutter: false,
      insertAt: 0,
      noHScroll: true
    });

    ed.scrollIntoView({ line: cmLine, ch: 0 }, 60);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  RUN / STOP BUTTON STATE
// ═══════════════════════════════════════════════════════════════════════════

function setRunningState(on) {
  _running = on;
  const btn = document.getElementById('btn-run');
  if (on) {
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 16 16" fill="none">' +
      '<rect x="3" y="3" width="10" height="10" rx="1" fill="currentColor"/>' +
      '</svg> Stop';
    btn.classList.add('is-running');
  } else {
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 16 16" fill="none">' +
      '<path d="M4 2l10 6-10 6V2z" fill="currentColor"/>' +
      '</svg> Run';
    btn.classList.remove('is-running');
  }
}

function terminateWorker() {
  _running = false;
  if (_inputResolver) {
    _inputResolver(undefined);
    _inputResolver = null;
  }
  setRunningState(false);
}

async function runAsync(processed, inputRaw) {
  const outputBox = document.getElementById("output-box");
  const statusBadge = document.getElementById("output-status");

  setRunningState(true);
  let lineCount = 0;
  _lastOutputDiv = null;

  const preloaded = String(inputRaw).trim().split(/\s+/).filter(Boolean);

  const inputFn = async function (prompt) {
    if (!_running) return undefined;
    if (preloaded.length > 0) return preloaded.shift();
    return await injectTerminalInput(outputBox);
  };

  const outputFn = function (text) {
    if (!_running) return;
    const div = document.createElement("div");
    div.className = "output-line";
    div.style.animationDelay = `${Math.min(lineCount * 30, 300)}ms`;
    div.textContent = text;
    outputBox.appendChild(div);
    _lastOutputDiv = div;
    lineCount++;
    outputBox.scrollTop = outputBox.scrollHeight;
  };

  try {
    const interpreter = new AlgoInterpreter({ input: inputFn, output: outputFn });
    await interpreter.run(processed);

    if (!_running) return;

    if (lineCount === 0) {
      outputBox.innerHTML =
        '<span class="output-placeholder">Program ran with no output.</span>';
    }
    statusBadge.textContent = "OK";
    statusBadge.className = "status-badge ok";
  } catch (err) {
    if (_running) showError(err.message);
  } finally {
    setRunningState(false);
  }
}

function injectTerminalInput(outputBox) {
  return new Promise((resolve) => {
    let hostDiv = _lastOutputDiv;
    if (!hostDiv) {
      hostDiv = document.createElement("div");
      hostDiv.className = "output-line terminal-line";
      hostDiv.appendChild(document.createTextNode("? "));
      outputBox.appendChild(hostDiv);
    }
    hostDiv.classList.add("terminal-line");

    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "terminal-input";
    inp.setAttribute("autocomplete", "off");
    inp.setAttribute("spellcheck", "false");
    hostDiv.appendChild(inp);

    outputBox.scrollTop = outputBox.scrollHeight;
    inp.focus();

    inp.addEventListener("keydown", function handler(e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      inp.removeEventListener("keydown", handler);

      const value = inp.value;
      const span = document.createElement("span");
      span.className = "terminal-value";
      span.textContent = value;
      inp.parentNode.replaceChild(span, inp);

      _inputResolver = null;
      resolve(value);
    });

    _inputResolver = resolve;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

function runAlgorithm() {
  const source    = window._editor ? window._editor.getValue() : "";
  const inputRaw  = document.getElementById("input-box").value;
  const outputBox = document.getElementById("output-box");
  const statusBadge = document.getElementById("output-status");

  // ── If a worker is already running, stop it ────────────────────────────
  if (_running) {
    terminateWorker();
    outputBox.classList.add("has-error");
    const stoppedDiv = document.createElement("div");
    stoppedDiv.className = "error-message";
    stoppedDiv.textContent = "\u23F9  Stopped by user.";
    outputBox.appendChild(stoppedDiv);
    statusBadge.textContent = "Stopped";
    statusBadge.className = "status-badge err";
    return;
  }

  // ── Clear previous state ───────────────────────────────────────────────
  outputBox.innerHTML = "";
  outputBox.classList.remove("has-error");
  statusBadge.className = "status-badge";
  clearEditorErrors();

  const processed = preprocessSource(source);

  runAsync(processed, inputRaw);
}

function clearOutput() {
  terminateWorker();
  const outputBox = document.getElementById("output-box");
  if (outputBox) {
    outputBox.classList.remove("has-error");
    outputBox.innerHTML =
      '<span class="output-placeholder">Output will appear here after running\u2026</span>';
  }
  const statusBadge = document.getElementById("output-status");
  if (statusBadge) statusBadge.className = "status-badge";
  clearEditorErrors();
}

// ═══════════════════════════════════════════════════════════════════════════
//  CONVERT TO C
// ═══════════════════════════════════════════════════════════════════════════

function convertToC() {
  const source = window._editor ? window._editor.getValue() : "";
  const modal    = document.getElementById("c-modal");
  const cOutput  = document.getElementById("c-code-output");

  try {
    const processed = preprocessSource(source);
    const cCode = generateC(processed);
    cOutput.textContent = cCode;
    modal.classList.remove("hidden");
  } catch (err) {
    cOutput.textContent = "// Error generating C code:\n// " + err.message;
    modal.classList.remove("hidden");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TABS / COPY / MISC
// ═══════════════════════════════════════════════════════════════════════════

function switchTab(name) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));

  const tab = document.getElementById("tab-" + name);
  if (tab) tab.classList.add("active");

  const link = document.querySelector(`[data-tab="${name}"]`);
  if (link) link.classList.add("active");

  if (name === "examples") renderExamples();
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = old; }, 1500);
  }).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", function () {

  // ── CodeMirror editor ──
  const textarea = document.getElementById("code-editor");
  const editor = CodeMirror.fromTextArea(textarea, {
    gutters: ['cm-error-gutter', 'CodeMirror-linenumbers'],
    mode:           "null",
    theme:          "material-darker",
    lineNumbers:    true,
    matchBrackets:  true,
    autoCloseBrackets: true,
    indentUnit:     4,
    tabSize:        4,
    lineWrapping:   false,
    extraKeys:      {
      "Ctrl-Enter": runAlgorithm,
      "Tab": function(cm) { cm.replaceSelection("    "); }
    }
  });
  window._editor = editor;

  // Load default example
  loadExample("fibonacci");

  // ── Example dropdown ──
  const exampleSelect = document.getElementById("example-select");
  exampleSelect.addEventListener("change", function () {
    if (this.value) {
      loadExample(this.value);
      this.value = "";
    }
  });

  // ── Clear button ──
  document.getElementById("btn-clear").addEventListener("click", function () {
    editor.setValue("");
    editor.focus();
    clearOutput();
  });

  // ── Run / Stop button ──
  document.getElementById("btn-run").addEventListener("click", runAlgorithm);

  // ── Convert button ──
  document.getElementById("btn-convert").addEventListener("click", convertToC);

  // ── Copy output ──
  document.getElementById("btn-copy-output").addEventListener("click", function () {
    const outputBox = document.getElementById("output-box");
    copyText(outputBox.innerText, this);
  });

  // ── Modal: close ──
  document.getElementById("btn-close-modal").addEventListener("click", () => {
    document.getElementById("c-modal").classList.add("hidden");
  });
  document.getElementById("modal-backdrop").addEventListener("click", () => {
    document.getElementById("c-modal").classList.add("hidden");
  });

  // ── Modal: copy C code ──
  document.getElementById("btn-copy-c").addEventListener("click", function () {
    const code = document.getElementById("c-code-output").textContent;
    copyText(code, this);
  });

  // ── Nav tabs ──
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      switchTab(this.dataset.tab);
    });
  });

  // ── Docs sidebar smooth scroll ──
  document.querySelectorAll(".docs-nav-link").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // ── Keyboard shortcuts ──
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      runAlgorithm();
    }
    if (e.key === "Escape") {
      document.getElementById("c-modal").classList.add("hidden");
    }
  });

  window.clearOutput = clearOutput;
});
