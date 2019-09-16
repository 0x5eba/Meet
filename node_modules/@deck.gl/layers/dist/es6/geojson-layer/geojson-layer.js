import { CompositeLayer } from '@deck.gl/core';
import ScatterplotLayer from '../scatterplot-layer/scatterplot-layer';
import PathLayer from '../path-layer/path-layer';
import { PhongMaterial } from '@luma.gl/core';
import SolidPolygonLayer from '../solid-polygon-layer/solid-polygon-layer';
import { replaceInRange } from '../utils';
import { getGeojsonFeatures, separateGeojsonFeatures } from './geojson';
const defaultLineColor = [0, 0, 0, 255];
const defaultFillColor = [0, 0, 0, 255];
const defaultMaterial = new PhongMaterial();
const defaultProps = {
  stroked: true,
  filled: true,
  extruded: false,
  wireframe: false,
  lineWidthUnits: 'meters',
  lineWidthScale: 1,
  lineWidthMinPixels: 0,
  lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
  lineJointRounded: false,
  lineMiterLimit: 4,
  elevationScale: 1,
  pointRadiusScale: 1,
  pointRadiusMinPixels: 0,
  pointRadiusMaxPixels: Number.MAX_SAFE_INTEGER,
  lineDashJustified: false,
  getLineColor: {
    type: 'accessor',
    value: defaultLineColor
  },
  getFillColor: {
    type: 'accessor',
    value: defaultFillColor
  },
  getRadius: {
    type: 'accessor',
    value: 1
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

function getCoordinates(f) {
  return f.geometry.coordinates;
}

export default class GeoJsonLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      features: {}
    };
  }

  updateState(_ref) {
    let props = _ref.props,
        changeFlags = _ref.changeFlags;

    if (!changeFlags.dataChanged) {
      return;
    }

    const features = getGeojsonFeatures(props.data);
    const wrapFeature = this.getSubLayerRow.bind(this);

    if (Array.isArray(changeFlags.dataChanged)) {
      const oldFeatures = this.state.features;
      const newFeatures = {};
      const featuresDiff = {};

      for (const key in oldFeatures) {
        newFeatures[key] = oldFeatures[key].slice();
        featuresDiff[key] = [];
      }

      for (const dataRange of changeFlags.dataChanged) {
        const partialFeatures = separateGeojsonFeatures(features, wrapFeature, dataRange);

        for (const key in oldFeatures) {
          featuresDiff[key].push(replaceInRange({
            data: newFeatures[key],
            getIndex: f => f.__source.index,
            dataRange,
            replace: partialFeatures[key]
          }));
        }
      }

      this.setState({
        features: newFeatures,
        featuresDiff
      });
    } else {
      this.setState({
        features: separateGeojsonFeatures(features, wrapFeature),
        featuresDiff: {}
      });
    }
  }

  renderLayers() {
    const _this$state = this.state,
          features = _this$state.features,
          featuresDiff = _this$state.featuresDiff;
    const pointFeatures = features.pointFeatures,
          lineFeatures = features.lineFeatures,
          polygonFeatures = features.polygonFeatures,
          polygonOutlineFeatures = features.polygonOutlineFeatures;
    const _this$props = this.props,
          stroked = _this$props.stroked,
          filled = _this$props.filled,
          extruded = _this$props.extruded,
          wireframe = _this$props.wireframe,
          material = _this$props.material,
          transitions = _this$props.transitions;
    const _this$props2 = this.props,
          lineWidthUnits = _this$props2.lineWidthUnits,
          lineWidthScale = _this$props2.lineWidthScale,
          lineWidthMinPixels = _this$props2.lineWidthMinPixels,
          lineWidthMaxPixels = _this$props2.lineWidthMaxPixels,
          lineJointRounded = _this$props2.lineJointRounded,
          lineMiterLimit = _this$props2.lineMiterLimit,
          pointRadiusScale = _this$props2.pointRadiusScale,
          pointRadiusMinPixels = _this$props2.pointRadiusMinPixels,
          pointRadiusMaxPixels = _this$props2.pointRadiusMaxPixels,
          elevationScale = _this$props2.elevationScale,
          lineDashJustified = _this$props2.lineDashJustified;
    const _this$props3 = this.props,
          getLineColor = _this$props3.getLineColor,
          getFillColor = _this$props3.getFillColor,
          getRadius = _this$props3.getRadius,
          getLineWidth = _this$props3.getLineWidth,
          getLineDashArray = _this$props3.getLineDashArray,
          getElevation = _this$props3.getElevation,
          updateTriggers = _this$props3.updateTriggers;
    const PolygonFillLayer = this.getSubLayerClass('polygons-fill', SolidPolygonLayer);
    const PolygonStrokeLayer = this.getSubLayerClass('polygons-stroke', PathLayer);
    const LineStringsLayer = this.getSubLayerClass('line-strings', PathLayer);
    const PointsLayer = this.getSubLayerClass('points', ScatterplotLayer);
    const polygonFillLayer = this.shouldRenderSubLayer('polygons-fill', polygonFeatures) && new PolygonFillLayer({
      _dataDiff: featuresDiff.polygonFeatures && (() => featuresDiff.polygonFeatures),
      extruded,
      elevationScale,
      filled,
      wireframe,
      material,
      getElevation: this.getSubLayerAccessor(getElevation),
      getFillColor: this.getSubLayerAccessor(getFillColor),
      getLineColor: this.getSubLayerAccessor(getLineColor),
      transitions: transitions && {
        getPolygon: transitions.geometry,
        getElevation: transitions.getElevation,
        getFillColor: transitions.getFillColor,
        getLineColor: transitions.getLineColor
      }
    }, this.getSubLayerProps({
      id: 'polygons-fill',
      updateTriggers: {
        getElevation: updateTriggers.getElevation,
        getFillColor: updateTriggers.getFillColor,
        getLineColor: updateTriggers.getLineColor
      }
    }), {
      data: polygonFeatures,
      getPolygon: getCoordinates
    });
    const polygonLineLayer = !extruded && stroked && this.shouldRenderSubLayer('polygons-stroke', polygonOutlineFeatures) && new PolygonStrokeLayer({
      _dataDiff: featuresDiff.polygonOutlineFeatures && (() => featuresDiff.polygonOutlineFeatures),
      widthUnits: lineWidthUnits,
      widthScale: lineWidthScale,
      widthMinPixels: lineWidthMinPixels,
      widthMaxPixels: lineWidthMaxPixels,
      rounded: lineJointRounded,
      miterLimit: lineMiterLimit,
      dashJustified: lineDashJustified,
      getColor: this.getSubLayerAccessor(getLineColor),
      getWidth: this.getSubLayerAccessor(getLineWidth),
      getDashArray: this.getSubLayerAccessor(getLineDashArray),
      transitions: transitions && {
        getPath: transitions.geometry,
        getColor: transitions.getLineColor,
        getWidth: transitions.getLineWidth
      }
    }, this.getSubLayerProps({
      id: 'polygons-stroke',
      updateTriggers: {
        getColor: updateTriggers.getLineColor,
        getWidth: updateTriggers.getLineWidth,
        getDashArray: updateTriggers.getLineDashArray
      }
    }), {
      data: polygonOutlineFeatures,
      getPath: getCoordinates
    });
    const pathLayer = this.shouldRenderSubLayer('linestrings', lineFeatures) && new LineStringsLayer({
      _dataDiff: featuresDiff.lineFeatures && (() => featuresDiff.lineFeatures),
      widthUnits: lineWidthUnits,
      widthScale: lineWidthScale,
      widthMinPixels: lineWidthMinPixels,
      widthMaxPixels: lineWidthMaxPixels,
      rounded: lineJointRounded,
      miterLimit: lineMiterLimit,
      dashJustified: lineDashJustified,
      getColor: this.getSubLayerAccessor(getLineColor),
      getWidth: this.getSubLayerAccessor(getLineWidth),
      getDashArray: this.getSubLayerAccessor(getLineDashArray),
      transitions: transitions && {
        getPath: transitions.geometry,
        getColor: transitions.getLineColor,
        getWidth: transitions.getLineWidth
      }
    }, this.getSubLayerProps({
      id: 'line-strings',
      updateTriggers: {
        getColor: updateTriggers.getLineColor,
        getWidth: updateTriggers.getLineWidth,
        getDashArray: updateTriggers.getLineDashArray
      }
    }), {
      data: lineFeatures,
      getPath: getCoordinates
    });
    const pointLayer = this.shouldRenderSubLayer('points', pointFeatures) && new PointsLayer({
      _dataDiff: featuresDiff.pointFeatures && (() => featuresDiff.pointFeatures),
      stroked,
      filled,
      radiusScale: pointRadiusScale,
      radiusMinPixels: pointRadiusMinPixels,
      radiusMaxPixels: pointRadiusMaxPixels,
      lineWidthUnits,
      lineWidthScale,
      lineWidthMinPixels,
      lineWidthMaxPixels,
      getFillColor: this.getSubLayerAccessor(getFillColor),
      getLineColor: this.getSubLayerAccessor(getLineColor),
      getRadius: this.getSubLayerAccessor(getRadius),
      getLineWidth: this.getSubLayerAccessor(getLineWidth),
      transitions: transitions && {
        getPosition: transitions.geometry,
        getFillColor: transitions.getFillColor,
        getLineColor: transitions.getLineColor,
        getRadius: transitions.getRadius,
        getLineWidth: transitions.getLineWidth
      }
    }, this.getSubLayerProps({
      id: 'points',
      updateTriggers: {
        getFillColor: updateTriggers.getFillColor,
        getLineColor: updateTriggers.getLineColor,
        getRadius: updateTriggers.getRadius,
        getLineWidth: updateTriggers.getLineWidth
      }
    }), {
      data: pointFeatures,
      getPosition: getCoordinates
    });
    return [!extruded && polygonFillLayer, polygonLineLayer, pathLayer, pointLayer, extruded && polygonFillLayer];
  }

}
GeoJsonLayer.layerName = 'GeoJsonLayer';
GeoJsonLayer.defaultProps = defaultProps;
//# sourceMappingURL=geojson-layer.js.map