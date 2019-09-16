import _objectSpread from "@babel/runtime/helpers/esm/objectSpread";
import _asyncToGenerator from "@babel/runtime/helpers/esm/asyncToGenerator";
import { assert } from '@luma.gl/core';
import { GLTFLoader } from '@loaders.gl/gltf';
import createGLTFObjects from './create-gltf-objects';

function parse(_x, _x2, _x3, _x4) {
  return _parse.apply(this, arguments);
}

function _parse() {
  _parse = _asyncToGenerator(function* (data, options, uri, loader) {
    assert(options.gl);
    const gltf = yield GLTFLoader.parse(data, _objectSpread({}, options, {
      uri,
      decompress: true
    }));
    const gltfObjects = createGLTFObjects(options.gl, gltf, options);

    if (options.waitForFullLoad) {
      yield waitForGLTFAssets(gltfObjects);
    }

    return Object.assign({
      gltf
    }, gltfObjects);
  });
  return _parse.apply(this, arguments);
}

function waitForGLTFAssets(_x5) {
  return _waitForGLTFAssets.apply(this, arguments);
}

function _waitForGLTFAssets() {
  _waitForGLTFAssets = _asyncToGenerator(function* (gltfObjects) {
    const remaining = [];
    gltfObjects.scenes.forEach(scene => {
      scene.traverse(model => {
        Object.values(model.model.program.uniforms).forEach(uniform => {
          if (uniform.loaded === false) {
            remaining.push(uniform);
          }
        });
      });
    });
    return yield waitWhileCondition(() => remaining.some(uniform => !uniform.loaded));
  });
  return _waitForGLTFAssets.apply(this, arguments);
}

function waitWhileCondition(_x6) {
  return _waitWhileCondition.apply(this, arguments);
}

function _waitWhileCondition() {
  _waitWhileCondition = _asyncToGenerator(function* (condition) {
    while (condition()) {
      yield new Promise(resolve => window.requestAnimationFrame(resolve));
    }
  });
  return _waitWhileCondition.apply(this, arguments);
}

export default {
  name: 'GLTF Scenegraph Loader',
  extensions: ['gltf', 'glb'],
  parse
};
//# sourceMappingURL=gltf-scenegraph-loader.js.map