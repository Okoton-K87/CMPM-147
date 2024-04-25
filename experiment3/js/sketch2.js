// sketch.js - purpose and description here
// Author: Roman Luo
// Date: 04/23/2024

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

function resizeScreen() {
  centerHorz = canvasContainer2.width() / 2; // Adjusted for drawing logic
  centerVert = canvasContainer2.height() / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  resizeCanvas(canvasContainer2.width(), canvasContainer2.height());
  // redrawCanvas(); // Redraw everything based on new size
}

/* exported preload, setup, draw, placeTile */

/* global generateGrid drawGrid */

let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows, numCols;

function preload() {
  tilesetImage = loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
  );
}

function reseed() {
  seed = (seed | 0) + 1109;
  randomSeed(seed);
  noiseSeed(seed);
  select("#seedReport2").html("seed " + seed);
  regenerateGrid();
}

function regenerateGrid() {
  select("#asciiBox2").value(gridToString(generateGrid(numCols, numRows)));
  reparseGrid();
}

function reparseGrid() {
  currentGrid = stringToGrid(select("#asciiBox2").value());
}

function gridToString(grid) {
  let rows = [];
  for (let i = 0; i < grid.length; i++) {
    rows.push(grid[i].join(""));
  }
  return rows.join("\n");
}

function stringToGrid(str) {
  let grid = [];
  let lines = str.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let row = [];
    let chars = lines[i].split("");
    for (let j = 0; j < chars.length; j++) {
      row.push(chars[j]);
    }
    grid.push(row);
  }
  return grid;
}

function setup() {
  numCols = select("#asciiBox2").attribute("rows") | 0;
  numRows = select("#asciiBox2").attribute("cols") | 0;

  createCanvas(16 * numCols, 16 * numRows).parent("canvasContainer2");
  select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

  select("#reseedButton2").mousePressed(reseed);
  select("#asciiBox2").input(reparseGrid);

  reseed();
}


function draw() {
  randomSeed(seed);
  drawGrid(currentGrid);

}

function placeTile(i, j, ti, tj) {
  image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}

/* exported generateGrid, drawGrid */
/* global placeTile */

function generateGrid(numCols, numRows) {
    let grid = [];
    // Smaller values make larger areas of the same type
    let noiseScale = 0.1;
  
    // Initialize noise for more natural generation
    noiseDetail(4, 0.5);
  
    for (let i = 0; i < numRows; i++) {
      let row = [];
      for (let j = 0; j < numCols; j++) {
        let noiseValue = noise(j * noiseScale, i * noiseScale);
  
        if (noiseValue < 0.4) {
          row.push('w'); // River
        } else if (noiseValue < 0.5) {
          row.push(':'); // grass
        } else if (noiseValue < 0.6){
          row.push('.'); // dark grass
        } else {
          row.push('t'); // tree
        }
      }
      grid.push(row);
    }
  
    // Post-process to ensure rivers connect two edges and have at least two neighbors
    ensureRiverContinuity(grid);
  
    return grid;
  }
  
  function ensureRiverContinuity(grid) {
    // This function adjusts the grid to ensure that rivers have at least two 'w' neighbors
    // and that at least one river spans from one edge of the grid to the opposite edge
    for (let i = 1; i < grid.length - 1; i++) {
      for (let j = 1; j < grid[i].length - 1; j++) {
        if (grid[i][j] === 'w') {
          // Ensure there are enough 'w' neighbors
          let neighborW = 0;
          if (grid[i - 1][j] === 'w') neighborW++;
          if (grid[i + 1][j] === 'w') neighborW++;
          if (grid[i][j - 1] === 'w') neighborW++;
          if (grid[i][j + 1] === 'w') neighborW++;
  
          if (neighborW < 2) { // Not enough river neighbors
            grid[i][j] = ':'; // Convert isolated 'w' to wet dirt
          }
        }
      }
    }
  
  
  }
  
  
  // let grassColor = "#04D924"
  let grassColor2 = "#038C33"
  
  let wavePosition = 0; // Global variable to track the wave's position
  let lastWaveUpdate = 0; // Time since last wave update
  
  function drawGrid(grid) {
    background(grassColor2);  // Sets a white background
    let currentTime = millis();
    let waveUpdateInterval = 200; // Update the wave every 200 milliseconds
  
    if (currentTime - lastWaveUpdate > waveUpdateInterval) {
      wavePosition = (wavePosition + 1) % grid[0].length; // Move wave forward
      lastWaveUpdate = currentTime;
    }
  
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j] === 'w') {
          if (j === wavePosition) {
            placeTile(i, j, 1, 13); // Use a different texture for the wave
          } else {
            placeTile(i, j, 0, 13); // Normal water texture
          }
          drawContext(grid, i, j, ":", 10, 1);
        } else if (grid[i][j] === ':') { // Wet dirt code
          placeTile(i, j, 0, 0);
        } else if (grid[i][j] === '.') { // Grass code
          placeTile(i, j, 0, 1); // Normal grass tile
          drawContext(grid, i, j, ":", 5, 1); 
        } else if (grid[i][j] === 't') { // Grass code
          placeTile(i, j, 0, 1); // Normal grass tile
          drawContext(grid, i, j, ".", 16, 1); 
        }
      }
    }
  }
  
  function gridCheck(grid, i, j, target) {
    // Check if within grid bounds
    if (i >= 0 && i < grid.length && j >= 0 && j < grid[i].length) {
      // Return true if the tile matches the target
      return grid[i][j] === target;
    }
    return false; // Out of bounds or not a match
  }
  
  function gridCode(grid, i, j, target) {
    let northBit = gridCheck(grid, i - 1, j, target) ? 1 : 0;
    let southBit = gridCheck(grid, i + 1, j, target) ? 1 : 0;
    let eastBit = gridCheck(grid, i, j + 1, target) ? 1 : 0;
    let westBit = gridCheck(grid, i, j - 1, target) ? 1 : 0;
    return (northBit << 0) + (southBit << 1) + (eastBit << 2) + (westBit << 3);
  }
  
  function drawContext(grid, i, j, target, ti, tj) {
    // Get the 4-bit code
    let code = gridCode(grid, i, j, target);
    // Get tile offsets from the lookup table
    const tileOffsets = lookup[code];
    // Check if offsets are defined
    if (tileOffsets) {
      const [tiOffset, tjOffset] = tileOffsets;
      // Draw the tile with the correct offsets
      placeTile(i, j, ti + tiOffset, tj + tjOffset);
    }
  }
  
  const lookup = [
    // W, E, S, N
    [0, 0], // 0000
    [0, -1], // 0001
    [0, 1], // 0010
    [0, 0], // 0011
    [1, 0], // 0100
    [1, -1], // 0101
    [1, 1], // 0110
    [1, 0], // 0111
    [-1, 0], // 1000 
    [-1, -1], // 1001 
    [-1, 1], // 1010
    [-1, 0], // 1011
    [0, 0], // 1100
    [0, -1], // 1101
    [0, 1], // 1110
    [0, 0]  // 1111
  ];  



