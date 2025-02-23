import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

let currentPanel = null;
let interpreter;
let renderer;
let scene;
let camera;
let controls;

const canvas = document.getElementById('canvas');
const runButton = document.getElementById('run-button');
const viewAstButton = document.getElementById('view-ast');
const viewErrorsButton = document.getElementById('view-errors');
const exportGltfButton = document.getElementById('export-gltf');
const astPanel = document.getElementById('ast-panel');
const errorPanel = document.getElementById('error-panel');
const astOutput = document.getElementById('ast-output');
const errorOutput = document.getElementById('error-output');
const errorCount = document.getElementById('error-count');

// Initialize Three.js Scene
function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Setup camera
    const container = canvas.parentElement;
    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Setup renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Setup controls
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Add helpers
    const gridHelper = new THREE.GridHelper(10, 10, 0xcccccc, 0xcccccc);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Start animation loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function setupCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    if (camera) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

function showPanel(panel) {
    if (currentPanel) {
        currentPanel.classList.remove('visible');
    }
    if (currentPanel !== panel) {
        panel.classList.add('visible');
        currentPanel = panel;
    } else {
        currentPanel = null;
    }
}

function displayErrors(errors) {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    errorOutput.innerHTML = errorArray.map(error => {
        const location = error.line ? 
            `<div class="error-location">Line ${error.line}, Column ${error.column}</div>` : '';
        return `<div class="error-message">${error.message}${location}</div>`;
    }).join('');

    errorCount.textContent = errorArray.length;
    errorCount.classList.toggle('visible', errorArray.length > 0);
    viewErrorsButton.classList.toggle('error', errorArray.length > 0);
}

function clearScene() {
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    
    // Re-add lights and helpers
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
}

function runCode() {
    try {
        clearScene();
        const code = editor.getValue();
        
        // Example: Create a cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff9d,
            transparent: true,
            opacity: 0.8
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.rotation.x = Math.PI / 4;
        cube.rotation.y = Math.PI / 4;
        scene.add(cube);
        
        displayErrors([]);
    } catch (error) {
        console.error(error);
        displayErrors(error);
    }
}

function exportGLTF() {
    try {
        const exporter = new GLTFExporter();
        exporter.parse(scene, function (result) {
            const output = JSON.stringify(result, null, 2);
            const blob = new Blob([output], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'scene.gltf';
            link.click();
            URL.revokeObjectURL(url);
        }, { binary: false });
    } catch (error) {
        console.error('GLTF Export error:', error);
        displayErrors([{ message: `GLTF Export failed: ${error.message}` }]);
    }
}

// Initialize CodeMirror
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

// Event listeners
runButton.addEventListener('click', runCode);
viewAstButton.addEventListener('click', () => showPanel(astPanel));
viewErrorsButton.addEventListener('click', () => showPanel(errorPanel));
exportGltfButton.addEventListener('click', exportGLTF);

editor.on("keydown", (cm, event) => {
    if (event.shiftKey && event.key === "Enter") {
        event.preventDefault();
        runCode();
    }
});

window.addEventListener("resize", setupCanvas);

// Initialize everything
initThreeJS();
setupCanvas();
runCode();
