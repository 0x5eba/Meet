import { Vector3 } from 'math.gl';
export function createMat4() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
export function extractCameraVectors(_ref) {
  let viewMatrix = _ref.viewMatrix,
      viewMatrixInverse = _ref.viewMatrixInverse;
  return {
    eye: [viewMatrixInverse[12], viewMatrixInverse[13], viewMatrixInverse[14]],
    direction: [-viewMatrix[2], -viewMatrix[6], -viewMatrix[10]],
    up: [viewMatrix[1], viewMatrix[5], viewMatrix[9]],
    right: [viewMatrix[0], viewMatrix[4], viewMatrix[8]]
  };
}
const cameraPosition = new Vector3();
const cameraDirection = new Vector3();
const cameraUp = new Vector3();
const cameraRight = new Vector3();
const nearCenter = new Vector3();
const farCenter = new Vector3();
const a = new Vector3();
export function getFrustumPlanes(_ref2) {
  let aspect = _ref2.aspect,
      near = _ref2.near,
      far = _ref2.far,
      fovyRadians = _ref2.fovyRadians,
      position = _ref2.position,
      direction = _ref2.direction,
      up = _ref2.up,
      right = _ref2.right;
  cameraDirection.copy(direction);
  const nearFarScale = 1 / cameraDirection.len();
  cameraDirection.normalize();
  cameraPosition.copy(position);
  cameraUp.copy(up).normalize();
  cameraRight.copy(right).normalize();
  const nearHeight = 2 * Math.tan(fovyRadians / 2) * near;
  const nearWidth = nearHeight * aspect;
  nearCenter.copy(cameraDirection).scale(near * nearFarScale).add(cameraPosition);
  farCenter.copy(cameraDirection).scale(far * nearFarScale).add(cameraPosition);
  let normal = cameraDirection.clone().negate();
  let distance = normal.dot(nearCenter);
  const planes = {
    near: {
      distance,
      normal
    },
    far: {
      distance: cameraDirection.dot(farCenter),
      normal: cameraDirection.clone()
    }
  };
  a.copy(cameraRight).scale(nearWidth * 0.5).add(nearCenter).subtract(cameraPosition).normalize();
  normal = new Vector3(cameraUp).cross(a);
  distance = cameraPosition.dot(normal);
  planes.right = {
    normal,
    distance
  };
  a.copy(cameraRight).scale(-nearWidth * 0.5).add(nearCenter).subtract(cameraPosition).normalize();
  normal = new Vector3(a).cross(cameraUp);
  distance = cameraPosition.dot(normal);
  planes.left = {
    normal,
    distance
  };
  a.copy(cameraUp).scale(nearHeight * 0.5).add(nearCenter).subtract(cameraPosition).normalize();
  normal = new Vector3(a).cross(cameraRight);
  distance = cameraPosition.dot(normal);
  planes.top = {
    normal,
    distance
  };
  a.copy(cameraUp).scale(-nearHeight * 0.5).add(nearCenter).subtract(cameraPosition).normalize();
  normal = new Vector3(cameraRight).cross(a);
  distance = cameraPosition.dot(normal);
  planes.bottom = {
    normal,
    distance
  };
  return planes;
}
export function fp64LowPart(x) {
  return x - Math.fround(x);
}
//# sourceMappingURL=math-utils.js.map