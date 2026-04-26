/**
 * Hello World - Starter ForgeCAD Model
 * 
 * A simple parametric box. Modify the parameters below to see how
 * the shape changes. Run with:
 * 
 *   forgecad run hello-world.forge.js
 * 
 * Then render:
 * 
 *   forgecad render 3d hello-world.forge.js
 */

// Define parameters
const width = param("Width", 100, { min: 50, max: 200, unit: "mm" });
const height = param("Height", 50, { min: 25, max: 100, unit: "mm" });
const depth = param("Depth", 80, { min: 40, max: 160, unit: "mm" });

// Create the shape
const result = box(width, height, depth);

// Move to origin if needed
result.move(0, 0, 0);

// Return the result
return result;
