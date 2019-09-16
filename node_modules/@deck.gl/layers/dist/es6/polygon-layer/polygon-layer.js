import { PhongMaterial } from '@luma.gl/core';
import { CompositeLayer, createIterable } from '@deck.gl/core';
import SolidPolygonLayer from '../solid-polygon-layer/solid-polygon-layer';
import PathLayer from '../path-layer/path-layer';
import * as Polygon from '../solid-polygon-layer/polygon';
import { replaceInRange } from '../utils';
const defaultLineColor = [0, 0, 0, 255];
const defaultFillColor = [0, 0, 0, 255];
const defaultMaterial = new PhongMaterial();
const defaultProps = {
  stroked: true,
  filled: true,
  extruded: false,
  elevationScale: 1,
  wireframe: false,
  lineWidthUnits: 'meters',
  lineWidthScale: 1,
  lineWidthMinPixels: 0,
  lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
  lineJointRounded: false,
  lineMiterLimit: 4,
  lineDashJustified: false,
  getPolygon: {
    type: 'accessor',
    value: f => f.polygon
  },
  getFillColor: {
    type: 'accessor',
    value: defaultFillColor
  },
  getLineColor: {
    type: 'accessor',
    value: defaultLineColor
  },
  getLineWidth: {
    type: 'accessor',
    value: 1
  },
  getLineDashArray: {
    type: 'accessor',
    value: [0, 0]
  },
  getElevation: {
    type: 'accessor',
    value: 1000
  },
  material: defaultMaterial
};
export default class PolygonLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      paths: []
    };
  }

  updateState(_ref) {
    let oldProps = _ref.oldProps,
        props = _ref.props,
        changeFlags = _ref.changeFlags;
    const geometryChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged && (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPolygon);

    if (geometryChanged && Array.isArray(changeFlags.dataChanged)) {
      const paths = this.state.paths.slice();
      const pathsDiff = changeFlags.dataChanged.map(dataRange => replaceInRange({
        data: paths,
        getIndex: p => p.__source.index,
        dataRange,
        replace: this._getPaths(dataRange)
      }));
      this.setState({
        paths,
        pathsDiff
      });
    } else if (geometryChanged) {
      this.setState({
        paths: this._getPaths(),
        pathsDiff: null
      });
    }
  }

  _getPaths() {
    let dataRange = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _this$props = this.props,
          data = _this$props.data,
          getPolygon = _this$props.getPolygon,
          positionFormat = _this$props.positionFormat;
    const paths = [];
    const positionSize = positionFormat === 'XY' ? 2 : 3;
    const startRow = dataRange.startRow,
          endRow = dataRange.endRow;

    const _createIterable = createIterable(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

    for (const object of iterable) {
      objectInfo.index++;

      const _Polygon$normalize = Polygon.normalize(getPolygon(object, objectInfo), positionSize),
            positions = _Polygon$normalize.positions,
            holeIndices = _Polygon$normalize.holeIndices;

      if (holeIndices) {
        for (let i = 0; i <= holeIndices.length; i++) {
          const path = positions.subarray(holeIndices[i - 1] || 0, holeIndices[i] || positions.length);
          paths.push(this.getSubLayerRow({
            path
          }, object, objectInfo.index));
        }
      } else {
        paths.push(this.getSubLayerRow({
          path: positions
        }, object, objectInfo.index));
      }
    }

    return paths;
  }

  renderLayers() {
    const _this$props2 = this.props,
          data = _this$props2.data,
          _dataDiff = _this$props2._dataDiff,
          stroked = _this$props2.stroked,
          filled = _this$props2.filled,
          extruded = _this$props2.extruded,
          wireframe = _this$props2.wireframe,
          elevationScale = _this$props2.elevationScale,
          transitions = _this$props2.transitions,
          positionFormat = _this$props2.positionFormat;
    const _this$props3 = this.props,
          lineWidthUnits = _this$props3.lineWidthUnits,
          lineWidthScale = _this$props3.lineWidthScale,
          lineWidthMinPixels = _this$props3.lineWidthMinPixels,
          lineWidthMaxPixels = _this$props3.lineWidthMaxPixels,
          lineJointRounded = _this$props3.lineJointRounded,
          lineMiterLimit = _this$props3.lineMiterLimit,
          lineDashJustified = _this$props3.lineDashJustified;
    const _this$props4 = this.props,
          getFillColor = _this$props4.getFillColor,
          getLineColor = _this$props4.getLineColor,
          getLineWidth = _this$props4.getLineWidth,
          getLineDashArray = _this$props4.getLineDashArray,
          getElevation = _this$props4.getElevation,
          getPolygon = _this$props4.getPolygon,
          updateTriggers = _this$props4.updateTriggers,
          material = _this$props4.material;
    const _this$state = this.state,
          paths = _this$state.paths,
          pathsDiff = _this$state.pathsDiff;
    const FillLayer = this.getSubLayerClass('fill', SolidPolygonLayer);
    const StrokeLayer = this.getSubLayerClass('stroke', PathLayer);
    const polygonLayer = this.shouldRenderSubLayer('fill', paths) && new FillLayer({
      _dataDiff,
      extruded,
      elevationScale,
      filled,
      wireframe,
      getElevation,
      getFillColor,
      getLineColor,
      material,
      transitions
    }, this.getSubLayerProps({
      id: 'fill',
      updateTriggers: {
        getPolygon: updateTriggers.getPolygon,
        getElevation: updateTriggers.getElevation,
        getFillColor: updateTriggers.getFillColor,
        getLineColor: updateTriggers.getLineColor
      }
    }), {
      data,
      positionFormat,
      getPolygon
    });
    const polygonLineLayer = !extruded && stroked && this.shouldRenderSubLayer('stroke', paths) && new StrokeLayer({
      _dataDiff: pathsDiff && (() => pathsDiff),
      widthUnits: lineWidthUnits,
      widthScale: lineWidthScale,
      widthMinPixels: lineWidthMinPixels,
      widthMaxPixels: lineWidthMaxPixels,
      rounded: lineJointRounded,
      miterLimit: lineMiterLimit,
      dashJustified: lineDashJustified,
      transitions: transitions && {
        getWidth: transitions.getLineWidth,
        getColor: transitions.getLineColor,
        getPath: transitions.getPolygon
      },
      getColor: this.getSubLayerAccessor(getLineColor),
      getWidth: this.getSubLayerAccessor(getLineWidth),
      getDashArray: this.getSubLayerAccessor(getLineDashArray)
    }, this.getSubLayerProps({
      id: 'stroke',
      updateTriggers: {
        getWidth: updateTriggers.getLineWidth,
        getColor: updateTriggers.getLineColor,
        getDashArray: updateTriggers.getLineDashArray
      }
    }), {
      data: paths,
      positionFormat,
      getPath: x => x.path
    });
    return [!extruded && polygonLayer, polygonLineLayer, extruded && polygonLayer];
  }

}
PolygonLayer.layerName = 'PolygonLayer';
PolygonLayer.defaultProps = defaultProps;
//# sourceMappingURL=polygon-layer.js.map