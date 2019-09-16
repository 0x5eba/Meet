export class TypedArrayManager {
  constructor() {
    let _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$overAlloc = _ref.overAlloc,
        overAlloc = _ref$overAlloc === void 0 ? 2 : _ref$overAlloc,
        _ref$poolSize = _ref.poolSize,
        poolSize = _ref$poolSize === void 0 ? 100 : _ref$poolSize;

    this.overAlloc = overAlloc;
    this.poolSize = poolSize;
    this._pool = [];
  }

  allocate(typedArray, count, _ref2) {
    let _ref2$size = _ref2.size,
        size = _ref2$size === void 0 ? 1 : _ref2$size,
        type = _ref2.type,
        _ref2$padding = _ref2.padding,
        padding = _ref2$padding === void 0 ? 0 : _ref2$padding,
        _ref2$copy = _ref2.copy,
        copy = _ref2$copy === void 0 ? false : _ref2$copy;
    const Type = type || typedArray && typedArray.constructor || Float32Array;
    const newSize = count * size + padding;

    if (ArrayBuffer.isView(typedArray)) {
      if (newSize <= typedArray.length) {
        return typedArray;
      }

      if (newSize * typedArray.BYTES_PER_ELEMENT <= typedArray.buffer.byteLength) {
        return new Type(typedArray.buffer, 0, newSize);
      }
    }

    const newArray = this._allocate(Type, newSize);

    if (typedArray && copy) {
      newArray.set(typedArray);
    } else {
      newArray.fill(0, 0, 4);
    }

    this._release(typedArray);

    return newArray;
  }

  release(typedArray) {
    this._release(typedArray);
  }

  _allocate(Type, size) {
    size = Math.max(Math.ceil(size * this.overAlloc), 1);
    const pool = this._pool;
    const byteLength = Type.BYTES_PER_ELEMENT * size;
    const i = pool.findIndex(b => b.byteLength >= byteLength);

    if (i >= 0) {
      return new Type(pool.splice(i, 1)[0], 0, size);
    }

    return new Type(size);
  }

  _release(typedArray) {
    if (!ArrayBuffer.isView(typedArray)) {
      return;
    }

    const pool = this._pool;
    const buffer = typedArray.buffer;
    const byteLength = buffer.byteLength;
    const i = pool.findIndex(b => b.byteLength >= byteLength);

    if (i < 0) {
      pool.push(buffer);
    } else if (i > 0 || pool.length < this.poolSize) {
      pool.splice(i, 0, buffer);
    }

    if (pool.length > this.poolSize) {
      pool.shift();
    }
  }

}
export default new TypedArrayManager();
//# sourceMappingURL=typed-array-manager.js.map