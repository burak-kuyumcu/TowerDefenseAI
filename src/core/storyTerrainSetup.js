import * as THREE from "three";

import {
  getCurrentStage,
  getCurrentStageEffect
} from "../game/stages.js";

const STORY_GROUP_NAME = "StoryTerrainDecorations";

let randomSeed = 1;

export function addStoryTerrainDecorations(scene) {
  clearStoryTerrainDecorations(scene);

  const stage = getCurrentStage();
  const effect = getCurrentStageEffect();
  const effectId = effect?.id ?? "forest_balance";

  randomSeed = createSeed(effectId);

  const group = new THREE.Group();
  group.name = STORY_GROUP_NAME;
  group.userData.isStageDecoration = true;
  group.userData.isStoryTerrain = true;

  addLowerMapFoundation(group, effectId);
  addOuterCliffFrame(group, effectId);
  addDistantMountains(group, effectId);
  addBackgroundStoryLayer(group, effectId);
  addEnvironmentDetailLayer(group, effectId);
  addStageSpecificLandmarks(group, effectId, stage?.name ?? "Unknown Sector");
  addPortalGroundScars(group, effectId);

  scene.add(group);
}

export function clearStoryTerrainDecorations(scene) {
  const oldGroup = scene.getObjectByName(STORY_GROUP_NAME);

  if (!oldGroup) return;

  disposeObject(oldGroup);
  scene.remove(oldGroup);
}

function addLowerMapFoundation(group, effectId) {
  const colors = getStageColors(effectId);

  const foundationMaterial = new THREE.MeshStandardMaterial({
    color: colors.foundation,
    roughness: 0.96,
    metalness: 0.02
  });

  const underPlate = createBox({
    width: 27.2,
    height: 0.48,
    depth: 23.2,
    material: foundationMaterial,
    position: [0, -0.36, 0],
    receiveShadow: true
  });
  group.add(underPlate);

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: colors.rim,
    roughness: 0.9,
    metalness: 0.03
  });

  const rimPieces = [
    [0, 0.03, -10.42, 27.6, 0.22, 0.36],
    [0, 0.03, 10.42, 27.6, 0.22, 0.36],
    [-12.42, 0.03, 0, 0.36, 0.22, 21.2],
    [12.42, 0.03, 0, 0.36, 0.22, 21.2]
  ];

  for (const [x, y, z, width, height, depth] of rimPieces) {
    group.add(
      createBox({
        width,
        height,
        depth,
        material: rimMaterial,
        position: [x, y, z],
        castShadow: true,
        receiveShadow: true
      })
    );
  }
}

function addOuterCliffFrame(group, effectId) {
  const colors = getStageColors(effectId);

  const cliffMaterial = new THREE.MeshStandardMaterial({
    color: colors.cliff,
    roughness: 0.96,
    metalness: 0.02
  });

  const cliffData = [
    [0, -0.2, -11.6, 28.5, 1.35, 1.25, "x"],
    [0, -0.34, 11.6, 28.5, 1.0, 1.15, "x"],
    [-13.25, -0.28, 0, 1.15, 1.15, 23.4, "z"],
    [13.25, -0.28, 0, 1.15, 1.15, 23.4, "z"]
  ];

  for (const [x, y, z, width, height, depth, axis] of cliffData) {
    const cliff = createCliffWall({
      width,
      height,
      depth,
      material: cliffMaterial,
      ridgeAxis: axis
    });

    cliff.position.set(x, y, z);
    group.add(cliff);
  }
}

function createCliffWall({ width, height, depth, material, ridgeAxis }) {
  const wall = new THREE.Group();
  wall.userData.isStageDecoration = true;

  const base = createBox({
    width,
    height,
    depth,
    material,
    position: [0, height / 2, 0],
    castShadow: true,
    receiveShadow: true
  });
  wall.add(base);

  const ridgeCount = ridgeAxis === "x" ? 18 : 14;

  for (let i = 0; i < ridgeCount; i++) {
    const rockHeight = rand(0.45, 1.25);
    const rock = createRockSpire({
      height: rockHeight,
      radius: rand(0.16, 0.36),
      color: material.color.getHex()
    });

    if (ridgeAxis === "x") {
      rock.position.x = -width / 2 + rand(0.5, width - 0.5);
      rock.position.z = rand(-depth * 0.22, depth * 0.22);
    } else {
      rock.position.x = rand(-width * 0.22, width * 0.22);
      rock.position.z = -depth / 2 + rand(0.5, depth - 0.5);
    }

    rock.position.y = height + rockHeight / 2 - 0.05;
    rock.rotation.y = rand(0, Math.PI * 2);
    rock.scale.x *= rand(0.75, 1.35);
    rock.scale.z *= rand(0.75, 1.35);

    wall.add(rock);
  }

  return wall;
}

function addDistantMountains(group, effectId) {
  const colors = getStageColors(effectId);

  const mountainMaterial = new THREE.MeshStandardMaterial({
    color: colors.mountain,
    roughness: 1,
    metalness: 0.02
  });

  const snowMaterial = new THREE.MeshStandardMaterial({
    color: colors.snow,
    roughness: 0.9,
    metalness: 0.02
  });

  const positions = [
    [-10.5, -15.0, 1.9],
    [-6.4, -15.5, 2.5],
    [-1.6, -15.2, 2.8],
    [3.5, -15.6, 2.4],
    [8.6, -15.0, 2.0],
    [15.3, -7.8, 1.7],
    [15.8, -3.5, 2.0],
    [15.5, 1.6, 2.2],
    [15.2, 6.8, 1.8],
    [-15.2, -6.8, 1.7],
    [-15.5, -1.4, 2.0],
    [-15.1, 4.5, 1.8]
  ];

  for (const [x, z, height] of positions) {
    const mountain = createLowPolyMountain({
      height,
      material: mountainMaterial,
      snowMaterial,
      snowCap: effectId === "frozen_chill"
    });

    mountain.position.set(x, -0.34, z);
    mountain.rotation.y = rand(0, Math.PI * 2);
    mountain.scale.x *= rand(0.75, 1.25);
    mountain.scale.z *= rand(0.7, 1.2);

    group.add(mountain);
  }
}

function addBackgroundStoryLayer(group, effectId) {
  const colors = getStageColors(effectId);

  addFarDefenseWall(group, colors);
  addFarServicePlatforms(group, colors);
  addFarWatchTowers(group, colors);
  addBackgroundCableLines(group, colors);
  addBrokenSectorPieces(group, colors);
  addStageBackstoryProps(group, effectId, colors);
}

function addEnvironmentDetailLayer(group, effectId) {
  const colors = getStageColors(effectId);

  addPerimeterServiceRoads(group, colors);
  addOuterDrainageChannels(group, colors);
  addCornerOutposts(group, colors);
  addSmallSignalPosts(group, colors);
  addOuterSupplyCrates(group, colors);
  addSideRetainingBars(group, colors);
  addPerimeterFlags(group, colors);
  addDistantBeaconBlocks(group, colors);
  addLayeredOuterTreeLine(group, colors);
  addRunwayEdgePanels(group, colors);
  addMicroDebrisField(group, colors);
  addStageMoodAccents(group, effectId, colors);
}

function addFarDefenseWall(group, colors) {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: colors.backWall,
    roughness: 0.94,
    metalness: 0.04
  });

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: colors.rim,
    roughness: 0.86,
    metalness: 0.08
  });

  group.add(
    createBox({
      width: 28.8,
      height: 1.05,
      depth: 0.38,
      material: wallMaterial,
      position: [0, 0.34, -13.08],
      castShadow: true,
      receiveShadow: true
    })
  );

  group.add(
    createBox({
      width: 29.2,
      height: 0.14,
      depth: 0.2,
      material: trimMaterial,
      position: [0, 0.94, -12.82],
      castShadow: true,
      receiveShadow: true
    })
  );

  group.add(
    createBox({
      width: 29.2,
      height: 0.12,
      depth: 0.22,
      material: trimMaterial,
      position: [0, -0.12, -12.82],
      castShadow: true,
      receiveShadow: true
    })
  );

  for (const x of [-12, -8, -4, 0, 4, 8, 12]) {
    group.add(
      createBox({
        width: 0.32,
        height: 1.36,
        depth: 0.55,
        material: trimMaterial,
        position: [x, 0.42, -12.74],
        castShadow: true,
        receiveShadow: true
      })
    );
  }
}

function addFarServicePlatforms(group, colors) {
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: colors.platform,
    roughness: 0.9,
    metalness: 0.08
  });

  const railMaterial = new THREE.MeshStandardMaterial({
    color: colors.rim,
    roughness: 0.88,
    metalness: 0.06
  });

  const platforms = [
    [-9.2, -12.35, 2.2],
    [-3.0, -12.48, 1.7],
    [4.2, -12.38, 2.0],
    [9.6, -12.46, 1.6]
  ];

  for (const [x, z, width] of platforms) {
    const platform = new THREE.Group();
    platform.userData.isStageDecoration = true;

    platform.add(
      createBox({
        width,
        height: 0.16,
        depth: 0.72,
        material: platformMaterial,
        position: [0, 0.18, 0],
        castShadow: true,
        receiveShadow: true
      })
    );

    platform.add(
      createBox({
        width: width * 0.92,
        height: 0.08,
        depth: 0.08,
        material: railMaterial,
        position: [0, 0.42, -0.31],
        castShadow: true
      })
    );

    platform.add(
      createBox({
        width: width * 0.92,
        height: 0.08,
        depth: 0.08,
        material: railMaterial,
        position: [0, 0.42, 0.31],
        castShadow: true
      })
    );

    platform.add(
      createBox({
        width: 0.08,
        height: 0.5,
        depth: 0.08,
        material: railMaterial,
        position: [-width * 0.38, -0.12, -0.25],
        castShadow: true
      })
    );

    platform.add(
      createBox({
        width: 0.08,
        height: 0.5,
        depth: 0.08,
        material: railMaterial,
        position: [width * 0.38, -0.12, 0.25],
        castShadow: true
      })
    );

    platform.position.set(x, 0.08, z);
    platform.rotation.y = rand(-0.08, 0.08);
    group.add(platform);
  }
}

function addFarWatchTowers(group, colors) {
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: colors.towerMetal,
    roughness: 0.78,
    metalness: 0.18
  });

  const lightMaterial = new THREE.MeshBasicMaterial({
    color: colors.signal,
    transparent: true,
    opacity: 0.55
  });

  const positions = [
    [-12.6, -12.55, 1.35],
    [-6.2, -12.72, 1.1],
    [6.4, -12.65, 1.2],
    [12.2, -12.58, 1.45]
  ];

  for (const [x, z, height] of positions) {
    const tower = new THREE.Group();
    tower.userData.isStageDecoration = true;

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, height, 6),
      metalMaterial
    );
    mast.position.y = height / 2;
    mast.castShadow = true;
    tower.add(mast);

    tower.add(
      createBox({
        width: 0.46,
        height: 0.26,
        depth: 0.36,
        material: metalMaterial,
        position: [0, height + 0.08, 0],
        castShadow: true,
        receiveShadow: true
      })
    );

    tower.add(
      createBox({
        width: 0.26,
        height: 0.055,
        depth: 0.055,
        material: lightMaterial,
        position: [0, height + 0.26, -0.2]
      })
    );

    const sideArm = createBox({
      width: 0.62,
      height: 0.055,
      depth: 0.055,
      material: metalMaterial,
      position: [0.18, height * 0.75, 0],
      castShadow: true
    });
    sideArm.rotation.z = rand(-0.2, 0.2);
    tower.add(sideArm);

    tower.position.set(x, 0.02, z);
    tower.rotation.y = rand(-0.25, 0.25);
    group.add(tower);
  }
}

function addBackgroundCableLines(group, colors) {
  const cableMaterial = new THREE.MeshStandardMaterial({
    color: colors.cable,
    roughness: 0.8,
    metalness: 0.18
  });

  const cables = [
    [-9.2, -12.08, -2.6, -12.15, 0.04],
    [-2.2, -12.14, 4.4, -12.06, -0.03],
    [5.2, -12.12, 11.8, -12.18, 0.06],
    [-13.1, -8.2, -13.0, -2.2, 0.02],
    [13.1, -7.8, 13.0, -1.2, -0.03]
  ];

  for (const [x1, z1, x2, z2, tilt] of cables) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);

    const cable = createBox({
      width: length,
      height: 0.035,
      depth: 0.035,
      material: cableMaterial,
      position: [(x1 + x2) / 2, 1.04 + tilt, (z1 + z2) / 2],
      castShadow: true
    });

    cable.rotation.y = -Math.atan2(dz, dx);
    group.add(cable);
  }
}

function addBrokenSectorPieces(group, colors) {
  const debrisMaterial = new THREE.MeshStandardMaterial({
    color: colors.debris,
    roughness: 0.95,
    metalness: 0.03
  });

  const pieces = [
    [-10.8, -11.2, 0.9, 0.18],
    [-7.1, -11.55, 0.55, -0.26],
    [-1.2, -11.35, 0.78, 0.34],
    [2.6, -11.65, 0.5, -0.16],
    [7.7, -11.25, 0.72, 0.22],
    [11.0, -11.6, 0.62, -0.31],
    [-13.5, 5.8, 0.75, 0.42],
    [13.5, 4.8, 0.7, -0.38]
  ];

  for (const [x, z, size, rotation] of pieces) {
    const piece = createBox({
      width: size,
      height: rand(0.08, 0.18),
      depth: rand(0.22, 0.45),
      material: debrisMaterial,
      position: [x, rand(0.08, 0.22), z],
      castShadow: true,
      receiveShadow: true
    });

    piece.rotation.y = rotation;
    piece.rotation.z = rand(-0.05, 0.05);
    group.add(piece);
  }
}

function addPerimeterServiceRoads(group, colors) {
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: colors.serviceRoad,
    roughness: 0.92,
    metalness: 0.02
  });

  const lineMaterial = new THREE.MeshBasicMaterial({
    color: colors.signal,
    transparent: true,
    opacity: 0.26
  });

  const roads = [
    [0, -10.96, 24.0, 0.28],
    [-12.86, 0, 0.28, 18.6],
    [12.86, 0, 0.28, 18.6]
  ];

  for (const [x, z, width, depth] of roads) {
    group.add(
      createBox({
        width,
        height: 0.035,
        depth,
        material: roadMaterial,
        position: [x, 0.075, z],
        receiveShadow: true
      })
    );
  }

  const laneMarks = [
    [-8.5, -10.95],
    [-4.5, -10.95],
    [-0.5, -10.95],
    [3.5, -10.95],
    [7.5, -10.95]
  ];

  for (const [x, z] of laneMarks) {
    group.add(
      createBox({
        width: 1.0,
        height: 0.018,
        depth: 0.035,
        material: lineMaterial,
        position: [x, 0.105, z]
      })
    );
  }
}

function addOuterDrainageChannels(group, colors) {
  const channelMaterial = new THREE.MeshStandardMaterial({
    color: colors.channel,
    roughness: 0.98,
    metalness: 0.02
  });

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: colors.signal,
    transparent: true,
    opacity: 0.18
  });

  const channels = [
    [-13.92, 0, 0.34, 18.9],
    [13.92, 0, 0.34, 18.9],
    [0, 10.95, 23.6, 0.28]
  ];

  for (const [x, z, width, depth] of channels) {
    group.add(
      createBox({
        width,
        height: 0.06,
        depth,
        material: channelMaterial,
        position: [x, 0.035, z],
        receiveShadow: true
      })
    );
  }

  const glowStrips = [
    [-13.92, -6.5, 0.035, 1.1],
    [-13.92, 0.0, 0.035, 1.1],
    [-13.92, 6.5, 0.035, 1.1],
    [13.92, -6.5, 0.035, 1.1],
    [13.92, 0.0, 0.035, 1.1],
    [13.92, 6.5, 0.035, 1.1],
    [-7.5, 10.95, 1.2, 0.035],
    [0.0, 10.95, 1.2, 0.035],
    [7.5, 10.95, 1.2, 0.035]
  ];

  for (const [x, z, width, depth] of glowStrips) {
    group.add(
      createBox({
        width,
        height: 0.018,
        depth,
        material: glowMaterial,
        position: [x, 0.082, z]
      })
    );
  }
}

function addCornerOutposts(group, colors) {
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: colors.platform,
    roughness: 0.86,
    metalness: 0.08
  });

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: colors.rim,
    roughness: 0.82,
    metalness: 0.08
  });

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: colors.signal,
    transparent: true,
    opacity: 0.48
  });

  const posts = [
    [-12.25, -9.7, 0],
    [12.25, -9.7, Math.PI / 2],
    [-12.25, 9.7, -Math.PI / 2],
    [12.25, 9.7, Math.PI]
  ];

  for (const [x, z, rotationY] of posts) {
    const outpost = new THREE.Group();
    outpost.userData.isStageDecoration = true;

    outpost.add(
      createBox({
        width: 1.05,
        height: 0.18,
        depth: 0.9,
        material: baseMaterial,
        position: [0, 0.12, 0],
        castShadow: true,
        receiveShadow: true
      })
    );

    outpost.add(
      createBox({
        width: 0.9,
        height: 0.45,
        depth: 0.12,
        material: trimMaterial,
        position: [0, 0.42, -0.35],
        castShadow: true
      })
    );

    outpost.add(
      createBox({
        width: 0.42,
        height: 0.25,
        depth: 0.28,
        material: baseMaterial,
        position: [0, 0.34, 0.18],
        castShadow: true
      })
    );

    outpost.add(
      createBox({
        width: 0.34,
        height: 0.035,
        depth: 0.12,
        material: glowMaterial,
        position: [0, 0.5, 0.03]
      })
    );

    outpost.position.set(x, 0.05, z);
    outpost.rotation.y = rotationY;
    group.add(outpost);
  }
}

function addSmallSignalPosts(group, colors) {
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: colors.towerMetal,
    roughness: 0.78,
    metalness: 0.16
  });

  const lightMaterial = new THREE.MeshBasicMaterial({
    color: colors.signal,
    transparent: true,
    opacity: 0.62
  });

  const posts = [
    [-10.8, -10.75],
    [-6.5, -10.78],
    [-2.3, -10.76],
    [2.4, -10.78],
    [6.7, -10.75],
    [10.8, -10.78],
    [-12.72, -6.2],
    [-12.72, 0.2],
    [-12.72, 6.2],
    [12.72, -6.2],
    [12.72, 0.2],
    [12.72, 6.2]
  ];

  for (const [x, z] of posts) {
    const post = new THREE.Group();
    post.userData.isStageDecoration = true;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 0.7, 6),
      poleMaterial
    );
    pole.position.y = 0.35;
    pole.castShadow = true;
    post.add(pole);

    post.add(
      createBox({
        width: 0.18,
        height: 0.09,
        depth: 0.12,
        material: lightMaterial,
        position: [0, 0.76, 0]
      })
    );

    post.position.set(x, 0.04, z);
    post.rotation.y = rand(0, Math.PI * 2);
    group.add(post);
  }
}

function addOuterSupplyCrates(group, colors) {
  const crateMaterial = new THREE.MeshStandardMaterial({
    color: colors.crate,
    roughness: 0.86,
    metalness: 0.04
  });

  const strapMaterial = new THREE.MeshStandardMaterial({
    color: colors.rim,
    roughness: 0.82,
    metalness: 0.1
  });

  const crates = [
    [-9.8, 9.65, 0.44],
    [-9.2, 9.7, 0.34],
    [-5.8, -10.2, 0.36],
    [5.5, 10.05, 0.4],
    [9.7, -10.12, 0.42],
    [11.9, -4.8, 0.36],
    [-11.9, 4.9, 0.38]
  ];

  for (const [x, z, size] of crates) {
    const crate = new THREE.Group();
    crate.userData.isStageDecoration = true;

    crate.add(
      createBox({
        width: size,
        height: size * 0.72,
        depth: size,
        material: crateMaterial,
        position: [0, size * 0.36, 0],
        castShadow: true,
        receiveShadow: true
      })
    );

    crate.add(
      createBox({
        width: size * 1.04,
        height: 0.04,
        depth: size * 0.12,
        material: strapMaterial,
        position: [0, size * 0.72, 0],
        castShadow: true
      })
    );

    crate.add(
      createBox({
        width: size * 0.12,
        height: 0.045,
        depth: size * 1.04,
        material: strapMaterial,
        position: [0, size * 0.73, 0],
        castShadow: true
      })
    );

    crate.position.set(x, 0.06, z);
    crate.rotation.y = rand(0, Math.PI * 2);
    group.add(crate);
  }
}

function addSideRetainingBars(group, colors) {
  const material = new THREE.MeshStandardMaterial({
    color: colors.towerMetal,
    roughness: 0.8,
    metalness: 0.16
  });

  for (const x of [-13.02, 13.02]) {
    for (const z of [-8.4, -5.8, -3.2, 3.2, 5.8, 8.4]) {
      group.add(
        createBox({
          width: 0.08,
          height: 0.12,
          depth: rand(1.1, 1.35),
          material,
          position: [x, 0.2, z],
          castShadow: true,
          receiveShadow: true
        })
      );
    }
  }
}

function addPerimeterFlags(group, colors) {
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: colors.towerMetal,
    roughness: 0.78,
    metalness: 0.16
  });

  const flagMaterial = new THREE.MeshBasicMaterial({
    color: colors.signal,
    transparent: true,
    opacity: 0.56,
    side: THREE.DoubleSide
  });

  const positions = [
    [-12.8, -9.35, Math.PI / 2],
    [-12.8, -2.8, Math.PI / 2],
    [-12.8, 4.2, Math.PI / 2],
    [12.8, -9.35, -Math.PI / 2],
    [12.8, -2.8, -Math.PI / 2],
    [12.8, 4.2, -Math.PI / 2],
    [-7.2, 10.25, 0],
    [0.0, 10.25, 0],
    [7.2, 10.25, 0]
  ];

  for (const [x, z, rotationY] of positions) {
    const flagPost = new THREE.Group();
    flagPost.userData.isStageDecoration = true;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 0.9, 6),
      poleMaterial
    );
    pole.position.y = 0.45;
    pole.castShadow = true;
    flagPost.add(pole);

    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.lineTo(0.42, 0.13);
    flagShape.lineTo(0, 0.26);
    flagShape.lineTo(0, 0);

    const flag = new THREE.Mesh(
      new THREE.ShapeGeometry(flagShape),
      flagMaterial
    );
    flag.position.set(0.04, 0.68, 0);
    flag.castShadow = true;
    flagPost.add(flag);

    flagPost.add(
      createBox({
        width: 0.12,
        height: 0.08,
        depth: 0.12,
        material: poleMaterial,
        position: [0, 0.93, 0],
        castShadow: true
      })
    );

    flagPost.position.set(x, 0.05, z);
    flagPost.rotation.y = rotationY;
    group.add(flagPost);
  }
}

function addDistantBeaconBlocks(group, colors) {
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: colors.platform,
    roughness: 0.86,
    metalness: 0.08
  });

  const mastMaterial = new THREE.MeshStandardMaterial({
    color: colors.towerMetal,
    roughness: 0.76,
    metalness: 0.18
  });

  const lightMaterial = new THREE.MeshBasicMaterial({
    color: colors.signal,
    transparent: true,
    opacity: 0.66
  });

  const beacons = [
    [-11.5, -13.28, 0.9],
    [-5.8, -13.38, 0.75],
    [0.0, -13.3, 0.95],
    [5.8, -13.38, 0.75],
    [11.5, -13.28, 0.9]
  ];

  for (const [x, z, height] of beacons) {
    const beacon = new THREE.Group();
    beacon.userData.isStageDecoration = true;

    beacon.add(
      createBox({
        width: 0.48,
        height: 0.16,
        depth: 0.42,
        material: baseMaterial,
        position: [0, 0.11, 0],
        castShadow: true,
        receiveShadow: true
      })
    );

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, height, 6),
      mastMaterial
    );
    mast.position.y = 0.18 + height / 2;
    mast.castShadow = true;
    beacon.add(mast);

    beacon.add(
      createBox({
        width: 0.22,
        height: 0.1,
        depth: 0.18,
        material: lightMaterial,
        position: [0, 0.23 + height, 0]
      })
    );

    beacon.position.set(x, 0.03, z);
    beacon.rotation.y = rand(-0.25, 0.25);
    group.add(beacon);
  }
}

function addLayeredOuterTreeLine(group, colors) {
  const trees = [
    [-13.7, -7.8, 0.72],
    [-14.0, -4.4, 0.62],
    [-13.8, 1.6, 0.68],
    [-14.0, 6.6, 0.74],
    [13.7, -7.6, 0.72],
    [14.0, -3.8, 0.64],
    [13.9, 2.4, 0.68],
    [14.1, 6.8, 0.75],
    [-10.8, -13.85, 0.7],
    [-7.5, -14.05, 0.62],
    [-3.6, -13.9, 0.66],
    [3.6, -13.9, 0.66],
    [7.5, -14.05, 0.62],
    [10.8, -13.85, 0.7]
  ];

  for (const [x, z, scale] of trees) {
    const tree = createTreeCluster({
      leafColor: colors.outerLeaf,
      trunkColor: colors.outerTrunk,
      count: 2 + Math.floor(rand(0, 2))
    });

    tree.position.set(x, 0.05, z);
    tree.scale.setScalar(scale);
    tree.rotation.y = rand(0, Math.PI * 2);
    group.add(tree);
  }
}

function addRunwayEdgePanels(group, colors) {
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: colors.platform,
    roughness: 0.86,
    metalness: 0.07
  });

  const trimMaterial = new THREE.MeshBasicMaterial({
    color: colors.signal,
    transparent: true,
    opacity: 0.28
  });

  const panels = [
    [-9.8, -10.28, 0.72, 0.34],
    [-6.4, -10.22, 0.58, 0.28],
    [-2.8, -10.26, 0.72, 0.34],
    [2.8, -10.26, 0.72, 0.34],
    [6.4, -10.22, 0.58, 0.28],
    [9.8, -10.28, 0.72, 0.34],
    [-9.8, 10.28, 0.72, 0.34],
    [-6.4, 10.22, 0.58, 0.28],
    [-2.8, 10.26, 0.72, 0.34],
    [2.8, 10.26, 0.72, 0.34],
    [6.4, 10.22, 0.58, 0.28],
    [9.8, 10.28, 0.72, 0.34]
  ];

  for (const [x, z, width, depth] of panels) {
    const panel = new THREE.Group();
    panel.userData.isStageDecoration = true;

    panel.add(
      createBox({
        width,
        height: 0.055,
        depth,
        material: panelMaterial,
        position: [0, 0.09, 0],
        castShadow: true,
        receiveShadow: true
      })
    );

    panel.add(
      createBox({
        width: width * 0.72,
        height: 0.018,
        depth: depth * 0.12,
        material: trimMaterial,
        position: [0, 0.13, 0]
      })
    );

    panel.position.set(x, 0.035, z);
    panel.rotation.y = rand(-0.08, 0.08);
    group.add(panel);
  }
}

function addMicroDebrisField(group, colors) {
  const debrisMaterial = new THREE.MeshStandardMaterial({
    color: colors.debris,
    roughness: 0.96,
    metalness: 0.02
  });

  const safeZones = [
    [-11.6, -9.6],
    [-8.6, -10.0],
    [-3.2, -10.05],
    [2.8, -10.05],
    [8.6, -10.0],
    [11.6, -9.6],
    [-11.7, 9.45],
    [-6.5, 9.75],
    [0.0, 9.8],
    [6.5, 9.75],
    [11.7, 9.45]
  ];

  for (const [x, z] of safeZones) {
    const count = 2 + Math.floor(rand(0, 3));

    for (let i = 0; i < count; i++) {
      const piece = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rand(0.045, 0.11), 0),
        debrisMaterial
      );

      piece.position.set(
        x + rand(-0.42, 0.42),
        rand(0.08, 0.16),
        z + rand(-0.22, 0.22)
      );
      piece.scale.y = rand(0.35, 0.7);
      piece.rotation.y = rand(0, Math.PI * 2);
      piece.castShadow = true;
      piece.receiveShadow = true;
      group.add(piece);
    }
  }
}

function addStageBackstoryProps(group, effectId, colors) {
  if (effectId === "canyon_wind") {
    addCanyonBackdrop(group);
    return;
  }

  if (effectId === "frozen_chill") {
    addFrozenBackdrop(group);
    return;
  }

  if (effectId === "ancient_armor") {
    addAncientBackdrop(group);
    return;
  }

  if (effectId === "lava_pressure") {
    addLavaBackdrop(group);
    return;
  }

  if (effectId === "swamp_mud") {
    addSwampBackdrop(group);
    return;
  }

  if (effectId === "crystal_resonance") {
    addCrystalBackdrop(group);
    return;
  }

  addForestBackdrop(group, colors);
}

function addForestBackdrop(group, colors) {
  const positions = [
    [-11.8, -12.05, 1.0],
    [-8.4, -12.25, 1.25],
    [-4.8, -12.0, 0.95],
    [1.1, -12.2, 1.15],
    [5.8, -12.05, 1.0],
    [10.4, -12.25, 1.2]
  ];

  for (const [x, z, scale] of positions) {
    const tree = createTreeCluster({
      leafColor: colors.outerLeaf,
      trunkColor: colors.outerTrunk,
      count: 3
    });

    tree.position.set(x, 0.04, z);
    tree.scale.setScalar(scale);
    tree.rotation.y = rand(0, Math.PI * 2);
    group.add(tree);
  }
}

function addCanyonBackdrop(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x7c3f16,
    roughness: 0.98,
    metalness: 0.02
  });

  const positions = [
    [-11.6, -12.1, 1.4],
    [-7.4, -12.35, 1.8],
    [-2.8, -12.08, 1.3],
    [3.8, -12.28, 1.7],
    [8.9, -12.06, 1.45],
    [12.0, -12.22, 1.6]
  ];

  for (const [x, z, height] of positions) {
    const spire = createRockSpire({
      height,
      radius: rand(0.22, 0.42),
      color: 0x7c3f16,
      material
    });

    spire.position.set(x, height / 2 - 0.04, z);
    spire.rotation.y = rand(0, Math.PI * 2);
    spire.scale.x *= rand(0.7, 1.25);
    spire.scale.z *= rand(0.65, 1.2);
    group.add(spire);
  }
}

function addFrozenBackdrop(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    emissive: 0x0e7490,
    emissiveIntensity: 0.16,
    roughness: 0.38,
    transparent: true,
    opacity: 0.74
  });

  const positions = [
    [-10.8, -12.1, 0.8],
    [-6.4, -12.35, 1.1],
    [-1.5, -12.12, 0.9],
    [4.2, -12.3, 1.2],
    [9.2, -12.08, 0.85]
  ];

  for (const [x, z, height] of positions) {
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(rand(0.16, 0.3), height, 5),
      material
    );

    shard.position.set(x, height / 2, z);
    shard.rotation.z = rand(-0.22, 0.22);
    shard.rotation.y = rand(0, Math.PI * 2);
    shard.castShadow = true;
    group.add(shard);
  }
}

function addAncientBackdrop(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.94,
    metalness: 0.02
  });

  const positions = [
    [-10.0, -12.2, 1.1],
    [-5.6, -12.1, 0.9],
    [-0.8, -12.3, 1.35],
    [4.8, -12.16, 0.95],
    [9.4, -12.28, 1.2]
  ];

  for (const [x, z, height] of positions) {
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.2, height, 8),
      material
    );
    column.position.set(x, height / 2, z);
    column.rotation.z = rand(-0.12, 0.12);
    column.castShadow = true;
    column.receiveShadow = true;
    group.add(column);

    const cap = createBox({
      width: 0.52,
      height: 0.12,
      depth: 0.46,
      material,
      position: [x, height + 0.08, z],
      castShadow: true
    });
    cap.rotation.y = rand(-0.2, 0.2);
    group.add(cap);
  }
}

function addLavaBackdrop(group) {
  const basaltMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a120a,
    roughness: 0.98,
    metalness: 0.02
  });

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.32
  });

  const vents = [
    [-10.3, -12.15],
    [-4.5, -12.35],
    [1.4, -12.18],
    [7.8, -12.32]
  ];

  for (const [x, z] of vents) {
    const rock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.5, 0.42, 7),
      basaltMaterial
    );
    rock.position.set(x, 0.22, z);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);

    const glow = createBox({
      width: 0.58,
      height: 0.026,
      depth: 0.12,
      material: glowMaterial,
      position: [x, 0.45, z]
    });
    glow.rotation.y = rand(0, Math.PI);
    group.add(glow);
  }
}

function addSwampBackdrop(group) {
  const rootMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f2a12,
    roughness: 0.96
  });

  const mossMaterial = new THREE.MeshStandardMaterial({
    color: 0x365314,
    roughness: 0.95
  });

  const positions = [
    [-11.2, -12.1],
    [-6.8, -12.25],
    [-1.0, -12.05],
    [4.7, -12.32],
    [10.5, -12.12]
  ];

  for (const [x, z] of positions) {
    const root = createBox({
      width: rand(0.7, 1.15),
      height: 0.09,
      depth: 0.13,
      material: rootMaterial,
      position: [x, 0.15, z],
      castShadow: true
    });
    root.rotation.y = rand(-0.75, 0.75);
    group.add(root);

    const moss = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rand(0.18, 0.32), 0),
      mossMaterial
    );
    moss.position.set(x + rand(-0.25, 0.25), 0.22, z + rand(-0.18, 0.18));
    moss.scale.y = rand(0.35, 0.65);
    moss.castShadow = true;
    group.add(moss);
  }
}

function addCrystalBackdrop(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x155e75,
    emissiveIntensity: 0.22,
    roughness: 0.38,
    transparent: true,
    opacity: 0.78
  });

  const positions = [
    [-10.6, -12.1, 0.9],
    [-6.1, -12.3, 1.25],
    [-1.2, -12.12, 0.75],
    [3.9, -12.28, 1.15],
    [9.0, -12.1, 0.95]
  ];

  for (const [x, z, height] of positions) {
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(rand(0.14, 0.28), height, 5),
      material
    );

    crystal.position.set(x, height / 2, z);
    crystal.rotation.z = rand(-0.18, 0.18);
    crystal.rotation.y = rand(0, Math.PI * 2);
    crystal.castShadow = true;
    group.add(crystal);
  }
}

function addStageMoodAccents(group, effectId, colors) {
  if (effectId === "canyon_wind") {
    addCanyonSandBanks(group);
    return;
  }

  if (effectId === "frozen_chill") {
    addFrozenEdgePlates(group);
    return;
  }

  if (effectId === "ancient_armor") {
    addAncientInscriptionBlocks(group);
    return;
  }

  if (effectId === "lava_pressure") {
    addLavaCoolingPlates(group);
    return;
  }

  if (effectId === "swamp_mud") {
    addSwampEdgePools(group);
    return;
  }

  if (effectId === "crystal_resonance") {
    addCrystalEdgeRelays(group, colors);
    return;
  }

  addForestEdgeLanterns(group);
}

function addForestEdgeLanterns(group) {
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a2c16,
    roughness: 0.88
  });

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.42
  });

  const positions = [
    [-10.6, 9.35],
    [-2.8, 9.55],
    [4.6, 9.55],
    [10.4, 9.35]
  ];

  for (const [x, z] of positions) {
    const lantern = new THREE.Group();
    lantern.userData.isStageDecoration = true;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 0.62, 6),
      woodMaterial
    );
    pole.position.y = 0.31;
    pole.castShadow = true;
    lantern.add(pole);

    lantern.add(
      createBox({
        width: 0.18,
        height: 0.18,
        depth: 0.18,
        material: glowMaterial,
        position: [0, 0.7, 0]
      })
    );

    lantern.position.set(x, 0.04, z);
    group.add(lantern);
  }
}

function addCanyonSandBanks(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x8a4a1f,
    roughness: 1
  });

  const banks = [
    [-8.0, 9.55, 1.4, 0.28],
    [-2.5, 9.65, 1.1, 0.22],
    [3.5, 9.55, 1.3, 0.26],
    [8.6, 9.62, 1.0, 0.22]
  ];

  for (const [x, z, width, depth] of banks) {
    const bank = createBox({
      width,
      height: 0.045,
      depth,
      material,
      position: [x, 0.095, z],
      receiveShadow: true
    });

    bank.rotation.y = rand(-0.25, 0.25);
    group.add(bank);
  }
}

function addFrozenEdgePlates(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x0e7490,
    emissiveIntensity: 0.08,
    roughness: 0.46,
    transparent: true,
    opacity: 0.58
  });

  const plates = [
    [-8.0, 9.55, 1.0],
    [-2.8, 9.58, 0.8],
    [2.8, 9.58, 0.9],
    [8.0, 9.55, 1.1]
  ];

  for (const [x, z, size] of plates) {
    const plate = createBox({
      width: size,
      height: 0.035,
      depth: size * 0.38,
      material,
      position: [x, 0.1, z]
    });

    plate.rotation.y = rand(-0.35, 0.35);
    group.add(plate);
  }
}

function addAncientInscriptionBlocks(group) {
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.94
  });

  const markMaterial = new THREE.MeshBasicMaterial({
    color: 0xc4b5fd,
    transparent: true,
    opacity: 0.4
  });

  const positions = [
    [-9.4, 9.5],
    [-3.2, 9.62],
    [3.2, 9.62],
    [9.4, 9.5]
  ];

  for (const [x, z] of positions) {
    const block = new THREE.Group();
    block.userData.isStageDecoration = true;

    block.add(
      createBox({
        width: 0.55,
        height: 0.28,
        depth: 0.32,
        material: stoneMaterial,
        position: [0, 0.16, 0],
        castShadow: true,
        receiveShadow: true
      })
    );

    block.add(
      createBox({
        width: 0.36,
        height: 0.025,
        depth: 0.045,
        material: markMaterial,
        position: [0, 0.32, -0.17]
      })
    );

    block.position.set(x, 0.04, z);
    block.rotation.y = rand(-0.35, 0.35);
    group.add(block);
  }
}

function addLavaCoolingPlates(group) {
  const basaltMaterial = new THREE.MeshStandardMaterial({
    color: 0x24100a,
    roughness: 0.98
  });

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.22
  });

  const positions = [
    [-9.0, 9.55],
    [-4.0, 9.65],
    [1.0, 9.55],
    [6.4, 9.62],
    [10.2, 9.48]
  ];

  for (const [x, z] of positions) {
    const plate = new THREE.Group();
    plate.userData.isStageDecoration = true;

    const rock = createBox({
      width: rand(0.55, 0.9),
      height: 0.06,
      depth: rand(0.22, 0.36),
      material: basaltMaterial,
      position: [0, 0.08, 0],
      castShadow: true,
      receiveShadow: true
    });
    rock.rotation.y = rand(-0.25, 0.25);
    plate.add(rock);

    const glow = createBox({
      width: rand(0.32, 0.5),
      height: 0.02,
      depth: 0.035,
      material: glowMaterial,
      position: [0, 0.13, 0]
    });
    glow.rotation.y = rand(-0.4, 0.4);
    plate.add(glow);

    plate.position.set(x, 0.04, z);
    group.add(plate);
  }
}

function addSwampEdgePools(group) {
  const mudMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f3f1d,
    roughness: 1
  });

  const waterMaterial = new THREE.MeshBasicMaterial({
    color: 0x365314,
    transparent: true,
    opacity: 0.42
  });

  const positions = [
    [-8.4, 9.55],
    [-2.4, 9.6],
    [3.8, 9.55],
    [9.4, 9.5]
  ];

  for (const [x, z] of positions) {
    const pool = new THREE.Group();
    pool.userData.isStageDecoration = true;

    const mud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.5, 0.035, 16),
      mudMaterial
    );
    mud.position.y = 0.07;
    mud.scale.z = 0.55;
    pool.add(mud);

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.34, 0.02, 16),
      waterMaterial
    );
    water.position.y = 0.1;
    water.scale.z = 0.5;
    pool.add(water);

    pool.position.set(x, 0.04, z);
    pool.rotation.y = rand(0, Math.PI * 2);
    group.add(pool);
  }
}

function addCrystalEdgeRelays(group, colors) {
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: colors.platform,
    roughness: 0.82,
    metalness: 0.08
  });

  const crystalMaterial = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x155e75,
    emissiveIntensity: 0.28,
    roughness: 0.36,
    transparent: true,
    opacity: 0.78
  });

  const positions = [
    [-9.0, 9.55],
    [-3.0, 9.6],
    [3.0, 9.6],
    [9.0, 9.55]
  ];

  for (const [x, z] of positions) {
    const relay = new THREE.Group();
    relay.userData.isStageDecoration = true;

    relay.add(
      createBox({
        width: 0.48,
        height: 0.12,
        depth: 0.42,
        material: baseMaterial,
        position: [0, 0.1, 0],
        castShadow: true,
        receiveShadow: true
      })
    );

    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.48, 5),
      crystalMaterial
    );
    crystal.position.y = 0.4;
    crystal.rotation.y = rand(0, Math.PI * 2);
    crystal.castShadow = true;
    relay.add(crystal);

    relay.position.set(x, 0.04, z);
    group.add(relay);
  }
}

function addStageSpecificLandmarks(group, effectId, stageName) {
  if (effectId === "canyon_wind") {
    addCanyonLandmarks(group, stageName);
    return;
  }

  if (effectId === "frozen_chill") {
    addFrozenLandmarks(group, stageName);
    return;
  }

  if (effectId === "ancient_armor") {
    addAncientLandmarks(group, stageName);
    return;
  }

  if (effectId === "lava_pressure") {
    addLavaLandmarks(group, stageName);
    return;
  }

  if (effectId === "swamp_mud") {
    addSwampLandmarks(group, stageName);
    return;
  }

  if (effectId === "crystal_resonance") {
    addCrystalLandmarks(group, stageName);
    return;
  }

  addForestLandmarks(group, stageName);
}

function addForestLandmarks(group, stageName) {
  addSectorPlate(group, stageName, "Stable outer-grid forest sector", 0x22c55e);

  const positions = [
    [-11.75, -8.85],
    [-11.65, 8.55],
    [-7.65, -9.15],
    [6.65, -9.15],
    [10.95, 8.55],
    [11.55, -6.1],
    [11.55, 2.75],
    [-11.65, 1.85]
  ];

  for (const [x, z] of positions) {
    const hill = createRoundedHill(0x1f6b35, 0x164f29);
    hill.position.set(x, 0.02, z);
    hill.scale.set(rand(0.62, 0.88), rand(0.72, 0.95), rand(0.62, 0.88));
    group.add(hill);

    const trees = createTreeCluster({
      leafColor: 0x166534,
      trunkColor: 0x6b3415,
      count: 2 + Math.floor(rand(0, 2))
    });
    trees.position.set(x + rand(-0.22, 0.22), 0.22, z + rand(-0.22, 0.22));
    trees.scale.setScalar(rand(0.78, 0.95));
    group.add(trees);
  }

  addForestWatchPosts(group);
  addGroundPebbles(group, 0x1b4332);
  addForestShrines(group);
  addEdgeBushes(group, 0x14532d);
}

function addCanyonLandmarks(group, stageName) {
  addSectorPlate(group, stageName, "Wind-cut canyon walls accelerate portal units", 0xfb923c);

  const material = new THREE.MeshStandardMaterial({
    color: 0x8a4a1f,
    roughness: 0.96,
    metalness: 0.02
  });

  addCanyonRidgeLine(group, material, -12.0, -6.8, 7.4, 8);
  addCanyonRidgeLine(group, material, 12.0, -7.4, 6.8, 8);
  addCanyonRidgeLineHorizontal(group, material, -8.5, 8.9, 7);

  addCanyonDustScratches(group);
  addCanyonBrokenPillars(group);
  addCanyonEdgePlanks(group);
  addGroundPebbles(group, 0x7c3f16);
}

function addFrozenLandmarks(group, stageName) {
  addSectorPlate(group, stageName, "Cryo interference strengthens slow control", 0x7dd3fc);

  const positions = [
    [-10.8, -7.4],
    [-9.3, 7.8],
    [-6.4, -8.9],
    [7.0, -8.6],
    [10.7, 7.1],
    [-11.1, 0.6],
    [11.2, -1.2]
  ];

  for (const [x, z] of positions) {
    const mound = createRoundedHill(0x9ddcf3, 0x4ba6c9);
    mound.position.set(x, 0.04, z);
    mound.scale.set(rand(0.8, 1.15), 0.58, rand(0.8, 1.15));
    group.add(mound);

    const crystals = createCrystalCluster({
      colorA: 0x67e8f9,
      colorB: 0xa5f3fc,
      count: 4,
      maxHeight: 1.15
    });
    crystals.position.set(x, 0.36, z);
    crystals.scale.setScalar(rand(0.75, 1.05));
    group.add(crystals);
  }

  addFrozenShards(group);
}

function addAncientLandmarks(group, stageName) {
  addSectorPlate(group, stageName, "Ancient armor ruins amplify hostile durability", 0xc4b5fd);

  const ruins = [
    [-10.6, -7.2],
    [-9.2, 7.8],
    [9.4, -7.7],
    [10.8, 6.8],
    [-11.2, 0],
    [11.2, 0.2]
  ];

  for (const [x, z] of ruins) {
    const ruin = createRuinCluster();
    ruin.position.set(x, 0.02, z);
    ruin.rotation.y = rand(0, Math.PI * 2);
    ruin.scale.setScalar(rand(0.85, 1.2));
    group.add(ruin);
  }

  addAncientWallFragments(group);
  addGroundPebbles(group, 0x57534e);
}

function addLavaLandmarks(group, stageName) {
  addSectorPlate(group, stageName, "Thermal pressure raises portal aggression", 0xf97316);

  const positions = [
    [-10.4, -7.7],
    [-8.8, 7.8],
    [8.9, -8.2],
    [10.5, 7.5],
    [-11.4, 1.3],
    [11.4, -1.4]
  ];

  for (const [x, z] of positions) {
    const volcanic = createVolcanicCluster();
    volcanic.position.set(x, 0.04, z);
    volcanic.scale.setScalar(rand(0.85, 1.18));
    group.add(volcanic);
  }

  addLavaCrack(group, -6.1, 9.15, 3.6);
  addLavaCrack(group, 5.7, -9.05, 3.4);
  addLavaAshRocks(group);
}

function addSwampLandmarks(group, stageName) {
  addSectorPlate(group, stageName, "Mud lanes slow movement but harden enemies", 0x84cc16);

  const positions = [
    [-10.8, -7.4],
    [-9.0, 7.6],
    [9.5, -7.9],
    [10.7, 7.1],
    [-11.5, 0.4],
    [11.3, -0.5]
  ];

  for (const [x, z] of positions) {
    const swamp = createSwampPatch();
    swamp.position.set(x, 0.03, z);
    swamp.scale.setScalar(rand(0.9, 1.25));
    group.add(swamp);
  }

  addSwampRoots(group);
  addEdgeBushes(group, 0x365314);
}

function addCrystalLandmarks(group, stageName) {
  addSectorPlate(group, stageName, "Crystal resonance boosts towers and enemies", 0x22d3ee);

  const positions = [
    [-10.6, -7.8],
    [-8.8, 7.8],
    [8.7, -8.1],
    [10.6, 7.1],
    [-11.4, 0.7],
    [11.3, -0.9]
  ];

  for (const [x, z] of positions) {
    const cluster = createCrystalCluster({
      colorA: 0x38bdf8,
      colorB: 0xf0abfc,
      count: 6,
      maxHeight: 1.55
    });
    cluster.position.set(x, 0.24, z);
    cluster.scale.setScalar(rand(0.9, 1.25));
    group.add(cluster);
  }

  addCrystalEnergyLines(group);
}

function addPortalGroundScars(group, effectId) {
  const colors = getStageColors(effectId);

  const scarGroup = new THREE.Group();
  scarGroup.userData.isStageDecoration = true;

  const centerX = -10.5;
  const centerZ = -7.6;

  const scarMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1208,
    roughness: 0.98,
    metalness: 0.01
  });

  const emberMaterial = new THREE.MeshBasicMaterial({
    color: colors.portal,
    transparent: true,
    opacity: 0.18
  });

  const scorch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 1.05, 0.025, 24),
    scarMaterial
  );
  scorch.position.set(centerX, 0.052, centerZ);
  scorch.scale.set(1.1, 1, 0.62);
  scorch.rotation.y = rand(-0.2, 0.2);
  scorch.receiveShadow = true;
  scarGroup.add(scorch);

  const crackData = [
    [-0.48, 0.26, 0.55, 0.035, -0.5],
    [0.52, -0.3, 0.48, 0.035, 0.55],
    [-0.2, -0.48, 0.42, 0.03, -0.9],
    [0.24, 0.46, 0.46, 0.03, 0.9]
  ];

  for (const [x, z, length, thickness, rotation] of crackData) {
    const crack = createBox({
      width: length,
      height: 0.026,
      depth: thickness,
      material: scarMaterial,
      position: [centerX + x, 0.08, centerZ + z],
      receiveShadow: true
    });
    crack.rotation.y = rotation + rand(-0.12, 0.12);
    scarGroup.add(crack);
  }

  for (let i = 0; i < 4; i++) {
    const ember = createBox({
      width: rand(0.08, 0.16),
      height: 0.018,
      depth: rand(0.035, 0.07),
      material: emberMaterial,
      position: [
        centerX + rand(-0.82, 0.82),
        0.085,
        centerZ + rand(-0.62, 0.62)
      ]
    });
    ember.rotation.y = rand(0, Math.PI * 2);
    scarGroup.add(ember);
  }

  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a1b12,
    roughness: 0.96,
    metalness: 0.02
  });

  for (let i = 0; i < 5; i++) {
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rand(0.08, 0.16), 0),
      stoneMaterial
    );

    stone.position.set(
      centerX + rand(-0.9, 0.9),
      rand(0.08, 0.15),
      centerZ + rand(-0.65, 0.65)
    );
    stone.scale.y = rand(0.35, 0.75);
    stone.rotation.y = rand(0, Math.PI * 2);
    stone.castShadow = true;
    stone.receiveShadow = true;
    scarGroup.add(stone);
  }

  group.add(scarGroup);
}

function addSectorPlate(group, title, subtitle, color) {
  const plateGroup = new THREE.Group();
  plateGroup.userData.isStageDecoration = true;

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x08111f,
    roughness: 0.72,
    metalness: 0.08,
    emissive: 0x07111f,
    emissiveIntensity: 0.18
  });

  const stripMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.78
  });

  plateGroup.add(
    createBox({
      width: 4.4,
      height: 0.12,
      depth: 0.62,
      material: baseMaterial,
      position: [0, 0.58, -11.58],
      castShadow: true,
      receiveShadow: true
    })
  );

  plateGroup.add(
    createBox({
      width: 3.8,
      height: 0.045,
      depth: 0.075,
      material: stripMaterial,
      position: [0, 0.68, -11.22]
    })
  );

  group.add(plateGroup);
}

function addCanyonDustScratches(group) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.2
  });

  const positions = [
    [-9.8, -9.2, 1.0],
    [-6.4, -9.35, 1.4],
    [-2.8, -9.1, 1.1],
    [1.2, -9.35, 1.5],
    [5.4, -9.1, 1.2],
    [9.0, -9.35, 1.35]
  ];

  for (const [x, z, length] of positions) {
    const scratch = createBox({
      width: length,
      height: 0.022,
      depth: 0.035,
      material,
      position: [x, 0.105, z]
    });
    scratch.rotation.y = rand(-0.18, 0.18);
    group.add(scratch);
  }
}

function addCanyonBrokenPillars(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x6b3517,
    roughness: 0.96
  });

  const positions = [
    [-10.7, -8.6],
    [-8.8, 8.6],
    [8.7, -8.5],
    [10.8, 8.3]
  ];

  for (const [x, z] of positions) {
    const pillarGroup = new THREE.Group();
    pillarGroup.userData.isStageDecoration = true;

    const height = rand(0.65, 1.15);
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.23, height, 6),
      material
    );
    pillar.position.y = height / 2;
    pillar.rotation.z = rand(-0.18, 0.18);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    pillarGroup.add(pillar);

    const cap = createBox({
      width: 0.52,
      height: 0.13,
      depth: 0.52,
      material,
      position: [0, height + 0.07, 0],
      castShadow: true
    });
    cap.rotation.y = rand(0, Math.PI);
    pillarGroup.add(cap);

    pillarGroup.position.set(x, 0.04, z);
    pillarGroup.rotation.y = rand(0, Math.PI * 2);
    group.add(pillarGroup);
  }
}

function addCanyonEdgePlanks(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x5b3417,
    roughness: 0.88
  });

  const positions = [
    [-5.8, -10.15, 0.9],
    [-4.7, -10.12, 0.75],
    [6.8, 10.1, 0.85],
    [7.9, 10.15, 0.65]
  ];

  for (const [x, z, length] of positions) {
    const plank = createBox({
      width: length,
      height: 0.08,
      depth: 0.16,
      material,
      position: [x, 0.17, z],
      castShadow: true,
      receiveShadow: true
    });
    plank.rotation.y = rand(-0.28, 0.28);
    group.add(plank);
  }
}

function addFrozenShards(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xa5f3fc,
    emissive: 0x0891b2,
    emissiveIntensity: 0.18,
    roughness: 0.35,
    transparent: true,
    opacity: 0.72
  });

  const positions = [
    [-12.1, -3.4],
    [-12.0, 4.2],
    [12.1, -4.1],
    [12.0, 4.6],
    [-3.7, -9.4],
    [4.2, 9.4]
  ];

  for (const [x, z] of positions) {
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(rand(0.12, 0.22), rand(0.55, 0.95), 5),
      material
    );

    shard.position.set(x, 0.35, z);
    shard.rotation.z = rand(-0.2, 0.2);
    shard.rotation.y = rand(0, Math.PI * 2);
    shard.castShadow = true;
    group.add(shard);
  }
}

function addAncientWallFragments(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.94
  });

  const positions = [
    [-6.4, -9.2, 1.1],
    [-5.1, -9.25, 0.8],
    [5.5, 9.15, 1.2],
    [6.9, 9.2, 0.9]
  ];

  for (const [x, z, width] of positions) {
    const fragment = createBox({
      width,
      height: 0.42,
      depth: 0.22,
      material,
      position: [x, 0.25, z],
      castShadow: true,
      receiveShadow: true
    });
    fragment.rotation.y = rand(-0.25, 0.25);
    group.add(fragment);
  }
}

function addLavaAshRocks(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x24100a,
    roughness: 0.98
  });

  const positions = [
    [-11.8, -5.2],
    [-11.5, 3.4],
    [11.6, -3.8],
    [11.8, 5.1],
    [-2.8, -9.4],
    [3.9, 9.4]
  ];

  for (const [x, z] of positions) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rand(0.16, 0.32), 0),
      material
    );

    rock.position.set(x, 0.18, z);
    rock.scale.y = rand(0.45, 0.85);
    rock.rotation.y = rand(0, Math.PI * 2);
    rock.castShadow = true;
    group.add(rock);
  }
}

function addSwampRoots(group) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x3f2a12,
    roughness: 0.96
  });

  const positions = [
    [-11.4, -5.4],
    [-11.2, 4.8],
    [11.2, -4.7],
    [11.3, 4.5],
    [-4.2, -9.1],
    [4.8, 9.1]
  ];

  for (const [x, z] of positions) {
    const root = createBox({
      width: rand(0.6, 1.1),
      height: 0.08,
      depth: 0.11,
      material,
      position: [x, 0.12, z],
      castShadow: true,
      receiveShadow: true
    });

    root.rotation.y = rand(-0.75, 0.75);
    group.add(root);
  }
}

function addCrystalEnergyLines(group) {
  const material = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.28
  });

  const positions = [
    [-7.4, -9.2, 1.2],
    [-2.2, -9.3, 1.0],
    [3.6, -9.2, 1.4],
    [8.2, -9.1, 1.0],
    [-6.8, 9.2, 1.2],
    [1.4, 9.3, 1.4],
    [7.6, 9.1, 1.0]
  ];

  for (const [x, z, length] of positions) {
    const line = createBox({
      width: length,
      height: 0.026,
      depth: 0.04,
      material,
      position: [x, 0.11, z]
    });
    line.rotation.y = rand(-0.25, 0.25);
    group.add(line);
  }
}

function addForestWatchPosts(group) {
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x5b3417,
    roughness: 0.85
  });

  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x14532d,
    roughness: 0.8
  });

  const positions = [
    [-12.0, -8.8],
    [12.0, -8.4],
    [-12.0, 8.5],
    [12.0, 8.2]
  ];

  for (const [x, z] of positions) {
    const post = new THREE.Group();
    post.userData.isStageDecoration = true;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 1.1, 6),
      woodMaterial
    );
    pole.position.y = 0.55;
    pole.castShadow = true;
    post.add(pole);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.38, 0.42, 4),
      roofMaterial
    );
    roof.position.y = 1.24;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    post.add(roof);

    post.position.set(x, 0.02, z);
    post.rotation.y = rand(0, Math.PI * 2);
    group.add(post);
  }
}

function addForestShrines(group) {
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9
  });

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.32
  });

  const positions = [
    [-11.6, -4.6],
    [11.6, 4.8]
  ];

  for (const [x, z] of positions) {
    const shrine = new THREE.Group();
    shrine.userData.isStageDecoration = true;

    shrine.add(
      createBox({
        width: 0.72,
        height: 0.18,
        depth: 0.72,
        material: stoneMaterial,
        position: [0, 0.09, 0],
        castShadow: true,
        receiveShadow: true
      })
    );

    shrine.add(
      createBox({
        width: 0.28,
        height: 0.75,
        depth: 0.28,
        material: stoneMaterial,
        position: [0, 0.55, 0],
        castShadow: true
      })
    );

    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.34, 5),
      glowMaterial
    );
    crystal.position.y = 1.02;
    crystal.rotation.y = rand(0, Math.PI * 2);
    shrine.add(crystal);

    shrine.position.set(x, 0.04, z);
    shrine.rotation.y = rand(0, Math.PI * 2);
    group.add(shrine);
  }
}

function addEdgeBushes(group, color) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9
  });

  const positions = [
    [-11.7, -6.0],
    [-11.8, -2.2],
    [-11.6, 5.9],
    [11.7, -5.3],
    [11.9, -1.8],
    [11.6, 5.6],
    [-7.4, -9.2],
    [-2.2, -9.3],
    [3.2, -9.3],
    [8.1, -9.0],
    [-7.4, 9.1],
    [-2.1, 9.2],
    [3.8, 9.0],
    [8.8, 8.9]
  ];

  for (const [x, z] of positions) {
    const bush = new THREE.Group();
    bush.userData.isStageDecoration = true;

    const count = 2 + Math.floor(rand(0, 3));

    for (let i = 0; i < count; i++) {
      const leaf = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rand(0.16, 0.32), 0),
        material
      );

      leaf.position.set(
        rand(-0.25, 0.25),
        rand(0.12, 0.24),
        rand(-0.25, 0.25)
      );
      leaf.scale.y = rand(0.55, 0.9);
      leaf.castShadow = true;
      bush.add(leaf);
    }

    bush.position.set(x, 0.04, z);
    group.add(bush);
  }
}

function addGroundPebbles(group, color) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.01
  });

  const positions = [
    [-8.5, -9.4],
    [-4.2, -9.1],
    [2.8, -9.3],
    [7.4, -9.2],
    [-9.6, 9.2],
    [-3.5, 9.3],
    [4.6, 9.1],
    [9.3, 8.9],
    [-12.0, -2.5],
    [12.0, 2.8]
  ];

  for (const [x, z] of positions) {
    const pebbleGroup = new THREE.Group();
    pebbleGroup.userData.isStageDecoration = true;

    const count = 2 + Math.floor(rand(0, 3));

    for (let i = 0; i < count; i++) {
      const pebble = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rand(0.08, 0.18), 0),
        material
      );

      pebble.position.set(
        rand(-0.35, 0.35),
        rand(0.05, 0.12),
        rand(-0.35, 0.35)
      );
      pebble.scale.y = rand(0.35, 0.75);
      pebble.rotation.y = rand(0, Math.PI * 2);
      pebble.castShadow = true;
      pebble.receiveShadow = true;
      pebbleGroup.add(pebble);
    }

    pebbleGroup.position.set(x, 0.03, z);
    group.add(pebbleGroup);
  }
}

function addCanyonRidgeLine(group, material, x, zStart, zEnd, count) {
  const step = (zEnd - zStart) / Math.max(1, count - 1);

  for (let i = 0; i < count; i++) {
    const height = rand(1.7, 3.6);
    const rock = createRockSpire({
      height,
      radius: rand(0.34, 0.72),
      color: material.color.getHex(),
      material
    });

    rock.position.set(
      x + rand(-0.22, 0.22),
      height / 2 - 0.05,
      zStart + step * i + rand(-0.2, 0.2)
    );
    rock.rotation.y = rand(0, Math.PI * 2);
    rock.scale.x *= rand(0.75, 1.25);
    rock.scale.z *= rand(0.75, 1.25);
    group.add(rock);
  }
}

function addCanyonRidgeLineHorizontal(group, material, xStart, z, count) {
  for (let i = 0; i < count; i++) {
    const height = rand(1.6, 3.2);
    const rock = createRockSpire({
      height,
      radius: rand(0.3, 0.65),
      color: material.color.getHex(),
      material
    });

    rock.position.set(
      xStart + i * 2.8 + rand(-0.28, 0.28),
      height / 2 - 0.05,
      z + rand(-0.18, 0.18)
    );
    rock.rotation.y = rand(0, Math.PI * 2);
    group.add(rock);
  }
}

function createTreeCluster({ leafColor, trunkColor, count }) {
  const group = new THREE.Group();
  group.userData.isStageDecoration = true;

  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: trunkColor,
    roughness: 0.85
  });

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: leafColor,
    roughness: 0.78
  });

  for (let i = 0; i < count; i++) {
    const tree = new THREE.Group();
    tree.userData.isStageDecoration = true;

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.1, 0.5, 6),
      trunkMaterial
    );
    trunk.position.y = 0.25;
    trunk.castShadow = true;
    tree.add(trunk);

    const leaves = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.34, 0),
      leafMaterial
    );
    leaves.position.y = 0.68;
    leaves.castShadow = true;
    tree.add(leaves);

    tree.position.set(rand(-0.45, 0.45), 0, rand(-0.45, 0.45));
    tree.rotation.y = rand(0, Math.PI * 2);
    tree.scale.setScalar(rand(0.82, 1.22));
    group.add(tree);
  }

  return group;
}

function createRoundedHill(topColor, sideColor) {
  const group = new THREE.Group();
  group.userData.isStageDecoration = true;

  const side = new THREE.Mesh(
    new THREE.CylinderGeometry(0.84, 1.05, 0.24, 18),
    new THREE.MeshStandardMaterial({
      color: sideColor,
      roughness: 0.95
    })
  );
  side.position.y = 0.12;
  side.receiveShadow = true;
  group.add(side);

  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.84, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: topColor,
      roughness: 0.9
    })
  );
  top.position.y = 0.2;
  top.scale.y = 0.36;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  return group;
}

function createRockSpire({ height, radius, color, material = null }) {
  const finalMaterial =
    material ??
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.96,
      metalness: 0.02
    });

  const rock = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 5),
    finalMaterial
  );

  rock.castShadow = true;
  rock.receiveShadow = true;

  return rock;
}

function createLowPolyMountain({ height, material, snowMaterial, snowCap }) {
  const group = new THREE.Group();
  group.userData.isStageDecoration = true;

  const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(2.6, height, 5),
    material
  );
  mountain.position.y = height / 2;
  mountain.castShadow = true;
  mountain.receiveShadow = true;
  group.add(mountain);

  if (snowCap) {
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(0.82, height * 0.27, 5),
      snowMaterial
    );
    cap.position.y = height * 0.87;
    cap.castShadow = true;
    group.add(cap);
  }

  return group;
}

function createCrystalCluster({ colorA, colorB, count, maxHeight }) {
  const group = new THREE.Group();
  group.userData.isStageDecoration = true;

  const materialA = new THREE.MeshStandardMaterial({
    color: colorA,
    emissive: colorA,
    emissiveIntensity: 0.25,
    roughness: 0.35,
    metalness: 0.04,
    transparent: true,
    opacity: 0.78
  });

  const materialB = new THREE.MeshStandardMaterial({
    color: colorB,
    emissive: colorB,
    emissiveIntensity: 0.18,
    roughness: 0.4,
    metalness: 0.04,
    transparent: true,
    opacity: 0.7
  });

  for (let i = 0; i < count; i++) {
    const height = rand(0.55, maxHeight);
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(rand(0.11, 0.22), height, 5),
      i % 2 === 0 ? materialA : materialB
    );

    crystal.position.set(
      rand(-0.48, 0.48),
      height / 2,
      rand(-0.48, 0.48)
    );
    crystal.rotation.z = rand(-0.18, 0.18);
    crystal.rotation.y = rand(0, Math.PI * 2);
    crystal.castShadow = true;
    group.add(crystal);
  }

  return group;
}

function createRuinCluster() {
  const group = new THREE.Group();
  group.userData.isStageDecoration = true;

  const material = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.94
  });

  for (let i = 0; i < 4; i++) {
    const height = rand(0.65, 1.45);
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, height, 8),
      material
    );

    column.position.set(rand(-0.55, 0.55), height / 2, rand(-0.42, 0.42));
    column.rotation.z = rand(-0.08, 0.08);
    column.castShadow = true;
    column.receiveShadow = true;
    group.add(column);
  }

  const slab = createBox({
    width: 1.2,
    height: 0.16,
    depth: 0.35,
    material,
    position: [0, 0.12, 0.48],
    castShadow: true
  });
  slab.rotation.y = rand(-0.25, 0.25);
  group.add(slab);

  return group;
}

function createVolcanicCluster() {
  const group = new THREE.Group();
  group.userData.isStageDecoration = true;

  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f1d12,
    roughness: 0.96
  });

  const lavaMaterial = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.78
  });

  const height = rand(0.85, 1.65);
  const rock = createRockSpire({
    height,
    radius: rand(0.32, 0.55),
    color: 0x3f1d12,
    material: rockMaterial
  });
  rock.position.y = height / 2;
  group.add(rock);

  const lavaGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.55, 0.035, 20),
    lavaMaterial
  );
  lavaGlow.position.y = 0.08;
  group.add(lavaGlow);

  return group;
}

function createSwampPatch() {
  const group = new THREE.Group();
  group.userData.isStageDecoration = true;

  const mud = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.95, 0.055, 24),
    new THREE.MeshStandardMaterial({
      color: 0x2f3f1d,
      roughness: 1
    })
  );
  mud.position.y = 0.03;
  mud.receiveShadow = true;
  group.add(mud);

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.63, 0.68, 0.035, 24),
    new THREE.MeshBasicMaterial({
      color: 0x166534,
      transparent: true,
      opacity: 0.48
    })
  );
  water.position.y = 0.07;
  group.add(water);

  const reedsMaterial = new THREE.MeshStandardMaterial({
    color: 0x84cc16,
    roughness: 0.86
  });

  for (let i = 0; i < 6; i++) {
    const height = rand(0.28, 0.55);
    const reed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.024, height, 5),
      reedsMaterial
    );
    reed.position.set(
      rand(-0.55, 0.55),
      height / 2 + 0.08,
      rand(-0.55, 0.55)
    );
    reed.rotation.z = rand(-0.18, 0.18);
    group.add(reed);
  }

  return group;
}

function addLavaCrack(group, x, z, length) {
  const crack = new THREE.Group();
  crack.userData.isStageDecoration = true;

  const material = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.75
  });

  for (let i = 0; i < 5; i++) {
    const segment = createBox({
      width: length / 5,
      height: 0.035,
      depth: 0.08,
      material,
      position: [
        x + i * (length / 5) - length / 2,
        0.08,
        z + rand(-0.12, 0.12)
      ]
    });

    segment.rotation.y = rand(-0.35, 0.35);
    crack.add(segment);
  }

  group.add(crack);
}

function createBox({
  width,
  height,
  depth,
  material,
  position = [0, 0, 0],
  castShadow = false,
  receiveShadow = false
}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );

  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  mesh.userData.isStageDecoration = true;

  return mesh;
}

function getStageColors(effectId) {
  const palettes = {
    forest_balance: {
      foundation: 0x071d12,
      rim: 0x164e2b,
      cliff: 0x12351f,
      mountain: 0x0f3d25,
      snow: 0xdbeafe,
      portal: 0xfacc15,
      backWall: 0x0b2518,
      platform: 0x102f20,
      towerMetal: 0x214331,
      signal: 0x22c55e,
      cable: 0x0f172a,
      debris: 0x1b4332,
      serviceRoad: 0x0d271a,
      crate: 0x3f2b16,
      channel: 0x06120d,
      outerLeaf: 0x0f3f25,
      outerTrunk: 0x4a2c16
    },
    canyon_wind: {
      foundation: 0x24130a,
      rim: 0x7c3f16,
      cliff: 0x6b3517,
      mountain: 0x8a4a1f,
      snow: 0xfef3c7,
      portal: 0xfb923c,
      backWall: 0x3a1c0d,
      platform: 0x5b2a12,
      towerMetal: 0x7c3f16,
      signal: 0xfacc15,
      cable: 0x1c0f08,
      debris: 0x6b3517,
      serviceRoad: 0x3a1c0d,
      crate: 0x5b3417,
      channel: 0x1c0f08,
      outerLeaf: 0x7c3f16,
      outerTrunk: 0x4a2c16
    },
    frozen_chill: {
      foundation: 0x082f49,
      rim: 0x0e7490,
      cliff: 0x164e63,
      mountain: 0x1e3a8a,
      snow: 0xe0f2fe,
      portal: 0x67e8f9,
      backWall: 0x0c344d,
      platform: 0x155e75,
      towerMetal: 0x0e7490,
      signal: 0x67e8f9,
      cable: 0x082f49,
      debris: 0x164e63,
      serviceRoad: 0x0c344d,
      crate: 0x155e75,
      channel: 0x061826,
      outerLeaf: 0x164e63,
      outerTrunk: 0x082f49
    },
    ancient_armor: {
      foundation: 0x1e1b2e,
      rim: 0x4c3b73,
      cliff: 0x3b344d,
      mountain: 0x57506b,
      snow: 0xd6d3d1,
      portal: 0xc4b5fd,
      backWall: 0x242136,
      platform: 0x393552,
      towerMetal: 0x78716c,
      signal: 0xc4b5fd,
      cable: 0x1c1a27,
      debris: 0x57534e,
      serviceRoad: 0x242136,
      crate: 0x4c3b73,
      channel: 0x151320,
      outerLeaf: 0x393552,
      outerTrunk: 0x292524
    },
    lava_pressure: {
      foundation: 0x1c0a06,
      rim: 0x7c2d12,
      cliff: 0x3f1d12,
      mountain: 0x7c2d12,
      snow: 0xfef3c7,
      portal: 0xf97316,
      backWall: 0x260d07,
      platform: 0x3f1d12,
      towerMetal: 0x7c2d12,
      signal: 0xf97316,
      cable: 0x170704,
      debris: 0x2a120a,
      serviceRoad: 0x260d07,
      crate: 0x3f1d12,
      channel: 0x120503,
      outerLeaf: 0x3f1d12,
      outerTrunk: 0x2a120a
    },
    swamp_mud: {
      foundation: 0x101c0a,
      rim: 0x365314,
      cliff: 0x243516,
      mountain: 0x2f3f1d,
      snow: 0xd9f99d,
      portal: 0x84cc16,
      backWall: 0x14220d,
      platform: 0x243516,
      towerMetal: 0x365314,
      signal: 0x84cc16,
      cable: 0x0b1207,
      debris: 0x2f3f1d,
      serviceRoad: 0x14220d,
      crate: 0x3f2a12,
      channel: 0x071007,
      outerLeaf: 0x365314,
      outerTrunk: 0x3f2a12
    },
    crystal_resonance: {
      foundation: 0x071a24,
      rim: 0x155e75,
      cliff: 0x164e63,
      mountain: 0x155e75,
      snow: 0xe0f2fe,
      portal: 0x22d3ee,
      backWall: 0x092536,
      platform: 0x164e63,
      towerMetal: 0x155e75,
      signal: 0x22d3ee,
      cable: 0x061923,
      debris: 0x155e75,
      serviceRoad: 0x092536,
      crate: 0x155e75,
      channel: 0x061923,
      outerLeaf: 0x164e63,
      outerTrunk: 0x092536
    }
  };

  return palettes[effectId] ?? palettes.forest_balance;
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose?.());
      } else {
        child.material.dispose?.();
      }
    }
  });
}

function createSeed(text) {
  let seed = 0;

  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  }

  return seed || 1;
}

function rand(min, max) {
  randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
  const t = randomSeed / 4294967295;

  return min + (max - min) * t;
}