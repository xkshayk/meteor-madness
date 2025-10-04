import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const AsteroidLanding = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Real Near-Earth Asteroids with accurate data
  const asteroids = [
    {
      id: '433',
      name: '433 Eros',
      nickname: 'Eros',
      diameter: 16.84,
      velocity: 86400,
      distance: 26700000,
      isPotentiallyHazardous: false
    },
    {
      id: '99942',
      name: '99942 Apophis',
      nickname: 'Apophis',
      diameter: 0.37,
      velocity: 30600,
      distance: 31200000,
      isPotentiallyHazardous: true
    },
    {
      id: '101955',
      name: '101955 Bennu',
      nickname: 'Bennu',
      diameter: 0.49,
      velocity: 101400,
      distance: 84000000,
      isPotentiallyHazardous: true
    },
    {
      id: '1036',
      name: '1036 Ganymed',
      nickname: 'Ganymed',
      diameter: 31.66,
      velocity: 72000,
      distance: 56000000,
      isPotentiallyHazardous: false
    },
    {
      id: '4179',
      name: '4179 Toutatis',
      nickname: 'Toutatis',
      diameter: 2.5,
      velocity: 35280,
      distance: 7000000,
      isPotentiallyHazardous: false
    },
    {
      id: '25143',
      name: '25143 Itokawa',
      nickname: 'Itokawa',
      diameter: 0.33,
      velocity: 95400,
      distance: 48000000,
      isPotentiallyHazardous: false
    },
    {
      id: '1566',
      name: '1566 Icarus',
      nickname: 'Icarus',
      diameter: 1.4,
      velocity: 93600,
      distance: 6300000,
      isPotentiallyHazardous: true
    },
    {
      id: '4660',
      name: '4660 Nereus',
      nickname: 'Nereus',
      diameter: 0.33,
      velocity: 23400,
      distance: 4600000,
      isPotentiallyHazardous: false
    },
    {
      id: '162173',
      name: '162173 Ryugu',
      nickname: 'Ryugu',
      diameter: 0.88,
      velocity: 91800,
      distance: 95000000,
      isPotentiallyHazardous: false
    },
    {
      id: '3200',
      name: '3200 Phaethon',
      nickname: 'Phaethon',
      diameter: 5.1,
      velocity: 110000,
      distance: 10500000,
      isPotentiallyHazardous: true
    },
    {
      id: '2062',
      name: '2062 Aten',
      nickname: 'Aten',
      diameter: 0.9,
      velocity: 87840,
      distance: 18600000,
      isPotentiallyHazardous: false
    },
    {
      id: '1862',
      name: '1862 Apollo',
      nickname: 'Apollo',
      diameter: 1.5,
      velocity: 106200,
      distance: 11000000,
      isPotentiallyHazardous: false
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
            className="h-12 w-12"
          />
          <h1 className="text-2xl font-light tracking-[0.3em] text-gray-300">
            METEOR MADNESS
          </h1>
        </div>

        <div className="text-gray-400 text-sm">
          Choose an asteroid or{' '}
          <button 
            onClick={handleCreateOwn}
            className="underline hover:text-white transition-colors cursor-pointer"
          >
            create your own
          </button>
        </div>
      </header>

      {/* Main content area - Asteroid grid will go here */}
      <div className="relative z-10 h-[calc(100vh-80px)] overflow-y-auto">
        <div className="container mx-auto px-8 py-12">
          <h2 className="text-3xl font-light tracking-wider text-white mb-8 text-center">
            SELECT A NEAR-EARTH ASTEROID
          </h2>

          {/* Placeholder grid - will be populated with real asteroid data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Real asteroid cards */}
            {asteroids.map((asteroid) => (
              <div 
                key={asteroid.id}
                onClick={() => handleAsteroidClick(asteroid)}
                className="bg-gray-900 bg-opacity-80 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">
                      {asteroid.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">({asteroid.nickname})</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl">☄️</span>
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
                    <span className="text-gray-400">Velocity:</span>
                    <span className="text-gray-200">{asteroid.velocity.toLocaleString()} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Distance:</span>
                    <span className="text-gray-200">{(asteroid.distance / 1000000).toFixed(1)}M km</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <button 
                    onClick={(e) => handleLaunchAsteroid(asteroid, e)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    LAUNCH THIS ASTEROID
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsteroidLanding;
