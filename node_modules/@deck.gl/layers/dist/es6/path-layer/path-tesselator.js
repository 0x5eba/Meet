import { experimental, fp64LowPart } from '@deck.gl/core';
const Tesselator = experimental.Tesselator;
const START_CAP = 1;
const END_CAP = 2;
const INVALID = 4;
export default class PathTesselator extends Tesselator {
  constructor(_ref) {
    let data = _ref.data,
        getGeometry = _ref.getGeometry,
        positionFormat = _ref.positionFormat,
        fp64 = _ref.fp64;
    super({
      data,
      getGeometry,
      fp64,
      positionFormat,
      attributes: {
        startPositions: {
          size: 3,
          padding: 3
        },
        endPositions: {
          size: 3,
          padding: 3
        },
        segmentTypes: {
          size: 1,
          type: Uint8ClampedArray
        },
        startPositions64XyLow: {
          size: 2,
          padding: 2,
          fp64Only: true
        },
        endPositions64XyLow: {
          size: 2,
          padding: 2,
          fp64Only: true
        }
      }
    });
  }

  get(attributeName) {
    return this.attributes[attributeName];
  }

  getGeometrySize(path) {
    const numPoints = this.getPathLength(path);

    if (numPoints < 2) {
      return 0;
    }

    if (this.isClosed(path)) {
      return numPoints < 3 ? 0 : numPoints + 1;
    }

    return numPoints - 1;
  }

  updateGeometryAttributes(path, context) {
    const _this$attributes = this.attributes,
          startPositions = _this$attributes.startPositions,
          endPositions = _this$attributes.endPositions,
          startPositions64XyLow = _this$attributes.startPositions64XyLow,
          endPositions64XyLow = _this$attributes.endPositions64XyLow,
          segmentTypes = _this$attributes.segmentTypes,
          fp64 = this.fp64;
    const geometrySize = context.geometrySize;

    if (geometrySize === 0) {
      return;
    }

    const isPathClosed = this.isClosed(path);
    let startPoint;
    let endPoint;

    for (let i = context.vertexStart, ptIndex = 0; ptIndex < geometrySize; i++, ptIndex++) {
      startPoint = endPoint || this.getPointOnPath(path, 0);
      endPoint = this.getPointOnPath(path, ptIndex + 1);
      segmentTypes[i] = 0;

      if (ptIndex === 0) {
        if (isPathClosed) {
          segmentTypes[i] += INVALID;
        } else {
          segmentTypes[i] += START_CAP;
        }
      }

      if (ptIndex === geometrySize - 1) {
        if (isPathClosed) {
          segmentTypes[i] += INVALID;
        } else {
          segmentTypes[i] += END_CAP;
        }
      }

      startPositions[i * 3 + 3] = startPoint[0];
      startPositions[i * 3 + 4] = startPoint[1];
      startPositions[i * 3 + 5] = startPoint[2] || 0;
      endPositions[i * 3] = endPoint[0];
      endPositions[i * 3 + 1] = endPoint[1];
      endPositions[i * 3 + 2] = endPoint[2] || 0;

      if (fp64) {
        startPositions64XyLow[i * 2 + 2] = fp64LowPart(startPoint[0]);
        startPositions64XyLow[i * 2 + 3] = fp64LowPart(startPoint[1]);
        endPositions64XyLow[i * 2] = fp64LowPart(endPoint[0]);
        endPositions64XyLow[i * 2 + 1] = fp64LowPart(endPoint[1]);
      }
    }
  }

  getPathLength(path) {
    if (Number.isFinite(path[0])) {
      return path.length / this.positionSize;
    }

    return path.length;
  }

  getPointOnPath(path, index) {
    if (Number.isFinite(path[0])) {
      const positionSize = this.positionSize;

      if (index * positionSize >= path.length) {
        index += 1 - path.length / positionSize;
      }

      return [path[index * positionSize], path[index * positionSize + 1], positionSize === 3 ? path[index * positionSize + 2] : 0];
    }

    if (index >= path.length) {
      index += 1 - path.length;
    }

    return path[index];
  }

  isClosed(path) {
    const numPoints = this.getPathLength(path);
    const firstPoint = this.getPointOnPath(path, 0);
    const lastPoint = this.getPointOnPath(path, numPoints - 1);
    return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1] && firstPoint[2] === lastPoint[2];
  }

}
//# sourceMappingURL=path-tesselator.js.map