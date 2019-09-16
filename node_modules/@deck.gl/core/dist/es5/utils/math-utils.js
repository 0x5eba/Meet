"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMat4 = createMat4;
exports.extractCameraVectors = extractCameraVectors;
exports.getFrustumPlanes = getFrustumPlanes;
exports.fp64LowPart = fp64LowPart;

var _math = require("math.gl");

function createMat4() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function extractCameraVectors(_ref) {
  var viewMatrix = _ref.viewMatrix,
      viewMatrixInverse = _ref.viewMatrixInverse;
  return {
    eye: [viewMatrixInverse[12], viewMatrixInverse[13], viewMatrixInverse[14]],
    direction: [-viewMatrix[2], -viewMatrix[6], -viewMatrix[10]],
    up: [viewMatrix[1], viewMatrix[5], viewMatrix[9]],
    right: [viewMatrix[0], viewMatrix[4], viewMatrix[8]]
  };
}

var cameraPosition = new _math.Vector3();
var cameraDirection = new _math.Vector3();
var cameraUp = new _math.Vector3();
var cameraRight = new _math.Vector3();
var nearCenter = new _math.Vector3();
var farCenter = new _math.Vector3();
var a = new _math.Vector3();

function getFrustumPlanes(_ref2) {
  var aspect = _ref2.aspect,
      near = _ref2.near,
      far = _ref2.far,
      fovyRadians = _ref2.fovyRadians,
      position = _ref2.position,
      direction = _ref2.direction,
      up = _ref2.up,
      right = _ref2.right;
  cameraDirection.copy(direction);
  var nearFarScale = 1 / cameraDirection.len();
  cameraDirection.normalize();
  cameraPosition.copy(position);
  cameraUp.copy(up).normalize();
  cameraRight.copy(right).normalize();
  var nearHeight = 2 * Math.tan(fovyRadians / 2) * near;
  var nearWidth = nearHeight * aspect;
  nearCenter.copy(cameraDirection).scale(near * nearFarScale).add(cameraPosition);
  farCenter.copy(cameraDirection).scale(far * nearFarScale).add(cameraPosition);
  var normal = cameraDirection.clone().negate();
  var distance = normal.dot(nearCenter);
  var planes = {
    near: {
      distance: distance,
      normal: normal
    },
    far: {
      distance: cameraDirection.dot(farCenter),
      normal: cameraDirection.clone()
    }
  };
  a.copy(cameraRight).scale(nearWidth * 0.5).add(nearCenter).subtract(cameraPosition).normalize();
  normal = new _math.Vector3(cameraUp).cross(a);
  distance = cameraPosition.dot(normal);
  planes.right = {
    normal: normal,
    distance: distance
  };
  a.copy(cameraRight).scale(-nearWidth * 0.5).add(nearCenter).subtract(cameraPosition).normalize();
  normal = new _math.Vector3(a).cross(cameraUp);
  distance = cameraPosition.dot(normal);
  planes.left = {
    normal: normal,
    distance: distance
  };
  a.copy(cameraUp).scale(nearHeight * 0.5).add(nearCenter).subtract(cameraPosition).normalize();
  normal = new _math.Vector3(a).cross(cameraRight);
  distance = cameraPosition.dot(normal);
  planes.top = {
    normal: normal,
    distance: distance
  };
  a.copy(cameraUp).scale(-nearHeight * 0.5).add(nearCenter).subtract(cameraPosition).normalize();
  normal = new _math.Vector3(cameraRight).cross(a);
  distance = cameraPosition.dot(normal);
  planes.bottom = {
    normal: normal,
    distance: distance
  };
  return planes;
}

function fp64LowPart(x) {
  return x - Math.fround(x);
}
//# sourceMappingURL=math-utils.js.map