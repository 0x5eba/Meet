import { CompositeLayer, createIterable } from '@deck.gl/core';
import MultiIconLayer from './multi-icon-layer/multi-icon-layer';
import FontAtlasManager, { DEFAULT_CHAR_SET, DEFAULT_FONT_FAMILY, DEFAULT_FONT_WEIGHT, DEFAULT_FONT_SIZE, DEFAULT_BUFFER, DEFAULT_RADIUS, DEFAULT_CUTOFF } from './font-atlas-manager';
import { replaceInRange } from '../utils';
import { transformParagraph } from './utils';
const DEFAULT_FONT_SETTINGS = {
  fontSize: DEFAULT_FONT_SIZE,
  buffer: DEFAULT_BUFFER,
  sdf: false,
  radius: DEFAULT_RADIUS,
  cutoff: DEFAULT_CUTOFF
};
const TEXT_ANCHOR = {
  start: 1,
  middle: 0,
  end: -1
};
const ALIGNMENT_BASELINE = {
  top: 1,
  center: 0,
  bottom: -1
};
const DEFAULT_COLOR = [0, 0, 0, 255];
const DEFAULT_LINE_HEIGHT = 1.0;
const FONT_SETTINGS_PROPS = ['fontSize', 'buffer', 'sdf', 'radius', 'cutoff'];
const defaultProps = {
  billboard: true,
  sizeScale: 1,
  sizeUnits: 'pixels',
  sizeMinPixels: 0,
  sizeMaxPixels: Number.MAX_SAFE_INTEGER,
  characterSet: DEFAULT_CHAR_SET,
  fontFamily: DEFAULT_FONT_FAMILY,
  fontWeight: DEFAULT_FONT_WEIGHT,
  lineHeight: DEFAULT_LINE_HEIGHT,
  fontSettings: {},
  getText: {
    type: 'accessor',
    value: x => x.text
  },
  getPosition: {
    type: 'accessor',
    value: x => x.position
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getSize: {
    type: 'accessor',
    value: 32
  },
  getAngle: {
    type: 'accessor',
    value: 0
  },
  getTextAnchor: {
    type: 'accessor',
    value: 'middle'
  },
  getAlignmentBaseline: {
    type: 'accessor',
    value: 'center'
  },
  getPixelOffset: {
    type: 'accessor',
    value: [0, 0]
  }
};
export default class TextLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      fontAtlasManager: new FontAtlasManager(this.context.gl)
    };
  }

  updateState(_ref) {
    let props = _ref.props,
        oldProps = _ref.oldProps,
        changeFlags = _ref.changeFlags;
    const fontChanged = this.fontChanged(oldProps, props);

    if (fontChanged) {
      this.updateFontAtlas({
        oldProps,
        props
      });
    }

    const textChanged = changeFlags.dataChanged || fontChanged || props.lineHeight !== oldProps.lineHeight || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getText);

    if (textChanged && Array.isArray(changeFlags.dataChanged)) {
      const data = this.state.data.slice();
      const dataDiff = changeFlags.dataChanged.map(dataRange => replaceInRange({
        data,
        getIndex: p => p.__source.index,
        dataRange,
        replace: this.transformStringToLetters(dataRange)
      }));
      this.setState({
        data,
        dataDiff
      });
    } else if (textChanged) {
      this.setState({
        data: this.transformStringToLetters(),
        dataDiff: null
      });
    }
  }

  finalizeState() {
    super.finalizeState();
    this.state.fontAtlasManager.finalize();
  }

  updateFontAtlas(_ref2) {
    let oldProps = _ref2.oldProps,
        props = _ref2.props;
    const characterSet = props.characterSet,
          fontSettings = props.fontSettings,
          fontFamily = props.fontFamily,
          fontWeight = props.fontWeight;
    const fontAtlasManager = this.state.fontAtlasManager;
    fontAtlasManager.setProps(Object.assign({}, DEFAULT_FONT_SETTINGS, fontSettings, {
      characterSet,
      fontFamily,
      fontWeight
    }));
    const scale = fontAtlasManager.scale,
          texture = fontAtlasManager.texture,
          mapping = fontAtlasManager.mapping;
    this.setState({
      scale,
      iconAtlas: texture,
      iconMapping: mapping
    });
    this.setNeedsRedraw(true);
  }

  fontChanged(oldProps, props) {
    if (oldProps.fontFamily !== props.fontFamily || oldProps.characterSet !== props.characterSet || oldProps.fontWeight !== props.fontWeight) {
      return true;
    }

    if (oldProps.fontSettings === props.fontSettings) {
      return false;
    }

    const oldFontSettings = oldProps.fontSettings || {};
    const fontSettings = props.fontSettings || {};
    return FONT_SETTINGS_PROPS.some(prop => oldFontSettings[prop] !== fontSettings[prop]);
  }

  getPickingInfo(_ref3) {
    let info = _ref3.info;
    return Object.assign(info, {
      object: info.index >= 0 ? this.props.data[info.index] : null
    });
  }

  transformStringToLetters() {
    let dataRange = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _this$props = this.props,
          data = _this$props.data,
          lineHeight = _this$props.lineHeight,
          getText = _this$props.getText;
    const iconMapping = this.state.iconMapping;
    const startRow = dataRange.startRow,
          endRow = dataRange.endRow;

    const _createIterable = createIterable(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

    const transformedData = [];

    for (const object of iterable) {
      const transformCharacter = transformed => {
        return this.getSubLayerRow(transformed, object, objectInfo.index);
      };

      objectInfo.index++;
      const text = getText(object, objectInfo);

      if (text) {
        transformParagraph(text, lineHeight, iconMapping, transformCharacter, transformedData);
      }
    }

    return transformedData;
  }

  getAnchorXFromTextAnchor(getTextAnchor) {
    if (typeof getTextAnchor === 'function') {
      getTextAnchor = this.getSubLayerAccessor(getTextAnchor);
      return x => TEXT_ANCHOR[getTextAnchor(x)] || 0;
    }

    return () => TEXT_ANCHOR[getTextAnchor] || 0;
  }

  getAnchorYFromAlignmentBaseline(getAlignmentBaseline) {
    if (typeof getAlignmentBaseline === 'function') {
      getAlignmentBaseline = this.getSubLayerAccessor(getAlignmentBaseline);
      return x => TEXT_ANCHOR[getAlignmentBaseline(x)] || 0;
    }

    return () => ALIGNMENT_BASELINE[getAlignmentBaseline] || 0;
  }

  renderLayers() {
    const _this$state = this.state,
          data = _this$state.data,
          dataDiff = _this$state.dataDiff,
          scale = _this$state.scale,
          iconAtlas = _this$state.iconAtlas,
          iconMapping = _this$state.iconMapping;
    const _this$props2 = this.props,
          getPosition = _this$props2.getPosition,
          getColor = _this$props2.getColor,
          getSize = _this$props2.getSize,
          getAngle = _this$props2.getAngle,
          getTextAnchor = _this$props2.getTextAnchor,
          getAlignmentBaseline = _this$props2.getAlignmentBaseline,
          getPixelOffset = _this$props2.getPixelOffset,
          billboard = _this$props2.billboard,
          sdf = _this$props2.sdf,
          sizeScale = _this$props2.sizeScale,
          sizeUnits = _this$props2.sizeUnits,
          sizeMinPixels = _this$props2.sizeMinPixels,
          sizeMaxPixels = _this$props2.sizeMaxPixels,
          transitions = _this$props2.transitions,
          updateTriggers = _this$props2.updateTriggers;
    const SubLayerClass = this.getSubLayerClass('characters', MultiIconLayer);
    return new SubLayerClass({
      sdf,
      iconAtlas,
      iconMapping,
      _dataDiff: dataDiff && (() => dataDiff),
      getPosition: this.getSubLayerAccessor(getPosition),
      getColor: this.getSubLayerAccessor(getColor),
      getSize: this.getSubLayerAccessor(getSize),
      getAngle: this.getSubLayerAccessor(getAngle),
      getAnchorX: this.getAnchorXFromTextAnchor(getTextAnchor),
      getAnchorY: this.getAnchorYFromAlignmentBaseline(getAlignmentBaseline),
      getPixelOffset: this.getSubLayerAccessor(getPixelOffset),
      getPickingIndex: obj => obj.__source.index,
      billboard,
      sizeScale: sizeScale * scale,
      sizeUnits,
      sizeMinPixels: sizeMinPixels * scale,
      sizeMaxPixels: sizeMaxPixels * scale,
      transitions: transitions && {
        getPosition: transitions.getPosition,
        getAngle: transitions.getAngle,
        getColor: transitions.getColor,
        getSize: transitions.getSize,
        getPixelOffset: updateTriggers.getPixelOffset
      }
    }, this.getSubLayerProps({
      id: 'characters',
      updateTriggers: {
        getPosition: updateTriggers.getPosition,
        getAngle: updateTriggers.getAngle,
        getColor: updateTriggers.getColor,
        getSize: updateTriggers.getSize,
        getPixelOffset: updateTriggers.getPixelOffset,
        getAnchorX: updateTriggers.getTextAnchor,
        getAnchorY: updateTriggers.getAlignmentBaseline
      }
    }), {
      data,
      getIcon: d => d.text,
      getRowSize: d => d.rowSize,
      getOffsets: d => [d.offsetLeft, d.offsetTop],
      getParagraphSize: d => d.size
    });
  }

}
TextLayer.layerName = 'TextLayer';
TextLayer.defaultProps = defaultProps;
//# sourceMappingURL=text-layer.js.map