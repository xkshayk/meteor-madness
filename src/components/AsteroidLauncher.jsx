import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AsteroidLauncher = ({ onLaunch, targetLocation, launchTrigger, presetAsteroid, onCraterCreate }) => {
  const [diameter, setDiameter] = useState(0.5); // km (500m)
  const [speed, setSpeed] = useState(60000); // km/h
  const [angle, setAngle] = useState(45);
  const [asteroidIndex, setAsteroidIndex] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentDiameter, setCurrentDiameter] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [impactEnergy, setImpactEnergy] = useState(0);
  const [hasImpacted, setHasImpacted] = useState(false);

  // Apply preset asteroid values if provided (but don't show results panel yet)
  useEffect(() => {
    if (presetAsteroid) {
      setDiameter(presetAsteroid.diameter);
      setSpeed(presetAsteroid.velocity);
      // Don't set showResults here - wait for user to select location and launch
    }
  }, [presetAsteroid]);

  const asteroids = [
    { name: 'Iron Asteroid', image: '🌑', color: '#8b8b8b' },
    { name: 'Stony Asteroid', image: '🪨', color: '#a67c52' },
    { name: 'Ice Asteroid', image: '❄️', color: '#b0e0e6' },
    { name: 'Metallic Asteroid', image: '⚙️', color: '#c0c0c0' },
    { name: 'Carbonaceous Asteroid', image: '⚫', color: '#2f2f2f' }
  ];

  const getDiameterText = (val) => {
    if (val < 1) {
      return `${Math.round(val * 1000)} m`;
    } else {
      return `${val.toFixed(2)} km`;
    }
  };

  const launchAsteroid = useCallback(() => {
    if (!targetLocation || isLaunching) return;
    
    setIsLaunching(true);
    setShowResults(true);
    setHasImpacted(false);
    
    // Initialize live stats
    setCurrentDiameter(diameter); // Already in km
    setCurrentSpeed(speed); // Already in km/h
    setImpactEnergy(0);
    
    console.log('=== LAUNCH STARTED ===');
    console.log('Target location received:', targetLocation);
    
    let endX, endY;
    
    if (targetLocation.pixelX && targetLocation.pixelY) {
      endX = targetLocation.pixelX;
      endY = targetLocation.pixelY;
      console.log('✓ Using pre-calculated pixels:', endX, endY);
    } else if (window.asteroidOverlay && window.asteroidMapDiv) {
      console.log('Attempting overlay calculation...');
      const latLng = new window.google.maps.LatLng(targetLocation.lat, targetLocation.lng);
      const pixel = window.asteroidOverlay.getPixelCoordinates(latLng);
      if (pixel) {
        const mapRect = window.asteroidMapDiv.getBoundingClientRect();
        endX = mapRect.left + pixel.x;
        endY = mapRect.top + pixel.y;
        console.log('✓ Calculated from overlay:', endX, endY);
      }
    }
    
    if (!endX || !endY) {
      console.log('✗ Using fallback - screen center');
      endX = window.innerWidth / 2 - 192;
      endY = window.innerHeight / 2;
    }
    
    console.log('Final target coordinates:', endX, endY);

    const asteroid = document.createElement('div');
    const initialSize = 5 + ((diameter - 328) / (5280 - 328)) * 20;
    
    asteroid.style.position = 'fixed';
    asteroid.style.width = initialSize + 'px';
    asteroid.style.height = initialSize + 'px';
    asteroid.style.borderRadius = '50%';
    asteroid.style.background = 'radial-gradient(circle at 30% 30%, #ff6600, #ff0000, #cc0000)';
    asteroid.style.boxShadow = '0 0 20px #ff6600, 0 0 40px #ff3300';
    asteroid.style.zIndex = '10000';
    asteroid.style.pointerEvents = 'none';
    
    const startX = endX;
    const startY = -100;
    
    asteroid.style.left = startX + 'px';
    asteroid.style.top = startY + 'px';
    
    document.body.appendChild(asteroid);

    const duration = 3000 - ((speed - 10000) / (300000 - 10000)) * 2500;
    const flightTimeInSeconds = duration / 1000;
    const startTime = Date.now();
    
    // Update live stats every 100ms
    const statsInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // elapsed in seconds
      
      // Diameter decreases by 0.08 km per second
      const newDiameter = Math.max(0, diameter - (0.08 * elapsed));
      setCurrentDiameter(newDiameter);
      
      // Speed decreases by 8000 km/h per second
      const newSpeed = Math.max(0, speed - (8000 * elapsed));
      setCurrentSpeed(newSpeed);
      
      if (elapsed >= flightTimeInSeconds) {
        clearInterval(statsInterval);
      }
    }, 100);
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const angleRadians = (angle * Math.PI) / 180;
      const horizontalOffset = Math.sin(angleRadians) * 200 * progress;
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentX = startX + (endX - startX) * eased + horizontalOffset;
      const currentY = startY + (endY - startY) * eased;
      
      const sizeMultiplier = 2 + ((diameter - 328) / (5280 - 328)) * 6;
      const size = initialSize + (progress * initialSize * sizeMultiplier);
      
      asteroid.style.left = currentX + 'px';
      asteroid.style.top = currentY + 'px';
      asteroid.style.width = size + 'px';
      asteroid.style.height = size + 'px';
      asteroid.style.transform = `rotate(${progress * 360}deg)`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const impactSize = 100 + ((diameter - 328) / (5280 - 328)) * 200;
        
        const impact = document.createElement('div');
        impact.style.position = 'fixed';
        impact.style.left = currentX + 'px';
        impact.style.top = currentY + 'px';
        impact.style.width = impactSize + 'px';
        impact.style.height = impactSize + 'px';
        impact.style.borderRadius = '50%';
        impact.style.background = 'radial-gradient(circle, rgba(255,102,0,0.8), rgba(255,0,0,0.4), transparent)';
        impact.style.transform = 'translate(-50%, -50%)';
        impact.style.zIndex = '9999';
        impact.style.pointerEvents = 'none';
        
        document.body.appendChild(impact);
        
        let currentImpactSize = impactSize;
        const impactStart = Date.now();
        const impactDuration = 500;
        
        const expandImpact = () => {
          const impactElapsed = Date.now() - impactStart;
          const impactProgress = Math.min(impactElapsed / impactDuration, 1);
          
          currentImpactSize = impactSize + (impactProgress * impactSize * 2);
          impact.style.width = currentImpactSize + 'px';
          impact.style.height = currentImpactSize + 'px';
          impact.style.opacity = 1 - impactProgress;
          
          if (impactProgress < 1) {
            requestAnimationFrame(expandImpact);
          } else {
            // Calculate final values at moment of impact
            const totalElapsed = (Date.now() - startTime) / 1000;
            const finalDiameter = Math.max(0, diameter - (0.08 * totalElapsed));
            const finalSpeed = Math.max(0, speed - (8000 * totalElapsed));
            
            document.body.removeChild(asteroid);
            document.body.removeChild(impact);
            
            // Calculate impact energy first to scale the crater
            const radiusKm = finalDiameter / 2;
            const radiusM = radiusKm * 1000;
            const volumeM3 = (4/3) * Math.PI * Math.pow(radiusM, 3);
            const massKg = volumeM3 * 3000;
            const velocityMS = finalSpeed * 1000 / 3600;
            const energyJoules = 0.5 * massKg * Math.pow(velocityMS, 2);
            const energyMegatons = energyJoules / (4.184e15);
            
            // Create expanding fireball animation
            const craterSize = 100 + (energyMegatons * 15);
            const maxCraterSize = 800;
            const finalCraterSize = Math.min(craterSize, maxCraterSize);
            
            const fireball = document.createElement('div');
            fireball.style.position = 'fixed';
            fireball.style.left = currentX + 'px';
            fireball.style.top = currentY + 'px';
            fireball.style.width = '50px';
            fireball.style.height = '50px';
            fireball.style.borderRadius = '50%';
            fireball.style.background = 'radial-gradient(circle at 30% 30%, #fff, #ffcc00, #ff6600, #ff3300, #cc0000)';
            fireball.style.boxShadow = '0 0 60px #ff6600, 0 0 120px #ff3300, 0 0 180px #ff0000';
            fireball.style.transform = 'translate(-50%, -50%)';
            fireball.style.zIndex = '9999';
            fireball.style.pointerEvents = 'none';
            
            document.body.appendChild(fireball);
            
            // Animate fireball expansion
            const fireballStart = Date.now();
            const fireballDuration = 2000; // 2 seconds
            let currentFireballSize = 50;
            
            const expandFireball = () => {
              const fireballElapsed = Date.now() - fireballStart;
              const fireballProgress = Math.min(fireballElapsed / fireballDuration, 1);
              
              // Expand from 50px to finalCraterSize
              currentFireballSize = 50 + (fireballProgress * (finalCraterSize - 50));
              fireball.style.width = currentFireballSize + 'px';
              fireball.style.height = currentFireballSize + 'px';
              
              // Fade out gradually
              const fadeStart = 0.6; // Start fading at 60% of animation
              if (fireballProgress > fadeStart) {
                const fadeProgress = (fireballProgress - fadeStart) / (1 - fadeStart);
                fireball.style.opacity = 1 - fadeProgress;
              }
              
              // Adjust glow intensity
              const glowIntensity = 1 - (fireballProgress * 0.7);
              fireball.style.boxShadow = `0 0 ${60 * glowIntensity}px #ff6600, 0 0 ${120 * glowIntensity}px #ff3300, 0 0 ${180 * glowIntensity}px #ff0000`;
              
              if (fireballProgress < 1) {
                requestAnimationFrame(expandFireball);
              } else {
                document.body.removeChild(fireball);
                
                // Notify parent to create crater on map at the impact coordinates
                if (onCraterCreate && targetLocation) {
                  onCraterCreate({
                    lat: targetLocation.lat,
                    lng: targetLocation.lng,
                    size: finalCraterSize
                  });
                }
              }
            };
            
            expandFireball();
            
            setIsLaunching(false);
            setHasImpacted(true);
            setImpactEnergy(energyMegatons);
          }
        };
        
        expandImpact();
      }
    };
    
    animate();
  }, [targetLocation, isLaunching, diameter, speed, angle]);

  useEffect(() => {
    if (launchTrigger > 0 && targetLocation && !isLaunching) {
      launchAsteroid();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchTrigger]);

  const handleLaunchClick = () => {
    onLaunch({
      diameter,
      speed,
      angle,
      asteroidType: asteroids[asteroidIndex]
    });
  };

  const handleNewClick = () => {
    setShowResults(false);
    setHasImpacted(false);
    // Clear the crater
    if (onCraterCreate) {
      onCraterCreate(null);
    }
    
    // Clean up crater if it exists
    if (window.impactCrater) {
      document.body.removeChild(window.impactCrater);
      window.impactCrater = null;
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-gray-900 shadow-2xl flex flex-col p-6 z-50">
      {!showResults ? (
        // Original Launcher Panel
        <>
          <h1 className="text-3xl font-light tracking-wider mb-8 text-white">
            {presetAsteroid ? presetAsteroid.name : 'ASTEROID'}<br/>LAUNCHER
          </h1>
          
          {presetAsteroid && (
            <div className="mb-6 p-4 bg-blue-900 border border-blue-700 rounded">
              <div className="text-blue-200 text-sm mb-2">Selected Asteroid:</div>
              <div className="text-white font-medium">{presetAsteroid.name}</div>
              <div className="text-blue-300 text-xs">({presetAsteroid.nickname})</div>
            </div>
          )}
      
          <div className="flex items-center justify-center mb-8">
            <button 
              onClick={() => setAsteroidIndex((asteroidIndex - 1 + asteroids.length) % asteroids.length)}
              className="p-2 hover:bg-gray-800 rounded transition-colors text-white"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="mx-8 text-center">
              <div className="text-6xl mb-2">{asteroids[asteroidIndex].image}</div>
              <div className="text-sm font-medium text-gray-300">{asteroids[asteroidIndex].name}</div>
            </div>
            
            <button 
              onClick={() => setAsteroidIndex((asteroidIndex + 1) % asteroids.length)}
              className="p-2 hover:bg-gray-800 rounded transition-colors text-white"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2 text-gray-300">
                <span className="text-gray-400">⭕</span> Diameter {presetAsteroid && '(Preset)'}
              </label>
              <span className="text-sm font-bold text-white">{getDiameterText(diameter)}</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="10"
              step="0.001"
              value={diameter}
              onChange={(e) => setDiameter(parseFloat(e.target.value))}
              disabled={!!presetAsteroid}
              className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider ${presetAsteroid ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2 text-gray-300">
                <span className="text-gray-400">⚡</span> Speed {presetAsteroid && '(Preset)'}
              </label>
              <span className="text-sm font-bold text-white">{speed.toLocaleString()} km/h</span>
            </div>
            <input
              type="range"
              min="10000"
              max="300000"
              step="1000"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              disabled={!!presetAsteroid}
              className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider ${presetAsteroid ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
          
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2 text-gray-300">
                <span className="text-gray-400">📐</span> Impact angle
              </label>
              <span className="text-sm font-bold text-white">{angle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          
          {!targetLocation && (
            <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded text-xs text-blue-200">
              Click on the map to set impact location
            </div>
          )}
          
          {targetLocation && (
            <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded text-xs text-green-200">
              Target set at ({targetLocation.lat.toFixed(4)}, {targetLocation.lng.toFixed(4)})
              {targetLocation.pixelX && targetLocation.pixelY && (
                <div className="mt-1">Screen: ({Math.round(targetLocation.pixelX)}, {Math.round(targetLocation.pixelY)})</div>
              )}
            </div>
          )}
          
          <button
            onClick={handleLaunchClick}
            disabled={!targetLocation || isLaunching}
            className={`w-full py-4 text-white font-medium tracking-wider transition-all ${
              !targetLocation || isLaunching
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 active:scale-95'
            }`}
          >
            {isLaunching ? 'LAUNCHING...' : 'LAUNCH ASTEROID'}
          </button>
        </>
      ) : (
        // Results Panel - Live Stats
        <>
          {hasImpacted && (
            <button 
              onClick={handleNewClick}
              className="absolute left-[8px] top-[85px] flex items-center gap-2 px-3 py-2 bg-gray-800 border-2 border-gray-600 hover:bg-gray-700 transition-colors text-white rounded shadow-lg text-sm z-50"
            >
              <span className="text-xl">🚀</span>
              <span className="font-medium">NEW</span>
            </button>
          )}
          
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-3xl font-light tracking-wider mb-12 text-center text-white">
              {presetAsteroid ? presetAsteroid.name : isLaunching ? 'ASTEROID IN FLIGHT' : 'IMPACT COMPLETE'}
            </h1>
            
            {presetAsteroid && (
              <p className="text-lg text-gray-400 mb-8 text-center">({presetAsteroid.nickname})</p>
            )}
            
            <div className="w-full space-y-6">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <span>⭕</span> CURRENT DIAMETER
                </div>
                <div className="text-3xl font-bold text-white">
                  {currentDiameter.toFixed(3)} km
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Started at {diameter.toFixed(3)} km
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <span>⚡</span> CURRENT VELOCITY
                </div>
                <div className="text-3xl font-bold text-white">
                  {Math.round(currentSpeed).toLocaleString()} km/h
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Started at {speed.toLocaleString()} km/h
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <span>📐</span> IMPACT ANGLE
                </div>
                <div className="text-3xl font-bold text-white">
                  {angle}°
                </div>
              </div>
              
              {hasImpacted && (
                <div className="bg-orange-900 p-6 rounded-lg border border-orange-700">
                  <div className="text-sm text-orange-300 mb-2 flex items-center gap-2">
                    <span>💥</span> IMPACT ENERGY
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {impactEnergy >= 10000 
                      ? `${(impactEnergy / 1000).toFixed(2)} Gt`
                      : impactEnergy >= 1 
                        ? `${impactEnergy.toFixed(2)} Mt`
                        : impactEnergy >= 0.001
                          ? `${(impactEnergy * 1000).toFixed(2)} Kt`
                          : `${impactEnergy.toExponential(2)} Mt`
                    }
                  </div>
                  <div className="text-xs text-orange-400 mt-1">
                    {impactEnergy >= 10000 
                      ? 'Gigatons' 
                      : impactEnergy >= 1 
                        ? 'Megatons' 
                        : 'Kilotons'} of TNT equivalent
                  </div>
                </div>
              )}
              
              {!isLaunching && hasImpacted && (
                <div className="mt-8 p-4 bg-red-900 border-2 border-red-700 rounded-lg text-center">
                  <div className="text-2xl mb-2">💥</div>
                  <div className="text-sm font-medium text-red-200">
                    IMPACT DETECTED
                  </div>
                  <div className="text-xs text-red-400 mt-1">
                    Click NEW to launch another asteroid
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(0,0,0,0.5);
        }
        
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 4px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
};

export default AsteroidLauncher;