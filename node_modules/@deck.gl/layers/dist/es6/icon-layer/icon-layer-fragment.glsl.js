export default `\
#define SHADER_NAME icon-layer-fragment-shader

precision highp float;

uniform float opacity;
uniform sampler2D iconsTexture;

varying float vColorMode;
varying vec4 vColor;
varying vec2 vTextureCoords;
varying vec2 uv;

const float MIN_ALPHA = 0.05;

void main(void) {
  geometry.uv = uv;

  vec4 texColor = texture2D(iconsTexture, vTextureCoords);

  // if colorMode == 0, use pixel color from the texture
  // if colorMode == 1 or rendering picking buffer, use texture as transparency mask
  vec3 color = mix(texColor.rgb, vColor.rgb, vColorMode);
  // Take the global opacity and the alpha from vColor into account for the alpha component
  float a = texColor.a * opacity * vColor.a;

  if (a < MIN_ALPHA) {
    discard;
  }

  gl_FragColor = vec4(color, a);
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;
//# sourceMappingURL=icon-layer-fragment.glsl.js.map