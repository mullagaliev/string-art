const ColorThief = require('color-thief');
const Handlebars = require('handlebars');
const getPixels = require('get-pixels');
const rgbHex = require('rgb-hex');
const triangulate = require('delaunay-triangulate');
const nanoid = require('nanoid');
const fs = require('fs');

const thief = new ColorThief();

function clamp(value, min, max) {
  return min < max
      ? (value < min ? min : value > max ? max : value)
      : (value < max ? max : value > min ? min : value)
}

function getPosition(x, y, width, height, GRID_SIZE) {
  const realX = Math.floor(x * width / GRID_SIZE);
  const realY = Math.floor(y * height / GRID_SIZE);

  const pixelPosition = 4 * (realY * width + realX);
  return pixelPosition;
}

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

      for(let x = 0; x < GRID_SIZE; x+= GRID_STEP) {
        for(let y = 0; y < GRID_SIZE; y+= GRID_STEP ) {
          // if(x === 0 || y === 0) {
          //   basePoints.push([x, y]);
          // }
          let avg = 0;
          let count = 0;
          for(let sx = 0; sx < GRID_STEP; sx+=1) {
            for(let sy = 0; sy < GRID_STEP; sy+=1) {
              const pixelPosition = getPosition(x, y, width, height, GRID_SIZE);
              const R = pixels.data[pixelPosition];
              const G = pixels.data[pixelPosition + 1];
              const B = pixels.data[pixelPosition + 2];

              const grey = (0.3 * R) + (0.59 * G) + (0.11 * B);
              if(grey) {
                avg += grey;
                count += 1;
              }
            }
          }
          avg = avg / count;
          let randomCount = 1;
          console.log('avg', avg);
          if(avg < 210) {
            randomCount = 1;
          }
          if(avg < 180) {
            randomCount = 3;
          }
          if(avg < 160) {
            randomCount = 5;
          }
          if(avg < 140) {
            randomCount = 10;
          }
          if(avg < 100) {
            randomCount = 15;
          }
          if(avg < 50) {
            randomCount = 25;
          }
          for(let i = 0; i < randomCount; i+=1 ){
            const point = [x, y];
            point[0] += Math.floor(GRID_STEP * Math.random());
            point[1] += Math.floor(GRID_STEP  * Math.random());
            basePoints.push(point);
            console.log('point', point);
          }
        }
      }
      console.log('basePoints count:', basePoints.length);
      // for (let x = 0; x <= GRID_SIZE; x += GRID_STEP) {
      //   for (let y = 0; y <= GRID_SIZE; y += GRID_STEP) {
      //     const point = [x, y];
      //
      //     if ((x >= GRID_STEP) && (x <= GRID_SIZE - GRID_STEP)) {
      //       point[0] += Math.floor(2 * GRID_STEP * Math.random() - GRID_STEP);
      //     }
      //
      //     if ((y >= GRID_STEP) && (y <= GRID_SIZE - GRID_STEP)) {
      //       point[1] += Math.floor(2 * GRID_STEP  * Math.random() - GRID_STEP);
      //     }
      //     // GRID_STEP = 10 * Math.random();
      //
      //     basePoints.push(point);
      //   }
      // }


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

        const pixelPosition = getPosition(x, y, width, height, GRID_SIZE);

        const rgb = [
          pixels.data[pixelPosition],
          pixels.data[pixelPosition + 1],
          pixels.data[pixelPosition + 2]
        ];

        const color = '#' + rgbHex(...rgb);

        const p1 = basePoints[triangle[0]];
        const p2 = basePoints[triangle[1]];
        const p3 = basePoints[triangle[2]];
        const t1x = p1[0];
        const t1y = p1[1];
        const t2x = p2[0];
        const t2y = p2[1];
        const t3x = p3[0];
        const t3y = p3[1];
        const S = 1/2 * Math.abs((t1x - t3x) * (t2y - t3y) - (t2x - t3x) * (t1y - t3y));
        console.log('S:', S,  1 - S / 30);
        const points = ' '
            + t1x + ','
            + t1y + ' '
            + t2x + ','
            + t2y + ' '
            + t3x + ','
            + t3y;

        polygons.push({
          points,
          color: 'transparent',
          // color,
          // strokeColor: '#000000',
          strokeColor: color,
          // strokeWidth: 1 - clamp(S / 30, 0.1, 1),
          strokeWidth: 0.3,
        });
      });

      const template = Handlebars.compile(fs.readFileSync('./templates/template-triangulation.svg', 'utf-8'));
      const svg = template({
        height,
        width,
        polygons
      });

      // console.log(svg);
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
