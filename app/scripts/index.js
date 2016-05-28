import 'bootstrap/dist/css/bootstrap.css';
import 'styles/index.scss';

import colorMaps from './colors.json';
import distance from 'euclidean-distance';
import chroma from 'chroma-js';

const colorInfo = (color) => {
  try {
    color = chroma(color);
  } catch (e) {
    return false;
  }
  let sortedColors = colorMaps
    .map(colorMap => {
      return {
        name: colorMap.name,
        hex: color.hex(),
        distance: distance(color.lab(), chroma(colorMap.hex).lab())
      };
    })
    .sort((colorA, colorB) => {
      return colorA.distance - colorB.distance;
    });
  return sortedColors[0];
};

const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const sassEl = document.getElementById('sass');

let timer;
inputEl.addEventListener('keydown', (e) => {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    handleChange(e.target.value, sassEl.checked);
  }, 200);
});

sassEl.addEventListener('change', (e) => {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    handleChange(inputEl.value, e.target.checked);
  }, 200);
});

const handleChange = (input = '', sass = false) => {
  input = input.trim();
  let colors = input.split('\n');
  let names = colors.map(color => {
    color = color.trim();
    let info = colorInfo(color.trim());
    if (!info) {
      return 'invalid';
    }
    if (!sass) {
      return info.name;
    }
    let name = info.name
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/ /g, '-')
      .toLowerCase();
    return `$${name}: ${info.hex};`;
  });
  outputEl.value = names.join('\n');
};
