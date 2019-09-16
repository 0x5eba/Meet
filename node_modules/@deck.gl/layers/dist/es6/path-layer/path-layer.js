import { Layer } from '@deck.gl/core';
import { Model, Geometry } from '@luma.gl/core';
import PathTesselator from './path-tesselator';
import vs from './path-layer-vertex.glsl';
import fs from './path-layer-fragment.glsl';
const DEFAULT_COLOR = [0, 0, 0, 255];
const defaultProps = {
  widthUnits: 'meters',
  widthScale: {
    type: 'number',
    min: 0,
    value: 1
  },
  widthMinPixels: {
    type: 'number',
    min: 0,
    value: 0
  },
  widthMaxPixels: {
    type: 'number',
    min: 0,
    value: Number.MAX_SAFE_INTEGER
  },
  rounded: false,
  miterLimit: {
    type: 'number',
    min: 0,
    value: 4
  },
  dashJustified: false,
  billboard: false,
  getPath: {
    type: 'accessor',
    value: object => object.path
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getWidth: {
    type: 'accessor',
    value: 1
  },
  getDashArray: {
    type: 'accessor',
    value: [0, 0]
  }
};
const ATTRIBUTE_TRANSITION = {
  enter: (value, chunk) => {
    return chunk.length ? chunk.subarray(chunk.length - value.length) : value;
  }
};
export default class PathLayer extends Layer {
  getShaders() {
    return super.getShaders({
      vs,
      fs,
      modules: ['project32', 'picking']
    });
  }

  initializeState() {
    const noAlloc = true;
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      startPositions: {
        size: 3,
        offset: 12,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getPath',
        update: this.calculateStartPositions,
        noAlloc,
        shaderAttributes: {
          instanceLeftPositions: {
            offset: 0
          },
          instanceStartPositions: {
            offset: 12
          }
        }
      },
      endPositions: {
        size: 3,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getPath',
        update: this.calculateEndPositions,
        noAlloc,
        shaderAttributes: {
          instanceEndPositions: {
            offset: 0
          },
          instanceRightPositions: {
            offset: 12
          }
        }
      },
      instanceLeftStartPositions64xyLow: {
        size: 4,
        stride: 8,
        update: this.calculateLeftStartPositions64xyLow,
        noAlloc
      },
      instanceEndRightPositions64xyLow: {
        size: 4,
        stride: 8,
        update: this.calculateEndRightPositions64xyLow,
        noAlloc
      },
      instanceTypes: {
        size: 1,
        type: 5121,
        update: this.calculateSegmentTypes,
        noAlloc
      },
      instanceStrokeWidths: {
        size: 1,
        accessor: 'getWidth',
        transition: ATTRIBUTE_TRANSITION,
        defaultValue: 1
      },
      instanceDashArrays: {
        size: 2,
        accessor: 'getDashArray'
      },
      instanceColors: {
        size: this.props.colorFormat.length,
        type: 5121,
        normalized: true,
        accessor: 'getColor',
        transition: ATTRIBUTE_TRANSITION,
        defaultValue: DEFAULT_COLOR
      },
      instancePickingColors: {
        size: 3,
        type: 5121,
        accessor: (object, _ref) => {
          let index = _ref.index,
              value = _ref.target;
          return this.encodePickingColor(index, value);
        }
      }
    });
    this.setState({
      pathTesselator: new PathTesselator({})
    });
  }

  updateState(_ref2) {
    let oldProps = _ref2.oldProps,
        props = _ref2.props,
        changeFlags = _ref2.changeFlags;
    super.updateState({
      props,
      oldProps,
      changeFlags
    });
    const attributeManager = this.getAttributeManager();
    const geometryChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPath);

    if (geometryChanged) {
      const pathTesselator = this.state.pathTesselator;
      pathTesselator.updateGeometry({
        data: props.data,
        getGeometry: props.getPath,
        positionFormat: props.positionFormat,
        fp64: this.use64bitPositions(),
        dataChanged: changeFlags.dataChanged
      });
      this.setState({
        numInstances: pathTesselator.instanceCount,
        bufferLayout: pathTesselator.bufferLayout
      });

      if (!changeFlags.dataChanged) {
        attributeManager.invalidateAll();
      }
    }

    if (changeFlags.extensionsChanged) {
      const gl = this.context.gl;

      if (this.state.model) {
        this.state.model.delete();
      }

      this.setState({
        model: this._getModel(gl)
      });
      attributeManager.invalidateAll();
    }
  }

  draw(_ref3) {
    let uniforms = _ref3.uniforms;
    const viewport = this.context.viewport;
    const _this$props = this.props,
          rounded = _this$props.rounded,
          billboard = _this$props.billboard,
          miterLimit = _this$props.miterLimit,
          widthUnits = _this$props.widthUnits,
          widthScale = _this$props.widthScale,
          widthMinPixels = _this$props.widthMinPixels,
          widthMaxPixels = _this$props.widthMaxPixels,
          dashJustified = _this$props.dashJustified;
    const widthMultiplier = widthUnits === 'pixels' ? viewport.distanceScales.metersPerPixel[2] : 1;
    this.state.model.setUniforms(Object.assign({}, uniforms, {
      jointType: Number(rounded),
      billboard,
      alignMode: Number(dashJustified),
      widthScale: widthScale * widthMultiplier,
      miterLimit,
      widthMinPixels,
      widthMaxPixels
    })).draw();
  }

  _getModel(gl) {
    const SEGMENT_INDICES = [0, 2, 1, 1, 2, 4, 1, 4, 3, 3, 4, 5];
    const SEGMENT_POSITIONS = [0, 0, 1, 0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0, 1, 0, 1];
    return new Model(gl, Object.assign({}, this.getShaders(), {
      id: this.props.id,
      geometry: new Geometry({
        drawMode: 4,
        attributes: {
          indices: new Uint16Array(SEGMENT_INDICES),
          positions: new Float32Array(SEGMENT_POSITIONS)
        }
      }),
      isInstanced: true,
      shaderCache: this.context.shaderCache
    }));
  }

  calculateStartPositions(attribute) {
    const pathTesselator = this.state.pathTesselator;
    attribute.bufferLayout = pathTesselator.bufferLayout;
    attribute.value = pathTesselator.get('startPositions');
  }

  calculateEndPositions(attribute) {
    const pathTesselator = this.state.pathTesselator;
    attribute.bufferLayout = pathTesselator.bufferLayout;
    attribute.value = pathTesselator.get('endPositions');
  }

  calculateSegmentTypes(attribute) {
    const pathTesselator = this.state.pathTesselator;
    attribute.bufferLayout = pathTesselator.bufferLayout;
    attribute.value = pathTesselator.get('segmentTypes');
  }

  calculateLeftStartPositions64xyLow(attribute) {
    const isFP64 = this.use64bitPositions();
    attribute.constant = !isFP64;

    if (isFP64) {
      attribute.value = this.state.pathTesselator.get('startPositions64XyLow');
    } else {
      attribute.value = new Float32Array(4);
    }
  }

  calculateEndRightPositions64xyLow(attribute) {
    const isFP64 = this.use64bitPositions();
    attribute.constant = !isFP64;

    if (isFP64) {
      attribute.value = this.state.pathTesselator.get('endPositions64XyLow');
    } else {
      attribute.value = new Float32Array(4);
    }
  }

  clearPickingColor(color) {
    const pickedPathIndex = this.decodePickingColor(color);
    const bufferLayout = this.state.pathTesselator.bufferLayout;
    const numVertices = bufferLayout[pickedPathIndex];
    let startInstanceIndex = 0;

    for (let pathIndex = 0; pathIndex < pickedPathIndex; pathIndex++) {
      startInstanceIndex += bufferLayout[pathIndex];
    }

    const instancePickingColors = this.getAttributeManager().attributes.instancePickingColors;
    const value = instancePickingColors.value;
    const endInstanceIndex = startInstanceIndex + numVertices;
    value.fill(0, startInstanceIndex * 3, endInstanceIndex * 3);
    instancePickingColors.update({
      value
    });
  }

}
PathLayer.layerName = 'PathLayer';
PathLayer.defaultProps = defaultProps;
//# sourceMappingURL=path-layer.js.map