import { deepEqual } from '../utils/deep-equal';
export class LayerExtension {
  constructor() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.opts = opts;
  }

  equals(extension) {
    if (this === extension) {
      return true;
    }

    return this.constructor === extension.constructor && deepEqual(this.opts, extension.opts);
  }

  getShaders(extension) {
    return null;
  }

  getSubLayerProps(extension) {
    const _extension$constructo = extension.constructor.defaultProps,
          defaultProps = _extension$constructo === void 0 ? {} : _extension$constructo;
    const newProps = {
      updateTriggers: {}
    };

    for (const key in defaultProps) {
      if (key in this.props) {
        const propDef = defaultProps[key];
        const propValue = this.props[key];
        newProps[key] = propValue;

        if (propDef && propDef.type === 'accessor') {
          newProps.updateTriggers[key] = this.props.updateTriggers[key];

          if (typeof propValue === 'function') {
            newProps[key] = this.getSubLayerAccessor(propValue, true);
          }
        }
      }
    }

    return newProps;
  }

  initializeState(context, extension) {}

  updateState(params, extension) {}

  finalizeState(extension) {}

}
//# sourceMappingURL=layer-extension.js.map