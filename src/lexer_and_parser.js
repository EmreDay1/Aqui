// src/parser/lexer.js
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

    advance() {
        this.position++;
        if (this.position > this.input.length - 1) {
            this.currentChar = null;
        } else {
            this.currentChar = this.input[this.position];
            this.column++;
        }
    }

    skipWhitespace() {
        while (this.currentChar && /\s/.test(this.currentChar)) {
            if (this.currentChar === '\n') {
                this.line++;
                this.column = 0;
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
        while (this.currentChar && /[a-zA-Z0-9_]/.test(this.currentChar)) {
            result += this.currentChar;
            this.advance();
        }
        
        const keywords = {
            'param': 'PARAM',
            'constraint': 'CONSTRAINT',
            'shape': 'SHAPE',
            'rotate': 'ROTATE',
            'translate': 'TRANSLATE',
            'scale': 'SCALE'
        };

        const type = keywords[result] || 'IDENTIFIER';
        return new Token(type, result, this.line, this.column);
    }

    getNextToken() {
        while (this.currentChar) {
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
                case '+':
                    this.advance();
                    return new Token('PLUS', '+', this.line, this.column);
                case '-':
                    this.advance();
                    return new Token('MINUS', '-', this.line, this.column);
                case '*':
                    this.advance();
                    return new Token('MULTIPLY', '*', this.line, this.column);
                case '/':
                    this.advance();
                    return new Token('DIVIDE', '/', this.line, this.column);
                case ':':
                    this.advance();
                    return new Token('COLON', ':', this.line, this.column);
            }

            throw new Error(`Invalid character: ${this.currentChar}`);
        }

        return new Token('EOF', null, this.line, this.column);
    }
}


class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.currentToken = this.lexer.getNextToken();
    }

    eat(tokenType) {
        if (this.currentToken.type === tokenType) {
            this.currentToken = this.lexer.getNextToken();
        } else {
            throw new Error(`Expected ${tokenType} but got ${this.currentToken.type}`);
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

    parseShape() {
        this.eat('SHAPE');
        const name = this.currentToken.value;
        this.eat('IDENTIFIER');
        const params = {};
        
        this.eat('LBRACE');
        while (this.currentToken.type !== 'RBRACE') {
            const paramName = this.currentToken.value;
            this.eat('IDENTIFIER');
            this.eat('COLON');
            params[paramName] = this.parseExpression();
        }
        this.eat('RBRACE');

        return {
            type: 'shape',
            name,
            params
        };
    }

    parseExpression() {
        let node = this.parseTerm();

        while (this.currentToken.type === 'PLUS' || this.currentToken.type === 'MINUS') {
            const token = this.currentToken;
            if (token.type === 'PLUS') {
                this.eat('PLUS');
                node = {
                    type: 'operation',
                    operator: '+',
                    left: node,
                    right: this.parseTerm()
                };
            } else if (token.type === 'MINUS') {
                this.eat('MINUS');
                node = {
                    type: 'operation',
                    operator: '-',
                    left: node,
                    right: this.parseTerm()
                };
            }
        }

        return node;
    }

    parseTerm() {
        let node = this.parseFactor();

        while (this.currentToken.type === 'MULTIPLY' || this.currentToken.type === 'DIVIDE') {
            const token = this.currentToken;
            if (token.type === 'MULTIPLY') {
                this.eat('MULTIPLY');
                node = {
                    type: 'operation',
                    operator: '*',
                    left: node,
                    right: this.parseFactor()
                };
            } else if (token.type === 'DIVIDE') {
                this.eat('DIVIDE');
                node = {
                    type: 'operation',
                    operator: '/',
                    left: node,
                    right: this.parseFactor()
                };
            }
        }

        return node;
    }

    parseFactor() {
        const token = this.currentToken;
        if (token.type === 'NUMBER') {
            this.eat('NUMBER');
            return {
                type: 'number',
                value: token.value
            };
        } else if (token.type === 'IDENTIFIER') {
            this.eat('IDENTIFIER');
            return {
                type: 'variable',
                name: token.value
            };
        } else if (token.type === 'LPAREN') {
            this.eat('LPAREN');
            const node = this.parseExpression();
            this.eat('RPAREN');
            return node;
        }
        throw new Error(`Unexpected token: ${token.type}`);
    }

    parse() {
        const statements = [];
        while (this.currentToken.type !== 'EOF') {
            if (this.currentToken.type === 'PARAM') {
                statements.push(this.parseParam());
            } else if (this.currentToken.type === 'SHAPE') {
                statements.push(this.parseShape());
            }
            // Add more statement types as needed
        }
        return statements;
    }
}

export { Lexer, Parser };
