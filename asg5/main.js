import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Helper functions for GUI
function resetScene() {
    // Reset camera position
    camera.position.set(15, 10, 15);
    controls.target.set(0, 0, 0);
    controls.update();
    
    // Reset all object positions
    allShapes.forEach((shape, index) => {
        if (shape.userData.originalPosition) {
            shape.position.copy(shape.userData.originalPosition);
        }
    });
    
    // Reset GUI parameters
    guiParams.animationSpeed = 1.0;
    guiParams.lightIntensity = 1.0;
    guiParams.particleSize = 0.1;
    guiParams.showWireframe = false;
    
    // Update GUI display
    gui.updateDisplay();
    
    console.log('Scene reset to defaults');
}

function createRandomExplosion() {
    const randomPosition = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 20
    );
    createParticleExplosion(randomPosition);
}// Create GUI controls (Enhanced WOW FEATURE)
function createGUI() {
    gui = new GUI();
    gui.title('Scene Controls');
    
    // Animation controls
    const animationFolder = gui.addFolder('Animation');
    animationFolder.add(guiParams, 'animationSpeed', 0, 3, 0.1).name('Speed').onChange((value) => {
        // Update animation speed for all objects
        animatedObjects.forEach(obj => {
            if (obj.originalSpeed === undefined) {
                obj.originalSpeed = obj.speed;
            }
            obj.speed = obj.originalSpeed * value;
        });
    });
    
    // Lighting controls
    const lightFolder = gui.addFolder('Lighting');
    lightFolder.add(guiParams, 'lightIntensity', 0, 3, 0.1).name('Intensity').onChange((value) => {
        if (lights.directional) lights.directional.intensity = value;
        if (lights.point) lights.point.intensity = value;
        if (lights.spot) lights.spot.intensity = value;
    });
    
    // Add individual light controls
    if (lights.directional) {
        const dirLightFolder = lightFolder.addFolder('Directional Light');
        dirLightFolder.add(lights.directional.position, 'x', -20, 20);
        dirLightFolder.add(lights.directional.position, 'y', 5, 30);
        dirLightFolder.add(lights.directional.position, 'z', -20, 20);
    }
    
    // Particle controls
    const particleFolder = gui.addFolder('Particles');
    particleFolder.add(guiParams, 'particleSize', 0.05, 0.5, 0.05).name('Size').onChange((value) => {
        if (particleSystem && particleSystem.material) {
            particleSystem.material.size = value;
        }
    });
    particleFolder.add(guiParams, 'explodeParticles').name('Random Explosion');
    
    // Model controls
    const modelFolder = gui.addFolder('Models');
    modelFolder.add(guiParams, 'showWireframe').name('Wireframe').onChange((value) => {
        allShapes.forEach(shape => {
            if (shape.material) {
                shape.material.wireframe = value;
            }
            if (shape.children) {
                shape.children.forEach(child => {
                    if (child.material) {
                        child.material.wireframe = value;
                    }
                });
            }
        });
    });
    
    modelFolder.add(guiParams, 'rotateModel').name('Rotate Robot').onChange((value) => {
        if (loadedOBJModel) {
            const robotAnim = animatedObjects.find(obj => obj.object === loadedOBJModel);
            if (robotAnim) {
                robotAnim.active = value;
            }
        }
    });
    
    // Scene controls
    gui.add(guiParams, 'resetScene').name('Reset Scene');
    
    // Open some folders by default
    animationFolder.open();
    particleFolder.open();
}// (house)
function createCustomModel() {
    const houseGroup = new THREE.Group();
    
    // House base
    const baseGeometry = new THREE.BoxGeometry(4, 3, 4);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1.5;
    base.castShadow = true;
    base.receiveShadow = true;
    
    // House roof
    const roofGeometry = new THREE.ConeGeometry(3, 2, 4);
    const roofMaterial = new THREE.MeshPhongMaterial({ color: 0xDC143C });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    
    // Door
    const doorGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.1);
    const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.25, 2.05);
    door.castShadow = true;
    
    // Windows
    const windowGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);
    const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x87ceeb });
    
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-1, 1, 2.05);
    
    const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(1, 1, 2.05);
    
    // Chimney
    const chimneyGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    const chimneyMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(1.5, 4.5, 1.5);
    chimney.castShadow = true;
    
    houseGroup.add(base);
    houseGroup.add(roof);
    houseGroup.add(door);
    houseGroup.add(window1);
    houseGroup.add(window2);
    houseGroup.add(chimney);
    
    houseGroup.position.set(12, 0, 0);
    scene.add(houseGroup);
    allShapes.push(houseGroup);
    
    // Make house slowly rotate
    animatedObjects.push({
        object: houseGroup,
        type: 'rotate',
        speed: 0.002
    });
    
    console.log('✅ Created custom 3D model (house)');
    
    // Store original positions for reset functionality
    allShapes.forEach(shape => {
        shape.userData.originalPosition = shape.position.clone();
    });
}

// Scene fundamentals
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Global variables
let controls;
let gui;
let animatedObjects = [];
let allShapes = [];
let lights = {};
let isAnimating = true;
let lightsEnabled = true;
let particles = [];
let particleSystem;
let loadedOBJModel = null;

// GUI parameters
const guiParams = {
    animationSpeed: 1.0,
    lightIntensity: 1.0,
    particleSize: 0.1,
    showWireframe: false,
    rotateModel: true,
    resetScene: function() { resetScene(); },
    explodeParticles: function() { createRandomExplosion(); }
};

// Raycaster for mouse interactions (WOW FEATURE)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function init() {
    // Set up renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000011);
    document.body.appendChild(renderer.domElement);
    
    // Position camera
    camera.position.set(15, 10, 15);
    
    // Add camera controls (REQUIREMENT: mouse controls)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    
    // Create all required components
    createLights();           
    createSkybox();          
    createPrimaryShapes();  
    createCustomModel();     
    loadOBJModel();          
    createParticleSystem();  
    createGUI();            
    
    // Set up interactions and UI
    setupEventListeners();
    setupMouseInteraction(); // WOW FEATURE
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Update shape counter
    updateShapeCounter();
    
    // Start animation loop
    animate();
}


function createLights() {
    // 1. Ambient Light
    lights.ambient = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(lights.ambient);
    
    // 2. Directional Light
    lights.directional = new THREE.DirectionalLight(0xffffff, 1.2);
    lights.directional.position.set(10, 20, 10);
    lights.directional.castShadow = true;
    lights.directional.shadow.mapSize.width = 2048;
    lights.directional.shadow.mapSize.height = 2048;
    lights.directional.shadow.camera.near = 0.5;
    lights.directional.shadow.camera.far = 50;
    lights.directional.shadow.camera.left = -20;
    lights.directional.shadow.camera.right = 20;
    lights.directional.shadow.camera.top = 20;
    lights.directional.shadow.camera.bottom = -20;
    scene.add(lights.directional);
    
    // 3. Point Light (moving)
    lights.point = new THREE.PointLight(0xff4444, 1, 30);
    lights.point.position.set(0, 8, 0);
    lights.point.castShadow = true;
    scene.add(lights.point);
    
    // 4. Spot Light
    lights.spot = new THREE.SpotLight(0x44ff44, 1, 25, Math.PI / 6, 0.3);
    lights.spot.position.set(-10, 15, -10);
    lights.spot.target.position.set(0, 0, 0);
    lights.spot.castShadow = true;
    scene.add(lights.spot);
    scene.add(lights.spot.target);
    
    // 5. Hemisphere Light
    lights.hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x654321, 0.4);
    scene.add(lights.hemisphere);
}

//  skybox using actual image
function createSkybox() {
    // Load the actual sky texture image
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
        'sky_texture.jpg', // Your sky image
        (texture) => {
            // Create skybox geometry
            const skyGeometry = new THREE.SphereGeometry(100, 32, 32);
            const skyMaterial = new THREE.MeshBasicMaterial({ 
                map: texture, 
                side: THREE.BackSide 
            });
            
            const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
            scene.add(skybox);
            console.log(' Loaded actual sky texture for skybox');
        },
        (progress) => {
            console.log('Sky texture loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.warn('Failed to load sky texture, using procedural skybox');
            createProceduralSkybox();
        }
    );
}

// Fallback procedural skybox
function createProceduralSkybox() {
    const skyGeometry = new THREE.SphereGeometry(100, 32, 32);
    
    // Create procedural sky texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Create gradient from top to bottom
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#001122');    // Dark blue at top
    gradient.addColorStop(0.3, '#003366');  // Medium blue
    gradient.addColorStop(0.7, '#87ceeb');  // Sky blue
    gradient.addColorStop(1, '#ffeedd');    // Light orange at horizon
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1024, 512);
    
    // Add some stars
    context.fillStyle = 'white';
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 256; // Only in upper half
        const size = Math.random() * 2;
        context.fillRect(x, y, size, size);
    }
    
    const skyTexture = new THREE.CanvasTexture(canvas);
    const skyMaterial = new THREE.MeshBasicMaterial({ 
        map: skyTexture, 
        side: THREE.BackSide 
    });
    
    const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skybox);
}

//  20+ primary shapes, at least one textured, at least one animated
function createPrimaryShapes() {
    // Create textured material 
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 256;
    textureCanvas.height = 256;
    const textureContext = textureCanvas.getContext('2d');
    
    // Create brick texture
    textureContext.fillStyle = '#8B4513';
    textureContext.fillRect(0, 0, 256, 256);
    textureContext.fillStyle = '#A0522D';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if ((i + j) % 2 === 0) {
                textureContext.fillRect(i * 32, j * 32, 30, 30);
            }
        }
    }
    
    const brickTexture = new THREE.CanvasTexture(textureCanvas);
    const texturedMaterial = new THREE.MeshPhongMaterial({ map: brickTexture });
    
    // Material variations
    const materials = [
        new THREE.MeshPhongMaterial({ color: 0xff6b6b }),
        new THREE.MeshPhongMaterial({ color: 0x4ecdc4 }),
        new THREE.MeshPhongMaterial({ color: 0x45b7d1 }),
        new THREE.MeshPhongMaterial({ color: 0xf9ca24 }),
        new THREE.MeshPhongMaterial({ color: 0x6c5ce7 }),
        new THREE.MeshPhongMaterial({ color: 0xe17055 }),
        texturedMaterial
    ];
    
    // 1. CUBES (8 total)
    for (let i = 0; i < 8; i++) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = materials[i % materials.length];
        const cube = new THREE.Mesh(geometry, material);
        
        cube.position.set(
            (i % 4) * 3 - 4.5,
            0.5,
            Math.floor(i / 4) * 3 - 1.5
        );
        
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add(cube);
        allShapes.push(cube);
        
        // Make some cubes animated 
        if (i < 4) {
            animatedObjects.push({
                object: cube,
                type: 'float',
                originalY: cube.position.y,
                speed: 0.02 + Math.random() * 0.02
            });
        }
    }
    
    // 2. SPHERES (6 total)
    for (let i = 0; i < 6; i++) {
        const geometry = new THREE.SphereGeometry(0.8, 16, 16);
        const material = materials[i % materials.length];
        const sphere = new THREE.Mesh(geometry, material);
        
        sphere.position.set(
            (i % 3) * 4 - 4,
            2,
            Math.floor(i / 3) * 4 + 6
        );
        
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        scene.add(sphere);
        allShapes.push(sphere);
    }
    
    // 3. CYLINDERS (5 total)
    for (let i = 0; i < 5; i++) {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 12);
        const material = materials[i % materials.length];
        const cylinder = new THREE.Mesh(geometry, material);
        
        cylinder.position.set(
            i * 3 - 6,
            1,
            -6
        );
        
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        scene.add(cylinder);
        allShapes.push(cylinder);
        
        // Animate some cylinders
        if (i < 2) {
            animatedObjects.push({
                object: cylinder,
                type: 'rotate',
                speed: 0.01 + Math.random() * 0.02
            });
        }
    }
    
    // 4. CONES (4 total)
    for (let i = 0; i < 4; i++) {
        const geometry = new THREE.ConeGeometry(0.8, 2, 8);
        const material = materials[i % materials.length];
        const cone = new THREE.Mesh(geometry, material);
        
        cone.position.set(
            i * 3 - 4.5,
            1,
            8
        );
        
        cone.castShadow = true;
        cone.receiveShadow = true;
        scene.add(cone);
        allShapes.push(cone);
    }
    
    // 5. TORUS (3 total)
    for (let i = 0; i < 3; i++) {
        const geometry = new THREE.TorusGeometry(1, 0.3, 8, 16);
        const material = materials[i % materials.length];
        const torus = new THREE.Mesh(geometry, material);
        
        torus.position.set(
            i * 4 - 4,
            3,
            -10
        );
        
        torus.castShadow = true;
        torus.receiveShadow = true;
        scene.add(torus);
        allShapes.push(torus);
        
        // Animate torus
        animatedObjects.push({
            object: torus,
            type: 'spin',
            speed: 0.005 + Math.random() * 0.01
        });
    }
    
    // Add large ground plane with actual grass texture
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
        'grass_texture.jpg', 
        (grassTexture) => {
            // Set texture properties for tiling
            grassTexture.wrapS = THREE.RepeatWrapping;
            grassTexture.wrapT = THREE.RepeatWrapping;
            grassTexture.repeat.set(10, 10); // Tile the grass texture
            
            const groundGeometry = new THREE.PlaneGeometry(50, 50);
            const groundMaterial = new THREE.MeshPhongMaterial({ 
                map: grassTexture,
                side: THREE.DoubleSide
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -2;
            ground.receiveShadow = true;
            scene.add(ground);
            allShapes.push(ground);
        },
        (progress) => {
            console.log('Grass texture loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.warn(' Failed to load grass texture, using solid color ground');
            // Fallback to solid color ground
            const groundGeometry = new THREE.PlaneGeometry(50, 50);
            const groundMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x228B22,
                side: THREE.DoubleSide
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -2;
            ground.receiveShadow = true;
            scene.add(ground);
            allShapes.push(ground);
        }
    );
}

//  Among Us, Fly, and Robot
function loadOBJModel() {
    const gltfLoader = new GLTFLoader();
    
    // Load the Sussy Imposter GLB model
    gltfLoader.load(
        'Sussy Imposter.glb',
        (gltf) => {
            
            const amongUsModel = gltf.scene;
            amongUsModel.scale.set(10, 10, 10);
            amongUsModel.position.set(-12, 0, 0);
            
            // Enable shadows
            amongUsModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.needsUpdate = true;
                    }
                }
            });
            
            scene.add(amongUsModel);
            allShapes.push(amongUsModel);
            loadedOBJModel = amongUsModel;
            
            // Animate the Among Us character
            animatedObjects.push({
                object: amongUsModel,
                type: 'amongus',
                speed: 0.008,
                originalY: amongUsModel.position.y
            });
            
            console.log('Among Us character added to scene with animation');
        },
        (progress) => {
            console.log('Among Us loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error('Error loading Among Us GLB model:', error);
        }
    );
    
    // Load the Fly GLB model
    gltfLoader.load(
        'Fly.glb',
        (gltf) => {
            console.log(' Successfully loaded Fly GLB model');
            
            const flyModel = gltf.scene;
            flyModel.scale.set(1.5, 1.5, 1.5);
            flyModel.position.set(8, 3, 8);
            
            // Enable shadows
            flyModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.needsUpdate = true;
                    }
                }
            });
            
            scene.add(flyModel);
            allShapes.push(flyModel);
            
            // Animate the fly with flying motion
            animatedObjects.push({
                object: flyModel,
                type: 'fly',
                speed: 0.02,
                originalX: flyModel.position.x,
                originalZ: flyModel.position.z,
                originalY: flyModel.position.y
            });
            
            console.log('Fly model added to scene with flying animation');
        },
        (progress) => {
            console.log('Fly loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error(' Error loading Fly GLB model:', error);
        }
    );
    
    // Create the robot as a permanent part of the scene (not fallback)
    createRobotModel();
}

// Create robot model as permanent feature
function createRobotModel() {
    const robotGroup = new THREE.Group();
    
    // Robot body (main torso)
    const bodyGeometry = new THREE.BoxGeometry(2, 3, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x888888,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = true;
    body.receiveShadow = true;
    
    // Robot head
    const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xcccccc,
        shininess: 150
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 3.8;
    head.castShadow = true;
    
    // Robot eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        emissive: 0x002200
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 3.9, 0.6);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 3.9, 0.6);
    
    // Robot arms
    const armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-1.5, 1.5, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(1.5, 1.5, 0);
    rightArm.castShadow = true;
    
    // Robot legs
    const legGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.6, -1, 0);
    leftLeg.castShadow = true;
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.6, -1, 0);
    rightLeg.castShadow = true;
    
    // Assemble robot
    robotGroup.add(body);
    robotGroup.add(head);
    robotGroup.add(leftEye);
    robotGroup.add(rightEye);
    robotGroup.add(leftArm);
    robotGroup.add(rightArm);
    robotGroup.add(leftLeg);
    robotGroup.add(rightLeg);
    
    robotGroup.position.set(0, 0, -14);
    scene.add(robotGroup);
    allShapes.push(robotGroup);
    
    // Animate the robot
    animatedObjects.push({
        object: robotGroup,
        type: 'robot',
        speed: 0.01
    });
    
    console.log('Created permanent robot model');
}

// Interactive particle system
function createParticleSystem() {
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        
        colors[i * 3] = Math.random();
        colors[i * 3 + 1] = Math.random();
        colors[i * 3 + 2] = Math.random();
        
        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = 0;
        velocities[i * 3 + 2] = 0;
        
        lifetimes[i] = 0;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    
    // Store particle data
    particleSystem.userData = {
        velocities: velocities,
        lifetimes: lifetimes,
        activeCount: 0
    };
}

function createParticleExplosion(position) {
    const particleCount = 50;
    const userData = particleSystem.userData;
    const positions = particleSystem.geometry.attributes.position.array;
    const colors = particleSystem.geometry.attributes.color.array;
    
    for (let i = 0; i < particleCount; i++) {
        const index = (userData.activeCount + i) % 1000;
        
        // Set position
        positions[index * 3] = position.x;
        positions[index * 3 + 1] = position.y;
        positions[index * 3 + 2] = position.z;
        
        // Set random velocity
        userData.velocities[index * 3] = (Math.random() - 0.5) * 10;
        userData.velocities[index * 3 + 1] = Math.random() * 10;
        userData.velocities[index * 3 + 2] = (Math.random() - 0.5) * 10;
        
        // Set random color
        colors[index * 3] = Math.random();
        colors[index * 3 + 1] = Math.random();
        colors[index * 3 + 2] = Math.random();
        
        // Set lifetime
        userData.lifetimes[index] = 2.0; // 2 seconds
    }
    
    userData.activeCount = (userData.activeCount + particleCount) % 1000;
    
    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.color.needsUpdate = true;
    
    // Update particle counter
    const particleCountElement = document.getElementById('particleCount');
    if (particleCountElement) {
        particleCountElement.textContent = userData.activeCount;
    }
}

// Set up mouse interaction for particle explosions (WOW FEATURE)
function setupMouseInteraction() {
    renderer.domElement.addEventListener('click', (event) => {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Cast ray from camera through mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Find intersections with ground or objects
        const intersects = raycaster.intersectObjects(allShapes, true);
        
        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;
            createParticleExplosion(intersectionPoint);
        }
    });
}

// Update particles
function updateParticles(deltaTime) {
    if (!particleSystem) return;
    
    const userData = particleSystem.userData;
    const positions = particleSystem.geometry.attributes.position.array;
    
    for (let i = 0; i < 1000; i++) {
        if (userData.lifetimes[i] > 0) {
            // Update position based on velocity
            positions[i * 3] += userData.velocities[i * 3] * deltaTime;
            positions[i * 3 + 1] += userData.velocities[i * 3 + 1] * deltaTime;
            positions[i * 3 + 2] += userData.velocities[i * 3 + 2] * deltaTime;
            
            // Apply gravity
            userData.velocities[i * 3 + 1] -= 9.8 * deltaTime;
            
            // Reduce lifetime
            userData.lifetimes[i] -= deltaTime;
            
            // Reset if lifetime expired
            if (userData.lifetimes[i] <= 0) {
                positions[i * 3] = 0;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = 0;
            }
        }
    }
    
    particleSystem.geometry.attributes.position.needsUpdate = true;
}

// Set up UI event listeners
function setupEventListeners() {
    const toggleAnimationBtn = document.getElementById('toggleAnimation');
    if (toggleAnimationBtn) {
        toggleAnimationBtn.addEventListener('click', () => {
            isAnimating = !isAnimating;
            toggleAnimationBtn.textContent = isAnimating ? 'Pause Animation' : 'Start Animation';
        });
    }
    
    const changeColorsBtn = document.getElementById('changeColors');
    if (changeColorsBtn) {
        changeColorsBtn.addEventListener('click', () => {
            // Randomize colors of all shapes
            allShapes.forEach(shape => {
                if (shape.material && shape.material.color) {
                    shape.material.color.setHSL(Math.random(), 0.7, 0.6);
                }
            });
        });
    }
    
    const toggleLightsBtn = document.getElementById('toggleLights');
    if (toggleLightsBtn) {
        toggleLightsBtn.addEventListener('click', () => {
            lightsEnabled = !lightsEnabled;
            Object.values(lights).forEach(light => {
                if (light.type !== 'AmbientLight') {
                    light.visible = lightsEnabled;
                }
            });
            toggleLightsBtn.textContent = lightsEnabled ? 'Turn Off Lights' : 'Turn On Lights';
        });
    }
    
    const resetCameraBtn = document.getElementById('resetCamera');
    if (resetCameraBtn) {
        resetCameraBtn.addEventListener('click', () => {
            camera.position.set(15, 10, 15);
            controls.target.set(0, 0, 0);
            controls.update();
        });
    }
}

// Update shape counter
function updateShapeCounter() {
    const shapeCountElement = document.getElementById('shapeCount');
    if (shapeCountElement) {
        shapeCountElement.textContent = allShapes.length;
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = 0.016; // Approximate 60fps
    
    // Update controls
    controls.update();
    
    // Animate objects
    if (isAnimating) {
        const time = Date.now() * 0.001;
        
        animatedObjects.forEach(animData => {
            const obj = animData.object;
            
            // Skip if animation is disabled for this object
            if (animData.active === false) return;
            
            switch (animData.type) {
                case 'float':
                    obj.position.y = animData.originalY + Math.sin(time * animData.speed) * 1.5;
                    break;
                case 'rotate':
                    obj.rotation.y += animData.speed;
                    break;
                case 'spin':
                    obj.rotation.x += animData.speed;
                    obj.rotation.z += animData.speed * 0.7;
                    break;
                case 'robot':
                    obj.rotation.y += animData.speed;
                    // Add robot arm movement
                    if (obj.children.length > 4) { // Has arms
                        obj.children[4].rotation.z = Math.sin(time * 2) * 0.3; // Left arm
                        obj.children[5].rotation.z = -Math.sin(time * 2) * 0.3; // Right arm
                    }
                    break;
                case 'amongus':
                    // Among Us character animation - floating and gentle rotation
                    obj.position.y = animData.originalY + Math.sin(time * 0.8) * 0.3;
                    obj.rotation.y += animData.speed;
                    // Add a slight wobble
                    obj.rotation.z = Math.sin(time * 1.2) * 0.05;
                    break;
                case 'fly':
                    // Fly animation - complex flight pattern
                    obj.position.x = animData.originalX + Math.sin(time * animData.speed) * 3;
                    obj.position.z = animData.originalZ + Math.cos(time * animData.speed * 0.7) * 2;
                    obj.position.y = animData.originalY + Math.sin(time * animData.speed * 1.5) * 1;
                    // Wing flapping simulation with rotation
                    obj.rotation.x = Math.sin(time * animData.speed * 8) * 0.1;
                    obj.rotation.z = Math.sin(time * animData.speed * 6) * 0.15;
                    break;
            }
        });
        
        // Animate point light in a circle
        if (lights.point) {
            lights.point.position.x = Math.sin(time * 0.5) * 8;
            lights.point.position.z = Math.cos(time * 0.5) * 8;
            lights.point.position.y = 5 + Math.sin(time * 0.3) * 2;
        }
    }
    
    // Update particle system (WOW FEATURE)
    updateParticles(deltaTime);
    
    // Render the scene
    renderer.render(scene, camera);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    init();
});