export default function getPixelRatio(useDevicePixels) {
  return useDevicePixels && typeof window !== 'undefined' ? window.devicePixelRatio : 1;
}
//# sourceMappingURL=get-pixel-ratio.js.map