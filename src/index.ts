import * as SVG from 'svg.js';
import './style.css';

const svgElement: HTMLElement = document.getElementById('svg') as HTMLElement;

const width = 600, height = 600, stepX = 12, stepY = 12, offsetX = 5, offsetY = 5;
// const countX = Math.floor((width - offsetX) / stepX), countY = ((height - offsetY) / stepY);
const draw = SVG('svg').size(width, height);

type Particle = {
  x: number,
  y: number,
  element: SVG.Circle
};

const particles: Particle[] = [];

type Pointer = {
  x: number,
  y: number,
  radius: number,
  element: SVG.Circle | null
};

const pointer: Pointer = {
  x: 0,
  y: 0,
  radius: 100,
  element: null
};

type Modifier = (_pointer: Pointer, _all: Particle[], inside: Particle[]) => void;

function initParticles(particles: Particle[]) {
  for (let y = offsetX; y < width; y += stepX) {
    for (let x = offsetY; x < height; x += stepY) {
      particles.push({x, y, element: draw.circle(3).attr({cx: x, cy: y, fill: '#fff'})});
    }
  }
}

function redrawParticles(particles: Particle[]) {
  for (let particle of particles) {
    particle.element.attr({cx: particle.x, cy: particle. y});
  }
}

function modifyParticles(pointer: Pointer, particles: Particle[], modifier: Modifier) {
  const inside: Particle[] = particlesInsidePointer(pointer, particles);

  modifier(pointer, particles, inside);
  redrawParticles(particles);
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
  if (pointer.element === null) {
    pointer.element = draw.circle().radius(pointer.radius).attr({cx: pointer.x, cy: pointer.y, fill: 'transparent', stroke: '#fff'});
  }
  else {
    pointer.element.attr({cx: pointer.x, cy: pointer.y}).radius(pointer.radius);
  }
}

const modifiers: Modifier[] = [randomise, randomise2, implode, explode];

function addEventListeners(pointer: Pointer, particles: Particle[]) {
  let modifierIndex = 0;

  svgElement.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    drawPointer(pointer);
    modifyParticles(pointer, particles, modifiers[modifierIndex]);

    const mouseMove = (e: MouseEvent) => {
      e.preventDefault();

      pointer.x = e.pageX - svgElement.offsetLeft;
      pointer.y = e.pageY - svgElement.offsetTop;

      pointer.x = Math.round(pointer.x / stepX) * stepX;
      pointer.y = Math.round(pointer.y / stepY) * stepY;

      drawPointer(pointer);
      modifyParticles(pointer, particles, modifiers[modifierIndex]);
    };

    const mouseUp = (e: MouseEvent) => {
      e.preventDefault();
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', mouseUp);
    };

    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
  });

  svgElement.addEventListener('wheel', (e) => {
    if (pointer !== null) {
      pointer.radius -= e.deltaY;
      pointer.radius = Math.min(200, Math.max(10, pointer.radius));

      drawPointer(pointer);
    }
  });

  svgElement.addEventListener('mousemove', (e) => {
    pointer.x = e.pageX - svgElement.offsetLeft;
    pointer.y = e.pageY - svgElement.offsetTop;

    pointer.x = Math.round(pointer.x / stepX) * stepX;
    pointer.y = Math.round(pointer.y / stepY) * stepY;

    drawPointer(pointer);
  });

  document.addEventListener('keydown', (e) => {
    if (e.keyCode === 70) {
      modifierIndex = (modifierIndex + 1) % modifiers.length;
    }
  });
}

initParticles(particles);
addEventListeners(pointer, particles);

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
