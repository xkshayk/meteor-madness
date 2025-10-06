import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import AsteroidAPI from '../services/asteroidApi';

const OrbitVisualizer = () => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [asteroidCount, setAsteroidCount] = useState(0);
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const selectedAsteroidRef = useRef(null);
  const labelsRef = useRef([]);
  const orbitsRef = useRef([]);

  useEffect(() => {
    let scene, camera, renderer, controls;
    let animationId;

    const init = async () => {
      // === Scene setup ===
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
      camera.position.set(5, 3, 5);

      // === Add static star background ===
      const starGeometry = new THREE.BufferGeometry();
      const starCount = 2000;
      const starPositions = new Float32Array(starCount * 3);
      
      for (let i = 0; i < starCount * 3; i += 3) {
        // Create stars in a sphere around the scene
        const radius = 50 + Math.random() * 40;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i + 2] = radius * Math.cos(phi);
      }
      
      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff,
        size: 0.05,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
      });
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      mountRef.current.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // === Lighting ===
      const ambientLight = new THREE.AmbientLight(0x404040, 1);
      scene.add(ambientLight);

      const sunLight = new THREE.PointLight(0xffffff, 2, 100);
      sunLight.position.set(0, 0, 0);
      scene.add(sunLight);

      // === Create Sun - realistic bright glowing orb ===
      const sunGeometry = new THREE.SphereGeometry(0.15, 64, 64);
      const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        emissive: 0xffff00,
        emissiveIntensity: 2
      });
      const sun = new THREE.Mesh(sunGeometry, sunMaterial);
      scene.add(sun);

      // === Add smooth radial glow using sprite for blended effect ===
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      // Create radial gradient for smooth glow
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 220, 100, 0.8)');
      gradient.addColorStop(0.4, 'rgba(255, 180, 50, 0.5)');
      gradient.addColorStop(0.6, 'rgba(255, 150, 30, 0.3)');
      gradient.addColorStop(0.8, 'rgba(255, 120, 0, 0.15)');
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
      
      const glowTexture = new THREE.CanvasTexture(canvas);
      const glowMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sunGlow = new THREE.Sprite(glowMaterial);
      sunGlow.scale.set(0.8, 0.8, 1);
      scene.add(sunGlow);

      // === Add Solar System with NASA data ===
      // All distances in AU (Astronomical Units), eccentricities and orbital periods from NASA
      const planets = [
        { name: 'Mercury', distance: 0.387, eccentricity: 0.2056, color: 0x8c7853, size: 0.03, orbitalPeriod: 0.241 },
        { name: 'Venus', distance: 0.723, eccentricity: 0.0068, color: 0xffc649, size: 0.05, orbitalPeriod: 0.615 },
        { name: 'Earth', distance: 1.0, eccentricity: 0.0167, color: 0x2277ff, size: 0.05, orbitalPeriod: 1.0 },
        { name: 'Mars', distance: 1.524, eccentricity: 0.0934, color: 0xdc4b3e, size: 0.04, orbitalPeriod: 1.881 },
        { name: 'Jupiter', distance: 5.203, eccentricity: 0.0484, color: 0xc88b3a, size: 0.12, orbitalPeriod: 11.862 },
        { name: 'Saturn', distance: 9.537, eccentricity: 0.0539, color: 0xfad5a5, size: 0.10, orbitalPeriod: 29.457 },
        { name: 'Uranus', distance: 19.191, eccentricity: 0.0472, color: 0x4fd0e7, size: 0.08, orbitalPeriod: 84.011 },
        { name: 'Neptune', distance: 30.069, eccentricity: 0.0086, color: 0x4166f5, size: 0.08, orbitalPeriod: 164.79 }
      ];

      const planetMeshes = []; // Store planet meshes for animation

      planets.forEach(planet => {
        // Create elliptical orbit
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitPoints = [];
        
        for (let i = 0; i <= 360; i++) {
          const theta = (i * Math.PI) / 180;
          // Keplerian orbit equation: r = a(1-e²)/(1+e·cos(θ))
          const r = planet.distance * (1 - planet.eccentricity * planet.eccentricity) / 
                    (1 + planet.eccentricity * Math.cos(theta));
          orbitPoints.push(
            r * Math.cos(theta),
            0,
            r * Math.sin(theta)
          );
        }
        
        orbitGeometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(orbitPoints, 3)
        );
        
        const orbitMaterial = new THREE.LineBasicMaterial({
          color: planet.color,
          opacity: 0.4,
          transparent: true
        });
        
        const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbit);
        
        // Create planet sphere
        const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32);
        const planetMaterial = new THREE.MeshStandardMaterial({
          color: planet.color,
          emissive: planet.color,
          emissiveIntensity: 0.3,
          metalness: 0.2,
          roughness: 0.7
        });
        const planetSphere = new THREE.Mesh(planetGeometry, planetMaterial);
        
        // Position planet at perihelion (closest point to sun)
        const perihelion = planet.distance * (1 - planet.eccentricity);
        planetSphere.position.set(perihelion, 0, 0);
        planetSphere.userData.planet = planet;
        planetSphere.userData.label = null; // Will store reference to label
        scene.add(planetSphere);
        
        // Store for animation
        planetMeshes.push(planetSphere);
        
        // Add planet label
        const labelCanvas = document.createElement('canvas');
        const labelContext = labelCanvas.getContext('2d');
        labelCanvas.width = 512;
        labelCanvas.height = 128;
        labelContext.fillStyle = `#${planet.color.toString(16).padStart(6, '0')}`;
        labelContext.font = 'Bold 48px Arial';
        labelContext.textAlign = 'center';
        labelContext.fillText(planet.name.toUpperCase(), 256, 80);
        
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        const labelSpriteMaterial = new THREE.SpriteMaterial({ 
          map: labelTexture,
          transparent: true,
          opacity: 0.7
        });
        const labelSprite = new THREE.Sprite(labelSpriteMaterial);
        labelSprite.position.set(perihelion, planet.size + 0.1, 0);
        labelSprite.scale.set(0.5, 0.125, 1);
        planetSphere.userData.label = labelSprite; // Link label to planet
        scene.add(labelSprite);
      });

      // === Special handling for Earth - Load 3D model ===
      const loader = new GLTFLoader();
      let earthModel = null;
      
      // Find Earth sphere in the scene
      const earthSphere = scene.children.find(child => 
        child.userData.planet && child.userData.planet.name === 'Earth'
      );
      
      loader.load(
        '/models/Earth_1_12756.glb',
        (gltf) => {
          earthModel = gltf.scene;
          
          // Get the bounding box of the model to calculate proper scale
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          
          // Scale to match the Earth sphere size (0.05 units diameter = 0.025 radius)
          const targetDiameter = 0.1; // Make it twice as large as the sphere for visibility
          const earthScale = targetDiameter / maxDim;
          earthModel.scale.set(earthScale, earthScale, earthScale);
          
          // Position at same location as sphere
          if (earthSphere) {
            earthModel.position.copy(earthSphere.position);
            earthSphere.visible = false; // Hide placeholder
          } else {
            earthModel.position.set(1.0 - 0.0167, 0, 0); // Earth's perihelion
          }
          
          // Make sure all meshes are visible and brighter
          earthModel.traverse((child) => {
            if (child.isMesh) {
              child.frustumCulled = false;
              child.visible = true;
              // Adjust materials for better visibility with less shadows
              if (child.material) {
                child.material.emissive = new THREE.Color(0x1a1a3a);
                child.material.emissiveIntensity = 0.2;
                // Reduce shadows by making material less reactive to lighting
                if (child.material.metalness !== undefined) {
                  child.material.metalness = 0.1;
                }
                if (child.material.roughness !== undefined) {
                  child.material.roughness = 0.9;
                }
                child.material.needsUpdate = true;
              }
              // Enable casting/receiving shadows but with reduced effect
              child.castShadow = false;
              child.receiveShadow = false;
            }
          });
          
          // Add to scene
          scene.add(earthModel);
          
          console.log('✅ Earth 3D model loaded successfully!');
          console.log('Earth model position:', earthModel.position);
          console.log('Earth model scale:', earthModel.scale);
          console.log('Earth model bounding box:', new THREE.Box3().setFromObject(earthModel));
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(1);
          console.log(`Loading Earth model: ${percent}%`);
        },
        (error) => {
          console.error('❌ Error loading Earth model:', error);
          console.log('Using blue sphere placeholder instead');
        }
      );

      // === Fetch and display asteroid orbits ===
      try {
        const orbits = await AsteroidAPI.getAllOrbits(180); // Use 180 points for performance
        setAsteroidCount(orbits.length);

        orbits.forEach((orbit) => {
          const points = [];
          const { x, y, z } = orbit.trajectory;

          for (let i = 0; i < x.length; i++) {
            points.push(x[i], z[i], -y[i]); // Swap Y and Z for better visualization
          }

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(points, 3)
          );

          // Color: PHAs are red, others are cyan/green
          const color = orbit.pha ? 0xff3333 : 0x33ffaa;
          const material = new THREE.LineBasicMaterial({
            color: color,
            opacity: orbit.pha ? 0.3 : 0.2,
            transparent: true,
            linewidth: 1
          });

          const line = new THREE.Line(geometry, material);
          line.userData = { 
            orbitData: orbit, 
            originalColor: color,
            originalOpacity: orbit.pha ? 0.3 : 0.2
          };
          scene.add(line);

          // === Add 3D asteroid sphere model ===
          // Calculate size based on diameter (in km), scaled very small
          // Use logarithmic scaling to show relative sizes while keeping all visible
          const asteroidDiameter = orbit.diameter || 0.5; // km
          const baseScale = 0.002; // Very small base size
          const asteroidSize = Math.max(0.001, Math.log10(asteroidDiameter + 1) * baseScale);
          
          // Create small sphere for asteroid
          const asteroidGeometry = new THREE.SphereGeometry(asteroidSize, 16, 16);
          const asteroidMaterial = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.4,
            metalness: 0.3,
            roughness: 0.7
          });
          const asteroidSphere = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
          
          // Position asteroid at start of trajectory (perihelion - closest to sun)
          asteroidSphere.position.set(x[0], z[0], -y[0]);
          asteroidSphere.userData.orbit = orbit;
          asteroidSphere.userData.trajectory = { x, y, z };
          asteroidSphere.userData.currentIndex = 0;
          scene.add(asteroidSphere);

          // === Create text label for asteroid ===
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = 512;
          canvas.height = 128;
          
          // Clear canvas to ensure transparency
          context.clearRect(0, 0, 512, 128);
          
          // Draw text in original color
          context.fillStyle = orbit.pha ? '#ff3333' : '#33ffaa';
          context.font = 'Bold 48px Arial';
          context.textAlign = 'center';
          context.fillText(orbit.name, 256, 80);
          
          // Create gray version canvas
          const grayCanvas = document.createElement('canvas');
          const grayContext = grayCanvas.getContext('2d');
          grayCanvas.width = 512;
          grayCanvas.height = 128;
          
          // Clear canvas to ensure transparency
          grayContext.clearRect(0, 0, 512, 128);
          
          // Draw text in gray
          grayContext.fillStyle = '#888888';
          grayContext.font = 'Bold 48px Arial';
          grayContext.textAlign = 'center';
          grayContext.fillText(orbit.name, 256, 80);
          
          // Create textures from both canvases
          const texture = new THREE.CanvasTexture(canvas);
          const grayTexture = new THREE.CanvasTexture(grayCanvas);
          
          const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0 // Start invisible, will show on zoom
          });
          const sprite = new THREE.Sprite(spriteMaterial);
          sprite.userData.originalTexture = texture;
          sprite.userData.grayTexture = grayTexture;
          
          // Position label at the furthest point of orbit (aphelion)
          const maxDistance = Math.max(...x.map((val, i) => 
            Math.sqrt(val**2 + y[i]**2 + z[i]**2)
          ));
          const labelIndex = x.findIndex((val, i) => 
            Math.sqrt(val**2 + y[i]**2 + z[i]**2) >= maxDistance * 0.95
          );
          
          if (labelIndex >= 0) {
            sprite.position.set(x[labelIndex], z[labelIndex], -y[labelIndex]);
            sprite.scale.set(0.5, 0.125, 1);
            sprite.userData.orbitName = orbit.name;
            sprite.userData.associatedLine = line;
            scene.add(sprite);
            labelsRef.current.push({ sprite, orbit: line });
            orbitsRef.current.push({ line, sprite, name: orbit.name, asteroidSphere });
          }
        });

        setLoading(false);
      } catch (err) {
        console.error('Failed to load orbits:', err);
        setError('Failed to load orbital data. Make sure backend is running.');
        setLoading(false);
      }

      // === Click handling for orbit and label selection ===
      const raycaster = new THREE.Raycaster();
      raycaster.params.Line.threshold = 0.1;
      const mouse = new THREE.Vector2();

      const selectOrbit = (orbitName) => {
        if (selectedAsteroid === orbitName) {
          // Deselect
          setSelectedAsteroid(null);
          selectedAsteroidRef.current = null;
          orbitsRef.current.forEach(({ line }) => {
            line.material.color.setHex(line.userData.originalColor);
            line.material.opacity = line.userData.originalOpacity;
          });
        } else {
          // Select new orbit
          setSelectedAsteroid(orbitName);
          selectedAsteroidRef.current = orbitName;
          orbitsRef.current.forEach(({ line }) => {
            if (line.userData.orbitData.name === orbitName) {
              line.material.color.setHex(line.userData.originalColor);
              line.material.opacity = 1.0;
            } else {
              line.material.color.setHex(0x666666);
              line.material.opacity = 0.15;
            }
          });
        }
      };

      const handleClick = (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        // Check for sprite (label) clicks first
        const spriteIntersects = raycaster.intersectObjects(
          labelsRef.current.map(({ sprite }) => sprite)
        );
        
        if (spriteIntersects.length > 0) {
          const clickedSprite = spriteIntersects[0].object;
          const orbitName = clickedSprite.userData.orbitName;
          selectOrbit(orbitName);
          return;
        }

        // Then check for orbit line clicks
        const lineIntersects = raycaster.intersectObjects(
          orbitsRef.current.map(o => o.line)
        );

        if (lineIntersects.length > 0) {
          const clickedLine = lineIntersects[0].object;
          const orbitName = clickedLine.userData.orbitData.name;
          selectOrbit(orbitName);
        } else {
          // Clicked on empty space, deselect
          setSelectedAsteroid(null);
          selectedAsteroidRef.current = null;
          orbitsRef.current.forEach(({ line }) => {
            line.material.color.setHex(line.userData.originalColor);
            line.material.opacity = line.userData.originalOpacity;
          });
        }
      };
      renderer.domElement.addEventListener('click', handleClick);

      // === Resize handling ===
      const handleResize = () => {
        if (!mountRef.current) return;
        const { clientWidth, clientHeight } = mountRef.current;
        renderer.setSize(clientWidth, clientHeight);
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', handleResize);

      // === Animation loop ===
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        controls.update();
        
        // Gentle rotation of sun glow for subtle animation
        if (sunGlow) {
          sunGlow.rotation.z += 0.001;
        }
        
        // Base speed for Earth's orbit (completes one orbit in ~3.5 minutes)
        const earthBaseSpeed = 0.00003;
        
        // Animate all planets along their elliptical orbits
        planetMeshes.forEach(planetMesh => {
          const planet = planetMesh.userData.planet;
          
          // Calculate speed relative to Earth's orbital period
          // Orbital speed is inversely proportional to orbital period
          const relativeSpeed = earthBaseSpeed / planet.orbitalPeriod;
          const angle = Date.now() * relativeSpeed;
          
          // Keplerian orbit equation
          const r = planet.distance * (1 - planet.eccentricity * planet.eccentricity) / 
                    (1 + planet.eccentricity * Math.cos(angle));
          const x = r * Math.cos(angle);
          const z = r * Math.sin(angle);
          
          // Update planet position
          planetMesh.position.x = x;
          planetMesh.position.z = z;
          
          // Rotate planet on its axis (faster for inner planets)
          planetMesh.rotation.y += 0.01 / planet.orbitalPeriod;
          
          // Update label position to follow planet
          if (planetMesh.userData.label) {
            planetMesh.userData.label.position.x = x;
            planetMesh.userData.label.position.z = z;
            planetMesh.userData.label.position.y = planet.size + 0.1;
          }
          
          // Special handling for Earth model
          if (planet.name === 'Earth' && earthModel) {
            earthModel.position.x = x;
            earthModel.position.z = z;
            earthModel.rotation.y += 0.01 / planet.orbitalPeriod;
          }
        });
        
        // Animate asteroids along their orbits
        orbitsRef.current.forEach(({ asteroidSphere }) => {
          if (asteroidSphere && asteroidSphere.userData.trajectory) {
            const traj = asteroidSphere.userData.trajectory;
            const totalPoints = traj.x.length;
            
            // Increment index to move asteroid along orbit (slower than planets)
            asteroidSphere.userData.currentIndex = (asteroidSphere.userData.currentIndex + 0.1) % totalPoints;
            const idx = Math.floor(asteroidSphere.userData.currentIndex);
            
            // Update asteroid position along trajectory
            asteroidSphere.position.set(
              traj.x[idx],
              traj.z[idx],
              -traj.y[idx]
            );
            
            // Slow rotation for visual interest
            asteroidSphere.rotation.x += 0.01;
            asteroidSphere.rotation.y += 0.015;
          }
        });
        
        // Update label visibility based on camera distance (zoom level)
        const cameraDistance = camera.position.length();
        const zoomThreshold = 8; // Show labels when zoomed in closer than this
        
        labelsRef.current.forEach(({ sprite }) => {
          // Check if there's a selection and if this sprite belongs to a non-selected orbit
          const isSelected = selectedAsteroidRef.current === null || sprite.userData.orbitName === selectedAsteroidRef.current;
          
          if (!isSelected) {
            // Use gray texture for non-selected orbits
            sprite.material.map = sprite.userData.grayTexture;
            sprite.material.needsUpdate = true;
            if (cameraDistance < zoomThreshold) {
              sprite.material.opacity = Math.min(1, (zoomThreshold - cameraDistance) / 3);
            } else {
              sprite.material.opacity = 0;
            }
          } else {
            // Show selected label in original color with full opacity
            sprite.material.map = sprite.userData.originalTexture;
            sprite.material.needsUpdate = true;
            if (cameraDistance < zoomThreshold) {
              // Fade in labels when zoomed in (only for selected or when nothing is selected)
              sprite.material.opacity = Math.min(1, (zoomThreshold - cameraDistance) / 3);
            } else {
              // Hide labels when zoomed out
              sprite.material.opacity = 0;
            }
          }
        });
        
        renderer.render(scene, camera);
      };
      animate();

      // === Cleanup ===
      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('click', handleClick);
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    };

    init().catch((err) => {
      console.error('Initialization error:', err);
      setError('Failed to initialize visualization');
      setLoading(false);
    });

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading orbital data...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center p-6 bg-red-900 bg-opacity-50 border border-red-600 rounded">
            <p className="text-red-200 font-bold mb-2">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
            <p className="text-red-400 text-xs mt-2">
              Make sure the backend server is running on port 5000
            </p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded text-sm">
          <p className="font-bold mb-1">Asteroid Orbits</p>
          <p className="text-xs text-gray-300">{asteroidCount} asteroids loaded</p>
          <p className="text-xs text-red-400 mt-1">🔴 PHA (Hazardous)</p>
          <p className="text-xs text-cyan-400">🟢 Non-PHA</p>
          <p className="text-xs text-blue-400 mt-1">🔵 Earth's orbit</p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded text-xs">
        <p>🖱️ Click and drag to rotate</p>
        <p>🔍 Scroll to zoom</p>
      </div>
    </div>
  );
};

export default OrbitVisualizer;
