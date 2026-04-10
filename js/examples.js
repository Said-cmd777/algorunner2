// ─────────────────────────────────────────
//  Algo Runner — Example Programs
//  All examples follow USTHB 2025-2026 syntax:
//    - End If;   (with space)
//    - Write()   (not print)
//    - Arrays are 1-indexed
//    - void function / integer function (lowercase keywords)
// ─────────────────────────────────────────

const EXAMPLES = {

  // ── BASICS ──────────────────────────────
  hello: {
    title: "Hello World",
    desc:  "Basic output and variable assignment.",
    tag:   "basics",
    input: "",
    code:
`Algorithm Hello;
Var
    name : string;
    age  : integer;
Begin
    name <- "USTHB";
    age  <- 2025;
    Write("Welcome to ", name, "!");
    Write("Year: ", age);
End;`
  },

  fibonacci: {
    title: "Fibonacci Sequence",
    desc:  "Print the first N Fibonacci numbers.",
    tag:   "basics",
    input: "10",
    code:
`Algorithm Fibonacci;
Var
    F[50] : integer;
    n, i  : integer;
Begin
    Write("How many terms? ");
    Read(n);

    F[1] <- 1;
    F[2] <- 1;

    For i <- 3 to n Do
        F[i] <- F[i-1] + F[i-2];
    EndFor;

    Write("Fibonacci sequence:");
    For i <- 1 to n Do
        Write("F[", i, "] = ", F[i]);
    EndFor;
End;`
  },

  factorial: {
    title: "Factorial",
    desc:  "Compute n! iteratively.",
    tag:   "basics",
    input: "7",
    code:
`Algorithm Factorial;
Var
    n, i, result : integer;
Begin
    Write("Enter n: ");
    Read(n);

    result <- 1;
    For i <- 1 to n Do
        result <- result * i;
    EndFor;

    Write(n, "! = ", result);
End;`
  },

  gcd: {
    title: "GCD — PGCD",
    desc:  "Greatest common divisor using Euclid's algorithm.",
    tag:   "basics",
    input: "48 18",
    code:
`Algorithm GCD;
Var
    a, b, temp : integer;
Begin
    Write("Enter two numbers: ");
    Read(a);
    Read(b);

    While (b <> 0) Do
        temp <- b;
        b    <- a mod b;
        a    <- temp;
    EndWhile;

    Write("GCD = ", a);
End;`
  },

  // ── ARRAYS ──────────────────────────────
  bubble_sort: {
    title: "Bubble Sort",
    desc:  "Sort an array of integers in ascending order.",
    tag:   "arrays",
    input: "5\n7 4 5 2 9",
    code:
`Algorithm Bubble_Sort;
Var
    T[100] : integer;
    n, i, j, temp : integer;
Begin
    Write("Enter array size: ");
    Read(n);

    For i <- 1 to n Do
        Write("T[", i, "] = ");
        Read(T[i]);
    EndFor;

    // Bubble sort
    For i <- 1 to n-1 Do
        For j <- 1 to n-i Do
            If T[j] > T[j+1] Then
                temp    <- T[j];
                T[j]    <- T[j+1];
                T[j+1]  <- temp;
            End If;
        EndFor;
    EndFor;

    Write("Sorted array:");
    For i <- 1 to n Do
        Write(T[i], " ");
    EndFor;
End;`
  },

  selection_sort: {
    title: "Selection Sort",
    desc:  "Classic selection sort algorithm.",
    tag:   "arrays",
    input: "5\n7 5 4 2 8",
    code:
`Algorithm Selection_Sort;
Var
    T[100] : integer;
    n, i, j, min, p : integer;
Begin
    Write("Array size: ");
    Read(n);

    For i <- 1 to n Do
        Write("T[", i, "] = ");
        Read(T[i]);
    EndFor;

    For i <- 1 to n-1 Do
        min <- T[i];
        p   <- i;
        For j <- i+1 to n Do
            If T[j] < min Then
                min <- T[j];
                p   <- j;
            End If;
        EndFor;
        // Swap T[i] and T[p]
        T[p] <- T[i];
        T[i] <- min;
    EndFor;

    Write("Sorted:");
    For i <- 1 to n Do
        Write(T[i], " ");
    EndFor;
End;`
  },

  binary_search: {
    title: "Binary Search",
    desc:  "Search in a sorted array using dichotomy.",
    tag:   "arrays",
    input: "75",
    code:
`Algorithm Binary_Search;
Var
    T[10]  : integer;
    left, right, middle, target, found : integer;
    i : integer;
Begin
    // Pre-fill sorted array
    T[1]  <- 1;  T[2]  <- 3;  T[3]  <- 12;
    T[4]  <- 14; T[5]  <- 23; T[6]  <- 34;
    T[7]  <- 55; T[8]  <- 65; T[9]  <- 75;
    T[10] <- 78;

    Write("Target value to find: ");
    Read(target);

    left  <- 1;
    right <- 10;
    found <- -1;

    While left <= right Do
        middle <- (left + right) div 2;
        If T[middle] = target Then
            found <- middle;
            left  <- right + 1; // exit loop
        Else
            If T[middle] < target Then
                left <- middle + 1;
            Else
                right <- middle - 1;
            End If;
        End If;
    EndWhile;

    If found <> -1 Then
        Write("Found at index ", found);
    Else
        Write("Value not found.");
    End If;
End;`
  },

  // ── FUNCTIONS ────────────────────────────
  max_function: {
    title: "Max Function",
    desc:  "Define and call a function that returns the maximum of two numbers.",
    tag:   "functions",
    input: "7 12",
    code:
`integer function FindMax(a: integer, b: integer)
Begin
    If a > b Then
        Return a;
    Else
        Return b;
    End If;
End;

Algorithm Main;
Var
    x, y, result : integer;
Begin
    Write("Enter two numbers: ");
    Read(x);
    Read(y);
    result <- FindMax(x, y);
    Write("Maximum = ", result);
End;`
  },

  prime_check: {
    title: "Prime Number Check",
    desc:  "Function that checks if a number is prime.",
    tag:   "functions",
    input: "17",
    code:
`integer function IsPrime(n: integer)
Var
    i       : integer;
    isPrime : integer;
Begin
    If n < 2 Then
        Return 0;
    End If;
    isPrime <- 1;
    i <- 2;
    While i * i <= n Do
        If n mod i = 0 Then
            isPrime <- 0;
            i <- n; // force exit
        End If;
        i <- i + 1;
    EndWhile;
    Return isPrime;
End;

Algorithm PrimeTest;
Var
    n : integer;
Begin
    Write("Enter a number: ");
    Read(n);
    If IsPrime(n) = 1 Then
        Write(n, " is PRIME");
    Else
        Write(n, " is NOT prime");
    End If;
End;`
  },

  recursive_power: {
    title: "Recursive Power",
    desc:  "Compute b^p using recursion.",
    tag:   "functions",
    input: "2 10",
    code:
`integer function Power(b: integer, p: integer)
Begin
    If p = 0 Then
        Return 1;
    Else
        Return b * Power(b, p - 1);
    End If;
End;

Algorithm RecursivePower;
Var
    base, exponent, result : integer;
Begin
    Write("Base: ");
    Read(base);
    Write("Exponent: ");
    Read(exponent);
    result <- Power(base, exponent);
    Write(base, "^", exponent, " = ", result);
End;`
  },

  // ── STRUCTS & ENUMS ──────────────────────
  struct_student: {
    title: "Student Struct",
    desc:  "Define a struct and manage an array of students.",
    tag:   "structs",
    input: "3\nKhaled 18\nAmira 19\nYassine 17",
    code:
`struct Student {
    name  : string;
    grade : integer;
};

void function PrintStudent(s: Student)
Begin
    Write(s.name, " → grade: ", s.grade);
End;

Algorithm ClassManager;
Var
    students : Student[50];
    n, i     : integer;
    total    : integer;
Begin
    Write("Number of students: ");
    Read(n);

    For i <- 1 to n Do
        Write("Name and grade for student ", i, ": ");
        Read(students[i].name);
        Read(students[i].grade);
    EndFor;

    Write("--- Class Report ---");
    total <- 0;
    For i <- 1 to n Do
        PrintStudent(students[i]);
        total <- total + students[i].grade;
    EndFor;
    Write("Class average: ", total / n);
End;`
  },

  enum_days: {
    title: "Enumeration — Days",
    desc:  "Use an enumeration to classify days of the week.",
    tag:   "structs",
    input: "",
    code:
`enumeration Days { Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday }

void function PrintDayType(day: Days)
Begin
    If day = Days.Saturday OR day = Days.Friday Then
        Write("Weekend!");
    Else
        Write("Weekday.");
    End If;
End;

Algorithm DayChecker;
Var today : Days;
Begin
    today <- Days.Monday;
    Write("Monday   → "); PrintDayType(today);

    today <- Days.Friday;
    Write("Friday   → "); PrintDayType(today);

    today <- Days.Saturday;
    Write("Saturday → "); PrintDayType(today);
End;`
  },

  complex_numbers: {
    title: "Complex Numbers",
    desc:  "Struct + functions to manipulate complex numbers.",
    tag:   "structs",
    input: "",
    code:
`struct Complex {
    real : float;
    imag : float;
};

void function PrintComplex(c: Complex)
Begin
    Write(c.real, " + ", c.imag, "i");
End;

float function Magnitude(c: Complex)
Begin
    Return Sqrt(c.real ** 2 + c.imag ** 2);
End;

Algorithm ComplexArithmetic;
Var
    z1, z2, z3 : Complex;
Begin
    z1.real <- 3.0;
    z1.imag <- 4.0;
    z2.real <- 1.0;
    z2.imag <- 2.0;

    Write("z1 = "); PrintComplex(z1);
    Write("Magnitude of z1 = ", Magnitude(z1));

    Write("z2 = "); PrintComplex(z2);

    z3.real <- z1.real + z2.real;
    z3.imag <- z1.imag + z2.imag;
    Write("z1 + z2 = "); PrintComplex(z3);
End;`
  },

  // ── POINTERS ─────────────────────────────
  pointer_swap: {
    title: "Pointer Swap",
    desc:  "Swap two variables using pointers (pass-by-reference).",
    tag:   "pointers",
    input: "10 25",
    code:
`void function Swap(a: *integer, b: *integer)
Var temp : integer;
Begin
    temp <- *a;
    *a   <- *b;
    *b   <- temp;
End;

Algorithm PointerSwap;
Var
    x, y : integer;
Begin
    Write("Enter x and y: ");
    Read(x);
    Read(y);

    Write("Before: x = ", x, "  y = ", y);
    Swap(&x, &y);
    Write("After:  x = ", x, "  y = ", y);
End;`
  },

  pointer_array: {
    title: "Array via Pointers",
    desc:  "Declare a pointer, take address of a variable, and dereference it.",
    tag:   "pointers",
    input: "",
    code:
`Algorithm PointerDemo;
Var
    x   : integer;
    ptr : *integer;
Begin
    x   <- 42;
    ptr <- &x;

    Write("x         = ", x);
    Write("*ptr      = ", *ptr);

    *ptr <- 100;
    Write("After *ptr <- 100:");
    Write("x         = ", x);
    Write("*ptr      = ", *ptr);
End;`
  },

};

// ── Render examples cards on the examples tab ──
function renderExamples() {
  const grid = document.getElementById("examples-grid");
  if (!grid) return;

  const tagLabel = { basics:"Basics", arrays:"Arrays", functions:"Functions", structs:"Structs & Enums", pointers:"Pointers" };
  const order = ["basics","arrays","functions","structs","pointers"];

  // Group by tag
  const groups = {};
  order.forEach(t => groups[t] = []);
  Object.entries(EXAMPLES).forEach(([key, ex]) => {
    if (groups[ex.tag]) groups[ex.tag].push({ key, ...ex });
  });

  grid.innerHTML = "";
  order.forEach(tag => {
    groups[tag].forEach(ex => {
      const card = document.createElement("div");
      card.className = "example-card";
      card.innerHTML = `
        <div class="example-card-title">${ex.title}</div>
        <div class="example-card-desc">${ex.desc}</div>
        <span class="example-card-tag tag-${ex.tag}">${tagLabel[ex.tag]}</span>
      `;
      card.addEventListener("click", () => {
        loadExample(ex.key);
        // Switch to editor tab
        switchTab("editor");
      });
      grid.appendChild(card);
    });
  });
}

function loadExample(key) {
  const ex = EXAMPLES[key];
  if (!ex) return;
  if (window._editor) {
    window._editor.setValue(ex.code);
    window._editor.clearHistory();
  }
  const inputBox = document.getElementById("input-box");
  if (inputBox) inputBox.value = ex.input || "";
  clearOutput();
}

window.EXAMPLES    = EXAMPLES;
window.renderExamples = renderExamples;
window.loadExample = loadExample;
