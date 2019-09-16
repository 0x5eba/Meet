export default `\
#define SHADER_NAME scatterplot-layer-fragment-shader

precision highp float;

uniform bool filled;

varying vec4 vFillColor;
varying vec4 vLineColor;
varying vec2 unitPosition;
varying float innerUnitRadius;

void main(void) {
  geometry.uv = unitPosition;

  float distToCenter = length(unitPosition);

  if (distToCenter > 1.0) {
    discard;
  } 
  if (distToCenter > innerUnitRadius) {
    gl_FragColor = vLineColor;
  } else if (filled) {
    gl_FragColor = vFillColor;
  } else {
    discard;
  }

  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;
//# sourceMappingURL=scatterplot-layer-fragment.glsl.js.map