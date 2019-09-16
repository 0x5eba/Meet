export default `\
#define SHADER_NAME arc-layer-fragment-shader

precision highp float;

varying vec4 vColor;
varying vec2 uv;

void main(void) {
  gl_FragColor = vColor;
  geometry.uv = uv;

  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;
//# sourceMappingURL=arc-layer-fragment.glsl.js.map