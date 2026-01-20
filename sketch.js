let mic;
let fft;
let history = [];
const MAX_HISTORY = 120;

function setup() {
  let canvas = createCanvas(800, 800);
  canvas.parent(document.body);

  colorMode(HSB, 360, 100, 100, 100);
  angleMode(RADIANS);
  background(0);

  mic = new p5.AudioIn();
  mic.start();

  fft = new p5.FFT(0.8, 1024);

  document.getElementById("saveBtn").onclick = () => {
    saveCanvas("resonance_visual", "png");
  };
}

function draw() {
  background(0, 20);
  translate(width / 2, height / 2);

  let spectrum = fft.analyze();
  history.push(spectrum);

  if (history.length > MAX_HISTORY) {
    history.shift();
  }

  noFill();

  for (let t = 0; t < history.length; t++) {
    let layer = history[t];
    let alpha = map(t, 0, history.length, 10, 80);

    beginShape();
    for (let i = 0; i < layer.length; i++) {
      let amp = layer[i];
      let angle = map(i, 0, layer.length, 0, TWO_PI);
      let r = map(amp, 0, 255, 50, 350) + t * 1.5;
      let hue = map(i, 0, layer.length, 0, 360);

      stroke(hue, 80, 100, alpha);

      let x = r * cos(angle);
      let y = r * sin(angle);

      vertex(x, y);
    }
    endShape(CLOSE);
  }
}

