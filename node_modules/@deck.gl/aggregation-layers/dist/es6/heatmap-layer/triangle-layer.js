import { Model, Geometry } from '@luma.gl/core';
import { Layer } from '@deck.gl/core';
import vs from './triangle-layer-vertex.glsl';
import fs from './triangle-layer-fragment.glsl';
const defaultProps = {
  count: 0,
  texture: null
};
export default class TriangleLayer extends Layer {
  getShaders() {
    return {
      vs,
      fs,
      modules: ['project32']
    };
  }

  initializeState() {
    const gl = this.context.gl;
    const attributeManager = this.getAttributeManager();
    attributeManager.add({
      positions: {
        size: 3,
        noAlloc: true
      },
      texCoords: {
        size: 2,
        noAlloc: true
      }
    });
    this.setState({
      model: this._getModel(gl)
    });
  }

  _getModel(gl) {
    const vertexCount = this.props.vertexCount;
    return new Model(gl, Object.assign({}, this.getShaders(), {
      id: this.props.id,
      geometry: new Geometry({
        drawMode: 6,
        vertexCount
      }),
      shaderCache: this.context.shaderCache
    }));
  }

  draw(_ref) {
    let uniforms = _ref.uniforms;
    const model = this.state.model;
    const _this$props = this.props,
          texture = _this$props.texture,
          maxTexture = _this$props.maxTexture,
          colorTexture = _this$props.colorTexture,
          intensity = _this$props.intensity,
          threshold = _this$props.threshold;
    model.setUniforms({
      texture,
      maxTexture,
      colorTexture,
      intensity,
      threshold
    }).draw();
  }

}
TriangleLayer.layerName = 'TriangleLayer';
TriangleLayer.defaultProps = defaultProps;
//# sourceMappingURL=triangle-layer.js.map