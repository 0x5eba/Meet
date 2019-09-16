const vs = `
struct VertexGeometry {
  vec4 position;
  vec3 worldPosition;
  vec3 worldPositionAlt;
  vec3 normal;
  vec2 uv;
} geometry;
`;
const fs = `
struct FragmentGeometry {
  vec2 uv;
} geometry;
`;
export default {
  name: 'geometry',
  vs,
  fs
};
//# sourceMappingURL=geometry.js.map