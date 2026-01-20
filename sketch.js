/**
 * PROJECT: HYPER-ORGANIC AUDIO VISUALIZER
 * CORE: PROCEDURAL MESH GENERATION
 */

// --- CONFIGURATION ---
const CONFIG = {
  particles: 250,      // Starfield density
  baseSize: 60,        // Minimum core size
  maxGrowth: 180,      // Maximum expansion on bass hits
  noiseScale: 3.5,     // Higher = More spikes (Less spherical)
  speed: 0.005,        // Speed of the liquid ripple
  smoothness: 0.15     // Physics damping (0.1 = slow/heavy, 0.9 = twitchy)
};

// --- GLOBAL VARIABLES ---
let mic, fft;
let isStarted = false;
let bassEnergy = 0;
let smoothedBass = 0; // Physics variable for smooth motion
let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  
  // Initialize Starfield
  for (let i = 0; i < CONFIG.particles; i++) {
    particles.push(new Star());
  }
}

function initSystem() {
  if (!isStarted) {
    userStartAudio();
    mic = new p5.AudioIn();
    mic.start();
    fft = new p5.FFT(0.8, 64); // 64 Bins for performance
    fft.setInput(mic);
    isStarted = true;
    
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
  }
}

function draw() {
  background(0); // Void

  if (!isStarted) {
    // Idle Animation
    rotateY(frameCount * 0.5);
    stroke(180, 50, 100); noFill();
    sphere(80);
    return;
  }

  // --- 1. PHYSICS ENGINE ---
  let fps = Math.floor(frameRate());
  document.getElementById('fpsDisplay').innerText = "FPS: " + fps;

  fft.analyze();
  bassEnergy = fft.getEnergy("bass");
  
  // Linear Interpolation for "Heavy Fluid" feel
  smoothedBass = lerp(smoothedBass, bassEnergy, CONFIG.smoothness);

  // --- 2. CAMERA MOVEMENTS ---
  orbitControl(); // User can drag
  
  // Cinematic Drift (Always active)
  rotateY(frameCount * 0.1); 
  rotateX(frameCount * 0.05);

  // --- 3. LIGHTING (Crucial for 3D look) ---
  ambientLight(20);
  // Red Light from left, Blue from right -> Cyberpunk look
  pointLight(340, 100, 100, -500, 0, 200); 
  pointLight(200, 100, 100, 500, 0, 200); 
  specularMaterial(255);
  shininess(50); // High gloss

  // --- 4. DRAW THE ENTITY (Not a Sphere) ---
  drawProceduralShape();

  // --- 5. DRAW THE STARS ---
  for (let p of particles) {
    p.update(smoothedBass);
    p.show();
  }
}

function drawProceduralShape() {
  push();
  noStroke();
  
  // Color shifts from Deep Blue (Quiet) to Hot Pink/White (Loud)
  let hueVal = map(smoothedBass, 0, 255, 220, 340);
  fill(hueVal, 90, 100);

  // TRIANGLE STRIP MESH GENERATION
  // We loop through latitude and longitude to build a surface
  let detail = 6; // Step size (Lower = more detailed but slower)
  
  for (let lat = -90; lat < 90; lat += detail) {
    beginShape(TRIANGLE_STRIP);
    for (let lon = 0; lon <= 360; lon += detail) {
      
      // Calculate two rows of vertices to connect the strip
      let v1 = getDistortedVertex(lat, lon);
      let v2 = getDistortedVertex(lat + detail, lon);
      
      vertex(v1.x, v1.y, v1.z);
      vertex(v2.x, v2.y, v2.z);
    }
    endShape();
  }
  pop();
}

// --- COMPLEXITY MATH ---
// This function determines the shape. 
// It pushes points OUTWARD based on Perlin Noise.
function getDistortedVertex(lat, lon) {
  // Convert spherical angle to a 3D vector
  let x = cos(lat) * cos(lon);
  let y = cos(lat) * sin(lon);
  let z = sin(lat);
  
  // Time variable for "Flowing" animation
  // Moving faster when music is loud
  let time = frameCount * (CONFIG.speed + (smoothedBass * 0.0001));
  
  // NOISE CALCULATION
  // We sample 3D noise at this point's location
  let noiseVal = noise(
    x * CONFIG.noiseScale + time, 
    y * CONFIG.noiseScale + time, 
    z * CONFIG.noiseScale
  );
  
  // DEFORMATION LOGIC
  // 1. Base shape is existing radius
  // 2. We add volume-based expansion
  // 3. We multiply by noise to create spikes/valleys
  let expansion = map(smoothedBass, 0, 255, 0, CONFIG.maxGrowth);
  let r = CONFIG.baseSize + (expansion * noiseVal * 2);
  
  // Return the new position
  return createVector(x * r, y * r, z * r);
}

// --- PARTICLE SYSTEM ---
class Star {
  constructor() {
    this.pos = p5.Vector.random3D().mult(random(500, 1200));
    this.vel = p5.Vector.random3D().normalize();
    this.size = random(1, 4);
    this.color = random(200, 255);
  }

  update(energy) {
    // Stars move faster with bass (Warp Speed)
    let speed = map(energy, 0, 255, 0.2, 5);
    this.pos.add(this.vel.copy().mult(speed));
    
    // Reset if too far
    if (this.pos.mag() > 1500) {
      this.pos = p5.Vector.random3D().mult(random(400, 600));
    }
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    
    // Face the camera (Billboard effect)
    let n = this.pos.copy().normalize();
    
    fill(this.color, 80, 100);
    noStroke();
    
    // Draw simple box for performance
    box(this.size);
    pop();
  }
}

// --- UTILS ---
function windowResized() {
  resizeCanvas(windowWidth, windowHeight, WEBGL);
}

function triggerSave() {
  saveCanvas('Alien_Artifact_Data', 'jpg');
}
