export default `\
#define SHADER_NAME heatp-map-layer-vertex-shader

uniform sampler2D maxTexture;
uniform float intensity;

attribute vec3 positions;
attribute vec2 texCoords;

varying vec2 vTexCoords;
varying float vIntensity;

void main(void) {
  gl_Position = project_position_to_clipspace(positions, vec2(0.0), vec3(0.0));
  vTexCoords = texCoords;
  float maxValue = texture2D(maxTexture, vec2(0.5)).r;
  vIntensity = intensity / maxValue;
}
`;
//# sourceMappingURL=triangle-layer-vertex.glsl.js.map