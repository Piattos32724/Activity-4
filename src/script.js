import * as THREE from 'three';
import * as dat from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader();

// Variables for Animation
let mixer = null; // To handle animations
const clock = new THREE.Clock(); // Clock for animations

// Variables for Earth, Moon, and UFO
let earthObject = null;
let moonObject = null;
let ufoObject = null;

/**
 * Load Environment Map
 */
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/NightSkyHDRI012_4K-HDR.hdr', (hdrTexture) => {
    // Set the HDR texture as the scene's background and environment
    hdrTexture.mapping = THREE.EquirectangularRefractionMapping;  // For refraction (if needed)
    scene.background = hdrTexture;

});

/**
 * Load Earth Model
 */
gltfLoader.load(
    '/low_poly_planet_earth.glb',
    (gltf) => {
        console.log('Earth loaded');
        gltf.scene.scale.set(2, 2, 2);
        gltf.scene.position.set(0, -2, 0);
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        earthObject = gltf.scene;
        scene.add(gltf.scene);
    }
);

/**
 * Load Moon Model
 */
gltfLoader.load(
    '/low_poly_moon.glb',
    (gltf) => {
        console.log('Moon loaded');
        gltf.scene.scale.set(0.03, 0.03, 0.03);
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        moonObject = gltf.scene;
        scene.add(gltf.scene);
    }
);

/**
 * Load UFO Model
 */
gltfLoader.load(
    '/ufo/scene.gltf',
    (gltf) => {
        console.log('UFO loaded');

        const model = gltf.scene;

        // Scale and position the model
        model.scale.set(0.04, 0.04, 0.04);
        model.position.set(0, 0, 0);

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // If the UFO has a beam, store the reference (example: assume the beam is named 'beam')
                if (child.name === 'beam') {
                    ufoBeam = child;  // Reference to the UFO's beam mesh
                }
            }
        });

        // Add UFO light to the model
        ufoLight.position.set(0, 0.5, 0);
        model.add(ufoLight);

        // Setup Animation Mixer if animations exist
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            const ufoAction = mixer.clipAction(gltf.animations[0]);
            ufoAction.play();
        }

        ufoObject = model;
        scene.add(model);
    },
    (xhr) => {
        console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
        console.error('Error loading UFO model:', error);
    }
);

/**
 * Lighting
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 1);
directionalLight.position.set(10, 0.3, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;

directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;

scene.add(directionalLight);

const lightFolder = gui.addFolder('Light Intensity and Direction Controls');
const ufoLight = new THREE.PointLight('#fffff0', 0.02);
lightFolder.add(ufoLight, 'intensity').min(0.02).max(0.1).step(0.01).name('UFO Light Intensity');
lightFolder.add(directionalLight, 'intensity').min(0).max(10).step(0.001).name('Light Intensity');
lightFolder.add(directionalLight.position, 'x').min(-20).max(20).step(0.1).name('Light in X');
lightFolder.add(directionalLight.position, 'y').min(-20).max(20).step(0.1).name('Light in Y');
lightFolder.add(directionalLight.position, 'z').min(-20).max(20).step(0.1).name('Light in Z');

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(4, 1, -4);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Variables for adjustments
const settings = {
    earthRotationSpeed: 0.003,
    moonRotationSpeed: 0.005,
    moonOrbitRadius: 4,
    moonOrbitSpeed: 0.1, // Orbit speed multiplier
    ufoOrbitRadius: 2.5,
    ufoOrbitSpeed: 0.5, // UFO orbit speed multiplier
};

// Add GUI controls
const rotationFolder = gui.addFolder('Rotation and Orbit Controls');
rotationFolder.add(settings, 'earthRotationSpeed').min(0.003).max(0.01).step(0.001).name('Earth Rotation Speed');
rotationFolder.add(settings, 'moonRotationSpeed').min(0.005).max(0.01).step(0.001).name('Moon Rotation Speed');
rotationFolder.add(settings, 'moonOrbitRadius').min(4).max(10).step(1).name('Moon Orbit Radius');
rotationFolder.add(settings, 'moonOrbitSpeed').min(0.1).max(1).step(0.1).name('Moon Orbit Speed');
rotationFolder.open();

/**
 * Animation Loop
 */
/**
 * Update UFO and beam
 */
const tick = () => {
    const deltaTime = clock.getDelta(); // Delta time for animations

    // Update Animation Mixer
    if (mixer) {
        mixer.update(deltaTime);
    }

    // Update Earth and Moon rotations
    if (earthObject) earthObject.rotation.y += settings.earthRotationSpeed;
    if (moonObject) {
        moonObject.rotation.y += settings.moonRotationSpeed;
        const moonOrbitTime = clock.getElapsedTime() * settings.moonOrbitSpeed;
        moonObject.position.x = settings.moonOrbitRadius * Math.cos(moonOrbitTime);
        moonObject.position.z = settings.moonOrbitRadius * Math.sin(moonOrbitTime);
    }

    // Position the UFO on top of the Moon (fixed on the Moon's surface)
    if (ufoObject && moonObject) {
        const moonPosition = moonObject.position; // Get the Moon's current position
        const ufoHeight = 0.75; // Adjust UFO's height above the Moon's surface if needed
        ufoObject.position.set(moonPosition.x, moonPosition.y + ufoHeight, moonPosition.z); // Position UFO on the Moon
    }

    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};


tick();