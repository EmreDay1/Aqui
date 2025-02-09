// interpreter.mjs
import { Environment } from './environment.mjs';

export class Interpreter {
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
      case 'param':      return this.evaluateParam(node);
      case 'shape':      return this.evaluateShape(node);
      case 'layer':      return this.evaluateLayer(node);
      case 'transform':  return this.evaluateTransform(node);
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
          const shape = this.env.getShape(cmd.shape);
          layer.shapes.set(cmd.shape, shape);
          break;
        }
        case 'subtract': {
          layer.operations.push({ type: 'subtract', shape: this.env.getShape(cmd.shape) });
          break;
        }
        case 'rotate': {
          const angle = this.evaluateExpression(cmd.angle);
          layer.operations.push({ type: 'rotate', angle });
          layer.transform.rotation += angle;
          break;
        }
        default:
          throw new Error(`Unknown layer command: ${cmd.type}`);
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
      case 'number': return expr.value;
      case 'string': return expr.value;
      case 'identifier': {
        if (expr.name.startsWith('param.')) {
          const paramName = expr.name.split('.')[1];
          return this.env.getParameter(paramName);
        }
        return this.env.getParameter(expr.name);
      }
      case 'binary_op': {
        const left = this.evaluateExpression(expr.left);
        const right = this.evaluateExpression(expr.right);
        return this.evaluateBinaryOp(expr.operator, left, right);
      }
      case 'unary_op': {
        const operand = this.evaluateExpression(expr.operand);
        return expr.operator === 'minus' ? -operand : +operand;
      }
      case 'array':
        return expr.elements.map(e => this.evaluateExpression(e));
      default:
        throw new Error(`Unknown expression type: ${expr.type}`);
    }
  }

  evaluateBinaryOp(operator, left, right) {
    switch (operator) {
      case 'plus':     return left + right;
      case 'minus':    return left - right;
      case 'multiply': return left * right;
      case 'divide':
        if (right === 0) throw new Error('Division by zero');
        return left / right;
      default:
        throw new Error(`Unknown binary operator: ${operator}`);
    }
  }
}

