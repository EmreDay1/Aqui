// src/runtime/interpreter.js
import * as Shapes from './src/shapes/Shapes.js';

class Interpreter {
    constructor() {
        this.env = {
            parameters: new Map(),
            shapes: new Map(),
            currentLayer: null,
            layers: new Map()
        };
    }

    interpret(ast) {
        for (const node of ast) {
            this.evaluateNode(node);
        }
        return this.env;
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
        this.env.parameters.set(node.name, value);
        return value;
    }

    evaluateShape(node) {
        // Get shape constructor
        const ShapeClass = Shapes[node.shapeType];
        if (!ShapeClass) {
            throw new Error(`Unknown shape type: ${node.shapeType}`);
        }

        // Evaluate parameters
        const params = {};
        for (const [key, value] of Object.entries(node.params)) {
            params[key] = this.evaluateExpression(value);
        }

        // Create shape
        const shape = new ShapeClass(...Object.values(params));

        // Store shape if it has a name
        if (node.name) {
            if (this.env.currentLayer) {
                this.env.layers.get(this.env.currentLayer).shapes.set(node.name, shape);
            } else {
                this.env.shapes.set(node.name, shape);
            }
        }

        return shape;
    }

    evaluateLayer(node) {
        this.env.layers.set(node.name, {
            shapes: new Map(),
            transforms: []
        });
        this.env.currentLayer = node.name;

        // Evaluate all statements in layer
        node.statements.forEach(stmt => this.evaluateNode(stmt));

        this.env.currentLayer = null;
        return this.env.layers.get(node.name);
    }

    evaluateTransform(node) {
        const shape = this.getShape(node.target);
        const args = node.args.map(arg => this.evaluateExpression(arg));

        switch (node.operation) {
            case 'translate':
                shape.translate(args[0], args[1]);
                break;
            case 'rotate':
                shape.rotate(args[0]);
                break;
            case 'scale':
                shape.setScale(args[0], args[1] ?? args[0]);
                break;
            default:
                throw new Error(`Unknown transform: ${node.operation}`);
        }

        return shape;
    }

    evaluateOperation(node) {
        const shape1 = this.getShape(node.shape1);
        const shape2 = this.getShape(node.shape2);

        switch (node.operator) {
            case 'union':
                return Shapes.ShapeUtils.union(shape1, shape2);
            case 'subtract':
                return Shapes.ShapeUtils.subtract(shape1, shape2);
            case 'intersect':
                return Shapes.ShapeUtils.intersect(shape1, shape2);
            default:
                throw new Error(`Unknown operation: ${node.operator}`);
        }
    }

    evaluateExpression(expr) {
        if (typeof expr === 'number') return expr;
        if (typeof expr === 'string') {
            // Check if it's a parameter reference
            if (expr.startsWith('param.')) {
                const paramName = expr.slice(6);
                const value = this.env.parameters.get(paramName);
                if (value === undefined) {
                    throw new Error(`Undefined parameter: ${paramName}`);
                }
                return value;
            }
            // Check if it's a shape reference
            const value = this.env.parameters.get(expr) ?? this.getShape(expr);
            if (value === undefined) {
                throw new Error(`Undefined reference: ${expr}`);
            }
            return value;
        }
        if (expr.type === 'binary') {
            const left = this.evaluateExpression(expr.left);
            const right = this.evaluateExpression(expr.right);
            switch (expr.operator) {
                case '+': return left + right;
                case '-': return left - right;
                case '*': return left * right;
                case '/': return left / right;
                default:
                    throw new Error(`Unknown operator: ${expr.operator}`);
            }
        }
        throw new Error(`Invalid expression: ${JSON.stringify(expr)}`);
    }

    getShape(name) {
        if (this.env.currentLayer) {
            const shape = this.env.layers.get(this.env.currentLayer).shapes.get(name);
            if (shape) return shape;
        }
        const shape = this.env.shapes.get(name);
        if (!shape) {
            throw new Error(`Shape not found: ${name}`);
        }
        return shape;
    }
}

// Usage example
function executeCode(code) {
    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    const ast = parser.parse();
    const interpreter = new Interpreter();
    return interpreter.interpret(ast);
}

// Example code:
const exampleCode = `
    param width 100
    param height width * 0.6

    rect box {
        width: param.width
        height: param.height
    }

    circle hole {
        radius: 10
    }

    layer combined {
        move hole [0 0]
        subtract box hole
    }
`;

export { Interpreter, executeCode };