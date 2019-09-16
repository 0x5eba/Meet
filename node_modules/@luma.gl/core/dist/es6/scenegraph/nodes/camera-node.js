import ScenegraphNode from './scenegraph-node';
export default class CameraNode extends ScenegraphNode {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super(props);
    this.projectionMatrix = props.projectionMatrix;
  }

}
//# sourceMappingURL=camera-node.js.map