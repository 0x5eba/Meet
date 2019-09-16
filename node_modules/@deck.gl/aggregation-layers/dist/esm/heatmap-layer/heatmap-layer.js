import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";

var _TEXTURE_PARAMETERS;

import { getBounds, boundsContain, packVertices, scaleToAspectRatio, getTextureCoordinates } from './heatmap-layer-utils';
import { Buffer, Transform, getParameter, isWebGL2 } from '@luma.gl/core';
import { CompositeLayer, AttributeManager, COORDINATE_SYSTEM, log } from '@deck.gl/core';
import TriangleLayer from './triangle-layer';
import { getFloatTexture } from '../utils/resource-utils';
import { defaultColorRange, colorRangeToFlatArray } from '../utils/color-utils';
import weights_vs from './weights-vs.glsl';
import weights_fs from './weights-fs.glsl';
import vs_max from './max-vs.glsl';
var RESOLUTION = 2;
var SIZE_2K = 2048;
var ZOOM_DEBOUNCE = 500;
var TEXTURE_PARAMETERS = (_TEXTURE_PARAMETERS = {}, _defineProperty(_TEXTURE_PARAMETERS, 10240, 9729), _defineProperty(_TEXTURE_PARAMETERS, 10241, 9729), _defineProperty(_TEXTURE_PARAMETERS, 10242, 33071), _defineProperty(_TEXTURE_PARAMETERS, 10243, 33071), _TEXTURE_PARAMETERS);
var defaultProps = {
  getPosition: {
    type: 'accessor',
    value: function value(x) {
      return x.position;
    }
  },
  getWeight: {
    type: 'accessor',
    value: 1
  },
  intensity: {
    type: 'number',
    min: 0,
    value: 1
  },
  radiusPixels: {
    type: 'number',
    min: 1,
    max: 100,
    value: 30
  },
  colorRange: defaultColorRange,
  threshold: {
    type: 'number',
    min: 0,
    max: 1,
    value: 0.05
  }
};

var HeatmapLayer = function (_CompositeLayer) {
  _inherits(HeatmapLayer, _CompositeLayer);

  function HeatmapLayer() {
    _classCallCheck(this, HeatmapLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(HeatmapLayer).apply(this, arguments));
  }

  _createClass(HeatmapLayer, [{
    key: "initializeState",
    value: function initializeState() {
      var gl = this.context.gl;
      var textureSize = Math.min(SIZE_2K, getParameter(gl, 3379));
      this.state = {
        textureSize: textureSize,
        supported: true
      };

      if (!isWebGL2(gl)) {
        log.error("HeatmapLayer ".concat(this.id, " is not supported on this browser, requires WebGL2"))();
        this.setState({
          supported: false
        });
        return;
      }

      this._setupAttributes();

      this._setupResources();
    }
  }, {
    key: "shouldUpdateState",
    value: function shouldUpdateState(_ref) {
      var changeFlags = _ref.changeFlags;
      return changeFlags.somethingChanged;
    }
  }, {
    key: "updateState",
    value: function updateState(opts) {
      if (!this.state.supported) {
        return;
      }

      _get(_getPrototypeOf(HeatmapLayer.prototype), "updateState", this).call(this, opts);

      var props = opts.props,
          oldProps = opts.oldProps;

      var changeFlags = this._getChangeFlags(opts);

      if (changeFlags.viewportChanged) {
        changeFlags.boundsChanged = this._updateBounds();
      }

      if (changeFlags.dataChanged || changeFlags.boundsChanged || changeFlags.uniformsChanged) {
        this._updateWeightmap();
      } else if (changeFlags.viewportZoomChanged) {
        this._debouncedUpdateWeightmap();
      }

      if (props.colorRange !== oldProps.colorRange) {
        this._updateColorTexture(opts);
      }

      if (changeFlags.viewportChanged) {
        this._updateTextureRenderingBounds();
      }

      this.setState({
        zoom: opts.context.viewport.zoom
      });
    }
  }, {
    key: "renderLayers",
    value: function renderLayers() {
      if (!this.state.supported) {
        return [];
      }

      var _this$state = this.state,
          weightsTexture = _this$state.weightsTexture,
          triPositionBuffer = _this$state.triPositionBuffer,
          triTexCoordBuffer = _this$state.triTexCoordBuffer,
          maxWeightsTexture = _this$state.maxWeightsTexture,
          colorTexture = _this$state.colorTexture;
      var _this$props = this.props,
          updateTriggers = _this$props.updateTriggers,
          intensity = _this$props.intensity,
          threshold = _this$props.threshold;
      return new TriangleLayer(this.getSubLayerProps({
        id: "".concat(this.id, "-triangle-layer"),
        updateTriggers: updateTriggers
      }), {
        id: 'heatmap-triangle-layer',
        data: {
          attributes: {
            positions: triPositionBuffer,
            texCoords: triTexCoordBuffer
          }
        },
        vertexCount: 4,
        maxTexture: maxWeightsTexture,
        colorTexture: colorTexture,
        texture: weightsTexture,
        intensity: intensity,
        threshold: threshold
      });
    }
  }, {
    key: "finalizeState",
    value: function finalizeState() {
      _get(_getPrototypeOf(HeatmapLayer.prototype), "finalizeState", this).call(this);

      var _this$state2 = this.state,
          weightsTransform = _this$state2.weightsTransform,
          weightsTexture = _this$state2.weightsTexture,
          maxWeightTransform = _this$state2.maxWeightTransform,
          maxWeightsTexture = _this$state2.maxWeightsTexture,
          triPositionBuffer = _this$state2.triPositionBuffer,
          triTexCoordBuffer = _this$state2.triTexCoordBuffer,
          colorTexture = _this$state2.colorTexture;
      weightsTransform && weightsTransform.delete();
      weightsTexture && weightsTexture.delete();
      maxWeightTransform && maxWeightTransform.delete();
      maxWeightsTexture && maxWeightsTexture.delete();
      triPositionBuffer && triPositionBuffer.delete();
      triTexCoordBuffer && triTexCoordBuffer.delete();
      colorTexture && colorTexture.delete();
    }
  }, {
    key: "_getAttributeManager",
    value: function _getAttributeManager() {
      return new AttributeManager(this.context.gl, {
        id: this.props.id,
        stats: this.context.stats
      });
    }
  }, {
    key: "_getChangeFlags",
    value: function _getChangeFlags(opts) {
      var oldProps = opts.oldProps,
          props = opts.props;
      var changeFlags = {};

      if (this._isDataChanged(opts)) {
        changeFlags.dataChanged = true;
      }

      if (oldProps.radiusPixels !== props.radiusPixels) {
        changeFlags.uniformsChanged = true;
      }

      changeFlags.viewportChanged = opts.changeFlags.viewportChanged;
      var zoom = this.state.zoom;

      if (!opts.context.viewport || opts.context.viewport.zoom !== zoom) {
        changeFlags.viewportZoomChanged = true;
      }

      return changeFlags;
    }
  }, {
    key: "_isDataChanged",
    value: function _isDataChanged(_ref2) {
      var changeFlags = _ref2.changeFlags;

      if (changeFlags.dataChanged) {
        return true;
      }

      if (changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPosition || changeFlags.updateTriggersChanged.getWeight)) {
        return true;
      }

      return false;
    }
  }, {
    key: "_setupAttributes",
    value: function _setupAttributes() {
      var attributeManager = this.getAttributeManager();
      attributeManager.add({
        positions: {
          size: 3,
          accessor: 'getPosition'
        },
        weights: {
          size: 1,
          accessor: 'getWeight'
        }
      });
    }
  }, {
    key: "_setupResources",
    value: function _setupResources() {
      var gl = this.context.gl;
      var textureSize = this.state.textureSize;
      var weightsTexture = getFloatTexture(gl, {
        width: textureSize,
        height: textureSize,
        parameters: TEXTURE_PARAMETERS
      });
      var maxWeightsTexture = getFloatTexture(gl);
      var weightsTransform = new Transform(gl, {
        id: "".concat(this.id, "-weights-transform"),
        vs: weights_vs,
        _fs: weights_fs,
        modules: ['project32'],
        elementCount: 1,
        _targetTexture: weightsTexture,
        _targetTextureVarying: 'weightsTexture'
      });
      this.setState({
        weightsTexture: weightsTexture,
        maxWeightsTexture: maxWeightsTexture,
        weightsTransform: weightsTransform,
        model: weightsTransform.model,
        maxWeightTransform: new Transform(gl, {
          id: "".concat(this.id, "-max-weights-transform"),
          _sourceTextures: {
            inTexture: weightsTexture
          },
          _targetTexture: maxWeightsTexture,
          _targetTextureVarying: 'outTexture',
          vs: vs_max,
          elementCount: textureSize * textureSize
        }),
        zoom: null,
        triPositionBuffer: new Buffer(gl, {
          byteLength: 48,
          accessor: {
            size: 3
          }
        }),
        triTexCoordBuffer: new Buffer(gl, {
          byteLength: 48,
          accessor: {
            size: 2
          }
        })
      });
    }
  }, {
    key: "_updateMaxWeightValue",
    value: function _updateMaxWeightValue() {
      var maxWeightTransform = this.state.maxWeightTransform;
      maxWeightTransform.run({
        parameters: {
          blend: true,
          depthTest: false,
          blendFunc: [1, 1],
          blendEquation: 32776
        }
      });
    }
  }, {
    key: "_updateBounds",
    value: function _updateBounds() {
      var forceUpdate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var textureSize = this.state.textureSize;
      var viewport = this.context.viewport;
      var viewportCorners = [viewport.unproject([0, 0]), viewport.unproject([viewport.width, 0]), viewport.unproject([viewport.width, viewport.height]), viewport.unproject([0, viewport.height])];
      var visibleWorldBounds = getBounds(viewportCorners);

      var visibleCommonBounds = this._worldToCommonBounds(visibleWorldBounds);

      var newState = {
        visibleWorldBounds: visibleWorldBounds,
        viewportCorners: viewportCorners
      };
      var boundsChanged = false;

      if (forceUpdate || !this.state.worldBounds || !boundsContain(this.state.worldBounds, visibleWorldBounds)) {
        var scaledCommonBounds = scaleToAspectRatio(visibleCommonBounds, textureSize * RESOLUTION, textureSize * RESOLUTION);

        var worldBounds = this._commonToWorldBounds(scaledCommonBounds);

        if (this.props.coordinateSystem === COORDINATE_SYSTEM.LNGLAT) {
          worldBounds[1] = Math.max(worldBounds[1], -85.051129);
          worldBounds[3] = Math.min(worldBounds[3], 85.051129);
          worldBounds[0] = Math.max(worldBounds[0], -360);
          worldBounds[2] = Math.min(worldBounds[2], 360);
        }

        var normalizedCommonBounds = this._worldToCommonBounds(worldBounds, {
          scaleToAspect: true,
          normalize: true,
          width: textureSize * RESOLUTION,
          height: textureSize * RESOLUTION
        });

        newState.worldBounds = worldBounds;
        newState.normalizedCommonBounds = normalizedCommonBounds;
        boundsChanged = true;
      }

      this.setState(newState);
      return boundsChanged;
    }
  }, {
    key: "_updateTextureRenderingBounds",
    value: function _updateTextureRenderingBounds() {
      var _this$state3 = this.state,
          triPositionBuffer = _this$state3.triPositionBuffer,
          triTexCoordBuffer = _this$state3.triTexCoordBuffer,
          normalizedCommonBounds = _this$state3.normalizedCommonBounds,
          viewportCorners = _this$state3.viewportCorners;
      var viewport = this.context.viewport;
      var commonBounds = normalizedCommonBounds.map(function (x) {
        return x * viewport.scale;
      });
      triPositionBuffer.subData(packVertices(viewportCorners, 3));
      var textureBounds = viewportCorners.map(function (p) {
        return getTextureCoordinates(viewport.projectPosition(p), commonBounds);
      });
      triTexCoordBuffer.subData(packVertices(textureBounds, 2));
    }
  }, {
    key: "_updateColorTexture",
    value: function _updateColorTexture(opts) {
      var colorRange = opts.props.colorRange;
      var colorTexture = this.state.colorTexture;
      var colors = colorRangeToFlatArray(colorRange, true);

      if (colorTexture) {
        colorTexture.setImageData({
          data: colors,
          width: colorRange.length
        });
      } else {
        colorTexture = getFloatTexture(this.context.gl, {
          data: colors,
          width: colorRange.length,
          parameters: TEXTURE_PARAMETERS
        });
      }

      this.setState({
        colorTexture: colorTexture
      });
    }
  }, {
    key: "_updateWeightmap",
    value: function _updateWeightmap() {
      var radiusPixels = this.props.radiusPixels;
      var _this$state4 = this.state,
          weightsTransform = _this$state4.weightsTransform,
          worldBounds = _this$state4.worldBounds,
          textureSize = _this$state4.textureSize;

      this._updateAttributes(this.props);

      var moduleParameters = Object.assign(Object.create(this.props), {
        viewport: this.context.viewport,
        pickingActive: 0
      });

      var commonBounds = this._worldToCommonBounds(worldBounds, {
        useLayerCoordinateSystem: true,
        scaleToAspect: true,
        width: textureSize * RESOLUTION,
        height: textureSize * RESOLUTION
      });

      var uniforms = Object.assign({}, weightsTransform.model.getModuleUniforms(moduleParameters), {
        radiusPixels: radiusPixels,
        commonBounds: commonBounds,
        textureWidth: textureSize
      });
      weightsTransform.update({
        elementCount: this.getNumInstances()
      });
      weightsTransform.run({
        uniforms: uniforms,
        parameters: {
          blend: true,
          depthTest: false,
          blendFunc: [1, 1],
          blendEquation: 32774
        },
        clearRenderTarget: true
      });

      this._updateMaxWeightValue();

      this.setState({
        lastUpdate: Date.now()
      });
    }
  }, {
    key: "_debouncedUpdateWeightmap",
    value: function _debouncedUpdateWeightmap() {
      var fromTimer = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var updateTimer = this.state.updateTimer;
      var timeSinceLastUpdate = Date.now() - this.state.lastUpdate;

      if (fromTimer) {
        updateTimer = null;
      }

      if (timeSinceLastUpdate >= ZOOM_DEBOUNCE) {
        this._updateBounds(true);

        this._updateWeightmap();

        this._updateTextureRenderingBounds();
      } else if (!updateTimer) {
        updateTimer = setTimeout(this._debouncedUpdateWeightmap.bind(this, true), ZOOM_DEBOUNCE - timeSinceLastUpdate);
      }

      this.setState({
        updateTimer: updateTimer
      });
    }
  }, {
    key: "_worldToCommonBounds",
    value: function _worldToCommonBounds(worldBounds) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var _opts$useLayerCoordin = opts.useLayerCoordinateSystem,
          useLayerCoordinateSystem = _opts$useLayerCoordin === void 0 ? false : _opts$useLayerCoordin,
          _opts$scaleToAspect = opts.scaleToAspect,
          scaleToAspect = _opts$scaleToAspect === void 0 ? false : _opts$scaleToAspect,
          width = opts.width,
          height = opts.height;

      var _worldBounds = _slicedToArray(worldBounds, 4),
          minLong = _worldBounds[0],
          minLat = _worldBounds[1],
          maxLong = _worldBounds[2],
          maxLat = _worldBounds[3];

      var viewport = this.context.viewport;
      var topLeftCommon;
      var bottomRightCommon;

      if (useLayerCoordinateSystem) {
        topLeftCommon = this.projectPosition([minLong, maxLat, 0]);
        bottomRightCommon = this.projectPosition([maxLong, minLat, 0]);
      } else {
        topLeftCommon = viewport.projectPosition([minLong, maxLat, 0]);
        bottomRightCommon = viewport.projectPosition([maxLong, minLat, 0]);
      }

      var commonBounds = topLeftCommon.slice(0, 2).concat(bottomRightCommon.slice(0, 2));

      if (scaleToAspect) {
        commonBounds = scaleToAspectRatio(commonBounds, width, height);
      }

      if (opts.normalize) {
        commonBounds = commonBounds.map(function (x) {
          return x / viewport.scale;
        });
      }

      return commonBounds;
    }
  }, {
    key: "_commonToWorldBounds",
    value: function _commonToWorldBounds(commonBounds) {
      var _commonBounds = _slicedToArray(commonBounds, 4),
          xMin = _commonBounds[0],
          yMin = _commonBounds[1],
          xMax = _commonBounds[2],
          yMax = _commonBounds[3];

      var viewport = this.context.viewport;
      var topLeftWorld = viewport.unprojectPosition([xMin, yMax]);
      var bottomRightWorld = viewport.unprojectPosition([xMax, yMin]);
      return topLeftWorld.slice(0, 2).concat(bottomRightWorld.slice(0, 2));
    }
  }]);

  return HeatmapLayer;
}(CompositeLayer);

export { HeatmapLayer as default };
HeatmapLayer.layerName = 'HeatmapLayer';
HeatmapLayer.defaultProps = defaultProps;
//# sourceMappingURL=heatmap-layer.js.map