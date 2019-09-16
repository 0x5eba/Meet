export default `\
#define SHADER_NAME triangle-layer-fragment-shader

precision highp float;

uniform float opacity;
uniform sampler2D texture;
varying vec2 vTexCoords;
uniform sampler2D colorTexture;
uniform float threshold;

varying float vIntensity;

vec4 getLinearColor(float value) {
  float factor = clamp(value, 0., 1.);
  vec4 color = texture2D(colorTexture, vec2(factor, 0.5));
  color.a *= min(value / threshold, 1.0);
  return color;
}

void main(void) {
  float weight = texture2D(texture, vTexCoords).r;
  if (weight == 0.) {
     discard;
  }
  vec4 linearColor = getLinearColor(weight * vIntensity);
  linearColor.a *= opacity;
  gl_FragColor =linearColor;
}
`;
//# sourceMappingURL=triangle-layer-fragment.glsl.js.map