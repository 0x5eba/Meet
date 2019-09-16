import { createIterable } from './iterable-utils';
import defaultTypedArrayManager from './typed-array-manager';
export default class Tesselator {
  constructor() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _opts$attributes = opts.attributes,
          attributes = _opts$attributes === void 0 ? {} : _opts$attributes;
    this.typedArrayManager = defaultTypedArrayManager;
    this.indexLayout = null;
    this.bufferLayout = null;
    this.vertexCount = 0;
    this.instanceCount = 0;
    this.attributes = {};
    this._attributeDefs = attributes;
    this.updateGeometry(opts);
    Object.seal(this);
  }

  updateGeometry(_ref) {
    let data = _ref.data,
        getGeometry = _ref.getGeometry,
        positionFormat = _ref.positionFormat,
        fp64 = _ref.fp64,
        dataChanged = _ref.dataChanged;
    this.data = data;
    this.getGeometry = getGeometry;
    this.fp64 = fp64;
    this.positionSize = positionFormat === 'XY' ? 2 : 3;

    if (Array.isArray(dataChanged)) {
      for (const dataRange of dataChanged) {
        this._rebuildGeometry(dataRange);
      }
    } else {
      this._rebuildGeometry();
    }
  }

  updatePartialGeometry(_ref2) {
    let startRow = _ref2.startRow,
        endRow = _ref2.endRow;

    this._rebuildGeometry({
      startRow,
      endRow
    });
  }

  updateGeometryAttributes(geometry, startIndex, size) {
    throw new Error('Not implemented');
  }

  getGeometrySize(geometry) {
    throw new Error('Not implemented');
  }

  _forEachGeometry(visitor, startRow, endRow) {
    const data = this.data,
          getGeometry = this.getGeometry;

    const _createIterable = createIterable(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

    for (const object of iterable) {
      objectInfo.index++;
      const geometry = getGeometry(object, objectInfo);
      visitor(geometry, objectInfo.index);
    }
  }

  _rebuildGeometry(dataRange) {
    if (!this.data || !this.getGeometry) {
      return;
    }

    let indexLayout = this.indexLayout,
        bufferLayout = this.bufferLayout;

    if (!dataRange) {
      indexLayout = [];
      bufferLayout = [];
    }

    const _ref3 = dataRange || {},
          _ref3$startRow = _ref3.startRow,
          startRow = _ref3$startRow === void 0 ? 0 : _ref3$startRow,
          _ref3$endRow = _ref3.endRow,
          endRow = _ref3$endRow === void 0 ? Infinity : _ref3$endRow;

    this._forEachGeometry((geometry, dataIndex) => {
      bufferLayout[dataIndex] = this.getGeometrySize(geometry);
    }, startRow, endRow);

    let instanceCount = 0;

    for (const count of bufferLayout) {
      instanceCount += count;
    }

    const attributes = this.attributes,
          _attributeDefs = this._attributeDefs,
          typedArrayManager = this.typedArrayManager,
          fp64 = this.fp64;

    for (const name in _attributeDefs) {
      const def = _attributeDefs[name];
      def.copy = Boolean(dataRange);

      if (!def.fp64Only || fp64) {
        attributes[name] = typedArrayManager.allocate(attributes[name], instanceCount, def);
      }
    }

    this.indexLayout = indexLayout;
    this.bufferLayout = bufferLayout;
    this.instanceCount = instanceCount;
    const context = {
      vertexStart: 0,
      indexStart: 0
    };

    for (let i = 0; i < startRow; i++) {
      context.vertexStart += bufferLayout[i];
      context.indexStart += indexLayout[i] || 0;
    }

    this._forEachGeometry((geometry, dataIndex) => {
      const geometrySize = bufferLayout[dataIndex];
      context.geometryIndex = dataIndex;
      context.geometrySize = geometrySize;
      this.updateGeometryAttributes(geometry, context);
      context.vertexStart += geometrySize;
      context.indexStart += indexLayout[dataIndex] || 0;
    }, startRow, endRow);

    let vertexCount = context.indexStart;

    for (let i = endRow; i < indexLayout.length; i++) {
      vertexCount += indexLayout[i];
    }

    this.vertexCount = vertexCount;
  }

}
//# sourceMappingURL=tesselator.js.map