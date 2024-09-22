import * as THREE from 'three';

let camera, scene, renderer;

init();
animate();

function init() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Create the scene
    scene = new THREE.Scene();

    // Set up the camera
    camera = new THREE.PerspectiveCamera(75, screenWidth / screenHeight, 0.1, 1000);
    camera.position.z = 5;

    // Set up the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(screenWidth, screenHeight);
    document.body.appendChild(renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Handle Start button click to load the next scene
    document.getElementById('startButton').addEventListener('click', loadSystemScene);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    // Render the scene
    renderer.render(scene, camera);
}

function loadSystemScene() {
    // Remove start button and clean up current scene
    document.getElementById('startButton').remove();

    // Dispose of current renderer if needed
    // renderer.dispose(); // Commented out to prevent issues

    // Dynamically load and switch to system.js
    import('./src/System/scenes/system.js').then((module) => {
    }).catch((error) => {
        console.error('Failed to load system.js:', error);
    });
}

console.log(import.meta.env.VITE_API_KEY);
console.log(import.meta.env.VITE_APP_TITLE);
