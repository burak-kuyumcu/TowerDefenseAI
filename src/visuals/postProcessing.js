import * as THREE from "three";

import toonVertexShader from "../shaders/post/toonView.vert.glsl?raw";
import toonFragmentShader from "../shaders/post/toonView.frag.glsl?raw";

import scanVertexShader from "../shaders/post/scanView.vert.glsl?raw";
import scanFragmentShader from "../shaders/post/scanView.frag.glsl?raw";

import neonVertexShader from "../shaders/post/neonView.vert.glsl?raw";
import neonFragmentShader from "../shaders/post/neonView.frag.glsl?raw";

export function createPostProcessing(renderer) {
  const renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      depthBuffer: true,
      stencilBuffer: false
    }
  );

  renderTarget.texture.name = "MainSceneRenderTarget";

  const postScene = new THREE.Scene();

  const postCamera = new THREE.OrthographicCamera(
    -1,
    1,
    1,
    -1,
    0,
    1
  );

  const quadGeometry = new THREE.PlaneGeometry(2, 2);

  const materials = {
    toon: createPostMaterial(toonVertexShader, toonFragmentShader),
    xray: createPostMaterial(scanVertexShader, scanFragmentShader),
    scan: createPostMaterial(scanVertexShader, scanFragmentShader),
    neon: createPostMaterial(neonVertexShader, neonFragmentShader)
  };

  const quad = new THREE.Mesh(quadGeometry, materials.toon);
  postScene.add(quad);

  function render(scene, camera, shaderMode) {
    if (shaderMode === "standard") {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }

    const material = getMaterialForMode(materials, shaderMode);

    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);

    renderer.setRenderTarget(null);

    material.uniforms.uScene.value = renderTarget.texture;
    material.uniforms.uTime.value = performance.now() * 0.001;
    material.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight
    );

    quad.material = material;

    renderer.render(postScene, postCamera);
  }

  function resize(width, height) {
    renderTarget.setSize(width, height);

    for (const material of Object.values(materials)) {
      material.uniforms.uResolution.value.set(width, height);
    }
  }

  return {
    render,
    resize
  };
}

function createPostMaterial(vertexShader, fragmentShader) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uScene: {
        value: null
      },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight)
      },
      uTime: {
        value: 0
      }
    },
    vertexShader,
    fragmentShader,
    depthWrite: false,
    depthTest: false
  });
}

function getMaterialForMode(materials, shaderMode) {
  if (shaderMode === "toon") return materials.toon;
  if (shaderMode === "neon") return materials.neon;
  if (shaderMode === "xray") return materials.xray;
  if (shaderMode === "scan") return materials.scan;

  return materials.toon;
}