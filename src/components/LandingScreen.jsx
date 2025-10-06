import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

const LandingScreen = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup similar to asteroid visualizer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000814);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create floating asteroids
    const asteroids = [];
    const asteroidCount = 50;
    
    for (let i = 0; i < asteroidCount; i++) {
      const geometry = new THREE.DodecahedronGeometry(Math.random() * 0.15 + 0.05, 0);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x8b8b8b,
        roughness: 0.9,
        metalness: 0.1
      });
      const asteroid = new THREE.Mesh(geometry, material);
      
      // Random positions
      asteroid.position.x = (Math.random() - 0.5) * 20;
      asteroid.position.y = (Math.random() - 0.5) * 20;
      asteroid.position.z = (Math.random() - 0.5) * 10 - 5;
      
      // Random rotation speeds
      asteroid.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02
      };
      
      // Random drift speed
      asteroid.userData.driftSpeed = {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01
      };
      
      scene.add(asteroid);
      asteroids.push(asteroid);
    }

    // Add stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 100;
      starPositions[i + 1] = (Math.random() - 0.5) * 100;
      starPositions[i + 2] = (Math.random() - 0.5) * 50 - 10;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.8
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate and drift asteroids
      asteroids.forEach(asteroid => {
        asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
        asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
        asteroid.rotation.z += asteroid.userData.rotationSpeed.z;
        
        asteroid.position.x += asteroid.userData.driftSpeed.x;
        asteroid.position.y += asteroid.userData.driftSpeed.y;
        
        // Wrap around screen edges
        if (asteroid.position.x > 10) asteroid.position.x = -10;
        if (asteroid.position.x < -10) asteroid.position.x = 10;
        if (asteroid.position.y > 10) asteroid.position.y = -10;
        if (asteroid.position.y < -10) asteroid.position.y = 10;
      });
      
      // Slowly rotate stars
      stars.rotation.y += 0.0002;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const handleEnter = () => {
    // Navigate to the main application page
    navigate('/asteroids');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Three.js Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-between py-20">
        {/* Upper Third - Title (moved down 100px) */}
        <div className="flex-1 flex items-center justify-center" style={{ paddingTop: '100px' }}>
          <h1 
            onClick={handleEnter}
            className="text-8xl font-extralight tracking-widest text-white cursor-pointer transition-all duration-300 hover:drop-shadow-[0_0_30px_rgba(147,51,234,0.8)]"
            style={{
              textShadow: '0 0 20px rgba(147, 51, 234, 0.3), 0 0 40px rgba(147, 51, 234, 0.2)'
            }}
          >
            NEOScope
          </h1>
        </div>
        
        {/* Bottom Third - Credits */}
        <div className="flex-1 flex items-end justify-center pb-20">
          <p 
            className="text-lg font-light tracking-wide text-gray-400"
            style={{
              textShadow: '0 0 10px rgba(147, 51, 234, 0.15)'
            }}
          >
            Akshay Kolwalkar & Angelina Fernandes
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;
