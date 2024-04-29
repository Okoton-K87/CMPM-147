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

// First sketch in instance mode
var sketch1 = function(p) {
  let seed = 0;
  let tilesetImage;
  let currentGrid = [];
  let numRows, numCols;

  p.preload = function() {
    tilesetImage = p.loadImage("https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438");
  };

  p.setup = function() {
    // numRows = 30; // assuming some default values
    // numCols = 30;
    numCols = p.select("#asciiBox").attribute("rows") | 0;
    numRows = p.select("#asciiBox").attribute("cols") | 0;
    // p.createCanvas(16 * numCols, 16 * numRows);
    // p.noLoop();
    p.createCanvas(16 * numCols, 16 * numRows).parent("canvasContainer");
    p.select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;
  
    p.select("#reseedButton").mousePressed(reseed);
    p.select("#asciiBox").input(reparseGrid);
    reseed();
  };

  p.draw = function() {
    p.randomSeed(seed);
    drawGrid(currentGrid);
  };

  function reseed() {
    seed = (seed | 0) + 1109;
    p.randomSeed(seed);
    p.noiseSeed(seed);
    p.select("#seedReport").html("seed " + seed);
    regenerateGrid();
  }

  function regenerateGrid() {
    p.select("#asciiBox").value(gridToString(generateGrid(numCols, numRows)));
    reparseGrid();
  }
  
  function reparseGrid() {
    currentGrid = stringToGrid(p.select("#asciiBox").value());
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

  function placeTile(i, j, ti, tj) {
    p.image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
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

  function generateGrid(numCols, numRows) {
    let grid = [];
    // Initialize the grid with a background code '_'
    for (let i = 0; i < numRows; i++) {
      let row = [];
      for (let j = 0; j < numCols; j++) {
        row.push("_");
      }
      grid.push(row);
    }
  
    // Room generation parameters
    let maxRoomWidth = p.floor(numCols / 2);
    let maxRoomHeight = p.floor(numRows / 2);
    let minRoomWidth = 5;
    let minRoomHeight = 5;
    let minRoomsRequired = 3; // Minimum number of rooms required
    let attemptLimit = 1000; // Limit the number of attempts to avoid infinite loops
  
    let rooms = [];
    let attempts = 0;
  
    while (rooms.length < minRoomsRequired && attempts < attemptLimit) {
      let roomWidth = p.floor(p.random(minRoomWidth, maxRoomWidth));
      let roomHeight = p.floor(p.random(minRoomHeight, maxRoomHeight));
      let x = p.floor(p.random(0, numCols - roomWidth));
      let y = p.floor(p.random(0, numRows - roomHeight));
  
      // Check for overlaps with existing rooms, ensuring at least 2 tiles of space
      let overlap = false;
      for (let room of rooms) {
        if (x < room.x + room.w + 2 && x + roomWidth + 2 > room.x &&
          y < room.y + room.h + 2 && y + roomHeight + 2 > room.y) {
          overlap = true;
          break;
        }
      }
  
      if (!overlap) {
        rooms.push({ x: x, y: y, w: roomWidth, h: roomHeight });
        // Fill the room area with another code '.'
        for (let i = y; i < y + roomHeight; i++) {
          for (let j = x; j < x + roomWidth; j++) {
            grid[i][j] = '.';
          }
        }
        let numberOfChests = p.floor(p.random(1, 5));
        for (let k = 0; k < numberOfChests; k++) {
          let chestX = p.floor(p.random(x + 1, x + roomWidth - 1));
          let chestY = p.floor(p.random(y + 1, y + roomHeight - 1));
          grid[chestY][chestX] = 'c'; // Place the chest
        }
      }
      attempts++; // Increment attempt counter
    }
  
    // Connect rooms with hallways that are 2 tiles wide
    for (let i = 0; i < rooms.length - 1; i++) {
      let r1 = rooms[i];
      let r2 = rooms[i + 1];
      let startCol = p.floor((r1.x + r1.w / 2));
      let startRow = p.floor((r1.y + r1.h / 2));
      let endCol = p.floor((r2.x + r2.w / 2));
      let endRow = p.floor((r2.y + r2.h / 2));
  
      // Horizontal hallway
      // Iterate for 2 rows to make the hallway 2 tiles wide
      for (let rowOffset = 0; rowOffset < 2; rowOffset++) {
        for (let j = p.min(startCol, endCol); j <= p.max(startCol, endCol); j++) {
          grid[startRow + rowOffset][j] = 'p';
        }
      }
      // Vertical hallway
      // Iterate for 2 rows to make the hallway 2 tiles wide
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        for (let i = p.min(startRow, endRow); i <= p.max(startRow, endRow); i++) {
          grid[i][endCol + colOffset] = 'p';
        }
      }
    }
  
    return grid;
  }  
  
  function drawGrid(grid) {
    p.background(128);  // Sets a grey background
  
    let tileSize = 16; // Assuming each tile is 16x16 pixels
    let mouseGridX = p.floor(p.mouseX / tileSize);
    let mouseGridY = p.floor(p.mouseY / tileSize);
  
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        switch (grid[i][j]) {
          case '_': // Background code
            placeTile(i, j, 0, 15);
            break;
          case 'c': // Chest code
            if (i === mouseGridY && j === mouseGridX) {
              placeTile(i, j, 1, 29); // Change texture to the "open" texture
            } else {
              placeTile(i, j, 4, 29);
            }
            break;
          case 'p': // Path code
            if (p.random() > 0.6) {
              placeTile(i, j, p.floor(p.random(11, 14)), p.floor(p.random(21, 24)));
              drawContext(grid, i, j, "_", 10, 16);
            } else {
              placeTile(i, j, 0, 16);
              drawContext(grid, i, j, "_", 10, 16);
            }
            break;
          case '.': // Room code
            placeTile(i, j, 0, 16);
            drawContext(grid, i, j, "_", 10, 16);
            if (gridCode(grid, i, j, "_") === 1 && p.random() > 0.8) {
              placeTile(i, j, p.floor(p.random(15, 17)), p.floor(p.random(25, 27)));
            }
            break;
          default: // Default code
            placeTile(i, j, 0, 0);
            break;
        }
      }
    }
  }
  
};

var sketch2 = function(p) {
  let seed = 0;
  let tilesetImage;
  let currentGrid = [];
  let numRows, numCols;

  p.preload = function() {
    tilesetImage = p.loadImage("https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438");
  };

  p.setup = function() {
    // numRows = 30; // assuming some default values
    // numCols = 30;
    numCols = p.select("#asciiBox2").attribute("rows") | 0;
    numRows = p.select("#asciiBox2").attribute("cols") | 0;
    // p.createCanvas(16 * numCols, 16 * numRows);
    // p.noLoop();
    p.createCanvas(16 * numCols, 16 * numRows).parent("canvasContainer2");
    p.select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;
  
    p.select("#reseedButton").mousePressed(reseed);
    p.select("#asciiBox2").input(reparseGrid);
    reseed();
  };

  p.draw = function() {
    p.randomSeed(seed);
    drawGrid(currentGrid);
  };

  function reseed() {
    seed = (seed | 0) + 1109;
    p.randomSeed(seed);
    p.noiseSeed(seed);
    p.select("#seedReport2").html("seed " + seed);
    regenerateGrid();
  }

  function regenerateGrid() {
    p.select("#asciiBox2").value(gridToString(generateGrid(numCols, numRows)));
    reparseGrid();
  }
  
  function reparseGrid() {
    currentGrid = stringToGrid(p.select("#asciiBox2").value());
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

  function placeTile(i, j, ti, tj) {
    p.image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
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

// Assuming 'p' is the instance of your p5 sketch.

  function generateGrid(numCols, numRows) {
    let grid = [];
    // Smaller values make larger areas of the same type
    let noiseScale = 0.1;

    // Initialize noise for more natural generation
    p.noiseDetail(4, 0.5);

    for (let i = 0; i < numRows; i++) {
      let row = [];
      for (let j = 0; j < numCols; j++) {
        let noiseValue = p.noise(j * noiseScale, i * noiseScale);

        if (noiseValue < 0.4) {
          row.push('w'); // Water
        } else if (noiseValue < 0.5) {
          row.push(':'); // Wet dirt
        } else if (noiseValue < 0.6) {
          row.push('.'); // Dark grass
        } else {
          row.push('t'); // Tree
        }
      }
      grid.push(row);
    }

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

  // You may need to define grassColor2 in the global scope if it's not already.
  let grassColor2 = "#038C33";
  let wavePosition = 0; // Global variable to track the wave's position
  let lastWaveUpdate = 0; // Time since last wave update

  function drawGrid(grid) {
    p.background(grassColor2);
    let currentTime = p.millis();
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
        } else if (grid[i][j] === ':') {
          placeTile(i, j, 0, 0); // Wet dirt tile
        } else if (grid[i][j] === '.') {
          placeTile(i, j, 0, 1); // Normal grass tile
          drawContext(grid, i, j, ":", 5, 1); 
        } else if (grid[i][j] === 't') {
          placeTile(i, j, 0, 1); // Tree tile
          drawContext(grid, i, j, ".", 16, 1); 
        }
      }
    }
  }
  
};

new p5(sketch1, 'canvasContainer1');
new p5(sketch2, 'canvasContainer2');
