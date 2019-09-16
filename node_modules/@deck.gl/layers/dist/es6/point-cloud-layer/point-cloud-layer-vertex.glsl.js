export default `\
#define SHADER_NAME point-cloud-layer-vertex-shader

attribute vec3 positions;
attribute vec3 instanceNormals;
attribute vec4 instanceColors;
attribute vec3 instancePositions;
attribute vec2 instancePositions64xyLow;
attribute vec3 instancePickingColors;

uniform float opacity;
uniform float radiusPixels;

varying vec4 vColor;
varying vec2 unitPosition;

void main(void) {
  geometry.worldPosition = instancePositions;
  geometry.normal = project_normal(instanceNormals);

  // position on the containing square in [-1, 1] space
  unitPosition = positions.xy;
  geometry.uv = unitPosition;

  // Find the center of the point and add the current vertex
  vec3 offset = vec3(positions.xy * radiusPixels, 0.0);
  DECKGL_FILTER_SIZE(offset, geometry);

  gl_Position = project_position_to_clipspace(instancePositions, instancePositions64xyLow, vec3(0.), geometry.position);
  gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  // Apply lighting
  vec3 lightColor = lighting_getLightColor(instanceColors.rgb, project_uCameraPosition, geometry.position.xyz, geometry.normal);

  // Apply opacity to instance color, or return instance picking color
  vColor = vec4(lightColor, instanceColors.a * opacity);
  DECKGL_FILTER_COLOR(vColor, geometry);

  // Set color to be rendered to picking fbo (also used to check for selection highlight).
  picking_setPickingColor(instancePickingColors);
}
`;
//# sourceMappingURL=point-cloud-layer-vertex.glsl.js.map