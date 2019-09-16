import { registerShaderModules, setDefaultShaderModules, createShaderHook, createModuleInjection } from '@luma.gl/core';
import { fp32, picking, gouraudlighting, phonglighting } from '@luma.gl/core';
import geometry from './misc/geometry';
import project from './project/project';
import project32 from './project32/project32';
import project64 from './project64/project64';
import shadow from './shadow/shadow';
export function initializeShaderModules() {
  registerShaderModules([fp32, project, project32, gouraudlighting, phonglighting, picking]);
  setDefaultShaderModules([geometry, project]);
  createShaderHook('vs:DECKGL_FILTER_SIZE(inout vec3 size, VertexGeometry geometry)');
  createShaderHook('vs:DECKGL_FILTER_GL_POSITION(inout vec4 position, VertexGeometry geometry)');
  createShaderHook('vs:DECKGL_FILTER_COLOR(inout vec4 color, VertexGeometry geometry)');
  createShaderHook('fs:DECKGL_FILTER_COLOR(inout vec4 color, FragmentGeometry geometry)');
  createModuleInjection('picking', {
    hook: 'fs:DECKGL_FILTER_COLOR',
    order: 99,
    injection: `
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
`
  });
}
export { picking, project, project64, gouraudlighting, phonglighting, shadow };
//# sourceMappingURL=index.js.map