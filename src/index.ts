import * as SVG from 'svg.js';
import './style.css';

const width = 600, height = 600;

const draw = SVG('svg').size(width, height);

let pointer: SVG.Circle | null = null;

for (let x = 5; x < width; x += 20) {
  for (let y = 5; y < height; y += 20) {
    draw.circle(3).attr({cx: x, cy: y, fill: '#fff'});
  }
}


const svgElement = document.getElementById('svg');

let pointerX: number = 0, pointerY: number = 0, pointerRadius: number = 100;

function drawPointer() {
  if (pointer === null) {
    pointer = draw.circle().radius(pointerRadius).attr({cx: pointerX, cy: pointerY, fill: 'transparent', stroke: '#fff'});
  }
  else {
    pointer.attr({cx: pointerX, cy: pointerY}).radius(pointerRadius);
  }
}

document.addEventListener('mousemove', (e) => {
  pointerX = e.pageX - svgElement.offsetLeft;
  pointerY = e.pageY - svgElement.offsetTop;

  drawPointer();
});

document.addEventListener('wheel', (e) => {
  if (pointer !== null) {
    pointerRadius -= e.deltaY;
    pointerRadius = Math.min(200, Math.max(10, pointerRadius));

    drawPointer();
  }
});
