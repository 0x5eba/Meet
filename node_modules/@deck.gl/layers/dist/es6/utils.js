export function replaceInRange(_ref) {
  let data = _ref.data,
      getIndex = _ref.getIndex,
      dataRange = _ref.dataRange,
      replace = _ref.replace;
  const _dataRange$startRow = dataRange.startRow,
        startRow = _dataRange$startRow === void 0 ? 0 : _dataRange$startRow,
        _dataRange$endRow = dataRange.endRow,
        endRow = _dataRange$endRow === void 0 ? Infinity : _dataRange$endRow;
  const count = data.length;
  let replaceStart = count;
  let replaceEnd = count;

  for (let i = 0; i < count; i++) {
    const row = getIndex(data[i]);

    if (replaceStart > i && row >= startRow) {
      replaceStart = i;
    }

    if (row >= endRow) {
      replaceEnd = i;
      break;
    }
  }

  let index = replaceStart;
  const dataLengthChanged = replaceEnd - replaceStart !== replace.length;
  const endChunk = dataLengthChanged && data.slice(replaceEnd);

  for (let i = 0; i < replace.length; i++) {
    data[index++] = replace[i];
  }

  if (dataLengthChanged) {
    for (let i = 0; i < endChunk.length; i++) {
      data[index++] = endChunk[i];
    }

    data.length = index;
  }

  return {
    startRow: replaceStart,
    endRow: replaceStart + replace.length
  };
}
//# sourceMappingURL=utils.js.map