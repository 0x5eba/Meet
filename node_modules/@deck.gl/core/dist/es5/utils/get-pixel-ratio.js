"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getPixelRatio;

function getPixelRatio(useDevicePixels) {
  return useDevicePixels && typeof window !== 'undefined' ? window.devicePixelRatio : 1;
}
//# sourceMappingURL=get-pixel-ratio.js.map