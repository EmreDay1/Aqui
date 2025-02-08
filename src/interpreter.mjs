// interpreter.mjs

class Environment {
    constructor() {
        this.shapes = new Map();
        this.layers = new Map();
        this.variables = new Map();
        this.currentLayer = null;
        this.scope = [];
        this.inLoop = false;      // Add this to track loop context
        this.loopCounter = 0;     // Add this to track iterations
    }

    // Add methods to manage loop context
    enterLoop() {
        this.inLoop = true;
        this.loopCounter = 0;
    }

    exitLoop() {
        this.inLoop = false;
        this.loopCounter = 0;
    }

    // Modify createShape to handle loop-specific naming
    createShape(shapeType, name, params) {
        // Generate unique name if in loop
        let finalName = name;
        if (this.inLoop) {
            finalName = `${name}_${this.loopCounter}`;
            this.loopCounter++;
        }

        // Validate required parameters
        this.validateShapeParams(shapeType, params);

        const shape = {
            type: shapeType,
            name: finalName,
            id: `${shapeType}_${finalName}_${Date.now()}`,
            params: this.normalizeParams(shapeType, params),
            transform: {
                position: params.position || [0, 0],
                rotation: params.rotation || 0,
                scale: [params.scaleX || 1, params.scaleY || 1]
            }
        };

        this.shapes.set(finalName, shape);
        if (this.currentLayer) {
            this.currentLayer.shapes.set(finalName, shape);
        }

        return shape;
    }


    validateShapeParams(shapeType, params) {
        const requiredParams = {
            rectangle: ['width', 'height'],
            circle: ['radius'],
            triangle: ['base', 'height'],
            ellipse: ['radiusX', 'radiusY'],
            text: ['content'],
            gear: ['diameter', 'teeth'],
            star: ['outerRadius', 'innerRadius', 'points'],
            arc: ['radius', 'startAngle', 'endAngle'],
            spiral: ['startRadius', 'endRadius', 'turns'],
            cross: ['width', 'thickness'],
            slot: ['length', 'width'],
            path: ['points'],
            wave: ['width', 'amplitude', 'frequency'],
            donut: ['outerRadius', 'innerRadius']
        };

        const required = requiredParams[shapeType];
        if (required) {
            for (const param of required) {
                if (!(param in params)) {
                    throw new Error(`Shape type '${shapeType}' requires parameter '${param}'`);
                }
            }
        }
    }

    normalizeParams(shapeType, params) {
        const normalized = { ...params };
        const defaults = {
            rectangle: { width: 100, height: 100 },
            circle: { radius: 50 },
            text: { fontSize: 16 },
            gear: { teeth: 12 },
            star: { points: 5 },
            spiral: { turns: 2 },
            wave: { frequency: 1 }
        };

        if (defaults[shapeType]) {
            Object.assign(normalized, { ...defaults[shapeType], ...params });
        }

        return normalized;
    }

    // Layer-related methods
    createLayer(name) {
        const layer = {
            name,
            shapes: new Map(),
            operations: [],
            transform: {
                position: [0, 0],
                rotation: 0,
                scale: [1, 1]
            }
        };

        this.layers.set(name, layer);
        this.currentLayer = layer;
        return layer;
    }

    getShape(name) {
        const shape = this.shapes.get(name);
        if (!shape) {
            throw new Error(`Shape '${name}' not found`);
        }
        return shape;
    }

    addToLayer(layerName, shapeName) {
        const layer = this.layers.get(layerName);
        if (!layer) {
            throw new Error(`Layer '${layerName}' not found`);
        }

        const shape = this.getShape(shapeName);
        layer.shapes.set(shapeName, shape);
        return layer;
    }

    subtractFromLayer(layerName, shapeName) {
        const layer = this.layers.get(layerName);
        if (!layer) {
            throw new Error(`Layer '${layerName}' not found`);
        }

        const shape = this.getShape(shapeName);
        layer.operations.push({
            type: 'subtract',
            shape: shape
        });
        return layer;
    }

    // Expression evaluation methods
    // In Environment class in interpreter.mjs
evaluateExpression(expr) {
    // Handle raw numbers/values
    if (typeof expr === 'number') {
        return expr;
    }
    
    if (!expr || typeof expr !== 'object') {
        throw new Error(`Invalid expression: ${JSON.stringify(expr)}`);
    }

    switch (expr.type) {
        case 'number':
            return expr.value;
        case 'string':
            return expr.value;
        case 'boolean':
            return expr.value;
        case 'array':
            return expr.elements.map(element => this.evaluateExpression(element));
        case 'identifier':
            return this.resolveIdentifier(expr.value);
        case 'property_access':
            return this.evaluatePropertyAccess(expr);
        case 'logical_op':
            return this.evaluateLogicalOp(expr);
        case 'comparison_op':
            return this.evaluateComparisonOp(expr);
        case 'binary_op':
            return this.evaluateBinaryOp(expr);
        case 'unary_op':
            return this.evaluateUnaryOp(expr);
        default:
            throw new Error(`Unknown expression type: ${expr.type}`);
    }
}

evaluateBinaryOp(expr) {
    const left = expr.left.type === 'identifier' ? 
        this.variables.get(expr.left.value) : 
        this.evaluateExpression(expr.left);
    const right = this.evaluateExpression(expr.right);

    switch (expr.operator) {
        case 'multiply': return left * right;
        case 'plus': return left + right;
        case 'minus': return left - right;
        case 'divide':
            if (right === 0) throw new Error('Division by zero');
            return left / right;
        default:
            throw new Error(`Unknown binary operator: ${expr.operator}`);
    }
}


    evaluateLogicalOp(expr) {
        // For AND operations, evaluate left side first
        if (expr.operator.toLowerCase() === 'and') {
            const leftResult = this.evaluateExpression(expr.left);
            if (!leftResult) return false; // Short circuit if left is false
            return this.evaluateExpression(expr.right);
        }
        // For OR operations, evaluate left side first
        else if (expr.operator.toLowerCase() === 'or') {
            const leftResult = this.evaluateExpression(expr.left);
            if (leftResult) return true; // Short circuit if left is true
            return this.evaluateExpression(expr.right);
        }

        throw new Error(`Unknown logical operator: ${expr.operator}`);
    }


    evaluateComparisonOp(expr) {
        try {
            const left = this.evaluateExpression(expr.left);
            const right = this.evaluateExpression(expr.right);

            switch (expr.operator) {
                case '==': return left === right;
                case '!=': return left !== right;
                case '>': return left > right;
                case '<': return left < right;
                case '>=': return left >= right;
                case '<=': return left <= right;
                default:
                    throw new Error(`Unknown comparison operator: ${expr.operator}`);
            }
        } catch (error) {
            // If comparison fails, return false
            return false;
        }
    }

    evaluateBinaryOp(expr) {
        const left = this.evaluateExpression(expr.left);
        const right = this.evaluateExpression(expr.right);

        switch (expr.operator) {
            case 'plus': return left + right;
            case 'minus': return left - right;
            case 'multiply': return left * right;
            case 'divide':
                if (right === 0) throw new Error('Division by zero');
                return left / right;
            default:
                throw new Error(`Unknown binary operator: ${expr.operator}`);
        }
    }

    evaluateUnaryOp(expr) {
        const value = this.evaluateExpression(expr.operand);
        switch (expr.operator) {
            case 'minus': return -value;
            case 'plus': return +value;
            case 'not': return !value;
            default:
                throw new Error(`Unknown unary operator: ${expr.operator}`);
        }
    }

    resolveIdentifier(name) {
        if (this.variables.has(name)) {
            return this.variables.get(name);
        }
        return name;
    }

    applyTransform(target, operations) {
        const targetObj = this.shapes.get(target) || this.layers.get(target);
        if (!targetObj) {
            throw new Error(`Transform target '${target}' not found`);
        }

        for (const op of operations) {
            switch (op.type) {
                case 'scale': {
                    const value = this.evaluateExpression(op.value);
                    targetObj.transform.scale = [value, value];
                    break;
                }
                case 'rotate': {
                    targetObj.transform.rotation = this.evaluateExpression(op.value);
                    break;
                }
                case 'position': {
                    const pos = this.evaluateExpression(op.value);
                    if (!Array.isArray(pos) || pos.length !== 2) {
                        throw new Error('Position must be a 2D array [x, y]');
                    }
                    targetObj.transform.position = pos;
                    break;
                }
                default:
                    throw new Error(`Unknown transform operation: ${op.type}`);
            }
        }

        return targetObj;
    }

    createRange(start, end, step = 1) {
        const range = [];
        for (let i = start; i < end; i += step) {
            range.push(i);
        }
        return range;
    }

    pushScope() {
        this.scope.push(new Map());
    }

    popScope() {
        if (this.scope.length > 0) {
            this.scope.pop();
        }
    }

    setVariable(name, value) {
        if (this.scope.length > 0) {
            this.scope[this.scope.length - 1].set(name, value);
        } else {
            this.variables.set(name, value);
        }
    }

    resolveIdentifier(name) {
        // Check scopes from innermost to outermost
        for (let i = this.scope.length - 1; i >= 0; i--) {
            if (this.scope[i].has(name)) {
                return this.scope[i].get(name);
            }
        }
        // Check global variables
        if (this.variables.has(name)) {
            return this.variables.get(name);
        }
        return name;
    }
}

class Interpreter {
    constructor() {
        this.env = new Environment();
    }

    interpret(ast) {
        const results = [];
        for (const node of ast) {
            const result = this.evaluateNode(node);
            if (result !== undefined) {
                results.push(result);
            }
        }

        return {
            shapes: this.env.shapes,
            layers: this.env.layers,
            results
        };
    }

    evaluateNode(node) {
        if (!node || typeof node !== 'object') {
            throw new Error(`Invalid AST node: ${JSON.stringify(node)}`);
        }
    
        switch (node.type) {
            case 'shape':
                return this.evaluateShape(node);
            case 'layer':
                return this.evaluateLayer(node);
            case 'transform':
                return this.evaluateTransform(node);
            case 'if_statement':
                return this.evaluateIfStatement(node);
            case 'for_loop':           // Add this case
                return this.evaluateForLoop(node);
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }
    

    evaluateForLoop(node) {
        const { iterator, range, body } = node;
        const results = [];
        
        const start = this.env.evaluateExpression(range.start);
        const end = this.env.evaluateExpression(range.end);
        
        // Enter loop context
        this.env.enterLoop();
        
        for (let i = start; i < end; i++) {
            this.env.variables.set(iterator, i);
            
            for (const statement of body) {
                const result = this.evaluateNode(statement);
                if (result !== undefined) {
                    results.push(result);
                }
            }
        }
        
        // Exit loop context
        this.env.exitLoop();
        this.env.variables.delete(iterator);
        
        return results;
    }

    evaluateShape(node) {
        const params = {};
        for (const [key, value] of Object.entries(node.params)) {
            params[key] = this.env.evaluateExpression(value);
        }
        return this.env.createShape(node.shapeType, node.name, params);
    }

    evaluateLayer(node) {
        const layer = this.env.createLayer(node.name);

        for (const command of node.commands) {
            switch (command.type) {
                case 'add':
                    this.env.addToLayer(node.name, command.shape);
                    break;
                case 'subtract':
                    this.env.subtractFromLayer(node.name, command.shape);
                    break;
                case 'rotation':
                    layer.transform.rotation = this.env.evaluateExpression(command.value);
                    break;
                case 'scale':
                    const scale = this.env.evaluateExpression(command.value);
                    layer.transform.scale = [scale, scale];
                    break;
                case 'position':
                    layer.transform.position = this.env.evaluateExpression(command.value);
                    break;
                default:
                    throw new Error(`Unknown layer command: ${command.type}`);
            }
        }

        return layer;
    }

    evaluateTransform(node) {
        return this.env.applyTransform(node.target, node.operations);
    }

    evaluateIfStatement(node) {
        const condition = this.env.evaluateExpression(node.condition);
        
        if (condition) {
            for (const statement of node.body) {
                this.evaluateNode(statement);
            }
        } else if (node.elseBody) {
            for (const statement of node.elseBody) {
                this.evaluateNode(statement);
            }
        }
    }
}

export { Interpreter };
