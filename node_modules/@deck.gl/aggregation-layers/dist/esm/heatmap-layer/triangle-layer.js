import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { Model, Geometry } from '@luma.gl/core';
import { Layer } from '@deck.gl/core';
import vs from './triangle-layer-vertex.glsl';
import fs from './triangle-layer-fragment.glsl';
var defaultProps = {
  count: 0,
  texture: null
};

var TriangleLayer = function (_Layer) {
  _inherits(TriangleLayer, _Layer);

  function TriangleLayer() {
    _classCallCheck(this, TriangleLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(TriangleLayer).apply(this, arguments));
  }

  _createClass(TriangleLayer, [{
    key: "getShaders",
    value: function getShaders() {
      return {
        vs: vs,
        fs: fs,
        modules: ['project32']
      };
    }
  }, {
    key: "initializeState",
    value: function initializeState() {
      var gl = this.context.gl;
      var attributeManager = this.getAttributeManager();
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
  }, {
    key: "_getModel",
    value: function _getModel(gl) {
      var vertexCount = this.props.vertexCount;
      return new Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new Geometry({
          drawMode: 6,
          vertexCount: vertexCount
        }),
        shaderCache: this.context.shaderCache
      }));
    }
  }, {
    key: "draw",
    value: function draw(_ref) {
      var uniforms = _ref.uniforms;
      var model = this.state.model;
      var _this$props = this.props,
          texture = _this$props.texture,
          maxTexture = _this$props.maxTexture,
          colorTexture = _this$props.colorTexture,
          intensity = _this$props.intensity,
          threshold = _this$props.threshold;
      model.setUniforms({
        texture: texture,
        maxTexture: maxTexture,
        colorTexture: colorTexture,
        intensity: intensity,
        threshold: threshold
      }).draw();
    }
  }]);

  return TriangleLayer;
}(Layer);

export { TriangleLayer as default };
TriangleLayer.layerName = 'TriangleLayer';
TriangleLayer.defaultProps = defaultProps;
//# sourceMappingURL=triangle-layer.js.map