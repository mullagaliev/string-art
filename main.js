const StringArt  = require('./StringArt');
const sizeOf = require('image-size');
const fs = require('fs');


const inpSrc = './inp/2.jpg';
const image = fs.readFileSync(inpSrc);
const size = sizeOf(inpSrc);


StringArt.generateTriangulation(image, size);