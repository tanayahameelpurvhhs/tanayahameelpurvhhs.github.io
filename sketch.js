let mic, fft;
let isStarted = false;
let history = []; 
const MAX_HISTORY = 50; 

function setup() {
  // Create canvas that fills the window
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  noFill();
}

// CALLED BY HTML WHEN YOU CLICK THE SCREEN
function startSystem() {
  if (!isStarted) {
    userStartAudio(); // Force browser audio permission
    
    mic = new p5.AudioIn();
    mic.start();
    
    fft = new p5.FFT(0.8, 128); // 128 Bins is faster/safer than 1024
    fft.setInput(mic);
    
    isStarted = true;
    
    // Hide overlay using standard JS
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('controls').classList.remove('hidden');
  }
}

function draw() {
  background(0); // Black background

  // 1. IF SYSTEM HASN'T STARTED: Show a pulsating "Standby" circle
  if (!isStarted) {
    stroke(255);
    strokeWeight(1);
    ellipse(width/2, height/2, 100 + sin(frameCount * 5) * 20);
    return;
  }

  // 2. CHECK IF MIC IS WORKING
  let vol = mic.getLevel(); 
  // If volume is essentially zero, draw a warning (helps debug)
  if (vol === 0) {
    fill(255);
    noStroke();
    textAlign(CENTER);
    text("MICROPHONE OFF OR MUTED", width/2, height/2);
    return;
  }

  // 3. GET DATA
  let spectrum = fft.analyze(); 
  history.push(spectrum);
  
  if (history.length > MAX_HISTORY) {
    history.shift();
  }

  translate(width / 2, height / 2);

  // 4. DRAW TUNNEL
  // Using standard loop + vertex (Robust Method)
  
  // Get Zoom Slider Value safely
  let zoom = 1.0;
  let slider = document.getElementById('sensSlider');
  if (slider) zoom = slider.value;

  for (let i = 0; i < history.length; i++) {
    let layer = history[i];
    let depth = map(i, 0, history.length, 0.1, 1.5); 
    let alpha = map(i, 0, history.length, 0, 100); 

    beginShape();
    // We step by 2 to reduce lag
    for (let j = 0; j < layer.length; j+=2) {
      let amp = layer[j];
      let angle = map(j, 0, layer.length, 0, 360);
      
      // The Math: Radius + Amplitude * Zoom
      let r = (50 + i * 5) + map(amp, 0, 255, 0, 150 * zoom);
      
      let hue = map(j, 0, layer.length, 200, 360) + (i * 2);
      
      stroke(hue % 360, 90, 100, alpha);
      strokeWeight(2);
      
      let x = r * cos(angle);
      let y = r * sin(angle);
      
      vertex(x, y);
    }
    endShape(CLOSE);
  }
}

// CALLED BY HTML BUTTON
function triggerSave() {
  saveCanvas('Resonance_Capture', 'jpg');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
