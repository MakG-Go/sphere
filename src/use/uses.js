import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { Reflector } from "three/examples/jsm/objects/Reflector";
import * as THREE from "three";

export const useCanvasResize = (camera, canvas, renderer) => {
  window.addEventListener("resize", () => {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // Update camera
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
};

export const useCreateControls = (options) => {
  let controls = new OrbitControls(options.camera, options.canvas);

  controls.enableDamping = options.enableDamping;
  controls.minDistance = options.minDistance;
  controls.maxDistance = options.maxDistance;

  return controls;
};

export const useTransformControl = (options) => {
  const transformControls = new TransformControls(
    options.camera,
    options.renderer.domElement
  );

  options.scene.add(transformControls);

  transformControls.addEventListener("mouseDown", function () {
    options.orbitControls.enabled = false;
  });

  transformControls.addEventListener("mouseUp", function () {
    options.orbitControls.enabled = true;
  });

  window.addEventListener("keydown", function (event) {
    switch (event.key) {
      case "g":
        console.log("g");
        transformControls.setMode("translate");
        break;
      case "r":
        console.log("r");
        transformControls.setMode("rotate");
        break;
      // case "s":
      //   console.log("s");
      //   transformControls.setMode("scale");
      //   break;
    }
  });

  return transformControls;
};

export const useTextureLoader = (path, storage) => {
  const regex = /\/([^\/]+)\./;
  const textureLoader = new THREE.TextureLoader();

  let names = ["color", "height", "normal", "arm"];

  names.forEach((item) => {
    if (item in storage) return;
    storage[item] = textureLoader.load(`${path}${item}.jpg`);
  });
};

export class useCreateModel {
  constructor(params) {
    this.Init(params);
  }

  Init(params) {
    this.params = params;
    this.LoadModels(this.params);
  }

  LoadModels(params) {
    this.params = params;

    new GLTFLoader(this.params.preloader).load(this.params.model, (gltf) => {
      this.model = gltf.scene;
      this.model.updateMatrixWorld(true);

      this.params.meshStore.push(gltf.scene);


      this.model.name = this.params.name;

      if (this.params.scale) {
        this.model.scale.set(
          // {...this.params.scale}
          this.params.scale.x,
          this.params.scale.y,
          this.params.scale.z
        );
      }

      if (this.params.rotation) {
        (this.model.rotation.x = this.params.rotation.x),
          (this.model.rotation.y = this.params.rotation.y),
          (this.model.rotation.z = this.params.rotation.z);
      }

      if (this.params.position) {
        (this.model.position.x = this.params.position.x),
          (this.model.position.y = this.params.position.y),
          (this.model.position.z = this.params.position.z);
      }

      if (this.params.controls) {
        this.params.controls.attach(gltf.scene);
      }

      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;

          child.material.wireframe = false;
          child.material.envMap = this.params.material;
          child.material.envMapIntensity = 5;
          child.material.needsUpdate = true;
          child.material.side = THREE.DoubleSide;

          child.userData.parentName = this.params.name;
          child.userData.originalColor = child.material.color.clone();

          if (this.params.group) {
            this.params.group.add(child);
    
            console.log(this.params.group)
          }
        }
      });


      this.params.scene.add(this.model);
      return gltf.scene;
    });
  }
}
