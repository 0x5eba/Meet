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

var _directionalLight = _interopRequireDefault(require("./directional-light"));

var _effect = _interopRequireDefault(require("../../lib/effect"));

var _math = require("math.gl");

var _shadowPass = _interopRequireDefault(require("../../passes/shadow-pass"));

var _shadow = _interopRequireDefault(require("../../shaderlib/shadow/shadow"));

var DEFAULT_AMBIENT_LIGHT_PROPS = {
  color: [255, 255, 255],
  intensity: 1.0
};
var DEFAULT_DIRECTIONAL_LIGHT_PROPS = [{
  color: [255, 255, 255],
  intensity: 1.0,
  direction: [-1, -3, -1]
}, {
  color: [255, 255, 255],
  intensity: 0.9,
  direction: [1, 8, -2.5]
}];
var DEFAULT_SHADOW_COLOR = [0, 0, 0, 200 / 255];

var LightingEffect = function (_Effect) {
  (0, _inherits2.default)(LightingEffect, _Effect);

  function LightingEffect(props) {
    var _this;

    (0, _classCallCheck2.default)(this, LightingEffect);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(LightingEffect).call(this, props));
    _this.ambientLight = null;
    _this.directionalLights = [];
    _this.pointLights = [];
    _this.shadowColor = DEFAULT_SHADOW_COLOR;
    _this.shadowPasses = [];
    _this.dummyShadowMap = null;
    _this.shadow = false;

    for (var key in props) {
      var lightSource = props[key];

      switch (lightSource.type) {
        case 'ambient':
          _this.ambientLight = lightSource;
          break;

        case 'directional':
          _this.directionalLights.push(lightSource);

          break;

        case 'point':
          _this.pointLights.push(lightSource);

          break;

        default:
      }
    }

    _this._applyDefaultLights();

    if (_this.directionalLights.some(function (light) {
      return light.shadow;
    })) {
      _this.shadow = true;

      _this._addShadowModule();
    }

    return _this;
  }

  (0, _createClass2.default)(LightingEffect, [{
    key: "prepare",
    value: function prepare(gl, _ref) {
      var layers = _ref.layers,
          viewports = _ref.viewports,
          onViewportActive = _ref.onViewportActive,
          views = _ref.views,
          pixelRatio = _ref.pixelRatio;
      if (!this.shadow) return {};

      var shadowMatrices = this._createLightMatrix();

      if (this.shadowPasses.length === 0) {
        this._createShadowPasses(gl, pixelRatio);
      }

      if (!this.dummyShadowMap) {
        this.dummyShadowMap = new _core.Texture2D(gl, {
          width: 1,
          height: 1
        });
      }

      var shadowMaps = [];

      for (var i = 0; i < this.shadowPasses.length; i++) {
        var shadowPass = this.shadowPasses[i];
        shadowPass.render({
          layers: layers.filter(function (layer) {
            return layer.props.shadowEnabled !== false;
          }),
          viewports: viewports,
          onViewportActive: onViewportActive,
          views: views,
          effectProps: {
            shadowLightId: i,
            dummyShadowMap: this.dummyShadowMap,
            shadowMatrices: shadowMatrices
          }
        });
        shadowMaps.push(shadowPass.shadowMap);
      }

      return {
        shadowMaps: shadowMaps,
        dummyShadowMap: this.dummyShadowMap,
        shadowColor: this.shadowColor,
        shadowMatrices: shadowMatrices
      };
    }
  }, {
    key: "getParameters",
    value: function getParameters(layer) {
      var ambientLight = this.ambientLight;

      var pointLights = this._getProjectedPointLights(layer);

      var directionalLights = this._getProjectedDirectionalLights(layer);

      return {
        lightSources: {
          ambientLight: ambientLight,
          directionalLights: directionalLights,
          pointLights: pointLights
        }
      };
    }
  }, {
    key: "cleanup",
    value: function cleanup() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.shadowPasses[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var shadowPass = _step.value;
          shadowPass.delete();
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

      this.shadowPasses.length = 0;

      if (this.dummyShadowMap) {
        this.dummyShadowMap.delete();
        this.dummyShadowMap = null;
      }

      if (this.shadow) {
        this._removeShadowModule();
      }
    }
  }, {
    key: "_createLightMatrix",
    value: function _createLightMatrix() {
      var lightMatrices = [];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.directionalLights[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var light = _step2.value;
          var viewMatrix = new _math.Matrix4().lookAt({
            eye: new _math.Vector3(light.direction).negate()
          });
          lightMatrices.push(viewMatrix);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return lightMatrices;
    }
  }, {
    key: "_createShadowPasses",
    value: function _createShadowPasses(gl, pixelRatio) {
      for (var i = 0; i < this.directionalLights.length; i++) {
        this.shadowPasses.push(new _shadowPass.default(gl, {
          pixelRatio: pixelRatio
        }));
      }
    }
  }, {
    key: "_addShadowModule",
    value: function _addShadowModule() {
      var defaultShaderModules = (0, _core.getDefaultShaderModules)();
      var hasShadowModule = false;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = defaultShaderModules[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var module = _step3.value;

          if (module.name === "shadow") {
            hasShadowModule = true;
            break;
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      if (!hasShadowModule) {
        defaultShaderModules.push(_shadow.default);
        (0, _core.setDefaultShaderModules)(defaultShaderModules);
      }
    }
  }, {
    key: "_removeShadowModule",
    value: function _removeShadowModule() {
      var defaultShaderModules = (0, _core.getDefaultShaderModules)();

      for (var i = 0; i < defaultShaderModules.length; i++) {
        if (defaultShaderModules[i].name === "shadow") {
          defaultShaderModules.splice(i, 1);
          (0, _core.setDefaultShaderModules)(defaultShaderModules);
          break;
        }
      }
    }
  }, {
    key: "_applyDefaultLights",
    value: function _applyDefaultLights() {
      var ambientLight = this.ambientLight,
          pointLights = this.pointLights,
          directionalLights = this.directionalLights;

      if (!ambientLight && pointLights.length === 0 && directionalLights.length === 0) {
        this.ambientLight = new _core.AmbientLight(DEFAULT_AMBIENT_LIGHT_PROPS);
        this.directionalLights.push(new _directionalLight.default(DEFAULT_DIRECTIONAL_LIGHT_PROPS[0]));
        this.directionalLights.push(new _directionalLight.default(DEFAULT_DIRECTIONAL_LIGHT_PROPS[1]));
      }
    }
  }, {
    key: "_getProjectedPointLights",
    value: function _getProjectedPointLights(layer) {
      var projectedPointLights = [];

      for (var i = 0; i < this.pointLights.length; i++) {
        var pointLight = this.pointLights[i];
        projectedPointLights.push(pointLight.getProjectedLight({
          layer: layer
        }));
      }

      return projectedPointLights;
    }
  }, {
    key: "_getProjectedDirectionalLights",
    value: function _getProjectedDirectionalLights(layer) {
      var projectedDirectionalLights = [];

      for (var i = 0; i < this.directionalLights.length; i++) {
        var directionalLight = this.directionalLights[i];
        projectedDirectionalLights.push(directionalLight.getProjectedLight({
          layer: layer
        }));
      }

      return projectedDirectionalLights;
    }
  }]);
  return LightingEffect;
}(_effect.default);

exports.default = LightingEffect;
//# sourceMappingURL=lighting-effect.js.map