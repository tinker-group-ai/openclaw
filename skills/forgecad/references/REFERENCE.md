# ForgeCAD API Quick Reference

## Solid primitives

```js
box(width, height, depth);
cylinder(radius, height);
sphere(radius);
torus(major, minor);
cone(baseRadius, topRadius, height);
wedge(width, height, depth);
```

## Sketches (2D)

```js
rect(width, height);
circle2d(radius);
ellipse2d(a, b);
roundedRect(width, height, radius);
slot(length, width);
polygon(points);
path(...points).close();
text2d(text, fontSize);
```

## Extrusions & sweeps

```js
sketch.extrude(height);
sketch.revolve(axis, angle);
sketch.loft(otherSketch);
sketch.sweep(path);
```

## Boolean operations

```js
solid.union(other);
solid.difference(other);
solid.intersection(other);
```

## Transforms

```js
solid.move(x, y, z);
solid.rotate(axis, angle);
solid.scale(factor);
solid.translate([x, y, z]);
solid.mirror(plane);
```

## Patterns

```js
solid.linearPattern(direction, count, spacing);
solid.circularPattern(axis, center, count, angle);
solid.mirrorCopy(plane);
```

## Edges & fillets

```js
solid.fillet(radius, ...edges);
solid.chamfer(size, ...edges);
```

## Grouping & naming

```js
group(solid1, solid2, solid3)

{
  base: solid1,
  lid: solid2,
  fasteners: [bolt1, bolt2]
}
```

## Parameters

```js
const width = param("Width", 80, { min: 40, max: 160, unit: "mm" });
const useFeature = param("Use feature", true);
const mode = param("Mode", "standard", { choices: ["standard", "compact", "deluxe"] });
```

## Validation & inspection

```js
spec({ width: 50, height: 100 });
verify(solid, { printable: true, minWall: 2 });
spec().boundingBox();
spec().volume();
```

## BOM & dimensioning

```js
bom("Part A", quantity, description);
dim("Hole diameter", 5);
```

## Common patterns

### Simple box with parameters

```js
const width = param("Width", 100, { min: 50, max: 200, unit: "mm" });
const height = param("Height", 50, { min: 25, max: 100, unit: "mm" });
const depth = param("Depth", 80, { min: 40, max: 160, unit: "mm" });

const result = box(width, height, depth);
result.move(0, 0, 0);

return result;
```

### Box with hole

```js
const outer = box(100, 50, 100);
const hole = cylinder(10, 50).move(50, 25, 0);
const result = outer.difference(hole);

return result;
```

### Simple assembly (named parts)

```js
const base = box(100, 100, 10);
const lid = box(100, 100, 5).move(0, 0, 15);

return {
  base: base,
  lid: lid,
};
```

### Parametric with conditional

```js
const hasHole = param("Add hole", true);
let result = box(100, 50, 100);

if (hasHole) {
  const hole = cylinder(10, 50);
  result = result.difference(hole);
}

return result;
```

## Imports (Eric approval required)

```js
importSvgSketch("./profile.svg");
importMesh("./part.obj");
importStep("./reference.step");
importFont("./custom-font.ttf");
```
