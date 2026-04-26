---
name: forgecad
description: Create, edit, validate, render, and export safe ForgeCAD .forge.js CAD models. Use when Eric asks to create a new part or assembly, edit an existing model, validate geometry, render views (3D/wireframe/section), or generate manufacturing outputs (STL, 3MF, STEP, PDF reports, cutting layouts). Also use for debugging imports, checking parameter sweeps, and reviewing bounding boxes or collisions.
---

# ForgeCAD Skill

Create and edit parametric .forge.js CAD models. Work in ~/forgecad only.

## Core job

A .forge.js file is a parametric ForgeCAD part or assembly script. It returns a Shape, Sketch, ShapeGroup, Assembly, array of named renderable objects, or a metadata object with renderable entries.

**Work only inside:** `~/forgecad`

Do not write, read, import, or export outside that folder unless Eric explicitly approves the exact path.

## Default workflow

1. Create a small first model.
2. Prefer documented ForgeCAD APIs over invented helpers.
3. Add parameters only when useful.
4. Validate before adding detail.
5. Render only after validation passes.
6. Export only after Eric approves.

## File rules

**Use:**

- `.forge.js` for models
- Plain `.js` only for shared helper modules
- `require("./part.forge.js", { Param: value })` for approved local model composition
- `importSvgSketch()`, `importMesh()`, `importStep()`, or custom font paths only after Eric approves the exact file path

**Do not:**

- Fetch remote assets
- Install packages
- Run arbitrary shell commands

## Allowed commands

**Validation & Debug:**

```
forgecad run <file.forge.js>
forgecad run <file.forge.js> --debug-imports
forgecad run <file.forge.js> --backend occt
forgecad check params <file.forge.js> --samples 12
```

**Rendering:**

```
forgecad render 3d <file.forge.js>
forgecad render 3d <file.forge.js> --camera front --camera iso
forgecad render wireframe <file.forge.js>
forgecad render section <file.forge.js> out/section.svg --plane XZ --offset 10
forgecad capture gif <file.forge.js>
```

**Export:**

```
forgecad export stl <file.forge.js>
forgecad export 3mf <file.forge.js> --quality high
forgecad export step <file.forge.js>
forgecad export report <file.forge.js> out/report.pdf
forgecad export cutting-layout <file.forge.js> --sheet-width <mm> --sheet-height <mm> --kerf <mm>
```

**If a command is not listed, stop and ask Eric.**

## Hard no

Never run:

- `sudo`, `rm`, `chmod`, `chown`, `curl`, `wget`
- Package managers
- Shell pipes or chained commands
- Inline eval: `node -e`, `python -c`, `bash -c`, `sh -c`

If ForgeCAD is missing, report that `forgecad` is not installed. Do not attempt to install it.

## Modeling defaults

**Units:** Inches unless Eric says otherwise.

**Prefer:**

- `box`, `cylinder`, `sphere`, `torus` for basic solids
- `rect`, `circle2d`, `roundedRect`, `slot`, `path`, `polygon`, `text2d` for sketches
- `extrude`, `revolve`, `loft`, or `sweep` to turn sketches into 3D
- `union` when one merged solid is intended
- `difference` for holes, cutouts, pockets, slots, countersinks
- `group` or named return objects when separate colors, parts, or identities matter
- `fillet` and `chamfer` sparingly after main shape validates
- `linearPattern`, `circularPattern`, `mirrorCopy` for repeated features
- `spec()` and `verify()` for fit, printability, collisions, bounding-box checks
- `bom()` and `dim()` only when a report or fabrication output is useful

**Avoid overbuilding the first version.**

## Parameter rules

Use parameters for dimensions Eric may tune:

```js
const width = param("Width", 80, { min: 40, max: 160, unit: "mm" });
```

Prefer clear names, sane min/max values, and units.

**Use:**

- `Param.number` or `param()` for dimensions
- `Param.bool` for toggles
- `Param.choice` for named modes
- `Param.string` only for labels or inscriptions

Do not create huge parameter sets unless the design needs them.

## Validation rules

**After creating or materially changing a model:**

```
forgecad run <file.forge.js>
```

**For multi-parameter models:**

```
forgecad check params <file.forge.js> --samples 12
```

Use section or wireframe renders when internal geometry, holes, edge flow, or collisions matter.

## Output rules

**After validation, report:**

- File path
- Command run
- Pass/fail
- Important diagnostics
- Next suggested edit

**Before exporting, ask Eric which output he wants:**

- STL or 3MF for 3D printing
- STEP for CAD interchange
- PDF report for review
- Cutting layout for sheet goods

**Do not export manufacturing files until Eric approves.**

## Design taste

Less is more.

Start simple.
Make it parametric.
Make it readable.
Make it safe to revise.
Prefer boring geometry that works over fancy geometry that fails.

## Quick reference

For API details, examples, and common patterns, see [REFERENCE.md](REFERENCE.md).

For starter templates and sample models, see `assets/`.
