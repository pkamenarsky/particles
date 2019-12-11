import './style.css';

const canvasElement: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;

const width = 772, height = 600, stepX = 5, stepY = 10, offsetX = 10, offsetY = 5;
// const countX = Math.floor((width - offsetX) / stepX), countY = ((height - offsetY) / stepY);
const draw = canvasElement.getContext('2d') as CanvasRenderingContext2D;

type Particle = {
  x: number,
  y: number,
  color: rgb
};

type Line = {
  a: Particle,
  b: Particle
};

type Pointer = {
  x: number,
  y: number,
  radius: number
};

type Scene = {
  particles: Particle[],
  lines: Line[],
  pointer: Pointer
};

type Modifier = (_pointer: Pointer, _all: Particle[], inside: Particle[]) => void;

const white: rgb = {r: 1, g: 1, b: 1, a: 1};

function initParticles(particles: Particle[], lines: Line[], image: ImageData | null) {
  for (let y = offsetX; y < height; y += stepX) {
    for (let x = offsetY, a = null, b = null; x < width; x += stepY) {
      if (image) {
        const ix = Math.round(image.width / width * x);
        const iy = Math.round(image.height / height * y);
        const i = (iy * image.width + ix) * 4;

        if (image.data[i] < 20) {
          b = {x, y, color: white};
          particles.push(b);
        }
        else {
          b = null;
        }
      }
      else {
        b = {x, y, color: white};
        particles.push(b);
      }

      if (a && b) {
        lines.push({a, b});
      }

      a = b;
    }
  }
}

function drawParticles(particles: Particle[]) {
  draw.fillStyle = '#fff';
  draw.lineWidth = 1;
  draw.strokeStyle = '#fff';

  for (let particle of particles) {
    // draw.beginPath();
    // draw.moveTo(particle.x - 2, particle.y - 2);
    // draw.moveTo(particle.x + 2, particle.y + 2);
    // draw.moveTo(particle.x + 2, particle.y - 2);
    // draw.lineTo(particle.x - 2, particle.y + 2);

    // VARIATION: 3D-y pattern
    // draw.moveTo(particle.x - 2, particle.y - 2);
    // draw.moveTo(particle.x + 2, particle.y + 2);
    // draw.moveTo(particle.x - 2, particle.y - 2);
    // draw.lineTo(particle.x + 50, particle.y + 50);
    // draw.stroke();

    draw.beginPath();
    draw.fillStyle = rgb2css(particle.color);
    draw.arc(particle.x, particle.y, 1, 0, 2 * Math.PI, false);
    draw.fill();
  }
}

function drawLines(lines: Line[]) {
  draw.fillStyle = '#fff';
  draw.lineWidth = 1;
  draw.strokeStyle = '#fff';

  for (let line of lines) {
    draw.beginPath();
    draw.strokeStyle = rgb2css(line.a.color);
    draw.moveTo(line.a.x, line.a.y);
    draw.strokeStyle = rgb2css(line.b.color);
    draw.lineTo(line.b.x, line.b.y);
    draw.stroke();
  }
}

function modifyParticles(pointer: Pointer, particles: Particle[], modifier: Modifier) {
  const inside: Particle[] = particlesInsidePointer(pointer, particles);
  modifier(pointer, particles, inside);
}

function contains(x: number, y: number, r: number, particle: Particle): boolean {
  const dx = particle.x - x;
  const dy = particle.y - y;
  return Math.sqrt(dx * dx + dy * dy) < r;
}

function particlesInsidePointer(pointer: Pointer, particles: Particle[]): Particle[] {
  const inside: Particle[] = [];

  for (let particle of particles) {
    if (contains(pointer.x, pointer.y, pointer.radius, particle)) {
      inside.push(particle);
    }
  }

  return inside;
}

function drawPointer(pointer: Pointer) {
  draw.strokeStyle = rgb2css(white);

  draw.beginPath();
  draw.arc(pointer.x, pointer.y, pointer.radius, 0, 2 * Math.PI, false);
  draw.stroke();
}

function drawScene(scene: Scene) {
  draw.fillStyle = '#333';
  draw.fillRect(0, 0, width, height);

  drawParticles(scene.particles);
  drawLines(scene.lines);
  drawPointer(scene.pointer);
}

function drawSampled(particles: Particle[], lines: Line[]) {
  draw.fillStyle = '#333';
  draw.fillRect(0, 0, width, height);

  for (let particle of particles) {
    for(let i = 0; i < 30; i++) {
      const x = particle.x + (Math.random() * 20 - 10);
      const y = particle.y + (Math.random() * 20 - 10);
      const a = Math.random() * 0.005;

      draw.beginPath();
      draw.fillStyle = rgb2css({r: particle.color.r, g: particle.color.g, b: particle.color.b, a});
      draw.arc(x, y, 0.1, 0, 2 * Math.PI, false);
      draw.fill();
    }
  }

  drawLines(lines);
}

const modifiers: Modifier[] = [colorShift, randomise, randomise2, implode, explode];

function addEventListeners(scene: Scene) {
  let modifierIndex = 0;

  canvasElement.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    modifyParticles(scene.pointer, scene.particles, modifiers[modifierIndex]);
    drawScene(scene);

    const mouseMove = (e: MouseEvent) => {
      e.preventDefault();

      scene.pointer.x = e.pageX - canvasElement.offsetLeft;
      scene.pointer.y = e.pageY - canvasElement.offsetTop;

      scene.pointer.x = Math.round(scene.pointer.x / stepX) * stepX;
      scene.pointer.y = Math.round(scene.pointer.y / stepY) * stepY;

      modifyParticles(scene.pointer, scene.particles, modifiers[modifierIndex]);
      drawScene(scene);
    };

    const mouseUp = (e: MouseEvent) => {
      e.preventDefault();
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', mouseUp);
    };

    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
  });

  canvasElement.addEventListener('wheel', (e) => {
    if (scene.pointer !== null) {
      scene.pointer.radius -= e.deltaY;
      scene.pointer.radius = Math.min(500, Math.max(10, scene.pointer.radius));

      drawScene(scene);
    }
  });

  canvasElement.addEventListener('mousemove', (e) => {
    scene.pointer.x = e.pageX - canvasElement.offsetLeft;
    scene.pointer.y = e.pageY - canvasElement.offsetTop;

    scene.pointer.x = Math.round(scene.pointer.x / stepX) * stepX;
    scene.pointer.y = Math.round(scene.pointer.y / stepY) * stepY;

    drawScene(scene);
  });

  document.addEventListener('keydown', (e) => {
    if (e.keyCode === 70) {
      modifierIndex = (modifierIndex + 1) % modifiers.length;
    }
    else if (e.keyCode === 83) {
      drawSampled(scene.particles, scene.lines);
    }
  });
}

function loadImage(url: string, cb :(image: ImageData) => void) {
  const img = new Image();

  img.crossOrigin = "*";
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width
    canvas.height = img.height

    const context = canvas.getContext('2d');

    if (context) {
      context.drawImage(img, 0, 0);

      const pixels = context.getImageData(0, 0, img.width, img.height);
      cb(pixels);
    }
  }

  img.src = url;
}

function go(image: ImageData | null) {
  const particles: Particle[] = [];
  const lines: Line[] = [];
  const pointer: Pointer = {
    x: 0,
    y: 0,
    radius: 100
  };

  const scene: Scene = {particles, lines, pointer};

  // for debugging
  (window as any).debugScene = scene;

  initParticles(particles, lines, image);
  addEventListeners(scene);
  drawScene(scene);
}

// loadImage('http://localhost:8003/image2.png', go);
go(null);

// -----------------------------------------------------------------------------

function randomise(_pointer: Pointer, _all: Particle[], inside: Particle[]): void {
  for (let particle of inside) {
    // particle.x += Math.random() * 10;
    particle.y += Math.random() * 10;
  }
}

function randomise2(_pointer: Pointer, _all: Particle[], inside: Particle[]): void {
  for (let particle of inside) {
    particle.x += Math.random() * 10 - 5;
    particle.y -= Math.random() * 10 - 5;
  }
}

function implode(pointer: Pointer, all: Particle[], inside: Particle[]): void {
  for (let particle of all) {
    const dx = particle.x - pointer.x;
    const dy = particle.y - pointer.y;
    const d = Math.max(10, Math.sqrt(dx * dx + dy * dy));

    particle.x = particle.x - dx / ((d * d) / pointer.radius);
    particle.y = particle.y - dy / ((d * d) / pointer.radius);
  }
}

function explode(pointer: Pointer, all: Particle[], inside: Particle[]): void {
  for (let particle of inside) {
    const dx = particle.x - pointer.x;
    const dy = particle.y - pointer.y;
    const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));

    particle.x = particle.x + dx / ((d * d) / pointer.radius);
    particle.y = particle.y + dy / ((d * d) / pointer.radius);
  }
}

function colorShift(pointer: Pointer, all: Particle[], inside: Particle[]): void {
  for (let particle of inside) {
    const dx = particle.x - pointer.x;
    const dy = particle.y - pointer.y;
    const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));

    // const hue = 360.0 * ((d < pointer.radius / 2) ? 0.5 : 0.833);
    let h;
    if (d < (pointer.radius / 2 - 20)) {
      h = 0.5;
    }
    else if (d > (pointer.radius / 2 + 20)) {
      h = 0.833;
    }
    else {
      h = lerp(0.5, 0.833, (d - (pointer.radius / 2 - 20)) / 40.0);
    }

    const hue = 360.0 * lerp(0.5, 0.833, d / pointer.radius);
    const sat = d / (pointer.radius);

    particle.color = hsv2rgb({h: h * 360.0, s: sat, v: 1});
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rad2deg(r: number): number {
  return r * 180.0 / Math.PI;
}

type hsv = {
  h: number,
  s: number,
  v: number
};

type rgb = {
  r: number,
  g: number,
  b : number,
  a: number
};

function hsv2rgb(hsv: hsv): rgb {
  let hh, p, q, t, ff;
  let i;
  let out: rgb = {r: 0, g: 0, b: 0, a: 1};

  if(hsv.s <= 0.0) {       // < is bogus, just shuts up warnings
    out.r = hsv.v;
    out.g = hsv.v;
    out.b = hsv.v;
    return out;
  }
  hh = hsv.h;
  if(hh >= 360.0) hh = 0.0;
  hh /= 60.0;
  i = Math.floor(hh);
  ff = hh - i;
  p = hsv.v * (1.0 - hsv.s);
  q = hsv.v * (1.0 - (hsv.s * ff));
  t = hsv.v * (1.0 - (hsv.s * (1.0 - ff)));

  switch(i) {
    case 0:
      out.r = hsv.v;
      out.g = t;
      out.b = p;
      break;
    case 1:
      out.r = q;
      out.g = hsv.v;
      out.b = p;
      break;
    case 2:
      out.r = p;
      out.g = hsv.v;
      out.b = t;
      break;

    case 3:
      out.r = p;
      out.g = q;
      out.b = hsv.v;
      break;
    case 4:
      out.r = t;
      out.g = p;
      out.b = hsv.v;
      break;
    case 5:
    default:
      out.r = hsv.v;
      out.g = p;
      out.b = q;
      break;
  }

  return out;
}

function rgb2css(rgb: rgb): string {
  return 'rgba(' + (rgb.r * 255.0) + ', ' + (rgb.g * 255.0) + ', ' + (rgb.b * 255.0) + ', ' + (rgb.a * 255.0) + ')';
}
