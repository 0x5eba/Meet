import { DirectionalLight as BaseDirectionalLight } from '@luma.gl/core';
export default class DirectionalLight extends BaseDirectionalLight {
  constructor(props) {
    super(props);

    const _props$_shadow = props._shadow,
          _shadow = _props$_shadow === void 0 ? false : _props$_shadow;

    this.shadow = _shadow;
  }

  getProjectedLight() {
    return this;
  }

}
//# sourceMappingURL=directional-light.js.map