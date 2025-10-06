import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

const AsteroidModel3D = ({ modelPath, asteroidName }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    const container = containerRef.current;
    const size = 192;
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    camera.position.z = 2;

    // Load OBJ model
    const loader = new OBJLoader();
    let asteroidModel;

    loader.load(
      modelPath,
      (object) => {
        asteroidModel = object;
        
        // Scale and position the model
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim;
        object.scale.set(scale, scale, scale);
        
        // Center the model
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center.multiplyScalar(scale));
        
        // Apply material
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshPhongMaterial({
              color: 0x888888,
              shininess: 10
            });
          }
        });
        
        scene.add(object);
      },
      undefined,
      (error) => {
        console.error('Error loading asteroid model:', error);
      }
    );

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      if (asteroidModel) {
        asteroidModel.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [modelPath]);

  return (
    <div 
      ref={containerRef} 
      className="mx-auto mb-4 flex items-center justify-center"
      style={{ width: '192px', height: '192px' }}
    />
  );
};

const AsteroidDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasRef = useRef(null);
  
  const asteroid = location.state?.asteroid;

  // Redirect if no asteroid data
  useEffect(() => {
    if (!asteroid) {
      navigate('/');
    }
  }, [asteroid, navigate]);

  // Animated background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        opacity: Math.random(),
      });
    }

    function animate() {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!asteroid) return null;

  // Calculate risk assessment
  const getRiskAssessment = () => {
    const largeSize = asteroid.diameter > 1; // > 1 km
    const highVelocity = asteroid.velocity > 25; // > 25 km/s
    const nearTermImpact = asteroid.predictedImpactPeriod && !asteroid.predictedImpactPeriod.includes('-') && parseInt(asteroid.predictedImpactPeriod) < 2100;
    
    if (asteroid.isPotentiallyHazardous) {
      return {
        level: 'HIGH RISK',
        color: 'text-red-500',
        bgColor: 'bg-red-900',
        borderColor: 'border-red-700',
        summary: `${asteroid.nickname} is classified as a Potentially Hazardous Asteroid (PHA) by NASA. ${
          largeSize 
            ? `With a diameter of ${asteroid.diameter} km, an impact would cause regional to global devastation.` 
            : 'While smaller in size, its orbit brings it dangerously close to Earth.'
        } Predicted impact period: ${asteroid.predictedImpactPeriod}. Continuous monitoring is essential to track any orbital changes.`
      };
    } else if (largeSize) {
      return {
        level: 'MODERATE RISK',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-900',
        borderColor: 'border-yellow-700',
        summary: `While not currently classified as potentially hazardous, ${asteroid.nickname} warrants attention. Its ${asteroid.diameter} km diameter makes it large enough to cause significant damage. Predicted impact period: ${asteroid.predictedImpactPeriod}. However, precise orbital calculations indicate no immediate threat. Scientists continue to refine its trajectory with each observation.`
      };
    } else {
      return {
        level: 'LOW RISK',
        color: 'text-green-500',
        bgColor: 'bg-green-900',
        borderColor: 'border-green-700',
        summary: `${asteroid.nickname} poses minimal threat to Earth. At ${asteroid.diameter} km in diameter, even a direct impact would cause only localized damage. Predicted impact period: ${asteroid.predictedImpactPeriod}. Its trajectory is well-understood and predictable. This asteroid is an excellent target for scientific study without posing a danger to our planet.`
      };
    }
  };

  const risk = getRiskAssessment();

  const pages = [
    // Page 0: Overview
    {
      title: 'ASTEROID OVERVIEW',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            {asteroid.id === '29075' ? (
              <AsteroidModel3D 
                modelPath="/models/1950 DA Prograde.obj" 
                asteroidName="1950 DA"
              />
            ) : asteroid.id === '101955' ? (
              <AsteroidModel3D 
                modelPath="/models/Bennu_v20_200k.obj" 
                asteroidName="Bennu"
              />
            ) : asteroid.isPotentiallyHazardous ? (
              <div className="text-8xl mb-4">
                ☄️
              </div>
            ) : (
              <img 
                src="/Animation-Asteroid-Rotating.gif" 
                alt="Rotating Asteroid" 
                className="w-48 h-48 mx-auto mb-4 object-contain"
                style={{
                  filter: 'brightness(1.5) contrast(1.2)',
                  mixBlendMode: 'screen'
                }}
              />
            )}
            <h2 className="text-4xl font-light text-white mb-2">{asteroid.name}</h2>
            <p className="text-xl text-gray-400">({asteroid.nickname})</p>
            {asteroid.isPotentiallyHazardous && (
              <div className="mt-4 inline-block px-4 py-2 bg-red-900 border border-red-700 rounded">
                <span className="text-red-300 font-medium">⚠️ POTENTIALLY HAZARDOUS ASTEROID</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">DIAMETER</div>
              <div className="text-3xl font-bold text-white">{asteroid.diameter} km</div>
              <div className="text-xs text-gray-500 mt-1">
                {asteroid.diameter > 10 ? 'Extremely Large' : asteroid.diameter > 1 ? 'Large' : 'Small to Medium'}
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">VELOCITY</div>
              <div className="text-3xl font-bold text-white">{asteroid.velocity.toFixed(1)}</div>
              <div className="text-xs text-gray-500 mt-1">km/s relative to Earth</div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">ORBITAL PERIOD</div>
              <div className="text-3xl font-bold text-white">{asteroid.period}</div>
              <div className="text-xs text-gray-500 mt-1">Years</div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">PREDICTED IMPACT PERIOD</div>
              <div className="text-3xl font-bold text-white">{asteroid.predictedImpactPeriod}</div>
              <div className="text-xs text-gray-500 mt-1">Year(s)</div>
            </div>
          </div>
        </div>
      )
    },
    // Page 1: Physical Characteristics
    {
      title: 'PHYSICAL CHARACTERISTICS',
      content: (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-medium text-white mb-4">Size Comparison</h3>
            <div className="space-y-4">
              <div>
                <div className="text-gray-400 text-sm mb-2">Diameter: {asteroid.diameter} km ({asteroid.diameter * 1000} m)</div>
                <div className="text-gray-300">
                  {asteroid.diameter >= 10 && '🏔️ Larger than Mount Everest'}
                  {asteroid.diameter >= 5 && asteroid.diameter < 10 && '🏔️ About the size of a large mountain'}
                  {asteroid.diameter >= 1 && asteroid.diameter < 5 && '🏙️ Larger than most major cities'}
                  {asteroid.diameter >= 0.5 && asteroid.diameter < 1 && '🌆 Size of a small city'}
                  {asteroid.diameter >= 0.1 && asteroid.diameter < 0.5 && '🏢 Size of several city blocks'}
                  {asteroid.diameter >= 0.05 && asteroid.diameter < 0.1 && '🏟️ About the size of a large stadium'}
                  {asteroid.diameter >= 0.01 && asteroid.diameter < 0.05 && '🏠 Size of a large building or small neighborhood'}
                  {asteroid.diameter < 0.01 && '🚗 Size of a house or smaller'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-medium text-white mb-4">Velocity Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Orbital Speed:</span>
                <span className="text-white">{asteroid.velocity.toFixed(1)} km/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Meters per second:</span>
                <span className="text-white">{(asteroid.velocity * 1000).toFixed(0)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mach number:</span>
                <span className="text-white">Mach {(asteroid.velocity * 1000 / 343).toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className={`${risk.bgColor} p-6 rounded-lg border ${risk.borderColor}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-medium text-white">Risk Level</h3>
              <div className={`text-3xl font-bold ${risk.color}`}>{risk.level}</div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {risk.summary}
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleLaunch = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/simulator', { state: { presetAsteroid: asteroid } });
    }, 500);
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-black transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 bg-black bg-opacity-80 border-b border-gray-800">
        <button 
          onClick={() => navigate('/asteroids')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <span>←</span>
          <span>BACK TO ASTEROIDS</span>
        </button>
        
        <h1 className="text-2xl font-light tracking-[0.3em] text-gray-300">
          ASTEROID DETAILS
        </h1>

        <button 
          onClick={handleLaunch}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
        >
          LAUNCH SIMULATION
        </button>
      </header>

      {/* Main Content */}
      <div className="relative z-10 h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="container max-w-4xl mx-auto px-8">
          {/* Page Title */}
          <h2 className="text-3xl font-light text-white text-center mb-8 tracking-wider">
            {pages[currentPage].title}
          </h2>

          {/* Page Content */}
          <div className="bg-gray-900 bg-opacity-90 rounded-lg p-8 border border-gray-700 min-h-[500px]">
            {pages[currentPage].content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className={`px-6 py-3 rounded font-medium transition-all ${
                currentPage === 0
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              ← PREVIOUS
            </button>

            <div className="flex gap-2">
              {pages.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentPage ? 'bg-blue-500 w-8' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={currentPage === pages.length - 1}
              className={`px-6 py-3 rounded font-medium transition-all ${
                currentPage === pages.length - 1
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              NEXT →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsteroidDetail;
