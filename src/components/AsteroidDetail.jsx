import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

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
    const closeDistance = asteroid.distance < 10000000; // < 10M km
    const largeSize = asteroid.diameter > 1; // > 1 km
    const highVelocity = asteroid.velocity > 90000; // > 90,000 km/h
    
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
        } ${
          closeDistance 
            ? `Its close approach distance of ${(asteroid.distance / 1000000).toFixed(1)} million km means it passes within the "threat zone."` 
            : 'However, current orbital calculations show it will maintain a safe distance during upcoming approaches.'
        } Continuous monitoring is essential to track any orbital changes.`
      };
    } else if (closeDistance && largeSize) {
      return {
        level: 'MODERATE RISK',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-900',
        borderColor: 'border-yellow-700',
        summary: `While not currently classified as potentially hazardous, ${asteroid.nickname} warrants attention. Its ${asteroid.diameter} km diameter makes it large enough to cause significant damage, and its relatively close approach distance of ${(asteroid.distance / 1000000).toFixed(1)} million km means its orbit intersects Earth's neighborhood. However, precise orbital calculations indicate no immediate threat. Scientists continue to refine its trajectory with each observation.`
      };
    } else {
      return {
        level: 'LOW RISK',
        color: 'text-green-500',
        bgColor: 'bg-green-900',
        borderColor: 'border-green-700',
        summary: `${asteroid.nickname} poses minimal threat to Earth. ${
          !largeSize 
            ? `At ${asteroid.diameter} km in diameter, even a direct impact would cause only localized damage.` 
            : 'Despite its considerable size, '
        }${
          !closeDistance 
            ? ` Its orbital path keeps it at a safe distance of ${(asteroid.distance / 1000000).toFixed(1)} million km from Earth.` 
            : ' its trajectory is well-understood and predictable.'
        } This asteroid is an excellent target for scientific study without posing a danger to our planet.`
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
            <div className="text-8xl mb-4">☄️</div>
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
              <div className="text-3xl font-bold text-white">{asteroid.velocity.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">km/h relative to Earth</div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">DISTANCE</div>
              <div className="text-3xl font-bold text-white">{(asteroid.distance / 1000000).toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Million kilometers</div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">DESIGNATION</div>
              <div className="text-3xl font-bold text-white">{asteroid.id}</div>
              <div className="text-xs text-gray-500 mt-1">NASA ID Number</div>
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
                <div className="text-gray-400 text-sm mb-2">Diameter: {asteroid.diameter} km</div>
                <div className="text-gray-300">
                  {asteroid.diameter > 10 && '🏔️ Larger than Mount Everest'}
                  {asteroid.diameter > 5 && asteroid.diameter <= 10 && '🏔️ About the size of a large mountain'}
                  {asteroid.diameter > 1 && asteroid.diameter <= 5 && '🏙️ Larger than most major cities'}
                  {asteroid.diameter > 0.5 && asteroid.diameter <= 1 && '🌆 Size of a small city'}
                  {asteroid.diameter <= 0.5 && '🏢 Several city blocks to small town'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-medium text-white mb-4">Velocity Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Orbital Speed:</span>
                <span className="text-white">{asteroid.velocity.toLocaleString()} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Meters per second:</span>
                <span className="text-white">{((asteroid.velocity * 1000) / 3600).toFixed(0)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mach number:</span>
                <span className="text-white">Mach {((asteroid.velocity * 1000) / 3600 / 343).toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-medium text-white mb-4">Estimated Mass</h3>
            <div className="text-gray-300">
              Assuming an average asteroid density of 3,000 kg/m³:
            </div>
            <div className="text-3xl font-bold text-white mt-2">
              {((4/3) * Math.PI * Math.pow((asteroid.diameter / 2) * 1000, 3) * 3000 / 1e12).toExponential(2)} trillion kg
            </div>
          </div>
        </div>
      )
    },
    // Page 2: Risk Assessment
    {
      title: 'EARTH IMPACT RISK ASSESSMENT',
      content: (
        <div className="space-y-6">
          <div className={`${risk.bgColor} p-6 rounded-lg border ${risk.borderColor}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-medium text-white">Risk Level</h3>
              <div className={`text-3xl font-bold ${risk.color}`}>{risk.level}</div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {risk.summary}
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-medium text-white mb-4">Impact Potential</h3>
            <div className="space-y-4">
              <div>
                <div className="text-gray-400 text-sm mb-1">Kinetic Energy (if impact occurred)</div>
                <div className="text-white">
                  {(() => {
                    const mass = (4/3) * Math.PI * Math.pow((asteroid.diameter / 2) * 1000, 3) * 3000;
                    const velocity = (asteroid.velocity * 1000) / 3600;
                    const energy = 0.5 * mass * Math.pow(velocity, 2);
                    const megatons = energy / (4.184e15);
                    return megatons >= 1000 
                      ? `${(megatons / 1000).toFixed(1)} Gigatons TNT`
                      : megatons >= 1
                        ? `${megatons.toFixed(1)} Megatons TNT`
                        : `${(megatons * 1000).toFixed(1)} Kilotons TNT`;
                  })()}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Potential Crater Size</div>
                <div className="text-white">
                  ~{(asteroid.diameter * 20).toFixed(1)} km diameter
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Devastation Radius</div>
                <div className="text-white">
                  {asteroid.diameter > 10 && 'Global extinction event'}
                  {asteroid.diameter > 5 && asteroid.diameter <= 10 && 'Continental devastation'}
                  {asteroid.diameter > 1 && asteroid.diameter <= 5 && 'Regional destruction'}
                  {asteroid.diameter > 0.5 && asteroid.diameter <= 1 && 'City-wide destruction'}
                  {asteroid.diameter <= 0.5 && 'Localized damage'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-medium text-white mb-4">Monitoring Status</h3>
            <p className="text-gray-300">
              {asteroid.isPotentiallyHazardous 
                ? `${asteroid.nickname} is actively monitored by NASA's Center for Near-Earth Object Studies (CNEOS). Its orbit is continuously refined with each observation to ensure accurate trajectory predictions.`
                : `${asteroid.nickname} is catalogued in NASA's Near-Earth Object database. While not considered potentially hazardous, its orbit is periodically updated as part of routine sky surveys.`
              }
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
          onClick={() => navigate('/')}
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
