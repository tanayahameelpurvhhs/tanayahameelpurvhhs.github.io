// --- CONFIGURATION ---
let mic, fft;
let isStarted = false;
let autoCam = true; // Camera drifts automatically

// COMPLEXITY: Particle System
let particles = [];
const NUM_PARTICLES = 200; 

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  
  // Create the Starfield
  for(let i = 0; i < NUM_PARTICLES; i++) {
    particles.push(new Particle());
  }
}

// UI TRIGGER
function initSystem() {
  if (!isStarted) {
    userStartAudio();
    mic = new p5.AudioIn();
    mic.start();
    
    // 64 bins is the sweet spot for 3D smoothness
    fft = new p5.FFT(0.7, 64);
    fft.setInput(mic);
    
    isStarted = true;
    
    // UI Updates
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    
    // Ensure controls are visible (using flex to match CSS)
    let controls = document.getElementById('controls');
    controls.style.display = 'flex';
  }
}

function draw() {
  background(0); // Deep Space Black

  // IDLE MODE (Before Click)
  if (!isStarted) {
    rotateY(frameCount * 0.5);
    stroke(0, 255, 100); noFill();
    sphere(80);
    return;
  }

  // --- 1. SYSTEM LOGIC ---
  // Update FPS Counter
  if (frameCount % 30 === 0) {
    document.getElementById('fpsDisplay').innerText = "FPS: " + Math.floor(frameRate());
  }

  // --- 2. CAMERA CONTROL ---
  orbitControl(); // Allow Mouse Drag
  if (autoCam) {
    rotateY(frameCount * 0.1); // Slow drift
    rotateX(sin(frameCount * 0.05) * 5); // Subtle tilt
  }

  // --- 3. AUDIO ANALYSIS ---
  let spectrum = fft.analyze();
  let bass = fft.getEnergy("bass");
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");

  // --- 4. LIGHTING ---
  // A blue light from the left, a pink light from the right
  ambientLight(50);
  pointLight(200, 100, 100, -500, 0, 200); // Blueish
  pointLight(320, 100, 100, 500, 0, 200);  // Pinkish

  // --- 5. THE CORE (Living Sphere) ---
  push();
  noStroke();
  
  // The core throbs with the Bass
  let coreSize = map(bass, 0, 255, 40, 90);
  
  // Use emission to make it look like it's glowing internally
  emissiveMaterial(map(bass, 0, 255, 200, 280), 80, 100);
  fill(0, 0, 100); 
  
  // Draw the sphere
  // We use detail(24) to keep it looking smooth but performant
  sphere(coreSize, 24, 24);
  
  // Add a wireframe cage around the core for "Tech" look
  noFill();
  stroke(200, 50, 100, 50);
  strokeWeight(1);
  rotateY(frameCount);
  sphere(coreSize + 10, 8, 8);
  pop();

  // --- 6. THE DATA RING (Saturn Style) ---
  // Displays the raw FFT data as bars orbiting the center
  push();
  rotateZ(30); // Tilt the ring
  rotateY(frameCount * -0.5); // Spin the ring opposite to camera
  
  noFill();
  strokeWeight(2);
  
  for (let i = 0; i < spectrum.length; i++) {
    let amp = spectrum[i];
    let angle = map(i, 0, spectrum.length, 0, 360);
    let r = 150 + map(amp, 0, 255, 0, 100); // Radius varies by volume
    
    let x = r * cos(angle);
    let y = r * sin(angle);
    
    // Color gradient based on angle
    stroke(angle, 80, 100);
    
    // Draw a line from the "Orbit" pointing outwards
    line(150 * cos(angle), 150 * sin(angle), 0, x, y, 0);
  }
  pop();

  // --- 7. PARTICLE STARFIELD ---
  // Updates and draws every single particle
  for (let p of particles) {
    p.update(bass); // Bass makes them move faster
    p.show();
  }
}

// --- CLASS: PARTICLE ---
class Particle {
  constructor() {
    // Spawn in a random location in a cube
    this.pos = p5.Vector.random3D().mult(random(300, 800));
    this.vel = p5.Vector.random3D().normalize(); // Direction
    this.size = random(2, 6);
    this.color = random(180, 300); // Blue to Purple range
  }

  update(energy) {
    // Physics: Move position by velocity
    // "Warp Speed" effect when Bass hits
    let speed = map(energy, 0, 255, 0.5, 4);
    this.pos.add(this.vel.copy().mult(speed));
    
    // Boundary Check: If too far or too close, reset
    if (this.pos.mag() > 1000 || this.pos.mag() < 100) {
      this.pos = p5.Vector.random3D().mult(random(300, 800));
    }
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    
    // Billboard effect (points always face camera)
    // Using box(s) is faster than sphere(s) for 200 particles
    noStroke();
    fill(this.color, 80, 100);
    box(this.size);
    pop();
  }
}

// --- UTILITIES ---
function triggerSave() {
  saveCanvas('Hyper_Singularity', 'jpg');
}

function toggleAutoCam() {
  autoCam = !autoCam;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight, WEBGL);
}
