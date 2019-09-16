import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
export function getBounds(points) {
  const x = points.map(p => p[0]);
  const y = points.map(p => p[1]);
  const xMin = Math.min.apply(null, x);
  const xMax = Math.max.apply(null, x);
  const yMin = Math.min.apply(null, y);
  const yMax = Math.max.apply(null, y);
  return [xMin, yMin, xMax, yMax];
}
export function boundsContain(currentBounds, targetBounds) {
  if (targetBounds[0] >= currentBounds[0] && targetBounds[2] <= currentBounds[2] && targetBounds[1] >= currentBounds[1] && targetBounds[3] <= currentBounds[3]) {
    return true;
  }

  return false;
}
const scratchArray = new Float32Array(12);
export function packVertices(points) {
  let dimensions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
  let index = 0;

  for (const point of points) {
    for (let i = 0; i < dimensions; i++) {
      scratchArray[index++] = point[i] || 0;
    }
  }

  return scratchArray;
}
export function scaleToAspectRatio(boundingBox, width, height) {
  const _boundingBox = _slicedToArray(boundingBox, 4),
        xMin = _boundingBox[0],
        yMin = _boundingBox[1],
        xMax = _boundingBox[2],
        yMax = _boundingBox[3];

  const currentWidth = xMax - xMin;
  const currentHeight = yMax - yMin;
  let newWidth = currentWidth;
  let newHeight = currentHeight;

  if (currentWidth / currentHeight < width / height) {
    newWidth = width / height * currentHeight;
  } else {
    newHeight = height / width * currentWidth;
  }

  if (newWidth < width) {
    newWidth = width;
    newHeight = height;
  }

  const xCenter = (xMax + xMin) / 2;
  const yCenter = (yMax + yMin) / 2;
  return [xCenter - newWidth / 2, yCenter - newHeight / 2, xCenter + newWidth / 2, yCenter + newHeight / 2];
}
export function getTextureCoordinates(point, bounds) {
  const _bounds = _slicedToArray(bounds, 4),
        xMin = _bounds[0],
        yMin = _bounds[1],
        xMax = _bounds[2],
        yMax = _bounds[3];

  return [(point[0] - xMin) / (xMax - xMin), (point[1] - yMin) / (yMax - yMin)];
}
//# sourceMappingURL=heatmap-layer-utils.js.map