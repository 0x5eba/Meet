"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _core = require("@luma.gl/core");

var _core2 = require("@deck.gl/core");

var _triangleLayerVertex = _interopRequireDefault(require("./triangle-layer-vertex.glsl"));

var _triangleLayerFragment = _interopRequireDefault(require("./triangle-layer-fragment.glsl"));

var defaultProps = {
  count: 0,
  texture: null
};

var TriangleLayer = function (_Layer) {
  (0, _inherits2.default)(TriangleLayer, _Layer);

  function TriangleLayer() {
    (0, _classCallCheck2.default)(this, TriangleLayer);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(TriangleLayer).apply(this, arguments));
  }

  (0, _createClass2.default)(TriangleLayer, [{
    key: "getShaders",
    value: function getShaders() {
      return {
        vs: _triangleLayerVertex.default,
        fs: _triangleLayerFragment.default,
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
      return new _core.Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new _core.Geometry({
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
}(_core2.Layer);

exports.default = TriangleLayer;
TriangleLayer.layerName = 'TriangleLayer';
TriangleLayer.defaultProps = defaultProps;
//# sourceMappingURL=triangle-layer.js.map