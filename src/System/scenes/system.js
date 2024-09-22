import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// Declare variables
let camera, scene, renderer, controls, dragControls;
let listener, sound;
let controller1, controller2;
let draggableObjects = []; // Array for draggable objects
let video, videoTexture, videoMaterial, videoPlane;

// Expose a global function to set the scene background color
window.setSceneBackgroundColor = function(color) {
  if (scene) {
    scene.background = new THREE.Color(color);
  }
  // Also handle the videoPlane visibility if needed
};

// Initialize and animate the scene
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
  window.addEventListener('resize', onWindowResize);


   // Call button management functions after DOM loads
   document.addEventListener('DOMContentLoaded', () => {
    // Update language initially
    updateLanguage(currentLanguage);
  
    // Language Switcher Event Listener
    document.getElementById('language-switcher').addEventListener('click', () => {
      currentLanguage = currentLanguage === 'en' ? 'ru' : 'en';
      updateLanguage(currentLanguage);
      document.getElementById('language-switcher').textContent = currentLanguage.toUpperCase();
    });
  
    // Manage Welcome Window
    document.getElementById('startButton').addEventListener('click', () => {
      document.getElementById('welcomeWindow').classList.add('hidden');
    });
  
    // Background Color Button Event Listener
    document.getElementById('background-color-button').addEventListener('click', () => {
      document.getElementById('color-picker').click(); // Trigger the color picker
    });
  
    // Color Picker Change Event Listener
    document.getElementById('color-picker').addEventListener('input', (event) => {
      const selectedColor = event.target.value;
      document.body.style.backgroundColor = selectedColor;
  
      // Set the scene background color in Three.js
      if (typeof setSceneBackgroundColor === 'function') {
        setSceneBackgroundColor(selectedColor);
      }
    });
  });
}

function setupScene() {
  scene = new THREE.Scene();
  // Set initial background color
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
  // Add VR button to enter VR mode
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

  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 2,
  });

  const line = new THREE.Line(geometry, lineMaterial);
  line.name = 'line';
  line.scale.z = 5;

  controller1.add(line.clone());
  controller2.add(line.clone());

  // Add controller models
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

  // Disable OrbitControls during dragging
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
    './src/System/audio/sound.wav', // Ensure the path is correct
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
    console.error('Could not find upload-button or file-input elements in the DOM.');
    return;
  }

  uploadButton.addEventListener('click', () => {
    console.log('Upload button clicked.');
    fileInput.click();
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('File selected:', file.name);
      loadGLTFModel(file);
    } else {
      console.log('No file selected.');
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
      scene.add(model);
      draggableObjects.push(model);

      // Update DragControls with the new object
      setupDragControls();

      console.log('Model loaded:', model);

      // Release memory
      URL.revokeObjectURL(url);
    },
    undefined,
    (error) => {
      console.error('Error loading GLTF model:', error);
    }
  );
}

function setupWebcamBackground() {
  // Create video element
  video = document.createElement('video');
  video.style.display = 'none'; // Hide video from the screen
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  document.body.appendChild(video); // Add to DOM so browsers can play the video

  // Request access to the webcam
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
      return video.play();
    })
    .then(() => {
      // Create texture from video
      videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBFormat;

      // Create material with video texture
      videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });

      // Create a plane for the background
      const geometry = new THREE.PlaneGeometry(16, 9); // 16:9 aspect ratio
      videoPlane = new THREE.Mesh(geometry, videoMaterial);

      // Set position and scale of the plane
      videoPlane.position.z = -10; // Place the plane behind other objects
      scene.add(videoPlane);

      // Initially hide the video plane
      videoPlane.visible = false;

      // Update the plane size based on the window
      updateVideoPlane();
    })
    .catch((error) => {
      console.error('Error accessing the webcam:', error);
      // In case of error, set a fallback background color
      scene.background = new THREE.Color(0x000000);
    });
}

function updateVideoPlane() {
  if (videoPlane) {
    const aspect = window.innerWidth / window.innerHeight;
    const videoAspect = 16 / 9; // Video aspect ratio

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
    console.error('Could not find toggle-video-background-button in the DOM.');
    return;
  }

  toggleVideoBackgroundButton.addEventListener('click', () => {
    if (videoPlane) {
      videoPlane.visible = !videoPlane.visible;
      // Track visibility for language update
      window.videoPlaneVisible = videoPlane.visible;
      toggleVideoBackgroundButton.textContent = videoPlane.visible ? 'Disable Webcam' : 'Enable Webcam';
    } else {
      alert('Video background is not available.');
    }
  });
}

function setupBackgroundColorButton() {
  const backgroundColorButton = document.getElementById('background-color-button');
  const colorPicker = document.getElementById('color-picker');

  if (!backgroundColorButton || !colorPicker) {
    console.error('Could not find background-color-button or color-picker in the DOM.');
    return;
  }

  // Show color picker when the button is clicked
  backgroundColorButton.addEventListener('click', () => {
    colorPicker.click(); // Trigger the color picker
  });

  // When the user selects a color
  colorPicker.addEventListener('input', (event) => {
    const selectedColor = event.target.value;
    document.body.style.backgroundColor = selectedColor;

    // Set the scene background color
    if (window.setSceneBackgroundColor) {
      window.setSceneBackgroundColor(selectedColor);
    }
  });
}


// Function to set up the start button

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update the video plane size
  updateVideoPlane();
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  // Update controls
  if (controls) controls.update();

  // Render the scene
  renderer.render(scene, camera);
}
