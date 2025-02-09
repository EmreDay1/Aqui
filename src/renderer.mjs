// renderer.mjs
export class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.scale = 1;
      this.offsetX = canvas.width / 2;
      this.offsetY = canvas.height / 2;
    }
  
    clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawGrid();
      this.drawAxes();
    }
  
    drawGrid() {
      this.ctx.strokeStyle = '#e0e0e0';
      this.ctx.lineWidth = 1;
      for (let x = -400; x <= 400; x += 50) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.transformX(x), this.transformY(-300));
        this.ctx.lineTo(this.transformX(x), this.transformY(300));
        this.ctx.stroke();
      }
      for (let y = -300; y <= 300; y += 50) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.transformX(-400), this.transformY(y));
        this.ctx.lineTo(this.transformX(400), this.transformY(y));
        this.ctx.stroke();
      }
    }
  
    drawAxes() {
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      // X axis
      this.ctx.beginPath();
      this.ctx.moveTo(this.transformX(-400), this.transformY(0));
      this.ctx.lineTo(this.transformX(400), this.transformY(0));
      this.ctx.stroke();
      // Y axis
      this.ctx.beginPath();
      this.ctx.moveTo(this.transformX(0), this.transformY(-300));
      this.ctx.lineTo(this.transformX(0), this.transformY(300));
      this.ctx.stroke();
    }
  
    transformX(x) {
      return x * this.scale + this.offsetX;
    }
  
    transformY(y) {
      return -y * this.scale + this.offsetY;
    }
  
    drawShape(shape) {
      const { type, params, transform } = shape;
      this.ctx.save();
      this.ctx.translate(
        this.transformX(transform.position[0]),
        this.transformY(transform.position[1])
      );
      this.ctx.rotate(-transform.rotation * Math.PI / 180);
      this.ctx.scale(transform.scale[0], transform.scale[1]);
  
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  
      switch (type) {
        case 'rectangle':
          this.drawRectangle(params);
          break;
        case 'circle':
          this.drawCircle(params);
          break;
        case 'triangle':
          this.drawTriangle(params);
          break;
        case 'ellipse':
          this.drawEllipse(params);
          break;
        case 'gear':
          this.drawGear(params);
          break;
        default:
          console.warn(`Unknown shape type: ${type}`);
      }
  
      this.ctx.restore();
    }
  
    drawRectangle(params) {
      const { width, height } = params;
      this.ctx.beginPath();
      this.ctx.rect(-width / 2, -height / 2, width, height);
      this.ctx.stroke();
      this.ctx.fill();
    }
  
    drawCircle(params) {
      const { radius } = params;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.fill();
    }
  
    drawTriangle(params) {
      const { base, height } = params;
      this.ctx.beginPath();
      this.ctx.moveTo(-base / 2, height / 2);
      this.ctx.lineTo(base / 2, height / 2);
      this.ctx.lineTo(0, -height / 2);
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.fill();
    }
  
    drawEllipse(params) {
      const { radiusX, radiusY } = params;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.fill();
    }
  
    // Gear drawing using an involute profile and shaft support.
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
  
      // Compute the involute from the base circle to the addendum circle.
      const t_max = Math.sqrt((r_a / r_b) ** 2 - 1);
      const numSamples = 20;
      let involutePoints = [];
      for (let i = 0; i <= numSamples; i++) {
        let t = t_max * i / numSamples;
        let x = r_b * (Math.cos(t) + t * Math.sin(t));
        let y = r_b * (Math.sin(t) - t * Math.cos(t));
        involutePoints.push({ x, y });
      }
  
      // Utility: rotate a point by a given angle (in radians)
      function rotatePoint(pt, angle) {
        return {
          x: pt.x * Math.cos(angle) - pt.y * Math.sin(angle),
          y: pt.x * Math.sin(angle) + pt.y * Math.cos(angle)
        };
      }
  
      // Build tooth profile: right flank and left flank.
      let rightFlank = involutePoints.map(pt => rotatePoint(pt, -halfToothAngle));
      let leftFlank = involutePoints.map(pt => rotatePoint({ x: pt.x, y: -pt.y }, halfToothAngle));
      leftFlank.reverse();
      let toothProfile = rightFlank.concat(leftFlank);
  
      // Repeat the tooth profile around the gear.
      let gearProfile = [];
      for (let i = 0; i < N; i++) {
        const angleOffset = (2 * Math.PI * i) / N;
        let rotatedTooth = toothProfile.map(pt => rotatePoint(pt, angleOffset));
        gearProfile = gearProfile.concat(rotatedTooth);
      }
  
      // Draw the gear outline.
      this.ctx.save();
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
      // Draw the root circle.
      this.ctx.beginPath();
      this.ctx.arc(0, 0, r_f, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
  
      // Draw the shaft if specified.
      if (params.shaft) {
        const shaftType = params.shaft.toLowerCase();
        const shaftSize = params.shaftSize !== undefined ? params.shaftSize : 0.5 * m;
        this.ctx.save();
        this.ctx.strokeStyle = '#000';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
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
        } else {
          console.warn(`Unknown shaft type "${params.shaft}". Expected "circle" or "square".`);
        }
        this.ctx.restore();
      }
    }
  }
  
