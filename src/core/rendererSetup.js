import * as THREE from "three";

export function createGameRenderer(canvas) {
  const context = canvas.getContext("webgl2", {
    antialias: true,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: "high-performance"
  });

  if (!context) {
    showWebGL2Error();
    throw new Error("WebGL2 is not supported by this browser/device.");
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    antialias: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  renderer.outputColorSpace = THREE.SRGBColorSpace;

  console.log("Renderer initialized with WebGL2:", renderer.capabilities.isWebGL2);

  return renderer;
}

export function resizeGameRenderer(renderer) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function showWebGL2Error() {
  const errorBox = document.createElement("div");

  errorBox.style.position = "fixed";
  errorBox.style.inset = "0";
  errorBox.style.zIndex = "9999";
  errorBox.style.display = "flex";
  errorBox.style.alignItems = "center";
  errorBox.style.justifyContent = "center";
  errorBox.style.background = "#020617";
  errorBox.style.color = "#f8fafc";
  errorBox.style.fontFamily = "Arial, sans-serif";
  errorBox.style.fontSize = "18px";
  errorBox.style.textAlign = "center";
  errorBox.style.padding = "32px";

  errorBox.innerHTML = `
    <div>
      <h2 style="color:#38bdf8;margin-bottom:12px;">WebGL2 Required</h2>
      <p>
        This project requires WebGL2 to run.
        Please use a modern browser with WebGL2 support.
      </p>
    </div>
  `;

  document.body.appendChild(errorBox);
}