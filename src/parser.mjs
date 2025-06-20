// parser.mjs with draw command support
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

  // New method to parse draw statements
  parseDrawStatement() {
    this.eat('DRAW');
    const name = this.currentToken.value;
    this.eat('IDENTIFIER');
    
    this.eat('LBRACE');
    const commands = [];
    
    while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
      commands.push(this.parseDrawCommand());
    }
    
    this.eat('RBRACE');
    
    return {
      type: 'draw',
      name,
      commands
    };
  }
  
  // Method to parse individual draw commands
  parseDrawCommand() {
    const token = this.currentToken;
    
    switch (token.type) {
      case 'FORWARD':
        this.eat('FORWARD');
        return {
          type: 'draw_command',
          command: 'forward',
          value: this.parseExpression()
        };
        
      case 'BACKWARD':
        this.eat('BACKWARD');
        return {
          type: 'draw_command',
          command: 'backward',
          value: this.parseExpression()
        };
        
      case 'RIGHT':
        this.eat('RIGHT');
        return {
          type: 'draw_command',
          command: 'right',
          value: this.parseExpression()
        };
        
      case 'LEFT':
        this.eat('LEFT');
        return {
          type: 'draw_command',
          command: 'left',
          value: this.parseExpression()
        };
        
      case 'GOTO':
        this.eat('GOTO');
        return {
          type: 'draw_command',
          command: 'goto',
          value: this.parseExpression()
        };
        
      case 'PENUP':
        this.eat('PENUP');
        return {
          type: 'draw_command',
          command: 'penup'
        };
        
      case 'PENDOWN':
        this.eat('PENDOWN');
        return {
          type: 'draw_command',
          command: 'pendown'
        };
        
      default:
        this.error(`Unknown draw command: ${token.type}`);
    }
  }

  // Parse conditional expressions
  parseCondition() {
    let expr = this.parseLogicalOr();
    return expr;
  }

  // Parse logical OR operations
  parseLogicalOr() {
    let expr = this.parseLogicalAnd();

    while (this.currentToken.type === 'OR') {
      const operator = this.currentToken.type;
      this.eat('OR');
      expr = {
        type: 'logical_op',
        operator: 'or',
        left: expr,
        right: this.parseLogicalAnd()
      };
    }
    return expr;
  }

  // Parse logical AND operations
  parseLogicalAnd() {
    let expr = this.parseComparison();

    while (this.currentToken.type === 'AND') {
      const operator = this.currentToken.type;
      this.eat('AND');
      expr = {
        type: 'logical_op',
        operator: 'and',
        left: expr,
        right: this.parseComparison()
      };
    }
    return expr;
  }

  // Parse comparison operations
  parseComparison() {
    let expr = this.parseExpression();

    if (['EQUALS', 'NOT_EQUALS', 'LESS', 'LESS_EQUALS', 'GREATER', 'GREATER_EQUALS'].includes(this.currentToken.type)) {
      const operator = this.currentToken.type.toLowerCase();
      this.eat(this.currentToken.type);
      expr = {
        type: 'comparison',
        operator,
        left: expr,
        right: this.parseExpression()
      };
    }
    return expr;
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
    } 
    
    if (token.type === 'TRUE' || token.type === 'FALSE') {
      this.eat(token.type);
      return { type: 'boolean', value: token.type === 'TRUE' };
    }
    
    if (token.type === 'NOT') {
      this.eat('NOT');
      return {
        type: 'unary_op',
        operator: 'not',
        operand: this.parseFactor()
      };
    }
    
    if (token.type === 'IDENTIFIER' || token.type === 'POSITION') {
      const name = token.value;
      this.eat(token.type);
      
      // Check if this is a function call
      if (this.currentToken.type === 'LPAREN') {
        return this.parseFunctionCall(name);
      }
      
      if (this.currentToken.type === 'DOT') {
        this.eat('DOT');
        const prop = this.currentToken.value;
        this.eat('IDENTIFIER');
        return { type: 'param_ref', name, property: prop };
      }
      return { type: 'identifier', name };
    }
    
    if (token.type === 'MINUS') {
      this.eat('MINUS');
      return { type: 'unary_op', operator: 'minus', operand: this.parseFactor() };
    }
    
    if (token.type === 'LBRACKET') {
      return this.parseArray();
    }
    
    if (token.type === 'QUOTE') {
      return this.parseStringLiteral();
    }
    
    if (token.type === 'LPAREN') {
      this.eat('LPAREN');
      const expr = this.parseCondition();
      this.eat('RPAREN');
      return expr;
    }
    
    this.error(`Unexpected token in factor: ${token.type}`);
  }

  // New method for parsing function definitions
  parseFunctionDefinition() {
    this.eat('DEF');
    const functionName = this.currentToken.value;
    this.eat('IDENTIFIER');
    
    // Parse parameters
    this.eat('LPAREN');
    const parameters = [];
    if (this.currentToken.type !== 'RPAREN') {
      parameters.push(this.currentToken.value);
      this.eat('IDENTIFIER');
      
      while (this.currentToken.type === 'COMMA') {
        this.eat('COMMA');
        parameters.push(this.currentToken.value);
        this.eat('IDENTIFIER');
      }
    }
    this.eat('RPAREN');
    
    // Parse function body
    this.eat('LBRACE');
    const body = [];
    while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
      if (this.currentToken.type === 'RETURN') {
        this.eat('RETURN');
        const returnValue = this.parseExpression();
        body.push({ type: 'return', value: returnValue });
      } else {
        body.push(this.parseStatement());
      }
    }
    this.eat('RBRACE');
    
    return {
      type: 'function_definition',
      name: functionName,
      parameters,
      body
    };
  }

  // New method for parsing function calls
  parseFunctionCall(functionName) {
    this.eat('LPAREN');
    const args = [];
    
    if (this.currentToken.type !== 'RPAREN') {
      args.push(this.parseExpression());
      
      while (this.currentToken.type === 'COMMA') {
        this.eat('COMMA');
        args.push(this.parseExpression());
      }
    }
    
    this.eat('RPAREN');
    
    return {
      type: 'function_call',
      name: functionName,
      arguments: args
    };
  }

  // Parse if statements
  parseIfStatement() {
    this.eat('IF');
    const condition = this.parseCondition();
    this.eat('LBRACE');
    
    const thenBranch = [];
    while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
      thenBranch.push(this.parseStatement());
    }
    this.eat('RBRACE');  // Make sure we consume the closing brace
    
    let elseBranch = [];
    if (this.currentToken.type === 'ELSE') {
      this.eat('ELSE');
      this.eat('LBRACE');
      while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
        elseBranch.push(this.parseStatement());
      }
      this.eat('RBRACE');
    }
    
    return {
      type: 'if_statement',
      condition,
      thenBranch,
      elseBranch
    };
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
      
      // If it's not the last element, expect a comma
      if (this.currentToken.type !== 'RBRACKET') {
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
      if (this.currentToken.type === 'IF') {
        commands.push(this.parseIfStatement());
      } else if (this.currentToken.type === 'ADD') {
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

  parseBooleanOperation() {
    // Store the operation type (union/difference/intersection)
    const operation = this.currentToken.type.toLowerCase();
    this.eat(this.currentToken.type);

    // Get the name for the resulting shape
    const name = this.currentToken.value;
    this.eat('IDENTIFIER');

    // Parse the block
    this.eat('LBRACE');
    const shapes = [];

    // Parse each "add shape" command
    while (this.currentToken.type !== 'RBRACE') {
        if (this.currentToken.type === 'ADD') {
            this.eat('ADD');
            const shapeName = this.currentToken.value;
            this.eat('IDENTIFIER');
            shapes.push(shapeName);
        } else {
            this.error('Expected ADD command in boolean operation block');
        }
    }

    this.eat('RBRACE');

    // Validate we have at least 2 shapes
    if (shapes.length < 2) {
        this.error('Boolean operation requires at least two shapes');
    }

    return {
        type: 'boolean_operation',
        operation: operation,
        name: name,
        shapes: shapes
    };
  }


  parseTransform() {
    this.eat('TRANSFORM');
    const target = this.currentToken.value;
    this.eat('IDENTIFIER');
    this.eat('LBRACE');
    const operations = [];
    while (this.currentToken.type !== 'RBRACE') {
      if (this.currentToken.type === 'IF') {
        operations.push(this.parseIfStatement());
      } else if (this.currentToken.type === 'SCALE') {
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

  parseStatement() {
    let statement;
    switch (this.currentToken.type) {
      case 'IF':
        statement = this.parseIfStatement();
        break;
      case 'PARAM':
        statement = this.parseParam();
        break;
      case 'SHAPE':
        statement = this.parseShape();
        break;
      case 'LAYER':
        statement = this.parseLayer();
        break;
      case 'TRANSFORM':
        statement = this.parseTransform();
        break;
      case 'FOR':
        statement = this.parseForLoop();
        break;
      case 'ADD':
        this.eat('ADD');
        statement = { 
          type: 'add', 
          shape: this.currentToken.value 
        };
        this.eat('IDENTIFIER');
        break;
      case 'ROTATE':
        this.eat('ROTATE');
        this.eat('COLON');
        statement = {
          type: 'rotate',
          angle: this.parseExpression()
        };
        break;
      case 'UNION':
      case 'DIFFERENCE':
      case 'INTERSECTION':
        statement = this.parseBooleanOperation();
        break;
      case 'DEF':
        statement = this.parseFunctionDefinition();
        break;
      case 'DRAW':
        statement = this.parseDrawStatement();
        break;
      case 'IDENTIFIER':
        // Check if this is a function call
        const name = this.currentToken.value;
        this.eat('IDENTIFIER');
        if (this.currentToken.type === 'LPAREN') {
          statement = this.parseFunctionCall(name);
        } else {
          this.error(`Unexpected identifier: ${name}`);
        }
        break;
      default:
        this.error(`Unexpected token: ${this.currentToken.type}`);
    }
    return statement;
  }

  parseForLoop() {
    this.eat('FOR');
    const iterator = this.currentToken.value;
    this.eat('IDENTIFIER');
    this.eat('FROM');
    const start = this.parseExpression();
    this.eat('TO');
    const end = this.parseExpression();
    
    let step = { type: 'number', value: 1 };  // Default step
    if (this.currentToken.type === 'STEP') {
      this.eat('STEP');
      step = this.parseExpression();
    }
    
    this.eat('LBRACE');
    const body = [];
    while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
      body.push(this.parseStatement());
    }
    this.eat('RBRACE');
    
    return {
      type: 'for_loop',
      iterator,
      start,
      end,
      step,
      body
    };
  }

  parseUnion() {
    this.eat('UNION');
    const name = this.currentToken.value;
    this.eat('IDENTIFIER');
    
    this.eat('LBRACE');
    const shapes = [];
    
    while (this.currentToken.type !== 'RBRACE') {
      if (this.currentToken.type === 'ADD') {
        this.eat('ADD');
        shapes.push(this.currentToken.value);
        this.eat('IDENTIFIER');
      } else {
        this.error('Expected ADD command in union block');
      }
    }
    
    this.eat('RBRACE');
    
    return {
      type: 'union',
      name,
      shapes
    };
  }

  parse() {
    const statements = [];
    while (this.currentToken.type !== 'EOF') {
      statements.push(this.parseStatement());
    }
    return statements;
  }
}