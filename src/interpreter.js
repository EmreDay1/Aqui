// interpreter.mjs
class Environment {
    constructor() {
        this.parameters = new Map();
        this.shapes = new Map();
        this.layers = new Map();
        this.transformStack = [];
    }

    getParameter(name) {
        const value = this.parameters.get(name);
        if (value === undefined) {
            throw new Error(`Parameter not found: ${name}`);
        }
        return value;
    }

    setParameter(name, value) {
        this.parameters.set(name, value);
        // Update dependent parameters
        this.updateDependents(name);
    }

    updateDependents(paramName) {
        // Future: Add parameter dependency tracking
    }

    createShape(type, name, params) {
        const shape = {
            type,
            id: `${type}_${name}_${Date.now()}`,
            params: { ...params },
            transform: {
                position: params.position || [0, 0],
                rotation: 0,
                scale: [1, 1]
            }
        };
        this.shapes.set(name, shape);
        return shape;
    }

    getShape(name) {
        const shape = this.shapes.get(name);
        if (!shape) {
            throw new Error(`Shape not found: ${name}`);
        }
        return shape;
    }

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
        return layer;
    }
}

class Interpreter {
    constructor() {
        this.env = new Environment();
    }

    interpret(ast) {
        let result = null;
        for (const node of ast) {
            result = this.evaluateNode(node);
        }
        return {
            parameters: this.env.parameters,
            shapes: this.env.shapes,
            layers: this.env.layers,
            result
        };
    }

    evaluateNode(node) {
        switch (node.type) {
            case 'param':
                return this.evaluateParam(node);
            case 'shape':
                return this.evaluateShape(node);
            case 'layer':
                return this.evaluateLayer(node);
            case 'transform':
                return this.evaluateTransform(node);
            case 'operation':
                return this.evaluateOperation(node);
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    evaluateParam(node) {
        const value = this.evaluateExpression(node.value);
        this.env.setParameter(node.name, value);
        return value;
    }

    evaluateShape(node) {
        const params = {};
        // Evaluate each parameter
        for (const [key, expr] of Object.entries(node.params)) {
            params[key] = this.evaluateExpression(expr);
        }

        return this.env.createShape(node.shapeType, node.name, params);
    }

    evaluateExpression(expr) {
        if (!expr || typeof expr !== 'object') {
            throw new Error(`Invalid expression: ${JSON.stringify(expr)}`);
        }

        switch (expr.type) {
            case 'number':
                return expr.value;

            case 'identifier':
                if (expr.name.startsWith('param.')) {
                    const paramName = expr.name.split('.')[1];
                    return this.env.getParameter(paramName);
                }
                return this.env.getParameter(expr.name);

            case 'binary_op':
                const left = this.evaluateExpression(expr.left);
                const right = this.evaluateExpression(expr.right);
                return this.evaluateBinaryOp(expr.operator, left, right);

            case 'unary_op':
                const operand = this.evaluateExpression(expr.operand);
                return this.evaluateUnaryOp(expr.operator, operand);

            case 'array':
                return expr.elements.map(element => this.evaluateExpression(element));

            default:
                throw new Error(`Unknown expression type: ${expr.type}`);
        }
    }

    evaluateBinaryOp(operator, left, right) {
        switch (operator) {
            case 'plus':
            case '+':
                return left + right;
            case 'minus':
            case '-':
                return left - right;
            case 'multiply':
            case '*':
                return left * right;
            case 'divide':
            case '/':
                if (right === 0) throw new Error('Division by zero');
                return left / right;
            default:
                throw new Error(`Unknown binary operator: ${operator}`);
        }
    }

    evaluateUnaryOp(operator, operand) {
        switch (operator) {
            case 'minus':
            case '-':
                return -operand;
            case 'plus':
            case '+':
                return +operand;
            default:
                throw new Error(`Unknown unary operator: ${operator}`);
        }
    }

    evaluateLayer(node) {
        const layer = this.env.createLayer(node.name);

        for (const cmd of node.commands) {
            switch (cmd.type) {
                case 'add':
                    const shape = this.env.getShape(cmd.shape);
                    layer.shapes.set(cmd.shape, shape);
                    break;
                case 'subtract':
                    layer.operations.push({
                        type: 'subtract',
                        shape: this.env.getShape(cmd.shape)
                    });
                    break;
                case 'rotate':
                    layer.operations.push({
                        type: 'rotate',
                        angle: this.evaluateExpression(cmd.angle)
                    });
                    break;
                default:
                    throw new Error(`Unknown layer command: ${cmd.type}`);
            }
        }

        return layer;
    }

    evaluateTransform(node) {
        const target = this.env.layers.get(node.target) || this.env.shapes.get(node.target);
        if (!target) {
            throw new Error(`Transform target not found: ${node.target}`);
        }

        for (const op of node.operations) {
            switch (op.type) {
                case 'scale':
                    const scaleValue = this.evaluateExpression(op.value);
                    target.transform.scale = [scaleValue, scaleValue];
                    break;
                case 'rotate':
                    target.transform.rotation = this.evaluateExpression(op.angle);
                    break;
                case 'translate':
                    const [x, y] = this.evaluateExpression(op.value);
                    target.transform.position = [x, y];
                    break;
                default:
                    throw new Error(`Unknown transform operation: ${op.type}`);
            }
        }

        return target;
    }

    evaluateOperation(node) {
        switch (node.type) {
            case 'boolean':
                return this.evaluateBooleanOperation(node);
            default:
                throw new Error(`Unknown operation type: ${node.type}`);
        }
    }

    evaluateBooleanOperation(node) {
        const shape1 = this.env.getShape(node.shape1);
        const shape2 = this.env.getShape(node.shape2);
        
        return {
            type: 'boolean_result',
            operation: node.operator,
            shapes: [shape1, shape2]
        };
    }
}

export { Interpreter, Environment };
