import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import { createModuleInjection } from '@luma.gl/core';
import { PROJECT_COORDINATE_SYSTEM } from '../project/constants';
import { Vector3, Matrix4 } from 'math.gl';
import memoize from '../../utils/memoize';
import { pixelsToWorld } from 'viewport-mercator-project';
const vs = `
const int max_lights = 2;
uniform mat4 shadow_uViewProjectionMatrices[max_lights];
uniform vec4 shadow_uProjectCenters[max_lights];
uniform bool shadow_uDrawShadowMap;
uniform bool shadow_uUseShadowMap;
uniform int shadow_uLightId;
uniform float shadow_uLightCount;

varying vec3 shadow_vPosition[max_lights];

vec4 shadow_setVertexPosition(vec4 position_commonspace) {
  if (shadow_uDrawShadowMap) {
    return project_common_position_to_clipspace(position_commonspace, shadow_uViewProjectionMatrices[shadow_uLightId], shadow_uProjectCenters[shadow_uLightId]);
  }
  if (shadow_uUseShadowMap) {
    for (int i = 0; i < max_lights; i++) {
      if(i < int(shadow_uLightCount)) {
        vec4 shadowMap_position = project_common_position_to_clipspace(position_commonspace, shadow_uViewProjectionMatrices[i], shadow_uProjectCenters[i]);
        shadow_vPosition[i] = (shadowMap_position.xyz / shadowMap_position.w + 1.0) / 2.0;
      }
    }
  }
  return gl_Position;
}
`;
const fs = `
const int max_lights = 2;
uniform bool shadow_uDrawShadowMap;
uniform bool shadow_uUseShadowMap;
uniform sampler2D shadow_uShadowMap0;
uniform sampler2D shadow_uShadowMap1;
uniform vec4 shadow_uColor;
uniform float shadow_uLightCount;

varying vec3 shadow_vPosition[max_lights];

const vec4 bitPackShift = vec4(1.0, 255.0, 65025.0, 16581375.0);
const vec4 bitUnpackShift = 1.0 / bitPackShift;
const vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0,  0.0);

float shadow_getShadowWeight(vec3 position, sampler2D shadowMap) {
  vec4 rgbaDepth = texture2D(shadowMap, position.xy);

  float z = dot(rgbaDepth, bitUnpackShift);
  return smoothstep(0.001, 0.01, position.z - z);
}

vec4 shadow_filterShadowColor(vec4 color) {
  if (shadow_uDrawShadowMap) {
    vec4 rgbaDepth = fract(gl_FragCoord.z * bitPackShift);
    rgbaDepth -= rgbaDepth.gbaa * bitMask;
    return rgbaDepth;
  }
  if (shadow_uUseShadowMap) {
    float shadowAlpha = 0.0;
    shadowAlpha += shadow_getShadowWeight(shadow_vPosition[0], shadow_uShadowMap0);
    if(shadow_uLightCount > 1.0) {
      shadowAlpha += shadow_getShadowWeight(shadow_vPosition[1], shadow_uShadowMap1);
    }
    shadowAlpha *= shadow_uColor.a / shadow_uLightCount;
    float blendedAlpha = shadowAlpha + color.a * (1.0 - shadowAlpha);

    return vec4(
      mix(color.rgb, shadow_uColor.rgb, shadowAlpha / blendedAlpha),
      blendedAlpha
    );
  }
  return color;
}
`;
const moduleName = 'shadow';
const getMemoizedViewportCenterPosition = memoize(getViewportCenterPosition);
const getMemoizedViewProjectionMatrices = memoize(getViewProjectionMatrices);
createModuleInjection(moduleName, {
  hook: 'vs:DECKGL_FILTER_GL_POSITION',
  injection: `
position = shadow_setVertexPosition(geometry.position);
  `
});
createModuleInjection(moduleName, {
  hook: 'fs:DECKGL_FILTER_COLOR',
  injection: `
color = shadow_filterShadowColor(color);
  `
});
const DEFAULT_SHADOW_COLOR = [0, 0, 0, 1.0];
const VECTOR_TO_POINT_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];

function screenToCommonSpace(xyz, pixelUnprojectionMatrix) {
  const _xyz = _slicedToArray(xyz, 3),
        x = _xyz[0],
        y = _xyz[1],
        z = _xyz[2];

  const coord = pixelsToWorld([x, y, z], pixelUnprojectionMatrix);

  if (Number.isFinite(z)) {
    return coord;
  }

  return [coord[0], coord[1], 0];
}

function getViewportCenterPosition(_ref) {
  let viewport = _ref.viewport,
      center = _ref.center;
  return new Matrix4(viewport.viewProjectionMatrix).invert().transformVector4(center);
}

function getViewProjectionMatrices(_ref2) {
  let viewport = _ref2.viewport,
      shadowMatrices = _ref2.shadowMatrices;
  const projectionMatrices = [];
  const pixelUnprojectionMatrix = viewport.pixelUnprojectionMatrix;
  const farZ = viewport.isGeospatial ? undefined : 1;
  const corners = [[0, 0, farZ], [viewport.width, 0, farZ], [0, viewport.height, farZ], [viewport.width, viewport.height, farZ], [0, 0, -1], [viewport.width, 0, -1], [0, viewport.height, -1], [viewport.width, viewport.height, -1]].map(pixel => screenToCommonSpace(pixel, pixelUnprojectionMatrix));

  for (const shadowMatrix of shadowMatrices) {
    const viewMatrix = shadowMatrix.clone().translate(new Vector3(viewport.center).negate());
    const positions = corners.map(corner => viewMatrix.transformVector3(corner));
    const projectionMatrix = new Matrix4().ortho({
      left: Math.min(...positions.map(position => position[0])),
      right: Math.max(...positions.map(position => position[0])),
      bottom: Math.min(...positions.map(position => position[1])),
      top: Math.max(...positions.map(position => position[1])),
      near: Math.min(...positions.map(position => -position[2])),
      far: Math.max(...positions.map(position => -position[2]))
    });
    projectionMatrices.push(projectionMatrix.multiplyRight(shadowMatrix));
  }

  return projectionMatrices;
}

function createShadowUniforms() {
  let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const uniforms = {
    shadow_uDrawShadowMap: Boolean(opts.drawToShadowMap),
    shadow_uUseShadowMap: opts.shadowMaps ? opts.shadowMaps.length > 0 : false,
    shadow_uColor: opts.shadowColor || DEFAULT_SHADOW_COLOR,
    shadow_uLightId: opts.shadowLightId || 0,
    shadow_uLightCount: opts.shadowMatrices.length
  };
  const center = getMemoizedViewportCenterPosition({
    viewport: opts.viewport,
    center: context.project_uCenter
  });
  const projectCenters = [];
  const viewProjectionMatrices = getMemoizedViewProjectionMatrices({
    shadowMatrices: opts.shadowMatrices,
    viewport: opts.viewport
  }).slice();

  for (let i = 0; i < opts.shadowMatrices.length; i++) {
    const viewProjectionMatrix = viewProjectionMatrices[i];
    const viewProjectionMatrixCentered = viewProjectionMatrix.clone().translate(new Vector3(opts.viewport.center).negate());

    if (context.project_uCoordinateSystem === PROJECT_COORDINATE_SYSTEM.LNG_LAT) {
      viewProjectionMatrices[i] = viewProjectionMatrixCentered;
      projectCenters[i] = [0, 0, 0, 0];
    } else {
      viewProjectionMatrices[i] = viewProjectionMatrix.clone().multiplyRight(VECTOR_TO_POINT_MATRIX);
      projectCenters[i] = viewProjectionMatrixCentered.transformVector4(center);
    }
  }

  for (let i = 0; i < viewProjectionMatrices.length; i++) {
    uniforms[`shadow_uViewProjectionMatrices[${i}]`] = viewProjectionMatrices[i];
    uniforms[`shadow_uProjectCenters[${i}]`] = projectCenters[i];

    if (opts.shadowMaps && opts.shadowMaps.length > 0) {
      uniforms[`shadow_uShadowMap${i}`] = opts.shadowMaps[i];
    } else {
      uniforms[`shadow_uShadowMap${i}`] = opts.dummyShadowMap;
    }
  }

  return uniforms;
}

export default {
  name: 'shadow',
  dependencies: ['project'],
  vs,
  fs,
  getUniforms: function getUniforms() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (opts.drawToShadowMap || opts.shadowMaps && opts.shadowMaps.length > 0) {
      const shadowUniforms = {};
      const _opts$shadowEnabled = opts.shadowEnabled,
            shadowEnabled = _opts$shadowEnabled === void 0 ? true : _opts$shadowEnabled;

      if (shadowEnabled && opts.shadowMatrices && opts.shadowMatrices.length > 0) {
        Object.assign(shadowUniforms, createShadowUniforms(opts, context));
      } else {
        Object.assign(shadowUniforms, {
          shadow_uDrawShadowMap: false,
          shadow_uUseShadowMap: false
        });
      }

      return shadowUniforms;
    }

    return {};
  }
};
//# sourceMappingURL=shadow.js.map