// lexer.mjs
export class Token {
    constructor(type, value, line, column) {
      this.type = type;
      this.value = value;
      this.line = line;
      this.column = column;
    }
  }
  
  export class Lexer {
    constructor(input) {
      this.input = input;
      this.position = 0;
      this.line = 1;
      this.column = 1;
      this.currentChar = this.input[0] || null;
    }
  
    error(message) {
      throw new Error(`Lexer error at line ${this.line}, col ${this.column}: ${message}`);
    }
  
    advance() {
      this.position++;
      if (this.position >= this.input.length) {
        this.currentChar = null;
      } else {
        this.currentChar = this.input[this.position];
        this.column++;
      }
    }
  
    skipComment() {
      // Skip the '//' and then until the end of line.
      this.advance();
      this.advance();
      while (this.currentChar !== null && this.currentChar !== '\n') {
        this.advance();
      }
    }
  
    skipWhitespace() {
      while (this.currentChar && /\s/.test(this.currentChar)) {
        if (this.currentChar === '\n') {
          this.line++;
          this.column = 1;
        }
        this.advance();
      }
    }
  
    number() {
      let result = '';
      while (this.currentChar && /\d/.test(this.currentChar)) {
        result += this.currentChar;
        this.advance();
      }
      if (this.currentChar === '.') {
        result += '.';
        this.advance();
        while (this.currentChar && /\d/.test(this.currentChar)) {
          result += this.currentChar;
          this.advance();
        }
      }
      return new Token('NUMBER', parseFloat(result), this.line, this.column);
    }
  
    identifier() {
      let result = '';
      while (this.currentChar && /[a-zA-Z0-9_.]/.test(this.currentChar)) {
        result += this.currentChar;
        this.advance();
      }
      // Map some keywords to token types.
      const keywords = {
        'param': 'PARAM',
        'shape': 'SHAPE',
        'layer': 'LAYER',
        'transform': 'TRANSFORM',
        'add': 'ADD',
        'subtract': 'SUBTRACT',
        'rotate': 'ROTATE',
        'scale': 'SCALE',
        'position': 'POSITION'
      };
      const type = keywords[result] || 'IDENTIFIER';
      return new Token(type, result, this.line, this.column);
    }
  
    getNextToken() {
      while (this.currentChar !== null) {
        if (this.currentChar === '/' && this.input[this.position + 1] === '/') {
          this.skipComment();
          continue;
        }
        if (/\s/.test(this.currentChar)) {
          this.skipWhitespace();
          continue;
        }
        if (/\d/.test(this.currentChar)) {
          return this.number();
        }
        if (/[a-zA-Z_]/.test(this.currentChar)) {
          return this.identifier();
        }
        switch (this.currentChar) {
          case '{':
            this.advance();
            return new Token('LBRACE', '{', this.line, this.column);
          case '}':
            this.advance();
            return new Token('RBRACE', '}', this.line, this.column);
          case '[':
            this.advance();
            return new Token('LBRACKET', '[', this.line, this.column);
          case ']':
            this.advance();
            return new Token('RBRACKET', ']', this.line, this.column);
          case ':':
            this.advance();
            return new Token('COLON', ':', this.line, this.column);
          case ',':
            this.advance();
            return new Token('COMMA', ',', this.line, this.column);
          case '*':
            this.advance();
            return new Token('MULTIPLY', '*', this.line, this.column);
          case '/':
            this.advance();
            return new Token('DIVIDE', '/', this.line, this.column);
          case '+':
            this.advance();
            return new Token('PLUS', '+', this.line, this.column);
          case '-':
            this.advance();
            return new Token('MINUS', '-', this.line, this.column);
          case '.':
            this.advance();
            return new Token('DOT', '.', this.line, this.column);
          case '"':
            this.advance();
            return new Token('QUOTE', '"', this.line, this.column);
          default:
            this.error(`Unknown character: ${this.currentChar}`);
        }
      }
      return new Token('EOF', null, this.line, this.column);
    }
  }
  
