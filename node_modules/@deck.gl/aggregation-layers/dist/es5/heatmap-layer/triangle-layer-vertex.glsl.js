"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = "#define SHADER_NAME heatp-map-layer-vertex-shader\n\nuniform sampler2D maxTexture;\nuniform float intensity;\n\nattribute vec3 positions;\nattribute vec2 texCoords;\n\nvarying vec2 vTexCoords;\nvarying float vIntensity;\n\nvoid main(void) {\n  gl_Position = project_position_to_clipspace(positions, vec2(0.0), vec3(0.0));\n  vTexCoords = texCoords;\n  float maxValue = texture2D(maxTexture, vec2(0.5)).r;\n  vIntensity = intensity / maxValue;\n}\n";
exports.default = _default;
//# sourceMappingURL=triangle-layer-vertex.glsl.js.map