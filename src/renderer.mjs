// renderer.mjs
import {
  Rectangle,
  Circle,
  Triangle,
  Ellipse,
  RegularPolygon,
  Star,
  Arc,
  RoundedRectangle,
  Path,
  Arrow,
  Text,
  BezierCurve,
  Donut,
  Spiral,
  Cross,
  Wave,
  Slot,
  ChamferRectangle,
  PolygonWithHoles
} from './Shapes.mjs';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.setupCanvas();
    window.addEventListener('resize', () => this.setupCanvas());
  }

  setupCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    
    // Center point
    this.offsetX = this.canvas.width / 2;
    this.offsetY = this.canvas.height / 2;
    
    // Scale to fit -300 to 300 vertically
    this.scale = this.canvas.height / 600;
    
    this.clear();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawGrid();
    this.drawAxes();
  }

  drawBackground() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid() {
    const gridSize = 50 * this.scale;
    const numX = Math.ceil(this.canvas.width / gridSize);
    const numY = Math.ceil(this.canvas.height / gridSize);

    this.ctx.strokeStyle = '#e5e5e5';
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let i = -numX; i <= numX; i++) {
      const x = this.offsetX + i * gridSize;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let i = -numY; i <= numY; i++) {
      const y = this.offsetY + i * gridSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  drawAxes() {
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;

    // X axis
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.offsetY);
    this.ctx.lineTo(this.canvas.width, this.offsetY);
    this.ctx.stroke();

    // Y axis
    this.ctx.beginPath();
    this.ctx.moveTo(this.offsetX, 0);
    this.ctx.lineTo(this.offsetX, this.canvas.height);
    this.ctx.stroke();
  }

  // Transform world coordinates to screen coordinates
  transformX(x) {
    return x * this.scale + this.offsetX;
  }

  transformY(y) {
    return -y * this.scale + this.offsetY;
  }

  // Main shape drawing method
  drawShape(shape) {
    const { type, params, transform } = shape;
    
    this.ctx.save();
    this.ctx.translate(
      this.transformX(transform.position[0]),
      this.transformY(transform.position[1])
    );
    this.ctx.rotate(-transform.rotation * Math.PI / 180);
    this.ctx.scale(transform.scale[0], transform.scale[1]);

    switch (type) {
      case 'text':
        this.drawText(params);
        break;
      case 'gear':
        this.drawGear(params);
        break;
      case 'path':
        this.drawPath(params);
        break;
      case 'bezier':
        this.drawBezier(params);
        break;
      default:
        this.drawGenericShape(type, params);
    }

    this.ctx.restore();
  }

  // Draw generic shape using Shape classes
  drawGenericShape(type, params) {
    const shapeInstance = this.createShapeInstance(type, params);
    if (!shapeInstance) return;

    const points = shapeInstance.getPoints();
    if (!points || points.length === 0) return;

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    if (!['arc', 'path', 'wave'].includes(type)) {
      this.ctx.closePath();
    }

    this.ctx.stroke();
    this.ctx.fill();
  }

  // Create appropriate shape instance
  createShapeInstance(type, params) {
    switch (type) {
      case 'rectangle':
        return new Rectangle(params.width, params.height);
      case 'circle':
        return new Circle(params.radius);
      case 'triangle':
        return new Triangle(params.base, params.height);
      case 'ellipse':
        return new Ellipse(params.radiusX, params.radiusY);
      case 'polygon':
        return new RegularPolygon(params.radius, params.sides);
      case 'star':
        return new Star(params.outerRadius, params.innerRadius, params.points);
      case 'arc':
        return new Arc(params.radius, params.startAngle, params.endAngle);
      case 'roundedRectangle':
        return new RoundedRectangle(params.width, params.height, params.radius);
      case 'arrow':
        return new Arrow(params.length, params.headWidth, params.headLength);
      case 'donut':
        return new Donut(params.outerRadius, params.innerRadius);
      case 'spiral':
        return new Spiral(params.startRadius, params.endRadius, params.turns);
      case 'cross':
        return new Cross(params.width, params.thickness);
      case 'wave':
        return new Wave(params.width, params.amplitude, params.frequency);
      case 'slot':
        return new Slot(params.length, params.width);
      case 'chamferRectangle':
        return new ChamferRectangle(params.width, params.height, params.chamfer);
      case 'polygonWithHoles':
        return new PolygonWithHoles(params.outerPoints, params.holes);
      default:
        console.warn(`Unknown shape type: ${type}`);
        return null;
    }
  }

  // Draw text
  drawText(params) {
    const { text, fontSize = 12, fontFamily = 'Arial' } = params;
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.strokeText(text, 0, 0);
  }

  // Draw path
  drawPath(params) {
    const { points } = params;
    if (!points || points.length < 2) return;

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0][0], points[0][1]);
    
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i][0], points[i][1]);
    }
    
    this.ctx.stroke();
  }

  // Draw bezier curve
  drawBezier(params) {
    const { startPoint, controlPoint1, controlPoint2, endPoint } = params;
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(startPoint.x, startPoint.y);
    this.ctx.bezierCurveTo(
      controlPoint1.x, controlPoint1.y,
      controlPoint2.x, controlPoint2.y,
      endPoint.x, endPoint.y
    );
    this.ctx.stroke();
  }

  // Draw gear
  drawGear(params) {
    const N = params.teeth;
    const pitchDiameter = params.diameter;
    const r = pitchDiameter / 2;
    const m = pitchDiameter / N;
    const addendum = m;
    const dedendum = 1.25 * m;
    const r_a = r + addendum;
    const r_f = r - dedendum;
    const pressureAngle = 20 * Math.PI / 180;
    const r_b = r * Math.cos(pressureAngle);
    const halfToothAngle = Math.PI / (2 * N);

    // Generate involute profile
    const t_max = Math.sqrt((r_a / r_b) ** 2 - 1);
    const numSamples = 20;
    let involutePoints = [];
    
    for (let i = 0; i <= numSamples; i++) {
      let t = t_max * i / numSamples;
      let x = r_b * (Math.cos(t) + t * Math.sin(t));
      let y = r_b * (Math.sin(t) - t * Math.cos(t));
      involutePoints.push({ x, y });
    }

    // Rotate point helper
    const rotatePoint = (pt, angle) => ({
      x: pt.x * Math.cos(angle) - pt.y * Math.sin(angle),
      y: pt.x * Math.sin(angle) + pt.y * Math.cos(angle)
    });

    // Create tooth profile
    let rightFlank = involutePoints.map(pt => rotatePoint(pt, -halfToothAngle));
    let leftFlank = involutePoints.map(pt => rotatePoint({ x: pt.x, y: -pt.y }, halfToothAngle));
    leftFlank.reverse();
    let toothProfile = rightFlank.concat(leftFlank);

    // Generate full gear
    let gearProfile = [];
    for (let i = 0; i < N; i++) {
      const angleOffset = (2 * Math.PI * i) / N;
      let rotatedTooth = toothProfile.map(pt => rotatePoint(pt, angleOffset));
      gearProfile = gearProfile.concat(rotatedTooth);
    }

    // Draw gear outline
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';

    this.ctx.beginPath();
    if (gearProfile.length > 0) {
      this.ctx.moveTo(gearProfile[0].x, gearProfile[0].y);
      for (let i = 1; i < gearProfile.length; i++) {
        this.ctx.lineTo(gearProfile[i].x, gearProfile[i].y);
      }
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.fill();
    }

    // Draw root circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r_f, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw shaft if specified
    if (params.shaft) {
      const shaftType = params.shaft.toLowerCase();
      const shaftSize = params.shaftSize || 0.5 * m;
      
      if (shaftType === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, shaftSize / 2, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fill();
      } else if (shaftType === 'square') {
        const halfSize = shaftSize / 2;
        this.ctx.beginPath();
        this.ctx.rect(-halfSize, -halfSize, shaftSize, shaftSize);
        this.ctx.stroke();
        this.ctx.fill();
      }
    }
  }
}
