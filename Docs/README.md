# Aqui Programming Language Documentation

## Overview
Aqui is a domain-specific programming language designed for parametric shape creation and graphical design. It allows users to define parameters, shapes, and transformations through a structured syntax. The Aqui interpreter processes the input and renders the resulting graphics on an HTML5 Canvas.

## Core Concepts
### **1. Parameters (`param`)
Parameters allow defining variables that can be used throughout the script.
#### **Syntax:**
```aqui
param size 100
param isVisible true
param color "red"
```
- `size` is a numerical parameter.
- `isVisible` is a boolean parameter.
- `color` is a string parameter.

Parameters can be referenced using `param.name` inside shapes or conditions.

### **2. Shapes (`shape`)
Shapes define geometric elements with configurable properties.
#### **Syntax:**
```aqui
shape circle myCircle {
    radius: 30
    position: [50 50]
}
```
- `shape` is the keyword.
- `circle` is the shape type.
- `myCircle` is the shape name.
- Properties such as `radius` and `position` define the shape’s attributes.

### **3. Layers (`layer`)
Layers are used to group multiple shapes and apply transformations collectively.
#### **Syntax:**
```aqui
layer main {
    add myCircle
    rotate 45
}
```
- `add myCircle` adds a shape to the layer.
- `rotate 45` applies a 45-degree rotation to all elements in the layer.

### **4. Transformations (`transform`)
Transformations modify the properties of shapes and layers.
#### **Syntax:**
```aqui
transform myCircle {
    scale: 2
    rotate: 30
}
```
- `scale: 2` doubles the size of the shape.
- `rotate: 30` rotates the shape by 30 degrees.

### **5. Conditional Statements (`if-else`)
Aqui supports conditional statements to dynamically create shapes.
#### **Syntax:**
```aqui
if param.size > 50 {
    shape circle bigCircle {
        radius: param.size
        position: [100 100]
    }
} else {
    shape circle smallCircle {
        radius: param.size / 2
        position: [100 100]
    }
}
```
- If `size` is greater than 50, `bigCircle` is created.
- Otherwise, `smallCircle` is created.

## Shape Classes
Aqui supports 20 predefined shape classes:

### **1. Rectangle**
```aqui
shape rectangle myRect {
    width: 100
    height: 50
    position: [50 50]
}
```
- Defines a rectangle with width, height, and position.

### **2. Circle**
```aqui
shape circle myCircle {
    radius: 30
    position: [50 50]
}
```
- Defines a circle with a radius and position.

### **3. Triangle**
```aqui
shape triangle myTriangle {
    base: 60
    height: 80
    position: [50 50]
}
```
- Defines a triangle with a base and height.

### **4. Ellipse**
```aqui
shape ellipse myEllipse {
    radiusX: 40
    radiusY: 20
    position: [50 50]
}
```
- Defines an ellipse with different X and Y radii.

### **5. Regular Polygon**
```aqui
shape polygon myPolygon {
    radius: 50
    sides: 6
    position: [50 50]
}
```
- Defines a regular polygon with a specific number of sides.

### **6. Star**
```aqui
shape star myStar {
    outerRadius: 50
    innerRadius: 20
    points: 5
    position: [50 50]
}
```
- Defines a star with outer and inner radii and number of points.

### **7. Arc**
```aqui
shape arc myArc {
    radius: 50
    startAngle: 0
    endAngle: 180
    position: [50 50]
}
```
- Defines an arc with a radius and start/end angles.

### **8. Rounded Rectangle**
```aqui
shape roundedRectangle myRoundRect {
    width: 100
    height: 50
    radius: 10
    position: [50 50]
}
```
- Defines a rectangle with rounded corners.

### **9. Path**
```aqui
shape path myPath {
    points: [
        [0 0],
        [50 50],
        [100 0]
    ]
}
```
- Defines a custom path with multiple points.

### **10. Arrow**
```aqui
shape arrow myArrow {
    length: 100
    headWidth: 20
    headLength: 30
    position: [50 50]
}
```
- Defines an arrow shape.

### **11. Text**
```aqui
shape text myText {
    text: "Hello Aqui"
    fontSize: 20
    position: [50 50]
}
```
- Defines a text shape.

### **12. Bezier Curve**
```aqui
shape bezier myBezier {
    startPoint: [0 0]
    controlPoint1: [50 100]
    controlPoint2: [100 100]
    endPoint: [150 0]
}
```
- Defines a cubic Bezier curve.

### **13. Donut**
```aqui
shape donut myDonut {
    outerRadius: 50
    innerRadius: 20
    position: [50 50]
}
```
- Defines a donut shape.

### **14. Spiral**
```aqui
shape spiral mySpiral {
    startRadius: 10
    endRadius: 50
    turns: 5
}
```
- Defines a spiral shape.

### **15. Cross**
```aqui
shape cross myCross {
    width: 50
    thickness: 10
}
```
- Defines a cross shape.

### **16. Gear**
```aqui
shape gear myGear {
    diameter: 100
    teeth: 20
    shaft: "square"
}
```
- Defines a gear with specific teeth and shaft shape.

### **17. Wave**
```aqui
shape wave myWave {
    width: 100
    amplitude: 20
    frequency: 3
}
```
- Defines a sinusoidal wave shape.

### **18. Slot**
```aqui
shape slot mySlot {
    length: 100
    width: 20
}
```
- Defines a slot shape.

### **19. Chamfer Rectangle**
```aqui
shape chamferRectangle myChamfer {
    width: 100
    height: 50
    chamfer: 10
}
```
- Defines a rectangle with chamfered corners.

### **20. Polygon with Holes**
```aqui
shape polygonWithHoles myPoly {
    outerPoints: [[0 0], [100 0], [100 100], [0 100]]
    holes: [[[30 30], [70 30], [70 70], [30 70]]]
}
```
- Defines a polygon with internal holes.

---
This documentation provides an in-depth guide on using Aqui for shape creation and graphical programming.

