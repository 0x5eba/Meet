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

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _core = require("@deck.gl/core");

var _core2 = require("@luma.gl/core");

var _addons = require("@luma.gl/addons");

var _gltfUtils = require("./gltf-utils");

var _matrix = require("../utils/matrix");

var _scenegraphLayerVertex = _interopRequireDefault(require("./scenegraph-layer-vertex.glsl"));

var _scenegraphLayerFragment = _interopRequireDefault(require("./scenegraph-layer-fragment.glsl"));

var DEFAULT_COLOR = [255, 255, 255, 255];
var defaultProps = {
  scenegraph: {
    type: 'object',
    value: null,
    async: true
  },
  getScene: function getScene(gltf) {
    if (gltf && gltf.scenes) {
      return (0, _typeof2.default)(gltf.scene) === 'object' ? gltf.scene : gltf.scenes[gltf.scene || 0];
    }

    return gltf;
  },
  getAnimator: function getAnimator(scenegraph) {
    return scenegraph && scenegraph.animator;
  },
  _animations: null,
  sizeScale: {
    type: 'number',
    value: 1,
    min: 0
  },
  getPosition: {
    type: 'accessor',
    value: function value(x) {
      return x.position;
    }
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  _lighting: 'flat',
  _imageBasedLightingEnvironment: null,
  getOrientation: {
    type: 'accessor',
    value: [0, 0, 0]
  },
  getScale: {
    type: 'accessor',
    value: [1, 1, 1]
  },
  getTranslation: {
    type: 'accessor',
    value: [0, 0, 0]
  },
  getTransformMatrix: {
    type: 'accessor',
    value: []
  }
};

var ScenegraphLayer = function (_Layer) {
  (0, _inherits2.default)(ScenegraphLayer, _Layer);

  function ScenegraphLayer() {
    (0, _classCallCheck2.default)(this, ScenegraphLayer);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(ScenegraphLayer).apply(this, arguments));
  }

  (0, _createClass2.default)(ScenegraphLayer, [{
    key: "initializeState",
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      attributeManager.addInstanced({
        instancePositions: {
          size: 3,
          accessor: 'getPosition',
          transition: true
        },
        instancePositions64xy: {
          size: 2,
          accessor: 'getPosition',
          update: this.calculateInstancePositions64xyLow
        },
        instanceColors: {
          type: 5121,
          size: this.props.colorFormat.length,
          accessor: 'getColor',
          normalized: true,
          defaultValue: DEFAULT_COLOR,
          transition: true
        },
        instanceModelMatrix: _matrix.MATRIX_ATTRIBUTES
      });
    }
  }, {
    key: "updateState",
    value: function updateState(params) {
      (0, _get2.default)((0, _getPrototypeOf2.default)(ScenegraphLayer.prototype), "updateState", this).call(this, params);
      var props = params.props,
          oldProps = params.oldProps;

      if (props.scenegraph !== oldProps.scenegraph) {
        this._updateScenegraph(props);
      } else if (props._animations !== oldProps._animations) {
        this._applyAnimationsProp(this.state.scenegraph, this.state.animator, props._animations);
      }
    }
  }, {
    key: "finalizeState",
    value: function finalizeState() {
      (0, _get2.default)((0, _getPrototypeOf2.default)(ScenegraphLayer.prototype), "finalizeState", this).call(this);

      this._deleteScenegraph();
    }
  }, {
    key: "_updateScenegraph",
    value: function _updateScenegraph(props) {
      var _this = this;

      var gl = this.context.gl;
      var scenegraphData;

      if (props.scenegraph instanceof _core2.ScenegraphNode) {
        scenegraphData = {
          scenes: [props.scenegraph]
        };
      } else if (props.scenegraph && !props.scenegraph.gltf) {
        var gltf = props.scenegraph;
        var gltfObjects = (0, _addons.createGLTFObjects)(gl, gltf, this.getLoadOptions());
        scenegraphData = Object.assign({
          gltf: gltf
        }, gltfObjects);
        (0, _gltfUtils.waitForGLTFAssets)(gltfObjects).then(function () {
          return _this.setNeedsRedraw();
        });
      } else {
        _core2.log.deprecated('ScenegraphLayer.props.scenegraph', 'Use GLTFLoader instead of GLTFScenegraphLoader');

        scenegraphData = props.scenegraph;
      }

      var options = {
        layer: this,
        gl: gl
      };
      var scenegraph = props.getScene(scenegraphData, options);
      var animator = props.getAnimator(scenegraphData, options);

      if (scenegraph instanceof _core2.ScenegraphNode) {
        this._deleteScenegraph();

        this._applyAllAttributes(scenegraph);

        this._applyAnimationsProp(scenegraph, animator, props._animations);

        this.setState({
          scenegraph: scenegraph,
          animator: animator
        });
      } else if (scenegraph !== null) {
        _core2.log.warn('invalid scenegraph:', scenegraph)();
      }
    }
  }, {
    key: "_applyAllAttributes",
    value: function _applyAllAttributes(scenegraph) {
      var _this2 = this;

      if (this.state.attributesAvailable) {
        var allAttributes = this.getAttributeManager().getAttributes();
        scenegraph.traverse(function (model) {
          _this2._setModelAttributes(model.model, allAttributes);
        });
      }
    }
  }, {
    key: "_applyAnimationsProp",
    value: function _applyAnimationsProp(scenegraph, animator, animationsProp) {
      if (!scenegraph || !animator || !animationsProp) {
        return;
      }

      var animations = animator.getAnimations();
      Object.keys(animationsProp).sort().forEach(function (key) {
        var value = animationsProp[key];

        if (key === '*') {
          animations.forEach(function (animation) {
            Object.assign(animation, value);
          });
        } else if (Number.isFinite(Number(key))) {
          var number = Number(key);

          if (number >= 0 && number < animations.length) {
            Object.assign(animations[number], value);
          } else {
            _core2.log.warn("animation ".concat(key, " not found"))();
          }
        } else {
          var findResult = animations.find(function (_ref) {
            var name = _ref.name;
            return name === key;
          });

          if (findResult) {
            Object.assign(findResult, value);
          } else {
            _core2.log.warn("animation ".concat(key, " not found"))();
          }
        }
      });
    }
  }, {
    key: "_deleteScenegraph",
    value: function _deleteScenegraph() {
      var scenegraph = this.state.scenegraph;

      if (scenegraph instanceof _core2.ScenegraphNode) {
        scenegraph.delete();
      }
    }
  }, {
    key: "addVersionToShader",
    value: function addVersionToShader(source) {
      if ((0, _core2.isWebGL2)(this.context.gl)) {
        return "#version 300 es\n".concat(source);
      }

      return source;
    }
  }, {
    key: "getLoadOptions",
    value: function getLoadOptions() {
      var modules = ['project32', 'picking'];
      var _this$props = this.props,
          _lighting = _this$props._lighting,
          _imageBasedLightingEnvironment = _this$props._imageBasedLightingEnvironment;

      if (_lighting === 'pbr') {
        modules.push(_core2.pbr);
      }

      var env = null;

      if (_imageBasedLightingEnvironment) {
        if (typeof _imageBasedLightingEnvironment === 'function') {
          env = _imageBasedLightingEnvironment({
            gl: this.context.gl,
            layer: this
          });
        } else {
          env = _imageBasedLightingEnvironment;
        }
      }

      return {
        gl: this.context.gl,
        waitForFullLoad: true,
        imageBasedLightingEnvironment: env,
        modelOptions: {
          vs: this.addVersionToShader(_scenegraphLayerVertex.default),
          fs: this.addVersionToShader(_scenegraphLayerFragment.default),
          modules: modules,
          isInstanced: true
        },
        useTangents: false
      };
    }
  }, {
    key: "updateAttributes",
    value: function updateAttributes(changedAttributes) {
      var _this3 = this;

      this.setState({
        attributesAvailable: true
      });
      if (!this.state.scenegraph) return;
      this.state.scenegraph.traverse(function (model) {
        _this3._setModelAttributes(model.model, changedAttributes);
      });
    }
  }, {
    key: "draw",
    value: function draw(_ref2) {
      var _ref2$moduleParameter = _ref2.moduleParameters,
          moduleParameters = _ref2$moduleParameter === void 0 ? null : _ref2$moduleParameter,
          _ref2$parameters = _ref2.parameters,
          parameters = _ref2$parameters === void 0 ? {} : _ref2$parameters,
          context = _ref2.context;
      if (!this.state.scenegraph) return;

      if (this.props._animations && this.state.animator) {
        this.state.animator.animate(context.animationProps.time);
      }

      var sizeScale = this.props.sizeScale;
      var numInstances = this.getNumInstances();
      this.state.scenegraph.traverse(function (model, _ref3) {
        var worldMatrix = _ref3.worldMatrix;
        model.model.setInstanceCount(numInstances);
        model.updateModuleSettings(moduleParameters);
        model.draw({
          parameters: parameters,
          uniforms: {
            sizeScale: sizeScale,
            sceneModelMatrix: worldMatrix,
            u_Camera: model.model.program.uniforms.project_uCameraPosition
          }
        });
      });
    }
  }, {
    key: "calculateInstancePositions64xyLow",
    value: function calculateInstancePositions64xyLow(attribute, _ref4) {
      var startRow = _ref4.startRow,
          endRow = _ref4.endRow;
      var isFP64 = this.use64bitPositions();
      attribute.constant = !isFP64;

      if (!isFP64) {
        attribute.value = new Float32Array(2);
        return;
      }

      var _this$props2 = this.props,
          data = _this$props2.data,
          getPosition = _this$props2.getPosition;
      var value = attribute.value,
          size = attribute.size;
      var i = startRow * size;

      var _createIterable = (0, _core.createIterable)(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = iterable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var point = _step.value;
          objectInfo.index++;
          var position = getPosition(point, objectInfo);
          value[i++] = (0, _core.fp64LowPart)(position[0]);
          value[i++] = (0, _core.fp64LowPart)(position[1]);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }]);
  return ScenegraphLayer;
}(_core.Layer);

exports.default = ScenegraphLayer;
ScenegraphLayer.layerName = 'ScenegraphLayer';
ScenegraphLayer.defaultProps = defaultProps;
//# sourceMappingURL=scenegraph-layer.js.map