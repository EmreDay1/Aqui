import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Initialize CodeMirror with custom mode
CodeMirror.defineSimpleMode("aqui3d", {
    start: [
        { regex: /\/\/.*/, token: "comment" },
        { regex: /\b(shape|cube|sphere|cylinder|rotate|scale|position|x|y|z|width|height|depth)\b/, token: "keyword" },
        { regex: /\b\d+(\.\d+)?\b/, token: "number" },
        { regex: /[\{\}\[\]:,]/, token: "operator" }
    ]
});

const editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
    mode: "aqui3d",
    theme: "default",
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true
});

class Scene3D {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupControls();
        this.setupHelpers();
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    setupHelpers() {
        const gridHelper = new THREE.GridHelper(10, 10, 0xcccccc, 0xcccccc);
        this.scene.add(gridHelper);

        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    clearScene() {
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        }
        this.setupLights();
        this.setupHelpers();
    }

    addShape(mesh) {
        this.scene.add(mesh);
    }
}

// Initialize the scene
const container = document.getElementById('scene-container');
const scene3D = new Scene3D(container);

// Run button functionality
document.getElementById('run-button').addEventListener('click', () => {
    const code = editor.getValue();
    try {
        // Here you would parse and execute the code
        // For now, let's just add a cube as an example
        scene3D.clearScene();
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff9d,
            transparent: true,
            opacity: 0.8
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.rotation.x = Math.PI / 4;
        cube.rotation.y = Math.PI / 4;
        scene3D.addShape(cube);
    } catch (error) {
        console.error('Error executing code:', error);
    }
});

// Handle Shift+Enter
editor.on("keydown", (cm, event) => {
    if (event.shiftKey && event.key === "Enter") {
        event.preventDefault();
        document.getElementById('run-button').click();
    }
});
