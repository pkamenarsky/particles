import * as SVG from 'svg.js';
import './style.css';

const svgElement: HTMLElement = document.getElementById('svg') as HTMLElement;

const width = 600, height = 600, stepX = 10, stepY = 10, offsetX = 5, offsetY = 5;
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

function addEventListeners(pointer: Pointer, particles: Particle[]) {
  svgElement.addEventListener('mousemove', (e) => {
    pointer.x = e.pageX - svgElement.offsetLeft;
    pointer.y = e.pageY - svgElement.offsetTop;

    drawPointer(pointer);

    const inside: Particle[] = particlesInsidePointer(pointer, particles);

    explode(pointer, particles, inside);
    redrawParticles(particles);
  });

  svgElement.addEventListener('wheel', (e) => {
    if (pointer !== null) {
      pointer.radius -= e.deltaY;
      pointer.radius = Math.min(200, Math.max(10, pointer.radius));

      drawPointer(pointer);
    }
  });

  svgElement.addEventListener('click', (e) => {
    const inside: Particle[] = particlesInsidePointer(pointer, particles);

    explode(pointer, particles, inside);
    redrawParticles(particles);
  });
}

initParticles(particles);
addEventListeners(pointer, particles);

// -----------------------------------------------------------------------------

function randomise(_pointer: Pointer, _all: Particle[], inside: Particle[]): void {
  for (let particle of inside) {
    particle.x = Math.random() * 600;
    particle.y = Math.random() * 600;
  }
}

function explode(pointer: Pointer, all: Particle[], inside: Particle[]): void {
  for (let particle of all) {
    const dx = particle.x - pointer.x;
    const dy = particle.y - pointer.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    particle.x = particle.x + dx / ((d * d) / pointer.radius);
    particle.y = particle.y + dy / ((d * d) / pointer.radius);
  }
}
