import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { AmbientLight, Texture2D, setDefaultShaderModules, getDefaultShaderModules } from '@luma.gl/core';
import DirectionalLight from './directional-light';
import Effect from '../../lib/effect';
import { Matrix4, Vector3 } from 'math.gl';
import ShadowPass from '../../passes/shadow-pass';
import { default as shadow } from '../../shaderlib/shadow/shadow';
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
  _inherits(LightingEffect, _Effect);

  function LightingEffect(props) {
    var _this;

    _classCallCheck(this, LightingEffect);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(LightingEffect).call(this, props));
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

  _createClass(LightingEffect, [{
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
        this.dummyShadowMap = new Texture2D(gl, {
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
          var viewMatrix = new Matrix4().lookAt({
            eye: new Vector3(light.direction).negate()
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
        this.shadowPasses.push(new ShadowPass(gl, {
          pixelRatio: pixelRatio
        }));
      }
    }
  }, {
    key: "_addShadowModule",
    value: function _addShadowModule() {
      var defaultShaderModules = getDefaultShaderModules();
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
        defaultShaderModules.push(shadow);
        setDefaultShaderModules(defaultShaderModules);
      }
    }
  }, {
    key: "_removeShadowModule",
    value: function _removeShadowModule() {
      var defaultShaderModules = getDefaultShaderModules();

      for (var i = 0; i < defaultShaderModules.length; i++) {
        if (defaultShaderModules[i].name === "shadow") {
          defaultShaderModules.splice(i, 1);
          setDefaultShaderModules(defaultShaderModules);
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
        this.ambientLight = new AmbientLight(DEFAULT_AMBIENT_LIGHT_PROPS);
        this.directionalLights.push(new DirectionalLight(DEFAULT_DIRECTIONAL_LIGHT_PROPS[0]));
        this.directionalLights.push(new DirectionalLight(DEFAULT_DIRECTIONAL_LIGHT_PROPS[1]));
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
}(Effect);

export { LightingEffect as default };
//# sourceMappingURL=lighting-effect.js.map