export default `\
#define SHADER_NAME line-layer-fragment-shader

precision highp float;

varying vec4 vColor;
varying vec2 uv;

void main(void) {
  geometry.uv = uv;

  gl_FragColor = vColor;

  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;
//# sourceMappingURL=line-layer-fragment.glsl.js.map