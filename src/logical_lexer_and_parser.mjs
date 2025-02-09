/************************************************
 * Combined LogicalLexer + LogicalParser
 ************************************************/

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

class LogicalLexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.current_char = this.input.length > 0 ? this.input[0] : null;

        // Tracks current indentation levels (Python-style).
        this.indentStack = [0];
    }

    error(message) {
        throw new Error(
            `Lexical error at line ${this.line}, column ${this.column}: ${message}`
        );
    }

    advance() {
        this.pos++;
        if (this.pos >= this.input.length) {
            this.current_char = null;
        } else {
            this.current_char = this.input[this.pos];
            this.column++;
        }
    }

    peek() {
        const peekPos = this.pos + 1;
        if (peekPos >= this.input.length) {
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
        // Skip until newline or end of file
        while (this.current_char && this.current_char !== '\n') {
            this.advance();
        }
    }

    /************************************************
     * NEWLINE + INDENT / DEDENT HANDLING
     ************************************************/
    handleNewLine() {
        // Consume this '\n'
        this.advance();
        this.line++;
        this.column = 1;

        // Skip any additional consecutive newlines
        while (this.current_char === '\n') {
            this.advance();
            this.line++;
        }

        // Return a single NEWLINE token
        return new Token('NEWLINE', '\n', this.line - 1, this.column);
    }

    handleIndentation() {
        let spaces = 0;
        const startColumn = this.column;

        // Count spaces or tabs at the start of a line
        while (this.current_char === ' ' || this.current_char === '\t') {
            // Treat each tab as 4 spaces
            spaces += this.current_char === ' ' ? 1 : 4;
            this.advance();
        }

        // If the line is empty or a comment, do not produce INDENT/DEDENT
        if (
            this.current_char === '\n' ||
            this.current_char === '#' ||
            (this.current_char === '/' && this.peek() === '/')
        ) {
            return null;
        }

        const currentIndent = this.indentStack[this.indentStack.length - 1];

        if (spaces > currentIndent) {
            // We have a deeper indentation
            this.indentStack.push(spaces);
            return new Token('INDENT', spaces, this.line, startColumn);
        } else if (spaces < currentIndent) {
            // We have dedentation; pop until matching level
            while (spaces < this.indentStack[this.indentStack.length - 1]) {
                this.indentStack.pop();
                if (spaces > this.indentStack[this.indentStack.length - 1]) {
                    this.error('Invalid dedent');
                }
                return new Token('DEDENT', spaces, this.line, startColumn);
            }
        }
        // If equal, no change
        return null;
    }

    /************************************************
     * TOKENIZATION METHODS
     ************************************************/

    // Recognize identifiers/keywords
    identifier() {
        let result = '';
        const start_column = this.column;

        while (this.current_char && /[a-zA-Z0-9_]/.test(this.current_char)) {
            result += this.current_char;
            this.advance();
        }

        // Full dictionary of keywords
        const keywords = {
            // Shape types
            rectangle: 'SHAPE_TYPE',
            circle: 'SHAPE_TYPE',
            triangle: 'SHAPE_TYPE',
            ellipse: 'SHAPE_TYPE',
            text: 'SHAPE_TYPE',
            path: 'SHAPE_TYPE',
            gear: 'SHAPE_TYPE',
            star: 'SHAPE_TYPE',
            cross: 'SHAPE_TYPE',
            slot: 'SHAPE_TYPE',
            arc: 'SHAPE_TYPE',
            spiral: 'SHAPE_TYPE',
            wave: 'SHAPE_TYPE',
            donut: 'SHAPE_TYPE',

            // Structure keywords
            layer: 'LAYER',
            transform: 'TRANSFORM',
            add: 'ADD',
            subtract: 'SUBTRACT',

            // Control-flow keywords
            if: 'IF',
            else: 'ELSE',
            for: 'FOR',
            in: 'IN',
            range: 'RANGE',
            to: 'TO',
            step: 'STEP',

            // Logical keywords
            and: 'AND',
            or: 'OR',
            not: 'NOT',
            true: 'BOOLEAN',
            false: 'BOOLEAN',

            // Fillet
            fillet: 'FILLET',
            fillet_type: 'PROPERTY',
            fillet_radius: 'PROPERTY',
            round: 'FILLET_TYPE',
            chamfer: 'FILLET_TYPE',

            // Corner keywords
            corners: 'PROPERTY',
            all: 'CORNER_TYPE',
            top: 'CORNER_TYPE',
            bottom: 'CORNER_TYPE',
            left: 'CORNER_TYPE',
            right: 'CORNER_TYPE',

            // Common/transform properties
            position: 'PROPERTY',
            rotation: 'PROPERTY',
            scale: 'PROPERTY',
            scaleX: 'PROPERTY',
            scaleY: 'PROPERTY',
            translate: 'PROPERTY', // if needed

            // Shape-specific properties
            width: 'PROPERTY',
            height: 'PROPERTY',
            radius: 'PROPERTY',
            base: 'PROPERTY',
            content: 'PROPERTY',
            fontSize: 'PROPERTY',
            fontFamily: 'PROPERTY',
            points: 'PROPERTY',
            startAngle: 'PROPERTY',
            endAngle: 'PROPERTY',
            thickness: 'PROPERTY',
            pitch_diameter: 'PROPERTY',
            teeth: 'PROPERTY',
            outerRadius: 'PROPERTY',
            innerRadius: 'PROPERTY',
            radiusX: 'PROPERTY',
            radiusY: 'PROPERTY',
            startRadius: 'PROPERTY',
            endRadius: 'PROPERTY',
            turns: 'PROPERTY',
            amplitude: 'PROPERTY',
            frequency: 'PROPERTY',
            length: 'PROPERTY',

            // Shaft-related
            shaft_type: 'PROPERTY',
            circular: 'SHAFT_TYPE',
            square: 'SHAFT_TYPE'
        };

        const tokenType = keywords[result] || 'IDENTIFIER';
        return new Token(tokenType, result, this.line, start_column);
    }

    // Recognize integer or float (with optional leading '-')
    number() {
        let result = '';
        const start_column = this.column;

        // Optional minus sign
        if (this.current_char === '-') {
            result += this.current_char;
            this.advance();
        }

        // Digits
        while (this.current_char && /\d/.test(this.current_char)) {
            result += this.current_char;
            this.advance();
        }

        // Optional decimal part
        if (this.current_char === '.') {
            result += '.';
            this.advance();
            while (this.current_char && /\d/.test(this.current_char)) {
                result += this.current_char;
                this.advance();
            }
        }

        return new Token('NUMBER', parseFloat(result), this.line, start_column);
    }

    // Recognize double-quoted strings (with basic escapes)
    string() {
        const start_column = this.column;
        let result = '';

        // Skip opening quote
        this.advance();

        while (this.current_char && this.current_char !== '"') {
            if (this.current_char === '\\') {
                // Escape sequence
                this.advance();
                switch (this.current_char) {
                    case 'n':
                        result += '\n';
                        break;
                    case 't':
                        result += '\t';
                        break;
                    case 'r':
                        result += '\r';
                        break;
                    case '"':
                        result += '"';
                        break;
                    case '\\':
                        result += '\\';
                        break;
                    default:
                        this.error(`Invalid escape sequence \\${this.current_char}`);
                }
            } else {
                result += this.current_char;
            }
            this.advance();
        }

        if (!this.current_char) {
            this.error('Unterminated string literal');
        }

        // Skip closing quote
        this.advance();

        return new Token('STRING', result, this.line, start_column);
    }

    /************************************************
     * getNextToken() - main single-token extractor
     ************************************************/
    getNextToken() {
        while (this.current_char !== null) {
            // If we're at column 1, check indentation changes
            if (this.column === 1) {
                const indentToken = this.handleIndentation();
                if (indentToken) return indentToken;
            }

            // Whitespace
            if (/[ \t]/.test(this.current_char)) {
                this.skipWhitespace();
                continue;
            }

            // Comment
            if (
                this.current_char === '#' ||
                (this.current_char === '/' && this.peek() === '/')
            ) {
                this.skipComment();
                continue;
            }

            // Newline
            if (this.current_char === '\n') {
                return this.handleNewLine();
            }

            // String literal
            if (this.current_char === '"') {
                return this.string();
            }

            // Number (including negative)
            if (
                /\d/.test(this.current_char) ||
                (this.current_char === '-' && /\d/.test(this.peek()))
            ) {
                return this.number();
            }

            // Identifier or keyword
            if (/[a-zA-Z_]/.test(this.current_char)) {
                return this.identifier();
            }

            // Comparison operators / logical symbols
            // (==, !=, >=, <=, etc.)
            if (
                this.current_char === '>' ||
                this.current_char === '<' ||
                this.current_char === '=' ||
                this.current_char === '!'
            ) {
                const start_col = this.column;
                const char = this.current_char;
                this.advance();
                if (this.current_char === '=') {
                    const combo = char + '=';
                    this.advance();
                    const tokensMap = {
                        '>=': 'GREATER_EQUALS',
                        '<=': 'LESS_EQUALS',
                        '==': 'EQUALS',
                        '!=': 'NOT_EQUALS'
                    };
                    return new Token(tokensMap[combo], combo, this.line, start_col);
                }
                // Single-char operator
                const singleMap = {
                    '>': 'GREATER_THAN',
                    '<': 'LESS_THAN',
                    '!': 'NOT'
                };
                return new Token(singleMap[char], char, this.line, start_col);
            }

            // Special single-character tokens
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
                const t = new Token(
                    specialChars[this.current_char],
                    this.current_char,
                    this.line,
                    this.column
                );
                this.advance();
                return t;
            }

            this.error(`Unexpected character: ${this.current_char}`);
        }

        // If we reach end of file but still have indentation levels to pop
        if (this.indentStack.length > 1) {
            this.indentStack.pop();
            return new Token('DEDENT', null, this.line, this.column);
        }

        return new Token('EOF', null, this.line, this.column);
    }

    /************************************************
     * tokenize() - produce all tokens at once
     ************************************************/
    tokenize() {
        const tokens = [];
        let token = this.getNextToken();

        while (token.type !== 'EOF') {
            tokens.push(token);
            token = this.getNextToken();
        }
        // Finally push the EOF
        tokens.push(token);

        return tokens;
    }
}

/************************************************
 * PARSER - with combined logic
 ************************************************/
class LogicalParser {
    constructor(lexer) {
        this.lexer = lexer;
        this.tokens = this.lexer.tokenize();
        this.current = 0;
        this.isInLoop = false;       // track if inside a for-loop
        this.currentIterator = null; // track loop variable
    }

    error(message) {
        const token = this.currentToken();
        throw new Error(
            `Parser error at line ${token.line}, column ${token.column}: ${message}`
        );
    }

    currentToken() {
        return this.tokens[this.current];
    }

    peek() {
        return this.tokens[this.current + 1] || null;
    }

    eat(type) {
        const token = this.currentToken();
        if (token.type === type) {
            this.current++;
            return token;
        }
        this.error(`Expected ${type}, but got ${token.type}`);
    }

    /************************************************
     * parse() - entry point
     ************************************************/
    parse() {
        const statements = [];

        while (this.current < this.tokens.length && this.currentToken().type !== 'EOF') {
            // Skip newlines
            while (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
            if (this.currentToken().type === 'EOF') break;

            const stmt = this.parseStatement();
            if (stmt) {
                statements.push(stmt);

                // Consume trailing newlines after a statement
                while (
                    this.current < this.tokens.length &&
                    this.currentToken().type === 'NEWLINE'
                ) {
                    this.eat('NEWLINE');
                }
            }
        }

        return statements;
    }

    /************************************************
     * parseStatement() - dispatch by token type
     ************************************************/
    parseStatement() {
        const token = this.currentToken();

        switch (token.type) {
            case 'SHAPE_TYPE':
                return this.parseShapeDeclaration();
            case 'FILLET':
                return this.parseFillet();
            case 'IF':
                return this.parseIfStatement();
            case 'FOR':
                return this.parseForLoop();
            case 'LAYER':
                return this.parseLayer();
            case 'TRANSFORM':
                return this.parseTransform();
            default:
                this.error(`Unexpected token in statement: ${token.type}`);
        }
    }

    /************************************************
     * IF / ELSE
     ************************************************/
    parseIfStatement() {
        this.eat('IF');
        const condition = this.parseLogicalExpression();
        this.eat('COLON');

        // Optional newline
        if (this.currentToken().type === 'NEWLINE') {
            this.eat('NEWLINE');
        }
        this.eat('INDENT');

        const body = [];
        while (
            this.currentToken().type !== 'DEDENT' &&
            this.currentToken().type !== 'EOF'
        ) {
            body.push(this.parseStatement());
            if (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
        }
        this.eat('DEDENT');

        // Optional ELSE block
        let elseBody = null;
        if (this.currentToken().type === 'ELSE') {
            this.eat('ELSE');
            this.eat('COLON');
            if (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
            this.eat('INDENT');

            elseBody = [];
            while (
                this.currentToken().type !== 'DEDENT' &&
                this.currentToken().type !== 'EOF'
            ) {
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

    /************************************************
     * FOR LOOPS
     ************************************************/
    parseForLoop() {
        this.eat('FOR');
        const iterator = this.eat('IDENTIFIER').value;
        this.eat('IN');

        // for i in range(...)
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
            // fallback if you do "for i in somethingElse"
            range = this.parseExpression();
        }

        this.eat('COLON');
        if (this.currentToken().type === 'NEWLINE') {
            this.eat('NEWLINE');
        }
        this.eat('INDENT');

        // set loop context
        const oldInLoop = this.isInLoop;
        const oldIterator = this.currentIterator;
        this.isInLoop = true;
        this.currentIterator = iterator;

        const body = [];
        while (
            this.currentToken().type !== 'DEDENT' &&
            this.currentToken().type !== 'EOF'
        ) {
            body.push(this.parseStatement());
            if (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
        }

        this.eat('DEDENT');

        // restore previous context
        this.isInLoop = oldInLoop;
        this.currentIterator = oldIterator;

        return {
            type: 'for_loop',
            iterator,
            range,
            body
        };
    }

    /************************************************
     * SHAPE DECLARATION
     ************************************************/
    parseShapeDeclaration() {
        // e.g. rectangle myRect
        const shapeType = this.eat('SHAPE_TYPE').value;
        const name = this.eat('IDENTIFIER').value;

        // optional newline
        if (this.currentToken().type === 'NEWLINE') {
            this.eat('NEWLINE');
        }
        this.eat('INDENT');

        const params = {};
        while (
            this.currentToken().type !== 'DEDENT' &&
            this.currentToken().type !== 'EOF'
        ) {
            // parse shape property
            if (this.currentToken().type === 'PROPERTY') {
                const { property, value } = this.parseProperty();
                // e.g. handle shaft_type specially if desired
                params[property] = value;
            }
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

    /************************************************
     * FILLET DECLARATION
     ************************************************/
    parseFillet() {
        this.eat('FILLET');
        if (this.currentToken().type === 'NEWLINE') {
            this.eat('NEWLINE');
        }
        this.eat('INDENT');

        const params = {};
        while (
            this.currentToken().type !== 'DEDENT' &&
            this.currentToken().type !== 'EOF'
        ) {
            if (this.currentToken().type === 'PROPERTY') {
                const { property, value } = this.parseProperty();
                params[property] = value;
            }
            if (this.currentToken().type === 'NEWLINE') {
                this.eat('NEWLINE');
            }
        }
        this.eat('DEDENT');

        return {
            type: 'fillet',
            params
        };
    }

    /************************************************
     * LAYER
     ************************************************/
    parseLayer() {
        // layer myLayer
        this.eat('LAYER');
        const name = this.eat('IDENTIFIER').value;

        if (this.currentToken().type === 'NEWLINE') {
            this.eat('NEWLINE');
        }
        this.eat('INDENT');

        const commands = [];
        while (
            this.currentToken().type !== 'DEDENT' &&
            this.currentToken().type !== 'EOF'
        ) {
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

        // e.g. add: shapeName  OR  subtract: shapeName
        if (token.type === 'ADD' || token.type === 'SUBTRACT') {
            const operation = token.type.toLowerCase(); // 'add' or 'subtract'
            this.eat(token.type);
            this.eat('COLON');
            const shapeRef = this.eat('IDENTIFIER').value;
            return {
                type: operation,
                shape: shapeRef
            };
        }
        // Maybe a property like "rotation: 45"
        if (token.type === 'PROPERTY') {
            const { property, value } = this.parseProperty();
            return {
                type: property,
                value
            };
        }

        this.error(`Unexpected token in layer command: ${token.type}`);
    }

    /************************************************
     * TRANSFORM
     ************************************************/
    parseTransform() {
        // transform shapeName
        this.eat('TRANSFORM');
        const target = this.eat('IDENTIFIER').value;

        if (this.currentToken().type === 'NEWLINE') {
            this.eat('NEWLINE');
        }
        this.eat('INDENT');

        const operations = [];
        while (
            this.currentToken().type !== 'DEDENT' &&
            this.currentToken().type !== 'EOF'
        ) {
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
        // e.g. rotation: 45  or position: [10,20]
        const propertyToken = this.eat('PROPERTY');
        const property = propertyToken.value;
        this.eat('COLON');
        const value = this.parseExpression();
        return { type: property, value };
    }

    /************************************************
     * parseProperty() - used by shape/layer
     ************************************************/
    parseProperty() {
        const propToken = this.eat('PROPERTY');
        const property = propToken.value;
        this.eat('COLON');

        // If it is shaft_type: circular (SHAFT_TYPE)
        if (property === 'shaft_type' && this.currentToken().type === 'SHAFT_TYPE') {
            const val = this.eat('SHAFT_TYPE').value;
            return { property, value: val };
        }

        // Otherwise parse a normal expression
        const value = this.parseExpression();
        return { property, value };
    }

    /************************************************
     * Expression Parsing
     *
     * We'll do a simpler multi-step approach:
     * parseLogicalExpression() -> parseComparisonExpression() -> parseBasicExpression()
     ************************************************/

    parseExpression() {
        // For simplicity, let's parse a full "logical expression"
        // that includes comparison and arithmetic in one pass
        return this.parseLogicalExpression();
    }

    // AND / OR
    parseLogicalExpression() {
        let left = this.parseComparisonExpression();

        while (
            this.currentToken().type === 'AND' ||
            this.currentToken().type === 'OR'
        ) {
            const operator = this.currentToken().type; // 'AND' or 'OR'
            this.eat(operator);
            const right = this.parseComparisonExpression();
            left = {
                type: 'logical_op',
                operator: operator.toLowerCase(), // 'and' / 'or'
                left,
                right
            };
        }
        return left;
    }

    // ==, !=, <, >, <=, >=
    parseComparisonExpression() {
        let left = this.parseArithmeticExpression();

        const comparisonOps = {
            EQUALS: '==',
            NOT_EQUALS: '!=',
            GREATER_THAN: '>',
            LESS_THAN: '<',
            GREATER_EQUALS: '>=',
            LESS_EQUALS: '<='
        };

        while (comparisonOps[this.currentToken().type]) {
            const opType = this.currentToken().type;
            const operator = comparisonOps[opType];
            this.eat(opType);
            const right = this.parseArithmeticExpression();
            left = {
                type: 'comparison_op',
                operator,
                left,
                right
            };
        }
        return left;
    }

    // Basic arithmetic: +, -, *, /
    // (This is a simplistic approach—no separate precedence for * / vs + -)
    parseArithmeticExpression() {
        let left = this.parseBasicExpression();

        while (
            this.currentToken().type === 'PLUS' ||
            this.currentToken().type === 'MINUS' ||
            this.currentToken().type === 'MULTIPLY' ||
            this.currentToken().type === 'DIVIDE'
        ) {
            const operatorToken = this.currentToken();
            this.eat(operatorToken.type);
            const right = this.parseBasicExpression();
            left = {
                type: 'binary_op',
                operator: operatorToken.type.toLowerCase(),
                left,
                right
            };
        }
        return left;
    }

    // Single values, arrays, parentheses, unary minus, booleans, etc.
    parseBasicExpression() {
        const token = this.currentToken();

        // Handle unary NOT
        if (token.type === 'NOT') {
            this.eat('NOT');
            const operand = this.parseBasicExpression();
            return {
                type: 'unary_op',
                operator: 'not',
                operand
            };
        }
        // Handle unary minus
        if (token.type === 'MINUS') {
            this.eat('MINUS');
            const operand = this.parseBasicExpression();
            return {
                type: 'unary_op',
                operator: 'minus',
                operand
            };
        }

        switch (token.type) {
            case 'NUMBER': {
                this.eat('NUMBER');
                return { type: 'number', value: token.value };
            }
            case 'BOOLEAN': {
                this.eat('BOOLEAN');
                return { type: 'boolean', value: token.value === 'true' };
            }
            case 'STRING': {
                this.eat('STRING');
                return { type: 'string', value: token.value };
            }
            case 'IDENTIFIER':
            case 'SHAPE_TYPE': {
                // Could also allow property access like: object.property
                const name = token.value;
                this.eat(token.type);

                // Check for a '.' property access
                if (this.currentToken().type === 'DOT') {
                    this.eat('DOT');
                    if (
                        this.currentToken().type !== 'IDENTIFIER' &&
                        this.currentToken().type !== 'PROPERTY'
                    ) {
                        this.error('Expected property name after dot');
                    }
                    const propName = this.currentToken().value;
                    const propType = this.currentToken().type;
                    this.eat(propType);
                    return {
                        type: 'property_access',
                        object: name,
                        property: propName
                    };
                }

                // otherwise it's just an identifier
                return {
                    type: 'identifier',
                    value: name
                };
            }
            case 'LPAREN': {
                // Parenthesized sub-expression
                this.eat('LPAREN');
                const expr = this.parseExpression();
                this.eat('RPAREN');
                return expr;
            }
            case 'LBRACKET': {
                // Array/lists
                return this.parseArray();
            }
            default:
                this.error(`Unexpected token in expression: ${token.type}`);
        }
    }

    parseArray() {
        // e.g. [1, 2, 3]
        this.eat('LBRACKET');
        const elements = [];
        while (this.currentToken().type !== 'RBRACKET') {
            const element = this.parseExpression();
            elements.push(element);

            if (this.currentToken().type === 'COMMA') {
                this.eat('COMMA');
            } else if (this.currentToken().type === 'RBRACKET') {
                break;
            } else {
                // If there's something else, it's likely an error
                break;
            }
        }
        this.eat('RBRACKET');

        return {
            type: 'array',
            elements
        };
    }
}

/************************************************
 * Exports
 ************************************************/
export { LogicalLexer, LogicalParser };
