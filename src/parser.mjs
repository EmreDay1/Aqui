// parser.mjs
import { Token } from './lexer.mjs';

export class Parser {
  constructor(lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
  }

  error(message) {
    throw new Error(`Parser error at line ${this.currentToken.line}, col ${this.currentToken.column}: ${message}`);
  }

  eat(tokenType) {
    if (this.currentToken.type === tokenType) {
      const token = this.currentToken;
      this.currentToken = this.lexer.getNextToken();
      return token;
    } else {
      this.error(`Expected ${tokenType} but got ${this.currentToken.type}`);
    }
  }

  parseExpression() {
    let node = this.parseTerm();
    while (this.currentToken.type === 'PLUS' || this.currentToken.type === 'MINUS') {
      const operator = this.currentToken.type;
      this.eat(operator);
      node = {
        type: 'binary_op',
        operator: operator.toLowerCase(),
        left: node,
        right: this.parseTerm()
      };
    }
    return node;
  }

  parseTerm() {
    let node = this.parseFactor();
    while (this.currentToken.type === 'MULTIPLY' || this.currentToken.type === 'DIVIDE') {
      const operator = this.currentToken.type;
      this.eat(operator);
      node = {
        type: 'binary_op',
        operator: operator.toLowerCase(),
        left: node,
        right: this.parseFactor()
      };
    }
    return node;
  }

  parseFactor() {
    const token = this.currentToken;
    if (token.type === 'NUMBER') {
      this.eat('NUMBER');
      return { type: 'number', value: token.value };
    } else if (token.type === 'IDENTIFIER' || token.type === 'POSITION') {
      const name = token.value;
      this.eat(token.type);
      if (this.currentToken.type === 'DOT') {
        this.eat('DOT');
        const prop = this.currentToken.value;
        this.eat('IDENTIFIER');
        return { type: 'param_ref', name, property: prop };
      }
      return { type: 'identifier', name };
    } else if (token.type === 'MINUS') {
      this.eat('MINUS');
      return { type: 'unary_op', operator: 'minus', operand: this.parseFactor() };
    } else if (token.type === 'LBRACKET') {
      return this.parseArray();
    } else if (token.type === 'QUOTE') {
      return this.parseStringLiteral();
    }
    this.error(`Unexpected token in factor: ${token.type}`);
  }

  parseStringLiteral() {
    let result = '';
    let t = this.lexer.getNextToken();
    while (t.type !== 'QUOTE' && t.type !== 'EOF') {
      result += t.value + ' ';
      t = this.lexer.getNextToken();
    }
    this.eat('QUOTE');
    return { type: 'string', value: result.trim() };
  }

  parseArray() {
    this.eat('LBRACKET');
    const elements = [];
    while (this.currentToken.type !== 'RBRACKET') {
      elements.push(this.parseExpression());
      if (this.currentToken.type === 'COMMA') {
        this.eat('COMMA');
      }
    }
    this.eat('RBRACKET');
    return { type: 'array', elements };
  }

  parseParam() {
    this.eat('PARAM');
    const name = this.currentToken.value;
    this.eat('IDENTIFIER');
    const value = this.parseExpression();
    return { type: 'param', name, value };
  }

  parseShape() {
    this.eat('SHAPE');
    const shapeType = this.currentToken.value;
    this.eat('IDENTIFIER');
    let shapeName = null;
    if (this.currentToken.type === 'IDENTIFIER') {
      shapeName = this.currentToken.value;
      this.eat('IDENTIFIER');
    }
    this.eat('LBRACE');
    const params = {};
    while (this.currentToken.type !== 'RBRACE') {
      const paramName = this.currentToken.value;
      if (this.currentToken.type !== 'IDENTIFIER' && this.currentToken.type !== 'POSITION') {
        this.error(`Expected property name, got ${this.currentToken.type}`);
      }
      this.eat(this.currentToken.type);
      this.eat('COLON');
      params[paramName] = this.parseExpression();
    }
    this.eat('RBRACE');
    return { type: 'shape', shapeType, name: shapeName, params };
  }

  parseLayer() {
    this.eat('LAYER');
    const name = this.currentToken.value;
    this.eat('IDENTIFIER');
    this.eat('LBRACE');
    const commands = [];
    while (this.currentToken.type !== 'RBRACE') {
      if (this.currentToken.type === 'ADD') {
        this.eat('ADD');
        commands.push({ type: 'add', shape: this.currentToken.value });
        this.eat('IDENTIFIER');
      } else if (this.currentToken.type === 'SUBTRACT') {
        this.eat('SUBTRACT');
        commands.push({ type: 'subtract', shape: this.currentToken.value });
        this.eat('IDENTIFIER');
      } else if (this.currentToken.type === 'ROTATE') {
        this.eat('ROTATE');
        commands.push({ type: 'rotate', angle: this.parseExpression() });
      } else {
        this.error(`Unknown layer command: ${this.currentToken.type}`);
      }
    }
    this.eat('RBRACE');
    return { type: 'layer', name, commands };
  }

  parseTransform() {
    this.eat('TRANSFORM');
    const target = this.currentToken.value;
    this.eat('IDENTIFIER');
    this.eat('LBRACE');
    const operations = [];
    while (this.currentToken.type !== 'RBRACE') {
      if (this.currentToken.type === 'SCALE') {
        this.eat('SCALE');
        this.eat('COLON');
        operations.push({ type: 'scale', value: this.parseExpression() });
      } else if (this.currentToken.type === 'ROTATE') {
        this.eat('ROTATE');
        this.eat('COLON');
        operations.push({ type: 'rotate', angle: this.parseExpression() });
      } else if (this.currentToken.type === 'POSITION') {
        this.eat('POSITION');
        this.eat('COLON');
        operations.push({ type: 'translate', value: this.parseExpression() });
      } else {
        this.error(`Unknown transform command: ${this.currentToken.type}`);
      }
    }
    this.eat('RBRACE');
    return { type: 'transform', target, operations };
  }

  parse() {
    const statements = [];
    while (this.currentToken.type !== 'EOF') {
      switch (this.currentToken.type) {
        case 'PARAM':
          statements.push(this.parseParam());
          break;
        case 'SHAPE':
          statements.push(this.parseShape());
          break;
        case 'LAYER':
          statements.push(this.parseLayer());
          break;
        case 'TRANSFORM':
          statements.push(this.parseTransform());
          break;
        default:
          this.error(`Unexpected token: ${this.currentToken.type}`);
      }
    }
    return statements;
  }
}

