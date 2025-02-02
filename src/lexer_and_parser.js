class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}

class Lexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.currentChar = this.input[0];
    }

    error(message) {
        throw new Error(`Lexer error at line ${this.line}, column ${this.column}: ${message}`);
    }

    advance() {
        this.position++;
        if (this.position > this.input.length - 1) {
            this.currentChar = null;
        } else {
            this.currentChar = this.input[this.position];
            this.column++;
        }
    }

    skipComment() {
        // Skip //
        this.advance();
        this.advance();
        
        // Skip until end of line
        while (this.currentChar !== null && this.currentChar !== '\n') {
            this.advance();
        }
        if (this.currentChar === '\n') {
            this.line++;
            this.column = 1;
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
            result += this.currentChar;
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
            // Handle comments
            if (this.currentChar === '/' && this.position + 1 < this.input.length && 
                this.input[this.position + 1] === '/') {
                this.skipComment();
                continue;
            }

            // Skip whitespace
            if (/\s/.test(this.currentChar)) {
                this.skipWhitespace();
                continue;
            }

            // Numbers
            if (/\d/.test(this.currentChar)) {
                return this.number();
            }

            // Identifiers and keywords
            if (/[a-zA-Z_]/.test(this.currentChar)) {
                return this.identifier();
            }

            // Operators and special characters
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
            }

            this.error(`Unexpected character: ${this.currentChar}`);
        }

        return new Token('EOF', null, this.line, this.column);
    }
}

// lexer_and_parser.mjs
class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.currentToken = this.lexer.getNextToken();
        
        // Define valid property names
        this.validProperties = new Set([
            'width', 'height', 'radius', 'position',
            'points', 'outerRadius', 'innerRadius',
            'scale', 'rotate'
        ]);
    }

    error(message) {
        throw new Error(`Parser error at line ${this.currentToken.line}, column ${this.currentToken.column}: ${message}`);
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

    parseParam() {
        this.eat('PARAM');
        const name = this.currentToken.value;
        this.eat('IDENTIFIER');
        const value = this.parseExpression();
        return {
            type: 'param',
            name,
            value
        };
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
        if (this.currentToken.type === 'NUMBER') {
            const token = this.currentToken;
            this.eat('NUMBER');
            return {
                type: 'number',
                value: token.value
            };
        } else if (this.currentToken.type === 'IDENTIFIER' || this.currentToken.type === 'POSITION') {
            const name = this.currentToken.value;
            this.eat(this.currentToken.type);
            
            if (this.currentToken.type === 'DOT') {
                this.eat('DOT');
                const property = this.currentToken.value;
                this.eat('IDENTIFIER');
                return {
                    type: 'param_ref',
                    name: name,
                    property: property
                };
            }
            
            return {
                type: 'identifier',
                name: name
            };
        } else if (this.currentToken.type === 'MINUS') {
            this.eat('MINUS');
            return {
                type: 'unary_op',
                operator: 'minus',
                operand: this.parseFactor()
            };
        } else if (this.currentToken.type === 'LBRACKET') {
            return this.parseArray();
        } else if (this.currentToken.type === 'QUOTE') {
            this.eat('QUOTE');
            let result = '';
            
            // Collect all characters until closing quote
            while (this.currentToken.type !== 'QUOTE' && this.currentToken.type !== 'EOF') {
                // Add the current token's value to our string
                result += this.currentToken.value;
                // Move to next token
                this.currentToken = this.lexer.getNextToken();
                
                // Add space if not at the end
                if (this.currentToken.type !== 'QUOTE') {
                    result += ' ';
                }
            }
            
            // Eat the closing quote
            this.eat('QUOTE');
            
            return {
                type: 'string',
                value: result.trim()
            };
        }
        
        this.error(`Unexpected token in factor: ${this.currentToken.type}`);
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
        return {
            type: 'array',
            elements: elements
        };
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
            // Accept both IDENTIFIER and special properties like POSITION
            let paramName;
            if (this.currentToken.type === 'IDENTIFIER' || this.currentToken.type === 'POSITION') {
                paramName = this.currentToken.value;
                this.eat(this.currentToken.type);
            } else {
                this.error(`Expected property name but got ${this.currentToken.type}`);
            }

            this.eat('COLON');
            params[paramName] = this.parseExpression();
        }
        
        this.eat('RBRACE');

        return {
            type: 'shape',
            shapeType,
            name: shapeName,
            params
        };
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
                commands.push({
                    type: 'add',
                    shape: this.currentToken.value
                });
                this.eat('IDENTIFIER');
            } else if (this.currentToken.type === 'SUBTRACT') {
                this.eat('SUBTRACT');
                commands.push({
                    type: 'subtract',
                    shape: this.currentToken.value
                });
                this.eat('IDENTIFIER');
            } else if (this.currentToken.type === 'ROTATE') {
                this.eat('ROTATE');
                commands.push({
                    type: 'rotate',
                    angle: this.parseExpression()
                });
            }
        }
        
        this.eat('RBRACE');

        return {
            type: 'layer',
            name,
            commands
        };
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
                operations.push({
                    type: 'scale',
                    value: this.parseExpression()
                });
            } else if (this.currentToken.type === 'ROTATE') {
                this.eat('ROTATE');
                this.eat('COLON');
                operations.push({
                    type: 'rotate',
                    angle: this.parseExpression()
                });
            }
        }
        
        this.eat('RBRACE');

        return {
            type: 'transform',
            target,
            operations
        };
    }

    parse() {
        const statements = [];
        while (this.currentToken.type !== 'EOF') {
            if (this.currentToken.type === 'PARAM') {
                statements.push(this.parseParam());
            } else if (this.currentToken.type === 'SHAPE') {
                statements.push(this.parseShape());
            } else if (this.currentToken.type === 'LAYER') {
                statements.push(this.parseLayer());
            } else if (this.currentToken.type === 'TRANSFORM') {
                statements.push(this.parseTransform());
            } else {
                this.error(`Unexpected token: ${this.currentToken.type}`);
            }
        }
        return statements;
    }
}

export { Lexer, Parser };
