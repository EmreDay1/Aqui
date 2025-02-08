// Base Shape class with common functionality
class Shape {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.rotation = 0;
        this.scale = { x: 1, y: 1 };
    }

    translate(dx, dy) {
        this.position.x += dx;
        this.position.y += dy;
        return this;
    }

    rotate(angle) {
        this.rotation = (this.rotation + angle) % 360;
        return this;
    }

    setScale(sx, sy) {
        this.scale.x = sx;
        this.scale.y = sy;
        return this;
    }

    getBoundingBox() {
        // To be implemented by subclasses
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    // Helper method to transform points
    transformPoint(point) {
        const rad = this.rotation * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        // Apply scale
        const scaledX = point.x * this.scale.x;
        const scaledY = point.y * this.scale.y;
        
        // Apply rotation
        const rotatedX = scaledX * cos - scaledY * sin;
        const rotatedY = scaledX * sin + scaledY * cos;
        
        // Apply translation
        return {
            x: rotatedX + this.position.x,
            y: rotatedY + this.position.y
        };
    }
}

// 1. Rectangle
class Rectangle extends Shape {
    constructor(width, height) {
        super();
        this.width = width;
        this.height = height;
    }

    getPoints() {
        const points = [
            { x: -this.width/2, y: -this.height/2 },
            { x: this.width/2, y: -this.height/2 },
            { x: this.width/2, y: this.height/2 },
            { x: -this.width/2, y: this.height/2 }
        ];
        return points.map(p => this.transformPoint(p));
    }
}

// 2. Circle
class Circle extends Shape {
    constructor(radius) {
        super();
        this.radius = radius;
    }

    getPoints(segments = 32) {
        const points = [];
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push({
                x: Math.cos(angle) * this.radius,
                y: Math.sin(angle) * this.radius
            });
        }
        return points.map(p => this.transformPoint(p));
    }
}

// 3. Triangle
class Triangle extends Shape {
    constructor(base, height) {
        super();
        this.base = base;
        this.height = height;
    }

    getPoints() {
        const points = [
            { x: -this.base/2, y: -this.height/2 },
            { x: this.base/2, y: -this.height/2 },
            { x: 0, y: this.height/2 }
        ];
        return points.map(p => this.transformPoint(p));
    }
}

// 4. Ellipse
class Ellipse extends Shape {
    constructor(radiusX, radiusY) {
        super();
        this.radiusX = radiusX;
        this.radiusY = radiusY;
    }

    getPoints(segments = 32) {
        const points = [];
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push({
                x: Math.cos(angle) * this.radiusX,
                y: Math.sin(angle) * this.radiusY
            });
        }
        return points.map(p => this.transformPoint(p));
    }
}

// 5. Regular Polygon
class RegularPolygon extends Shape {
    constructor(radius, sides) {
        super();
        this.radius = radius;
        this.sides = sides;
    }

    getPoints() {
        const points = [];
        for (let i = 0; i < this.sides; i++) {
            const angle = (i / this.sides) * Math.PI * 2;
            points.push({
                x: Math.cos(angle) * this.radius,
                y: Math.sin(angle) * this.radius
            });
        }
        return points.map(p => this.transformPoint(p));
    }
}

// 6. Star
class Star extends Shape {
    constructor(outerRadius, innerRadius, points) {
        super();
        this.outerRadius = outerRadius;
        this.innerRadius = innerRadius;
        this.points = points;
    }

    getPoints() {
        const points = [];
        for (let i = 0; i < this.points * 2; i++) {
            const angle = (i / (this.points * 2)) * Math.PI * 2;
            const radius = i % 2 === 0 ? this.outerRadius : this.innerRadius;
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        return points.map(p => this.transformPoint(p));
    }
}

// 7. Arc
class Arc extends Shape {
    constructor(radius, startAngle, endAngle) {
        super();
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
    }

    getPoints(segments = 32) {
        const points = [];
        const angleSpan = this.endAngle - this.startAngle;
        for (let i = 0; i <= segments; i++) {
            const angle = this.startAngle + (i / segments) * angleSpan;
            const rad = angle * Math.PI / 180;
            points.push({
                x: Math.cos(rad) * this.radius,
                y: Math.sin(rad) * this.radius
            });
        }
        return points.map(p => this.transformPoint(p));
    }
}

// 8. RoundedRectangle
class RoundedRectangle extends Shape {
    constructor(width, height, radius) {
        super();
        this.width = width;
        this.height = height;
        this.radius = Math.min(radius, width/2, height/2);
    }

    getPoints(segmentsPerCorner = 8) {
        const points = [];
        const w = this.width/2;
        const h = this.height/2;
        const r = this.radius;

        // Helper function for corner arcs
        const addCorner = (centerX, centerY, startAngle) => {
            for (let i = 0; i <= segmentsPerCorner; i++) {
                const angle = startAngle + (i / segmentsPerCorner) * Math.PI/2;
                points.push({
                    x: centerX + Math.cos(angle) * r,
                    y: centerY + Math.sin(angle) * r
                });
            }
        };

        // Top right corner
        addCorner(w - r, -h + r, 0);
        // Bottom right corner
        addCorner(w - r, h - r, Math.PI/2);
        // Bottom left corner
        addCorner(-w + r, h - r, Math.PI);
        // Top left corner
        addCorner(-w + r, -h + r, -Math.PI/2);

        return points.map(p => this.transformPoint(p));
    }
}

// 9. Path
class Path extends Shape {
    constructor() {
        super();
        this.points = [];
        this.closed = false;
    }

    addPoint(x, y) {
        this.points.push({ x, y });
        return this;
    }

    close() {
        this.closed = true;
        return this;
    }

    getPoints() {
        return this.points.map(p => this.transformPoint(p));
    }
}

// 10. Arrow
class Arrow extends Shape {
    constructor(length, headWidth, headLength) {
        super();
        this.length = length;
        this.headWidth = headWidth;
        this.headLength = headLength;
    }

    getPoints() {
        const points = [
            { x: 0, y: 0 },
            { x: this.length - this.headLength, y: 0 },
            { x: this.length - this.headLength, y: -this.headWidth/2 },
            { x: this.length, y: 0 },
            { x: this.length - this.headLength, y: this.headWidth/2 },
            { x: this.length - this.headLength, y: 0 }
        ];
        return points.map(p => this.transformPoint(p));
    }
}

// 11. Text (Bounding box for text)
class Text extends Shape {
    constructor(text, fontSize = 12, fontFamily = 'Arial') {
        super();
        this.text = text;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        // Rough estimation of text dimensions
        this.width = this.fontSize * 0.6 * this.text.length;
        this.height = this.fontSize;
    }

    getBoundingBox() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height
        };
    }
}

// 12. Bezier Curve
class BezierCurve extends Shape {
    constructor(startPoint, controlPoint1, controlPoint2, endPoint) {
        super();
        this.startPoint = startPoint;
        this.controlPoint1 = controlPoint1;
        this.controlPoint2 = controlPoint2;
        this.endPoint = endPoint;
    }

    getPoints(segments = 32) {
        const points = [];
        for (let t = 0; t <= 1; t += 1/segments) {
            const point = this.calculateBezierPoint(t);
            points.push(point);
        }
        return points.map(p => this.transformPoint(p));
    }

    calculateBezierPoint(t) {
        const x = Math.pow(1-t, 3) * this.startPoint.x +
                 3 * Math.pow(1-t, 2) * t * this.controlPoint1.x +
                 3 * (1-t) * Math.pow(t, 2) * this.controlPoint2.x +
                 Math.pow(t, 3) * this.endPoint.x;
        const y = Math.pow(1-t, 3) * this.startPoint.y +
                 3 * Math.pow(1-t, 2) * t * this.controlPoint1.y +
                 3 * (1-t) * Math.pow(t, 2) * this.controlPoint2.y +
                 Math.pow(t, 3) * this.endPoint.y;
        return { x, y };
    }
}

// 13. Donut (Annulus)
class Donut extends Shape {
    constructor(outerRadius, innerRadius) {
        super();
        this.outerRadius = outerRadius;
        this.innerRadius = innerRadius;
    }

    getPoints(segments = 32) {
        const points = [];
        // Outer circle
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push({
                x: Math.cos(angle) * this.outerRadius,
                y: Math.sin(angle) * this.outerRadius
            });
        }
        // Inner circle (in reverse to create hole)
        for (let i = segments - 1; i >= 0; i--) {
            const angle = (i / segments) * Math.PI * 2;
            points.push({
                x: Math.cos(angle) * this.innerRadius,
                y: Math.sin(angle) * this.innerRadius
            });
        }
        return points.map(p => this.transformPoint(p));
    }
}

// 14. Spiral
class Spiral extends Shape {
    constructor(startRadius, endRadius, turns) {
        super();
        this.startRadius = startRadius;
        this.endRadius = endRadius;
        this.turns = turns;
    }

    getPoints(segments = 100) {
        const points = [];
        const totalAngle = this.turns * Math.PI * 2;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * totalAngle;
            const radius = this.startRadius + (this.endRadius - this.startRadius) * t;
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        return points.map(p => this.transformPoint(p));
    }
}

// 15. Cross
class Cross extends Shape {
    constructor(width, thickness) {
        super();
        this.width = width;
        this.thickness = thickness;
    }

    getPoints() {
        const w = this.width/2;
        const t = this.thickness/2;
        const points = [
            { x: -t, y: -w }, { x: t, y: -w },
            { x: t, y: -t }, { x: w, y: -t },
            { x: w, y: t }, { x: t, y: t },
            { x: t, y: w }, { x: -t, y: w },
            { x: -t, y: t }, { x: -w, y: t },
            { x: -w, y: -t }, { x: -t, y: -t }
        ];
        return points.map(p => this.transformPoint(p));
    }
}

// 16. Gear
class Gear extends Shape {
    constructor(pitch_diameter, teeth, pressure_angle = 20, shaft_config = { type: 'circle', size: null }) {
        super();
        this.pitch_diameter = pitch_diameter;
        this.teeth = teeth;
        this.pressure_angle = pressure_angle * Math.PI / 180;
        this.addendum = this.pitch_diameter / this.teeth;
        this.dedendum = 1.25 * this.addendum;
        this.shaft_config = {
            type: shaft_config.type || 'circle',
            size: shaft_config.size || (pitch_diameter * 0.2) // Default 20% of pitch diameter
        };

        // Validate shaft type
        if (!['circle', 'square'].includes(this.shaft_config.type)) {
            throw new Error('Invalid shaft type. Must be "circle" or "square"');
        }
    }

    getPoints(points_per_tooth = 4) {
        const points = [];
        const pitch_point = this.pitch_diameter / 2;
        const base_radius = pitch_point * Math.cos(this.pressure_angle);
        const outer_radius = pitch_point + this.addendum;
        const root_radius = pitch_point - this.dedendum;

        // Generate gear teeth
        for (let i = 0; i < this.teeth; i++) {
            const angle = (i / this.teeth) * Math.PI * 2;
            for (let j = 0; j < points_per_tooth; j++) {
                const t = j / points_per_tooth;
                const tooth_angle = (Math.PI * 2) / (this.teeth * 2);
                const current_angle = angle + tooth_angle * t;
                
                // Generate tooth profile
                const radius = t < 0.5 ? outer_radius : root_radius;
                points.push({
                    x: Math.cos(current_angle) * radius,
                    y: Math.sin(current_angle) * radius
                });
            }
        }

        // Add shaft points
        const shaft_points = this.getShaftPoints();
        points.push(...shaft_points);

        return points.map(p => this.transformPoint(p));
    }

    getShaftPoints() {
        const points = [];
        const size = this.shaft_config.size;

        switch (this.shaft_config.type) {
            case 'circle':
                // Generate circle points (32 segments)
                for (let i = 0; i <= 32; i++) {
                    const angle = (i / 32) * Math.PI * 2;
                    points.push({
                        x: Math.cos(angle) * (size / 2),
                        y: Math.sin(angle) * (size / 2)
                    });
                }
                break;

            case 'square':
                // Generate square points
                const half_size = size / 2;
                points.push(
                    { x: -half_size, y: -half_size },
                    { x: half_size, y: -half_size },
                    { x: half_size, y: half_size },
                    { x: -half_size, y: half_size },
                    { x: -half_size, y: -half_size }  // Close the square
                );
                break;
        }

        return points;
    }

    // Static helper method for gear calculations
    static calculateSpec(module) {
        return {
            pitch_diameter: module * this.teeth,
            addendum: module,
            dedendum: 1.25 * module,
            recommended_shaft_size: module * 3
        };
    }
}
// 17. Wave
class Wave extends Shape {
    constructor(width, amplitude, frequency) {
        super();
        this.width = width;
        this.amplitude = amplitude;
        this.frequency = frequency;
    }

    getPoints(segments = 50) {
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const x = (i / segments) * this.width - this.width/2;
            const y = Math.sin((x * this.frequency * Math.PI * 2) / this.width) * this.amplitude;
            points.push({ x, y });
        }
        return points.map(p => this.transformPoint(p));
    }
}

// 18. Slot
class Slot extends Shape {
    constructor(length, width) {
        super();
        this.length = length;
        this.width = width;
        this.radius = width/2;
    }

    getPoints(segments = 32) {
        const points = [];
        const centerDist = (this.length - this.width)/2;

        // Add first semicircle
        for (let i = 0; i <= segments/2; i++) {
            const angle = Math.PI + (i / (segments/2)) * Math.PI;
            points.push({
                x: -centerDist + Math.cos(angle) * this.radius,
                y: Math.sin(angle) * this.radius
            });
        }

        // Add second semicircle
        for (let i = 0; i <= segments/2; i++) {
            const angle = (i / (segments/2)) * Math.PI;
            points.push({
                x: centerDist + Math.cos(angle) * this.radius,
                y: Math.sin(angle) * this.radius
            });
        }

        return points.map(p => this.transformPoint(p));
    }
}

// 19. Chamfer Rectangle
class ChamferRectangle extends Shape {
    constructor(width, height, chamfer) {
        super();
        this.width = width;
        this.height = height;
        this.chamfer = Math.min(chamfer, width/2, height/2);
    }

    getPoints() {
        const w = this.width/2;
        const h = this.height/2;
        const c = this.chamfer;
        
        const points = [
            { x: -w + c, y: -h },
            { x: w - c, y: -h },
            { x: w, y: -h + c },
            { x: w, y: h - c },
            { x: w - c, y: h },
            { x: -w + c, y: h },
            { x: -w, y: h - c },
            { x: -w, y: -h + c }
        ];
        
        return points.map(p => this.transformPoint(p));
    }
}

// 20. Polygon with Holes
class PolygonWithHoles extends Shape {
    constructor(outerPoints, holes = []) {
        super();
        this.outerPoints = outerPoints;
        this.holes = holes; // Array of arrays of points
    }

    getPoints() {
        let allPoints = [...this.outerPoints];
        
        // Add holes in reverse order to create proper path
        this.holes.forEach(hole => {
            allPoints.push(allPoints[0]); // Bridge to hole
            allPoints.push(...hole.reverse()); // Add hole points
            allPoints.push(hole[0]); // Close hole
        });
        
        return allPoints.map(p => this.transformPoint(p));
    }
}

// Utility functions for shape operations
const ShapeUtils = {
    // Boolean operations
    union(shape1, shape2) {
        // Implementation would require complex polygon clipping library
        throw new Error("Boolean operations require additional geometry library");
    },

    // Distance between shapes
    distance(shape1, shape2) {
        const bb1 = shape1.getBoundingBox();
        const bb2 = shape2.getBoundingBox();
        
        return Math.sqrt(
            Math.pow(bb1.x - bb2.x, 2) + 
            Math.pow(bb1.y - bb2.y, 2)
        );
    },

    // Check if point is inside shape
    pointInShape(point, shape) {
        const points = shape.getPoints();
        let inside = false;
        
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            
            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        return inside;
    },

    // Convert shape to SVG path
    toSVGPath(shape) {
        const points = shape.getPoints();
        if (points.length === 0) return '';
        
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
        }
        path += ' Z';
        
        return path;
    }
};

export {
    Shape,
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
    Gear,
    Wave,
    Slot,
    ChamferRectangle,
    PolygonWithHoles,
    ShapeUtils
};
