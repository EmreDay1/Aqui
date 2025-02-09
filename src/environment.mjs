// environment.mjs
export class Environment {
    constructor() {
      this.parameters = new Map();
      this.shapes = new Map();
      this.layers = new Map();
    }
  
    getParameter(name) {
      if (!this.parameters.has(name)) {
        throw new Error(`Parameter not found: ${name}`);
      }
      return this.parameters.get(name);
    }
  
    setParameter(name, value) {
      this.parameters.set(name, value);
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
      if (!this.shapes.has(name)) {
        throw new Error(`Shape not found: ${name}`);
      }
      return this.shapes.get(name);
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
  