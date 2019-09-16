export default `\
#define SHADER_NAME column-layer-fragment-shader

precision highp float;

varying vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;
//# sourceMappingURL=column-layer-fragment.glsl.js.map