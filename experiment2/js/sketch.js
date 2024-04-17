// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file
const VALUE1 = 1;
const VALUE2 = 2;

// Globals
let myInstance;
let canvasContainer;
var centerHorz, centerVert;

class MyClass {
    constructor(param1, param2) {
        this.property1 = param1;
        this.property2 = param2;
    }

    myMethod() {
        // code to run when method is called
    }
}

function resizeScreen() {
  centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
  centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
  // redrawCanvas(); // Redraw everything based on new size
}

// sketch.js - Dynamic landscape scene with interactive elements
// Author: Your Name
// Date: [Insert Date]

// Constants - Colors and settings for the scene
const grassColor = "#A0A603";
const skyColors = { top: "#304173", mid: "#F23E2E", bottom: "#F27405" };
const stoneColors = { back: "#463E6F", front: "#A187B4" };
const treeColors = { dark: '#3B5323', light: '#8FAC5F' };

// Globals
// let canvasContainer;
let seed = 239;

function setup() {
    frameRate(120);
    canvasContainer = select("#canvas-container");
    let canvas = createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent(canvasContainer);
    // Reimagine button: Increment seed and redraw scene
    $("#clicker").click(() => {
        seed++;
        redraw();
    });
    loop(); // Enable continuous looping to update the scene with mouse interaction
}

function draw() {
    randomSeed(seed);
    drawSky();
    drawGrass();
    drawMountains();
    drawTrees();
    drawStars();
}

function drawSky() {
    // Sky gradient from top to the horizon
    for (let i = 0; i < height / 3; i++) {
        let inter = map(i, 0, height / 3, 0, 1);
        let c = lerpColor(color(skyColors.top), color(skyColors.mid), inter);
        stroke(c);
        line(0, i + mouseY * 0.2, width, i + mouseY * 0.2);
    }
    for (let i = height / 3; i < 2 * height / 3; i++) {
        let inter = map(i, height / 3, 2 * height / 3, 0, 1);
        let c = lerpColor(color(skyColors.mid), color(skyColors.bottom), inter);
        stroke(c);
        line(0, i + mouseY * 0.2, width, i + mouseY * 0.2);
    }
}

function drawGrass() {
    noStroke();
    fill(grassColor);
    rect(0, 2 * height / 3, width, height / 3);
}

function drawMountains() {
    // Back layer of mountains
    fill(stoneColors.back);
    beginShape();
    vertex(0, 2 * height / 3);
    const stepsBack = 10;
    for (let i = 0; i <= stepsBack; i++) {
        let x = (width * i) / stepsBack;
        let y = (2 * height / 3) - (random() * height / 8);
        vertex(x, y);
    }
    vertex(width, 2 * height / 3);
    endShape(CLOSE);

    // Front layer of mountains
    fill(stoneColors.front);
    beginShape();
    vertex(0, 2 * height / 3);
    const stepsFront = 5;
    for (let i = 0; i <= stepsFront; i++) {
        let x = (width * i) / stepsFront;
        let y = (2 * height / 3) - (random() * random() * height / 8);
        vertex(x, y);
    }
    vertex(width, 2 * height / 3);
    endShape(CLOSE);
}

function drawTrees() {
  // Updated tree generation code
  // const treeColorDark = color('#3B5323'); // Dark green color
  // const treeColorLight = color('#8FAC5F'); // Light green color
  const trees = 100 * random(1, 1.4); // Random number of trees

  for (let i = 0; i < trees; i++) {
    let y = map(i, 0, trees, 2 * height / 3, height); // y position based on number of trees
    let z = map(y, 2 * height / 3, height, 0, 1); // Depth factor for size and color interpolation
    let treeHeight = lerp(height / 20, height / 6, z); // Lerp tree height based on 'y' position
    let treeWidth = treeHeight / 3; // Make trees thin

    // Horizontal position with mouse interaction
    // Increase the mouseX influence for trees with larger 'y' values
    let mouseXeffect = map(y, 2 * height / 3, height, 0.01, 0.2);
    let x = width * ((random() + mouseX * mouseXeffect * 0.2 / width) % 1);

    // Lerp color based on 'y' position (randomized for variety)
    let treeColor = lerpColor(color(treeColors.dark), color(treeColors.light), random());
    fill(treeColor);
    noStroke(); // Remove stroke for cleaner triangles
    triangle(
      x, y - treeHeight, // Top point
      x - treeWidth / 2, y, // Bottom left point
      x + treeWidth / 2, y // Bottom right point
    );
  }
}

function drawStars() {
    let starCount = map(mouseX, 0, width, 0, 75);
    for (let i = 0; i < starCount; i++) {
        let starX = random(width);
        let starY = random(height / 3);
        let starSize = random(1, 3);
        fill(255, 255, 0, 200);
        noStroke();
        ellipse(starX, starY, starSize, starSize);
    }
}
