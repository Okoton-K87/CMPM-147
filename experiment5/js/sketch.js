// sketch.js - purpose and description here
// Author: Your Name
// Date:

/* exported preload, setup, draw */
/* global memory, dropper, restart, rate, slider, activeScore, bestScore, fpsCounter */
/* global getInspirations, initDesign, renderDesign, mutateDesign */

let bestDesign;
let currentDesign;
let currentScore;
let currentInspiration;
let currentCanvas;
let currentInspirationPixels;

function preload() {
  

  let allInspirations = getInspirations();

  for (let i = 0; i < allInspirations.length; i++) {
    let insp = allInspirations[i];
    insp.image = loadImage(insp.assetUrl);
    let option = document.createElement("option");
    option.value = i;
    option.innerHTML = insp.name;
    dropper.appendChild(option);
  }
  dropper.onchange = e => inspirationChanged(allInspirations[e.target.value]);
  currentInspiration = allInspirations[0];

  // Set the initial image below the canvas
  document.getElementById('inspirationImage').src = currentInspiration.assetUrl;

  restart.onclick = () =>
    inspirationChanged(allInspirations[dropper.value]);
}

// function inspirationChanged(nextInspiration) {
//   currentInspiration = nextInspiration;
//   currentDesign = undefined;
//   memory.innerHTML = "";
//   setup();
// }

function inspirationChanged(nextInspiration) {
  currentInspiration = nextInspiration;
  currentDesign = undefined;
  memory.innerHTML = "";
  setup();
  // Update the image element to display the current inspiration's image
  document.getElementById('inspirationImage').src = currentInspiration.assetUrl;
}

function setup() {
  currentCanvas = createCanvas(width, height);
  currentCanvas.parent(document.getElementById("active"));
  currentScore = Number.NEGATIVE_INFINITY;
  currentDesign = initDesign(currentInspiration);
  bestDesign = currentDesign;
  image(currentInspiration.image, 0,0, width, height);
  image(currentInspiration.image, 0,0, width, height);
  loadPixels();
  currentInspirationPixels = pixels;
}

function evaluate() {
  loadPixels();

  let error = 0;
  let n = pixels.length;
  
  for (let i = 0; i < n; i++) {
    error += sq(pixels[i] - currentInspirationPixels[i]);
  }
  return 1/(1+error/n);
}



function memorialize() {
  let url = currentCanvas.canvas.toDataURL();

  let img = document.createElement("img");
  img.classList.add("memory");
  img.src = url;
  img.width = width;
  img.heigh = height;
  img.title = currentScore;

  document.getElementById("best").innerHTML = "";
  document.getElementById("best").appendChild(img.cloneNode());

  img.width = width / 2;
  img.height = height / 2;

  memory.insertBefore(img, memory.firstChild);

  if (memory.childNodes.length > memory.dataset.maxItems) {
    memory.removeChild(memory.lastChild);
  }
}

let mutationCount = 0;

function draw() {
  
  if(!currentDesign) {
    return;
  }
  randomSeed(mutationCount++);
  currentDesign = JSON.parse(JSON.stringify(bestDesign));
  rate.innerHTML = slider.value;
  mutateDesign(currentDesign, currentInspiration, slider.value/100.0);
  
  randomSeed(0);
  renderDesign(currentDesign, currentInspiration);
  let nextScore = evaluate();
  activeScore.innerHTML = nextScore;
  if (nextScore > currentScore) {
    currentScore = nextScore;
    bestDesign = currentDesign;
    memorialize();
    bestScore.innerHTML = currentScore;
  }
  
  fpsCounter.innerHTML = Math.round(frameRate());
}


/* exported getInspirations, initDesign, renderDesign, mutateDesign */


function getInspirations() {
  return [
    {
      name: "Mona Lisa", 
      assetUrl: "https://cdn.glitch.global/5d90ffcc-a008-44d4-8490-968017cbf2b9/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg.webp?v=1715141114278",
      credit: "Leonardo da Vinci"
    },
    {
      name: "Chainsaw Man", 
      assetUrl: "https://cdn.glitch.global/5d90ffcc-a008-44d4-8490-968017cbf2b9/cropped-1200-675-1296717.jpg?v=1715145617046",
      credit: "Chainsawman"
    },
    {
      name: "Girl With A Pearl Earing", 
      assetUrl: "https://cdn.glitch.global/5d90ffcc-a008-44d4-8490-968017cbf2b9/1665_Girl_with_a_Pearl_Earring.jpg?v=1715140939707",
      credit: "Johannes Vermeer"
    },
    {
      name: "Disaster Girl", 
      assetUrl: "https://cdn.glitch.global/3abd0223-86fb-43ce-a00a-fde12615bcd5/girl-with-fire.jpg?v=1714778905663",
      credit: "Four-year-old Zoë Roth, 2005"
    },
    {
      name: "Makima2", 
      assetUrl: "https://cdn.glitch.global/5d90ffcc-a008-44d4-8490-968017cbf2b9/Makima2.png?v=1715139919643",
      credit: "Chainsawman"
    },
  ];
}

function initDesign(inspiration) {
  resizeCanvas(inspiration.image.width / 4, inspiration.image.height / 4);
  
  let design = {
    bg: 128,
    fg: []
  };

  // Increase the number of rectangles and reduce their size
  let numRectangles = 5000; // Increased number of rectangles
  let maxRectSize = width / 10; // Smaller maximum size for width and height

  for(let i = 0; i < numRectangles; i++) {
    design.fg.push({
      x: random(width),
      y: random(height),
      w: random(maxRectSize), // Smaller width
      h: random(maxRectSize), // Smaller height
      fill: random(255)
    });
  }
  return design;
}

function renderDesign(design, inspiration) {
  background(design.bg);
  noStroke();

  // Ensure the inspiration image's pixels are loaded
  inspiration.image.loadPixels();

  for (let box of design.fg) {
    // Determine the region to sample colors from
    let imgX1 = floor(map(box.x, 0, width, 0, inspiration.image.width));
    let imgY1 = floor(map(box.y, 0, height, 0, inspiration.image.height));
    let imgX2 = floor(map(box.x + box.w, 0, width, 0, inspiration.image.width));
    let imgY2 = floor(map(box.y + box.h, 0, height, 0, inspiration.image.height));

    // Average the colors in the region
    let r = 0, g = 0, b = 0, count = 0;
    for (let x = imgX1; x <= imgX2; x++) {
      for (let y = imgY1; y <= imgY2; y++) {
        let index = (x + y * inspiration.image.width) * 4;
        r += inspiration.image.pixels[index];
        g += inspiration.image.pixels[index + 1];
        b += inspiration.image.pixels[index + 2];
        count++;
      }
    }
    r /= count;
    g /= count;
    b /= count;

    // Use the averaged color for the rectangle
    fill(r, g, b, 128); // Added alpha for translucency
    rect(box.x, box.y, box.w, box.h);
  }
}

function mutateDesign(design, inspiration, rate) {
  design.bg = mut(design.bg, 0, 255, rate);
  for(let box of design.fg) {
    box.fill = mut(box.fill, 0, 255, rate);
    box.x = mut(box.x, 0, width, rate);
    box.y = mut(box.y, 0, height, rate);
    box.w = mut(box.w, 0, width/2, rate);
    box.h = mut(box.h, 0, height/2, rate);
  }
}


function mut(num, min, max, rate) {
  return constrain(randomGaussian(num, (rate * (max - min)) / 20), min, max);
}
