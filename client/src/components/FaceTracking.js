import React, { useEffect, useRef, useState } from 'react';
import './FaceTracking.css'; // Ensure to create and import a CSS file for styles

const FaceTracking = ({ musicResponses, currentIndex, handleStopTraining }) => {
  const audioRef = useRef(null);
  const mindarScriptRef = useRef(null);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Function to initialize the 3D rendering and face tracking
  const initializeFaceTracking = () => {
    // Create the container div
    const container = document.createElement('div');
    container.id = 'training-container';
    container.style.width = '100vw';
    container.style.height = '80vh';
    container.style.transition = 'background 0.5s ease';
    container.style.zIndex = '-100';
    container.classList.add('wave-background');
    document.body.appendChild(container);
    containerRef.current = container;

    // Load the MindARThree script dynamically
    const mindarScript = document.createElement('script');
    mindarScript.type = 'module';
    mindarScript.innerHTML = `
      import * as THREE from 'three';
      import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
      import { MindARThree } from 'mindar-face-three';

      class Avatar {
        constructor() {
          this.gltf = null;
          this.morphTargetMeshes = [];
          this.scene = null;
        }
        async init() {
          const url = "./glb/try.glb";
          const gltf = await new Promise((resolve) => {
            const loader = new GLTFLoader();
            loader.load(url, (gltf) => {
              resolve(gltf);
            });
          });

          gltf.scene.traverse((object) => {
            if (object.isBone && !this.root) {
              this.root = object;
            }
            if (!object.isMesh) return;
            const mesh = object;
            if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
            this.morphTargetMeshes.push(mesh);
          });
          this.gltf = gltf;
          this.scene = gltf.scene;
        }

        updateBlendshapes(blendshapes) {
          const categories = blendshapes.categories;
          let coefsMap = new Map();
          for (let i = 0; i < categories.length; ++i) {
            coefsMap.set(categories[i].categoryName, categories[i].score);
          }

          for (const mesh of this.morphTargetMeshes) {
            if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
              continue;
            }
            for (const [name, value] of coefsMap) {
              if (!Object.keys(mesh.morphTargetDictionary).includes(name)) {
                continue;
              }
              const idx = mesh.morphTargetDictionary[name];
              mesh.morphTargetInfluences[idx] = value;
            }
          }
        }
      }

      let mindarThree = null;
      let avatar = null;

      const setup = async () => {
        const container = document.querySelector("#training-container");
        if (!container) {
          console.error('Container element not found');
          return;
        }

        mindarThree = new MindARThree({
          container: container,
        });

        const { renderer, scene, camera } = mindarThree;

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        const anchor = mindarThree.addAnchor(1);

        // Clean up any existing model
        if (avatar && avatar.scene) {
          scene.remove(avatar.scene);
        }

        avatar = new Avatar();
        await avatar.init();
        avatar.gltf.scene.scale.set(2, 2, 2);
        avatar.gltf.scene.position.z = -0.5;
        avatar.gltf.scene.position.y = 0.1;
        anchor.group.add(avatar.gltf.scene);
      }

      const start = async () => {
        if (!mindarThree) {
          await setup();
        }

        await mindarThree.start();
        const { renderer, scene, camera } = mindarThree;

        renderer.setAnimationLoop(() => {
          const estimate = mindarThree.getLatestEstimate();
          if (estimate && estimate.blendshapes) {
            avatar.updateBlendshapes(estimate.blendshapes);
          }
          renderer.render(scene, camera);
        });
      }
      start();
    `;
    document.body.appendChild(mindarScript);
    mindarScriptRef.current = mindarScript;
  };

  useEffect(() => {
    // Initialize face tracking only once
    initializeFaceTracking();
  }, []);

  useEffect(() => {
    if (musicResponses.length > 0) {
      const audio = audioRef.current;
      audio.src = musicResponses[currentIndex].musicUrl;
      audio.loop = true; // Set the music to loop
      console.log('Music URL:', musicResponses[currentIndex].musicUrl); // Log the music URL
      audio.play();

      // Set a timeout to stop training after 30 seconds
      timeoutRef.current = setTimeout(() => {
        handleStopTraining();
      }, 30000); // 30 seconds

      // Start interval to update elapsed time every second
      intervalRef.current = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
    }

    return () => {
      // Clear timeout and interval if dependencies change
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [musicResponses, currentIndex, handleStopTraining]);

  useEffect(() => {
    if (containerRef.current) {
      const percentage = (elapsedTime / 30) * 100;
      containerRef.current.style.background = `linear-gradient(to top, #FFA338 ${percentage}%, transparent ${percentage}%)`;
    }
  }, [elapsedTime]);

  useEffect(() => {
    return () => {
      // Clean up the container div and script when component unmounts
      if (containerRef.current) {
        containerRef.current.remove();
      }
      if (mindarScriptRef.current) {
        mindarScriptRef.current.remove();
      }
    };
  }, []);

  return (
    <>
      <div className="face-tracking-container">
        <video id="video" style={{ display: 'none' }}></video>
        <audio ref={audioRef} />
      </div>
    </>
  );
};

export default FaceTracking;
