import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';

let camera, scene, renderer, controls, dragControls;
let listener, sound;
let controller1, controller2;
let draggableObjects = [];
let video, videoTexture, videoMaterial, videoPlane;
let composer, bloomPass, fxaaPass, ssaoPass;

window.setSceneBackgroundColor = function (color) {
  if (scene) scene.background = new THREE.Color(color);
};

init();
animate();

function init() {
  setupScene();
  setupCamera();
  setupRenderer();
  setupLighting();
  setupControls();
  setupControllers();
  setupDragControls();
  loadSound();
  setupToggleVideoBackgroundButton();
  setupWebcamBackground();
  setupBackgroundColorButton();
  setupUploadButton();
  setupPostProcessing();
  window.addEventListener('resize', onWindowResize);

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('language-switcher').addEventListener('click', () => {
      currentLanguage = currentLanguage === 'en' ? 'ru' : 'en';
      updateLanguage(currentLanguage);
      document.getElementById('language-switcher').textContent = currentLanguage.toUpperCase();
    });

    document.getElementById('startButton').addEventListener('click', () => {
      document.getElementById('welcomeWindow').classList.add('hidden');
    });

    document.getElementById('background-color-button').addEventListener('click', () => {
      document.getElementById('color-picker').click();
    });

    document.getElementById('color-picker').addEventListener('input', (event) => {
      const selectedColor = event.target.value;
      document.body.style.backgroundColor = selectedColor;
      if (typeof setSceneBackgroundColor === 'function') {
        setSceneBackgroundColor(selectedColor);
      }
    });
  });
}

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdddddd);
}

function setupCamera() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.6, 3);
}

function setupRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.xr.enabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false; // Важно для пост-обработки
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));
}

function setupLighting() {
  // Полуширотный свет
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  // Направленный свет
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
  directionalLight.position.set(-10, 10, 10);
  directionalLight.castShadow = true;

  // Настройка теней
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  const shadowCamera = directionalLight.shadow.camera;
  shadowCamera.near = 0.5;
  shadowCamera.far = 100;
  shadowCamera.left = -10;
  shadowCamera.right = 10;
  shadowCamera.top = 10;
  shadowCamera.bottom = -10;
  directionalLight.shadow.radius = 4;
  directionalLight.shadow.bias = -0.0001;

  scene.add(directionalLight);

  // Добавление Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Цвет и интенсивность
  scene.add(ambientLight);

  // Опционально: отображение камеры теней для отладки
  /*
  const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
  scene.add(helper);
  */
}

function setupControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
}

function setupControllers() {
  controller1 = renderer.xr.getController(0);
  scene.add(controller1);
  controller2 = renderer.xr.getController(1);
  scene.add(controller2);
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
  const line = new THREE.Line(geometry, lineMaterial);
  line.name = 'line';
  line.scale.z = 5;
  controller1.add(line.clone());
  controller2.add(line.clone());
  const controllerModelFactory = new XRControllerModelFactory();
  const controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);
  const controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  scene.add(controllerGrip2);
}

function setupDragControls() {
  dragControls = new DragControls(draggableObjects, camera, renderer.domElement);
  dragControls.addEventListener('dragstart', () => {
    controls.enabled = false;
  });
  dragControls.addEventListener('dragend', () => {
    controls.enabled = true;
  });
}

function loadSound() {
  listener = new THREE.AudioListener();
  camera.add(listener);

  sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(
    './src/System/audio/sound.wav',
    (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(0.5);
      sound.play();
    },
    undefined,
    (err) => {
      console.error('Error loading sound:', err);
    }
  );
}

function setupUploadButton() {
  const uploadButton = document.getElementById('upload-button');
  const fileInput = document.getElementById('file-input');

  if (!uploadButton || !fileInput) {
    console.error('Не удалось найти элементы upload-button или file-input в DOM.');
    return;
  }

  uploadButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      loadGLTFModel(file);
    } else {
      console.log('Файл не выбран.');
    }
  });
}

function loadGLTFModel(file) {
  const url = URL.createObjectURL(file);
  const loader = new GLTFLoader();

  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Настройка AO карты, если она есть
          if (child.material && child.material.map) {
            child.material.aoMap = child.material.map; // Предполагается, что AO карта встроена
            child.material.aoMapIntensity = 1.0;
            child.geometry.setAttribute('uv2', new THREE.BufferAttribute(child.geometry.attributes.uv.array, 2));
          }
        }
      });
      scene.add(model);
      draggableObjects.push(model);
      setupDragControls();
      URL.revokeObjectURL(url);
    },
    undefined,
    (error) => {
      console.error('Ошибка при загрузке GLTF модели:', error);
    }
  );
}

function setupWebcamBackground() {
  video = document.createElement('video');
  video.style.display = 'none';
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  document.body.appendChild(video);

  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
      return video.play();
    })
    .then(() => {
      videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBFormat;

      videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });

      const geometry = new THREE.PlaneGeometry(16, 9);
      videoPlane = new THREE.Mesh(geometry, videoMaterial);
      videoPlane.position.z = -10;
      scene.add(videoPlane);
      videoPlane.visible = false;
      updateVideoPlane();
    })
    .catch((error) => {
      console.error('Ошибка доступа к веб-камере:', error);
      scene.background = new THREE.Color(0x000000);
    });
}

function updateVideoPlane() {
  if (videoPlane) {
    const aspect = window.innerWidth / window.innerHeight;
    const videoAspect = 16 / 9;
    if (aspect > videoAspect) {
      videoPlane.scale.set(aspect / videoAspect, 1, 1);
    } else {
      videoPlane.scale.set(1, videoAspect / aspect, 1);
    }
  }
}

function setupToggleVideoBackgroundButton() {
  const toggleVideoBackgroundButton = document.getElementById('toggle-video-background-button');

  if (!toggleVideoBackgroundButton) {
    console.error('Не удалось найти элемент toggle-video-background-button в DOM.');
    return;
  }

  toggleVideoBackgroundButton.addEventListener('click', () => {
    if (videoPlane) {
      videoPlane.visible = !videoPlane.visible;
      window.videoPlaneVisible = videoPlane.visible;
      toggleVideoBackgroundButton.textContent = videoPlane.visible
        ? 'Отключить веб-камеру'
        : 'Включить веб-камеру';
    } else {
      alert('Видео фон недоступен.');
    }
  });
}

function setupBackgroundColorButton() {
  const backgroundColorButton = document.getElementById('background-color-button');
  const colorPicker = document.getElementById('color-picker');

  if (!backgroundColorButton || !colorPicker) {
    console.error('Не удалось найти элементы background-color-button или color-picker в DOM.');
    return;
  }

  backgroundColorButton.addEventListener('click', () => {
    colorPicker.click();
  });

  colorPicker.addEventListener('input', (event) => {
    const selectedColor = event.target.value;
    document.body.style.backgroundColor = selectedColor;
    if (window.setSceneBackgroundColor) {
      window.setSceneBackgroundColor(selectedColor);
    }
  });
}

function setupPostProcessing() {
  composer = new EffectComposer(renderer);
  
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Настройка SSAO Pass
  ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
  ssaoPass.kernelRadius = 16; // Радиус выборки
  ssaoPass.minDistance = 0.005; // Минимальная дистанция для AO
  ssaoPass.maxDistance = 0.1;   // Максимальная дистанция для AO
  ssaoPass.output = SSAOPass.OUTPUT.Default; // Тип вывода
  composer.addPass(ssaoPass);

  // Настройка эффекта Bloom
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.1, // Интенсивность
    0.1, // Радиус
    0.85 // Порог
  );
  composer.addPass(bloomPass);

  // Настройка FXAA Pass
  fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  fxaaPass.renderToScreen = true;
  composer.addPass(fxaaPass);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);

  if (fxaaPass) {
    fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  }

  if (ssaoPass) {
    ssaoPass.setSize(window.innerWidth, window.innerHeight);
  }

  updateVideoPlane();
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  if (controls) controls.update();
  if (videoTexture) videoTexture.needsUpdate = true;
  composer.render();
}
