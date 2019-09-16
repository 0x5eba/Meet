"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = "#version 300 es\nin vec4 inTexture;\nout vec4 outTexture;\n\nvoid main()\n{\noutTexture = inTexture;\ngl_Position = vec4(0, 0, 0, 1.);\n}\n";
exports.default = _default;
//# sourceMappingURL=max-vs.glsl.js.map