import * as THREE from "three";

export function createTileSelector(scene) {
  const selector = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.07, 0.92),
    new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      opacity: 0.48,
      transparent: true,
      depthWrite: false,
      depthTest: true
    })
  );


  selector.position.set(0, 0.145, 0);
  selector.visible = true;
  selector.renderOrder = 50;
  selector.userData.isSelector = true;

  scene.add(selector);

  return selector;
}