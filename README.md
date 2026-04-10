# Algo Runner 🚀

**A browser-based pseudocode interpreter for USTHB Algorithms & Data Structures I & II**

> L1 Mathematics — Faculty of Mathematics, USTHB (2024-2025)

---

## What is Algo Runner?

Algo Runner lets you write, run, and debug pseudocode algorithms **directly in your browser** — no installation needed. It supports the exact syntax taught at USTHB and can convert your pseudocode to real **C code** with one click.

**Live demo →** [algo-runner.vercel.app](https://algo-runner.vercel.app)

---

## Features

| Feature | Description |
|---------|-------------|
| 🏃 **Run pseudocode** | Execute your algorithms with real input/output |
| 🔄 **Convert to C** | Instantly generate valid C code from your pseudocode |
| 📚 **12+ examples** | From Fibonacci to Complex Numbers with structs & pointers |
| 📖 **Built-in docs** | Full USTHB syntax reference in the browser |
| 🎨 **Syntax editor** | CodeMirror editor with line numbers and bracket matching |

---

## Supported Syntax (USTHB 2025-2026)

### Algorithm Structure
```pascal
Algorithm Name;
Var
    x, y : integer;
Begin
    Write("Hello");
End;
```

### Functions & Procedures
```pascal
integer function FindMax(a: integer, b: integer)
Begin
    If a > b Then
        Return a;
    Else
        Return b;
    End If;
End;
```

### Structs & Enumerations
```pascal
struct Student {
    name  : string;
    grade : integer;
};

enumeration Days { Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday }
```

### Pointers
```pascal
void function Swap(a: *integer, b: *integer)
Var temp : integer;
Begin
    temp <- *a;
    *a   <- *b;
    *b   <- temp;
End;
```

---

## Supported Features

- ✅ Variables, constants, all data types (`integer`, `float`, `character`, `string`, `boolean`)
- ✅ Arithmetic: `+`, `-`, `*`, `/`, `div`, `mod`, `**`
- ✅ Conditions: `If … Then … Else … End If`, `Switch … Case … End Switch`
- ✅ Loops: `For … EndFor`, `While … EndWhile`, `Do … While`, `Repeat … Until`
- ✅ 1D and 2D arrays (1-indexed, as per USTHB)
- ✅ Functions and procedures (`integer function`, `void function`)
- ✅ Recursion
- ✅ Structs / Records
- ✅ Enumerations
- ✅ Pointers (`&`, `*`, pass-by-reference)
- ✅ C code generation

---

## Project Structure

```
algo-runner/
├── index.html          # Main HTML — editor, docs, examples tabs
├── css/
│   └── style.css       # Dark theme UI
├── js/
│   ├── interpreter.js  # Lexer + Parser + Runtime + C generator
│   ├── examples.js     # All example programs
│   └── app.js          # UI logic (editor, run, tabs, copy)
└── README.md
```

---

## Running Locally

Just open `index.html` in any modern browser. No build step, no dependencies to install.

```bash
git clone https://github.com/yourname/algo-runner.git
cd algo-runner
# Open index.html in your browser
```

Or use a local server:
```bash
python -m http.server 8080
# → http://localhost:8080
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Run algorithm |
| `Escape` | Close C code modal |
| `Tab` | Insert 4 spaces |

---

## Syntax Notes

- Assignment: `<-` or `<--`
- Arrays are **1-indexed**
- `End If;` (with space) is supported
- Comments: `//` or `\\` (both work)
- `Write()` is used for output (not `print`)

---

## Built With

- Vanilla JavaScript (no framework)
- [CodeMirror 5](https://codemirror.net/) — code editor
- Custom Lexer + Parser + Interpreter (built from scratch)
- Deployed on [Vercel](https://vercel.com)

---

## Contributing

Found a bug? Have a suggestion? Open an issue or submit a PR. Examples of improvements:

- New example programs
- Better error messages with line numbers
- Syntax highlighting mode for pseudocode
- Step-by-step debugger / variable inspector

---

## License

MIT — feel free to use, modify, and share.

---

*Made with ❤️ for USTHB students — by a student, for students.*
