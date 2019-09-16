import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import { getBounds, boundsContain, packVertices, scaleToAspectRatio, getTextureCoordinates } from './heatmap-layer-utils';
import { Buffer, Transform, getParameter, isWebGL2 } from '@luma.gl/core';
import { CompositeLayer, AttributeManager, COORDINATE_SYSTEM, log } from '@deck.gl/core';
import TriangleLayer from './triangle-layer';
import { getFloatTexture } from '../utils/resource-utils';
import { defaultColorRange, colorRangeToFlatArray } from '../utils/color-utils';
import weights_vs from './weights-vs.glsl';
import weights_fs from './weights-fs.glsl';
import vs_max from './max-vs.glsl';
const RESOLUTION = 2;
const SIZE_2K = 2048;
const ZOOM_DEBOUNCE = 500;
const TEXTURE_PARAMETERS = {
  [10240]: 9729,
  [10241]: 9729,
  [10242]: 33071,
  [10243]: 33071
};
const defaultProps = {
  getPosition: {
    type: 'accessor',
    value: x => x.position
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
export default class HeatmapLayer extends CompositeLayer {
  initializeState() {
    const gl = this.context.gl;
    const textureSize = Math.min(SIZE_2K, getParameter(gl, 3379));
    this.state = {
      textureSize,
      supported: true
    };

    if (!isWebGL2(gl)) {
      log.error(`HeatmapLayer ${this.id} is not supported on this browser, requires WebGL2`)();
      this.setState({
        supported: false
      });
      return;
    }

    this._setupAttributes();

    this._setupResources();
  }

  shouldUpdateState(_ref) {
    let changeFlags = _ref.changeFlags;
    return changeFlags.somethingChanged;
  }

  updateState(opts) {
    if (!this.state.supported) {
      return;
    }

    super.updateState(opts);
    const props = opts.props,
          oldProps = opts.oldProps;

    const changeFlags = this._getChangeFlags(opts);

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

  renderLayers() {
    if (!this.state.supported) {
      return [];
    }

    const _this$state = this.state,
          weightsTexture = _this$state.weightsTexture,
          triPositionBuffer = _this$state.triPositionBuffer,
          triTexCoordBuffer = _this$state.triTexCoordBuffer,
          maxWeightsTexture = _this$state.maxWeightsTexture,
          colorTexture = _this$state.colorTexture;
    const _this$props = this.props,
          updateTriggers = _this$props.updateTriggers,
          intensity = _this$props.intensity,
          threshold = _this$props.threshold;
    return new TriangleLayer(this.getSubLayerProps({
      id: `${this.id}-triangle-layer`,
      updateTriggers
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
      colorTexture,
      texture: weightsTexture,
      intensity,
      threshold
    });
  }

  finalizeState() {
    super.finalizeState();
    const _this$state2 = this.state,
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

  _getAttributeManager() {
    return new AttributeManager(this.context.gl, {
      id: this.props.id,
      stats: this.context.stats
    });
  }

  _getChangeFlags(opts) {
    const oldProps = opts.oldProps,
          props = opts.props;
    const changeFlags = {};

    if (this._isDataChanged(opts)) {
      changeFlags.dataChanged = true;
    }

    if (oldProps.radiusPixels !== props.radiusPixels) {
      changeFlags.uniformsChanged = true;
    }

    changeFlags.viewportChanged = opts.changeFlags.viewportChanged;
    const zoom = this.state.zoom;

    if (!opts.context.viewport || opts.context.viewport.zoom !== zoom) {
      changeFlags.viewportZoomChanged = true;
    }

    return changeFlags;
  }

  _isDataChanged(_ref2) {
    let changeFlags = _ref2.changeFlags;

    if (changeFlags.dataChanged) {
      return true;
    }

    if (changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPosition || changeFlags.updateTriggersChanged.getWeight)) {
      return true;
    }

    return false;
  }

  _setupAttributes() {
    const attributeManager = this.getAttributeManager();
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

  _setupResources() {
    const gl = this.context.gl;
    const textureSize = this.state.textureSize;
    const weightsTexture = getFloatTexture(gl, {
      width: textureSize,
      height: textureSize,
      parameters: TEXTURE_PARAMETERS
    });
    const maxWeightsTexture = getFloatTexture(gl);
    const weightsTransform = new Transform(gl, {
      id: `${this.id}-weights-transform`,
      vs: weights_vs,
      _fs: weights_fs,
      modules: ['project32'],
      elementCount: 1,
      _targetTexture: weightsTexture,
      _targetTextureVarying: 'weightsTexture'
    });
    this.setState({
      weightsTexture,
      maxWeightsTexture,
      weightsTransform,
      model: weightsTransform.model,
      maxWeightTransform: new Transform(gl, {
        id: `${this.id}-max-weights-transform`,
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

  _updateMaxWeightValue() {
    const maxWeightTransform = this.state.maxWeightTransform;
    maxWeightTransform.run({
      parameters: {
        blend: true,
        depthTest: false,
        blendFunc: [1, 1],
        blendEquation: 32776
      }
    });
  }

  _updateBounds() {
    let forceUpdate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    const textureSize = this.state.textureSize;
    const viewport = this.context.viewport;
    const viewportCorners = [viewport.unproject([0, 0]), viewport.unproject([viewport.width, 0]), viewport.unproject([viewport.width, viewport.height]), viewport.unproject([0, viewport.height])];
    const visibleWorldBounds = getBounds(viewportCorners);

    const visibleCommonBounds = this._worldToCommonBounds(visibleWorldBounds);

    const newState = {
      visibleWorldBounds,
      viewportCorners
    };
    let boundsChanged = false;

    if (forceUpdate || !this.state.worldBounds || !boundsContain(this.state.worldBounds, visibleWorldBounds)) {
      const scaledCommonBounds = scaleToAspectRatio(visibleCommonBounds, textureSize * RESOLUTION, textureSize * RESOLUTION);

      const worldBounds = this._commonToWorldBounds(scaledCommonBounds);

      if (this.props.coordinateSystem === COORDINATE_SYSTEM.LNGLAT) {
        worldBounds[1] = Math.max(worldBounds[1], -85.051129);
        worldBounds[3] = Math.min(worldBounds[3], 85.051129);
        worldBounds[0] = Math.max(worldBounds[0], -360);
        worldBounds[2] = Math.min(worldBounds[2], 360);
      }

      const normalizedCommonBounds = this._worldToCommonBounds(worldBounds, {
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

  _updateTextureRenderingBounds() {
    const _this$state3 = this.state,
          triPositionBuffer = _this$state3.triPositionBuffer,
          triTexCoordBuffer = _this$state3.triTexCoordBuffer,
          normalizedCommonBounds = _this$state3.normalizedCommonBounds,
          viewportCorners = _this$state3.viewportCorners;
    const viewport = this.context.viewport;
    const commonBounds = normalizedCommonBounds.map(x => x * viewport.scale);
    triPositionBuffer.subData(packVertices(viewportCorners, 3));
    const textureBounds = viewportCorners.map(p => getTextureCoordinates(viewport.projectPosition(p), commonBounds));
    triTexCoordBuffer.subData(packVertices(textureBounds, 2));
  }

  _updateColorTexture(opts) {
    const colorRange = opts.props.colorRange;
    let colorTexture = this.state.colorTexture;
    const colors = colorRangeToFlatArray(colorRange, true);

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
      colorTexture
    });
  }

  _updateWeightmap() {
    const radiusPixels = this.props.radiusPixels;
    const _this$state4 = this.state,
          weightsTransform = _this$state4.weightsTransform,
          worldBounds = _this$state4.worldBounds,
          textureSize = _this$state4.textureSize;

    this._updateAttributes(this.props);

    const moduleParameters = Object.assign(Object.create(this.props), {
      viewport: this.context.viewport,
      pickingActive: 0
    });

    const commonBounds = this._worldToCommonBounds(worldBounds, {
      useLayerCoordinateSystem: true,
      scaleToAspect: true,
      width: textureSize * RESOLUTION,
      height: textureSize * RESOLUTION
    });

    const uniforms = Object.assign({}, weightsTransform.model.getModuleUniforms(moduleParameters), {
      radiusPixels,
      commonBounds,
      textureWidth: textureSize
    });
    weightsTransform.update({
      elementCount: this.getNumInstances()
    });
    weightsTransform.run({
      uniforms,
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

  _debouncedUpdateWeightmap() {
    let fromTimer = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    let updateTimer = this.state.updateTimer;
    const timeSinceLastUpdate = Date.now() - this.state.lastUpdate;

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
      updateTimer
    });
  }

  _worldToCommonBounds(worldBounds) {
    let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const _opts$useLayerCoordin = opts.useLayerCoordinateSystem,
          useLayerCoordinateSystem = _opts$useLayerCoordin === void 0 ? false : _opts$useLayerCoordin,
          _opts$scaleToAspect = opts.scaleToAspect,
          scaleToAspect = _opts$scaleToAspect === void 0 ? false : _opts$scaleToAspect,
          width = opts.width,
          height = opts.height;

    const _worldBounds = _slicedToArray(worldBounds, 4),
          minLong = _worldBounds[0],
          minLat = _worldBounds[1],
          maxLong = _worldBounds[2],
          maxLat = _worldBounds[3];

    const viewport = this.context.viewport;
    let topLeftCommon;
    let bottomRightCommon;

    if (useLayerCoordinateSystem) {
      topLeftCommon = this.projectPosition([minLong, maxLat, 0]);
      bottomRightCommon = this.projectPosition([maxLong, minLat, 0]);
    } else {
      topLeftCommon = viewport.projectPosition([minLong, maxLat, 0]);
      bottomRightCommon = viewport.projectPosition([maxLong, minLat, 0]);
    }

    let commonBounds = topLeftCommon.slice(0, 2).concat(bottomRightCommon.slice(0, 2));

    if (scaleToAspect) {
      commonBounds = scaleToAspectRatio(commonBounds, width, height);
    }

    if (opts.normalize) {
      commonBounds = commonBounds.map(x => x / viewport.scale);
    }

    return commonBounds;
  }

  _commonToWorldBounds(commonBounds) {
    const _commonBounds = _slicedToArray(commonBounds, 4),
          xMin = _commonBounds[0],
          yMin = _commonBounds[1],
          xMax = _commonBounds[2],
          yMax = _commonBounds[3];

    const viewport = this.context.viewport;
    const topLeftWorld = viewport.unprojectPosition([xMin, yMax]);
    const bottomRightWorld = viewport.unprojectPosition([xMax, yMin]);
    return topLeftWorld.slice(0, 2).concat(bottomRightWorld.slice(0, 2));
  }

}
HeatmapLayer.layerName = 'HeatmapLayer';
HeatmapLayer.defaultProps = defaultProps;
//# sourceMappingURL=heatmap-layer.js.map