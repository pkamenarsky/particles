import './style.css';

const canvasElement: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;

const width = 600, height = 600, stepX = 10, stepY = 10, offsetX = 5, offsetY = 5;
// const countX = Math.floor((width - offsetX) / stepX), countY = ((height - offsetY) / stepY);
const draw = canvasElement.getContext('2d') as CanvasRenderingContext2D;

type Particle = {
  x: number,
  y: number
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

function initParticles(particles: Particle[], lines: Line[], image: ImageData | null) {
  for (let y = offsetX; y < width; y += stepX) {
    for (let x = offsetY, a = null, b = null; x < height; x += stepY) {
      if (image) {
        const ix = Math.round(image.width / width * x);
        const iy = Math.round(image.height / height * y);
        const i = (iy * image.width + ix) * 4;

        if (image.data[i] < 20) {
          b = {x, y};
          particles.push(b);
        }
        else {
          b = null;
        }
      }
      else {
        b = {x, y};
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
    draw.moveTo(line.a.x, line.a.y);
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

const modifiers: Modifier[] = [randomise, randomise2, implode, explode];

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
      scene.pointer.radius = Math.min(200, Math.max(10, scene.pointer.radius));

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

  const scene: Scene = { particles, lines, pointer };

  // for debugging
  (window as any).debugScene = scene;

  initParticles(particles, lines, image);
  addEventListeners(scene);
  drawScene(scene);
}

loadImage('http://localhost:8003/image.png', go);

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
    const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));

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
