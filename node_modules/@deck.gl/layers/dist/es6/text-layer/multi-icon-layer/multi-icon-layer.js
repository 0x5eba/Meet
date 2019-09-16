import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import { createIterable } from '@deck.gl/core';
import IconLayer from '../../icon-layer/icon-layer';
import vs from './multi-icon-layer-vertex.glsl';
import fs from './multi-icon-layer-fragment.glsl';
const DEFAULT_GAMMA = 0.2;
const DEFAULT_BUFFER = 192.0 / 256;
const defaultProps = {
  getRowSize: {
    type: 'accessor',
    value: x => x.rowSize || [0, 0]
  },
  getOffsets: {
    type: 'accessor',
    value: x => x.offsets || [0, 0]
  },
  getParagraphSize: {
    type: 'accessor',
    value: x => x.size || [1, 1]
  },
  getAnchorX: {
    type: 'accessor',
    value: x => x.anchorX || 0
  },
  getAnchorY: {
    type: 'accessor',
    value: x => x.anchorY || 0
  },
  getPixelOffset: {
    type: 'accessor',
    value: [0, 0]
  },
  getPickingIndex: {
    type: 'accessor',
    value: x => x.objectIndex
  }
};
export default class MultiIconLayer extends IconLayer {
  getShaders() {
    return Object.assign({}, super.getShaders(), {
      vs,
      fs
    });
  }

  initializeState() {
    super.initializeState();
    const attributeManager = this.getAttributeManager();
    attributeManager.addInstanced({
      instancePixelOffset: {
        size: 2,
        transition: true,
        accessor: 'getPixelOffset'
      }
    });
  }

  updateState(updateParams) {
    super.updateState(updateParams);
    const changeFlags = updateParams.changeFlags;

    if (changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.getAnchorX || changeFlags.updateTriggersChanged.getAnchorY)) {
      this.getAttributeManager().invalidate('instanceOffsets');
    }
  }

  draw(_ref) {
    let uniforms = _ref.uniforms;
    const sdf = this.props.sdf;
    super.draw({
      uniforms: Object.assign({}, uniforms, {
        buffer: DEFAULT_BUFFER,
        gamma: DEFAULT_GAMMA,
        sdf: Boolean(sdf)
      })
    });
  }

  calculateInstanceOffsets(attribute, _ref2) {
    let startRow = _ref2.startRow,
        endRow = _ref2.endRow;
    const _this$props = this.props,
          data = _this$props.data,
          iconMapping = _this$props.iconMapping,
          getIcon = _this$props.getIcon,
          getAnchorX = _this$props.getAnchorX,
          getAnchorY = _this$props.getAnchorY,
          getParagraphSize = _this$props.getParagraphSize,
          getRowSize = _this$props.getRowSize,
          getOffsets = _this$props.getOffsets;
    const value = attribute.value,
          size = attribute.size;
    let i = startRow * size;

    const _createIterable = createIterable(data, startRow, endRow),
          iterable = _createIterable.iterable;

    for (const object of iterable) {
      const icon = getIcon(object);
      const rect = iconMapping[icon] || {};

      const _getParagraphSize = getParagraphSize(object),
            _getParagraphSize2 = _slicedToArray(_getParagraphSize, 2),
            width = _getParagraphSize2[0],
            height = _getParagraphSize2[1];

      const _getRowSize = getRowSize(object),
            _getRowSize2 = _slicedToArray(_getRowSize, 1),
            rowWidth = _getRowSize2[0];

      const _getOffsets = getOffsets(object),
            _getOffsets2 = _slicedToArray(_getOffsets, 2),
            offsetX = _getOffsets2[0],
            offsetY = _getOffsets2[1];

      const anchorX = getAnchorX(object);
      const anchorY = getAnchorY(object);
      const rowOffset = (1 - anchorX) * (width - rowWidth) / 2;
      value[i++] = (anchorX - 1) * width / 2 + rowOffset + rect.width / 2 + offsetX || 0;
      value[i++] = (anchorY - 1) * height / 2 + rect.height / 2 + offsetY || 0;
    }
  }

  calculateInstancePickingColors(attribute, _ref3) {
    let startRow = _ref3.startRow,
        endRow = _ref3.endRow;
    const _this$props2 = this.props,
          data = _this$props2.data,
          getPickingIndex = _this$props2.getPickingIndex;
    const value = attribute.value,
          size = attribute.size;
    let i = startRow * size;
    const pickingColor = [];

    const _createIterable2 = createIterable(data, startRow, endRow),
          iterable = _createIterable2.iterable;

    for (const point of iterable) {
      const index = getPickingIndex(point);
      this.encodePickingColor(index, pickingColor);
      value[i++] = pickingColor[0];
      value[i++] = pickingColor[1];
      value[i++] = pickingColor[2];
    }
  }

}
MultiIconLayer.layerName = 'MultiIconLayer';
MultiIconLayer.defaultProps = defaultProps;
//# sourceMappingURL=multi-icon-layer.js.map