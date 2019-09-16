import { Framebuffer } from '@luma.gl/webgl';
export default class RenderState {
  constructor(gl) {
    let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.gl = gl;
    this.framebuffer1 = new Framebuffer(gl, {
      id: 'multi-pass-1',
      stencil: true
    });
    this.framebuffer2 = new Framebuffer(gl, {
      id: 'multi-pass-2',
      stencil: true
    });
    this.reset();
  }

  reset() {
    this.framebuffer1.resize();
    this.framebuffer2.resize();
    this.writeBuffer = this.framebuffer1;
    this.readBuffer = this.framebuffer2;
    this.maskActive = false;
  }

  _swapFramebuffers() {
    const tmp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = tmp;
  }

}
//# sourceMappingURL=render-state.js.map