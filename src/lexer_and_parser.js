class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }

    toString() {
        return `Token(${this.type}, ${this.value}) at line ${this.line}, column ${this.column}`;
    }
}

// Lexer class definition
class Lexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.current_char = this.input.length > 0 ? this.input[0] : null;
        this.indentStack = [0];
    }

    error(message) {
        throw new Error(`Lexical error at line ${this.line}, column ${this.column}: ${message}`);
    }

    advance() {
        this.pos++;
        if (this.pos > this.input.length - 1) {
            this.current_char = null;
        } else {
            this.current_char = this.input[this.pos];
            this.column++;
        }
    }

    peek() {
        const peekPos = this.pos + 1;
        if (peekPos > this.input.length - 1) {
            return null;
        }
        return this.input[peekPos];
    }

    skipWhitespace() {
        while (this.current_char && /[ \t]/.test(this.current_char)) {
            this.advance();
        }
    }

    skipComment() {
        while (this.current_char && this.current_char !== '\n') {
            this.advance();
        }
    }

    handleNewLine() {
        this.advance();
        this.line++;
        this.column = 1;
        // Skip empty lines
        while (this.current_char === '\n') {
            this.advance();
            this.line++;
        }
        return new Token('NEWLINE', '\n', this.line - 1, this.column);
    }

    handleIndentation() {
        let spaces = 0;
        const startColumn = this.column;

        while (this.current_char === ' ' || this.current_char === '\t') {
            spaces += this.current_char === ' ' ? 1 : 4; // Tab counts as 4 spaces
            this.advance();
        }

        // Skip empty lines or comment lines
        if (this.current_char === '\n' || this.current_char === '#' || 
            (this.current_char === '/' && this.peek() === '/')) {
            return null;
        }

        const currentIndent = this.indentStack[this.indentStack.length - 1];

        if (spaces > currentIndent) {
            this.indentStack.push(spaces);
            return new Token('INDENT', spaces, this.line, startColumn);
        } else if (spaces < currentIndent) {
            while (spaces < this.indentStack[this.indentStack.length - 1]) {
                this.indentStack.pop();
                if (spaces > this.indentStack[this.indentStack.length - 1]) {
                    this.error('Invalid dedent');
                }
            }
            return new Token('DEDENT', spaces, this.line, startColumn);
        }
        return null;
    }

    identifier() {
        let result = '';
        const start_column = this.column;

        while (this.current_char && /[a-zA-Z0-9_]/.test(this.current_char)) {
            result += this.current_char;
            this.advance();
        }

        const keywords = {
            // Shape types
            'rectangle': 'SHAPE_TYPE',
            'circle': 'SHAPE_TYPE',
            'triangle': 'SHAPE_TYPE',
            'ellipse': 'SHAPE_TYPE',
            'text': 'SHAPE_TYPE',
            'path': 'SHAPE_TYPE',
            'gear': 'SHAPE_TYPE',
            'star': 'SHAPE_TYPE',
            'cross': 'SHAPE_TYPE',
            'slot': 'SHAPE_TYPE',
            'arc': 'SHAPE_TYPE',
            'spiral': 'SHAPE_TYPE',
            'wave': 'SHAPE_TYPE',
            'donut': 'SHAPE_TYPE',

            // Structure keywords
            'layer': 'LAYER',
            'transform': 'TRANSFORM',
            'add': 'ADD',
            'subtract': 'SUBTRACT',

            // Common properties
            'position': 'PROPERTY',
            'rotation': 'PROPERTY',
            'scale': 'PROPERTY',
            'scaleX': 'PROPERTY',
            'scaleY': 'PROPERTY',

            // Shape-specific properties
            'width': 'PROPERTY',
            'height': 'PROPERTY',
            'radius': 'PROPERTY',
            'base': 'PROPERTY',
            'content': 'PROPERTY',
            'fontSize': 'PROPERTY',
            'fontFamily': 'PROPERTY',
            'points': 'PROPERTY',
            'startAngle': 'PROPERTY',
            'endAngle': 'PROPERTY',
            'thickness': 'PROPERTY',
            'diameter': 'PROPERTY',
            'teeth': 'PROPERTY',
            'outerRadius': 'PROPERTY',
            'innerRadius': 'PROPERTY',
            'radiusX': 'PROPERTY',
            'radiusY': 'PROPERTY',
            'startRadius': 'PROPERTY',
            'endRadius': 'PROPERTY',
            'turns': 'PROPERTY',
            'amplitude': 'PROPERTY',
            'frequency': 'PROPERTY',
            'length': 'PROPERTY'
        };

        const tokenType = keywords[result] || 'IDENTIFIER';
        return new Token(tokenType, result, this.line, start_column);
    }

    number() {
        let result = '';
        const start_column = this.column;

        if (this.current_char === '-') {
            result += this.current_char;
            this.advance();
        }

        while (this.current_char && /\d/.test(this.current_char)) {
            result += this.current_char;
            this.advance();
        }

        if (this.current_char === '.') {
            result += this.current_char;
            this.advance();

            while (this.current_char && /\d/.test(this.current_char)) {
                result += this.current_char;
                this.advance();
            }
        }

        return new Token('NUMBER', parseFloat(result), this.line, start_column);
    }

    string() {
        let result = '';
        const start_column = this.column;
        this.advance(); // Skip opening quote

        while (this.current_char && this.current_char !== '"') {
            if (this.current_char === '\\') {
                this.advance();
                switch (this.current_char) {
                    case 'n': result += '\n'; break;
                    case 't': result += '\t'; break;
                    case 'r': result += '\r'; break;
                    case '"': result += '"'; break;
                    case '\\': result += '\\'; break;
                    default:
                        this.error(`Invalid escape sequence \\${this.current_char}`);
                }
            } else {
                result += this.current_char;
            }
            this.advance();
        }

        if (!this.current_char) {
            this.error('Unterminated string');
        }

        this.advance(); // Skip closing quote
        return new Token('STRING', result, this.line, start_column);
    }

    getNextToken() {
        while (this.current_char !== null) {
            // Handle indentation at line start
            if (this.column === 1) {
                const indentToken = this.handleIndentation();
                if (indentToken) return indentToken;
            }

            // Handle whitespace
            if (/[ \t]/.test(this.current_char)) {
                this.skipWhitespace();
                continue;
            }

            // Handle comments
            if (this.current_char === '#' || 
               (this.current_char === '/' && this.peek() === '/')) {
                this.skipComment();
                continue;
            }

            // Handle newlines
            if (this.current_char === '\n') {
                return this.handleNewLine();
            }

            // Handle strings
            if (this.current_char === '"') {
                return this.string();
            }

            // Handle numbers
            if (/\d/.test(this.current_char) || 
               (this.current_char === '-' && /\d/.test(this.peek()))) {
                return this.number();
            }

            // Handle identifiers and keywords
            if (/[a-zA-Z_]/.test(this.current_char)) {
                return this.identifier();
            }

            // Handle special characters
            const specialChars = {
                ':': 'COLON',
                '[': 'LBRACKET',
                ']': 'RBRACKET',
                '{': 'LBRACE',
                '}': 'RBRACE',
                '(': 'LPAREN',
                ')': 'RPAREN',
                ',': 'COMMA',
                '+': 'PLUS',
                '-': 'MINUS',
                '*': 'MULTIPLY',
                '/': 'DIVIDE',
                '.': 'DOT'
            };

            if (specialChars[this.current_char]) {
                const token = new Token(
                    specialChars[this.current_char],
                    this.current_char,
                    this.line,
                    this.column
                );
                this.advance();
                return token;
            }

            this.error(`Unexpected character: ${this.current_char}`);
        }

        // Handle remaining dedents at end of file
        if (this.indentStack.length > 1) {
            this.indentStack.pop();
            return new Token('DEDENT', null, this.line, this.column);
        }

        return new Token('EOF', null, this.line, this.column);
    }

    tokenize() {
        const tokens = [];
        let token = this.getNextToken();
        
        while (token.type !== 'EOF') {
            tokens.push(token);
            token = this.getNextToken();
        }
        
        tokens.push(token); // Add EOF token
        return tokens;
    }
}
class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.tokens = lexer.tokenize();
        this.current = 0;
    }

    error(message) {
        const token = this.currentToken();
        throw new Error(`Parser error at line ${token.line}, column ${token.column}: ${message}`);
    }

    currentToken() {
        return this.tokens[this.current];
    }

    peek() {
        return this.tokens[this.current + 1] || null;
    }

    eat(expectedType) {
        const token = this.currentToken();
        if (token.type === expectedType) {
            this.current++;
            return token;
        }
        this.error(`Expected ${expectedType} but got ${token.type}`);
    }

    parse() {
        const statements = [];
        
        while (this.current < this.tokens.length && this.currentToken().type !== 'EOF') {
            // Skip standalone newlines between declarations
            while (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
            
            if (this.currentToken().type === 'EOF') {
                break;
            }

            const statement = this.parseStatement();
            if (statement) {
                statements.push(statement);
            }
        }
        
        return statements;
    }

    parseStatement() {
        const token = this.currentToken();
        
        switch (token.type) {
            case 'SHAPE_TYPE':
                return this.parseShapeDeclaration();
            case 'LAYER':
                return this.parseLayer();
            case 'TRANSFORM':
                return this.parseTransform();
            default:
                this.error(`Unexpected token: ${token.type}`);
        }
    }

    parseShapeDeclaration() {
        const shapeType = this.eat('SHAPE_TYPE').value;
        const name = this.eat('IDENTIFIER').value;
        this.eat('NEWLINE');
        this.eat('INDENT');

        const params = {};
        while (this.currentToken().type !== 'DEDENT' && this.currentToken().type !== 'EOF') {
            const { property, value } = this.parseProperty();
            params[property] = value;
            
            if (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
        }

        this.eat('DEDENT');
        return {
            type: 'shape',
            shapeType,
            name,
            params
        };
    }

    parseProperty() {
        const property = this.eat('PROPERTY').value;
        this.eat('COLON');
        const value = this.parseExpression();
        return { property, value };
    }

    parseExpression() {
        const token = this.currentToken();

        switch (token.type) {
            case 'NUMBER':
                return {
                    type: 'number',
                    value: this.eat('NUMBER').value
                };

            case 'STRING':
                return {
                    type: 'string',
                    value: this.eat('STRING').value
                };

            case 'IDENTIFIER':
                return {
                    type: 'identifier',
                    value: this.eat('IDENTIFIER').value
                };

            case 'LBRACKET':
                return this.parseArray();

            case 'MINUS':
                this.eat('MINUS');
                const value = this.parseExpression();
                return {
                    type: 'unary',
                    operator: 'minus',
                    value
                };

            default:
                this.error(`Unexpected token in expression: ${token.type}`);
        }
    }

    parseArray() {
        this.eat('LBRACKET');
        const elements = [];

        while (this.currentToken().type !== 'RBRACKET') {
            elements.push(this.parseExpression());
            
            if (this.currentToken().type === 'COMMA') {
                this.eat('COMMA');
            }
        }

        this.eat('RBRACKET');
        return {
            type: 'array',
            elements
        };
    }

    parseLayer() {
        this.eat('LAYER');
        const name = this.eat('IDENTIFIER').value;
        this.eat('NEWLINE');
        this.eat('INDENT');

        const commands = [];
        while (this.currentToken().type !== 'DEDENT' && this.currentToken().type !== 'EOF') {
            commands.push(this.parseLayerCommand());
            
            if (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
        }

        this.eat('DEDENT');
        return {
            type: 'layer',
            name,
            commands
        };
    }

    parseLayerCommand() {
        const token = this.currentToken();

        switch (token.type) {
            case 'ADD':
            case 'SUBTRACT': {
                const type = token.type.toLowerCase();
                this.eat(token.type);
                this.eat('COLON');
                const shape = this.eat('IDENTIFIER').value;
                return { type, shape };
            }

            case 'PROPERTY': {
                const { property, value } = this.parseProperty();
                return {
                    type: property,
                    value
                };
            }

            default:
                this.error(`Unexpected layer command: ${token.type}`);
        }
    }

    parseTransform() {
        this.eat('TRANSFORM');
        const target = this.eat('IDENTIFIER').value;
        this.eat('NEWLINE');
        this.eat('INDENT');

        const operations = [];
        while (this.currentToken().type !== 'DEDENT' && this.currentToken().type !== 'EOF') {
            operations.push(this.parseTransformOperation());
            
            if (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
        }

        this.eat('DEDENT');
        return {
            type: 'transform',
            target,
            operations
        };
    }

    parseTransformOperation() {
        const property = this.eat('PROPERTY').value;
        this.eat('COLON');
        const value = this.parseExpression();
        return { type: property, value };
    }
}

export { Lexer, Parser };
