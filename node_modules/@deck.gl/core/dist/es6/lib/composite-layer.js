import Layer from './layer';
import log from '../utils/log';
import { flatten } from '../utils/flatten';
export default class CompositeLayer extends Layer {
  get isComposite() {
    return true;
  }

  getSubLayers() {
    return this.internalState && this.internalState.subLayers || [];
  }

  initializeState() {}

  setState(updateObject) {
    super.setState(updateObject);
    this.setLayerNeedsUpdate();
  }

  getPickingInfo(_ref) {
    let info = _ref.info;
    const object = info.object;
    const isDataWrapped = object && object.__source && object.__source.parent && object.__source.parent.id === this.id;

    if (!isDataWrapped) {
      return info;
    }

    return Object.assign(info, {
      object: object.__source.object,
      index: object.__source.index
    });
  }

  renderLayers() {
    return null;
  }

  shouldRenderSubLayer(id, data) {
    const overridingProps = this.props._subLayerProps;
    return data && data.length || overridingProps && overridingProps[id];
  }

  getSubLayerClass(id, DefaultLayerClass) {
    const overridingProps = this.props._subLayerProps;
    return overridingProps && overridingProps[id] && overridingProps[id].type || DefaultLayerClass;
  }

  getSubLayerRow(row, sourceObject, sourceObjectIndex) {
    row.__source = {
      parent: this,
      object: sourceObject,
      index: sourceObjectIndex
    };
    return row;
  }

  getSubLayerAccessor(accessor) {
    if (typeof accessor === 'function') {
      const objectInfo = {
        data: this.props.data,
        target: []
      };
      return (x, i) => {
        if (x.__source) {
          objectInfo.index = x.__source.index;
          return accessor(x.__source.object, objectInfo);
        }

        return accessor(x, i);
      };
    }

    return accessor;
  }

  getSubLayerProps(sublayerProps) {
    const _this$props = this.props,
          opacity = _this$props.opacity,
          pickable = _this$props.pickable,
          visible = _this$props.visible,
          parameters = _this$props.parameters,
          getPolygonOffset = _this$props.getPolygonOffset,
          highlightedObjectIndex = _this$props.highlightedObjectIndex,
          autoHighlight = _this$props.autoHighlight,
          highlightColor = _this$props.highlightColor,
          coordinateSystem = _this$props.coordinateSystem,
          coordinateOrigin = _this$props.coordinateOrigin,
          wrapLongitude = _this$props.wrapLongitude,
          positionFormat = _this$props.positionFormat,
          modelMatrix = _this$props.modelMatrix,
          extensions = _this$props.extensions,
          overridingProps = _this$props._subLayerProps;
    const newProps = {
      opacity,
      pickable,
      visible,
      parameters,
      getPolygonOffset,
      highlightedObjectIndex,
      autoHighlight,
      highlightColor,
      coordinateSystem,
      coordinateOrigin,
      wrapLongitude,
      positionFormat,
      modelMatrix,
      extensions
    };

    if (sublayerProps) {
      const overridingSublayerProps = overridingProps && overridingProps[sublayerProps.id];
      const overridingSublayerTriggers = overridingSublayerProps && overridingSublayerProps.updateTriggers;
      Object.assign(newProps, sublayerProps, overridingSublayerProps, {
        id: `${this.props.id}-${sublayerProps.id}`,
        updateTriggers: Object.assign({
          all: this.props.updateTriggers.all
        }, sublayerProps.updateTriggers, overridingSublayerTriggers)
      });
    }

    for (const extension of extensions) {
      const passThroughProps = extension.getSubLayerProps.call(this, extension);
      Object.assign(newProps, passThroughProps, {
        updateTriggers: Object.assign(newProps.updateTriggers, passThroughProps.updateTriggers)
      });
    }

    return newProps;
  }

  _getAttributeManager() {
    return null;
  }

  _renderLayers() {
    let subLayers = this.internalState.subLayers;

    if (subLayers && !this.needsUpdate()) {
      log.log(3, `Composite layer reused subLayers ${this}`, this.internalState.subLayers)();
    } else {
      subLayers = this.renderLayers();
      subLayers = flatten(subLayers, {
        filter: Boolean
      });
      this.internalState.subLayers = subLayers;
      log.log(2, `Composite layer rendered new subLayers ${this}`, subLayers)();
    }

    for (const layer of subLayers) {
      layer.parent = this;
    }
  }

}
CompositeLayer.layerName = 'CompositeLayer';
//# sourceMappingURL=composite-layer.js.map