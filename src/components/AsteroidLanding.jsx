import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import OrbitVisualizer from './OrbitVisualizer';

const AsteroidLanding = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Keep only 4 high-PHA asteroids with varying sizes
  const asteroids = [
    {
      id: '29075',
      name: '29075 1950 DA',
      nickname: '1950 DA',
      diameter: 1.3,
      velocity: 14.1, // km/s
      period: 2.21, // years
      predictedImpactPeriod: '2880',
      isPotentiallyHazardous: true,
      modelPath: '/models/1950 DA Prograde.obj',
      modelType: 'obj',
      // M-type metallic asteroid (NASA data)
      composition: {
        'Iron-Nickel': 85,
        'Silicate': 10,
        'Other Metals': 5
      },
      density: 7500, // kg/m³
      ablationRate: 0.065, // km/s
      velocityReduction: 0.8, // km/s
      initialTemp: -73, // °C
      heatingRate: 87.3 // °C per second during atmospheric entry
    },
    {
      id: '101955',
      name: '101955 Bennu',
      nickname: 'Bennu',
      diameter: 0.49,
      velocity: 5.99, // km/s
      period: 1.2, // years
      predictedImpactPeriod: '2178 - 2290',
      isPotentiallyHazardous: true,
      modelPath: '/models/Bennu_v20_200k.obj',
      modelType: 'obj',
      // C-type carbonaceous asteroid (OSIRIS-REx mission data)
      composition: {
        'Carbonaceous': 40,
        'Silicate': 35,
        'Hydrated Minerals': 25
      },
      density: 1190, // kg/m³ (NASA OSIRIS-REx data)
      ablationRate: 0.20, // km/s
      velocityReduction: 2.5, // km/s
      initialTemp: -73, // °C
      heatingRate: 47.3 // °C per second
    },
    {
      id: '2020VV',
      name: '2020 VV',
      nickname: '2020 VV',
      diameter: 0.012,
      velocity: 2.58, // km/s
      period: 1.18, // years
      predictedImpactPeriod: '2044 - 2122',
      isPotentiallyHazardous: false,
      modelPath: '/Animation-Asteroid-Rotating.gif',
      modelType: 'gif',
      // S-type stony asteroid (typical for near-Earth asteroids)
      composition: {
        'Silicate': 70,
        'Iron-Nickel': 25,
        'Carbonaceous': 5
      },
      density: 3000, // kg/m³
      ablationRate: 0.10, // km/s
      velocityReduction: 1.5, // km/s
      initialTemp: -73, // °C
      heatingRate: 67.3 // °C per second
    }
  ];

  // Animate asteroid field in background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create stars
    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        opacity: Math.random(),
      });
    }

    // Create asteroids
    const asteroids = [];
    for (let i = 0; i < 50; i++) {
      asteroids.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
      });
    }

    function animate() {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // Draw and update asteroids
      asteroids.forEach(asteroid => {
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();
        ctx.arc(asteroid.x, asteroid.y, asteroid.size, 0, Math.PI * 2);
        ctx.fill();

        asteroid.x += asteroid.speedX;
        asteroid.y += asteroid.speedY;

        // Wrap around screen
        if (asteroid.x < 0) asteroid.x = canvas.width;
        if (asteroid.x > canvas.width) asteroid.x = 0;
        if (asteroid.y < 0) asteroid.y = canvas.height;
        if (asteroid.y > canvas.height) asteroid.y = 0;
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

  const handleCreateOwn = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/simulator');
    }, 500);
  };

  const handleAsteroidClick = (asteroid) => {
    navigate(`/asteroid/${asteroid.id}`, { state: { asteroid } });
  };

  const handleLaunchAsteroid = (asteroid, e) => {
    e.stopPropagation(); // Prevent card click
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/simulator', { state: { presetAsteroid: asteroid } });
    }, 500);
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-black transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Animated space background */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 bg-black bg-opacity-80 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <img 
            src="https://www.nasa.gov/wp-content/themes/nasa/assets/images/nasa-logo.svg" 
            alt="NASA" 
            className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          />
          <h1 className="text-2xl font-light tracking-[0.3em] text-gray-300">
            METEOR MADNESS
          </h1>
        </div>
      </header>

      {/* Main content area - Asteroid grid will go here */}
      <div className="relative z-10 h-[calc(100vh-80px)] overflow-y-auto">
        <div className="container mx-auto px-8 py-12">
          <h2 className="text-3xl font-light tracking-wider text-white mb-8 text-center">
            SELECT A NEAR-EARTH ASTEROID
          </h2>

          {/* Placeholder grid - will be populated with real asteroid data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* 3 Asteroid cards */}
            {asteroids.map((asteroid) => (
              <div 
                key={asteroid.id}
                onClick={() => handleAsteroidClick(asteroid)}
                className="bg-gray-900 bg-opacity-80 border border-red-700 rounded-lg p-6 hover:border-red-500 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white group-hover:text-red-400 transition-colors">
                      {asteroid.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">({asteroid.nickname})</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span 
                      className="text-2xl"
                      style={!asteroid.isPotentiallyHazardous ? {
                        filter: 'hue-rotate(90deg) saturate(2)'
                      } : {}}
                    >
                      ☄️
                    </span>
                    {asteroid.isPotentiallyHazardous && (
                      <span className="text-xs text-red-400 mt-1">⚠️ PHA</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Diameter:</span>
                    <span className="text-gray-200">{asteroid.diameter} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Near Earth Velocity:</span>
                    <span className="text-gray-200">{asteroid.velocity.toFixed(1)} km/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Orbital Period:</span>
                    <span className="text-gray-200">{asteroid.period} years</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <button 
                    onClick={(e) => handleLaunchAsteroid(asteroid, e)}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    LAUNCH THIS ASTEROID
                  </button>
                </div>
              </div>
            ))}

            {/* Create Your Own Card */}
            <div 
              onClick={handleCreateOwn}
              className="bg-gray-900 bg-opacity-80 border border-gray-700 rounded-lg p-6 hover:border-gray-500 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex-1 flex items-center justify-center">
                <span className="text-9xl text-white font-light">?</span>
              </div>
              
              <div className="mt-4">
                <button 
                  onClick={handleCreateOwn}
                  className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium rounded transition-colors"
                >
                  CREATE YOUR OWN
                </button>
              </div>
            </div>
          </div>

          {/* Full-width 3D Orbital Visualization */}
          <div className="bg-gray-900 bg-opacity-80 border border-purple-700 rounded-lg overflow-hidden">
            <div className="h-[calc(100vh-200px)] min-h-[800px]">
              <OrbitVisualizer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsteroidLanding;
