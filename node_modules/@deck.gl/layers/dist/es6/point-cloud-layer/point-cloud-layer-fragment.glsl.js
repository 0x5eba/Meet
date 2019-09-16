export default `\
#define SHADER_NAME point-cloud-layer-fragment-shader

precision highp float;

varying vec4 vColor;
varying vec2 unitPosition;

void main(void) {
  geometry.uv = unitPosition;

  float distToCenter = length(unitPosition);

  if (distToCenter > 1.0) {
    discard;
  }

  gl_FragColor = vColor;
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;
//# sourceMappingURL=point-cloud-layer-fragment.glsl.js.map