// Enhanced Algo Runner Interpreter with Functions, Pointers, Structs, and Enums
// Based on USTHB Algorithms and Data Structures II Curriculum

class AlgoInterpreter {
  constructor({ input, output }) {
    this.input = input;
    this.output = output;
  }

  async run(source) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokens();
    const parser = new Parser(tokens);
    const program = parser.parse();
    await program.run(this.input, this.output);
  }
}

const KEYWORDS = new Set([
  "ALGORITHM",
  "VAR",
  "BEGIN",
  "END",
  "CONST",
  "IF",
  "THEN",
  "ELSE",
  "ELSEIF",
  "ENDIF",
  "FOR",
  "TO",
  "DO",
  "ENDFOR",
  "WHILE",
  "ENDWHILE",
  "REPEAT",
  "UNTIL",
  "READ",
  "WRITE",
  "SQRT",
  "RETURN",
  "MOD",
  "DIV",
  "AND",
  "OR",
  "NOT",
  "TRUE",
  "FALSE",
  // Switch/Case keywords (USTHB course Week 2)
  "SWITCH",
  "CASE",
  "ENDSWITCH",
  // Functions, pointers, structs, enums
  "FUNCTION",
  "PROCEDURE",
  "VOID",
  "STRUCT",
  "ENUMERATION",
  "NULL",
]);

class Token {
  constructor(kind, value, line, col) {
    this.kind = kind;
    this.value = value;
    this.line = line;
    this.col = col;
  }
}

class Lexer {
  constructor(text) {
    this.text = text;
    this.pos = 0;
    this.line = 1;
    this.col = 1;
  }

  peek(n = 0) {
    const i = this.pos + n;
    if (i >= this.text.length) return "";
    return this.text[i];
  }

  advance(n = 1) {
    for (let i = 0; i < n; i++) {
      if (this.pos >= this.text.length) return;
      const ch = this.text[this.pos++];
      if (ch === "\n") {
        this.line++;
        this.col = 1;
      } else {
        this.col++;
      }
    }
  }

  skipWhitespace() {
    while (true) {
      const ch = this.peek();
      if (ch && /\s/.test(ch) && ch !== "\n") this.advance();
      else break;
    }
  }

  skipComment() {
    if (this.peek() === "/" && this.peek(1) === "/") {
      while (this.peek() && this.peek() !== "\n") this.advance();
      return true;
    }
    if (this.peek() === "/" && this.peek(1) === "*") {
      this.advance(2);
      while (this.peek() && !(this.peek() === "*" && this.peek(1) === "/")) {
        this.advance();
      }
      if (this.peek() === "*" && this.peek(1) === "/") this.advance(2);
      return true;
    }
    if (this.peek() === "(" && this.peek(1) === "*") {
      this.advance(2);
      while (this.peek() && !(this.peek() === "*" && this.peek(1) === ")")) {
        this.advance();
      }
      if (this.peek() === "*" && this.peek(1) === ")") this.advance(2);
      return true;
    }
    return false;
  }

  number() {
    const line = this.line;
    const col = this.col;
    let s = "";
    while (/\d/.test(this.peek())) {
      s += this.peek();
      this.advance();
    }
    if (this.peek() === "." && /\d/.test(this.peek(1))) {
      s += ".";
      this.advance();
      while (/\d/.test(this.peek())) {
        s += this.peek();
        this.advance();
      }
      return new Token("NUMBER", parseFloat(s), line, col);
    }
    return new Token("NUMBER", parseInt(s, 10), line, col);
  }

  identifier() {
    const line = this.line;
    const col = this.col;
    let s = "";
    while (/[_A-Za-z0-9]/.test(this.peek())) {
      s += this.peek();
      this.advance();
    }
    const upper = s.toUpperCase();
    if (KEYWORDS.has(upper)) return new Token("KEYWORD", upper, line, col);
    return new Token("IDENT", s, line, col);
  }

  string() {
    const line = this.line;
    const col = this.col;
    this.advance();
    let s = "";
    while (this.peek() && this.peek() !== '"') {
      if (this.peek() === "\\") {
        this.advance();
        if (this.peek()) {
          s += this.peek();
          this.advance();
        }
      } else {
        s += this.peek();
        this.advance();
      }
    }
    if (this.peek() === '"') this.advance();
    return new Token("STRING", s, line, col);
  }

  tokens() {
    const tokens = [];
    while (this.pos < this.text.length) {
      if (this.skipComment()) continue;
      const ch = this.peek();
      if (ch === "") break;
      if (ch === "\n") {
        tokens.push(new Token("NEWLINE", "\n", this.line, this.col));
        this.advance();
        continue;
      }
      if (/\s/.test(ch)) {
        this.skipWhitespace();
        continue;
      }
      if (/\d/.test(ch)) {
        tokens.push(this.number());
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        tokens.push(this.identifier());
        continue;
      }
      if (ch === '"') {
        tokens.push(this.string());
        continue;
      }

      const line = this.line;
      const col = this.col;
      if (ch === "<" && this.peek(1) === "-" && this.peek(2) === "-") {
        tokens.push(new Token("OP", "<--", line, col));
        this.advance(3);
        continue;
      }
      const two = ch + this.peek(1);
      if (["<-", "<=", ">=", "<>", "!=", "**", "==", "++", "--", "&&", "||"].includes(two)) {
        tokens.push(new Token("OP", two, line, col));
        this.advance(2);
        continue;
      }
      // Support for & (address-of), * (dereference/pointer), % (modulo), ! (not), {}, |
      if ("+-*/()[],:;<>.=,^&*%!{}|".includes(ch)) {
        tokens.push(new Token("OP", ch, line, col));
        this.advance();
        continue;
      }
      throw new Error(`Unexpected character '${ch}' at ${this.line}:${this.col}`);
    }

    tokens.push(new Token("EOF", "", this.line, this.col));
    return tokens;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(n = 0) {
    const i = this.pos + n;
    return i >= this.tokens.length ? this.tokens[this.tokens.length - 1] : this.tokens[i];
  }

  advance() {
    const tok = this.peek();
    this.pos++;
    return tok;
  }

  match(kind, value) {
    const tok = this.peek();
    if (kind && tok.kind !== kind) return false;
    if (value && tok.value !== value) return false;
    this.advance();
    return tok;
  }

  expect(kind, value) {
    const tok = this.peek();
    if (kind && tok.kind !== kind) throw new Error(`Expected ${kind} at ${tok.line}:${tok.col}`);
    if (value && tok.value !== value) throw new Error(`Expected ${value} at ${tok.line}:${tok.col}`);
    return this.advance();
  }

  skipSeparators() {
    while (true) {
      const tok = this.peek();
      if (tok.kind === "NEWLINE" || (tok.kind === "OP" && tok.value === ";")) this.advance();
      else break;
    }
  }

  parse() {
    this.skipSeparators();
    
    // Parse enumerations
    const enums = {};
    while (this.peek().kind === "KEYWORD" && this.peek().value === "ENUMERATION") {
      const enumDef = this.parseEnumeration();
      enums[enumDef.name] = enumDef;
      this.skipSeparators();
    }

    // Parse structs
    const structs = {};
    while (this.peek().kind === "KEYWORD" && this.peek().value === "STRUCT") {
      const structDef = this.parseStruct();
      structs[structDef.name] = structDef;
      this.skipSeparators();
    }

    // Parse functions
    const functions = {};
    while ((this.peek().kind === "KEYWORD" && (this.peek().value === "FUNCTION" || this.peek().value === "PROCEDURE")) ||
           (this.peek().kind === "IDENT" && this.peekType() === "FUNCTION")) {
      const funcDef = this.parseFunction();
      functions[funcDef.name] = funcDef;
      this.skipSeparators();
    }

    // Parse main algorithm
    if (this.match("KEYWORD", "ALGORITHM")) {
      if (this.peek().kind === "IDENT") this.advance();
    }
    this.skipSeparators();

    const varTypes = {};
    const varSizes = {};
    if (this.match("KEYWORD", "VAR")) {
      this.skipSeparators();
      while (this.peek().kind === "IDENT") {
        const names = [this.parseVarName(varSizes)];
        while (this.match("OP", ",")) names.push(this.parseVarName(varSizes));
        this.expect("OP", ":");
        const typeTok = this.parseType();
        const typeName = String(typeTok.value).toUpperCase();
        names.forEach((n) => (varTypes[n] = typeName));
        this.skipSeparators();
        this.match("OP", ";");
        this.skipSeparators();
      }
    }

    this.expect("KEYWORD", "BEGIN");
    this.skipSeparators();
    const stmts = this.parseStmtList(["END"]);
    this.expect("KEYWORD", "END");
    this.match("OP", ".");
    return new Program(stmts, varTypes, varSizes, functions, structs, enums);
  }

  parseEnumeration() {
    this.expect("KEYWORD", "ENUMERATION");
    const name = this.expect("IDENT").value;
    this.expect("OP", "{");
    const values = [];
    values.push(this.expect("IDENT").value);
    while (this.match("OP", ",")) {
      values.push(this.expect("IDENT").value);
    }
    this.expect("OP", "}");
    this.skipSeparators();
    this.match("OP", ";");
    return { name, values };
  }

  parseStruct() {
    this.expect("KEYWORD", "STRUCT");
    const name = this.expect("IDENT").value;
    this.expect("OP", "{");
    const fields = {};
    while (this.peek().kind === "IDENT") {
      const fieldName = this.expect("IDENT").value;
      this.expect("OP", ":");
      const fieldType = this.parseType();
      fields[fieldName] = fieldType.value;
      this.skipSeparators();
      this.match("OP", ";");
      this.skipSeparators();
    }
    this.expect("OP", "}");
    this.skipSeparators();
    this.match("OP", ";");
    return { name, fields };
  }

  parseFunction() {
    let returnType = null;
    let isProcedure = false;

    if (this.peek().kind === "KEYWORD" && this.peek().value === "PROCEDURE") {
      this.advance();
      isProcedure = true;
      returnType = "VOID";
    } else if (this.peek().kind === "KEYWORD" && this.peek().value === "VOID") {
      this.advance();
      this.expect("KEYWORD", "FUNCTION");
      isProcedure = true;
      returnType = "VOID";
    } else if (this.peek().kind === "KEYWORD" && this.peek().value === "FUNCTION") {
      this.advance();
      returnType = this.parseType().value;
    } else {
      // Type followed by FUNCTION
      returnType = this.parseType().value;
      this.expect("KEYWORD", "FUNCTION");
    }

    const funcName = this.expect("IDENT").value;
    this.expect("OP", "(");

    const params = [];
    if (!this.match("OP", ")")) {
      do {
        const paramName = this.expect("IDENT").value;
        this.expect("OP", ":");
        const paramType = this.parseType().value;
        params.push({ name: paramName, type: paramType });
      } while (this.match("OP", ","));
      this.expect("OP", ")");
    }

    this.skipSeparators();

    const varTypes = {};
    if (this.match("KEYWORD", "VAR")) {
      this.skipSeparators();
      while (this.peek().kind === "IDENT") {
        const names = [this.expect("IDENT").value];
        while (this.match("OP", ",")) names.push(this.expect("IDENT").value);
        this.expect("OP", ":");
        const varType = this.parseType().value;
        names.forEach((n) => (varTypes[n] = varType));
        this.skipSeparators();
        this.match("OP", ";");
        this.skipSeparators();
      }
    }

    this.expect("KEYWORD", "BEGIN");
    this.skipSeparators();
    const body = this.parseStmtList(["END"]);
    this.expect("KEYWORD", "END");
    this.match("OP", ";");
    this.skipSeparators();

    return {
      name: funcName,
      returnType,
      params,
      varTypes,
      body,
      isProcedure,
    };
  }

  parseType() {
    const tok = this.peek();
    const val = String(tok.value).toUpperCase();
    if (["INTEGER", "FLOAT", "REAL", "BOOLEAN", "CHARACTER", "STRING", "VOID"].includes(val)) {
      this.advance();
      // Check for pointer
      if (this.match("OP", "*")) return new Token("TYPE", "*" + val);
      return new Token("TYPE", val);
    }
    if (tok.kind === "IDENT") {
      this.advance();
      // Check for pointer
      if (this.match("OP", "*")) return new Token("TYPE", "*" + tok.value);
      return tok;
    }
    throw new Error(`Expected type at ${tok.line}:${tok.col}`);
  }

  peekType() {
    // Helper to check if next token is a type (for function detection)
    const tok = this.peek();
    if (tok.kind === "IDENT" || tok.kind === "KEYWORD") {
      const upper = String(tok.value).toUpperCase();
      if (["INTEGER", "FLOAT", "REAL", "BOOLEAN", "CHARACTER", "STRING", "VOID"].includes(upper)) {
        return "FUNCTION";
      }
    }
    return null;
  }

  parseStmtList(until) {
    const stmts = [];
    while (true) {
      this.skipSeparators();
      const tok = this.peek();
      if (tok.kind === "KEYWORD" && until.includes(tok.value)) break;
      if (tok.kind === "EOF") break;
      stmts.push(this.parseStmt());
      this.skipSeparators();
    }
    return stmts;
  }

  parseStmt() {
    const tok = this.peek();
    if (tok.kind === "KEYWORD") {
      if (tok.value === "WRITE") return this.parseWrite();
      if (tok.value === "READ") return this.parseRead();
      if (tok.value === "IF") return this.parseIf();
      if (tok.value === "FOR") return this.parseFor();
      if (tok.value === "WHILE") return this.parseWhile();
      if (tok.value === "DO") return this.parseDoWhile();
      if (tok.value === "REPEAT") return this.parseRepeatUntil();
      if (tok.value === "RETURN") return this.parseReturn();
      if (tok.value === "SWITCH") return this.parseSwitch();
    }

    const target = this.parseLvalue();
    // Support i++ and i-- as statements (USTHB course Week 2)
    const nextTok = this.peek();
    if (nextTok.kind === "OP" && nextTok.value === "++") {
      this.advance();
      return new Assign(target, new BinOp("+", new VarRef(target.name, target.indices, target.fields), new Literal(1)));
    }
    if (nextTok.kind === "OP" && nextTok.value === "--") {
      this.advance();
      return new Assign(target, new BinOp("-", new VarRef(target.name, target.indices, target.fields), new Literal(1)));
    }
    const assignTok = this.expect("OP");
    if (!["<-", "<--", "="].includes(assignTok.value)) {
      throw new Error(`Expected assignment '<-' at ${assignTok.line}:${assignTok.col}`);
    }
    const expr = this.parseExpr();
    return new Assign(target, expr);
  }

  parseReturn() {
    this.expect("KEYWORD", "RETURN");
    const expr = this.parseExpr();
    return new Return(expr);
  }

  parseLvalue() {
    let name = this.expect("IDENT").value;
    const indices = [];
    const fields = [];

    while (true) {
      if (this.match("OP", "[")) {
        const idx = this.parseExpr();
        this.expect("OP", "]");
        indices.push(idx);
      } else if (this.match("OP", ".")) {
        fields.push(this.expect("IDENT").value);
      } else {
        break;
      }
    }

    return new VarRef(name, indices, fields);
  }

  parseVarName(varSizes) {
    const name = this.expect("IDENT").value;
    // Support multi-dimensional array declarations: M[2][3] (USTHB course Week 3)
    const dims = [];
    while (this.match("OP", "[")) {
      dims.push(this.parseExpr());
      this.expect("OP", "]");
    }
    if (dims.length > 0 && varSizes) {
      varSizes[name] = dims.length === 1 ? dims[0] : dims;
    }
    return name;
  }

  parseRead() {
    this.expect("KEYWORD", "READ");
    this.expect("OP", "(");
    const targets = [];
    if (!this.match("OP", ")")) {
      targets.push(this.parseLvalue());
      while (this.match("OP", ",")) targets.push(this.parseLvalue());
      this.expect("OP", ")");
    }
    return new Read(targets);
  }

  parseWrite() {
    this.expect("KEYWORD", "WRITE");
    this.expect("OP", "(");
    const args = [];
    if (!this.match("OP", ")")) {
      args.push(this.parseExpr());
      while (this.match("OP", ",")) args.push(this.parseExpr());
      this.expect("OP", ")");
    }
    return new Write(args);
  }

  parseIf() {
    this.expect("KEYWORD", "IF");
    const cond = this.parseExpr();
    // Support "Then" being optional (some USTHB slides omit it in conditions like If(x>0))
    this.match("KEYWORD", "THEN");
    const body = this.parseStmtList(["ELSE", "ELSEIF", "ENDIF"]);
    let elseBody = [];
    if (this.peek().kind === "KEYWORD" && this.peek().value === "ELSEIF") {
      // ElseIf is a nested If inside the else branch (USTHB Week 4 binary search)
      elseBody = [this.parseElseIf()];
    } else if (this.match("KEYWORD", "ELSE")) {
      elseBody = this.parseStmtList(["ENDIF"]);
    }
    this.expect("KEYWORD", "ENDIF");
    return new If(cond, body, elseBody);
  }

  parseElseIf() {
    this.expect("KEYWORD", "ELSEIF");
    const cond = this.parseExpr();
    this.match("KEYWORD", "THEN");
    const body = this.parseStmtList(["ELSE", "ELSEIF", "ENDIF"]);
    let elseBody = [];
    if (this.peek().kind === "KEYWORD" && this.peek().value === "ELSEIF") {
      elseBody = [this.parseElseIf()];
    } else if (this.match("KEYWORD", "ELSE")) {
      elseBody = this.parseStmtList(["ENDIF"]);
    }
    // Don't consume ENDIF here — the outer parseIf will consume it
    return new If(cond, body, elseBody);
  }

  parseSwitch() {
    this.expect("KEYWORD", "SWITCH");
    this.expect("OP", "(");
    const expr = this.parseExpr();
    this.expect("OP", ")");
    this.skipSeparators();

    const cases = [];
    let defaultBody = [];

    while (true) {
      this.skipSeparators();
      const tok = this.peek();
      if (tok.kind === "KEYWORD" && tok.value === "CASE") {
        this.advance();
        const caseValue = this.parseExpr();
        this.match("OP", ":");
        this.skipSeparators();
        const caseBody = this.parseStmtList(["CASE", "ELSE", "ENDSWITCH"]);
        cases.push({ value: caseValue, body: caseBody });
      } else if (tok.kind === "KEYWORD" && tok.value === "ELSE") {
        this.advance();
        this.match("OP", ":");
        this.skipSeparators();
        defaultBody = this.parseStmtList(["ENDSWITCH"]);
      } else {
        break;
      }
    }
    this.expect("KEYWORD", "ENDSWITCH");
    return new Switch(expr, cases, defaultBody);
  }

  parseFor() {
    this.expect("KEYWORD", "FOR");
    const variable = this.parseLvalue();
    const assignTok = this.expect("OP");
    if (!["<-", "<--"].includes(assignTok.value)) {
      throw new Error("Expected '<-' in for loop");
    }
    const start = this.parseExpr();
    this.expect("KEYWORD", "TO");
    const end = this.parseExpr();
    this.expect("KEYWORD", "DO");
    const body = this.parseStmtList(["ENDFOR"]);
    this.expect("KEYWORD", "ENDFOR");
    return new For(variable, start, end, body);
  }

  parseWhile() {
    this.expect("KEYWORD", "WHILE");
    const cond = this.parseExpr();
    this.expect("KEYWORD", "DO");
    const body = this.parseStmtList(["ENDWHILE"]);
    this.expect("KEYWORD", "ENDWHILE");
    return new While(cond, body);
  }

  parseDoWhile() {
    this.expect("KEYWORD", "DO");
    const body = this.parseStmtList(["WHILE"]);
    this.expect("KEYWORD", "WHILE");
    const cond = this.parseExpr();
    return new DoWhile(body, cond);
  }

  parseRepeatUntil() {
    this.expect("KEYWORD", "REPEAT");
    const body = this.parseStmtList(["UNTIL"]);
    this.expect("KEYWORD", "UNTIL");
    const cond = this.parseExpr();
    return new RepeatUntil(body, cond);
  }

  parseExpr() {
    return this.parseOr();
  }

  parseOr() {
    let node = this.parseAnd();
    while (this.match("KEYWORD", "OR") || this.match("OP", "||")) {
      node = new BinOp("OR", node, this.parseAnd());
    }
    return node;
  }

  parseAnd() {
    let node = this.parseNot();
    while (this.match("KEYWORD", "AND") || this.match("OP", "&&")) {
      node = new BinOp("AND", node, this.parseNot());
    }
    return node;
  }

  parseNot() {
    if (this.match("KEYWORD", "NOT")) return new UnaryOp("NOT", this.parseNot());
    // Support ! as alias for NOT (USTHB Week 1 & 2 slides)
    if (this.peek().kind === "OP" && this.peek().value === "!" &&
        !(this.peek(1).kind === "OP" && this.peek(1).value === "=")) {
      this.advance();
      return new UnaryOp("NOT", this.parseNot());
    }
    return this.parseCompare();
  }

  parseCompare() {
    let node = this.parseArith();
    const tok = this.peek();
    if (tok.kind === "OP" && ["=", "==", "<>", "!=", "<", "<=", ">", ">="].includes(tok.value)) {
      let op = this.advance().value;
      // Normalize == to = for internal representation
      if (op === "==") op = "=";
      node = new BinOp(op, node, this.parseArith());
    }
    return node;
  }

  parseArith() {
    let node = this.parseTerm();
    while (true) {
      const tok = this.peek();
      if (tok.kind === "OP" && ["+", "-"].includes(tok.value)) {
        const op = this.advance().value;
        node = new BinOp(op, node, this.parseTerm());
      } else break;
    }
    return node;
  }

  parseTerm() {
    let node = this.parsePower();
    while (true) {
      const tok = this.peek();
      if (tok.kind === "OP" && ["*", "/"].includes(tok.value)) {
        const op = this.advance().value;
        node = new BinOp(op, node, this.parsePower());
      } else if (tok.kind === "KEYWORD" && tok.value === "MOD") {
        this.advance();
        node = new BinOp("MOD", node, this.parsePower());
      } else if (tok.kind === "OP" && tok.value === "%") {
        // Support % as alias for MOD (USTHB course Week 2 & 3)
        this.advance();
        node = new BinOp("MOD", node, this.parsePower());
      } else if (tok.kind === "KEYWORD" && tok.value === "DIV") {
        this.advance();
        node = new BinOp("DIV", node, this.parsePower());
      } else break;
    }
    return node;
  }

  parsePower() {
    let node = this.parseUnary();
    while (true) {
      const tok = this.peek();
      if (tok.kind === "OP" && (tok.value === "**" || tok.value === "^")) {
        this.advance();
        node = new BinOp("**", node, this.parseUnary());
      } else break;
    }
    return node;
  }

  parseUnary() {
    const tok = this.peek();
    // Handle & (address-of) and * (dereference)
    if (tok.kind === "OP" && tok.value === "&") {
      this.advance();
      return new UnaryOp("&", this.parseUnary());
    }
    if (tok.kind === "OP" && tok.value === "*") {
      this.advance();
      return new UnaryOp("*", this.parseUnary());
    }
    return this.parseFactor();
  }

  parseFactor() {
    const tok = this.peek();
    if (tok.kind === "NUMBER") {
      this.advance();
      return new Literal(tok.value);
    }
    if (tok.kind === "STRING") {
      this.advance();
      return new Literal(tok.value);
    }
    if (tok.kind === "KEYWORD" && ["TRUE", "FALSE"].includes(tok.value)) {
      this.advance();
      return new Literal(tok.value === "TRUE");
    }
    if (tok.kind === "KEYWORD" && tok.value === "NULL") {
      this.advance();
      return new Literal(null);
    }
    if (tok.kind === "OP" && tok.value === "-") {
      this.advance();
      return new UnaryOp("-", this.parseFactor());
    }
    if (tok.kind === "OP" && tok.value === "(") {
      this.advance();
      const expr = this.parseExpr();
      this.expect("OP", ")");
      return expr;
    }
    if (tok.kind === "KEYWORD" && tok.value === "SQRT") {
      this.advance();
      this.expect("OP", "(");
      const arg = this.parseExpr();
      this.expect("OP", ")");
      return new Call("SQRT", [arg]);
    }
    if (tok.kind === "IDENT") {
      const name = this.advance().value;
      // Check for function call
      if (this.peek().kind === "OP" && this.peek().value === "(") {
        this.advance();
        const args = [];
        if (!this.match("OP", ")")) {
          args.push(this.parseExpr());
          while (this.match("OP", ",")) args.push(this.parseExpr());
          this.expect("OP", ")");
        }
        return new Call(name, args);
      }
      // Otherwise it's a variable reference
      const indices = [];
      const fields = [];
      while (true) {
        if (this.match("OP", "[")) {
          const idx = this.parseExpr();
          this.expect("OP", "]");
          indices.push(idx);
        } else if (this.match("OP", ".")) {
          fields.push(this.expect("IDENT").value);
        } else {
          break;
        }
      }
      return new VarRef(name, indices, fields);
    }
    throw new Error(`Unexpected token ${tok.kind} ${tok.value}`);
  }
}

class Context {
  constructor(varTypes, functions = {}) {
    this.vars = {};
    this.varTypes = varTypes;
    this.functions = functions;
    this.lastPrompt = "";
    this.pointers = new Map(); // Track pointer addresses
    this.nextAddress = 1000; // Start addresses from 1000
  }

  get(name) {
    if (!(name in this.vars)) {
      const type = (this.varTypes[name] || "").toUpperCase();
      if (type.startsWith("*")) {
        this.vars[name] = null; // Null pointer
      } else {
        this.vars[name] = 0;
      }
    }
    return this.vars[name];
  }

  set(name, value) {
    this.vars[name] = value;
  }

  castForType(name, rawValue) {
    const t = (this.varTypes[name] || "").toUpperCase();
    if (t.startsWith("*")) return rawValue; // Pointers store addresses
    
    if (t === "INTEGER") {
      const trimmed = String(rawValue).trim();
      const num = Number(trimmed);
      if (trimmed === "" || isNaN(num)) {
        throw new Error(`Invalid input: Expected an Integer for '${name}', got '${rawValue}'`);
      }
      if (!Number.isInteger(num)) {
        throw new Error(`Invalid input: Expected an Integer for '${name}', got '${rawValue}' — did you mean to declare it as Real?`);
      }
      return num;
    }
    if (t === "FLOAT" || t === "REAL") {
      // Support French math notation (comma as decimal separator)
      const normalizedValue = String(rawValue).replace(',', '.').trim();
      const num = Number(normalizedValue);
      // Strictly check for full-string validity (reject "3.14abc")
      if (normalizedValue === "" || isNaN(num)) {
        throw new Error(`Invalid input: Expected a Real/Float for '${name}', got '${rawValue}'`);
      }
      return num;
    }
    
    if (t === "BOOLEAN") {
      if (typeof rawValue === "string") return ["true", "1", "yes"].includes(rawValue.trim().toLowerCase());
      return Boolean(rawValue);
    }
    if (t === "CHARACTER") return String(rawValue)[0] || "";
    if (t === "STRING") return String(rawValue);
    return rawValue;
  }

  allocateAddress(value) {
    const addr = this.nextAddress++;
    this.pointers.set(addr, value);
    return addr;
  }

  dereference(addr) {
    if (addr === null) throw new Error("Null pointer dereference");
    return this.pointers.get(addr);
  }

  setDereference(addr, value) {
    if (addr === null) throw new Error("Null pointer dereference");
    this.pointers.set(addr, value);
  }
}

class Program {
  constructor(stmts, varTypes, varSizes, functions = {}, structs = {}, enums = {}) {
    this.stmts = stmts;
    this.varTypes = varTypes;
    this.varSizes = varSizes || {};
    this.functions = functions;
    this.structs = structs;
    this.enums = enums;
  }

  async run(input, output) {
    const ctx = new Context(this.varTypes, this.functions);
    for (const s of this.stmts) {
      await s.exec(ctx, input, output);
    }
  }

  toC() {
    const gen = new CGenerator(this);
    return gen.generate();
  }
}

class VarRef {
  constructor(name, indices = [], fields = []) {
    this.name = name;
    this.indices = indices;
    this.fields = fields;
  }

  async eval(ctx) {
    let val = ctx.get(this.name);
    for (const idxExpr of this.indices) {
      const idx = parseInt(await evalExpr(idxExpr, ctx), 10);
      if (Array.isArray(val)) {
        if (idx <= 0 || idx >= val.length) throw new Error(`Index ${idx} out of range for ${this.name}`);
        val = val[idx];
      } else {
        throw new Error(`${this.name} is not an array`);
      }
    }
    for (const field of this.fields) {
      if (typeof val === "object" && val !== null) {
        val = val[field];
      } else {
        throw new Error(`Cannot access field ${field} of non-struct value`);
      }
    }
    return val;
  }

  async assign(ctx, value) {
    if (!this.indices.length && !this.fields.length) {
      ctx.set(this.name, value);
      return;
    }
    let arr = ctx.get(this.name);
    if (!Array.isArray(arr)) arr = [null];
    let current = arr;
    for (let i = 0; i < this.indices.length; i++) {
      const idx = parseInt(await evalExpr(this.indices[i], ctx), 10);
      if (idx < 1) throw new Error("Array indices are 1-based");
      while (current.length <= idx) current.push(null);
      if (i === this.indices.length - 1) {
        if (this.fields.length) {
          if (current[idx] == null) current[idx] = {};
          let obj = current[idx];
          for (let j = 0; j < this.fields.length - 1; j++) {
            if (!(this.fields[j] in obj)) obj[this.fields[j]] = {};
            obj = obj[this.fields[j]];
          }
          obj[this.fields[this.fields.length - 1]] = value;
        } else {
          current[idx] = value;
        }
      } else {
        if (current[idx] == null) current[idx] = [null];
        current = current[idx];
      }
    }
    ctx.set(this.name, arr);
  }
}

class Assign {
  constructor(target, expr) {
    this.target = target;
    this.expr = expr;
  }

  async exec(ctx) {
    const value = await evalExpr(this.expr, ctx);
    await this.target.assign(ctx, value);
  }
}

class Return {
  constructor(expr) {
    this.expr = expr;
  }

  async exec(ctx) {
    ctx.returnValue = await evalExpr(this.expr, ctx);
    ctx.shouldReturn = true;
  }
}

class Read {
  constructor(targets) {
    this.targets = targets;
  }

  async exec(ctx, input, output) {
    if (!ctx.inputBuffer) {
      ctx.inputBuffer = [];
    }
    
    for (const t of this.targets) {
      let valid = false;
      while (!valid) {
        if (ctx.inputBuffer.length === 0) {
          const next = await input(ctx.lastPrompt);
          if (next === undefined || String(next).trim() === "") {
            throw new Error("Not enough input values. Provide more numbers in the Input box.");
          }
          const parts = String(next).split(/\s+/).filter(Boolean);
          ctx.inputBuffer.push(...parts);
        }
        
        const raw = ctx.inputBuffer.shift();
        try {
          const value = ctx.castForType(t.name, raw);
          await t.assign(ctx, value);
          valid = true;
        } catch (err) {
          // If input is invalid, alert the user and let them try again interactively (if possible)
          if (output) {
            output(`\\u26A0\\uFE0F ${err.message}. Please try again.`);
          } else {
            throw err;
          }
        }
      }
    }
  }
}

class Write {
  constructor(args) {
    this.args = args;
  }

  async exec(ctx, _input, output) {
    const parts = [];
    for (const a of this.args) {
      parts.push(String(await evalExpr(a, ctx)));
    }
    const text = parts.join("");
    ctx.lastPrompt = text;
    output(text);
  }
}

class If {
  constructor(cond, body, elseBody) {
    this.cond = cond;
    this.body = body;
    this.elseBody = elseBody;
  }

  async exec(ctx, input, output) {
    if (truthy(await evalExpr(this.cond, ctx))) {
      for (const s of this.body) {
        await s.exec(ctx, input, output);
        if (ctx.shouldReturn) break;
      }
    } else {
      for (const s of this.elseBody) {
        await s.exec(ctx, input, output);
        if (ctx.shouldReturn) break;
      }
    }
  }
}

class For {
  constructor(variable, start, end, body) {
    this.variable = variable;
    this.start = start;
    this.end = end;
    this.body = body;
  }

  async exec(ctx, input, output) {
    const start = parseInt(await evalExpr(this.start, ctx), 10);
    const end = parseInt(await evalExpr(this.end, ctx), 10);
    const step = end >= start ? 1 : -1;
    let i = start;
    while ((i <= end && step > 0) || (i >= end && step < 0)) {
      await this.variable.assign(ctx, i);
      for (const s of this.body) {
        await s.exec(ctx, input, output);
        if (ctx.shouldReturn) break;
      }
      if (ctx.shouldReturn) return;
      i += step;
    }
  }
}

class While {
  constructor(cond, body) {
    this.cond = cond;
    this.body = body;
  }

  async exec(ctx, input, output) {
    while (truthy(await evalExpr(this.cond, ctx))) {
      for (const s of this.body) {
        await s.exec(ctx, input, output);
        if (ctx.shouldReturn) break;
      }
      if (ctx.shouldReturn) return;
    }
  }
}

class DoWhile {
  constructor(body, cond) {
    this.body = body;
    this.cond = cond;
  }

  async exec(ctx, input, output) {
    while (true) {
      for (const s of this.body) {
        await s.exec(ctx, input, output);
        if (ctx.shouldReturn) break;
      }
      if (ctx.shouldReturn) return;
      if (!truthy(await evalExpr(this.cond, ctx))) break;
    }
  }
}

class RepeatUntil {
  constructor(body, cond) {
    this.body = body;
    this.cond = cond;
  }

  async exec(ctx, input, output) {
    while (true) {
      for (const s of this.body) {
        await s.exec(ctx, input, output);
        if (ctx.shouldReturn) break;
      }
      if (ctx.shouldReturn) return;
      if (truthy(await evalExpr(this.cond, ctx))) break;
    }
  }
}

class Switch {
  constructor(expr, cases, defaultBody) {
    this.expr = expr;
    this.cases = cases;
    this.defaultBody = defaultBody;
  }

  async exec(ctx, input, output) {
    const value = await evalExpr(this.expr, ctx);
    let matched = false;
    for (const c of this.cases) {
      const caseVal = await evalExpr(c.value, ctx);
      if (value === caseVal) {
        matched = true;
        for (const s of c.body) {
          await s.exec(ctx, input, output);
          if (ctx.shouldReturn) break;
        }
        break;
      }
    }
    if (!matched && this.defaultBody.length > 0) {
      for (const s of this.defaultBody) {
        await s.exec(ctx, input, output);
        if (ctx.shouldReturn) break;
      }
    }
  }
}

class Literal {
  constructor(value) {
    this.value = value;
  }
}

class UnaryOp {
  constructor(op, expr) {
    this.op = op;
    this.expr = expr;
  }
}

class BinOp {
  constructor(op, left, right) {
    this.op = op;
    this.left = left;
    this.right = right;
  }
}

class Call {
  constructor(name, args) {
    this.name = name;
    this.args = args;
  }
}

class CGenerator {
  constructor(program) {
    this.program = program;
    this.lines = [];
    this.indent = 0;
    this.stepCounter = 0;
  }

  emit(line) {
    this.lines.push(`${"  ".repeat(this.indent)}${line}`);
  }

  cType(typeName) {
    const t = String(typeName || "").toUpperCase();
    if (t.startsWith("*")) {
      const baseType = t.slice(1);
      return this.cType(baseType) + "*";
    }
    if (t === "INTEGER") return "int";
    if (t === "REAL" || t === "FLOAT") return "double";
    if (t === "BOOLEAN") return "bool";
    if (t === "CHARACTER") return "char";
    if (t === "STRING") return "char*";
    return "double";
  }

  generate() {
    this.emit("#include <stdio.h>");
    this.emit("#include <stdbool.h>");
    this.emit("#include <math.h>");
    this.emit("#include <stdlib.h>");
    this.emit("");

    // Generate struct definitions
    Object.entries(this.program.structs).forEach(([name, structDef]) => {
      this.emit(`typedef struct {`);
      this.indent++;
      Object.entries(structDef.fields).forEach(([fieldName, fieldType]) => {
        this.emit(`${this.cType(fieldType)} ${fieldName};`);
      });
      this.indent--;
      this.emit(`} ${name};`);
      this.emit("");
    });

    // Generate function declarations and definitions
    Object.entries(this.program.functions).forEach(([funcName, funcDef]) => {
      const returnType = this.cType(funcDef.returnType);
      const params = funcDef.params.map((p) => `${this.cType(p.type)} ${p.name}`).join(", ");
      this.emit(`${returnType} ${funcName}(${params}) {`);
      this.indent++;
      // Emit local variables
      Object.entries(funcDef.varTypes).forEach(([varName, varType]) => {
        this.emit(`${this.cType(varType)} ${varName};`);
      });
      if (Object.keys(funcDef.varTypes).length > 0) this.emit("");
      // Emit function body
      funcDef.body.forEach((s) => this.emitStmt(s));
      if (funcDef.returnType !== "VOID") {
        this.emit("return 0;");
      }
      this.indent--;
      this.emit("}");
      this.emit("");
    });

    this.emit("int main(void) {");
    this.indent++;
    this.emitVars();
    this.emit("");
    this.program.stmts.forEach((s) => this.emitStmt(s));
    this.emit("");
    this.emit("return 0;");
    this.indent--;
    this.emit("}");
    return this.lines.join("\n");
  }

  emitVars() {
    const names = Object.keys(this.program.varTypes);
    names.forEach((name) => {
      const type = this.cType(this.program.varTypes[name]);
      const sizeExpr = this.program.varSizes[name];
      if (sizeExpr) {
        // Support multi-dimensional arrays (USTHB Week 3)
        if (Array.isArray(sizeExpr)) {
          const dims = sizeExpr.map(d => this.exprToC(d).code).join('][');
          this.emit(`${type} ${name}[${dims}];`);
        } else {
          const size = this.exprToC(sizeExpr).code;
          this.emit(`${type} ${name}[${size}];`);
        }
      } else {
        this.emit(`${type} ${name};`);
      }
    });
  }

  emitStmt(stmt) {
    if (stmt instanceof Assign) {
      const lhs = this.lvalueToC(stmt.target);
      const rhs = this.exprToC(stmt.expr).code;
      this.emit(`${lhs} = ${rhs};`);
      return;
    }
    if (stmt instanceof Return) {
      const expr = this.exprToC(stmt.expr).code;
      this.emit(`return ${expr};`);
      return;
    }
    if (stmt instanceof Read) {
      const formats = [];
      const args = [];
      stmt.targets.forEach((t) => {
        const { code, type } = this.lvalueToCWithType(t);
        if (type.includes("double")) formats.push("%lf");
        else if (type.includes("char") && !type.includes("*")) formats.push(" %c");
        else if (type.includes("char*")) formats.push("%s");
        else formats.push("%d");
        args.push(`&${code}`);
      });
      this.emit(`scanf("${formats.join(" ")}", ${args.join(", ")});`);
      return;
    }
    if (stmt instanceof Write) {
      const fmtParts = [];
      const args = [];
      stmt.args.forEach((a) => {
        const info = this.exprToC(a);
        if (info.type === "string") {
          fmtParts.push(this.escapeFormatString(info.code.slice(1, -1)));
        } else if (info.type.includes("double")) {
          fmtParts.push("%g");
          args.push(info.code);
        } else if (info.type === "char") {
          fmtParts.push("%c");
          args.push(info.code);
        } else if (info.type.includes("char*")) {
          fmtParts.push("%s");
          args.push(info.code);
        } else {
          fmtParts.push("%d");
          args.push(info.code);
        }
      });
      const fmt = fmtParts.join("");
      const argsPart = args.length ? `, ${args.join(", ")}` : "";
      this.emit(`printf("${fmt}"${argsPart});`);
      return;
    }
    if (stmt instanceof If) {
      const cond = this.exprToC(stmt.cond).code;
      this.emit(`if (${cond}) {`);
      this.indent++;
      stmt.body.forEach((s) => this.emitStmt(s));
      this.indent--;
      if (stmt.elseBody.length) {
        this.emit("} else {");
        this.indent++;
        stmt.elseBody.forEach((s) => this.emitStmt(s));
        this.indent--;
      }
      this.emit("}");
      return;
    }
    if (stmt instanceof For) {
      const start = this.exprToC(stmt.start).code;
      const end = this.exprToC(stmt.end).code;
      const varName = this.lvalueToC(stmt.variable);
      const stepName = `__step${this.stepCounter++}`;
      this.emit(`{`);
      this.indent++;
      this.emit(`int ${stepName} = (${start} <= ${end}) ? 1 : -1;`);
      this.emit(`for (${varName} = ${start}; (${stepName} > 0 ? ${varName} <= ${end} : ${varName} >= ${end}); ${varName} += ${stepName}) {`);
      this.indent++;
      stmt.body.forEach((s) => this.emitStmt(s));
      this.indent--;
      this.emit("}");
      this.indent--;
      this.emit("}");
      return;
    }
    if (stmt instanceof While) {
      const cond = this.exprToC(stmt.cond).code;
      this.emit(`while (${cond}) {`);
      this.indent++;
      stmt.body.forEach((s) => this.emitStmt(s));
      this.indent--;
      this.emit("}");
      return;
    }
    if (stmt instanceof DoWhile) {
      this.emit("do {");
      this.indent++;
      stmt.body.forEach((s) => this.emitStmt(s));
      this.indent--;
      const cond = this.exprToC(stmt.cond).code;
      this.emit(`} while (${cond});`);
      return;
    }
    if (stmt instanceof RepeatUntil) {
      this.emit("do {");
      this.indent++;
      stmt.body.forEach((s) => this.emitStmt(s));
      this.indent--;
      const cond = this.exprToC(stmt.cond).code;
      this.emit(`} while (!(${cond}));`);
      return;
    }
    if (stmt instanceof Switch) {
      const expr = this.exprToC(stmt.expr).code;
      this.emit(`switch (${expr}) {`);
      this.indent++;
      stmt.cases.forEach((c) => {
        const val = this.exprToC(c.value).code;
        this.emit(`case ${val}:`);
        this.indent++;
        c.body.forEach((s) => this.emitStmt(s));
        this.emit("break;");
        this.indent--;
      });
      if (stmt.defaultBody.length > 0) {
        this.emit("default:");
        this.indent++;
        stmt.defaultBody.forEach((s) => this.emitStmt(s));
        this.emit("break;");
        this.indent--;
      }
      this.indent--;
      this.emit("}");
      return;
    }
  }

  lvalueToCWithType(lvalue) {
    const code = this.lvalueToC(lvalue);
    const type = this.cType(this.program.varTypes[lvalue.name]);
    return { code, type };
  }

  lvalueToC(lvalue) {
    let code = lvalue.name;
    lvalue.indices.forEach((idx) => {
      const idxCode = this.exprToC(idx).code;
      code += `[(${idxCode}) - 1]`;
    });
    lvalue.fields.forEach((field) => {
      code += `.${field}`;
    });
    return code;
  }

  exprToC(node) {
    if (node instanceof Literal) {
      if (typeof node.value === "string") return { code: JSON.stringify(node.value), type: "string" };
      if (typeof node.value === "boolean") return { code: node.value ? "true" : "false", type: "bool" };
      if (node.value === null) return { code: "NULL", type: "pointer" };
      if (Number.isInteger(node.value)) return { code: String(node.value), type: "int" };
      return { code: String(node.value), type: "double" };
    }
    if (node instanceof VarRef) {
      const type = this.cType(this.program.varTypes[node.name]);
      return { code: this.lvalueToC(node), type };
    }
    if (node instanceof UnaryOp) {
      const v = this.exprToC(node.expr);
      if (node.op === "NOT") return { code: `!(${v.code})`, type: "bool" };
      if (node.op === "-") return { code: `-(${v.code})`, type: v.type };
      if (node.op === "&") return { code: `&(${v.code})`, type: v.type + "*" };
      if (node.op === "*") return { code: `*(${v.code})`, type: v.type.replace("*", "") };
    }
    if (node instanceof BinOp) {
      const a = this.exprToC(node.left);
      const b = this.exprToC(node.right);
      if (node.op === "**") return { code: `pow(${a.code}, ${b.code})`, type: "double" };
      if (node.op === "MOD") return { code: `(${a.code} % ${b.code})`, type: "int" };
      if (node.op === "DIV") return { code: `(${a.code} / ${b.code})`, type: "int" };
      if (["=", "<>", "!=", "<", "<=", ">", ">="].includes(node.op)) {
        const op = node.op === "<>" || node.op === "!=" ? "!=" : node.op === "=" ? "==" : node.op;
        return { code: `(${a.code} ${op} ${b.code})`, type: "bool" };
      }
      if (node.op === "AND") return { code: `(${a.code} && ${b.code})`, type: "bool" };
      if (node.op === "OR") return { code: `(${a.code} || ${b.code})`, type: "bool" };
      return { code: `(${a.code} ${node.op} ${b.code})`, type: a.type === "double" || b.type === "double" ? "double" : "int" };
    }
    if (node instanceof Call) {
      if (node.name === "SQRT") {
        const v = this.exprToC(node.args[0]);
        return { code: `sqrt(${v.code})`, type: "double" };
      }
      const args = node.args.map((a) => this.exprToC(a).code).join(", ");
      return { code: `${node.name}(${args})`, type: "int" };
    }
    return { code: "0", type: "int" };
  }

  escapeFormatString(text) {
    return String(text).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  }
}

function truthy(value) {
  return Boolean(value);
}

async function evalExpr(node, ctx) {
  if (node instanceof Literal) return node.value;
  if (node instanceof VarRef) return await node.eval(ctx);
  if (node instanceof UnaryOp) {
    const v = await evalExpr(node.expr, ctx);
    if (node.op === "-") return -v;
    if (node.op === "NOT") return !truthy(v);
    if (node.op === "&") {
      // Address-of: allocate address for variable
      if (node.expr instanceof VarRef) {
        const addr = ctx.allocateAddress(ctx.get(node.expr.name));
        return addr;
      }
      throw new Error("Cannot take address of non-variable");
    }
    if (node.op === "*") {
      // Dereference: get value at address
      const addr = await evalExpr(node.expr, ctx);
      return ctx.dereference(addr);
    }
  }
  if (node instanceof BinOp) {
    const a = await evalExpr(node.left, ctx);
    const b = await evalExpr(node.right, ctx);
    if (node.op === "+") return a + b;
    if (node.op === "-") return a - b;
    if (node.op === "*") return a * b;
    if (node.op === "/") return a / b;
    if (node.op === "MOD") return a % b;
    if (node.op === "DIV") return Math.trunc(a / b);
    if (node.op === "**") return a ** b;
    if (node.op === "=") return a === b;
    if (node.op === "<>") return a !== b;
    if (node.op === "!=") return a !== b;
    if (node.op === "<") return a < b;
    if (node.op === "<=") return a <= b;
    if (node.op === ">") return a > b;
    if (node.op === ">=") return a >= b;
    if (node.op === "AND") return truthy(a) && truthy(b);
    if (node.op === "OR") return truthy(a) || truthy(b);
  }
  if (node instanceof Call) {
    if (node.name === "SQRT") {
      const v = await evalExpr(node.args[0], ctx);
      return Math.sqrt(v);
    }
    // Function call
    const funcDef = ctx.functions[node.name];
    if (!funcDef) throw new Error(`Undefined function ${node.name}`);
    
    const funcCtx = new Context(funcDef.varTypes, ctx.functions);
    funcCtx.pointers = ctx.pointers; // Share pointer memory
    
    // Bind parameters
    if (node.args.length !== funcDef.params.length) {
      throw new Error(`Function ${node.name} expects ${funcDef.params.length} arguments, got ${node.args.length}`);
    }
    
    for (let i = 0; i < funcDef.params.length; i++) {
      const param = funcDef.params[i];
      const argValue = await evalExpr(node.args[i], ctx);
      funcCtx.set(param.name, argValue);
    }
    
    // Execute function body
    for (const s of funcDef.body) {
      await s.exec(funcCtx, () => {}, () => {});
      if (funcCtx.shouldReturn) break;
    }
    
    return funcCtx.returnValue || 0;
  }
  throw new Error("Invalid expression");
}

function generateC(source) {
  const lexer = new Lexer(source);
  const tokens = lexer.tokens();
  const parser = new Parser(tokens);
  const program = parser.parse();
  return program.toC();
}

window.AlgoInterpreter = AlgoInterpreter;
window.generateC = generateC;

// ── PATCH: Add "END IF" (with space) as alias for ENDIF ──────────────────
// The USTHB academic syntax uses "End If;" with a space between the two words.
// We handle this at the token level by merging consecutive END + IF tokens.
// Also fix: "print" → treat as alias for "Write"
