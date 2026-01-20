/**
 * PROJECT: ALIEN ARTIFACT (FINAL STABLE BUILD)
 * FEATURES: WIREFRAME OUTLINE, SMOOTH PHYSICS, NO RINGS
 */

// --- CONFIGURATION ---
const CONFIG = {
  particles: 200,      // Number of background stars
  baseSize: 70,        // Starting size of the core
  maxGrowth: 90,       // How much it grows when loud (Reduced to prevent explosion)
  noiseScale: 3.0,     // Texture detail (Higher = spikier)
  
  // PHYSICS TUNING (The fix for shaking)
  // 0.05 = Very slow/smooth. 0.9 = Fast/Twitchy.
  smoothness: 0.08,    
  rippleSpeed: 0.003,  // Constant speed of liquid flow
};

// --- GLOBAL VARIABLES ---
let mic, fft;
let isStarted = false;
let smoothedBass = 0; 
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
    
    // SMOOTHING: 0.9 means we average 90% of previous frame
    // This helps remove "jitter" from the raw audio
    fft = new p5.FFT(0.9, 64); 
    fft.setInput(mic);
    
    isStarted = true;
    
    // UI Updates
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
  }
}

function draw() {
  background(0); // Deep Space Black

  if (!isStarted) {
    // Idle Animation: A simple breathing wireframe sphere
    rotateY(frameCount * 0.5);
    stroke(180, 50, 100); 
    strokeWeight(1);
    noFill();
    sphere(70);
    return;
  }

  // --- 1. PHYSICS ENGINE ---
  let fps = Math.floor(frameRate());
  document.getElementById('fpsDisplay').innerText = "FPS: " + fps;

  fft.analyze();
  let bassEnergy = fft.getEnergy("bass");
  
  // PHYSICS FIX: Deadzone
  // If the audio is very quiet (< 30), force it to 0 to stop "idle vibrating"
  if (bassEnergy < 30) bassEnergy = 0;
  
  // Lerp: Linearly Interpolate towards the target energy
  // This makes the movement look heavy and fluid, not twitchy
  smoothedBass = lerp(smoothedBass, bassEnergy, CONFIG.smoothness);

  // --- 2. CAMERA ---
  orbitControl(); // Mouse interaction enabled
  rotateY(frameCount * 0.05); // Slow cinematic drift

  // --- 3. LIGHTING ---
  ambientLight(40);
  // Red/Blue side lights for contrast
  pointLight(200, 100, 100, 500, -500, 200); 
  pointLight(0, 0, 100, 0, 0, 300); // White front light

  // --- 4. DRAW THE ENTITY ---
  drawProceduralShape();

  // --- 5. DRAW STARS ---
  for (let p of particles) {
    p.update(smoothedBass);
    p.show();
  }
}

function drawProceduralShape() {
  push();
  
  // THE OUTLINE (Wireframe)
  // This creates the "Clear Outline" visual
  strokeWeight(1.5); 
  stroke(180, 80, 100); // Bright Cyan
  
  // THE FILL
  // Dark semi-transparent fill to make the object feel solid but glassy
  fill(0, 0, 10, 95); 

  // TRIANGLE STRIP LOOP (The Math)
  let detail = 8; // Step size in degrees
  
  for (let lat = -90; lat < 90; lat += detail) {
    beginShape(TRIANGLE_STRIP);
    for (let lon = 0; lon <= 360; lon += detail) {
      
      let v1 = getDistortedVertex(lat, lon);
      let v2 = getDistortedVertex(lat + detail, lon);
      
      vertex(v1.x, v1.y, v1.z);
      vertex(v2.x, v2.y, v2.z);
    }
    endShape();
  }
  pop();
}

function getDistortedVertex(lat, lon) {
  // Convert spherical coordinates to Cartesian
  let x = cos(lat) * cos(lon);
  let y = cos(lat) * sin(lon);
  let z = sin(lat);
  
  // TIME: Constant ripple speed
  // We do NOT multiply this by bass, to prevent shaking
  let time = frameCount * CONFIG.rippleSpeed;
  
  // NOISE GENERATION (The "Blob" Shape)
  let noiseVal = noise(
    x * CONFIG.noiseScale + time, 
    y * CONFIG.noiseScale + time, 
    z * CONFIG.noiseScale
  );
  
  // DEFORMATION
  // The SIZE grows with volume, but the TEXTURE flows smoothly
  let expansion = map(smoothedBass, 0, 255, 0, CONFIG.maxGrowth);
  let r = CONFIG.baseSize + (expansion * noiseVal);
  
  return createVector(x * r, y * r, z * r);
}

// --- STARFIELD CLASS ---
class Star {
  constructor() {
    this.pos = p5.Vector.random3D().mult(random(400, 1000));
    this.vel = p5.Vector.random3D().normalize();
    this.size = random(1, 3);
  }

  update(energy) {
    // Warp speed effect
    let speed = map(energy, 0, 255, 0.1, 2);
    this.pos.add(this.vel.copy().mult(speed));
    
    // Respawn logic
    if (this.pos.mag() > 1200) {
      this.pos = p5.Vector.random3D().mult(random(400, 600));
    }
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    stroke(255); strokeWeight(this.size); point(0,0,0);
    pop();
  }
}

// --- UTILS ---
function windowResized() {
  resizeCanvas(windowWidth, windowHeight, WEBGL);
}

function triggerSave() {
  saveCanvas('Alien_Artifact_Capture', 'jpg');
}
