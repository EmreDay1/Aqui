// logical_lexer_and_parser.mjs
import { Token, Lexer, Parser } from './lexer_and_parser.mjs';

class LogicalLexer extends Lexer {
    constructor(input) {
        super(input);
        this.keywords = {
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

            'for': 'FOR',
            'in': 'IN',
            'range': 'RANGE',
            'to': 'TO',
            'step': 'STEP',

            // Properties
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
            'length': 'PROPERTY',
            'rotation': 'PROPERTY',

            // Logical keywords
            'and': 'AND',
            'or': 'OR',
            'not': 'NOT',
            'true': 'BOOLEAN',
            'false': 'BOOLEAN',
            'if': 'IF',
            'else': 'ELSE'
        };
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
        let tokens = [];
        tokens.push(new Token('NEWLINE', '\n', this.line, this.column));
        this.advance();
        this.line++;
        this.column = 1;

        // Handle multiple consecutive newlines
        while (this.current_char === '\n') {
            this.advance();
            this.line++;
            tokens.push(new Token('NEWLINE', '\n', this.line, this.column));
        }

        // Check for indentation after newline
        const indentTokens = this.handleIndentation();
        if (indentTokens) {
            if (Array.isArray(indentTokens)) {
                tokens = tokens.concat(indentTokens);
            } else {
                tokens.push(indentTokens);
            }
        }

        return tokens;
    }

   // In the LogicalLexer class, update the identifier method
identifier() {
    let result = '';
    const start_column = this.column;

    while (this.current_char && /[a-zA-Z0-9_]/.test(this.current_char)) {
        result += this.current_char;
        this.advance();
    }

    // Handle special characters in identifiers
    if (this.current_char === '_') {
        result += this.current_char;
        this.advance();
        while (this.current_char && /[a-zA-Z0-9_]/.test(this.current_char)) {
            result += this.current_char;
            this.advance();
        }
    }

    const tokenType = this.keywords[result] || 'IDENTIFIER';
    return new Token(tokenType, result, this.line, start_column);
}

    handleIndentation() {
        let spaces = 0;
        const startColumn = this.column;

        // Count the number of spaces at the start of line
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
            const tokens = [];
            while (spaces < this.indentStack[this.indentStack.length - 1]) {
                this.indentStack.pop();
                tokens.push(new Token('DEDENT', null, this.line, startColumn));
                if (spaces > this.indentStack[this.indentStack.length - 1]) {
                    this.error('Invalid dedentation');
                }
            }
            return tokens;
        }
        return null;
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

    getNextToken() {
        while (this.current_char !== null) {
            // Handle whitespace
            if (/[ \t]/.test(this.current_char)) {
                this.skipWhitespace();
                continue;
            }

            // Handle newlines
            if (this.current_char === '\n') {
                return this.handleNewLine();
            }

            // Handle comments
            if (this.current_char === '#' || (this.current_char === '/' && this.peek() === '/')) {
                this.skipComment();
                continue;
            }

            // Handle identifiers and keywords
            if (/[a-zA-Z_]/.test(this.current_char)) {
                return this.identifier();
            }

            // Handle numbers
            if (/\d/.test(this.current_char) || (this.current_char === '-' && /\d/.test(this.peek()))) {
                return this.number();
            }

            // Handle comparison operators
            if (this.current_char === '>' || this.current_char === '<' || 
                this.current_char === '=' || this.current_char === '!') {
                const start_column = this.column;
                const char = this.current_char;
                this.advance();

                if (this.current_char === '=') {
                    const operator = char + '=';
                    this.advance();
                    const tokenTypes = {
                        '>=': 'GREATER_EQUALS',
                        '<=': 'LESS_EQUALS',
                        '==': 'EQUALS',
                        '!=': 'NOT_EQUALS'
                    };
                    return new Token(tokenTypes[operator], operator, this.line, start_column);
                }

                const tokenTypes = {
                    '>': 'GREATER_THAN',
                    '<': 'LESS_THAN',
                    '!': 'NOT'
                };
                return new Token(tokenTypes[char], char, this.line, start_column);
            }

            // Handle special characters
            const specialChars = {
                ':': 'COLON',
                '.': 'DOT',
                ',': 'COMMA',
                '[': 'LBRACKET',
                ']': 'RBRACKET',
                '(': 'LPAREN',
                ')': 'RPAREN'
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

        return new Token('EOF', null, this.line, this.column);
    }

    tokenize() {
        const tokens = [];
        while (this.current_char !== null) {
            if (this.column === 1) {
                // Handle indentation at the start of line
                const indentTokens = this.handleIndentation();
                if (indentTokens) {
                    if (Array.isArray(indentTokens)) {
                        tokens.push(...indentTokens);
                    } else {
                        tokens.push(indentTokens);
                    }
                }
            }

            // Handle whitespace
            if (/[ \t]/.test(this.current_char)) {
                this.skipWhitespace();
                continue;
            }

            // Handle newlines and subsequent indentation
            if (this.current_char === '\n') {
                const newlineTokens = this.handleNewLine();
                tokens.push(...newlineTokens);
                continue;
            }

            // Handle comments
            if (this.current_char === '#' || 
               (this.current_char === '/' && this.peek() === '/')) {
                this.skipComment();
                continue;
            }

            // Handle identifiers and keywords
            if (/[a-zA-Z_]/.test(this.current_char)) {
                tokens.push(this.identifier());
                continue;
            }

            // Handle numbers
            if (/\d/.test(this.current_char) || 
               (this.current_char === '-' && /\d/.test(this.peek()))) {
                tokens.push(this.number());
                continue;
            }

            // Handle comparison operators
            if (this.current_char === '>' || this.current_char === '<' || 
                this.current_char === '=' || this.current_char === '!') {
                const start_column = this.column;
                const char = this.current_char;
                this.advance();

                if (this.current_char === '=') {
                    const operator = char + '=';
                    this.advance();
                    const tokenTypes = {
                        '>=': 'GREATER_EQUALS',
                        '<=': 'LESS_EQUALS',
                        '==': 'EQUALS',
                        '!=': 'NOT_EQUALS'
                    };
                    tokens.push(new Token(tokenTypes[operator], operator, this.line, start_column));
                    continue;
                }

                const tokenTypes = {
                    '>': 'GREATER_THAN',
                    '<': 'LESS_THAN',
                    '!': 'NOT'
                };
                tokens.push(new Token(tokenTypes[char], char, this.line, start_column));
                continue;
            }

            // Handle special characters
            // Inside getNextToken() method in Lexer class
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
                '*': 'MULTIPLY',   // Add this
                '/': 'DIVIDE',     // Add this
                '.': 'DOT'
            };

            if (specialChars[this.current_char]) {
                tokens.push(new Token(
                    specialChars[this.current_char],
                    this.current_char,
                    this.line,
                    this.column
                ));
                this.advance();
                continue;
            }

            this.error(`Unexpected character: ${this.current_char}`);
        }

        // Add any remaining DEDENT tokens at the end of file
        while (this.indentStack.length > 1) {
            this.indentStack.pop();
            tokens.push(new Token('DEDENT', null, this.line, this.column));
        }

        tokens.push(new Token('EOF', null, this.line, this.column));
        return tokens;
    }

}

class LogicalParser extends Parser {
    constructor(lexer) {
        super(lexer);
        this.isInLoop = false;  // Add loop context properties in LogicalParser
        this.currentIterator = null;
    }

    parse() {
        const statements = [];
        
        while (this.current < this.tokens.length && this.currentToken().type !== 'EOF') {
            // Skip any number of newlines between declarations
            while (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
            
            if (this.currentToken().type === 'EOF') {
                break;
            }

            const statement = this.parseStatement();
            if (statement) {
                statements.push(statement);
                // After each statement, consume any trailing newlines
                while (this.current < this.tokens.length && 
                       this.currentToken().type === 'NEWLINE') {
                    this.eat('NEWLINE');
                }
            }
        }
        
        return statements;
    }

    // In LogicalParser class
parseShapeDeclaration() {
    const shapeType = this.eat('SHAPE_TYPE').value;
    const baseName = this.eat('IDENTIFIER').value;
    
    // Fix: Remove the _i from baseName if it exists
    const cleanBaseName = baseName.replace('_i', '');
    // Create shape name using the actual iterator value
    const shapeName = this.isInLoop ? `${cleanBaseName}_${this.currentIterator}` : baseName;

    if (this.currentToken().type === 'NEWLINE') {
        this.eat('NEWLINE');
    }
    
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
        name: shapeName,
        params
    };
}

    parseStatement() {
        const token = this.currentToken();
        
        switch (token.type) {
            case 'IF':
                return this.parseIfStatement();
            case 'FOR':   // Add this case
                return this.parseForLoop();
            case 'SHAPE_TYPE':
                return this.parseShapeDeclaration();
            case 'LAYER':
                return this.parseLayer();
            case 'TRANSFORM':
                return this.parseTransform();
            default:
                this.error(`Unexpected token in statement: ${token.type}`);
        }
    }


    parseIfStatement() {
        this.eat('IF');
        const condition = this.parseLogicalExpression();
        
        this.eat('COLON');
        if (this.currentToken().type === 'NEWLINE') {
            this.eat('NEWLINE');
        }
        this.eat('INDENT');
        
        const body = [];
        while (this.currentToken().type !== 'DEDENT' && 
               this.currentToken().type !== 'EOF') {
            body.push(this.parseStatement());
            if (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
        }
        
        this.eat('DEDENT');

        let elseBody = null;
        if (this.currentToken().type === 'ELSE') {
            this.eat('ELSE');
            this.eat('COLON');
            if (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
            this.eat('INDENT');
            
            elseBody = [];
            while (this.currentToken().type !== 'DEDENT' && 
                   this.currentToken().type !== 'EOF') {
                elseBody.push(this.parseStatement());
                if (this.currentToken().type === 'NEWLINE') {
                    this.eat('NEWLINE');
                }
            }
            
            this.eat('DEDENT');
        }

        return {
            type: 'if_statement',
            condition,
            body,
            elseBody
        };
    }

    parseLogicalExpression() {
        let left = this.parseComparisonExpression();

        while (this.currentToken().type === 'AND' || 
               this.currentToken().type === 'OR') {
            const operator = this.currentToken().type;
            this.eat(operator);
            const right = this.parseComparisonExpression();
            
            left = {
                type: 'logical_op',
                operator: operator.toLowerCase(),
                left,
                right
            };
        }

        return left;
    }

    parseComparisonExpression() {
        let left = this.parseBasicExpression();

        const comparisonOps = {
            'EQUALS': '==',
            'NOT_EQUALS': '!=',
            'GREATER_THAN': '>',
            'LESS_THAN': '<',
            'GREATER_EQUALS': '>=',
            'LESS_EQUALS': '<='
        };

        if (comparisonOps[this.currentToken().type]) {
            const operator = comparisonOps[this.currentToken().type];
            this.eat(this.currentToken().type);
            const right = this.parseBasicExpression();
            
            return {
                type: 'comparison_op',
                operator,
                left,
                right
            };
        }

        return left;
    }

    parseForLoop() {
        this.eat('FOR');
        const iterator = this.eat('IDENTIFIER').value;
        this.eat('IN');
        
        let range;
        if (this.currentToken().type === 'RANGE') {
            this.eat('RANGE');
            this.eat('LPAREN');
            const start = this.parseExpression();
            this.eat('COMMA');
            const end = this.parseExpression();
            this.eat('RPAREN');
            range = { type: 'range', start, end };
        } else {
            range = this.parseExpression();
        }
    
        this.eat('COLON');
        if (this.currentToken().type === 'NEWLINE') {
            this.eat('NEWLINE');
        }
        this.eat('INDENT');
        
        // Set loop context
        const oldInLoop = this.isInLoop;
        const oldIterator = this.currentIterator;
        this.isInLoop = true;
        this.currentIterator = iterator;
        
        const body = [];
        while (this.currentToken().type !== 'DEDENT' && 
               this.currentToken().type !== 'EOF') {
            body.push(this.parseStatement());
            if (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
        }
        
        // Restore previous context
        this.isInLoop = oldInLoop;
        this.currentIterator = oldIterator;
        
        this.eat('DEDENT');
    
        return {
            type: 'for_loop',
            iterator,
            range,
            body
        };
    }
    


    parseBasicExpression() {
        const token = this.currentToken();

        switch (token.type) {
            case 'NUMBER':
                this.eat('NUMBER');
                return {
                    type: 'number',
                    value: token.value
                };

            case 'STRING':
                this.eat('STRING');
                return {
                    type: 'string',
                    value: token.value
                };

            case 'BOOLEAN':
                this.eat('BOOLEAN');
                return {
                    type: 'boolean',
                    value: token.value === 'true'
                };

            case 'IDENTIFIER':
            case 'SHAPE_TYPE':
                const identifier = token.value;
                this.eat(token.type);
                
                if (this.currentToken().type === 'DOT') {
                    this.eat('DOT');
                    if (this.currentToken().type !== 'IDENTIFIER' && 
                        this.currentToken().type !== 'PROPERTY') {
                        this.error('Expected property name after dot');
                    }
                    const property = this.currentToken().value;
                    this.eat(this.currentToken().type);
                    
                    return {
                        type: 'property_access',
                        object: identifier,
                        property: property
                    };
                }
                
                return {
                    type: 'identifier',
                    value: identifier
                };

            case 'LPAREN':
                this.eat('LPAREN');
                const expr = this.parseLogicalExpression();
                this.eat('RPAREN');
                return expr;

            default:
                this.error(`Unexpected token in expression: ${token.type}`);
        }
    }
}

export { LogicalLexer, LogicalParser };
