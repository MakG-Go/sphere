<script setup>
import * as THREE from "three";
import * as dat from "lil-gui";
import { gsap } from "gsap";
import {
  ref,
  onBeforeMount,
  onMounted,
  onUnmounted,
  reactive,
  unref,
} from "vue";
import { clock } from "@/constants.js";
import { LoadingManager } from "three";
import {
  useCanvasResize,
  useCreateControls,
  useCreateModel,
  useTransformControl,
} from "@/use/uses.js";

const enviermentMap = new URL("/envierment", import.meta.url).href + "/";
const models = new URL("/models", import.meta.url).href + "/";

let delta,
  prev,
  controls,
  ambientLight,
  pointLight,
  boxMaterial,
  boxGeometry,
  transformControls,
  door;

const scale = {
  total: 1,
  asdasd: 555,
};

const gui = new dat.GUI({
  width: 500,
  closeFolders: true,
});

const sizes = ref(null);

const lightParams = ref({
  color: 0x404040,
  intensity: 50,
  distance: 100,
  x: 0.8,
  y: 1.375,
  z: 1.56,
});

const boxMaterialParametrs = ref({
  side: THREE.DoubleSide,
  wireframe: false,
  metalness: 0.7,
  roughness: 0.2,
  color: "#ff361c",
  clearcoat: 1,
  clearcoatRoughness: 0.1,
});

const boxGeometryParametrs = ref({
  x: 1,
  y: 1,
  z: 1,
});

const webglCanvas = ref(null);

const mashes = ref(new Array());

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera();

const renderer = new THREE.WebGLRenderer({ antialias: true });

const createCamera = (params) => {
  camera.fov = params.fov;
  camera.aspect = params.aspect;
  camera.near = params.near;
  camera.far = params.far;
  camera.updateProjectionMatrix();

  camera.position.x = params.x;
  camera.position.y = params.y;
  camera.position.z = params.z;

  scene.add(camera);
};

const createRenderer = () => {
  renderer.setSize(sizes.value.width, sizes.value.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 1.8;

  webglCanvas.value.appendChild(renderer.domElement);
};

const createLight = (params) => {
  ambientLight = new THREE.AmbientLight(0x404040, 0.4);

  pointLight = new THREE.PointLight(
    params.color,
    params.intensity,
    params.distance
  );

  pointLight.position.x = params.x;
  pointLight.position.y = params.y;
  pointLight.position.z = params.z;

  pointLight.shadow.normalBias = 0.001;
  pointLight.shadow.bias = 0.001;
  pointLight.castShadow = true;
  // pointLight.shadow.mapSize.set(1024, 1024);

  scene.add(ambientLight);
  scene.add(pointLight);
};

const createEnvierment = () => {
  let cubeTextureLoader = new THREE.CubeTextureLoader();
  let envMap = cubeTextureLoader.load([
    `${enviermentMap}px.jpg`,
    `${enviermentMap}nx.jpg`,
    `${enviermentMap}py.jpg`,
    `${enviermentMap}ny.jpg`,
    `${enviermentMap}pz.jpg`,
    `${enviermentMap}nz.jpg`,
  ]);
  envMap.colorSpace = THREE.SRGBColorSpace;
  scene.background = envMap;
  scene.environment = envMap;
  // envMap.minFilter = THREE.NearestFilter;
  // envMap.magFilter = THREE.NearestFilter;
  envMap.generateMipmaps = false;
  envMap.envMapIntensity = 7;
  // envMap.mapping = THREE.EquirectangularReflectionMapping
};

const createPreloader = () => {
  return new LoadingManager(
    () => {
      console.log("done");
      createGui();
    },
    (itemUrl, itemsLoaded, itemsTotal) => {
      let loadProc = itemsLoaded / itemsTotal;
    }
  );
};

const createSphere = (material) => {
  const glassMaterial = new THREE.MeshPhysicalMaterial({ ...material });
  const glassGeometry = new THREE.SphereGeometry(0.5, 28, 28, 1);
  const sphere = new THREE.Mesh(glassGeometry, glassMaterial);
  sphere.castShadow = true;
  sphere.position.x = -2;
  scene.add(sphere);
};

const createBox = (material, geometry) => {
  boxMaterial = new THREE.MeshPhysicalMaterial({ ...material });
  boxGeometry = new THREE.BoxGeometry(geometry.x, geometry.y, geometry.z);
  let box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
};

const createPlane = (material, geometry) => {
  let planeMaterial = new THREE.MeshStandardMaterial({ ...material });
  let playGeometry = new THREE.PlaneGeometry(geometry.x, geometry.y);
  let plane = new THREE.Mesh(playGeometry, planeMaterial);
  plane.rotateX(Math.PI / 2);
  plane.position.y = -0.5;
  plane.receiveShadow = true;

  scene.add(plane);
};

const resizeModel = (toScale) => {
  door.model.scale.set(toScale, toScale, toScale);
};

const createGui = () => {
  scene.add(new THREE.AxesHelper(2));

  let light = gui.addFolder("Light");
  let box_Material = gui.addFolder("Box Material");
  let door_scale = gui.addFolder("Scale");

  door_scale
    .add(scale, "total")
    .min(0.2)
    .max(3)
    .step(0.001)
    .name("Scale")
    .onChange(() => {
      resizeModel(scale.total);
    });

  box_Material
    .addColor(boxMaterialParametrs.value, "color")
    .name("Box color")
    .onChange(() => {
      boxMaterial.color.set(boxMaterialParametrs.value.color);
    });

  box_Material
    .add(boxMaterial, "metalness")
    .min(0)
    .max(1)
    .step(0.001)
    .name("Metalness");

  box_Material
    .add(boxMaterial, "roughness")
    .min(0)
    .max(1)
    .step(0.001)
    .name("Roughness");

  light
    .add(pointLight.position, "x")
    .min(-1)
    .max(5)
    .step(0.001)
    .name("P_Light X");
  light
    .add(pointLight.position, "y")
    .min(-1)
    .max(5)
    .step(0.001)
    .name("P_Light Y");
  light
    .add(pointLight.position, "z")
    .min(-1)
    .max(5)
    .step(0.001)
    .name("P_Light Z");
  light
    .add(pointLight, "intensity")
    .min(10)
    .max(50)
    .step(0.001)
    .name("P_Light intensity");
  light
    .add(ambientLight, "intensity")
    .min(0)
    .max(10)
    .step(0.001)
    .name("A_Light intensity");
};

const canvasTick = () => {
  const elapsedTime = clock.getElapsedTime();
  delta = elapsedTime - prev;
  prev = delta;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(canvasTick);
};

const init = () => {
  sizes.value = {
    width: webglCanvas.value.offsetWidth,
    height: webglCanvas.value.offsetHeight,
  };

  createCamera({
    fov: 45,
    aspect: sizes.value.width / sizes.value.height,
    near: 0.01,
    far: 50,
    x: 4,
    y: 2,
    z: 5,
  });

  createRenderer();

  controls = useCreateControls({
    camera: camera,
    canvas: webglCanvas.value,
    enableDamping: true,
    minDistance: 2,
    maxDistance: 7,
  });

  createLight(lightParams.value);

  createBox(boxMaterialParametrs.value, boxGeometryParametrs.value);

  createSphere({
    reflectivity: 0,
    transmission: 1.0,
    roughness: 0.2,
    metalness: 0,

    color: new THREE.Color(0xffffff),
    ior: 1.2,
    thickness: 10.0,
  });

  createPlane(
    {
      transparent: false,
      opacity: 1,
      side: THREE.DoubleSide,
      wireframe: false,
      metalness: 0.1,
      roughness: 0.8,
      color: "#ffffff",
    },
    {
      x: 10,
      y: 10,
    }
  );

  createEnvierment();

  transformControls = useTransformControl({
    camera,
    renderer,
    scene,
    orbitControls: controls,
  });

  door = new useCreateModel({
    model: `${models}door.glb`,
    scene: scene,
    scale: new THREE.Vector3(scale.total, scale.total, scale.total),
    meshStore: mashes.value,
    controls: transformControls,
    preloader: createPreloader(),

    rotation: {
      x: 0,
      y: Math.PI / 2,
      z: 0,
    },

    position: {
      x: 2,
      y: -0.5,
      z: 0,
    },
  });

  useCanvasResize(camera, webglCanvas.value, renderer);
};

onMounted(() => {
  init();
  canvasTick();
});
</script>

<template>
  <div class="canvas_instructions">
    <p>G : Move</p>
    <p>R : Rotate</p>
    <p>S : Scale</p>
  </div>
  <div ref="webglCanvas" class="canvas_compositions"></div>
</template>
