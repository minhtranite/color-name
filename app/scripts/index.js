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

const sortColors = (colors) => {
  let black = chroma('#000000');
  colors.sort((colorA, colorB) => {
    let colorADistance = distance(chroma(colorA).lab(), black.lab());
    let colorBDistance = distance(chroma(colorB).lab(), black.lab());
    return colorADistance - colorBDistance;
  });
  return colors;
};

const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const sassEl = document.getElementById('sass');
const sortSubmitEl = document.getElementById('sort-submit');

const getValue = (el) => {
  let input = el.value.trim();
  let colors = input.split('\n');
  return colors.map(color => color.trim());
};

const setValue = (el, values) => {
  el.value = values.join('\n');
};

let timer;
const handleChange = () => {
  if (timer) {
    clearTimeout(timer);
  }
  setTimeout(() => {
    let colors = getValue(inputEl);
    let sass = sassEl.checked;
    let values = colors.map(color => {
      let info = colorInfo(color);
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
    setValue(outputEl, values);
  }, 200);
};

inputEl.addEventListener('keydown', () => {
  handleChange();
});

sassEl.addEventListener('change', () => {
  handleChange();
});

sortSubmitEl.addEventListener('click', () => {
  let colors = getValue(inputEl);
  colors = sortColors(colors);
  setValue(inputEl, colors);
  handleChange();
});
