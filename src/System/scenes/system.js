import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Объявление переменных
let camera, scene, renderer, controls, dragControls;
let listener, sound;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let draggableObjects = []; // Массив для draggable объектов

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
  setupUploadButton();
  window.addEventListener('resize', onWindowResize);
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

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));
}

function setupLighting() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
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
  
}

function setupDragControls() {
  dragControls = new DragControls(draggableObjects, camera, renderer.domElement);

  // Аннулируем OrbitControls при перетаскивании
  dragControls.addEventListener('dragstart', function (event) {
    controls.enabled = false;
  });

  dragControls.addEventListener('dragend', function (event) {
    controls.enabled = true;
  });
}

function loadSound() {
  listener = new THREE.AudioListener();
  camera.add(listener);

  sound = new THREE.Audio(listener);

  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(
    '/src/System/audio/sound.wav', // Убедитесь в корректности пути
    (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(0.5);
      sound.play();
    },
    undefined,
    (err) => {
      console.error('Ошибка загрузки звука:', err);
    }
  );
}

function setupUploadButton() {
  const uploadButton = document.getElementById('upload-button');
  const fileInput = document.getElementById('file-input');

  uploadButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      loadGLTFModel(file);
    }
  });
}

function loadGLTFModel(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const contents = e.target.result;

    const loader = new GLTFLoader();
    loader.parse(
      contents,
      '', // Указываем базовый путь, пустая строка, так как файл загружается из памяти
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        draggableObjects.push(model);
        dragControls.transformGroup = false; // Если нужно перемещать группы объектов, установите true

        console.log('Модель загружена:', model);
      },
      (error) => {
        console.error('Ошибка при загрузке GLTF модели:', error);
      }
    );
  };

  // Читаем файл как ArrayBuffer, необходим для parse метода GLTFLoader
  reader.readAsArrayBuffer(file);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });
}

// Экспортируемые функции, если нужны
//export function initSystemScene() {
  //init();
//}

export function animateSystemScene() {
  animate();
}