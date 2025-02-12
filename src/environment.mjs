export class Environment {
  constructor() {
      this.parameters = new Map();
      this.shapes = new Map();
      this.layers = new Map();
      this.currentLayerName = null;  
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

  addShape(name, shape) {
      if (this.currentLoopCounter !== undefined) {
          name = `${name}_${this.currentLoopCounter}`;
      }
      this.shapes.set(name, shape);
      return shape;
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
          },
          layerName: null  // Track which layer this shape belongs to
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
          addedShapes: new Set(),  // Track only explicitly added shapes
          operations: [],
          transform: {
              position: [0, 0],
              rotation: 0,
              scale: [1, 1]
          }
      };
      this.layers.set(name, layer);
      this.currentLayerName = name;
      return layer;
  }

  // New method to add shape to layer
  addShapeToLayer(layerName, shapeName) {
      const layer = this.layers.get(layerName);
      if (!layer) {
          throw new Error(`Layer not found: ${layerName}`);
      }
      layer.addedShapes.add(shapeName);
      const shape = this.shapes.get(shapeName);
      if (shape) {
          shape.layerName = layerName;
      }
  }

  // Method to check if shape is in layer
  isShapeInLayer(shapeName, layerName) {
      const layer = this.layers.get(layerName);
      return layer && layer.addedShapes.has(shapeName);
  }

  // Modified to only transform shapes explicitly added to layer
  transformShape(name, transform) {
      const shape = this.getShape(name);
      if (!shape) return;

      // Only apply layer transform if shape was explicitly added to layer
      if (shape.layerName && this.isShapeInLayer(name, shape.layerName)) {
          const layer = this.layers.get(shape.layerName);
          shape.transform = {
              ...transform,
              rotation: transform.rotation + layer.transform.rotation,
              scale: [
                  transform.scale[0] * layer.transform.scale[0],
                  transform.scale[1] * layer.transform.scale[1]
              ],
              position: [
                  transform.position[0] + layer.transform.position[0],
                  transform.position[1] + layer.transform.position[1]
              ]
          };
      } else {
          shape.transform = transform;
      }
  }
}
