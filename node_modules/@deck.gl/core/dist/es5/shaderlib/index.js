"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initializeShaderModules = initializeShaderModules;
Object.defineProperty(exports, "picking", {
  enumerable: true,
  get: function get() {
    return _core.picking;
  }
});
Object.defineProperty(exports, "gouraudlighting", {
  enumerable: true,
  get: function get() {
    return _core.gouraudlighting;
  }
});
Object.defineProperty(exports, "phonglighting", {
  enumerable: true,
  get: function get() {
    return _core.phonglighting;
  }
});
Object.defineProperty(exports, "project", {
  enumerable: true,
  get: function get() {
    return _project.default;
  }
});
Object.defineProperty(exports, "project64", {
  enumerable: true,
  get: function get() {
    return _project3.default;
  }
});
Object.defineProperty(exports, "shadow", {
  enumerable: true,
  get: function get() {
    return _shadow.default;
  }
});

var _core = require("@luma.gl/core");

var _geometry = _interopRequireDefault(require("./misc/geometry"));

var _project = _interopRequireDefault(require("./project/project"));

var _project2 = _interopRequireDefault(require("./project32/project32"));

var _project3 = _interopRequireDefault(require("./project64/project64"));

var _shadow = _interopRequireDefault(require("./shadow/shadow"));

function initializeShaderModules() {
  (0, _core.registerShaderModules)([_core.fp32, _project.default, _project2.default, _core.gouraudlighting, _core.phonglighting, _core.picking]);
  (0, _core.setDefaultShaderModules)([_geometry.default, _project.default]);
  (0, _core.createShaderHook)('vs:DECKGL_FILTER_SIZE(inout vec3 size, VertexGeometry geometry)');
  (0, _core.createShaderHook)('vs:DECKGL_FILTER_GL_POSITION(inout vec4 position, VertexGeometry geometry)');
  (0, _core.createShaderHook)('vs:DECKGL_FILTER_COLOR(inout vec4 color, VertexGeometry geometry)');
  (0, _core.createShaderHook)('fs:DECKGL_FILTER_COLOR(inout vec4 color, FragmentGeometry geometry)');
  (0, _core.createModuleInjection)('picking', {
    hook: 'fs:DECKGL_FILTER_COLOR',
    order: 99,
    injection: "\n  // use highlight color if this fragment belongs to the selected object.\n  color = picking_filterHighlightColor(color);\n\n  // use picking color if rendering to picking FBO.\n  color = picking_filterPickingColor(color);\n"
  });
}
//# sourceMappingURL=index.js.map