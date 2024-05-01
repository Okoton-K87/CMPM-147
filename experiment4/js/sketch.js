
let worldSeed;
let Gkey = "xyzzy";


const s1 = (sketch) => {
  /* global p5 */
  /* exported preload, setup, draw, mouseClicked */

  // Project base code provided by {amsmith,ikarth}@ucsc.edu


  let tile_width_step_main; // A width step is half a tile's width
  let tile_height_step_main; // A height step is half a tile's height

  // Global variables. These will mostly be overwritten in setup().
  let tile_rows, tile_columns;
  let camera_offset;
  let camera_velocity;

  /////////////////////////////
  // Transforms between coordinate systems
  // These are actually slightly weirder than in full 3d...
  /////////////////////////////
  function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
    let i = (world_x - world_y) * tile_width_step_main;
    let j = (world_x + world_y) * tile_height_step_main;
    return [i + camera_x, j + camera_y];
  }

  function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
    let i = (world_x - world_y) * tile_width_step_main;
    let j = (world_x + world_y) * tile_height_step_main;
    return [i, j];
  }

  function tileRenderingOrder(offset) {
    return [offset[1] - offset[0], offset[0] + offset[1]];
  }

  function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
    screen_x -= camera_x;
    screen_y -= camera_y;
    screen_x /= tile_width_step_main * 2;
    screen_y /= tile_height_step_main * 2;
    screen_y += 0.5;
    return [Math.floor(screen_y + screen_x), Math.floor(screen_y - screen_x)];
  }

  function cameraToWorldOffset([camera_x, camera_y]) {
    let world_x = camera_x / (tile_width_step_main * 2);
    let world_y = camera_y / (tile_height_step_main * 2);
    return { x: Math.round(world_x), y: Math.round(world_y) };
  }

  function worldOffsetToCamera([world_x, world_y]) {
    let camera_x = world_x * (tile_width_step_main * 2);
    let camera_y = world_y * (tile_height_step_main * 2);
    return new p5.Vector(camera_x, camera_y);
  }

  sketch.preload = function() {
    if (p3_preload) {
      p3_preload();
    }
  }

  sketch.setup = function() {
    //canvas1 = createCanvas(600, 600/3);
    //canvas1.parent("container");

    camera_offset = new p5.Vector(-sketch.width / 2, sketch.height / 2);
    camera_velocity = new p5.Vector(0, 0);

    if (p3_setup) {
      p3_setup();
    }
    for (let element of document.getElementsByClassName("p5Canvas")) {
      element.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    let label = sketch.createP();
    label.html("World key: ");
    label.parent("canvas-container1");

    let input = sketch.createInput("xyzzy");
    input.parent(label);
    input.input(() => {
      rebuildWorld(input.value());
    });

    sketch.createP("Arrow or wasd keys scroll").parent("canvas-container1");

    rebuildWorld(input.value());
  }

  function rebuildWorld(key) {
    if (p3_worldKeyChanged) {
      p3_worldKeyChanged(key);
    }
    tile_width_step_main = p3_tileWidth ? p3_tileWidth() : 32;
    tile_height_step_main = p3_tileHeight ? p3_tileHeight() : 14.5;
    tile_columns = Math.ceil(sketch.width / (tile_width_step_main * 2));
    tile_rows = Math.ceil((sketch.height + 150) / (tile_height_step_main * 2));
  }

  function mouseClicked() {
    let world_pos = screenToWorld(
      [0 - mouseX, mouseY],
      [camera_offset.x, camera_offset.y]
    );

    if (p3_tileClicked) {
      p3_tileClicked(world_pos[0], world_pos[1]);
    }
    return false;
  }

  sketch.draw = function() {
    // Keyboard controls!
    if (sketch.keyIsDown(sketch.LEFT_ARROW) || sketch.keyIsDown(65)) {
      camera_velocity.x -= 1;
    }
    if (sketch.keyIsDown(sketch.RIGHT_ARROW) || sketch.keyIsDown(68)) {
      camera_velocity.x += 1;
    }
    if (sketch.keyIsDown(sketch.DOWN_ARROW) || sketch.keyIsDown(83)) {
      camera_velocity.y -= 1;
    }
    if (sketch.keyIsDown(sketch.UP_ARROW) || sketch.keyIsDown(87)) {
      camera_velocity.y += 1;
    }

    let camera_delta = new p5.Vector(0, 0);
    camera_velocity.add(camera_delta);
    camera_offset.add(camera_velocity);
    camera_velocity.mult(0.95); // cheap easing
    if (camera_velocity.mag() < 0.01) {
      camera_velocity.setMag(0);
    }

    let world_pos = screenToWorld(
      [0 - sketch.mouseX, sketch.mouseY],
      [camera_offset.x, camera_offset.y]
    );
    let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

    sketch.background(100);

    if (p3_drawBefore) {
      p3_drawBefore();
    }

    let overdraw = 0.1;

    let y0 = Math.floor((0 - overdraw) * tile_rows);
    let y1 = Math.floor((1 + overdraw) * tile_rows);
    let x0 = Math.floor((0 - overdraw) * tile_columns);
    let x1 = Math.floor((1 + overdraw) * tile_columns);

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        drawTile(tileRenderingOrder([x + world_offset.x, y - world_offset.y]), [
          camera_offset.x,
          camera_offset.y
        ]); // odd row
      }
      for (let x = x0; x < x1; x++) {
        drawTile(
          tileRenderingOrder([
            x + 0.5 + world_offset.x,
            y + 0.5 - world_offset.y
          ]),
          [camera_offset.x, camera_offset.y]
        ); // even rows are offset horizontally
      }
    }

    describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);

    if (p3_drawAfter) {
      p3_drawAfter();
    }
  }

  // Display a discription of the tile at world_x, world_y.
  function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
    let [screen_x, screen_y] = worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
  }

  function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
    sketch.push();
    sketch.translate(screen_x, screen_y);
    if (p3_drawSelectedTile) {
      p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
    }
    sketch.pop();
  }

  // Draw a tile, mostly by calling the user's drawing code.
  function drawTile([world_x, world_y], [camera_x, camera_y]) {
    let [screen_x, screen_y] = worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    sketch.push();
    sketch.translate(0 - screen_x, screen_y);
    if (p3_drawTile) {
      p3_drawTile(world_x, world_y, -screen_x, screen_y);
    }
    sketch.pop();
  }

  /* global XXH */
  /* exported --
      p3_preload
      p3_setup
      p3_worldKeyChanged
      p3_tileWidth
      p3_tileHeight
      p3_tileClicked
      p3_drawBefore
      p3_drawTile
      p3_drawSelectedTile
      p3_drawAfter
  */

  /* global XXH, p3_tileWidth, p3_tileHeight */
  /* exported p3_preload, p3_setup, p3_worldKeyChanged, p3_tileClicked, p3_drawBefore, p3_drawTile, p3_drawSelectedTile, p3_drawAfter */

  let boatTextures = [];
  let boats = {}; // Stores data for each boat

  function p3_preload() {
    boatTextures.push(sketch.loadImage("https://cdn.glitch.global/d85022b7-5f94-4d4b-bb89-0bb8bf14ba4b/boat.png?v=1714515416934"));
    boatTextures.push(sketch.loadImage("https://cdn.glitch.global/d85022b7-5f94-4d4b-bb89-0bb8bf14ba4b/ship15_1.png?v=1714527235212"));
  }

  function p3_setup() {
    canvas = sketch.createCanvas(600, 600/3);
    canvas.parent("canvas-container1");
  }

  let worldSeed;

  function p3_worldKeyChanged(key) {
    worldSeed = XXH.h32(key, 0);
    sketch.noiseSeed(worldSeed);
    sketch.randomSeed(worldSeed);
    boats = {}; // Reset boats when the world key changes
  }

  function p3_tileWidth() {
    return 16;
  }

  function p3_tileHeight() {
    return 8;
  }

  function p3_drawBefore() {
    sketch.background("#DEF3F6");
  }

  function p3_drawTile(i, j) {
    sketch.noStroke();

    // Define ocean colors
    const deepWaterColor = sketch.color("#003366"); // Dark blue for deep water
    const midWaterColor = sketch.color("#006699"); // Medium blue for mid-depth
    const shallowWaterColor = sketch.color("#00b7e4"); // Lighter blue for shallow areas
    const foamColor = sketch.color("#78e4ff"); // Very light blue for foam or wave crests

    // Calculate wave effect based on time and horizontal position
    const waveSpeed = 0.0015; // Speed at which the wave moves
    const waveFrequency = 0.2; // Frequency of the wave
    const waveAmplitude = 5; // Height of the wave
    const currentTime = sketch.millis();
    const wavePhase = currentTime * waveSpeed + i * waveFrequency;
    const waveEffect = sketch.sin(wavePhase) * waveAmplitude;

    // Interpolate between colors based on waveEffect, with swapped order
    let colorEffect;
    if (waveEffect < -2.5) {
      colorEffect = sketch.lerpColor(foamColor, shallowWaterColor, sketch.map(waveEffect, -5, -2.5, 0, 1));
    } else if (waveEffect < 2.5) {
      colorEffect = sketch.lerpColor(shallowWaterColor, midWaterColor, sketch.map(waveEffect, -2.5, 2.5, 0, 1));
    } else {
      colorEffect = sketch.lerpColor(midWaterColor, deepWaterColor, sketch.map(waveEffect, 2.5, 5, 0, 1));
    }

    sketch.fill(colorEffect); // Use the dynamically chosen color

    sketch.push();
    sketch.translate(0, waveEffect); // Apply the vertical displacement based on the wave
    sketch.beginShape();
    sketch.vertex(-p3_tileWidth(), 0);
    sketch.vertex(0, p3_tileHeight());
    sketch.vertex(p3_tileWidth(), 0);
    sketch.vertex(0, -p3_tileHeight());
    sketch.endShape(sketch.CLOSE);

    // Check and draw boat
    const tileKey = `${i}_${j}`;
    if (!boats[tileKey] && XXH.h32(tileKey, worldSeed).toNumber() % 100 < 10) {
      boats[tileKey] = {
        textureIndex: sketch.floor(sketch.random() * boatTextures.length) // Choose a random texture index
      };
    }
    if (boats[tileKey]) {
      drawBoat(boats[tileKey].textureIndex);
    }

    sketch.pop();
  }

  function drawBoat(textureIndex) {
    const scale = (p3_tileWidth() * 2) / 64;
    sketch.image(boatTextures[textureIndex], 0, -30, 64 * scale, 64 * scale);
  }

  function p3_tileClicked(i, j) {
    // This function can still handle interactions as needed
  }

  function p3_drawSelectedTile(i, j) {
    // noFill();
    sketch.fill(0);
    sketch.text("tile " + [i, j], 0, 0);
  }


  function p3_drawAfter() {}
      
}


const s2 = (sketch) => {
  /* global p5 */
  /* exported preload, setup, draw, mouseClicked */

  // Project base code provided by {amsmith,ikarth}@ucsc.edu


  let tile_width_step_main; // A width step is half a tile's width
  let tile_height_step_main; // A height step is half a tile's height

  // Global variables. These will mostly be overwritten in setup().
  let tile_rows, tile_columns;
  let camera_offset;
  let camera_velocity;

  /////////////////////////////
  // Transforms between coordinate systems
  // These are actually slightly weirder than in full 3d...
  /////////////////////////////
  function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
    let i = (world_x - world_y) * tile_width_step_main;
    let j = (world_x + world_y) * tile_height_step_main;
    return [i + camera_x, j + camera_y];
  }

  function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
    let i = (world_x - world_y) * tile_width_step_main;
    let j = (world_x + world_y) * tile_height_step_main;
    return [i, j];
  }

  function tileRenderingOrder(offset) {
    return [offset[1] - offset[0], offset[0] + offset[1]];
  }

  function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
    screen_x -= camera_x;
    screen_y -= camera_y;
    screen_x /= tile_width_step_main * 2;
    screen_y /= tile_height_step_main * 2;
    screen_y += 0.5;
    return [Math.floor(screen_y + screen_x), Math.floor(screen_y - screen_x)];
  }

  function cameraToWorldOffset([camera_x, camera_y]) {
    let world_x = camera_x / (tile_width_step_main * 2);
    let world_y = camera_y / (tile_height_step_main * 2);
    return { x: Math.round(world_x), y: Math.round(world_y) };
  }

  function worldOffsetToCamera([world_x, world_y]) {
    let camera_x = world_x * (tile_width_step_main * 2);
    let camera_y = world_y * (tile_height_step_main * 2);
    return new p5.Vector(camera_x, camera_y);
  }

  sketch.preload = function() {
    if (p3_preload) {
      p3_preload();
    }
  }

  sketch.setup = function() {
    //canvas1 = createCanvas(600, 600/3);
    //canvas1.parent("container");

    camera_offset = new p5.Vector(-sketch.width / 2, sketch.height / 2);
    camera_velocity = new p5.Vector(0, 0);

    if (p3_setup) {
      p3_setup();
    }
    for (let element of document.getElementsByClassName("p5Canvas")) {
      element.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    let label = sketch.createP();
    label.html("World key: ");
    label.parent("canvas-container2");

    let input = sketch.createInput("xyzzy");
    input.parent(label);
    input.input(() => {
      rebuildWorld(input.value());
    });

    sketch.createP("Arrow or wasd keys scroll").parent("canvas-container2");

    rebuildWorld(input.value());
  }

  function rebuildWorld(key) {
    if (p3_worldKeyChanged) {
      p3_worldKeyChanged(key);
    }
    tile_width_step_main = p3_tileWidth ? p3_tileWidth() : 32;
    tile_height_step_main = p3_tileHeight ? p3_tileHeight() : 14.5;
    tile_columns = Math.ceil(sketch.width / (tile_width_step_main * 2));
    tile_rows = Math.ceil((sketch.height + 150) / (tile_height_step_main * 2));
  }

  function mouseClicked() {
    let world_pos = screenToWorld(
      [0 - sketch.mouseX, sketch.mouseY],
      [camera_offset.x, camera_offset.y]
    );

    if (p3_tileClicked) {
      p3_tileClicked(world_pos[0], world_pos[1]);
    }
    return false;
  }

  sketch.draw = function() {
    // Keyboard controls!
    if (sketch.keyIsDown(sketch.LEFT_ARROW) || sketch.keyIsDown(65)) {
      camera_velocity.x -= 1;
    }
    if (sketch.keyIsDown(sketch.RIGHT_ARROW) || sketch.keyIsDown(68)) {
      camera_velocity.x += 1;
    }
    if (sketch.keyIsDown(sketch.DOWN_ARROW) || sketch.keyIsDown(83)) {
      camera_velocity.y -= 1;
    }
    if (sketch.keyIsDown(sketch.UP_ARROW) || sketch.keyIsDown(87)) {
      camera_velocity.y += 1;
    }

    let camera_delta = new p5.Vector(0, 0);
    camera_velocity.add(camera_delta);
    camera_offset.add(camera_velocity);
    camera_velocity.mult(0.95); // cheap easing
    if (camera_velocity.mag() < 0.01) {
      camera_velocity.setMag(0);
    }

    let world_pos = screenToWorld(
      [0 - sketch.mouseX, sketch.mouseY],
      [camera_offset.x, camera_offset.y]
    );
    let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

    sketch.background(100);

    if (p3_drawBefore) {
      p3_drawBefore();
    }

    let overdraw = 0.1;

    let y0 = Math.floor((0 - overdraw) * tile_rows);
    let y1 = Math.floor((1 + overdraw) * tile_rows);
    let x0 = Math.floor((0 - overdraw) * tile_columns);
    let x1 = Math.floor((1 + overdraw) * tile_columns);

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        drawTile(tileRenderingOrder([x + world_offset.x, y - world_offset.y]), [
          camera_offset.x,
          camera_offset.y
        ]); // odd row
      }
      for (let x = x0; x < x1; x++) {
        drawTile(
          tileRenderingOrder([
            x + 0.5 + world_offset.x,
            y + 0.5 - world_offset.y
          ]),
          [camera_offset.x, camera_offset.y]
        ); // even rows are offset horizontally
      }
    }

    describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);

    if (p3_drawAfter) {
      p3_drawAfter();
    }
  }

  // Display a discription of the tile at world_x, world_y.
  function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
    let [screen_x, screen_y] = worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
  }

  function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
    sketch.push();
    sketch.translate(screen_x, screen_y);
    if (p3_drawSelectedTile) {
      p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
    }
    sketch.pop();
  }

  // Draw a tile, mostly by calling the user's drawing code.
  function drawTile([world_x, world_y], [camera_x, camera_y]) {
    let [screen_x, screen_y] = worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    sketch.push();
    sketch.translate(0 - screen_x, screen_y);
    if (p3_drawTile) {
      p3_drawTile(world_x, world_y, -screen_x, screen_y);
    }
    sketch.pop();
  }

  /* global XXH */
  /* exported --
      p3_preload
      p3_setup
      p3_worldKeyChanged
      p3_tileWidth
      p3_tileHeight
      p3_tileClicked
      p3_drawBefore
      p3_drawTile
      p3_drawSelectedTile
      p3_drawAfter
  */

  /* global loadImage, random, vertex, beginShape, endShape, image, push, pop, XXH, p3_tileWidth, p3_tileHeight, background */
  /* exported p3_preload, p3_setup, p3_worldKeyChanged, p3_tileClicked, p3_drawBefore, p3_drawTile, p3_drawSelectedTile, p3_drawAfter */

  let boatTextures = [];
  let boats = {}; // Stores data for each boat

  const stars = [];  // Array to hold stars and their effects
  const starFallDuration = 1000; // Duration in milliseconds for a star to fall

  function p3_preload() {
    boatTextures.push(sketch.loadImage("https://cdn.glitch.global/8f3f247b-87c3-471c-ad5a-f0f0063f427f/Houses-1.png?v=1714539959255"));
    boatTextures.push(sketch.loadImage("https://cdn.glitch.global/8f3f247b-87c3-471c-ad5a-f0f0063f427f/Houses-2.png?v=1714540015783"));
  }

  function p3_setup() {
    canvas = sketch.createCanvas(600, 600 / 3);
    canvas.parent("canvas-container2");
    canvas.mousePressed(mouseClicked);  // Assuming this is how your canvas is set up
  }

  function handleMousePressed() {
      p3_tileClicked(sketch.floor(sketch.mouseX / p3_tileWidth()), sketch.floor(sketch.mouseY / p3_tileHeight()));
  }
  let worldSeed;

  function p3_worldKeyChanged(key) {
    worldSeed = XXH.h32(key, 0);
    sketch.noiseSeed(worldSeed);
    sketch.randomSeed(worldSeed);
    boats = {}; // Reset boats when the world key changes
  }

  function p3_tileWidth() {
    return 32; // Changed to match sprite width
  }

  function p3_tileHeight() {
    return 16; // Changed to match sprite height
  }

  function p3_drawBefore() {
    sketch.background("#DEF3F6");
  }

  function p3_drawTile(i, j) {
    // sketch.noStroke();
    //   noStroke();

    // Check if this tile has a fallen star and change color accordingly
    const starIndex = stars.findIndex(star => star.position.i === i && star.position.j === j);
    if (starIndex !== -1 && stars[starIndex].hasFallen) {
      sketch.fill("#6A0DAD"); // Change color to indicate a "dent" or mark
    } else {
      // Normal tile coloring
      if (XXH.h32("tile:" + [i, j], worldSeed) % 4 == 0) {
        sketch.fill("#996633"); // dirt
      } else if (XXH.h32("tile:" + [i, j], worldSeed) % 3 == 0) {
        sketch.fill("#136d15"); // dark green
      } else {
        sketch.fill("#7CFC00"); // light green
      }
    }

    sketch.push();
    sketch.translate(0, 0);
    sketch.beginShape();
    sketch.vertex(-p3_tileWidth(), 0);
    sketch.vertex(0, p3_tileHeight());
    sketch.vertex(p3_tileWidth(), 0);
    sketch.vertex(0, -p3_tileHeight());
    sketch.endShape(sketch.CLOSE);
    
    // stroke();
    if (starIndex !== -1) {
      const star = stars[starIndex];
      const timeElapsed = sketch.millis() - star.startTime;
      if (timeElapsed <= starFallDuration) {
        let dropDistance = sketch.map(timeElapsed, 0, starFallDuration, -50, 0);
        
        sketch.push();
        sketch.translate(0, dropDistance);
        sketch.beginShape();
        sketch.fill(0, 0, 0, 32);
        sketch.ellipse(0, -dropDistance, 10, 5);
        sketch.fill("#FFFF00");

        for (let a = 0; a < sketch.TWO_PI; a += sketch.TWO_PI / 5) {
          let x = sketch.cos(a) * 10;
          let y = sketch.sin(a) * 10;
          sketch.vertex(x, y);
          x = sketch.cos(a + sketch.PI / 5) * 5;
          y = sketch.sin(a + sketch.PI / 5) * 5;
          sketch.vertex(x, y);
        }
        sketch.endShape(sketch.CLOSE);
        // sketch.fill(0, 0, 0, 32);
        // sketch.ellipse(0, -dropDistance, 10, 5);
        // sketch.translate(0, dropDistance);
        sketch.pop();
      } else {
        // Mark the star as fallen to permanently change the tile's appearance
        stars[starIndex].hasFallen = true;
      }
    }

    // pop();

    // Check and draw boat
    const tileKey = `${i}_${j}`;
    if (!boats[tileKey] && XXH.h32(tileKey, worldSeed).toNumber() % 100 < 10) {
      boats[tileKey] = {
        textureIndex: sketch.floor(sketch.random() * boatTextures.length),
        spriteIndex: sketch.floor(sketch.random() * 4) // Since there are 8 boats but arranged in 2 rows, 4 per row
      };
    }
    if (boats[tileKey]) {
      drawBoat(boats[tileKey].textureIndex, boats[tileKey].spriteIndex);
    }

    sketch.pop();
  }

  function drawBoat(textureIndex, spriteIndex) {
    const spriteX = (spriteIndex % 4) * 32; // 4 sprites per row, 32 pixels each
    const spriteY = Math.floor(spriteIndex / 4) * 32; // 2 rows, 32 pixels each
    sketch.image(boatTextures[textureIndex], -16, -24, 32, 32, spriteX, spriteY, 32, 32);
  }

  function p3_tileClicked(i, j) {
    const clickTime = sketch.millis();
    console.log(`Click at ${i}, ${j}`);  // Ensure this logs
    if (!stars.some(star => star.position.i === i && star.position.j === j)) {
        stars.push({ position: { i, j }, startTime: clickTime, hasFallen: false });
        console.log('Star added:', stars); // Check the output
    }
}


  function p3_drawSelectedTile(i, j) {
    sketch.fill(0);
    sketch.text("tile " + [i, j], 0, 0);
  }

  function p3_drawAfter() {}
      
}


const s3 = (sketch) => {
  /* global p5 */
  /* exported preload, setup, draw, mouseClicked */

  // Project base code provided by {amsmith,ikarth}@ucsc.edu


  let tile_width_step_main; // A width step is half a tile's width
  let tile_height_step_main; // A height step is half a tile's height

  // Global variables. These will mostly be overwritten in setup().
  let tile_rows, tile_columns;
  let camera_offset;
  let camera_velocity;

  /////////////////////////////
  // Transforms between coordinate systems
  // These are actually slightly weirder than in full 3d...
  /////////////////////////////
  function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
    let i = (world_x - world_y) * tile_width_step_main;
    let j = (world_x + world_y) * tile_height_step_main;
    return [i + camera_x, j + camera_y];
  }

  function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
    let i = (world_x - world_y) * tile_width_step_main;
    let j = (world_x + world_y) * tile_height_step_main;
    return [i, j];
  }

  function tileRenderingOrder(offset) {
    return [offset[1] - offset[0], offset[0] + offset[1]];
  }

  function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
    screen_x -= camera_x;
    screen_y -= camera_y;
    screen_x /= tile_width_step_main * 2;
    screen_y /= tile_height_step_main * 2;
    screen_y += 0.5;
    return [Math.floor(screen_y + screen_x), Math.floor(screen_y - screen_x)];
  }

  function cameraToWorldOffset([camera_x, camera_y]) {
    let world_x = camera_x / (tile_width_step_main * 2);
    let world_y = camera_y / (tile_height_step_main * 2);
    return { x: Math.round(world_x), y: Math.round(world_y) };
  }

  function worldOffsetToCamera([world_x, world_y]) {
    let camera_x = world_x * (tile_width_step_main * 2);
    let camera_y = world_y * (tile_height_step_main * 2);
    return new p5.Vector(camera_x, camera_y);
  }

  sketch.preload = function() {
    if (p3_preload) {
      p3_preload();
    }
  }

  sketch.setup = function() {
    //canvas1 = createCanvas(600, 600/3);
    //canvas1.parent("container");

    camera_offset = new p5.Vector(-sketch.width / 2, sketch.height / 2);
    camera_velocity = new p5.Vector(0, 0);

    if (p3_setup) {
      p3_setup();
    }
    for (let element of document.getElementsByClassName("p5Canvas")) {
      element.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    let label = sketch.createP();
    label.html("World key: ");
    label.parent("canvas-container3");

    let input = sketch.createInput("xyzzy");
    input.parent(label);
    input.input(() => {
      rebuildWorld(input.value());
    });

    sketch.createP("Arrow or wasd keys scroll").parent("canvas-container3");

    rebuildWorld(input.value());
  }

  function rebuildWorld(key) {
    if (p3_worldKeyChanged) {
      p3_worldKeyChanged(key);
    }
    tile_width_step_main = p3_tileWidth ? p3_tileWidth() : 32;
    tile_height_step_main = p3_tileHeight ? p3_tileHeight() : 14.5;
    tile_columns = Math.ceil(sketch.width / (tile_width_step_main * 2));
    tile_rows = Math.ceil((sketch.height + 150) / (tile_height_step_main * 2));
  }

  function mouseClicked() {
    let world_pos = screenToWorld(
      [0 - mouseX, mouseY],
      [camera_offset.x, camera_offset.y]
    );

    if (p3_tileClicked) {
      p3_tileClicked(world_pos[0], world_pos[1]);
    }
    return false;
  }

  sketch.draw = function() {
    // Keyboard controls!
    if (sketch.keyIsDown(sketch.LEFT_ARROW) || sketch.keyIsDown(65)) {
      camera_velocity.x -= 1;
    }
    if (sketch.keyIsDown(sketch.RIGHT_ARROW) || sketch.keyIsDown(68)) {
      camera_velocity.x += 1;
    }
    if (sketch.keyIsDown(sketch.DOWN_ARROW) || sketch.keyIsDown(83)) {
      camera_velocity.y -= 1;
    }
    if (sketch.keyIsDown(sketch.UP_ARROW) || sketch.keyIsDown(87)) {
      camera_velocity.y += 1;
    }

    let camera_delta = new p5.Vector(0, 0);
    camera_velocity.add(camera_delta);
    camera_offset.add(camera_velocity);
    camera_velocity.mult(0.95); // cheap easing
    if (camera_velocity.mag() < 0.01) {
      camera_velocity.setMag(0);
    }

    let world_pos = screenToWorld(
      [0 - sketch.mouseX, sketch.mouseY],
      [camera_offset.x, camera_offset.y]
    );
    let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

    sketch.background(100);

    if (p3_drawBefore) {
      p3_drawBefore();
    }

    let overdraw = 0.1;

    let y0 = Math.floor((0 - overdraw) * tile_rows);
    let y1 = Math.floor((1 + overdraw) * tile_rows);
    let x0 = Math.floor((0 - overdraw) * tile_columns);
    let x1 = Math.floor((1 + overdraw) * tile_columns);

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        drawTile(tileRenderingOrder([x + world_offset.x, y - world_offset.y]), [
          camera_offset.x,
          camera_offset.y
        ]); // odd row
      }
      for (let x = x0; x < x1; x++) {
        drawTile(
          tileRenderingOrder([
            x + 0.5 + world_offset.x,
            y + 0.5 - world_offset.y
          ]),
          [camera_offset.x, camera_offset.y]
        ); // even rows are offset horizontally
      }
    }

    describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);

    if (p3_drawAfter) {
      p3_drawAfter();
    }
  }

  // Display a discription of the tile at world_x, world_y.
  function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
    let [screen_x, screen_y] = worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
  }

  function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
    sketch.push();
    sketch.translate(screen_x, screen_y);
    if (p3_drawSelectedTile) {
      p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
    }
    sketch.pop();
  }

  // Draw a tile, mostly by calling the user's drawing code.
  function drawTile([world_x, world_y], [camera_x, camera_y]) {
    let [screen_x, screen_y] = worldToScreen(
      [world_x, world_y],
      [camera_x, camera_y]
    );
    sketch.push();
    sketch.translate(0 - screen_x, screen_y);
    if (p3_drawTile) {
      p3_drawTile(world_x, world_y, -screen_x, screen_y);
    }
    sketch.pop();
  }

  /* global XXH */
  /* exported --
      p3_preload
      p3_setup
      p3_worldKeyChanged
      p3_tileWidth
      p3_tileHeight
      p3_tileClicked
      p3_drawBefore
      p3_drawTile
      p3_drawSelectedTile
      p3_drawAfter
  */

  /* global XXH, p3_tileWidth, p3_tileHeight */
  /* exported p3_preload, p3_setup, p3_worldKeyChanged, p3_tileClicked, p3_drawBefore, p3_drawTile, p3_drawSelectedTile, p3_drawAfter */

  let boatTextures = [];
  let boats = {}; // Stores data for each boat

  function p3_preload() {
    boatTextures.push(sketch.loadImage("https://cdn.glitch.global/d85022b7-5f94-4d4b-bb89-0bb8bf14ba4b/boat.png?v=1714515416934"));
    boatTextures.push(sketch.loadImage("https://cdn.glitch.global/d85022b7-5f94-4d4b-bb89-0bb8bf14ba4b/ship15_1.png?v=1714527235212"));
  }

  function p3_setup() {
    canvas = sketch.createCanvas(600, 600/3);
    canvas.parent("canvas-container3");
  }

  let worldSeed;

  function p3_worldKeyChanged(key) {
    worldSeed = XXH.h32(key, 0);
    sketch.noiseSeed(worldSeed);
    sketch.randomSeed(worldSeed);
    boats = {}; // Reset boats when the world key changes
  }

  function p3_tileWidth() {
    return 16;
  }

  function p3_tileHeight() {
    return 8;
  }

  function p3_drawBefore() {
    sketch.background("#DEF3F6");
  }

  function p3_drawTile(i, j) {
    sketch.noStroke();

    // Define ocean colors
    const deepWaterColor = sketch.color("#003366"); // Dark blue for deep water
    const midWaterColor = sketch.color("#006699"); // Medium blue for mid-depth
    const shallowWaterColor = sketch.color("#00b7e4"); // Lighter blue for shallow areas
    const foamColor = sketch.color("#78e4ff"); // Very light blue for foam or wave crests

    // Calculate wave effect based on time and horizontal position
    const waveSpeed = 0.0015; // Speed at which the wave moves
    const waveFrequency = 0.2; // Frequency of the wave
    const waveAmplitude = 5; // Height of the wave
    const currentTime = sketch.millis();
    const wavePhase = currentTime * waveSpeed + i * waveFrequency;
    const waveEffect = sketch.sin(wavePhase) * waveAmplitude;

    // Interpolate between colors based on waveEffect, with swapped order
    let colorEffect;
    if (waveEffect < -2.5) {
      colorEffect = sketch.lerpColor(foamColor, shallowWaterColor, sketch.map(waveEffect, -5, -2.5, 0, 1));
    } else if (waveEffect < 2.5) {
      colorEffect = sketch.lerpColor(shallowWaterColor, midWaterColor, sketch.map(waveEffect, -2.5, 2.5, 0, 1));
    } else {
      colorEffect = sketch.lerpColor(midWaterColor, deepWaterColor, sketch.map(waveEffect, 2.5, 5, 0, 1));
    }

    sketch.fill(colorEffect); // Use the dynamically chosen color

    sketch.push();
    sketch.translate(0, waveEffect); // Apply the vertical displacement based on the wave
    sketch.beginShape();
    sketch.vertex(-p3_tileWidth(), 0);
    sketch.vertex(0, p3_tileHeight());
    sketch.vertex(p3_tileWidth(), 0);
    sketch.vertex(0, -p3_tileHeight());
    sketch.endShape(sketch.CLOSE);

    // Check and draw boat
    const tileKey = `${i}_${j}`;
    if (!boats[tileKey] && XXH.h32(tileKey, worldSeed).toNumber() % 100 < 10) {
      boats[tileKey] = {
        textureIndex: sketch.floor(sketch.random() * boatTextures.length) // Choose a random texture index
      };
    }
    if (boats[tileKey]) {
      drawBoat(boats[tileKey].textureIndex);
    }

    sketch.pop();
  }

  function drawBoat(textureIndex) {
    const scale = (p3_tileWidth() * 2) / 64;
    sketch.image(boatTextures[textureIndex], 0, -30, 64 * scale, 64 * scale);
  }

  function p3_tileClicked(i, j) {
    // This function can still handle interactions as needed
  }

  function p3_drawSelectedTile(i, j) {
    // noFill();
    sketch.fill(0);
    sketch.text("tile " + [i, j], 0, 0);
  }


  function p3_drawAfter() {}
      
}

let p51 = new p5(s1, "canvas-container1");


let p52 = new p5(s2, "canvas-container2");


let p53 = new p5(s3, "canvas-container3");
