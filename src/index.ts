import './style.css';

const canvasElement: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;

const width = 600, height = 600, stepX = 10, stepY = 10, offsetX = 5, offsetY = 5;
// const countX = Math.floor((width - offsetX) / stepX), countY = ((height - offsetY) / stepY);
const draw = canvasElement.getContext('2d') as CanvasRenderingContext2D;

type Particle = {
  x: number,
  y: number
};

const particles: Particle[] = [];

type Pointer = {
  x: number,
  y: number,
  radius: number
};

const pointer: Pointer = {
  x: 0,
  y: 0,
  radius: 100
};

type Modifier = (_pointer: Pointer, _all: Particle[], inside: Particle[]) => void;

function initParticles(particles: Particle[]) {
  for (let y = offsetX; y < width; y += stepX) {
    for (let x = offsetY; x < height; x += stepY) {
      particles.push({x, y});
    }
  }
}

function drawParticles(particles: Particle[]) {
  draw.fillStyle = '#fff';
  draw.lineWidth = 1;
  draw.strokeStyle = '#fff';

  for (let particle of particles) {
    draw.beginPath();
    // draw.moveTo(particle.x - 2, particle.y - 2);
    // draw.lineTo(particle.x + 2, particle.y + 2);
    // draw.moveTo(particle.x + 2, particle.y - 2);
    // draw.lineTo(particle.x - 2, particle.y + 2);
    draw.arc(particle.x, particle.y, 1, 0, 2 * Math.PI, false);
    draw.fill();
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

function drawScene(particles: Particle[], pointer: Pointer) {
  draw.fillStyle = '#333';
  draw.fillRect(0, 0, width, height);

  drawParticles(particles);
  drawPointer(pointer);
}

const modifiers: Modifier[] = [randomise, randomise2, implode, explode];

function addEventListeners(pointer: Pointer, particles: Particle[]) {
  let modifierIndex = 0;

  canvasElement.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    modifyParticles(pointer, particles, modifiers[modifierIndex]);
    drawScene(particles, pointer);

    const mouseMove = (e: MouseEvent) => {
      e.preventDefault();

      pointer.x = e.pageX - canvasElement.offsetLeft;
      pointer.y = e.pageY - canvasElement.offsetTop;

      pointer.x = Math.round(pointer.x / stepX) * stepX;
      pointer.y = Math.round(pointer.y / stepY) * stepY;

      modifyParticles(pointer, particles, modifiers[modifierIndex]);
      drawScene(particles, pointer);
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
    if (pointer !== null) {
      pointer.radius -= e.deltaY;
      pointer.radius = Math.min(200, Math.max(10, pointer.radius));

      drawScene(particles, pointer);
    }
  });

  canvasElement.addEventListener('mousemove', (e) => {
    pointer.x = e.pageX - canvasElement.offsetLeft;
    pointer.y = e.pageY - canvasElement.offsetTop;

    pointer.x = Math.round(pointer.x / stepX) * stepX;
    pointer.y = Math.round(pointer.y / stepY) * stepY;

    drawScene(particles, pointer);
  });

  document.addEventListener('keydown', (e) => {
    if (e.keyCode === 70) {
      modifierIndex = (modifierIndex + 1) % modifiers.length;
    }
  });
}

initParticles(particles);
addEventListeners(pointer, particles);
drawScene(particles, pointer);

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
  for (let particle of inside) {
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
