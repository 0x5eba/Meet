import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import { Layer, createIterable, fp64LowPart } from '@deck.gl/core';
import { Model, Geometry, Texture2D, PhongMaterial, isWebGL2 } from '@luma.gl/core';
import { MATRIX_ATTRIBUTES } from '../utils/matrix';
import vs1 from './simple-mesh-layer-vertex.glsl1';
import fs1 from './simple-mesh-layer-fragment.glsl1';
import vs3 from './simple-mesh-layer-vertex.glsl';
import fs3 from './simple-mesh-layer-fragment.glsl';

function assert(condition, message) {
  if (!condition) {
    throw new Error("deck.gl: ".concat(message));
  }
}

function getTextureFromData(gl, data, opts) {
  if (data instanceof Texture2D) {
    return data;
  }

  return new Texture2D(gl, Object.assign({
    data: data
  }, opts));
}

function validateGeometryAttributes(attributes) {
  assert(attributes.positions || attributes.POSITION, 'SimpleMeshLayer requires "postions" or "POSITION" attribute in mesh property.');
}

function getGeometry(data) {
  if (data.attributes) {
    validateGeometryAttributes(data.attributes);

    if (data instanceof Geometry) {
      return data;
    } else {
      return new Geometry(data);
    }
  } else if (data.positions || data.POSITION) {
    validateGeometryAttributes(data);
    return new Geometry({
      attributes: data
    });
  }

  throw Error('Invalid mesh');
}

var DEFAULT_COLOR = [0, 0, 0, 255];
var defaultMaterial = new PhongMaterial();
var defaultProps = {
  mesh: {
    value: null,
    type: 'object',
    async: true
  },
  texture: null,
  sizeScale: {
    type: 'number',
    value: 1,
    min: 0
  },
  parameters: {
    depthTest: true,
    depthFunc: 515
  },
  wireframe: false,
  material: defaultMaterial,
  getPosition: {
    type: 'accessor',
    value: function value(x) {
      return x.position;
    }
  },
  getColor: {
    type: 'accessor',
    value: DEFAULT_COLOR
  },
  getOrientation: {
    type: 'accessor',
    value: [0, 0, 0]
  },
  getScale: {
    type: 'accessor',
    value: [1, 1, 1]
  },
  getTranslation: {
    type: 'accessor',
    value: [0, 0, 0]
  },
  getTransformMatrix: {
    type: 'accessor',
    value: []
  }
};

var SimpleMeshLayer = function (_Layer) {
  _inherits(SimpleMeshLayer, _Layer);

  function SimpleMeshLayer() {
    _classCallCheck(this, SimpleMeshLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(SimpleMeshLayer).apply(this, arguments));
  }

  _createClass(SimpleMeshLayer, [{
    key: "getShaders",
    value: function getShaders() {
      var gl2 = isWebGL2(this.context.gl);
      var vs = gl2 ? vs3 : vs1;
      var fs = gl2 ? fs3 : fs1;
      return _get(_getPrototypeOf(SimpleMeshLayer.prototype), "getShaders", this).call(this, {
        vs: vs,
        fs: fs,
        modules: ['project32', 'phong-lighting', 'picking']
      });
    }
  }, {
    key: "initializeState",
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      attributeManager.addInstanced({
        instancePositions: {
          transition: true,
          size: 3,
          accessor: 'getPosition'
        },
        instancePositions64xy: {
          size: 2,
          accessor: 'getPosition',
          update: this.calculateInstancePositions64xyLow
        },
        instanceColors: {
          type: 5121,
          transition: true,
          size: this.props.colorFormat.length,
          normalized: true,
          accessor: 'getColor',
          defaultValue: [0, 0, 0, 255]
        },
        instanceModelMatrix: MATRIX_ATTRIBUTES
      });
      this.setState({
        emptyTexture: new Texture2D(this.context.gl, {
          data: new Uint8Array(4),
          width: 1,
          height: 1
        })
      });
    }
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      _get(_getPrototypeOf(SimpleMeshLayer.prototype), "updateState", this).call(this, {
        props: props,
        oldProps: oldProps,
        changeFlags: changeFlags
      });

      if (props.mesh !== oldProps.mesh || changeFlags.extensionsChanged) {
        if (this.state.model) {
          this.state.model.delete();
        }

        if (props.mesh) {
          this.setState({
            model: this.getModel(props.mesh)
          });
          var attributes = props.mesh.attributes || props.mesh;
          this.setState({
            hasNormals: Boolean(attributes.NORMAL || attributes.normals)
          });
        }

        this.getAttributeManager().invalidateAll();
      }

      if (props.texture !== oldProps.texture) {
        this.setTexture(props.texture);
      }

      if (this.state.model) {
        this.state.model.setDrawMode(this.props.wireframe ? 3 : 4);
      }
    }
  }, {
    key: "finalizeState",
    value: function finalizeState() {
      _get(_getPrototypeOf(SimpleMeshLayer.prototype), "finalizeState", this).call(this);

      this.state.emptyTexture.delete();

      if (this.state.texture) {
        this.state.texture.delete();
      }
    }
  }, {
    key: "draw",
    value: function draw(_ref2) {
      var uniforms = _ref2.uniforms;

      if (!this.state.model) {
        return;
      }

      var sizeScale = this.props.sizeScale;
      this.state.model.draw({
        uniforms: Object.assign({}, uniforms, {
          sizeScale: sizeScale,
          flatShade: !this.state.hasNormals
        })
      });
    }
  }, {
    key: "getModel",
    value: function getModel(mesh) {
      var model = new Model(this.context.gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: getGeometry(mesh),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      }));
      var _this$state = this.state,
          texture = _this$state.texture,
          emptyTexture = _this$state.emptyTexture;
      model.setUniforms({
        sampler: texture || emptyTexture,
        hasTexture: Boolean(texture)
      });
      return model;
    }
  }, {
    key: "setTexture",
    value: function setTexture(image) {
      var gl = this.context.gl;
      var _this$state2 = this.state,
          emptyTexture = _this$state2.emptyTexture,
          model = _this$state2.model;

      if (this.state.texture) {
        this.state.texture.delete();
      }

      var texture = image ? getTextureFromData(gl, image) : null;
      this.setState({
        texture: texture
      });

      if (model) {
        model.setUniforms({
          sampler: texture || emptyTexture,
          hasTexture: Boolean(texture)
        });
      }
    }
  }, {
    key: "calculateInstancePositions64xyLow",
    value: function calculateInstancePositions64xyLow(attribute, _ref3) {
      var startRow = _ref3.startRow,
          endRow = _ref3.endRow;
      var isFP64 = this.use64bitPositions();
      attribute.constant = !isFP64;

      if (!isFP64) {
        attribute.value = new Float32Array(2);
        return;
      }

      var _this$props = this.props,
          data = _this$props.data,
          getPosition = _this$props.getPosition;
      var value = attribute.value,
          size = attribute.size;
      var i = startRow * size;

      var _createIterable = createIterable(data, startRow, endRow),
          iterable = _createIterable.iterable,
          objectInfo = _createIterable.objectInfo;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = iterable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;
          objectInfo.index++;
          var position = getPosition(object, objectInfo);
          value[i++] = fp64LowPart(position[0]);
          value[i++] = fp64LowPart(position[1]);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }]);

  return SimpleMeshLayer;
}(Layer);

export { SimpleMeshLayer as default };
SimpleMeshLayer.layerName = 'SimpleMeshLayer';
SimpleMeshLayer.defaultProps = defaultProps;
//# sourceMappingURL=simple-mesh-layer.js.map