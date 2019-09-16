export default `\
#define SHADER_NAME solid-polygon-layer-fragment-shader

precision highp float;

varying vec4 vColor;
varying float isValid;

void main(void) {
  if (isValid < 0.5) {
    discard;
  }

  gl_FragColor = vColor;

  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;
//# sourceMappingURL=solid-polygon-layer-fragment.glsl.js.map