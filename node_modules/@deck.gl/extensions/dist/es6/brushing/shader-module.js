import { createModuleInjection } from '@luma.gl/core';
const vs = `
  uniform bool brushing_enabled;
  uniform int brushing_target;
  uniform vec2 brushing_mousePos;
  uniform float brushing_radius;

  #ifdef NON_INSTANCED_MODEL
  attribute vec2 brushingTargets;
  #else
  attribute vec2 instanceBrushingTargets;
  #endif

  varying float brushing_isVisible;

  bool brushing_isPointInRange(vec2 position) {
    if (!brushing_enabled) {
      return true;
    }
    vec2 source_commonspace = project_position(position);
    vec2 target_commonspace = project_position(brushing_mousePos);
    float distance = length((target_commonspace - source_commonspace) / project_uCommonUnitsPerMeter.xy);

    return distance <= brushing_radius;
  }

  void brushing_setVisible(bool visible) {
    brushing_isVisible = float(visible);
  }
`;
const fs = `
  uniform bool brushing_enabled;
  varying float brushing_isVisible;
`;
const moduleName = 'brushing';
const TARGET = {
  source: 0,
  target: 1,
  custom: 2
};
createModuleInjection(moduleName, {
  hook: 'vs:DECKGL_FILTER_GL_POSITION',
  injection: `
vec2 brushingTarget;
if (brushing_target == 0) {
  brushingTarget = geometry.worldPosition.xy;
} else if (brushing_target == 1) {
  brushingTarget = geometry.worldPositionAlt.xy;
} else {
  #ifdef NON_INSTANCED_MODEL
  brushingTarget = brushingTargets;
  #else
  brushingTarget = instanceBrushingTargets;
  #endif
}
brushing_setVisible(brushing_isPointInRange(brushingTarget));
  `
});
createModuleInjection(moduleName, {
  hook: 'fs:DECKGL_FILTER_COLOR',
  injection: `
if (brushing_enabled && brushing_isVisible < 0.5) {
  discard;
}
  `
});
export default {
  name: moduleName,
  dependencies: ['project'],
  vs,
  fs,
  getUniforms: opts => {
    if (!opts || !opts.viewport) {
      return {};
    }

    const _opts$brushingEnabled = opts.brushingEnabled,
          brushingEnabled = _opts$brushingEnabled === void 0 ? true : _opts$brushingEnabled,
          _opts$brushingRadius = opts.brushingRadius,
          brushingRadius = _opts$brushingRadius === void 0 ? 10000 : _opts$brushingRadius,
          _opts$brushingTarget = opts.brushingTarget,
          brushingTarget = _opts$brushingTarget === void 0 ? 'source' : _opts$brushingTarget,
          mousePosition = opts.mousePosition,
          viewport = opts.viewport;
    return {
      brushing_enabled: Boolean(brushingEnabled && mousePosition && viewport.containsPixel(mousePosition)),
      brushing_radius: brushingRadius,
      brushing_target: TARGET[brushingTarget] || 0,
      brushing_mousePos: mousePosition ? viewport.unproject([mousePosition.x - viewport.x, mousePosition.y - viewport.y]) : [0, 0]
    };
  }
};
//# sourceMappingURL=shader-module.js.map