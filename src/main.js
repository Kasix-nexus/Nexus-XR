import * as THREE from 'three';

let camera, scene, renderer;

init();
animate();

function init() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, screenWidth / screenHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(screenWidth, screenHeight);
    document.body.appendChild(renderer.domElement);


    // Resize handling
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
    renderer.render(scene, camera);
}

function loadSystemScene() {
    // Remove start button and clean up current scene
    document.getElementById('startButton').remove();
    renderer.dispose();
    
    // Dynamically load and switch to system.js
    import('/src/system/scenes/System.js').then((module) => {
        module.animateSystemScene();
    }).catch((error) => {
        console.error('Failed to load system.js:', error);
    });
}

console.log(import.meta.env.VITE_API_KEY);
console.log(import.meta.env.VITE_APP_TITLE);
