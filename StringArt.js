const ColorThief = require('color-thief');
const Handlebars = require('handlebars');
const getPixels = require('get-pixels');
const rgbHex = require('rgb-hex');
const triangulate = require('delaunay-triangulate');
const nanoid = require('nanoid');
const fs = require('fs');

const thief = new ColorThief();

class StringArt {
  constructor() {
  }

  static generateTriangulation(image, size) {
    const height = size.height;
    const width = size.width;

    getPixels(image, 'image/jpg', (err, pixels) => {
      if (err) {
        console.log(err);
        return;
      }

      const basePoints = [];

      const GRID_SIZE = 300;
      let GRID_STEP = 5;

      for (let x = 0; x <= GRID_SIZE; x += GRID_STEP) {
        for (let y = 0; y <= GRID_SIZE; y += GRID_STEP) {
          const point = [x, y];

          if ((x >= GRID_STEP) && (x <= GRID_SIZE - GRID_STEP)) {
            point[0] += Math.floor(2 * GRID_STEP * Math.random() - GRID_STEP);
          }

          if ((y >= GRID_STEP) && (y <= GRID_SIZE - GRID_STEP)) {
            point[1] += Math.floor(2 * GRID_STEP  * Math.random() - GRID_STEP);
          }
          // GRID_STEP = 10 * Math.random();

          basePoints.push(point);
        }
      }


      const triangles = triangulate(basePoints);

      const polygons = [];

      triangles.forEach((triangle) => {
        let x = Math.floor((basePoints[triangle[0]][0]
            + basePoints[triangle[1]][0]
            + basePoints[triangle[2]][0]) / 3);

        let y = Math.floor((basePoints[triangle[0]][1]
            + basePoints[triangle[1]][1]
            + basePoints[triangle[2]][1]) / 3);

        if (x === GRID_SIZE) {
          x = GRID_SIZE - 1;
        }

        if (y === GRID_SIZE) {
          y = GRID_SIZE - 1;
        }

        const realX = Math.floor(x * width / GRID_SIZE);
        const realY = Math.floor(y * height / GRID_SIZE);

        const pixelPosition = 4 * (realY * width + realX);

        const rgb = [
          pixels.data[pixelPosition],
          pixels.data[pixelPosition + 1],
          pixels.data[pixelPosition + 2]
        ];

        const color = '#' + rgbHex(...rgb);


        const points = ' '
            + basePoints[triangle[0]][0] + ','
            + basePoints[triangle[0]][1] + ' '
            + basePoints[triangle[1]][0] + ','
            + basePoints[triangle[1]][1] + ' '
            + basePoints[triangle[2]][0] + ','
            + basePoints[triangle[2]][1];

        polygons.push({
          points,
          color,
          strokeColor: '#000000',
        });
      });

      const template = Handlebars.compile(fs.readFileSync('./templates/template-triangulation.svg', 'utf-8'));
      const svg = template({
        height,
        width,
        polygons
      });

      console.log(svg);
      const tris = triangles.map(triangle => [
        basePoints[triangle[0]],
        basePoints[triangle[1]],
        basePoints[triangle[2]]
      ]);
      const name = nanoid(3);
      console.log('generate: ' + name);
      fs.writeFileSync('./out/' + name + '.json', JSON.stringify(tris), 'utf-8');
      fs.writeFileSync('./out/' + name + '-triangulation.svg', svg, 'utf-8');
    });
  }
}

module.exports = StringArt;
