import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import { Buffer } from '@luma.gl/core';
import assert from '../utils/assert';
import { createIterable } from '../utils/iterable-utils';
import { fillArray } from '../utils/flatten';
import * as range from '../utils/range';
import log from '../utils/log';
import BaseAttribute from './base-attribute';
import typedArrayManager from '../utils/typed-array-manager';
const DEFAULT_STATE = {
  isExternalBuffer: false,
  lastExternalBuffer: null,
  allocatedValue: null,
  needsUpdate: true,
  needsRedraw: false,
  updateRanges: range.FULL
};
export default class Attribute extends BaseAttribute {
  constructor(gl) {
    let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    super(gl, opts);
    const _opts$transition = opts.transition,
          transition = _opts$transition === void 0 ? false : _opts$transition,
          _opts$noAlloc = opts.noAlloc,
          noAlloc = _opts$noAlloc === void 0 ? false : _opts$noAlloc,
          _opts$update = opts.update,
          update = _opts$update === void 0 ? null : _opts$update,
          _opts$accessor = opts.accessor,
          accessor = _opts$accessor === void 0 ? null : _opts$accessor,
          _opts$bufferLayout = opts.bufferLayout,
          bufferLayout = _opts$bufferLayout === void 0 ? null : _opts$bufferLayout;
    let _opts$defaultValue = opts.defaultValue,
        defaultValue = _opts$defaultValue === void 0 ? [0, 0, 0, 0] : _opts$defaultValue;
    defaultValue = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    this.shaderAttributes = {};
    this.hasShaderAttributes = false;

    if (opts.shaderAttributes) {
      const shaderAttributes = opts.shaderAttributes;

      for (const shaderAttributeName in shaderAttributes) {
        const shaderAttribute = shaderAttributes[shaderAttributeName];
        this.shaderAttributes[shaderAttributeName] = new Attribute(this.gl, Object.assign({
          offset: this.offset,
          stride: this.stride,
          normalized: this.normalized
        }, shaderAttribute, {
          id: shaderAttributeName,
          constant: shaderAttribute.constant || false,
          isIndexed: shaderAttribute.isIndexed || shaderAttribute.elements,
          size: shaderAttribute.elements && 1 || shaderAttribute.size || this.size,
          value: shaderAttribute.value || null,
          divisor: shaderAttribute.instanced || shaderAttribute.divisor || this.divisor,
          buffer: this.getBuffer(),
          noAlloc: true
        }));
        this.hasShaderAttributes = true;
      }
    }

    Object.assign(this.userData, DEFAULT_STATE, opts, {
      transition,
      noAlloc,
      update: update || accessor && this._standardAccessor,
      accessor,
      defaultValue,
      bufferLayout
    });
    Object.seal(this.userData);

    this._validateAttributeUpdaters();
  }

  get bufferLayout() {
    return this.userData.bufferLayout;
  }

  set bufferLayout(layout) {
    this.userData.bufferLayout = layout;
  }

  delete() {
    super.delete();
    typedArrayManager.release(this.userData.allocatedValue);
  }

  needsUpdate() {
    return this.userData.needsUpdate;
  }

  needsRedraw() {
    let _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$clearChangedFlag = _ref.clearChangedFlags,
        clearChangedFlags = _ref$clearChangedFlag === void 0 ? false : _ref$clearChangedFlag;

    const needsRedraw = this.userData.needsRedraw;
    this.userData.needsRedraw = this.userData.needsRedraw && !clearChangedFlags;
    return needsRedraw;
  }

  getUpdateTriggers() {
    const accessor = this.userData.accessor;
    return [this.id].concat(typeof accessor !== 'function' && accessor || []);
  }

  getAccessor() {
    return this.userData.accessor;
  }

  getShaderAttributes() {
    const shaderAttributes = {};

    if (this.hasShaderAttributes) {
      Object.assign(shaderAttributes, this.shaderAttributes);
    } else {
      shaderAttributes[this.id] = this;
    }

    return shaderAttributes;
  }

  supportsTransition() {
    return this.userData.transition;
  }

  getTransitionSetting(opts) {
    const _this$userData = this.userData,
          transition = _this$userData.transition,
          accessor = _this$userData.accessor;

    if (!transition) {
      return null;
    }

    let settings = Array.isArray(accessor) ? opts[accessor.find(a => opts[a])] : opts[accessor];

    if (Number.isFinite(settings)) {
      settings = {
        duration: settings
      };
    }

    if (settings && settings.duration > 0) {
      return Object.assign({}, transition, settings);
    }

    return null;
  }

  setNeedsUpdate() {
    let reason = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.id;
    let dataRange = arguments.length > 1 ? arguments[1] : undefined;
    this.userData.needsUpdate = this.userData.needsUpdate || reason;

    if (dataRange) {
      const _dataRange$startRow = dataRange.startRow,
            startRow = _dataRange$startRow === void 0 ? 0 : _dataRange$startRow,
            _dataRange$endRow = dataRange.endRow,
            endRow = _dataRange$endRow === void 0 ? Infinity : _dataRange$endRow;
      this.userData.updateRanges = range.add(this.userData.updateRanges, [startRow, endRow]);
    } else {
      this.userData.updateRanges = range.FULL;
    }
  }

  clearNeedsUpdate() {
    this.userData.needsUpdate = false;
    this.userData.updateRanges = range.EMPTY;
  }

  setNeedsRedraw() {
    let reason = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.id;
    this.userData.needsRedraw = this.userData.needsRedraw || reason;
  }

  allocate(numInstances) {
    const state = this.userData;

    if (state.isExternalBuffer || state.noAlloc) {
      return false;
    }

    if (state.update) {
      assert(Number.isFinite(numInstances));
      const allocCount = Math.max(numInstances, 1);
      const ArrayType = glArrayFromType(this.type || 5126);
      const oldValue = state.allocatedValue;
      const shouldCopy = state.updateRanges !== range.FULL;
      this.constant = false;
      this.value = typedArrayManager.allocate(oldValue, allocCount, {
        size: this.size,
        type: ArrayType,
        padding: this.elementOffset,
        copy: shouldCopy
      });

      if (this.buffer && this.buffer.byteLength < this.value.byteLength) {
        this.buffer.reallocate(this.value.byteLength);

        if (shouldCopy && oldValue) {
          this.buffer.subData(oldValue);
        }
      }

      state.allocatedValue = this.value;
      return true;
    }

    return false;
  }

  updateBuffer(_ref2) {
    let numInstances = _ref2.numInstances,
        bufferLayout = _ref2.bufferLayout,
        data = _ref2.data,
        props = _ref2.props,
        context = _ref2.context;

    if (!this.needsUpdate()) {
      return false;
    }

    const state = this.userData;
    const update = state.update,
          updateRanges = state.updateRanges,
          noAlloc = state.noAlloc;
    let updated = true;

    if (update) {
      for (const _ref3 of updateRanges) {
        var _ref4 = _slicedToArray(_ref3, 2);

        const startRow = _ref4[0];
        const endRow = _ref4[1];
        update.call(context, this, {
          data,
          startRow,
          endRow,
          props,
          numInstances,
          bufferLayout
        });
      }

      if (this.constant || !this.buffer || this.buffer.byteLength < this.value.byteLength) {
        this.update({
          value: this.value,
          constant: this.constant
        });
      } else {
        for (const _ref5 of updateRanges) {
          var _ref6 = _slicedToArray(_ref5, 2);

          const startRow = _ref6[0];
          const endRow = _ref6[1];
          const startOffset = Number.isFinite(startRow) ? this._getVertexOffset(startRow, this.bufferLayout) : 0;
          const endOffset = Number.isFinite(endRow) ? this._getVertexOffset(endRow, this.bufferLayout) : noAlloc || !Number.isFinite(numInstances) ? this.value.length : numInstances * this.size;
          this.buffer.subData({
            data: this.value.subarray(startOffset, endOffset),
            offset: startOffset * this.value.BYTES_PER_ELEMENT
          });
        }
      }

      this._checkAttributeArray();
    } else {
      updated = false;
    }

    this._updateShaderAttributes();

    this.clearNeedsUpdate();
    state.needsRedraw = true;
    return updated;
  }

  update(props) {
    super.update(props);

    this._updateShaderAttributes();
  }

  setGenericValue(value) {
    const state = this.userData;

    if (value === undefined || typeof value === 'function') {
      state.isExternalBuffer = false;
      return false;
    }

    value = this._normalizeValue(value);
    const hasChanged = !this.constant || !this._areValuesEqual(value, this.value);

    if (hasChanged) {
      this.update({
        constant: true,
        value
      });
    }

    state.needsRedraw = state.needsUpdate || hasChanged;
    this.clearNeedsUpdate();
    state.isExternalBuffer = true;

    this._updateShaderAttributes();

    return true;
  }

  setExternalBuffer(buffer) {
    const state = this.userData;

    if (!buffer) {
      state.isExternalBuffer = false;
      state.lastExternalBuffer = null;
      return false;
    }

    this.clearNeedsUpdate();

    if (state.lastExternalBuffer === buffer) {
      return true;
    }

    state.isExternalBuffer = true;
    state.lastExternalBuffer = buffer;
    let opts;

    if (ArrayBuffer.isView(buffer)) {
      opts = {
        constant: false,
        value: buffer
      };
    } else if (buffer instanceof Buffer) {
      opts = {
        constant: false,
        buffer
      };
    } else {
      opts = Object.assign({
        constant: false
      }, buffer);
    }

    if (opts.value) {
      const ArrayType = glArrayFromType(this.type || 5126);

      if (!(opts.value instanceof ArrayType)) {
        log.warn(`Attribute prop ${this.id} is casted to ${ArrayType.name}`)();
        opts.value = new ArrayType(opts.value);
      }
    }

    this.update(opts);
    state.needsRedraw = true;

    this._updateShaderAttributes();

    return true;
  }

  _getVertexOffset(row, bufferLayout) {
    let offset = this.elementOffset;

    if (bufferLayout) {
      let index = 0;

      for (const geometrySize of bufferLayout) {
        if (index >= row) {
          break;
        }

        offset += geometrySize * this.size;
        index++;
      }

      return offset;
    }

    return offset + row * this.size;
  }

  _normalizeValue(value) {
    let out = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let start = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    const defaultValue = this.userData.defaultValue;

    if (!Array.isArray(value) && !ArrayBuffer.isView(value)) {
      out[start] = Number.isFinite(value) ? value : defaultValue[0];
      return out;
    }

    switch (this.size) {
      case 4:
        out[start + 3] = Number.isFinite(value[3]) ? value[3] : defaultValue[3];

      case 3:
        out[start + 2] = Number.isFinite(value[2]) ? value[2] : defaultValue[2];

      case 2:
        out[start + 1] = Number.isFinite(value[1]) ? value[1] : defaultValue[1];

      case 1:
        out[start + 0] = Number.isFinite(value[0]) ? value[0] : defaultValue[0];
    }

    return out;
  }

  _areValuesEqual(value1, value2) {
    let size = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.size;

    for (let i = 0; i < size; i++) {
      if (value1[i] !== value2[i]) {
        return false;
      }
    }

    return true;
  }

  _standardAccessor(attribute, _ref7) {
    let data = _ref7.data,
        startRow = _ref7.startRow,
        endRow = _ref7.endRow,
        props = _ref7.props,
        numInstances = _ref7.numInstances,
        bufferLayout = _ref7.bufferLayout;
    const state = attribute.userData;
    const accessor = state.accessor;
    const value = attribute.value,
          size = attribute.size;
    const accessorFunc = typeof accessor === 'function' ? accessor : props[accessor];
    assert(typeof accessorFunc === 'function', `accessor "${accessor}" is not a function`);

    let i = attribute._getVertexOffset(startRow, bufferLayout);

    const _createIterable = createIterable(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

    for (const object of iterable) {
      objectInfo.index++;
      const objectValue = accessorFunc(object, objectInfo);

      if (bufferLayout) {
        attribute._normalizeValue(objectValue, objectInfo.target);

        const numVertices = bufferLayout[objectInfo.index];
        fillArray({
          target: attribute.value,
          source: objectInfo.target,
          start: i,
          count: numVertices
        });
        i += numVertices * size;
      } else {
        attribute._normalizeValue(objectValue, value, i);

        i += size;
      }
    }

    attribute.constant = false;
    attribute.bufferLayout = bufferLayout;
  }

  _validateAttributeUpdaters() {
    const state = this.userData;
    const hasUpdater = state.noAlloc || typeof state.update === 'function';

    if (!hasUpdater) {
      throw new Error(`Attribute ${this.id} missing update or accessor`);
    }
  }

  _checkAttributeArray() {
    const value = this.value;

    if (value && value.length >= 4) {
      const valid = Number.isFinite(value[0]) && Number.isFinite(value[1]) && Number.isFinite(value[2]) && Number.isFinite(value[3]);

      if (!valid) {
        throw new Error(`Illegal attribute generated for ${this.id}`);
      }
    }
  }

  _updateShaderAttributes() {
    const shaderAttributes = this.shaderAttributes;

    for (const shaderAttributeName in shaderAttributes) {
      const shaderAttribute = shaderAttributes[shaderAttributeName];
      shaderAttribute.update({
        buffer: this.getBuffer(),
        value: this.value,
        constant: this.constant
      });
    }
  }

}
export function glArrayFromType(glType) {
  let _ref8 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref8$clamped = _ref8.clamped,
      clamped = _ref8$clamped === void 0 ? true : _ref8$clamped;

  switch (glType) {
    case 5126:
      return Float32Array;

    case 5123:
    case 33635:
    case 32819:
    case 32820:
      return Uint16Array;

    case 5125:
      return Uint32Array;

    case 5121:
      return clamped ? Uint8ClampedArray : Uint8Array;

    case 5120:
      return Int8Array;

    case 5122:
      return Int16Array;

    case 5124:
      return Int32Array;

    default:
      throw new Error('Failed to deduce type from array');
  }
}
//# sourceMappingURL=attribute.js.map