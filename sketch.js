/**
 * RESONANCE: The Geometry of Sound
 * --------------------------------
 * A STEAM Showcase Project visualizing audio frequencies using
 * Fast Fourier Transform (FFT) and Polar Coordinate Geometry.
 * * CORE CONCEPTS (For Judges):
 * 1. FFT (Fast Fourier Transform): Deconstructs sound into frequencies.
 * 2. Logarithmic Averaging: Groups frequencies like the human ear hears them (Octaves).
 * 3. Linear Interpolation: Smooths data to remove "jitter."
 */

// --- GLOBAL VARIABLES ---
let mic, fft;
let audioContextStarted = false;

// DATA HISTORY (For the "Tunnel" effect)
let history = []; 
const MAX_HISTORY = 60; // How deep the tunnel goes

// CONFIGURATION (Constants)
const FFT_SMOOTHING = 0.8; 
const FFT_BINS = 1024; 

// UI VARIABLES
let sensitivitySlider, speedSlider, saveButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  
  // Link JS variables to HTML UI elements
  sensitivitySlider = select('#sensSlider');
  speedSlider = select('#speedSlider');
  saveButton = select('#saveBtn');
  
  // Setup Save Functionality
  saveButton.mousePressed(exportArt);

  // Initialize specific visual settings
  noFill();
  strokeWeight(2);
}

// Browser Requirement: User must interact to start AudioContext
function touchStarted() {
  if (!audioContextStarted) {
    userStartAudio(); // p5.sound helper
    
    // Initialize Audio Input
    mic = new p5.AudioIn();
    mic.start();
    
    // Initialize FFT Analysis
    fft = new p5.FFT(FFT_SMOOTHING, FFT_BINS);
    fft.setInput(mic);
    
    audioContextStarted = true;
    
    // Toggle UI: Hide Overlay, Show Controls
    select('#overlay').addClass('hidden');
    select('#controls').removeClass('hidden');
  }
}

function draw() {
  background(0); // Clear frame (Black)

  // 1. IDLE ANIMATION (If waiting for start)
  if (!audioContextStarted) {
    drawIdleAnimation();
    return;
  }

  // 2. ANALYZE AUDIO
  
  // getOctaveBands splits the spectrum into logarithmic groups (Bass, Low-Mid, Mid, High-Mid, Treble)
  // split: 3 means "3 bands per octave" (Standard for equalizers)
  let spectrum = fft.analyze(); 
  let octaves = fft.getOctaveBands(3, 15, 250); 
  let averages = fft.getLogAverages(octaves);

  // 3. STORE HISTORY
  // Only push new data based on "Speed" slider to optimize performance
  // If speed is 0, tunnel stops.
  let speed = speedSlider.value();
  if (frameCount % (6 - speed) === 0 && speed > 0) {
    history.push(averages);
  }
  
  if (history.length > MAX_HISTORY) {
    history.shift(); // Remove oldest frame
  }

  // 4. DRAW THE TUNNEL
  // We iterate backwards so the "oldest" rings are drawn first (in the back)
  translate(width / 2, height / 2); // Center 0,0
  
  let sensitivity = sensitivitySlider.value();

  for (let i = 0; i < history.length; i++) {
    let dataLayer = history[i];
    
    // Depth Calculation: Older frames are smaller
    // map(value, minIn, maxIn, minOut, maxOut)
    let depthScale = map(i, 0, history.length, 0.1, 1.5); 
    let alpha = map(i, 0, history.length, 0, 100); // Fade in from back
    
    beginShape();
    // Loop through the frequency bands (Bass -> Treble)
    for (let j = 0; j < dataLayer.length; j++) {
      
      let amp = dataLayer[j]; // Volume of this frequency band
      let angle = map(j, 0, dataLayer.length, 0, 360); // Spread around circle
      
      // MATH: Radius = Base Size + (Amplitude * Sensitivity)
      let r = (100 * depthScale) + map(amp, 0, 255, 0, 200 * sensitivity) * depthScale;
      
      // COLOR MATH: 
      // Hue is based on Frequency (j). Bass = Red/Orange, Treble = Blue/Purple.
      // We add 'i' (history index) to make colors spiral slightly over time.
      let hue = map(j, 0, dataLayer.length, 0, 300) + (i * 2); 
      stroke(hue % 360, 80, 100, alpha);
      
      // POLAR TO CARTESIAN CONVERSION
      let x = r * cos(angle);
      let y = r * sin(angle);
      
      // CurveVertex makes the lines round instead of jagged
      curveVertex(x, y);
    }
    
    // Close the loop cleanly
    endShape(CLOSE);
  }
}

// A gentle breathing circle for before the user clicks start
function drawIdleAnimation() {
  translate(width/2, height/2);
  let pulse = sin(frameCount * 2) * 50;
  stroke(180, 50, 100);
  noFill();
  ellipse(0, 0, 200 + pulse, 200 + pulse);
}

function exportArt() {
  saveCanvas('Resonance_Capture', 'jpg');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
