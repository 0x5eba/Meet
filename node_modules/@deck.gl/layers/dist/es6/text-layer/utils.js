import { log } from '@deck.gl/core';
const MISSING_CHAR_WIDTH = 32;
export function nextPowOfTwo(number) {
  return Math.pow(2, Math.ceil(Math.log2(number)));
}
export function buildMapping(_ref) {
  let characterSet = _ref.characterSet,
      getFontWidth = _ref.getFontWidth,
      fontHeight = _ref.fontHeight,
      buffer = _ref.buffer,
      maxCanvasWidth = _ref.maxCanvasWidth,
      _ref$mapping = _ref.mapping,
      mapping = _ref$mapping === void 0 ? {} : _ref$mapping,
      _ref$xOffset = _ref.xOffset,
      xOffset = _ref$xOffset === void 0 ? 0 : _ref$xOffset,
      _ref$yOffset = _ref.yOffset,
      yOffset = _ref$yOffset === void 0 ? 0 : _ref$yOffset;
  let row = 0;
  let x = xOffset;
  Array.from(characterSet).forEach((char, i) => {
    if (!mapping[char]) {
      const width = getFontWidth(char, i);

      if (x + width + buffer * 2 > maxCanvasWidth) {
        x = 0;
        row++;
      }

      mapping[char] = {
        x: x + buffer,
        y: yOffset + row * (fontHeight + buffer * 2) + buffer,
        width,
        height: fontHeight,
        mask: true
      };
      x += width + buffer * 2;
    }
  });
  const rowHeight = fontHeight + buffer * 2;
  return {
    mapping,
    xOffset: x,
    yOffset: yOffset + row * rowHeight,
    canvasHeight: nextPowOfTwo(yOffset + (row + 1) * rowHeight)
  };
}
export function transformRow(row, iconMapping, lineHeight) {
  let offsetLeft = 0;
  let rowHeight = 0;
  let characters = Array.from(row);
  characters = characters.map((character, i) => {
    const datum = {
      text: character,
      offsetLeft
    };
    const frame = iconMapping[character];

    if (frame) {
      offsetLeft += frame.width;

      if (!rowHeight) {
        rowHeight = frame.height * lineHeight;
      }
    } else {
      log.warn(`Missing character: ${character}`)();
      offsetLeft += MISSING_CHAR_WIDTH;
    }

    return datum;
  });
  return {
    characters,
    rowWidth: offsetLeft,
    rowHeight
  };
}
export function transformParagraph(paragraph, lineHeight, iconMapping, transformCharacter, transformedData) {
  const rows = paragraph.split('\n');
  const size = [0, 0];
  let offsetTop = 0;
  rows.forEach(row => {
    const _transformRow = transformRow(row, iconMapping, lineHeight),
          characters = _transformRow.characters,
          rowWidth = _transformRow.rowWidth,
          rowHeight = _transformRow.rowHeight;

    const rowSize = [rowWidth, rowHeight];
    characters.forEach(datum => {
      datum.offsetTop = offsetTop;
      datum.size = size;
      datum.rowSize = rowSize;
      transformedData.push(transformCharacter(datum));
    });
    offsetTop = offsetTop + rowHeight;
    size[0] = Math.max(size[0], rowWidth);
  });
  size[1] = offsetTop;
}
//# sourceMappingURL=utils.js.map