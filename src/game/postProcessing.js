import * as THREE from "three";

import toonVertexShader from "../shaders/post/toonView.vert.glsl?raw";
import toonFragmentShader from "../shaders/post/toonView.frag.glsl?raw";
import scanVertexShader from "../shaders/post/scanView.vert.glsl?raw";
import scanFragmentShader from "../shaders/post/scanView.frag.glsl?raw";

export function createPostProcessing(renderer) {
  const size = new THREE.Vector2();
  renderer.getSize(size);

  const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
    depthBuffer: true,
    stencilBuffer: false
  });

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uScene: { value: renderTarget.texture },
    uResolution: { value: new THREE.Vector2(size.x, size.y) },
    uTime: { value: 0 }
  };

  const toonMaterial = new THREE.ShaderMaterial({
    vertexShader: toonVertexShader,
    fragmentShader: toonFragmentShader,
    uniforms
  });

  const scanMaterial = new THREE.ShaderMaterial({
    vertexShader: scanVertexShader,
    fragmentShader: scanFragmentShader,
    uniforms
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), toonMaterial);
  scene.add(quad);

  function render(mainScene, mainCamera, shaderMode) {
    if (shaderMode !== "toon" && shaderMode !== "xray") {
      renderer.setRenderTarget(null);
      renderer.render(mainScene, mainCamera);
      return;
    }

    uniforms.uTime.value = performance.now() * 0.001;

    renderer.setRenderTarget(renderTarget);
    renderer.render(mainScene, mainCamera);

    renderer.setRenderTarget(null);

    quad.material = shaderMode === "xray" ? scanMaterial : toonMaterial;
    renderer.render(scene, camera);
  }

  function resize(width, height) {
    renderTarget.setSize(width, height);
    uniforms.uResolution.value.set(width, height);
  }

  return {
    render,
    resize
  };
}