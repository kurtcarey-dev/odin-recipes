import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WoodBlock } from './WoodBlock.js';

class WoodCarvingSimulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.woodBlock = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isCarving = false;

        // Carving settings
        this.currentTool = 'chisel';
        this.toolSize = 5;
        this.carveDepth = 3;
        this.currentWoodType = 'oak';

        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // Add orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 20;
        this.controls.mouseButtons = {
            RIGHT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            LEFT: null // We'll use left click for carving
        };

        // Add lighting
        this.setupLighting();

        // Create wood block
        this.woodBlock = new WoodBlock(this.scene, this.currentWoodType);

        // Add ground plane
        this.addGround();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // Main directional light (sun)
        const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
        mainLight.position.set(10, 15, 10);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -15;
        mainLight.shadow.camera.right = 15;
        mainLight.shadow.camera.top = 15;
        mainLight.shadow.camera.bottom = -15;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xadd8e6, 0.5);
        fillLight.position.set(-10, 10, -10);
        this.scene.add(fillLight);

        // Rim light for definition
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
        rimLight.position.set(0, 5, -10);
        this.scene.add(rimLight);

        // Hemisphere light for realistic ambient
        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.3);
        this.scene.add(hemiLight);
    }

    addGround() {
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -3;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add grid for reference
        const gridHelper = new THREE.GridHelper(50, 50, 0x666666, 0x444444);
        gridHelper.position.y = -2.99;
        this.scene.add(gridHelper);
    }

    setupEventListeners() {
        // Mouse events for carving
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mouseup', () => this.onMouseUp());
        this.renderer.domElement.addEventListener('mouseleave', () => this.onMouseUp());

        // UI controls
        document.getElementById('wood-type').addEventListener('change', (e) => {
            this.currentWoodType = e.target.value;
            this.woodBlock.changeWoodType(e.target.value);
        });

        document.querySelectorAll('.tool-button').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTool = e.target.dataset.tool;
            });
        });

        document.getElementById('tool-size').addEventListener('input', (e) => {
            this.toolSize = parseInt(e.target.value);
            document.getElementById('size-value').textContent = this.toolSize;
        });

        document.getElementById('carve-depth').addEventListener('input', (e) => {
            this.carveDepth = parseInt(e.target.value);
            document.getElementById('depth-value').textContent = this.carveDepth;
        });

        document.getElementById('reset-button').addEventListener('click', () => {
            this.woodBlock.reset();
        });
    }

    onMouseDown(event) {
        if (event.button === 0) { // Left click
            this.isCarving = true;
            this.carve(event);
        }
    }

    onMouseMove(event) {
        // Update mouse position
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (this.isCarving) {
            this.carve(event);
        }
    }

    onMouseUp() {
        this.isCarving = false;
    }

    carve(event) {
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check intersection with wood block
        const intersects = this.raycaster.intersectObject(this.woodBlock.mesh);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.woodBlock.carve(point, this.toolSize, this.carveDepth, this.currentTool);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the simulator
new WoodCarvingSimulator();
