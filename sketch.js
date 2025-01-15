let walls = [];
let particle;

let wallCount = 3; // Number of text boundaries
let rayCount = 1; // Increment angle for rays
let boundaryTexts = ["works", "contact", "home"];
let boundaryPositions = [];
let ellipseImages = [];
let currentImageIndex = 0;
let nextImageIndex = 1;
let transitionProgress = 0; // Progress of the transition between images
let transitionSpeed = 0.01; // Speed of the transition
let ellipseCenter;
let ellipseRadius = 200; // Radius of the image "hover area"
let font; // Custom font

// Noise variables for particle movement
let noiseOffsetX = 0;
let noiseOffsetY = 1000;

// Image effect variables
let imageOpacity = 0.6; // Initial opacity
let imageRotation = 0; // Initial rotation angle

// Music variables
let music;
let isMusicPlaying = false;

function preload() {
  // Load the font
  font = loadFont("NotoSans.ttf");

  // Load other images for ellipse animation
  for (let i = 1; i <= 7; i++) {
    ellipseImages.push(loadImage(`png${i}.png`));
  }

  // Load the music
  music = loadSound("romantic.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Define ellipse center
  ellipseCenter = createVector(width / 2, height / 2);

  // Define positions for the text boundaries
  boundaryPositions = [
    createVector(width * 0.2, height * 0.2),
    createVector(width * 0.8, height * 0.3),
    createVector(width * 0.5, height * 0.8)
  ];

  // Create walls based on text boundaries
  for (let i = 0; i < wallCount; i++) {
    let text = boundaryTexts[i];
    let pos = boundaryPositions[i];
    walls.push(new BoundaryText(pos.x, pos.y, text));
  }

  // Create the particle
  particle = new Particle();

  noCursor();
}

function draw() {
  background(0);

  // Check if the cursor is inside the image bounds
  let distanceFromCenter = dist(mouseX, mouseY, ellipseCenter.x, ellipseCenter.y);
  if (distanceFromCenter < ellipseRadius) {
    imageOpacity = lerp(imageOpacity, 1, 0.1); // Gradually increase opacity to 100%
    imageRotation += radians(0.5); // Rotate the image

    // Increment transition progress
    transitionProgress += transitionSpeed;
    if (transitionProgress >= 1) {
      // Move to the next image when transition is complete
      currentImageIndex = nextImageIndex;
      nextImageIndex = (nextImageIndex + 1) % ellipseImages.length;
      transitionProgress = 0;
    }

    // Play music if not already playing
    if (!isMusicPlaying) {
      music.loop(); // Start looping music
      isMusicPlaying = true;
    }
  } else {
    imageOpacity = lerp(imageOpacity, 0.2, 0.1); // Gradually decrease opacity to 20%
    transitionProgress = 0; // Stop transition when not hovering

    // Stop music if it's playing
    if (isMusicPlaying) {
      music.stop();
      isMusicPlaying = false;
    }
  }

  // Draw the images with transition effect
  push();
  translate(ellipseCenter.x, ellipseCenter.y);
  rotate(imageRotation); // Apply rotation
  imageMode(CENTER);

  // Current image
  tint(255, 255 * (1 - transitionProgress) * imageOpacity); // Adjust opacity for current image
  let scaledWidth = ellipseImages[currentImageIndex].width / 2;
  let scaledHeight = ellipseImages[currentImageIndex].height / 2;
  image(ellipseImages[currentImageIndex], 0, 0, scaledWidth, scaledHeight);

  // Next image
  tint(255, 255 * transitionProgress * imageOpacity); // Adjust opacity for next image
  image(ellipseImages[nextImageIndex], 0, 0, scaledWidth, scaledHeight);
  pop();

  // Show walls and cast rays if cursor is inside the image bounds
  if (distanceFromCenter < ellipseRadius) {
    for (let wall of walls) {
      wall.show();
    }
    particle.update(mouseX, mouseY);
    particle.show();
    particle.look(walls);
  }

  // Draw the custom cursor (star shape)
  drawStar(mouseX, mouseY, 10, 15, 5);
}

// Function to draw a custom star cursor
function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = -PI / 2; a < TWO_PI - PI / 2; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// BoundaryText class
class BoundaryText {
  constructor(x, y, text) {
    this.pos = createVector(x, y);
    this.text = text;
    this.textBounds = font.textBounds(this.text, 0, 0, 32); // Calculate text bounds for collision
  }

  show() {
    fill(245, 219, 255); // Custom color for text
    noStroke();
    textAlign(CENTER, CENTER);
    textFont(font);
    textSize(32);
    text(this.text, this.pos.x, this.pos.y);
  }

  getBounds() {
    // Return bounds relative to the text's position
    return {
      left: this.pos.x - this.textBounds.w / 2,
      right: this.pos.x + this.textBounds.w / 2,
      top: this.pos.y - this.textBounds.h / 2,
      bottom: this.pos.y + this.textBounds.h / 2
    };
  }
}

// Rays class
class Ray {
  constructor(pos, angle) {
    this.pos = pos;
    this.dir = p5.Vector.fromAngle(angle);
  }

  cast(wall) {
    const bounds = wall.getBounds();
    const x1 = bounds.left;
    const y1 = bounds.top;
    const x2 = bounds.right;
    const y2 = bounds.bottom;

    const x3 = this.pos.x;
    const y3 = this.pos.y;
    const x4 = this.pos.x + this.dir.x;
    const y4 = this.pos.y + this.dir.y;

    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den == 0) {
      return null;
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

    if (t > 0 && t < 1 && u > 0) {
      const pt = createVector();
      pt.x = x1 + t * (x2 - x1);
      pt.y = y1 + t * (y2 - y1);
      return pt;
    } else {
      return null;
    }
  }
}

// Particle class
class Particle {
  constructor() {
    this.pos = createVector(width / 2, height / 2);
    this.rays = [];
    for (let a = 0; a < 360; a += rayCount) {
      this.rays.push(new Ray(this.pos, radians(a)));
    }
    this.interactions = [];
  }

  update(x, y) {
    this.pos.set(x, y);
  }

  look(walls) {
    for (let ray of this.rays) {
      let closest = null;
      let record = Infinity;
      for (let wall of walls) {
        const pt = ray.cast(wall);
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record) {
            record = d;
            closest = pt;
          }
        }
      }
      if (closest) {
        stroke(245, 219, 255, 80); // Ray color
        line(this.pos.x, this.pos.y, closest.x, closest.y);
        this.interactions.push({ from: this.pos.copy(), to: closest.copy() });
      }
    }
  }

  show() {
    fill(255);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 4);
  }
}

