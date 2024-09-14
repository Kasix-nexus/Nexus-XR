import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

let camera, scene, renderer, controls, dragControls, chair, listener, sound;
let controller1, controller2, controllerGrip1, controllerGrip2;

init();
animate();

function init() {
    setupScene();
    setupCamera();
    setupRenderer();
    setupLighting();
    loadSound();
    loadModel();
    setupControls();
    setupControllers();
    window.addEventListener('resize', onWindowResize);
}

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdddddd);
}

function setupCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

function loadSound() {
    listener = new THREE.AudioListener();
    camera.add(listener);

    sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('/src/System/audio/sound.wav', (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.5);
        sound.play();
    });
}

function loadModel() {
    const loader = new GLTFLoader();
    loader.load(
        '/src/System/models/Chair2.glb',
        (gltf) => {
            chair = gltf.scene;
            chair.scale.set(1, 1, 1);
            chair.position.set(0, 0, 0);
            scene.add(chair);

            // Initialize DragControls
            setupDragControls();
        },
        undefined,
        (error) => {
            console.error('An error occurred while loading the model:', error);
        }
    );
}

function setupDragControls() {
    dragControls = new DragControls([chair], camera, renderer.domElement);
    
    dragControls.addEventListener('dragstart', () => controls.enabled = false);
    dragControls.addEventListener('dragend', () => controls.enabled = true);
}
function onSelectStart() {
    // Handle select start
    console.log('Controller select start');
}

function onSelectEnd() {
    // Handle select end
    console.log('Controller select end');
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


export function initSystemScene() {
    function init() {
        // Setup scene
        setupScene();
    
        // Setup camera
        setupCamera();
    
        // Setup renderer
        setupRenderer();
    
        // Add lighting
        setupLighting();
    
        // Load sound and play it on start
        loadSound();
    
        // Load model
        loadModel();
    
        // Setup controls
        setupControls();
    
        // Setup VR controllers
        setupControllers();
    
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
    }
}

export function animateSystemScene() {
    function animate() {
        renderer.setAnimationLoop(() => {
            controls.update();
            renderer.render(scene, camera);
        });
    }
}