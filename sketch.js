// RESONANCE: FINAL 3D VERSION
let mic, fft;
let isStarted = false;

function setup() {
  // WEBGL mode is required for 3D shapes
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
}

function startSystem() {
  if (!isStarted) {
    userStartAudio();
    mic = new p5.AudioIn();
    mic.start();
    fft = new p5.FFT(0.8, 64);
    fft.setInput(mic);
    isStarted = true;
    
    // Hide the start screen
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('controls').classList.remove('hidden');
  }
}

function draw() {
  background(0); // Always black background

  // 1. STANDBY MODE (Rotating Sphere)
  if (!isStarted) {
    rotateX(frameCount * 0.5);
    rotateY(frameCount * 0.5);
    stroke(255);
    noFill(); // SAFETY: Ensures no white blob
    strokeWeight(1);
    sphere(100);
    return;
  }

  // 2. INTERACTIVE MODE
  orbitControl(); // Allows judge to drag the shape with mouse
  
  let spectrum = fft.analyze();
  
  // Slowly rotate the whole scene
  rotateY(frameCount * 0.2);
  rotateX(frameCount * 0.1);

  // Get zoom level from slider (default to 1.0 if missing)
  let zoom = 1.0;
  let slider = document.getElementById('sensSlider');
  if (slider) zoom = slider.value;

  noFill(); // SAFETY: Ensures we see through the shape
  strokeWeight(2);

  // 3. DRAW THE FREQUENCY SPHERE
  // We loop through the frequency data
  for (let i = 0; i < spectrum.length; i += 3) {
    let amp = spectrum[i];
    let r = map(amp, 0, 255, 50, 200 * zoom); // Bass = Big Radius
    let hue = map(i, 0, spectrum.length, 0, 340);
    
    stroke(hue, 80, 100);
    
    beginShape();
    // THE SLANT FIX: Loop exactly to 360 (<= instead of <)
    for (let angle = 0; angle <= 360; angle += 20) {
      
      let x = r * cos(angle);
      let y = r * sin(angle);
      
      // Spread the rings out along Z-axis to make a sphere
      let z = map(i, 0, spectrum.length, -200, 200);
      
      vertex(x, y, z);
    }
    endShape(CLOSE);
  }
}

function triggerSave() {
  saveCanvas('Resonance_3D', 'jpg');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight, WEBGL);
}
