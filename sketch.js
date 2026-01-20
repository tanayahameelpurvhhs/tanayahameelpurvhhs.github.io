/**
 * RESONANCE: HYPER-SINGULARITY ENGINE
 * V 4.0 - FINAL COMPLEXITY BUILD
 * * FEATURES:
 * - 3D Perlin Noise Displacement (Vertex Shader Simulation)
 * - Fractal Brownian Motion (Octave Noise)
 * - Reactive Camera Trauma System
 * - Dynamic Palette Interpolation
 */

// --- CONFIGURATION MATRIX ---
const CONFIG = {
  // Visual Settings
  particles: 250,          // High particle count for "dusty" atmosphere
  blobDetail: 6,           // Lower = smoother, Higher = sharper spikes (4-8 recommended)
  baseRadius: 70,          // Size of the core when silent
  maxDeform: 140,          // How big it gets when loud
  
  // Physics
  smoothness: 0.2,         // 0.0 = instant reaction, 1.0 = no reaction
  rotSpeed: 0.1,           // Global rotation speed
  
  // Audio
  fftBins: 64,             // 64 is optimal for 3D geometry generation
  minBass: 180,            // Threshold to trigger "Shake"
};

// --- GLOBAL STATE ---
let mic, fft;
let isStarted = false;
let autoCam = true;

// Physics State
let bassEnergy = 0;
let smoothedBass = 0;
let midEnergy = 0;
let camShake = 0;

// Entities
let particleSystem = [];
let ringGeometry = [];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  
  // Initialize Particle System
  for (let i = 0; i < CONFIG.particles; i++) {
    particleSystem.push(new SpaceDust());
  }
}

// --- SYSTEM INITIALIZATION ---
function initSystem() {
  if (!isStarted) {
    userStartAudio();
    mic = new p5.AudioIn();
    mic.start();
    
    fft = new p5.FFT(0.8, CONFIG.fftBins); // High smoothing for FFT
    fft.setInput(mic);
    
    isStarted = true;
    
    // UI Hiding logic
    const overlay = document.getElementById('overlay');
    const hud = document.getElementById('hud');
    const controls = document.getElementById('controls');
    
    if(overlay) overlay.style.display = 'none';
    if(hud) hud.style.display = 'block';
    if(controls) controls.style.display = 'flex';
  }
}

function draw() {
  background(0); // Void color

  // IDLE STATE
  if (!isStarted) {
    drawIdleGraphic();
    return;
  }

  // 1. COMPUTE PHYSICS & AUDIO
  updateAudioPhysics();
  
  // 2. UPDATE CAMERA & LIGHTING
  updateCamera();
  setLighting();

  // 3. RENDER SCENE
  drawNebulaCore();  // The main blob
  drawDataRing();    // The Saturn ring
  drawParticles();   // The stars
  
  // 4. UPDATE HUD
  updateHUD();
}

// --- CORE RENDER FUNCTIONS ---

function drawNebulaCore() {
  push();
  noStroke();
  
  // MATERIAL PROPERTIES
  // Specular material interacts with light to look shiny/wet
  specularMaterial(255); 
  shininess(30);         
  
  // DYNAMIC COLOR
  // Interpolate hue based on loudness
  let hueBase = map(smoothedBass, 0, 255, 200, 360); 
  fill(hueBase, 80, 100);
  
  // GEOMETRY GENERATION (TRIANGLE STRIPS)
  // This creates a sphere where every point is pushed out by noise
  let resolution = 8; // Step size for loops
  
  for (let lat = -90; lat < 90; lat += resolution) {
    beginShape(TRIANGLE_STRIP);
    for (let lon = 0; lon <= 360; lon += resolution) {
      
      // Vertex 1 (Current Latitude)
      let v1 = getProceduralVertex(lat, lon);
      vertex(v1.x, v1.y, v1.z);
      
      // Vertex 2 (Next Latitude)
      let v2 = getProceduralVertex(lat + resolution, lon);
      vertex(v2.x, v2.y, v2.z);
    }
    endShape();
  }
  pop();
}

/**
 * THE COMPLEXITY ENGINE
 * Calculates 3D coordinates using Trigonometry + Perlin Noise
 */
function getProceduralVertex(lat, lon) {
  // Convert spherical (lat, lon) to Cartesian (x, y, z) unit vector
  let x = cos(lat) * cos(lon);
  let y = cos(lat) * sin(lon);
  let z = sin(lat);
  
  // FRACTAL NOISE (Complexity Booster)
  // We layer noise to get "rough" details on top of "smooth" waves
  let time = frameCount * 0.01;
  let noiseInput = 2.5; // Scale of the texture
  
  // Layer 1: General Shape (Big blobs)
  let n1 = noise(x * noiseInput + time, y * noiseInput + time, z * noiseInput);
  
  // Layer 2: Surface Detail (Roughness)
  let n2 = noise(x * 5 + time * 2, y * 5, z * 5);
  
  // Combine layers
  let combinedNoise = n1 + (n2 * 0.2); 
  
  // Apply Audio Reactivity
  // The louder the bass, the more the noise pushes the vertex out
  let extrusion = map(smoothedBass, 0, 255, 0, CONFIG.maxDeform);
  
  // Final Radius calculation
  let r = CONFIG.baseRadius + (combinedNoise * extrusion);
  
  // Return the final 3D point
  return createVector(x * r, y * r, z * r);
}

function drawDataRing() {
  push();
  // Rotate the ring to look cool
  rotateZ(25);
  rotateX(frameCount * 0.2);
  
  let spectrum = fft.analyze();
  noFill();
  strokeWeight(2);
  
  for (let i = 0; i < spectrum.length; i++) {
    let amp = spectrum[i];
    let angle = map(i, 0, spectrum.length, 0, 360);
    
    // Dynamic Radius to clear the blob
    let r = 250 + map(amp, 0, 255, 0, 50);
    
    let x = r * cos(angle);
    let y = r * sin(angle);
    
    // Color gradient
    stroke(i * 4, 80, 100);
    
    // Draw "scanner lines"
    line(200 * cos(angle), 200 * sin(angle), 0, x, y, 0);
    
    // Draw "data points" at the tips
    push();
    translate(x, y, 0);
    strokeWeight(4);
    point(0,0,0);
    pop();
  }
  pop();
}

function drawParticles() {
  for (let p of particleSystem) {
    p.update(smoothedBass);
    p.show();
  }
}

// --- PHYSICS & MATH HELPERS ---

function updateAudioPhysics() {
  let spectrum = fft.analyze();
  bassEnergy = fft.getEnergy("bass");
  midEnergy = fft.getEnergy("mid");
  
  // SMOOTHING ALGORITHM (Linear Interpolation)
  // This makes the shape look liquid instead of glitchy
  smoothedBass = lerp(smoothedBass, bassEnergy, CONFIG.smoothness);
  
  // CAMERA TRAUMA CALCULATION
  // If bass hits hard, add trauma
  if (bassEnergy > CONFIG.minBass) {
    camShake += 2;
  }
  // Decay trauma
  camShake *= 0.9;
}

function updateCamera() {
  orbitControl(); // Mouse interaction
  
  if (autoCam) {
    // Gentle Drift
    rotateY(frameCount * CONFIG.rotSpeed);
    
    // Apply Trauma Shake (Random jitter)
    let shakeX = random(-camShake, camShake);
    let shakeY = random(-camShake, camShake);
    translate(shakeX, shakeY, 0);
  }
}

function setLighting() {
  ambientLight(40);
  // 3-Point Lighting Setup for cinematic look
  pointLight(255, 0, 0, -500, -200, 200);   // Red Rim Light
  pointLight(0, 200, 255, 500, 200, 200);   // Blue Fill Light
  directionalLight(255, 255, 255, 0, 0, -1); // White Key Light
}

function drawIdleGraphic() {
  rotateY(frameCount * 0.5);
  rotateX(frameCount * 0.2);
  stroke(0, 255, 255, 50);
  noFill();
  sphere(100);
}

function updateHUD() {
  if (frameCount % 10 === 0) {
    let fpsEl = document.getElementById('fpsDisplay');
    if(fpsEl) fpsEl.innerText = "FPS: " + Math.floor(frameRate());
  }
}

// --- CLASS DEFINITIONS ---

class SpaceDust {
  constructor() {
    // Spawn in random spherical volume
    this.pos = p5.Vector.random3D().mult(random(400, 1200));
    this.vel = p5.Vector.random3D().normalize();
    this.baseSize = random(1, 4);
    this.color = random(200, 300); // Blue-Purple range
  }
  
  update(energy) {
    // Warp speed effect on high energy
    let speed = map(energy, 0, 255, 0.5, 8);
    this.pos.add(this.vel.copy().mult(speed));
    
    // Respawn logic (Infinite loop)
    if (this.pos.mag() > 1500) {
      this.pos = p5.Vector.random3D().mult(random(300, 400));
    }
  }
  
  show() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    
    // Distance fading
    let alpha = map(this.pos.mag(), 0, 1500, 100, 0);
    
    fill(this.color, 60, 100, alpha);
    noStroke();
    
    // Use box for performance, but small enough to look like stars
    box(this.baseSize);
    pop();
  }
}

// --- UTILITY ---
function windowResized() {
  resizeCanvas(windowWidth, windowHeight, WEBGL);
}

function toggleAutoCam() {
  autoCam = !autoCam;
}

function triggerSave() {
  saveCanvas('HyperSingularity_Capture', 'jpg');
}
