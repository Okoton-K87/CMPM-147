
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
    
    //let label = sketch.createP();
    //label.html("World key: ");
    //label.parent("canvas-container1");

    //let input = sketch.createInput("xyzzy");
    //input.parent(label);
    //input.input(() => {
    //  rebuildWorld(input.value());
    //});

    //sketch.createP("Arrow keys scroll. Clicking changes tiles.").parent("canvas-container1");

    //rebuildWorld(input.value());
    
    rebuildWorld(Gkey);
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


  var splits = 2;
  var angles = 20;
  var randomAngle = 4;
  var randomLength = 0.4;
  var lengthConstant = 1.1;
  var num = 6;
  var shrinking = 1.5;
  var shift = 0;

  var limb = function (g, x, y, a, l) {
    g.line(x, y, x + sketch.cos(a) * l, y + sketch.sin(a) * l);
    return { x: x + sketch.cos(a) * l, y: y + sketch.sin(a) * l };
  };

  var generate = function (g, n) {
    var Loop = function (i, c) {
      var out = i;
      g.strokeWeight(out.l / 5);
      g.stroke(184, 86, 0);
      if (out.l < 8) {
        g.strokeWeight(out.l * 10);
        g.stroke(0 + sketch.random(-20,20), 189 + sketch.random(-20,20), 60 + sketch.random(-20,20));
      }
      var l = limb(g, out.x, out.y, out.a, out.l);
      for (let i = -0.5; i <= 0.5; i += 1 / (splits - 1)) {
        out.branches.push({
          branches: [],
          a:
          sketch.random(-randomAngle, randomAngle) +
            shift +
            out.a +
            i * (angles * 2) /* + sketch.random(-10,10)*/,
          x: l.x,
          y: l.y,
          l:
            out.l /
            (lengthConstant * (shrinking + sketch.random(-randomLength, randomLength))),
        });
      }
      if (c >= 0) {
        for (let i = 0; i < out.branches.length; i++) {
          out.branches[i] = Loop(out.branches[i], c - 1);
        }
      }
      return i;
    };
    var N = Loop(n, num);
    return N;
  };

  function p3_preload() {}

  let numTrees = 5;
  let trees = [];
  let numGrasses = 5;
  let GrassTiles1 = [];
  let GrassTiles2 = [];
  let numDirts = 5;
  let DirtTiles = [];

  let numWaters = 5;
  let LightWaterTiles = [];
  let DarkWaterTiles = [];

  function p3_setup() {
    canvas = sketch.createCanvas(600, 600/3);
    canvas.parent("canvas-container1");
    
    
    sketch.angleMode(sketch.DEGREES);
    for (let i = 0; i < numTrees; i++) {
      trees.push(null);
    }
    for (let i = 0; i < numGrasses; i++) {
      GrassTiles1.push(null);
      GrassTiles2.push(null);
    }
    for (let i = 0; i < numDirts; i++) {
      DirtTiles.push(null);
    }
    for (let i = 0; i < numWaters; i++) {
      LightWaterTiles.push(null);
      DarkWaterTiles.push(null);
    }
  }

  function p3_worldKeyChanged(key) {
    worldSeed = XXH.h32(key, 0);
    sketch.noiseSeed(worldSeed);
    sketch.randomSeed(worldSeed);
    for (let i = 0; i < trees.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      var start = {branches:[],a:-90,x:250,y:500,l:105};
      trees[i] = sketch.createGraphics(500, 500);
      generate(trees[i], start);
    }
    for (let i = 0; i < GrassTiles1.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      GrassTiles1[i] = sketch.createGraphics(tw*4, th*4);
      
      GrassTiles1[i].noStroke();
      
      GrassTiles1[i].fill(0, 165, 0);
      
      GrassTiles1[i].beginShape();
      GrassTiles1[i].vertex(0 + tw, th + th);
      GrassTiles1[i].vertex(tw + tw, th*2 + th);
      GrassTiles1[i].vertex(tw*2 + tw, th + th);
      GrassTiles1[i].vertex(tw + tw, 0 + th);
      GrassTiles1[i].endShape(sketch.CLOSE);
      let r = sketch.random(50, 100);
      //GrassTiles[i].stroke(r, r, r, 255);
      GrassTiles1[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          if(y/2 - x/2 + th*2 < (tw/2)/2 - (tw/2)/2 + th*2){
            GrassTiles1[i].stroke(0 + sketch.random(-20, 20), 165 + sketch.random(-20, 20), 0 + sketch.random(-20, 20));
            GrassTiles1[i].line(x + y + tw, y/2 - x/2 + th*2, x + y + tw, y/2 - x/2 + th*2 - sketch.random(4, 8));
          }
        }
      }
    }
    for (let i = 0; i < GrassTiles2.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      GrassTiles2[i] = sketch.createGraphics(tw*4, th*4);
      
      GrassTiles2[i].noStroke();
      
      //GrassTiles2[i].fill(0, 165, 0);
      
      //GrassTiles2[i].beginShape();
      //GrassTiles2[i].vertex(0 + tw, th + th);
      //GrassTiles2[i].vertex(tw + tw, th*2 + th);
      //GrassTiles2[i].vertex(tw*2 + tw, th + th);
      //GrassTiles2[i].vertex(tw + tw, 0 + th);
      //GrassTiles2[i].endShape(sketch.CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      GrassTiles2[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          if(y/2 - x/2 + th*2 >= (tw/2)/2 - (tw/2)/2 + th*2){
            GrassTiles2[i].stroke(0 + sketch.random(-20, 20), 165 + sketch.random(-20, 20), 0 + sketch.random(-20, 20));
            GrassTiles2[i].line(x + y + tw, y/2 - x/2 + th*2, x + y + tw, y/2 - x/2 + th*2 - sketch.random(4, 8));
          }
        }
      }
    }
    for (let i = 0; i < DirtTiles.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      DirtTiles[i] = sketch.createGraphics(tw*4, th*4);
      
      DirtTiles[i].noStroke();
      
      DirtTiles[i].fill(139,69,19);
      
      DirtTiles[i].beginShape();
      DirtTiles[i].vertex(0 + tw, th + th);
      DirtTiles[i].vertex(tw + tw, th*2 + th);
      DirtTiles[i].vertex(tw*2 + tw, th + th);
      DirtTiles[i].vertex(tw + tw, 0 + th);
      DirtTiles[i].endShape(sketch.CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      //DirtTiles[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          let r = sketch.random(-20, 20);
          DirtTiles[i].fill(139 + r, 69 + r, 19 + r);
          DirtTiles[i].ellipse(x + y + tw, y/2 - x/2 + th*2, sketch.random(3, 4), sketch.random(2, 3));
        }
      }
    }
    for (let i = 0; i < LightWaterTiles.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      LightWaterTiles[i] = sketch.createGraphics(tw*4, th*4);
      
      LightWaterTiles[i].noStroke();
      
      //WaterTiles[i].fill(139,69,19);
      
      LightWaterTiles[i].beginShape();
      LightWaterTiles[i].vertex(0 + tw, th + th);
      LightWaterTiles[i].vertex(tw + tw, th*2 + th);
      LightWaterTiles[i].vertex(tw*2 + tw, th + th);
      LightWaterTiles[i].vertex(tw + tw, 0 + th);
      LightWaterTiles[i].endShape(sketch.CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      //DirtTiles[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          let r = sketch.noise((x + y + tw) / (20), (y/2 - x/2 + th*2) / (5)) * 40 - 20 + sketch.noise((x + y + tw) / (20/4), (y/2 - x/2 + th*2) / (5/4)) * 10 - 5 + sketch.random(-5, 5);
          LightWaterTiles[i].fill(46 + r,163 + r,242 + r);
          LightWaterTiles[i].ellipse(x + y + tw, y/2 - x/2 + th*2, sketch.random(2, 3), sketch.random(2, 3));
        }
      }
    }
    for (let i = 0; i < DarkWaterTiles.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      DarkWaterTiles[i] = sketch.createGraphics(tw*4, th*4);
      
      DarkWaterTiles[i].noStroke();
      
      //WaterTiles[i].fill(139,69,19);
      
      DarkWaterTiles[i].beginShape();
      DarkWaterTiles[i].vertex(0 + tw, th + th);
      DarkWaterTiles[i].vertex(tw + tw, th*2 + th);
      DarkWaterTiles[i].vertex(tw*2 + tw, th + th);
      DarkWaterTiles[i].vertex(tw + tw, 0 + th);
      DarkWaterTiles[i].endShape(sketch.CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      //DirtTiles[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          //let r = sketch.random(-20, 20);
          
          let r = sketch.noise((x + y + tw) / (20), (y/2 - x/2 + th*2) / (5)) * 40 - 20 + sketch.noise((x + y + tw) / (20/4), (y/2 - x/2 + th*2) / (5/4)) * 10 - 5 + sketch.random(-5, 5);
          DarkWaterTiles[i].fill(12 + r,113 + r,195 + r);
          DarkWaterTiles[i].ellipse(x + y + tw, y/2 - x/2 + th*2, sketch.random(2, 3), sketch.random(2, 3));
        }
      }
    }
  }

  function p3_tileWidth() {
    return 32;
  }
  function p3_tileHeight() {
    return 16;
  }

  let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

  let clicks = {};

  function p3_tileClicked(i, j) {
    let key = [i, j];
    clicks[key] = 1 + (clicks[key] | 0);
  }

  function p3_drawBefore() {}

  function p3_drawTile(i, j, canvas) {
    sketch.noStroke();
    let N = sketch.noise(i/10, j/10)*0.7 + sketch.noise(i/5, j/5)*0.3;
    if (N > 0.5/*XXH.h32("tile:" + [i, j], worldSeed) % 2 == 0*/) {
      sketch.fill(240, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      sketch.image(GrassTiles1[XXH.h32("tile:" + [i, j], worldSeed + 5 * 3) % (GrassTiles1.length)], -tw * 2, -th * 2, tw*4, th*4);

      //var start = {branches:[],a:-90,x:0,y:0,l:105};
      //generate(start);
      if (XXH.h32("tile:" + [i, j], worldSeed) % 5 == 0) {
        let n1 = sketch.noise(i, j, sketch.millis()/10000) * 30 - 15;
        let n2 = sketch.noise(i, j, sketch.millis()/3000) * 15 - (15/2);
        let n = n1 + n2;
        sketch.rotate(n);
        sketch.image(trees[XXH.h32("tile:" + [i, j], worldSeed + 5 * 3) % (trees.length)], -100, -200, 200, 200);
        sketch.rotate(-n);
      }
      sketch.image(GrassTiles2[XXH.h32("tile:" + [i, j], worldSeed + 5 * 3) % (GrassTiles2.length)], -tw * 2, -th * 2, tw*4, th*4);
    } else if(N <= 0.5 && N > 0.4) {
      sketch.fill(255, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      
      sketch.image(DirtTiles[XXH.h32("tile:" + [i, j], worldSeed + 73 / 2) % (DirtTiles.length)], -tw * 2, -th * 2, tw*4, th*4);
    } else if(N <= 0.4 && N > 0.3) {
      sketch.fill(255, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      
      sketch.image(LightWaterTiles[XXH.h32("tile:" + [i, j], worldSeed + 73 / 2) % (LightWaterTiles.length)], -tw * 2, -th * 2, tw*4, th*4);
    } else {
      sketch.fill(255, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      
      sketch.image(DarkWaterTiles[XXH.h32("tile:" + [i, j], worldSeed + 73 / 2) % (DarkWaterTiles.length)], -tw * 2, -th * 2, tw*4, th*4);
    }

    //push();

    //beginShape();
    //vertex(-tw, 0);
    //vertex(0, th);
    //vertex(tw, 0);
    //vertex(0, -th);
    //endShape(sketch.CLOSE);

    //var start = {branches:[],a:-90,x:0,y:0,l:105};
    //generate(start);
    //image(trees[0], -50, -100, 100, 100);

    //ellipse(0, 0, 10, 10);

    let n = clicks[[i, j]] | 0;
    if (n % 2 == 1) {
      sketch.fill(0, 0, 0, 32);
      sketch.ellipse(0, 0, 10, 5);
      sketch.translate(0, -10);
      sketch.fill(255, 255, 100, 128);
      sketch.ellipse(0, 0, 10, 10);
    }

    sketch.pop();
  }

  function p3_drawSelectedTile(i, j, canvas) {
    sketch.noFill();
    sketch.stroke(0, 255, 0, 128);

    sketch.beginShape();
    sketch.vertex(-tw, 0);
    sketch.vertex(0, th);
    sketch.vertex(tw, 0);
    sketch.vertex(0, -th);
    sketch.endShape(sketch.CLOSE);

    sketch.noStroke();
    sketch.fill(0);
    sketch.text("tile " + [i, j], 0, 0);
  }

  function p3_drawAfter() {
    //image(trees[0], 200, 200, 100, 100);
  }
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

    //let label = sketch.createP();
    //label.html("World key: ");
    //label.parent("canvas-container2");

    //let input = sketch.createInput("xyzzy");
    //input.parent(label);
    //input.input(() => {
    //  rebuildWorld(input.value());
    //});

    //sketch.createP("Arrow keys scroll. Clicking changes tiles.").parent("canvas-container2");

    //rebuildWorld(input.value());
    rebuildWorld(Gkey);
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

  var canvas1;

  var splits = 2;
  var angles = 20;
  var randomAngle = 4;
  var randomLength = 0.4;
  var lengthConstant = 1.1;
  var num = 6;
  var shrinking = 1.5;
  var shift = 0;

  var autumnColors = [{r:244,g:123,b:32}, {r:240,g:81,b:51}];


var limb = function (g, x, y, a, l) {
  g.line(x, y, x + sketch.cos(a) * l, y + sketch.sin(a) * l);
  return { x: x + sketch.cos(a) * l, y: y + sketch.sin(a) * l };
};

var generate = function (g, n, c) {
  let leafColor = c;
  var Loop = function (i, c) {
    var out = i;
    g.strokeWeight(out.l / 5);
    g.stroke(184, 86, 0);
    if (out.l < 8) {
      g.strokeWeight(out.l * 10);
      g.stroke(leafColor.r + sketch.random(-20,20), leafColor.g + sketch.random(-20,20), leafColor.b + sketch.random(-20,20));
    }
    var l = limb(g, out.x, out.y, out.a, out.l);
    for (let i = -0.5; i <= 0.5; i += 1 / (splits - 1)) {
      out.branches.push({
        branches: [],
        a:
          sketch.random(-randomAngle, randomAngle) +
          shift +
          out.a +
          i * (angles * 2) /* + random(-10,10)*/,
        x: l.x,
        y: l.y,
        l:
          out.l /
          (lengthConstant * (shrinking + sketch.random(-randomLength, randomLength))),
      });
    }
    if (c >= 0) {
      for (let i = 0; i < out.branches.length; i++) {
        out.branches[i] = Loop(out.branches[i], c - 1);
      }
    }
    return i;
  };
  var N = Loop(n, num);
  return N;
};

  function p3_preload() {}

  let numTrees = 5;
  let trees = [];
  let numGrasses = 5;
  let GrassTiles1 = [];
  let GrassTiles2 = [];
  let numDirts = 5;
  let DirtTiles = [];

  let numWaters = 5;
  let LightWaterTiles = [];
  let DarkWaterTiles = [];

  function p3_setup() {
    canvas = sketch.createCanvas(600, 600/3);
    canvas.parent("canvas-container2");
    
    
    sketch.angleMode(sketch.DEGREES);
    for (let i = 0; i < numTrees; i++) {
      trees.push(null);
    }
    for (let i = 0; i < numGrasses; i++) {
      GrassTiles1.push(null);
      GrassTiles2.push(null);
    }
    for (let i = 0; i < numDirts; i++) {
      DirtTiles.push(null);
    }
    for (let i = 0; i < numWaters; i++) {
      LightWaterTiles.push(null);
      DarkWaterTiles.push(null);
    }
  }

  function p3_worldKeyChanged(key) {
    worldSeed = XXH.h32(key, 0);
    sketch.noiseSeed(worldSeed);
    sketch.randomSeed(worldSeed);
    for (let i = 0; i < trees.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      var start = {branches:[],a:-90,x:250,y:500,l:105};
      trees[i] = sketch.createGraphics(500, 500);
      generate(trees[i], start, sketch.random(autumnColors));
    }
    for (let i = 0; i < GrassTiles1.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      GrassTiles1[i] = sketch.createGraphics(tw*4, th*4);
      
      GrassTiles1[i].noStroke();
      
      GrassTiles1[i].fill(0, 165, 0);
      
      GrassTiles1[i].beginShape();
      GrassTiles1[i].vertex(0 + tw, th + th);
      GrassTiles1[i].vertex(tw + tw, th*2 + th);
      GrassTiles1[i].vertex(tw*2 + tw, th + th);
      GrassTiles1[i].vertex(tw + tw, 0 + th);
      GrassTiles1[i].endShape(sketch.CLOSE);
      let r = sketch.random(50, 100);
      //GrassTiles[i].stroke(r, r, r, 255);
      GrassTiles1[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          if(y/2 - x/2 + th*2 < (tw/2)/2 - (tw/2)/2 + th*2){
            //153, 148, 75
            //GrassTiles1[i].stroke(0 + random(-20, 20), 165 + random(-20, 20), 75 + random(-20, 20));
            GrassTiles1[i].stroke(153 + sketch.random(-20, 20), 148 + sketch.random(-20, 10), 0 + sketch.random(-20, 20));
            GrassTiles1[i].line(x + y + tw, y/2 - x/2 + th*2, x + y + tw, y/2 - x/2 + th*2 - sketch.random(4, 8));
          }
        }
      }
    }
    for (let i = 0; i < GrassTiles2.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      GrassTiles2[i] = sketch.createGraphics(tw*4, th*4);
      
      GrassTiles2[i].noStroke();
      
      //GrassTiles2[i].fill(0, 165, 0);
      
      //GrassTiles2[i].beginShape();
      //GrassTiles2[i].vertex(0 + tw, th + th);
      //GrassTiles2[i].vertex(tw + tw, th*2 + th);
      //GrassTiles2[i].vertex(tw*2 + tw, th + th);
      //GrassTiles2[i].vertex(tw + tw, 0 + th);
      //GrassTiles2[i].endShape(CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      GrassTiles2[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          if(y/2 - x/2 + th*2 >= (tw/2)/2 - (tw/2)/2 + th*2){
            //153, 148, 75
            //GrassTiles2[i].stroke(0 + random(-20, 20), 165 + random(-20, 20), 75 + random(-20, 20));
            GrassTiles2[i].stroke(153 + sketch.random(-20, 20), 148 + sketch.random(-20, 10), 0 + sketch.random(-20, 20));
            GrassTiles2[i].line(x + y + tw, y/2 - x/2 + th*2, x + y + tw, y/2 - x/2 + th*2 - sketch.random(4, 8));
          }
        }
      }
    }
    for (let i = 0; i < DirtTiles.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      DirtTiles[i] = sketch.createGraphics(tw*4, th*4);
      
      DirtTiles[i].noStroke();
      
      DirtTiles[i].fill(139,69,19);
      
      DirtTiles[i].beginShape();
      DirtTiles[i].vertex(0 + tw, th + th);
      DirtTiles[i].vertex(tw + tw, th*2 + th);
      DirtTiles[i].vertex(tw*2 + tw, th + th);
      DirtTiles[i].vertex(tw + tw, 0 + th);
      DirtTiles[i].endShape(sketch.CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      //DirtTiles[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          let r = sketch.random(-20, 20);
          DirtTiles[i].fill(139 + r, 69 + r, 19 + r);
          DirtTiles[i].ellipse(x + y + tw, y/2 - x/2 + th*2, sketch.random(3, 4), sketch.random(2, 3));
        }
      }
    }
    for (let i = 0; i < LightWaterTiles.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      LightWaterTiles[i] = sketch.createGraphics(tw*4, th*4);
      
      LightWaterTiles[i].noStroke();
      
      //WaterTiles[i].fill(139,69,19);
      
      LightWaterTiles[i].beginShape();
      LightWaterTiles[i].vertex(0 + tw, th + th);
      LightWaterTiles[i].vertex(tw + tw, th*2 + th);
      LightWaterTiles[i].vertex(tw*2 + tw, th + th);
      LightWaterTiles[i].vertex(tw + tw, 0 + th);
      LightWaterTiles[i].endShape(sketch.CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      //DirtTiles[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          let r = sketch.noise((x + y + tw) / (20), (y/2 - x/2 + th*2) / (5)) * 40 - 20 + sketch.noise((x + y + tw) / (20/4), (y/2 - x/2 + th*2) / (5/4)) * 10 - 5 + sketch.random(-5, 5);
          LightWaterTiles[i].fill(46 + r,163 + r,242 + r);
          LightWaterTiles[i].ellipse(x + y + tw, y/2 - x/2 + th*2, sketch.random(2, 3), sketch.random(2, 3));
        }
      }
    }
    for (let i = 0; i < DarkWaterTiles.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      DarkWaterTiles[i] = sketch.createGraphics(tw*4, th*4);
      
      DarkWaterTiles[i].noStroke();
      
      //WaterTiles[i].fill(139,69,19);
      
      DarkWaterTiles[i].beginShape();
      DarkWaterTiles[i].vertex(0 + tw, th + th);
      DarkWaterTiles[i].vertex(tw + tw, th*2 + th);
      DarkWaterTiles[i].vertex(tw*2 + tw, th + th);
      DarkWaterTiles[i].vertex(tw + tw, 0 + th);
      DarkWaterTiles[i].endShape(sketch.CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      //DirtTiles[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          //let r = random(-20, 20);
          
          let r = sketch.noise((x + y + tw) / (20), (y/2 - x/2 + th*2) / (5)) * 40 - 20 + sketch.noise((x + y + tw) / (20/4), (y/2 - x/2 + th*2) / (5/4)) * 10 - 5 + sketch.random(-5, 5);
          DarkWaterTiles[i].fill(12 + r,113 + r,195 + r);
          DarkWaterTiles[i].ellipse(x + y + tw, y/2 - x/2 + th*2, sketch.random(2, 3), sketch.random(2, 3));
        }
      }
    }
  }

  function p3_tileWidth() {
    return 32;
  }
  function p3_tileHeight() {
    return 16;
  }

  let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

  let clicks = {};

  function p3_tileClicked(i, j) {
    let key = [i, j];
    clicks[key] = 1 + (clicks[key] | 0);
  }

  function p3_drawBefore() {}

  function p3_drawTile(i, j, canvas) {
    sketch.noStroke();
    let N = sketch.noise(i/10, j/10)*0.7 + sketch.noise(i/5, j/5)*0.3;
    if (N > 0.5/*XXH.h32("tile:" + [i, j], worldSeed) % 2 == 0*/) {
      sketch.fill(240, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      sketch.image(GrassTiles1[XXH.h32("tile:" + [i, j], worldSeed + 5 * 3) % (GrassTiles1.length)], -tw * 2, -th * 2, tw*4, th*4);

      //var start = {branches:[],a:-90,x:0,y:0,l:105};
      //generate(start);
      if (XXH.h32("tile:" + [i, j], worldSeed) % 5 == 0) {
        let n1 = sketch.noise(i, j, sketch.millis()/10000) * 30 - 15;
        let n2 = sketch.noise(i, j, sketch.millis()/3000) * 15 - (15/2);
        let n = n1 + n2;
        sketch.rotate(n);
        sketch.image(trees[XXH.h32("tile:" + [i, j], worldSeed + 5 * 3) % (trees.length)], -100, -200, 200, 200);
        sketch.rotate(-n);
      }
      sketch.image(GrassTiles2[XXH.h32("tile:" + [i, j], worldSeed + 5 * 3) % (GrassTiles2.length)], -tw * 2, -th * 2, tw*4, th*4);
    } else if(N <= 0.5 && N > 0.4) {
      sketch.fill(255, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      
      sketch.image(DirtTiles[XXH.h32("tile:" + [i, j], worldSeed + 73 / 2) % (DirtTiles.length)], -tw * 2, -th * 2, tw*4, th*4);
    } else if(N <= 0.4 && N > 0.3) {
      sketch.fill(255, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      
      sketch.image(LightWaterTiles[XXH.h32("tile:" + [i, j], worldSeed + 73 / 2) % (LightWaterTiles.length)], -tw * 2, -th * 2, tw*4, th*4);
    } else {
      sketch.fill(255, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      
      sketch.image(DarkWaterTiles[XXH.h32("tile:" + [i, j], worldSeed + 73 / 2) % (DarkWaterTiles.length)], -tw * 2, -th * 2, tw*4, th*4);
    }

    //push();

    //beginShape();
    //vertex(-tw, 0);
    //vertex(0, th);
    //vertex(tw, 0);
    //vertex(0, -th);
    //endShape(sketch.CLOSE);

    //var start = {branches:[],a:-90,x:0,y:0,l:105};
    //generate(start);
    //image(trees[0], -50, -100, 100, 100);

    //ellipse(0, 0, 10, 10);

    let n = clicks[[i, j]] | 0;
    if (n % 2 == 1) {
      sketch.fill(0, 0, 0, 32);
      sketch.ellipse(0, 0, 10, 5);
      sketch.translate(0, -10);
      sketch.fill(255, 255, 100, 128);
      sketch.ellipse(0, 0, 10, 10);
    }

    sketch.pop();
  }

  function p3_drawSelectedTile(i, j, canvas) {
    sketch.noFill();
    sketch.stroke(0, 255, 0, 128);

    sketch.beginShape();
    sketch.vertex(-tw, 0);
    sketch.vertex(0, th);
    sketch.vertex(tw, 0);
    sketch.vertex(0, -th);
    sketch.endShape(sketch.CLOSE);

    sketch.noStroke();
    sketch.fill(0);
    sketch.text("tile " + [i, j], 0, 0);
  }

  function p3_drawAfter() {
    //image(trees[0], 200, 200, 100, 100);
  }
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

  var canvas1;

  var splits = 2;
  var angles = 20;
  var randomAngle = 4;
  var randomLength = 0.4;
  var lengthConstant = 1.1;
  var num = 6;
  var shrinking = 1.5;
  var shift = 0;

  var autumnColors = [{r:244,g:123,b:32}, {r:240,g:81,b:51}];

var limb = function (g, x, y, a, l) {
  g.line(x, y, x + sketch.cos(a) * l, y + sketch.sin(a) * l);
  return { x: x + sketch.cos(a) * l, y: y + sketch.sin(a) * l };
};

var generate = function (g, n, c) {
  let leafColor = c;
  var Loop = function (i, c) {
    var out = i;
    g.strokeWeight(out.l / 5);
    g.stroke(184, 86, 0);
    if (out.l < 8) {
      g.strokeWeight(out.l * 10);
      g.stroke(leafColor.r + sketch.random(-20,20), leafColor.g + sketch.random(-20,20), leafColor.b + sketch.random(-20,20));
      return;
    }
    var l = limb(g, out.x, out.y, out.a, out.l);
    for (let i = -0.5; i <= 0.5; i += 1 / (splits - 1)) {
      out.branches.push({
        branches: [],
        a:
        sketch.random(-randomAngle, randomAngle) +
          shift +
          out.a +
          i * (angles * 2) /* + random(-10,10)*/,
        x: l.x,
        y: l.y,
        l:
          out.l /
          (lengthConstant * (shrinking + sketch.random(-randomLength, randomLength))),
      });
    }
    if (c >= 0) {
      for (let i = 0; i < out.branches.length; i++) {
        out.branches[i] = Loop(out.branches[i], c - 1);
      }
    }
    return i;
  };
  var N = Loop(n, num);
  return N;
};

  function p3_preload() {}

  let numTrees = 5;
  let trees = [];
  let numGrasses = 5;
  let GrassTiles1 = [];
  let GrassTiles2 = [];
  let numDirts = 5;
  let DirtTiles = [];

  let numWaters = 5;
  let LightWaterTiles = [];
  let DarkWaterTiles = [];

  function p3_setup() {
    canvas = sketch.createCanvas(600, 600/3);
    canvas.parent("canvas-container3");
    
    
    sketch.angleMode(sketch.DEGREES);
    for (let i = 0; i < numTrees; i++) {
      trees.push(null);
    }
    for (let i = 0; i < numGrasses; i++) {
      GrassTiles1.push(null);
      GrassTiles2.push(null);
    }
    for (let i = 0; i < numDirts; i++) {
      DirtTiles.push(null);
    }
    for (let i = 0; i < numWaters; i++) {
      LightWaterTiles.push(null);
      DarkWaterTiles.push(null);
    }
  }

  function p3_worldKeyChanged(key) {
    worldSeed = XXH.h32(key, 0);
    sketch.noiseSeed(worldSeed);
    sketch.randomSeed(worldSeed);
    for (let i = 0; i < trees.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      var start = {branches:[],a:-90,x:250,y:500,l:105};
      trees[i] = sketch.createGraphics(500, 500);
      generate(trees[i], start, sketch.random(autumnColors));
    }
    for (let i = 0; i < GrassTiles1.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      GrassTiles1[i] = sketch.createGraphics(tw*4, th*4);
      
      GrassTiles1[i].noStroke();
      
      GrassTiles1[i].fill(255, 255, 255);
      
      GrassTiles1[i].beginShape();
      GrassTiles1[i].vertex(0 + tw, th + th);
      GrassTiles1[i].vertex(tw + tw, th*2 + th);
      GrassTiles1[i].vertex(tw*2 + tw, th + th);
      GrassTiles1[i].vertex(tw + tw, 0 + th);
      GrassTiles1[i].endShape(sketch.CLOSE);
      let r = sketch.random(50, 100);
      //GrassTiles[i].stroke(r, r, r, 255);
      GrassTiles1[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          if(y/2 - x/2 + th*2 < (tw/2)/2 - (tw/2)/2 + th*2){
            //153, 148, 75
            //GrassTiles1[i].stroke(0 + sketch.random(-20, 20), 165 + sketch.random(-20, 20), 75 + sketch.random(-20, 20));
            GrassTiles1[i].stroke(240 + sketch.random(-10, 10), 240 + sketch.random(-10, 10), 240 + sketch.random(-10, 10));
            GrassTiles1[i].line(x + y + tw, y/2 - x/2 + th*2, x + y + tw, y/2 - x/2 + th*2 - sketch.random(4, 8));
          }
        }
      }
    }
    for (let i = 0; i < GrassTiles2.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      GrassTiles2[i] = sketch.createGraphics(tw*4, th*4);
      
      GrassTiles2[i].noStroke();
      
      //GrassTiles2[i].fill(0, 165, 0);
      
      //GrassTiles2[i].beginShape();
      //GrassTiles2[i].vertex(0 + tw, th + th);
      //GrassTiles2[i].vertex(tw + tw, th*2 + th);
      //GrassTiles2[i].vertex(tw*2 + tw, th + th);
      //GrassTiles2[i].vertex(tw + tw, 0 + th);
      //GrassTiles2[i].endShape(CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      GrassTiles2[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          if(y/2 - x/2 + th*2 >= (tw/2)/2 - (tw/2)/2 + th*2){
            //153, 148, 75
            //GrassTiles2[i].stroke(0 + sketch.random(-20, 20), 165 + sketch.random(-20, 20), 75 + sketch.random(-20, 20));
            GrassTiles2[i].stroke(240 + sketch.random(-10, 10), 240 + sketch.random(-10, 10), 240 + sketch.random(-10, 10));
            GrassTiles2[i].line(x + y + tw, y/2 - x/2 + th*2, x + y + tw, y/2 - x/2 + th*2 - sketch.random(4, 8));
          }
        }
      }
    }
    for (let i = 0; i < DirtTiles.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      DirtTiles[i] = sketch.createGraphics(tw*4, th*4);
      
      DirtTiles[i].noStroke();
      
      DirtTiles[i].fill(139,69,19);
      
      DirtTiles[i].beginShape();
      DirtTiles[i].vertex(0 + tw, th + th);
      DirtTiles[i].vertex(tw + tw, th*2 + th);
      DirtTiles[i].vertex(tw*2 + tw, th + th);
      DirtTiles[i].vertex(tw + tw, 0 + th);
      DirtTiles[i].endShape(sketch.CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      //DirtTiles[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          let sc = sketch.noise((x + y + tw) / (40/4), (y/2 - x/2 + th*2) / (5/4)) * 40 - 20 + sketch.noise((x + y + tw) / (20/8), (y/2 - x/2 + th*2) / (5/8)) * 10 - 5 + sketch.random(-5, 5);
          
          let r = sketch.random(-20, 20);
          DirtTiles[i].fill(139 + r, 69 + r, 19 + r);
          
          if(sc > 5){
            let r = sketch.random(-20, 20);
            DirtTiles[i].fill(240 + r, 240 + r, 240 + r);
          }
          
          DirtTiles[i].ellipse(x + y + tw, y/2 - x/2 + th*2, sketch.random(3, 4), sketch.random(2, 3));
        }
      }
    }
    for (let i = 0; i < LightWaterTiles.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      LightWaterTiles[i] = sketch.createGraphics(tw*4, th*4);
      
      LightWaterTiles[i].noStroke();
      
      //WaterTiles[i].fill(139,69,19);
      
      LightWaterTiles[i].beginShape();
      LightWaterTiles[i].vertex(0 + tw, th + th);
      LightWaterTiles[i].vertex(tw + tw, th*2 + th);
      LightWaterTiles[i].vertex(tw*2 + tw, th + th);
      LightWaterTiles[i].vertex(tw + tw, 0 + th);
      LightWaterTiles[i].endShape(sketch.CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      //DirtTiles[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          let r = sketch.noise((x + y + tw) / (20), (y/2 - x/2 + th*2) / (5)) * 40 - 20 + sketch.noise((x + y + tw) / (20/4), (y/2 - x/2 + th*2) / (5/4)) * 10 - 5 + sketch.random(-5, 5);
          
          //174, 219, 240
          
          LightWaterTiles[i].fill(174 + r/2,219 + r/2,240 + r/2);
          LightWaterTiles[i].ellipse(x + y + tw, y/2 - x/2 + th*2, sketch.random(2, 3), sketch.random(2, 3));
        }
      }
    }
    for (let i = 0; i < DarkWaterTiles.length; i++) {
      //trees[i].ellipse(250, 250, 500, 500);
      DarkWaterTiles[i] = sketch.createGraphics(tw*4, th*4);
      
      DarkWaterTiles[i].noStroke();
      
      //WaterTiles[i].fill(139,69,19);
      
      DarkWaterTiles[i].beginShape();
      DarkWaterTiles[i].vertex(0 + tw, th + th);
      DarkWaterTiles[i].vertex(tw + tw, th*2 + th);
      DarkWaterTiles[i].vertex(tw*2 + tw, th + th);
      DarkWaterTiles[i].vertex(tw + tw, 0 + th);
      DarkWaterTiles[i].endShape(sketch.CLOSE);
      //GrassTiles[i].stroke(r, r, r, 255);
      //DirtTiles[i].fill(0, 0, 0);
      
      for(let x = tw; x >= 0; x -= tw/20){
        for(let y = tw; y >= 0; y -= th/20){
          //let r = sketch.random(-20, 20);
          
          let r = sketch.noise((x + y + tw) / (20), (y/2 - x/2 + th*2) / (5)) * 40 - 20 + sketch.noise((x + y + tw) / (20/4), (y/2 - x/2 + th*2) / (5/4)) * 10 - 5 + sketch.random(-5, 5);
          
          //107, 167, 204
          
          DarkWaterTiles[i].fill(174 + r/2,219 + r/2,240 + r/2);
          DarkWaterTiles[i].ellipse(x + y + tw, y/2 - x/2 + th*2, sketch.random(2, 3), sketch.random(2, 3));
        }
      }
    }
  }

  function p3_tileWidth() {
    return 32;
  }
  function p3_tileHeight() {
    return 16;
  }

  let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

  let clicks = {};

  function p3_tileClicked(i, j) {
    let key = [i, j];
    clicks[key] = 1 + (clicks[key] | 0);
  }

  function p3_drawBefore() {}

  function p3_drawTile(i, j, canvas) {
    sketch.noStroke();
    let N = sketch.noise(i/10, j/10)*0.7 + sketch.noise(i/5, j/5)*0.3;
    if (N > 0.5/*XXH.h32("tile:" + [i, j], worldSeed) % 2 == 0*/) {
      sketch.fill(240, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      sketch.image(GrassTiles1[XXH.h32("tile:" + [i, j], worldSeed + 5 * 3) % (GrassTiles1.length)], -tw * 2, -th * 2, tw*4, th*4);

      //var start = {branches:[],a:-90,x:0,y:0,l:105};
      //generate(start);
      if (XXH.h32("tile:" + [i, j], worldSeed) % 5 == 0) {
        let n1 = sketch.noise(i, j, sketch.millis()/10000) * 30 - 15;
        let n2 = sketch.noise(i, j, sketch.millis()/3000) * 15 - (15/2);
        let n = n1 + n2;
        sketch.rotate(n);
        sketch.image(trees[XXH.h32("tile:" + [i, j], worldSeed + 5 * 3) % (trees.length)], -100, -200, 200, 200);
        sketch.rotate(-n);
      }
      sketch.image(GrassTiles2[XXH.h32("tile:" + [i, j], worldSeed + 5 * 3) % (GrassTiles2.length)], -tw * 2, -th * 2, tw*4, th*4);
    } else if(N <= 0.5 && N > 0.4) {
      sketch.fill(255, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      
      sketch.image(DirtTiles[XXH.h32("tile:" + [i, j], worldSeed + 73 / 2) % (DirtTiles.length)], -tw * 2, -th * 2, tw*4, th*4);
    } else if(N <= 0.4 && N > 0.3) {
      sketch.fill(255, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      
      sketch.image(LightWaterTiles[XXH.h32("tile:" + [i, j], worldSeed + 73 / 2) % (LightWaterTiles.length)], -tw * 2, -th * 2, tw*4, th*4);
    } else {
      sketch.fill(255, 200);
      sketch.push();

      //beginShape();
      //vertex(-tw, 0);
      //vertex(0, th);
      //vertex(tw, 0);
      //vertex(0, -th);
      //endShape(sketch.CLOSE);
      
      sketch.image(DarkWaterTiles[XXH.h32("tile:" + [i, j], worldSeed + 73 / 2) % (DarkWaterTiles.length)], -tw * 2, -th * 2, tw*4, th*4);
    }

    //push();

    //beginShape();
    //vertex(-tw, 0);
    //vertex(0, th);
    //vertex(tw, 0);
    //vertex(0, -th);
    //endShape(sketch.CLOSE);

    //var start = {branches:[],a:-90,x:0,y:0,l:105};
    //generate(start);
    //image(trees[0], -50, -100, 100, 100);

    //ellipse(0, 0, 10, 10);

    let n = clicks[[i, j]] | 0;
    if (n % 2 == 1) {
      sketch.fill(0, 0, 0, 32);
      sketch.ellipse(0, 0, 10, 5);
      sketch.translate(0, -10);
      sketch.fill(255, 255, 100, 128);
      sketch.ellipse(0, 0, 10, 10);
    }

    sketch.pop();
  }

  function p3_drawSelectedTile(i, j, canvas) {
    sketch.noFill();
    sketch.stroke(0, 255, 0, 128);

    sketch.beginShape();
    sketch.vertex(-tw, 0);
    sketch.vertex(0, th);
    sketch.vertex(tw, 0);
    sketch.vertex(0, -th);
    sketch.endShape(sketch.CLOSE);

    sketch.noStroke();
    sketch.fill(0);
    sketch.text("tile " + [i, j], 0, 0);
  }

  function p3_drawAfter() {
    //image(trees[0], 200, 200, 100, 100);
  }
}

let p51 = new p5(s1, "canvas-container1");


let p52 = new p5(s2, "canvas-container2");


let p53 = new p5(s3, "canvas-container3");
