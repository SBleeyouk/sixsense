const THREE = require('three');
const faceapi = require('face-api.js');
const { FaceMesh } = require('@mediapipe/face_mesh');
const { Camera } = require('@mediapipe/camera_utils');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader');

document.addEventListener('DOMContentLoaded', () => {
  console.log('Script initialized');

  const video = document.getElementById('video');
  if (!video) {
    console.error('Video element not found');
    return;
  }

  // Initialize Three.js
  const scene = new THREE.Scene();
  const threecamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Set clear color to transparent
  const trainingContainer = document.getElementById('training-container');
  if (!trainingContainer) {
    console.error('Training container not found');
    return;
  }
  trainingContainer.appendChild(renderer.domElement);

  threecamera.position.z = 2;

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
  scene.add(ambientLight);

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Bright white light
  directionalLight.position.set(0, 1, 1).normalize(); // Position the light
  scene.add(directionalLight);
  
  // Load the 3D character model
  const loader = new GLTFLoader();
  let character;
  const characterLandmarks = [];
  loader.load('/gltf/raccoontest.glb', (gltf) => {
      character = gltf.scene;
      scene.add(character);
  
      // Print the structure of the model to the console and collect landmarks
      character.traverse((child) => {
          console.log(child.name);
          if (child.name.startsWith('landmark_')) {
              const index = parseInt(child.name.split('_')[1]);
              characterLandmarks[index] = child;
          }
      });
  });
  
  // Create geometry and material for landmarks
  const landmarksGeometry = new THREE.BufferGeometry();
  const landmarksVertices = new Float32Array(468 * 3);  // 468 landmarks with x, y, z
  landmarksGeometry.setAttribute('position', new THREE.BufferAttribute(landmarksVertices, 3));
  const landmarksMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.001 });
  const landmarksPoints = new THREE.Points(landmarksGeometry, landmarksMaterial);
  scene.add(landmarksPoints);
  
  // Initialize Mediapipe FaceMesh
  const faceMesh = new FaceMesh({
      locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
  });
  faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
  });
  faceMesh.onResults(onResults);
  
  function onResults(results) {
      if (!character) return;
  
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          for (let i = 0; i < landmarks.length; i++) {
              const x = (landmarks[i].x * 2 - 1);  // Normalize to -1 to 1
              const y = -(landmarks[i].y * 2 - 1); // Normalize to -1 to 1
              const z = landmarks[i].z * 2 - 1;    // Normalize to -1 to 1
              
              // Update the positions of the points
              landmarksVertices[i * 3] = x;
              landmarksVertices[i * 3 + 1] = y;
              landmarksVertices[i * 3 + 2] = z;
  
              // Print the landmark index and position to the console
              /*console.log(`Landmark ${i}: [x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}]`);*/
  
              // Update the 3D character's corresponding landmark positions
              if (characterLandmarks[i]) {
                  characterLandmarks[i].position.set(x, y, z);
              } else {
                  /*console.warn(`characterLandmarks ${i} not found in character model.`);*/
              }
          }
          landmarksGeometry.attributes.position.needsUpdate = true;
      }
  }
  
  // Start the animation loop
  function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, threecamera);
  }
  
  animate();
  
  // Initialize and start the camera
  const cameraFeed = new Camera(video, {
      onFrame: async () => {
          await faceMesh.send({ image: video });
      },
      width: 640,
      height: 480
  });
  cameraFeed.start();
});
