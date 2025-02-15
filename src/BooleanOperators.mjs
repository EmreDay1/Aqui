// BooleanOperators.mjs
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

class BooleanNaming {
    constructor() {
        this.operationSymbols = {
            'union': 'u',
            'difference': 'd',
            'intersection': 'i'
        };
        this.counter = new Map();
    }

    reset() {
        this.counter.clear();
    }

    getNextCount(operation) {
        const current = this.counter.get(operation) || 0;
        this.counter.set(operation, current + 1);
        return current + 1;
    }

    generateName(operation, shapes) {
        const opSymbol = this.operationSymbols[operation];
        const count = this.getNextCount(operation);
        return `${shapes[0]}_${opSymbol}${count}`;
    }
}

export class BooleanOperator {
    constructor() {
        this.epsilon = 0.0001;
        this.naming = new BooleanNaming();
    }

    createShapeInstance(shape) {
        switch (shape.type) {
            case 'rectangle':
                return new Rectangle(shape.params.width, shape.params.height);
            case 'circle':
                return new Circle(shape.params.radius);
            case 'triangle':
                return new Triangle(shape.params.base, shape.params.height);
            case 'ellipse':
                return new Ellipse(shape.params.radiusX, shape.params.radiusY);
            case 'polygon':
                return new RegularPolygon(shape.params.radius, shape.params.sides);
            case 'star':
                return new Star(shape.params.outerRadius, shape.params.innerRadius, shape.params.points);
            case 'arc':
                return new Arc(shape.params.radius, shape.params.startAngle, shape.params.endAngle);
            case 'roundedRectangle':
                return new RoundedRectangle(shape.params.width, shape.params.height, shape.params.radius);
            case 'arrow':
                return new Arrow(shape.params.length, shape.params.headWidth, shape.params.headLength);
            case 'donut':
                return new Donut(shape.params.outerRadius, shape.params.innerRadius);
            case 'spiral':
                return new Spiral(shape.params.startRadius, shape.params.endRadius, shape.params.turns);
            case 'cross':
                return new Cross(shape.params.width, shape.params.thickness);
            case 'wave':
                return new Wave(shape.params.width, shape.params.amplitude, shape.params.frequency);
            case 'slot':
                return new Slot(shape.params.length, shape.params.width);
            case 'chamferRectangle':
                return new ChamferRectangle(shape.params.width, shape.params.height, shape.params.chamfer);
            case 'polygonWithHoles':
                return new PolygonWithHoles(shape.params.outerPoints, shape.params.holes);
            default:
                throw new Error(`Unsupported shape type: ${shape.type}`);
        }
    }

    getPoints(shape) {
        // If it's a path type with points, return those points
        if (shape.type === 'path' && shape.params.points) {
            return shape.params.points;
        }

        // Create instance of the appropriate shape class
        const shapeInstance = this.createShapeInstance(shape);
        
        // Get points using the shape's built-in getPoints method
        const points = shapeInstance.getPoints();

        // Apply transformations and convert to [x,y] format
        return this.transformPoints(points, shape.transform);
    }

    transformPoints(points, transform) {
        if (!transform) return points.map(p => [p.x, p.y]);

        const { position, rotation, scale } = transform;
        return points.map(p => {
            // Scale
            let x = p.x * scale[0];
            let y = p.y * scale[1];
            
            // Rotate
            if (rotation) {
                const rad = rotation * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const rx = x * cos - y * sin;
                const ry = x * sin + y * cos;
                x = rx;
                y = ry;
            }
            
            // Translate
            x += position[0];
            y += position[1];
            
            return [x, y];
        });
    }

    isPointInPolygon(point, polygon) {
        let inside = false;
        const x = point[0], y = point[1];
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];
            
            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        return inside;
    }

    findIntersection(p1, p2, p3, p4) {
        const x1 = p1[0], y1 = p1[1];
        const x2 = p2[0], y2 = p2[1];
        const x3 = p3[0], y3 = p3[1];
        const x4 = p4[0], y4 = p4[1];

        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denominator) < this.epsilon) return null;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return [
                x1 + t * (x2 - x1),
                y1 + t * (y2 - y1)
            ];
        }

        return null;
    }

    findAllIntersections(shape1Points, shape2Points) {
        const intersections = [];
        
        for (let i = 0; i < shape1Points.length; i++) {
            const p1 = shape1Points[i];
            const p2 = shape1Points[(i + 1) % shape1Points.length];

            for (let j = 0; j < shape2Points.length; j++) {
                const p3 = shape2Points[j];
                const p4 = shape2Points[(j + 1) % shape2Points.length];

                const intersection = this.findIntersection(p1, p2, p3, p4);
                if (intersection) {
                    // Only add unique intersection points
                    if (!intersections.some(p => 
                        Math.abs(p[0] - intersection[0]) < this.epsilon && 
                        Math.abs(p[1] - intersection[1]) < this.epsilon
                    )) {
                        intersections.push(intersection);
                    }
                }
            }
        }

        return intersections;
    }
    
    removeDuplicatePoints(points) {
        return points.filter((point, index) => {
            // Check if this point is not a duplicate of any previous point
            return !points.some((otherPoint, otherIndex) => 
                index > otherIndex &&
                Math.abs(point[0] - otherPoint[0]) < this.epsilon &&
                Math.abs(point[1] - otherPoint[1]) < this.epsilon
            );
        });
    }

    removeDuplicates(points) {
        return points.filter((p1, i) => {
            return !points.some((p2, j) => {
                return i > j && 
                    Math.abs(p1[0] - p2[0]) < this.epsilon && 
                    Math.abs(p1[1] - p2[1]) < this.epsilon;
            });
        });
    }

    orderPoints(points) {
        if (points.length === 0) return points;

        // Calculate centroid
        const centroid = points.reduce(
            (acc, p) => [acc[0] + p[0], acc[1] + p[1]],
            [0, 0]
        ).map(v => v / points.length);

        // Sort points by angle from centroid
        return points.sort((a, b) => {
            const angleA = Math.atan2(a[1] - centroid[1], a[0] - centroid[0]);
            const angleB = Math.atan2(b[1] - centroid[1], b[0] - centroid[0]);
            return angleA - angleB;
        });
    }

    union(shapes) {
        const firstShape = shapes[0];
        let resultPoints = this.getPoints(firstShape);

        for (let i = 1; i < shapes.length; i++) {
            const nextShape = shapes[i];
            const nextPoints = this.getPoints(nextShape);
            const intersections = this.findAllIntersections(resultPoints, nextPoints);

            // Get boundary points
            let boundaryPoints = [];
            
            // Add points from first shape that are outside second shape
            resultPoints.forEach(p => {
                if (!this.isPointInPolygon(p, nextPoints)) {
                    boundaryPoints.push(p);
                }
            });

            // Add points from second shape that are outside first shape
            nextPoints.forEach(p => {
                if (!this.isPointInPolygon(p, resultPoints)) {
                    boundaryPoints.push(p);
                }
            });

            // Add intersection points
            boundaryPoints = [...boundaryPoints, ...intersections];

            // Remove duplicates
            boundaryPoints = this.removeDuplicates(boundaryPoints);

            // Order points by angle from centroid
            resultPoints = this.orderPoints(boundaryPoints);
        }

        return resultPoints;
    }




    difference(shapes) {
        if (shapes.length < 2) return null;

        const baseShape = shapes[0];
        const subtractShape = shapes[1];
        
        // Get points with high resolution for curved shapes
        const segments = 64; // Increase segments for smoother curves
        let resultPoints = this.getPoints(baseShape);
        let subtractPoints = this.getPoints(subtractShape);

        // Find all intersection points
        const intersections = this.findAllIntersections(resultPoints, subtractPoints);
        if (intersections.length === 0) {
            // If no intersections, either completely inside or outside
            if (this.isPointInPolygon(resultPoints[0], subtractPoints)) {
                return []; // Base shape is completely inside subtract shape
            }
            return resultPoints; // No intersection, return original shape
        }

        // Sort intersection points along the boundary
        const sortedIntersections = this.sortIntersectionPoints(intersections);

        // Build the result boundary
        let finalPoints = [];
        let isInside = this.isPointInPolygon(resultPoints[0], subtractPoints);
        
        // Add points from base shape when outside subtract shape
        for (let i = 0; i < resultPoints.length; i++) {
            const current = resultPoints[i];
            const next = resultPoints[(i + 1) % resultPoints.length];
            
            if (!isInside) {
                finalPoints.push(current);
            }

            // Check for intersections between current and next point
            const segmentIntersections = intersections.filter(p => 
                this.isPointOnSegment(p, current, next)
            );

            if (segmentIntersections.length > 0) {
                finalPoints.push(...segmentIntersections);
                isInside = !isInside;

                // If entering subtract shape, add boundary points from subtract shape
                if (isInside) {
                    const startPoint = segmentIntersections[0];
                    const endPoint = segmentIntersections[segmentIntersections.length - 1];
                    const subtractBoundary = this.getSubtractShapeBoundary(
                        subtractShape, 
                        startPoint, 
                        endPoint, 
                        resultPoints
                    );
                    finalPoints.push(...subtractBoundary);
                }
            }
        }

        // Remove duplicate points
        finalPoints = this.removeDuplicatePoints(finalPoints);

        // Order points counter-clockwise
        return this.orderPoints(finalPoints);
    }

    getSubtractShapeBoundary(subtractShape, startPoint, endPoint, basePoints) {
        const subtractPoints = this.getPoints(subtractShape);
        let boundary = [];
        let startIdx = -1;
        let endIdx = -1;

        // Find closest points on subtract shape to intersection points
        for (let i = 0; i < subtractPoints.length; i++) {
            const point = subtractPoints[i];
            if (this.distance(point, startPoint) < this.epsilon) {
                startIdx = i;
            }
            if (this.distance(point, endPoint) < this.epsilon) {
                endIdx = i;
            }
        }

        if (startIdx === -1 || endIdx === -1) return [];

        // Collect boundary points in correct direction
        let idx = startIdx;
        const length = subtractPoints.length;
        while (idx !== endIdx) {
            const point = subtractPoints[idx];
            if (!this.isPointInPolygon(point, basePoints)) {
                boundary.push(point);
            }
            idx = (idx + 1) % length;
        }
        boundary.push(subtractPoints[endIdx]);

        return boundary;
    }

    distance(p1, p2) {
        return Math.sqrt(
            Math.pow(p2[0] - p1[0], 2) + 
            Math.pow(p2[1] - p1[1], 2)
        );
    }

    isPointOnSegment(point, start, end) {
        const d1 = this.distance(point, start);
        const d2 = this.distance(point, end);
        const lineLen = this.distance(start, end);
        return Math.abs(d1 + d2 - lineLen) < this.epsilon;
    }

    sortIntersectionPoints(points) {
        return points.sort((a, b) => {
            if (Math.abs(a[0] - b[0]) < this.epsilon) {
                return a[1] - b[1];
            }
            return a[0] - b[0];
        });
    }


    orderPointsForDifference(points, intersections) {
        if (points.length < 3) return points;

        // Calculate centroid from all points except intersections
        const nonIntersectionPoints = points.filter(p => 
            !intersections.some(ip => 
                Math.abs(p[0] - ip[0]) < this.epsilon && 
                Math.abs(p[1] - ip[1]) < this.epsilon
            )
        );

        const centroid = nonIntersectionPoints.reduce(
            (acc, [x, y]) => ([acc[0] + x, acc[1] + y]), 
            [0, 0]
        ).map(v => v / nonIntersectionPoints.length);

        // Sort points by angle, but handle intersection points specially
        return points.sort((a, b) => {
            const angleA = Math.atan2(a[1] - centroid[1], a[0] - centroid[0]);
            const angleB = Math.atan2(b[1] - centroid[1], b[0] - centroid[0]);

            // If both points are intersections, maintain their relative order
            const aIsIntersection = intersections.some(ip => 
                Math.abs(ip[0] - a[0]) < this.epsilon && 
                Math.abs(ip[1] - a[1]) < this.epsilon
            );
            const bIsIntersection = intersections.some(ip => 
                Math.abs(ip[0] - b[0]) < this.epsilon && 
                Math.abs(ip[1] - b[1]) < this.epsilon
            );

            if (aIsIntersection && bIsIntersection) {
                // If angles are very close, keep original order
                if (Math.abs(angleA - angleB) < this.epsilon) {
                    return 0;
                }
            }

            return angleA - angleB;
        });
    }

    intersection(shapes) {
        const firstShape = shapes[0];
        let resultPoints = this.getPoints(firstShape);

        for (let i = 1; i < shapes.length; i++) {
            const nextShape = shapes[i];
            const nextPoints = this.getPoints(nextShape);
            const intersections = this.findAllIntersections(resultPoints, nextPoints);
            
            resultPoints = [
                ...resultPoints.filter(p => this.isPointInPolygon(p, nextPoints)),
                ...nextPoints.filter(p => this.isPointInPolygon(p, resultPoints)),
                ...intersections
            ];

            resultPoints = this.removeDuplicates(resultPoints);
            resultPoints = this.orderPoints(resultPoints);
        }

        return resultPoints;
    }

    createResultShape(points, operation, shapes) {
        const name = this.naming.generateName(
            operation, 
            shapes.map(s => s.name || 'shape')
        );
        
        return {
            type: 'path',
            name: name,
            params: {
                points: points,
                closed: true,
                operation: operation
            },
            transform: {
                position: [0, 0],
                rotation: 0,
                scale: [1, 1]
            }
        };
    }

    performOperation(operation, shapes) {
        if (!Array.isArray(shapes) || shapes.length < 2) {
            throw new Error(`${operation} operation requires at least two shapes`);
        }

        let resultPoints;
        switch (operation) {
            case 'union':
                resultPoints = this.union(shapes);
                break;
            case 'difference':
                resultPoints = this.difference(shapes);
                break;
            case 'intersection':
                resultPoints = this.intersection(shapes);
                break;
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }

        return this.createResultShape(resultPoints, operation, shapes);
    }

    // Public API methods
    performDifference(shapes) {
        const resultPoints = this.difference(shapes);
        return this.createResultShape(resultPoints, 'difference', shapes);
    }

    performUnion(shapes) {
        const resultPoints = this.union(shapes);
        return this.createResultShape(resultPoints, 'union', shapes);
    }

    performIntersection(shapes) {
        const resultPoints = this.intersection(shapes);
        return this.createResultShape(resultPoints, 'intersection', shapes);
    }


    resetNaming() {
        this.naming.reset();
    }
}

// Export singleton instance
export const booleanOperator = new BooleanOperator();
