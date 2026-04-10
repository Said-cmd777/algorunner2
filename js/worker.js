// ─────────────────────────────────────────
//  Algo Runner — Web Worker
//  Runs the interpreter in a background thread.
//  Uses SharedArrayBuffer + Atomics for blocking
//  Read() calls without freezing the UI.
// ─────────────────────────────────────────

// Polyfill "window" so interpreter.js can do
// `window.AlgoInterpreter = AlgoInterpreter` without crashing.
self.window = self;

importScripts('interpreter.js');

// ── Message handler ──────────────────────────────────────────────────────
self.onmessage = function (e) {
  if (e.data.type !== 'run') return;

  const { source, preloaded, sab } = e.data;
  const int32 = new Int32Array(sab);
  const preloadedQueue = (preloaded || []).slice();

  // ── Output function: post each Write() result to the main thread ──────
  function outputFn(text) {
    self.postMessage({ type: 'write', text: text });
  }

  // ── Input function: blocks the worker until the main thread provides ──
  function inputFn(prompt) {
    // 1. Try preloaded values first (from the Input textarea)
    if (preloadedQueue.length > 0) {
      return preloadedQueue.shift();
    }

    // 2. Ask the main thread for interactive input
    self.postMessage({ type: 'read', prompt: prompt || '' });

    // 3. Block this thread until the main thread writes a value
    //    int32[0] is the signal flag: 0 = waiting, 1 = value ready
    Atomics.wait(int32, 0, 0);

    // 4. Read the string from the shared buffer
    //    int32[1] = string length
    //    int32[2..] = UTF-16 char codes
    const len = int32[1];
    const chars = new Array(len);
    for (let i = 0; i < len; i++) {
      chars[i] = int32[i + 2];
    }
    const value = String.fromCharCode.apply(null, chars);

    // 5. Reset the flag for the next Read() call
    Atomics.store(int32, 0, 0);

    return value;
  }

  // ── Run the interpreter ────────────────────────────────────────────────
  try {
    const interpreter = new AlgoInterpreter({
      input: inputFn,
      output: outputFn
    });
    interpreter.run(source);
    self.postMessage({ type: 'done' });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
