import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime/helpers/esm/get";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";

var _DEFAULT_TEXTURE_PARA;

import { Layer, fp64LowPart } from '@deck.gl/core';
import { Model, Geometry, Texture2D } from '@luma.gl/core';
import vs from './bitmap-layer-vertex';
import fs from './bitmap-layer-fragment';
var DEFAULT_TEXTURE_PARAMETERS = (_DEFAULT_TEXTURE_PARA = {}, _defineProperty(_DEFAULT_TEXTURE_PARA, 10241, 9987), _defineProperty(_DEFAULT_TEXTURE_PARA, 10240, 9729), _defineProperty(_DEFAULT_TEXTURE_PARA, 10242, 33071), _defineProperty(_DEFAULT_TEXTURE_PARA, 10243, 33071), _DEFAULT_TEXTURE_PARA);
var defaultProps = {
  image: {
    type: 'object',
    value: null,
    async: true
  },
  bounds: {
    type: 'array',
    value: [1, 0, 0, 1],
    compare: true
  },
  desaturate: {
    type: 'number',
    min: 0,
    max: 1,
    value: 0
  },
  transparentColor: {
    type: 'color',
    value: [0, 0, 0, 0]
  },
  tintColor: {
    type: 'color',
    value: [255, 255, 255]
  }
};

var BitmapLayer = function (_Layer) {
  _inherits(BitmapLayer, _Layer);

  function BitmapLayer() {
    _classCallCheck(this, BitmapLayer);

    return _possibleConstructorReturn(this, _getPrototypeOf(BitmapLayer).apply(this, arguments));
  }

  _createClass(BitmapLayer, [{
    key: "getShaders",
    value: function getShaders() {
      return _get(_getPrototypeOf(BitmapLayer.prototype), "getShaders", this).call(this, {
        vs: vs,
        fs: fs,
        modules: ['project32', 'picking']
      });
    }
  }, {
    key: "initializeState",
    value: function initializeState() {
      var attributeManager = this.getAttributeManager();
      attributeManager.add({
        positions: {
          size: 3,
          update: this.calculatePositions,
          value: new Float32Array(12),
          noAlloc: true
        },
        positions64xyLow: {
          size: 3,
          update: this.calculatePositions64xyLow,
          value: new Float32Array(12),
          noAlloc: true
        }
      });
      this.setState({
        numInstances: 1
      });
    }
  }, {
    key: "updateState",
    value: function updateState(_ref) {
      var props = _ref.props,
          oldProps = _ref.oldProps,
          changeFlags = _ref.changeFlags;

      if (changeFlags.extensionsChanged) {
        var gl = this.context.gl;

        if (this.state.model) {
          this.state.model.delete();
        }

        this.setState({
          model: this._getModel(gl)
        });
        this.getAttributeManager().invalidateAll();
      }

      if (props.image !== oldProps.image) {
        this.loadTexture(props.image);
      }

      var attributeManager = this.getAttributeManager();

      if (props.bounds !== oldProps.bounds) {
        this.setState({
          positions: this._getPositionsFromBounds(props.bounds)
        });
        attributeManager.invalidate('positions');
        attributeManager.invalidate('positions64xyLow');
      }
    }
  }, {
    key: "finalizeState",
    value: function finalizeState() {
      _get(_getPrototypeOf(BitmapLayer.prototype), "finalizeState", this).call(this);

      if (this.state.bitmapTexture) {
        this.state.bitmapTexture.delete();
      }
    }
  }, {
    key: "_getPositionsFromBounds",
    value: function _getPositionsFromBounds(bounds) {
      var positions = new Array(12);

      if (Number.isFinite(bounds[0])) {
        positions[0] = bounds[0];
        positions[1] = bounds[1];
        positions[2] = 0;
        positions[3] = bounds[0];
        positions[4] = bounds[3];
        positions[5] = 0;
        positions[6] = bounds[2];
        positions[7] = bounds[3];
        positions[8] = 0;
        positions[9] = bounds[2];
        positions[10] = bounds[1];
        positions[11] = 0;
      } else {
        for (var i = 0; i < bounds.length; i++) {
          positions[i * 3 + 0] = bounds[i][0];
          positions[i * 3 + 1] = bounds[i][1];
          positions[i * 3 + 2] = bounds[i][2] || 0;
        }
      }

      return positions;
    }
  }, {
    key: "_getModel",
    value: function _getModel(gl) {
      if (!gl) {
        return null;
      }

      return new Model(gl, Object.assign({}, this.getShaders(), {
        id: this.props.id,
        shaderCache: this.context.shaderCache,
        geometry: new Geometry({
          drawMode: 6,
          vertexCount: 4,
          attributes: {
            texCoords: new Float32Array([0, 0, 0, 1, 1, 1, 1, 0])
          }
        }),
        isInstanced: false
      }));
    }
  }, {
    key: "draw",
    value: function draw(opts) {
      var uniforms = opts.uniforms;
      var _this$state = this.state,
          bitmapTexture = _this$state.bitmapTexture,
          model = _this$state.model;
      var _this$props = this.props,
          image = _this$props.image,
          desaturate = _this$props.desaturate,
          transparentColor = _this$props.transparentColor,
          tintColor = _this$props.tintColor;

      if (bitmapTexture && image instanceof HTMLVideoElement && image.readyState > HTMLVideoElement.HAVE_METADATA) {
        var sizeChanged = bitmapTexture.width !== image.videoWidth || bitmapTexture.height !== image.videoHeight;

        if (sizeChanged) {
          bitmapTexture.resize({
            width: image.videoWidth,
            height: image.videoHeight,
            mipmaps: true
          });
          bitmapTexture.setSubImageData({
            data: image,
            paramters: DEFAULT_TEXTURE_PARAMETERS
          });
        } else {
          bitmapTexture.setSubImageData({
            data: image
          });
        }

        bitmapTexture.generateMipmap();
      }

      if (bitmapTexture && model) {
        model.setUniforms(Object.assign({}, uniforms, {
          bitmapTexture: bitmapTexture,
          desaturate: desaturate,
          transparentColor: transparentColor.map(function (x) {
            return x / 255;
          }),
          tintColor: tintColor.slice(0, 3).map(function (x) {
            return x / 255;
          })
        })).draw();
      }
    }
  }, {
    key: "loadTexture",
    value: function loadTexture(image) {
      var gl = this.context.gl;

      if (this.state.bitmapTexture) {
        this.state.bitmapTexture.delete();
      }

      if (image instanceof Texture2D) {
        this.setState({
          bitmapTexture: image
        });
      } else if (image instanceof HTMLVideoElement) {
        this.setState({
          bitmapTexture: new Texture2D(gl, {
            width: 1,
            height: 1,
            parameters: DEFAULT_TEXTURE_PARAMETERS,
            mipmaps: false
          })
        });
      } else if (image) {
        this.setState({
          bitmapTexture: new Texture2D(gl, {
            data: image,
            parameters: DEFAULT_TEXTURE_PARAMETERS
          })
        });
      }
    }
  }, {
    key: "calculatePositions",
    value: function calculatePositions(_ref2) {
      var value = _ref2.value;
      var positions = this.state.positions;
      value.set(positions);
    }
  }, {
    key: "calculatePositions64xyLow",
    value: function calculatePositions64xyLow(attribute) {
      var isFP64 = this.use64bitPositions();
      attribute.constant = !isFP64;

      if (!isFP64) {
        attribute.value = new Float32Array(4);
        return;
      }

      var value = attribute.value;
      value.set(this.state.positions.map(fp64LowPart));
    }
  }]);

  return BitmapLayer;
}(Layer);

export { BitmapLayer as default };
BitmapLayer.layerName = 'BitmapLayer';
BitmapLayer.defaultProps = defaultProps;
//# sourceMappingURL=bitmap-layer.js.map