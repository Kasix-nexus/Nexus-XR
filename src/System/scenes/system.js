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
let draggableObjects = []; // Массив для draggable объектов
let video, videoTexture, videoMaterial, videoPlane;
let isWebcamBackground = true; // Флаг для текущего фона

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
  setupToggleVideoBackgroundButton(); // Настройка кнопки скрытия/показа фона
  setupWebcamBackground(); // Настройка вебкамеры
  window.addEventListener('resize', onWindowResize);
}

function setupScene() {
  scene = new THREE.Scene();
  // Установка начального цвета фона
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
    '/src/system/audio/Sound.wav', // Убедитесь в корректности пути
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

function setupWebcamBackground() {
  // Создаем элемент видео
  video = document.createElement('video');
  video.style.display = 'none'; // Скрываем видео с экрана
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  document.body.appendChild(video); // Добавляем в DOM, чтобы браузеры могли проигрывать видео

  // Запрашиваем доступ к вебкамере
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
      return video.play();
    })
    .then(() => {
      // Создаем текстуру из видео
      videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBFormat;

      // Создаем материал с видео текстурой
      videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });

      // Создаем плоскость для фона
      const geometry = new THREE.PlaneGeometry(16, 9); // Соотношение сторон 16:9
      videoPlane = new THREE.Mesh(geometry, videoMaterial);
      
      // Настраиваем положение и масштаб плоскости
      videoPlane.position.z = -10; // Располагаем плоскость позади остальных объектов
      scene.add(videoPlane);

      // Скрываем видеоплан изначально
      videoPlane.visible = false;

      // Обновляем размер плоскости в зависимости от окна
      updateVideoPlane();
    })
    .catch((error) => {
      console.error('Ошибка доступа к вебкамере:', error);
      // В случае ошибки можно установить резервный цвет фона
      scene.background = new THREE.Color(0x000000);
      isWebcamBackground = false;
    });
}

function updateVideoPlane() {
  if (videoPlane) {
    const aspect = window.innerWidth / window.innerHeight;
    const videoAspect = 16 / 9; // Соотношение сторон видео

    if (aspect > videoAspect) {
      videoPlane.scale.set(aspect / videoAspect, 1, 1);
    } else {
      videoPlane.scale.set(1, videoAspect / aspect, 1);
    }
  }
}

function setupToggleVideoBackgroundButton() {
  const toggleVideoBackgroundButton = document.getElementById('toggle-video-background-button');

  toggleVideoBackgroundButton.addEventListener('click', () => {
    if (videoPlane) {
      videoPlane.visible = !videoPlane.visible;
      toggleVideoBackgroundButton.textContent = videoPlane.visible ? 'Выключить WebCam' : 'Включить WebCam';
    } else {
      alert('Видео фон не доступен.');
    }
  });
}

function setupUploadButtonVisibility() {
  const startButton = document.getElementById('startButton');
  const uploadContainer = document.getElementById('upload-container');

  startButton.addEventListener('click', () => {
    // Скрываем кнопку Start
    startButton.style.display = 'none';
    // Показываем контейнер с кнопками
    uploadContainer.style.display = 'flex';
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  // Обновляем размер плоскости с видео
  updateVideoPlane();
}

function animate() {
  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });
}

// Экспортируемые функции, если нужны
//export function initSystemScene() {
//  init();
//}

export function animateSystemScene() {
  animate();
}

// Вызов функции для управления видимостью кнопок Start и Upload
document.addEventListener('DOMContentLoaded', () => {
  setupUploadButtonVisibility();
});

