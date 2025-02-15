// interpreter.mjs
import { Environment } from './environment.mjs';
import { booleanOperator } from './BooleanOperators.mjs';

export class Interpreter {
    constructor() {
        this.env = new Environment();
        this.booleanOperator = booleanOperator;
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
        if (node.type === 'shape' && this.currentLoopCounter !== undefined) {
            node = {
                ...node,
                name: `${node.name}_${this.currentLoopCounter}`
            };
        }

        switch (node.type) {
            case 'param':
                return this.evaluateParam(node);
            case 'shape':
                return this.evaluateShape(node);
            case 'layer':
                return this.evaluateLayer(node);
            case 'transform':
                return this.evaluateTransform(node);
            case 'if_statement':
                return this.evaluateIfStatement(node);
            case 'for_loop':
                return this.evaluateForLoop(node);
            case 'boolean_operation':
                return this.evaluateBooleanOperation(node);
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    evaluateBooleanOperation(node) {
        const { operation, name, shapes: shapeNames } = node;
        const shapes = [];

        for (const shapeName of shapeNames) {
            try {
                const shape = this.env.getShape(shapeName);
                if (!shape) {
                    throw new Error(`Shape not found: ${shapeName}`);
                }
                shapes.push({
                    ...shape,
                    name: shapeName
                });
            } catch (error) {
                throw new Error(`Error in boolean operation ${operation}: ${error.message}`);
            }
        }

        let result;
        try {
            switch (operation) {
                case 'union':
                    result = this.booleanOperator.performUnion(shapes);
                    break;
                case 'difference':
                    result = this.booleanOperator.performDifference(shapes);
                    break;
                case 'intersection':
                    result = this.booleanOperator.performIntersection(shapes);
                    break;
                default:
                    throw new Error(`Unknown boolean operation: ${operation}`);
            }
        } catch (error) {
            throw new Error(`Failed to perform ${operation}: ${error.message}`);
        }

        result.name = name;
        this.env.addShape(name, result);
        return result;
    }

    evaluateForLoop(node) {
        const start = this.evaluateExpression(node.start);
        const end = this.evaluateExpression(node.end);
        const step = this.evaluateExpression(node.step);
        
        const outerLoopCounter = this.currentLoopCounter;
        
        for (let i = start; i <= end; i += step) {
            this.env.setParameter(node.iterator, i);
            this.currentLoopCounter = i;
            
            for (const statement of node.body) {
                this.evaluateNode(statement);
            }
        }
        
        this.currentLoopCounter = outerLoopCounter;
        this.env.parameters.delete(node.iterator);
    }

    evaluateIfStatement(node) {
        const condition = this.evaluateExpression(node.condition);
        if (this.isTruthy(condition)) {
            for (const statement of node.thenBranch) {
                this.evaluateNode(statement);
            }
        } else if (node.elseBranch && node.elseBranch.length > 0) {
            for (const statement of node.elseBranch) {
                this.evaluateNode(statement);
            }
        }
    }

    evaluateParam(node) {
        const value = this.evaluateExpression(node.value);
        this.env.setParameter(node.name, value);
        return value;
    }

    evaluateShape(node) {
        const params = {};
        for (const [key, expr] of Object.entries(node.params)) {
            params[key] = this.evaluateExpression(expr);
        }
        return this.env.createShape(node.shapeType, node.name, params);
    }

    evaluateLayer(node) {
        const layer = this.env.createLayer(node.name);
        for (const cmd of node.commands) {
            switch (cmd.type) {
                case 'add': {
                    this.env.addShapeToLayer(node.name, cmd.shape);
                    break;
                }
                case 'rotate': {
                    const angle = this.evaluateExpression(cmd.angle);
                    layer.transform.rotation += angle;
                    break;
                }
            }
        }
        return layer;
    }

    evaluateTransform(node) {
        const target = this.env.shapes.get(node.target) || this.env.layers.get(node.target);
        if (!target) {
            throw new Error(`Transform target not found: ${node.target}`);
        }

        for (const op of node.operations) {
            switch (op.type) {
                case 'scale': {
                    const scaleVal = this.evaluateExpression(op.value);
                    target.transform.scale = [scaleVal, scaleVal];
                    break;
                }
                case 'rotate': {
                    const angle = this.evaluateExpression(op.angle);
                    target.transform.rotation += angle;
                    break;
                }
                case 'translate': {
                    const [x, y] = this.evaluateExpression(op.value);
                    target.transform.position = [x, y];
                    break;
                }
                default:
                    throw new Error(`Unknown transform operation: ${op.type}`);
            }
        }
        return target;
    }

    evaluateExpression(expr) {
        switch (expr.type) {
            case 'number':
                return expr.value;
            case 'string':
                return expr.value;
            case 'boolean':
                return expr.value;
            case 'identifier':
                if (expr.name.startsWith('param.')) {
                    const paramName = expr.name.split('.')[1];
                    return this.env.getParameter(paramName);
                }
                return this.env.getParameter(expr.name);
            case 'binary_op':
                return this.evaluateBinaryOp(expr);
            case 'comparison':
                return this.evaluateComparison(expr);
            case 'logical_op':
                return this.evaluateLogicalOp(expr);
            case 'unary_op':
                return this.evaluateUnaryOp(expr);
            case 'array':
                return expr.elements.map(e => this.evaluateExpression(e));
            default:
                throw new Error(`Unknown expression type: ${expr.type}`);
        }
    }

    evaluateBinaryOp(expr) {
        const left = this.evaluateExpression(expr.left);
        const right = this.evaluateExpression(expr.right);
        
        switch (expr.operator) {
            case 'plus':
                return left + right;
            case 'minus':
                return left - right;
            case 'multiply':
                return left * right;
            case 'divide':
                if (right === 0) throw new Error('Division by zero');
                return left / right;
            default:
                throw new Error(`Unknown binary operator: ${expr.operator}`);
        }
    }

    evaluateComparison(expr) {
        const left = this.evaluateExpression(expr.left);
        const right = this.evaluateExpression(expr.right);
        
        switch (expr.operator) {
            case 'equals':
                return left === right;
            case 'not_equals':
                return left !== right;
            case 'less':
                return left < right;
            case 'less_equals':
                return left <= right;
            case 'greater':
                return left > right;
            case 'greater_equals':
                return left >= right;
            default:
                throw new Error(`Unknown comparison operator: ${expr.operator}`);
        }
    }

    evaluateLogicalOp(expr) {
        const left = this.evaluateExpression(expr.left);
        
        if (expr.operator === 'and') {
            return this.isTruthy(left) ? this.isTruthy(this.evaluateExpression(expr.right)) : false;
        }
        if (expr.operator === 'or') {
            return this.isTruthy(left) ? true : this.isTruthy(this.evaluateExpression(expr.right));
        }
        
        throw new Error(`Unknown logical operator: ${expr.operator}`);
    }

    evaluateUnaryOp(expr) {
        const operand = this.evaluateExpression(expr.operand);
        switch (expr.operator) {
            case 'not':
                return !this.isTruthy(operand);
            case 'minus':
                return -operand;
            case 'plus':
                return +operand;
            default:
                throw new Error(`Unknown unary operator: ${expr.operator}`);
        }
    }

    isTruthy(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value.length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (value === null || value === undefined) return false;
        return true;
    }

    validateShapeForBoolean(shape) {
        if (!shape) return false;
        if (!shape.type || !shape.params) return false;
        if (shape.type === 'path' && (!shape.params.points || !Array.isArray(shape.params.points))) return false;
        return true;
    }

    cleanupTemporaryShapes() {
        for (const [name, shape] of this.env.shapes.entries()) {
            if (shape.params.isTemporary) {
                this.env.shapes.delete(name);
            }
        }
    }
}
