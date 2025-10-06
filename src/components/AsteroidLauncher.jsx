import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

const AsteroidModel3D = ({ modelPath }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    const container = containerRef.current;
    const size = 144;
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
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelPath]);

  return (
    <div 
      ref={containerRef} 
      className="flex items-center justify-center"
      style={{ width: '144px', height: '144px' }}
    />
  );
};

const AsteroidLauncher = ({ onLaunch, targetLocation, launchTrigger, presetAsteroid, onCraterCreate, onLaunchingChange }) => {
  const [diameter, setDiameter] = useState(0.5); // km (500m)
  const [speed, setSpeed] = useState(16.7); // km/s
  const [asteroidIndex, setAsteroidIndex] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentDiameter, setCurrentDiameter] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [initialDiameter, setInitialDiameter] = useState(0); // Actual start diameter
  const [initialSpeed, setInitialSpeed] = useState(0); // Actual start speed
  const [impactEnergy, setImpactEnergy] = useState(0);
  const [hasImpacted, setHasImpacted] = useState(false);
  const [isAirburst, setIsAirburst] = useState(false);
  const [airburstAltitude, setAirburstAltitude] = useState(0);
  const [showCutscene, setShowCutscene] = useState(false);
  const [surfaceTemp, setSurfaceTemp] = useState(0);
  const [actualFlightTime, setActualFlightTime] = useState(0);

  // Apply preset asteroid values if provided (but don't show results panel yet)
  useEffect(() => {
    if (presetAsteroid) {
      setDiameter(presetAsteroid.diameter);
      setSpeed(presetAsteroid.velocity);
      
      // Match incoming asteroid with local presetAsteroids array to get full NASA data
      const matchedPreset = presetAsteroids.find(a => a.id === presetAsteroid.id);
      if (matchedPreset) {
        console.log('✓ Matched incoming presetAsteroid with local NASA data:', matchedPreset.nickname);
        setSelectedPreset(matchedPreset); // Use the matched preset with full NASA data
        const index = presetAsteroids.findIndex(a => a.id === presetAsteroid.id);
        if (index !== -1) setCurrentPresetIndex(index);
      } else {
        console.log('⚠ No match found, using incoming presetAsteroid as-is');
        setSelectedPreset(presetAsteroid);
      }
    }
  }, [presetAsteroid]);

  const asteroids = [
    { 
      name: 'Iron Asteroid', 
      image: '🌑', 
      color: '#8b8b8b',
      composition: { metal: 90, silicate: 10 },
      density: 7500, // kg/m³
      ablationRate: 0.065, // km/s
      velocityReduction: 0.8, // km/s (iron meteors retain most velocity)
      initialTemp: -73, // °C (cold space temperature)
      heatingRate: 87.3 // °C per second during atmospheric entry (reaches ~800°C)
    },
    { 
      name: 'Stony Asteroid', 
      image: '🪨', 
      color: '#a67c52',
      composition: { silicate: 75, metal: 25 },
      density: 3000, // kg/m³
      ablationRate: 0.10, // km/s
      velocityReduction: 1.5, // km/s (moderate deceleration)
      initialTemp: -73, // °C
      heatingRate: 67.3 // °C per second (reaches ~600°C)
    },
    { 
      name: 'Ice Asteroid', 
      image: '❄️', 
      color: '#b0e0e6',
      composition: { ice: 50, silicate: 30, organics: 20 },
      density: 1500, // kg/m³
      ablationRate: 0.25, // km/s
      velocityReduction: 3.0, // km/s (fragile, breaks up easily)
      initialTemp: -100, // °C (icy bodies are colder)
      heatingRate: 8.0 // °C per second (melts/sublimates at lower temps)
    },
    { 
      name: 'Metallic Asteroid', 
      image: '⚙️', 
      color: '#c0c0c0',
      composition: { metal: 85, silicate: 15 },
      density: 6500, // kg/m³
      ablationRate: 0.06, // km/s
      velocityReduction: 0.7, // km/s (very resistant to deceleration)
      initialTemp: -73, // °C
      heatingRate: 92.3 // °C per second (high thermal conductivity, reaches ~850°C)
    },
    { 
      name: 'Carbonaceous Asteroid', 
      image: '⚫', 
      color: '#2f2f2f',
      composition: { carbon: 40, silicate: 40, water: 20 },
      density: 2000, // kg/m³
      ablationRate: 0.20, // km/s
      velocityReduction: 2.5, // km/s (fragile, higher drag)
      initialTemp: -73, // °C
      heatingRate: 47.3 // °C per second (reaches ~400°C)
    }
  ];

  // Preset asteroids from AsteroidLanding
  const presetAsteroids = [
    {
      id: '29075',
      name: '29075 1950 DA',
      nickname: '1950 DA',
      diameter: 1.3, // Entry diameter at 100km altitude
      finalDiameter: 0.792, // Impact diameter (22.6% mass retention = ∛0.226 × 1.3km)
      velocity: 14.1, // Entry velocity
      impactVelocity: 17.97, // NASA predicted impact velocity (accelerates due to gravity)
      period: 2.21,
      predictedImpactPeriod: '2880',
      isPotentiallyHazardous: true,
      modelPath: '/models/1950 DA Prograde.obj',
      modelType: 'obj',
      composition: {
        'Iron-Nickel': 85,
        'Silicate': 10,
        'Other Metals': 5
      },
      density: 7500,
      ablationRate: 0.002, // Calibrated for 77% mass loss (22.6% retention)
      velocityReduction: 0.8, // Actually accelerates due to gravity
      initialTemp: -73,
      heatingRate: 87.3,
      nasaImpactEnergy: 75190 // Mt
    },
    {
      id: '101955',
      name: '101955 Bennu',
      nickname: 'Bennu',
      diameter: 0.49, // Entry diameter at 100km altitude
      finalDiameter: 0.487, // Impact diameter (99.4% mass retention = ∛0.994 × 0.49km)
      velocity: 5.99, // Entry velocity
      impactVelocity: 12.68, // NASA predicted impact velocity (doubles due to gravity!)
      period: 1.2,
      predictedImpactPeriod: '2178 - 2290',
      isPotentiallyHazardous: true,
      modelPath: '/models/Bennu_v20_200k.obj',
      modelType: 'obj',
      composition: {
        'Carbonaceous': 40,
        'Silicate': 35,
        'Hydrated Minerals': 25
      },
      density: 1190,
      ablationRate: 0.0005, // Calibrated for 0.6% mass loss (99.4% retention)
      velocityReduction: 2.5, // Actually accelerates massively
      initialTemp: -73,
      heatingRate: 47.3,
      nasaImpactEnergy: 1400 // Mt
    },
    {
      id: '2020VV',
      name: '2020 VV',
      nickname: '2020 VV',
      diameter: 0.012, // Entry diameter at 100km altitude
      finalDiameter: 0, // Burns up completely before impact (100% mass loss)
      velocity: 2.58, // Entry velocity
      impactVelocity: 11.44, // NASA predicted (but burns up before impact)
      period: 1.18,
      predictedImpactPeriod: '2044 - 2122',
      isPotentiallyHazardous: false,
      modelPath: '/Animation-Asteroid-Rotating.gif',
      modelType: 'gif',
      composition: {
        'Silicate': 70,
        'Iron-Nickel': 25,
        'Carbonaceous': 5
      },
      density: 3000,
      ablationRate: 0.15, // High ablation - burns up completely
      velocityReduction: 1.5,
      initialTemp: -73,
      heatingRate: 67.3,
      nasaImpactEnergy: 0.0035, // Mt (if it survived)
      burnsUp: true // Complete airburst
    }
  ];

  // State for managing current preset asteroid in carousel
  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const getDiameterText = (val) => {
    if (val < 1) {
      return `${Math.round(val * 1000)} m`;
    } else {
      return `${val.toFixed(2)} km`;
    }
  };

  // Trigger explosion at exact coordinates
  const triggerExplosion = useCallback((location, diameter, speed, targetImpactVel, targetFinalDiam, asteroidDensity) => {
    if (!location) {
      console.warn('[EXPLOSION] No target location provided');
      return;
    }
    
    console.log('[EXPLOSION] Triggering explosion at coordinates:', location);
    
    // Get explosion coordinates
    let endX, endY;
    
    if (location.pixelX && location.pixelY) {
      endX = location.pixelX;
      endY = location.pixelY;
      console.log('✓ Using pre-calculated pixels:', endX, endY);
    } else if (window.asteroidOverlay && window.asteroidMapDiv) {
      console.log('Attempting overlay calculation...');
      const latLng = new window.google.maps.LatLng(location.lat, location.lng);
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
      endX = window.innerWidth / 2;
      endY = window.innerHeight / 2;
    }
    
    const currentX = endX;
    const currentY = endY;
    
    // Calculate impact energy for explosion size
    const finalDiameterForImpact = targetFinalDiam !== null ? targetFinalDiam : diameter;
    const finalSpeedForImpact = targetImpactVel || speed;
    
    const radiusKm = finalDiameterForImpact / 2;
    const radiusM = radiusKm * 1000;
    const volumeM3 = (4/3) * Math.PI * Math.pow(radiusM, 3);
    const massKg = volumeM3 * asteroidDensity;
    const velocityMS = finalSpeedForImpact * 1000;
    const energyJoules = 0.5 * massKg * Math.pow(velocityMS, 2);
    const energyMegatons = energyJoules / (4.184e15);
    
    console.log(`[IMPACT ENERGY] ${energyMegatons.toFixed(2)} MT - Creating explosion visual`);
    
    // Scale explosion based on energy (min 200px, max 1200px)
    const baseExplosionSize = 200 + Math.min(energyMegatons * 50, 1000);
    
    // Create initial flash
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.left = currentX + 'px';
    flash.style.top = currentY + 'px';
    flash.style.width = '100px';
    flash.style.height = '100px';
    flash.style.borderRadius = '50%';
    flash.style.background = 'radial-gradient(circle, rgba(255,255,255,1), rgba(255,255,200,0.8), rgba(255,200,0,0.4))';
    flash.style.transform = 'translate(-50%, -50%)';
    flash.style.zIndex = '10002';
    flash.style.pointerEvents = 'none';
    flash.style.boxShadow = '0 0 100px rgba(255,255,255,1), 0 0 200px rgba(255,200,0,0.8)';
    
    document.body.appendChild(flash);
    
    // Animate bright flash
    const impactStart = Date.now();
    const impactDuration = 300;
    
    const expandFlash = () => {
      const impactElapsed = Date.now() - impactStart;
      const impactProgress = Math.min(impactElapsed / impactDuration, 1);
      
      const currentFlashSize = 100 + (impactProgress * baseExplosionSize * 0.5);
      flash.style.width = currentFlashSize + 'px';
      flash.style.height = currentFlashSize + 'px';
      flash.style.opacity = 1 - impactProgress;
      
      if (impactProgress < 1) {
        requestAnimationFrame(expandFlash);
      } else {
        document.body.removeChild(flash);
        
        // Create expanding shockwave rings (3 waves)
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const shockwave = document.createElement('div');
            shockwave.style.position = 'fixed';
            shockwave.style.left = currentX + 'px';
            shockwave.style.top = currentY + 'px';
            shockwave.style.width = '50px';
            shockwave.style.height = '50px';
            shockwave.style.borderRadius = '50%';
            shockwave.style.border = `${3 - i}px solid rgba(255, ${200 - i * 50}, 0, ${0.8 - i * 0.2})`;
            shockwave.style.transform = 'translate(-50%, -50%)';
            shockwave.style.zIndex = '10001';
            shockwave.style.pointerEvents = 'none';
            
            document.body.appendChild(shockwave);
            
            const waveStart = Date.now();
            const waveDuration = 1500 - (i * 200);
            
            const expandWave = () => {
              const elapsed = Date.now() - waveStart;
              const progress = Math.min(elapsed / waveDuration, 1);
              
              // Shockwave scales with explosion size (smaller for small asteroids)
              const waveSize = 50 + (progress * baseExplosionSize * 1.5);
              shockwave.style.width = waveSize + 'px';
              shockwave.style.height = waveSize + 'px';
              shockwave.style.opacity = (1 - progress) * (0.8 - i * 0.2);
              
              if (progress < 1) {
                requestAnimationFrame(expandWave);
              } else {
                document.body.removeChild(shockwave);
              }
            };
            
            expandWave();
          }, i * 150);
        }
        
        console.log('[SHOCKWAVE COMPLETE] Starting fireball expansion');
        
        // Create main fireball explosion - scaled by impact energy
        const fireball = document.createElement('div');
        fireball.style.position = 'fixed';
        fireball.style.left = currentX + 'px';
        fireball.style.top = currentY + 'px';
        
        // Initial size scales with energy (small asteroids = smaller fireball)
        const initialFireballSize = 50 + Math.min(energyMegatons * 20, 200); // 50-250px initial
        fireball.style.width = initialFireballSize + 'px';
        fireball.style.height = initialFireballSize + 'px';
        
        fireball.style.borderRadius = '50%';
        fireball.style.background = 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.9), rgba(255,200,0,0.8), rgba(255,100,0,0.6), rgba(200,0,0,0.3))';
        fireball.style.transform = 'translate(-50%, -50%)';
        fireball.style.zIndex = '10000';
        fireball.style.pointerEvents = 'none';
        fireball.style.boxShadow = '0 0 80px rgba(255,150,0,0.9), 0 0 160px rgba(255,100,0,0.6), 0 0 240px rgba(255,50,0,0.3)';
        
        document.body.appendChild(fireball);
        
        console.log(`[FIREBALL] Energy: ${energyMegatons.toFixed(2)} MT, Initial size: ${initialFireballSize}px, Max size: ${baseExplosionSize}px`);
        
        const fireballStart = Date.now();
        const fireballDuration = 2500;
        
        const expandFireball = () => {
          const elapsed = Date.now() - fireballStart;
          const progress = Math.min(elapsed / fireballDuration, 1);
          
          // Expand to full size then contract slightly (mushroom cloud effect)
          let sizeFactor;
          if (progress < 0.7) {
            sizeFactor = progress / 0.7; // Expand to 100%
          } else {
            sizeFactor = 1 - ((progress - 0.7) / 0.3) * 0.2; // Contract to 80%
          }
          
          // Scale based on energy - small asteroids have smaller max size
          const currentSize = initialFireballSize + (sizeFactor * (baseExplosionSize - initialFireballSize));
          fireball.style.width = currentSize + 'px';
          fireball.style.height = currentSize + 'px';
          
          // Create mushroom cloud effect - elongate vertically in later stages
          if (progress > 0.5) {
            const elongation = 1 + ((progress - 0.5) / 0.5) * 0.5;
            fireball.style.height = (currentSize * elongation) + 'px';
            fireball.style.borderRadius = '50% 50% 40% 40%';
          }
          
          // Fade out gradually after peak
          if (progress > 0.6) {
            const fadeProgress = (progress - 0.6) / 0.4;
            fireball.style.opacity = 1 - fadeProgress;
          }
          
          // Dim the glow over time
          const glowIntensity = 1 - (progress * 0.8);
          fireball.style.boxShadow = `0 0 ${80 * glowIntensity}px rgba(255,150,0,${0.9 * glowIntensity}), 0 0 ${160 * glowIntensity}px rgba(255,100,0,${0.6 * glowIntensity}), 0 0 ${240 * glowIntensity}px rgba(255,50,0,${0.3 * glowIntensity})`;
          
          if (progress < 1) {
            requestAnimationFrame(expandFireball);
          } else {
            document.body.removeChild(fireball);
            console.log('[FIREBALL COMPLETE] Explosion animation finished');
          }
        };
        
        expandFireball();
      }
    };
    
    expandFlash();
    
    // Update final impact state
    setIsLaunching(false);
    if (onLaunchingChange) onLaunchingChange(false);
    setHasImpacted(true);
    setImpactEnergy(energyMegatons);
    
    // Set final diameter and velocity for display
    if (targetFinalDiam !== null) {
      setCurrentDiameter(targetFinalDiam);
    }
    if (targetImpactVel) {
      setCurrentSpeed(targetImpactVel);
    }
    
    // Notify parent to create crater
    if (onCraterCreate && location) {
      // Larger crater size calculation (5x bigger base size)
      const craterSize = 500 + Math.min(energyMegatons * 75, 3500); // Was 100 + energy*15, now 500 + energy*75
      onCraterCreate({
        lat: location.lat,
        lng: location.lng,
        size: craterSize
      });
      console.log(`[CRATER] Creating crater of size ${craterSize} at (${location.lat}, ${location.lng})`);
    }
  }, [onLaunchingChange, onCraterCreate]);

  const launchAsteroid = useCallback(() => {
    if (!targetLocation || isLaunching) return;
    
    setIsLaunching(true);
    if (onLaunchingChange) onLaunchingChange(true);
    setShowResults(true);
    setHasImpacted(false);
    setShowCutscene(true); // Show atmospheric entry cutscene
    
    // Get asteroid properties (prefer selectedPreset, fallback to presetAsteroid, then custom)
    const asteroidData = selectedPreset || presetAsteroid || asteroids[asteroidIndex];
    const initialTemp = asteroidData.initialTemp || -73;
    const heatingRate = asteroidData.heatingRate || 50;
    const ablationRate = asteroidData.ablationRate || 0.10;
    const asteroidDensity = asteroidData.density || 3000; // kg/m³
    
    // Use asteroid-specific diameter and speed if preset, otherwise use slider values
    const actualDiameter = (selectedPreset || presetAsteroid) ? asteroidData.diameter : diameter;
    const actualSpeed = (selectedPreset || presetAsteroid) ? asteroidData.velocity : speed; // Entry velocity
    
    // Calculate target final diameter and impact velocity
    let targetImpactVelocity;
    let targetFinalDiameter;
    
    if (selectedPreset || presetAsteroid) {
      // Use NASA data for preset asteroids
      targetImpactVelocity = asteroidData.impactVelocity || actualSpeed;
      targetFinalDiameter = asteroidData.finalDiameter !== undefined ? asteroidData.finalDiameter : actualDiameter;
    } else {
      // Calculate for custom asteroids based on size brackets
      // Diameter retention based on size:
      // > 5km: 20% retention
      // 1-5km: 40% retention
      // 0.5-1km: 50% retention
      // < 0.5km: 0-10% retention (very small or burns up)
      
      if (actualDiameter > 5) {
        targetFinalDiameter = actualDiameter * 0.20; // 20% retention
      } else if (actualDiameter >= 1) {
        targetFinalDiameter = actualDiameter * 0.40; // 40% retention
      } else if (actualDiameter >= 0.5) {
        targetFinalDiameter = actualDiameter * 0.50; // 50% retention
      } else {
        // Small asteroids: 0-10% retention based on size
        const retentionFactor = Math.max(0, (actualDiameter - 0.1) / 0.4 * 0.10); // Linear from 0% at 0.1km to 10% at 0.5km
        targetFinalDiameter = actualDiameter * retentionFactor;
      }
      
      // Impact velocity calculation for custom asteroids
      // Asteroids accelerate due to gravity during atmospheric entry
      // Typical increase: 1.2x to 1.8x depending on entry angle and initial velocity
      // Lower entry velocity = more acceleration (more time falling)
      // Higher entry velocity = less acceleration (less time in gravity well)
      const velocityMultiplier = actualSpeed < 10 ? 1.8 : // Slow asteroids accelerate more
                                  actualSpeed < 20 ? 1.5 : // Medium speed
                                  actualSpeed < 40 ? 1.3 : // Fast
                                  1.2; // Very fast asteroids accelerate less
      targetImpactVelocity = actualSpeed * velocityMultiplier;
    }
    
    console.log('=== LAUNCH DEBUG ===');
    console.log('Asteroid Data:', asteroidData.nickname || asteroidData.name);
    console.log('Full asteroidData object:', asteroidData);
    console.log('--- DIAMETER ---');
    console.log('Initial Diameter:', actualDiameter, 'km');
    console.log('Target Final Diameter:', targetFinalDiameter, 'km');
    console.log('Retention:', ((targetFinalDiameter / actualDiameter) * 100).toFixed(1) + '%');
    console.log('Will use: PHYSICS SIMULATION with cubic scaling (not linear interpolation)');
    console.log('--- VELOCITY ---');
    console.log('Entry Velocity (actualSpeed):', actualSpeed);
    console.log('asteroidData.impactVelocity:', asteroidData.impactVelocity);
    console.log('Target Impact Velocity:', targetImpactVelocity);
    console.log('Velocity increase:', ((targetImpactVelocity / actualSpeed) * 100 - 100).toFixed(1) + '%');
    console.log('Has impactVelocity property?', asteroidData.impactVelocity);
    console.log('Is preset?', !!(selectedPreset || presetAsteroid));
    console.log('selectedPreset:', selectedPreset);
    console.log('presetAsteroid:', presetAsteroid);
    console.log('Condition result:', (selectedPreset || presetAsteroid) ? 'TRUE' : 'FALSE');
    
    // Store initial values for display (entry velocity)
    setInitialDiameter(actualDiameter);
    setInitialSpeed(actualSpeed);
    
    // Initialize live stats
    setCurrentDiameter(actualDiameter); // Already in km
    setCurrentSpeed(actualSpeed); // Already in km/s
    setImpactEnergy(0);
    setSurfaceTemp(initialTemp);
    
    // REALISTIC CUTSCENE PHYSICS SIMULATION (100km → 35km over 10 seconds)
    // Atmospheric model constants
    const scaleHeight = 8.5; // km
    const seaLevelDensity = 1.225; // kg/m³
    const dragCoefficient = 0.8; // Reduced to allow gravity acceleration (NASA shows velocity increase!)
    const entryAngle = 40 * (Math.PI / 180);
    const gravity = 9.81; // m/s² - Earth's gravitational acceleration
    
    // Simulate cutscene phase (fixed 10 second duration, upper atmosphere)
    const cutsceneDuration = 10; // seconds
    const cutsceneTimeStep = 0.1;
    const cutsceneTrajectory = [];
    
    let csAltitude = 100; // km
    let csVelocity = actualSpeed * 1000; // m/s
    let csDiameter = actualDiameter; // km
    let csTime = 0;
    
    while (csTime <= cutsceneDuration && csDiameter > 0 && csVelocity > 0) {
      const atmDensity = seaLevelDensity * Math.exp(-csAltitude / scaleHeight);
      const radiusM = (csDiameter * 1000) / 2;
      const crossSectionArea = Math.PI * radiusM * radiusM;
      const volume = (4/3) * Math.PI * Math.pow(radiusM, 3);
      const mass = volume * asteroidDensity;
      const dragForce = 0.5 * atmDensity * Math.pow(csVelocity, 2) * dragCoefficient * crossSectionArea;
      const dragDeceleration = mass > 0 ? dragForce / mass : 0;
      
      // Gravity component along trajectory (adds to velocity)
      const gravityAcceleration = gravity * Math.sin(entryAngle);
      
      // Net acceleration = gravity (accelerates) - drag (decelerates)
      csVelocity = Math.max(0, csVelocity - (dragDeceleration * cutsceneTimeStep) + (gravityAcceleration * cutsceneTimeStep));
      const verticalVelocity = csVelocity * Math.sin(entryAngle);
      csAltitude = Math.max(0, csAltitude - (verticalVelocity * cutsceneTimeStep / 1000));
      
      // Dynamic pressure for ablation: q = 0.5 * ρ * v²
      const dynamicPressure = 0.5 * atmDensity * Math.pow(csVelocity, 2);
      
      // Size-dependent ablation: larger asteroids have lower surface-to-volume ratio
      const radiusKm = radiusM / 1000;
      // Use cubic scaling for very large asteroids (>1km radius = 2km diameter)
      // Cubic scaling: massive asteroids are EXTREMELY resistant to ablation
      const sizeScalingFactor = radiusKm > 1.0 ? 1.0 / Math.pow(radiusKm, 3) : // Very large: cubic
                                 radiusKm > 0.5 ? 1.0 / Math.pow(radiusKm, 2) : // Large: quadratic
                                 1.0 / Math.max(0.01, radiusKm); // Small: linear
      
      // Density-dependent ablation: denser materials are harder to ablate
      const densityScalingFactor = 2000 / asteroidDensity; // Reference: 2000 kg/m³
      
      // Realistic ablation calibration - reduced from 5 to 0.5 for massive asteroids
      const ablationMultiplier = 0.5 * sizeScalingFactor * densityScalingFactor;
      const ablationThisStep = (ablationRate * dynamicPressure * ablationMultiplier * cutsceneTimeStep) / 1000000; // Convert to km
      csDiameter = Math.max(0, csDiameter - ablationThisStep);
      
      // Debug logging every second
      if (Math.floor(csTime) !== Math.floor(csTime - cutsceneTimeStep) && csTime > 0) {
        console.log(`[Cutscene ${Math.floor(csTime)}s] Alt: ${csAltitude.toFixed(1)}km, Vel: ${(csVelocity/1000).toFixed(2)}km/s, Diam: ${csDiameter.toFixed(3)}km, DragDecel: ${dragDeceleration.toFixed(2)}m/s², Ablation: ${(ablationThisStep*1000).toFixed(6)}m`);
      }
      
      cutsceneTrajectory.push({
        time: csTime,
        altitude: csAltitude,
        velocity: csVelocity / 1000,
        diameter: csDiameter,
        atmosphericDensity: atmDensity
      });
      
      csTime += cutsceneTimeStep;
    }
    
    // Store actual cutscene completion time (may be less than 10s if asteroid burns up)
    const actualCutsceneDuration = csTime;
    const cutsceneCompletedEarly = actualCutsceneDuration < cutsceneDuration;
    
    console.log('=== CUTSCENE SIMULATION COMPLETE ===');
    console.log('  Initial:', actualDiameter.toFixed(3), 'km,', actualSpeed.toFixed(2), 'km/s at 100km');
    console.log('  After', actualCutsceneDuration.toFixed(2), 's:', csDiameter.toFixed(3), 'km,', (csVelocity/1000).toFixed(2), 'km/s at', csAltitude.toFixed(1), 'km');
    console.log('  Cutscene will complete in:', actualCutsceneDuration.toFixed(2), 's', cutsceneCompletedEarly ? '(EARLY - airburst)' : '(full duration)');
    
    // Interpolation function for cutscene
    const getCutsceneDataAtTime = (t) => {
      if (t <= 0) return cutsceneTrajectory[0];
      if (t >= actualCutsceneDuration) return cutsceneTrajectory[cutsceneTrajectory.length - 1];
      
      for (let i = 0; i < cutsceneTrajectory.length - 1; i++) {
        if (t >= cutsceneTrajectory[i].time && t <= cutsceneTrajectory[i + 1].time) {
          const t0 = cutsceneTrajectory[i];
          const t1 = cutsceneTrajectory[i + 1];
          const alpha = (t - t0.time) / (t1.time - t0.time);
          
          return {
            altitude: t0.altitude + alpha * (t1.altitude - t0.altitude),
            velocity: t0.velocity + alpha * (t1.velocity - t0.velocity),
            diameter: t0.diameter + alpha * (t1.diameter - t0.diameter),
            atmosphericDensity: t0.atmosphericDensity + alpha * (t1.atmosphericDensity - t0.atmosphericDensity)
          };
        }
      }
      return cutsceneTrajectory[cutsceneTrajectory.length - 1];
    };
    
    // Animate temperature AND diameter/velocity during cutscene using realistic physics
    const cutsceneStartTime = Date.now();
    let hasAirbursted = false; // Track if asteroid burned up
    let cutsceneEndDiameter = actualDiameter; // Track final diameter after cutscene
    let cutsceneEndSpeed = actualSpeed; // Track final speed after cutscene
    
    // Calculate expected total flight time for smooth velocity interpolation
    // Estimate based on distance and average speed (will be refined after simulation)
    // Reduced by 20% to make changes happen 20% faster (13s -> 10.4s)
    const estimatedTotalFlightTime = 9.3; // ~10s cutscene + ~0.4s red dot flight (20% faster)
    
    console.log('=== CUTSCENE STARTING ===');
    console.log('Will interpolate velocity from', actualSpeed, 'to', targetImpactVelocity, 'over', estimatedTotalFlightTime, 'seconds');
    console.log('Diameter will be calculated using PHYSICS SIMULATION (cubic scaling for large asteroids)');
    
    const cutsceneStatsInterval = setInterval(() => {
      const cutsceneElapsed = (Date.now() - cutsceneStartTime) / 1000;
      if (cutsceneElapsed < actualCutsceneDuration && !hasAirbursted) {
        const cutsceneData = getCutsceneDataAtTime(cutsceneElapsed);
        
        // Update temperature (more heating in denser atmosphere)
        const heatingMultiplier = Math.max(1, cutsceneData.atmosphericDensity / seaLevelDensity * 5);
        setSurfaceTemp(initialTemp + (heatingRate * cutsceneElapsed * heatingMultiplier));
        
        // Update diameter - use physics simulation for ALL asteroids
        const currentDiam = cutsceneData.diameter;
        cutsceneEndDiameter = currentDiam;
        setCurrentDiameter(currentDiam);
        
        // Update velocity - LINEAR interpolation from entry to impact velocity (NASA data)
        
        if (targetImpactVelocity && targetImpactVelocity !== actualSpeed) {
          // Simple linear interpolation over total flight time
          const velocityProgress = cutsceneElapsed / estimatedTotalFlightTime;
          const interpolatedVelocity = actualSpeed + (targetImpactVelocity - actualSpeed) * velocityProgress;
          cutsceneEndSpeed = interpolatedVelocity;
          setCurrentSpeed(interpolatedVelocity);
        } else {
          console.log('[Cutscene] Using physics simulation (not preset asteroid)');
          // Custom asteroids: use physics simulation
          cutsceneEndSpeed = cutsceneData.velocity;
          setCurrentSpeed(cutsceneData.velocity);
        }
      } else if (cutsceneElapsed >= actualCutsceneDuration) {
        clearInterval(cutsceneStatsInterval);
      }
    }, 10); // 10ms = 100 updates per second for smooth visual updates
    
    // Trigger explosion when cutscene completes (not at fixed 10 seconds)
    setTimeout(() => {
      if (!hasAirbursted) {
        console.log('[EXPLOSION TRIGGER]', actualCutsceneDuration.toFixed(2), 'seconds elapsed - triggering explosion sequence');
        triggerExplosion(targetLocation, actualDiameter, actualSpeed, targetImpactVelocity, targetFinalDiameter, asteroidDensity);
      }
    }, actualCutsceneDuration * 1000);
    
    // Hide cutscene when it completes and start actual flight animation (if not burned up)
    setTimeout(() => {
      if (!hasAirbursted) {
        setShowCutscene(false);
        clearInterval(cutsceneStatsInterval);
        // Pass the actual end values from cutscene to the flight animation
        startFlightAnimation(cutsceneEndDiameter, cutsceneEndSpeed, targetImpactVelocity, targetFinalDiameter, actualDiameter);
      }
    }, actualCutsceneDuration * 1000);
  }, [targetLocation, isLaunching, diameter, speed, selectedPreset, presetAsteroid, asteroidIndex, asteroids, currentDiameter, onLaunchingChange]);
  
  const startFlightAnimation = useCallback((startDiameter = diameter, startSpeed = speed, targetImpactVel = null, targetFinalDiam = null, initialDiam = null) => {
    const flightStartTime = Date.now();
    
    // Get asteroid properties (prefer selectedPreset, fallback to presetAsteroid, then custom)
    const asteroidData = selectedPreset || presetAsteroid || asteroids[asteroidIndex];
    const ablationRate = asteroidData.ablationRate || 0.10;
    const asteroidDensity = asteroidData.density || 3000; // kg/m³
    
    // Get entry velocity for interpolation calculations
    const entryVelocity = (selectedPreset || presetAsteroid) ? asteroidData.velocity : speed;
    
    // Use passed values or fallback to current state
    const actualDiameter = initialDiam !== null ? initialDiam : (selectedPreset?.diameter || presetAsteroid?.diameter || diameter);
    const targetFinalDiameter = targetFinalDiam;
    
    // REALISTIC NON-LINEAR ATMOSPHERIC PHYSICS SIMULATION
    // Entry angle: ~40 degrees, atmospheric depth: ~100km (cutscene covered 100km→35km)
    // Red dot flight represents lower atmosphere (35km→0km)
    const entryAngle = 40 * (Math.PI / 180); // radians
    
    // Atmospheric density model (exponential): ρ(h) = ρ₀ * exp(-h/H)
    // where H ≈ 8.5 km (scale height), ρ₀ = 1.225 kg/m³ at sea level
    const scaleHeight = 8.5; // km
    const seaLevelDensity = 1.225; // kg/m³
    const gravity = 9.81; // m/s² - Earth's gravitational acceleration
    
    // Drag coefficient - reduced to allow gravity acceleration per NASA data
    const dragCoefficient = 0.8; // Cd (allows velocity increase from gravity)
    
    // Numerical simulation using small time steps
    const timeStep = 0.1; // seconds
    let currentAltitude = 35; // km (start of red dot phase)
    let currentVelocity = startSpeed * 1000; // convert km/s to m/s
    let currentDiameter = startDiameter; // km
    let simulationTime = 0;
    
    // Simulate descent through atmosphere
    while (currentAltitude > 0 && currentDiameter > 0 && currentVelocity > 0) {
      // Calculate atmospheric density at current altitude
      const atmDensity = seaLevelDensity * Math.exp(-currentAltitude / scaleHeight);
      
      // Current cross-sectional area (changes as asteroid ablates)
      const radiusM = (currentDiameter * 1000) / 2; // convert km to m
      const crossSectionArea = Math.PI * radiusM * radiusM; // m²
      
      // Mass of asteroid (assuming spherical)
      const volume = (4/3) * Math.PI * Math.pow(radiusM, 3); // m³
      const mass = volume * asteroidDensity; // kg
      
      // Drag force: F_drag = 0.5 * ρ * v² * Cd * A
      const dragForce = 0.5 * atmDensity * Math.pow(currentVelocity, 2) * dragCoefficient * crossSectionArea;
      
      // Drag deceleration: a = F/m
      const dragDeceleration = mass > 0 ? dragForce / mass : 0; // m/s²
      
      // Gravity component along trajectory (accelerates asteroid)
      const gravityAcceleration = gravity * Math.sin(entryAngle);
      
      // Net velocity change = gravity (adds) - drag (subtracts)
      currentVelocity = Math.max(0, currentVelocity - (dragDeceleration * timeStep) + (gravityAcceleration * timeStep));
      
      // Update altitude (vertical component of velocity)
      const verticalVelocity = currentVelocity * Math.sin(entryAngle);
      currentAltitude = Math.max(0, currentAltitude - (verticalVelocity * timeStep / 1000)); // convert m/s to km/s
      
      // Dynamic pressure for ablation: q = 0.5 * ρ * v²
      const dynamicPressure = 0.5 * atmDensity * Math.pow(currentVelocity, 2);
      
      // Size-dependent ablation: larger asteroids have lower surface-to-volume ratio
      const radiusKm = radiusM / 1000;
      // Use cubic scaling for very large asteroids (>1km radius = 2km diameter)
      // Cubic scaling: massive asteroids are EXTREMELY resistant to ablation
      const sizeScalingFactor = radiusKm > 1.0 ? 1.0 / Math.pow(radiusKm, 3) : // Very large: cubic
                                 radiusKm > 0.5 ? 1.0 / Math.pow(radiusKm, 2) : // Large: quadratic
                                 1.0 / Math.max(0.01, radiusKm); // Small: linear
      
      // Density-dependent ablation: denser materials are harder to ablate
      const densityScalingFactor = 2000 / asteroidDensity;
      
      // Realistic ablation calibration - reduced from 5 to 0.5 for massive asteroids
      const ablationMultiplier = 0.5 * sizeScalingFactor * densityScalingFactor;
      const ablationThisStep = (ablationRate * dynamicPressure * ablationMultiplier * timeStep) / 1000000;
      currentDiameter = Math.max(0, currentDiameter - ablationThisStep);
      
      simulationTime += timeStep;
      
      // Debug logging every 2 seconds of simulation
      if (Math.floor(simulationTime) % 2 === 0 && simulationTime % timeStep < timeStep * 2) {
        console.log(`[${simulationTime.toFixed(1)}s] Alt: ${currentAltitude.toFixed(1)}km, Vel: ${(currentVelocity/1000).toFixed(2)}km/s, Diam: ${currentDiameter.toFixed(3)}km, Drag: ${(dragDeceleration).toFixed(2)}m/s², Ablation: ${(ablationThisStep*1000).toFixed(6)}m`);
      }
      
      // Safety check to prevent infinite loops
      if (simulationTime > 100) break;
    }
    
    const realisticFlightTime = simulationTime;
    const totalFlightTime = 10 + realisticFlightTime;
    const estimatedEndSpeed = currentVelocity / 1000; // convert back to km/s
    
    console.log('=== FLIGHT ANIMATION STARTED ===');
    console.log('Target location received:', targetLocation);
    console.log('Physics simulation complete:');
    console.log('  Initial:', startDiameter.toFixed(3), 'km,', startSpeed.toFixed(2), 'km/s');
    console.log('  Final:', currentDiameter.toFixed(3), 'km,', estimatedEndSpeed.toFixed(2), 'km/s');
    console.log('  Flight time (red dot):', realisticFlightTime.toFixed(2), 's');
    console.log('  Total flight time:', totalFlightTime.toFixed(2), 's');
    console.log(`  Velocity change: ${startSpeed.toFixed(2)} → ${estimatedEndSpeed.toFixed(2)} km/s (${((estimatedEndSpeed - startSpeed) / startSpeed * 100).toFixed(1)}%)`);
    
    // Create trajectory lookup function for real-time stats
    // Re-run simulation but store snapshots for interpolation
    const trajectorySnapshots = [];
    let simAltitude = 35; // km
    let simVelocity = startSpeed * 1000; // m/s
    let simDiameter = startDiameter; // km
    let simTime = 0;
    
    trajectorySnapshots.push({ time: 0, altitude: simAltitude, velocity: simVelocity / 1000, diameter: simDiameter });
    
    while (simAltitude > 0 && simDiameter > 0 && simVelocity > 0 && simTime < 100) {
      const atmDensity = seaLevelDensity * Math.exp(-simAltitude / scaleHeight);
      const radiusM = (simDiameter * 1000) / 2;
      const crossSectionArea = Math.PI * radiusM * radiusM;
      const volume = (4/3) * Math.PI * Math.pow(radiusM, 3);
      const mass = volume * asteroidDensity;
      const dragForce = 0.5 * atmDensity * Math.pow(simVelocity, 2) * dragCoefficient * crossSectionArea;
      const dragDeceleration = mass > 0 ? dragForce / mass : 0;
      const gravityAcceleration = gravity * Math.sin(entryAngle);
      
      simVelocity = Math.max(0, simVelocity - (dragDeceleration * timeStep) + (gravityAcceleration * timeStep));
      const verticalVelocity = simVelocity * Math.sin(entryAngle);
      simAltitude = Math.max(0, simAltitude - (verticalVelocity * timeStep / 1000));
      const dynamicPressure = 0.5 * atmDensity * Math.pow(simVelocity, 2);
      const radiusKm = radiusM / 1000;
      // Use cubic scaling for very large asteroids (>1km radius = 2km diameter)
      const sizeScalingFactor = radiusKm > 1.0 ? 1.0 / Math.pow(radiusKm, 3) : // Very large: cubic
                                 radiusKm > 0.5 ? 1.0 / Math.pow(radiusKm, 2) : // Large: quadratic
                                 1.0 / Math.max(0.01, radiusKm); // Small: linear
      const densityScalingFactor = 2000 / asteroidDensity;
      // Realistic ablation calibration - reduced from 5 to 0.5
      const ablationMultiplier = 0.5 * sizeScalingFactor * densityScalingFactor;
      const ablationThisStep = (ablationRate * dynamicPressure * ablationMultiplier * timeStep) / 1000000;
      simDiameter = Math.max(0, simDiameter - ablationThisStep);
      simTime += timeStep;
      
      // Store snapshot every 0.5 seconds
      if (trajectorySnapshots.length === 0 || simTime - trajectorySnapshots[trajectorySnapshots.length - 1].time >= 0.5) {
        trajectorySnapshots.push({ 
          time: simTime, 
          altitude: simAltitude, 
          velocity: simVelocity / 1000, 
          diameter: simDiameter 
        });
        // Debug log
        console.log(`[Snapshot ${simTime.toFixed(1)}s] Vel: ${(simVelocity/1000).toFixed(2)} km/s, Diam: ${simDiameter.toFixed(3)} km`);
      }
    }
    
    // Add final snapshot
    trajectorySnapshots.push({ 
      time: simTime, 
      altitude: simAltitude, 
      velocity: simVelocity / 1000, 
      diameter: simDiameter 
    });
    
    // Function to interpolate trajectory data at any time
    const getTrajectoryAtTime = (t) => {
      if (t <= 0) return trajectorySnapshots[0];
      if (t >= simTime) return trajectorySnapshots[trajectorySnapshots.length - 1];
      
      // Find surrounding snapshots
      for (let i = 0; i < trajectorySnapshots.length - 1; i++) {
        if (t >= trajectorySnapshots[i].time && t <= trajectorySnapshots[i + 1].time) {
          const t0 = trajectorySnapshots[i];
          const t1 = trajectorySnapshots[i + 1];
          const alpha = (t - t0.time) / (t1.time - t0.time);
          
          return {
            altitude: t0.altitude + alpha * (t1.altitude - t0.altitude),
            velocity: t0.velocity + alpha * (t1.velocity - t0.velocity),
            diameter: t0.diameter + alpha * (t1.diameter - t0.diameter)
          };
        }
      }
      return trajectorySnapshots[trajectorySnapshots.length - 1];
    };
    
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

    const duration = 3000 - ((speed - 10000) / (300000 - 10000)) * 2500;
    const flightTimeInSeconds = duration / 1000;
    const startTime = Date.now();
    
    // Get current temperature from cutscene (it was being updated there)
    const cutsceneEndTemp = surfaceTemp;
    const heatingRate = asteroidData.heatingRate || 50;
    // asteroidDensity already declared above for physics simulation
    
    // Track final values for impact energy calculation
    let finalDiameterForImpact = startDiameter;
    let finalSpeedForImpact = startSpeed;
    
    // Update live stats every 100ms - uses realistic physics trajectory
    const statsInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // elapsed in seconds
      
      // Get realistic trajectory data at current elapsed time
      const trajectory = getTrajectoryAtTime(elapsed);
      const currentAlt = trajectory.altitude;
      
      // Update diameter - use physics simulation for ALL asteroids
      const newDiameter = trajectory.diameter;
      
      finalDiameterForImpact = newDiameter; // Track for impact calculation
      setCurrentDiameter(newDiameter);
      
      // Update velocity - LINEAR interpolation from entry to impact velocity (NASA data)
      let newSpeed;
      if (targetImpactVel && targetImpactVel !== entryVelocity) {
        // Simple linear interpolation over total flight time
        const totalElapsed = 10 + elapsed; // 10s cutscene + current red dot elapsed time
        const totalTime = 10 + flightTimeInSeconds; // Total time from entry to impact
        const velocityProgress = Math.min(totalElapsed / totalTime, 1); // Clamp to [0, 1]
        newSpeed = entryVelocity + (targetImpactVel - entryVelocity) * velocityProgress;
      } else {
        // Custom asteroids: use physics simulation
        newSpeed = trajectory.velocity;
      }
      
      finalSpeedForImpact = newSpeed; // Track for impact calculation
      setCurrentSpeed(newSpeed);
      
      // Debug: Log velocity changes every 500ms
      if (Math.floor(elapsed * 2) !== Math.floor((elapsed - 0.1) * 2)) {
        console.log(`[Stats ${elapsed.toFixed(1)}s] Velocity: ${newSpeed.toFixed(2)} km/s, Diameter: ${newDiameter.toFixed(3)} km, Alt: ${currentAlt.toFixed(1)} km`);
      }
      
      // Continue heating surface temperature during red dot flight
      // Temperature increases more in denser atmosphere
      const atmDensityAtAlt = seaLevelDensity * Math.exp(-currentAlt / scaleHeight);
      const heatingMultiplier = Math.max(1, atmDensityAtAlt / seaLevelDensity * 5); // 5x more heating at sea level
      setSurfaceTemp(cutsceneEndTemp + (heatingRate * elapsed * heatingMultiplier));
      
      if (elapsed >= flightTimeInSeconds) {
        clearInterval(statsInterval);
        // Ensure final velocity is exactly the target impact velocity
        if (targetImpactVel && targetImpactVel !== entryVelocity) {
          setCurrentSpeed(targetImpactVel);
          finalSpeedForImpact = targetImpactVel;
          console.log(`[Stats Complete] Set final velocity to exact target: ${targetImpactVel.toFixed(2)} km/s`);
        }
        // Ensure final diameter is exactly the target
        if (targetFinalDiameter !== null) {
          setCurrentDiameter(targetFinalDiameter);
          finalDiameterForImpact = targetFinalDiameter;
          console.log(`[Stats Complete] Set final diameter to exact target: ${targetFinalDiameter.toFixed(4)} km`);
        }
        // Check if diameter went to 0 (shouldn't happen for impacting NASA asteroids)
        if (newDiameter <= 0 && !asteroidData.burnsUp) {
          console.warn(`⚠️ WARNING: Diameter reached 0! This shouldn't happen for ${asteroidData.nickname || 'this asteroid'}`);
        }
        console.log(`[Stats Complete] Final diameter: ${(targetFinalDiameter !== null ? targetFinalDiameter : newDiameter).toFixed(4)} km (${(((targetFinalDiameter !== null ? targetFinalDiameter : newDiameter) / (selectedPreset?.diameter || presetAsteroid?.diameter || diameter)) * 100).toFixed(1)}% retention)`);
      }
    }, 10); // 10ms = 100 updates per second for smooth visual updates
    
    // Trigger impact explosion after flight duration
    setTimeout(() => {
        console.log('[ANIMATION COMPLETE] Flight time elapsed, starting impact sequence');
        
        // CHECK FOR AIRBURST - only here at the end after all calculations
        // If final diameter is effectively zero, it's an airburst
        if (finalDiameterForImpact <= 0.001) {
          console.log('[AIRBURST DETECTED] Final diameter near zero - asteroid burned up');
          
          // Calculate airburst energy using last recorded values
          const radiusKm = currentDiameter / 2;
          const radiusM = radiusKm * 1000;
          const volumeM3 = (4/3) * Math.PI * Math.pow(radiusM, 3);
          const massKg = volumeM3 * asteroidDensity;
          const velocityMS = currentSpeed * 1000;
          const energyJoules = 0.5 * massKg * Math.pow(velocityMS, 2);
          const airburstEnergyMegatons = energyJoules / (4.184e15);
          
          setImpactEnergy(airburstEnergyMegatons);
          setIsAirburst(true);
          setAirburstAltitude(100); // Approximate airburst altitude (can be refined)
          setIsLaunching(false);
          if (onLaunchingChange) onLaunchingChange(false);
          setHasImpacted(true);
          
          console.log(`[AIRBURST] Energy: ${airburstEnergyMegatons.toFixed(4)} MT`);
          return; // Don't create ground impact explosion
        }
        
        // Calculate impact energy FIRST to determine explosion size
        const radiusKm = finalDiameterForImpact / 2;
        const radiusM = radiusKm * 1000;
        const volumeM3 = (4/3) * Math.PI * Math.pow(radiusM, 3);
        const massKg = volumeM3 * asteroidDensity;
        const velocityMS = finalSpeedForImpact * 1000;
        const energyJoules = 0.5 * massKg * Math.pow(velocityMS, 2);
        const energyMegatons = energyJoules / (4.184e15);
        
        console.log(`[IMPACT ENERGY] ${energyMegatons.toFixed(2)} MT - Creating explosion visual`);
        
        // Scale explosion based on energy (min 200px, max 1200px)
        const baseExplosionSize = 200 + Math.min(energyMegatons * 50, 1000);
        
        // Create initial flash
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.left = endX + 'px';
        flash.style.top = endY + 'px';
        flash.style.width = '100px';
        flash.style.height = '100px';
        flash.style.borderRadius = '50%';
        flash.style.background = 'radial-gradient(circle, rgba(255,255,255,1), rgba(255,255,200,0.8), rgba(255,200,0,0.4))';
        flash.style.transform = 'translate(-50%, -50%)';
        flash.style.zIndex = '10002';
        flash.style.pointerEvents = 'none';
        flash.style.boxShadow = '0 0 100px rgba(255,255,255,1), 0 0 200px rgba(255,200,0,0.8)';
        
        document.body.appendChild(flash);
        
        // Animate bright flash
        const impactStart = Date.now();
        const impactDuration = 300;
        
        const expandFlash = () => {
          const impactElapsed = Date.now() - impactStart;
          const impactProgress = Math.min(impactElapsed / impactDuration, 1);
          
          const currentFlashSize = 100 + (impactProgress * baseExplosionSize * 0.5);
          flash.style.width = currentFlashSize + 'px';
          flash.style.height = currentFlashSize + 'px';
          flash.style.opacity = 1 - impactProgress;
          
          if (impactProgress < 1) {
            requestAnimationFrame(expandFlash);
          } else {
            document.body.removeChild(flash);
            
            // Create expanding shockwave rings (3 waves)
            for (let i = 0; i < 3; i++) {
              setTimeout(() => {
                const shockwave = document.createElement('div');
                shockwave.style.position = 'fixed';
                shockwave.style.left = endX + 'px';
                shockwave.style.top = endY + 'px';
                shockwave.style.width = '50px';
                shockwave.style.height = '50px';
                shockwave.style.borderRadius = '50%';
                shockwave.style.border = `${3 - i}px solid rgba(255, ${200 - i * 50}, 0, ${0.8 - i * 0.2})`;
                shockwave.style.transform = 'translate(-50%, -50%)';
                shockwave.style.zIndex = '10001';
                shockwave.style.pointerEvents = 'none';
                
                document.body.appendChild(shockwave);
                
                const waveStart = Date.now();
                const waveDuration = 1500 - (i * 200);
                
                const expandWave = () => {
                  const elapsed = Date.now() - waveStart;
                  const progress = Math.min(elapsed / waveDuration, 1);
                  
                  const waveSize = 50 + (progress * baseExplosionSize * 2);
                  shockwave.style.width = waveSize + 'px';
                  shockwave.style.height = waveSize + 'px';
                  shockwave.style.opacity = (1 - progress) * (0.8 - i * 0.2);
                  
                  if (progress < 1) {
                    requestAnimationFrame(expandWave);
                  } else {
                    document.body.removeChild(shockwave);
                  }
                };
                
                expandWave();
              }, i * 150);
            }
            
            console.log('[SHOCKWAVE COMPLETE] Impact sequence continuing');
            console.log('[FINAL IMPACT PROCESSING] Starting final impact calculations');
            // Calculate final values at moment of impact
            setActualFlightTime(totalFlightTime);
            const finalDiameter = finalDiameterForImpact;
            // ALWAYS use NASA impact velocity for preset asteroids at impact moment
            const finalSpeed = targetImpactVel || finalSpeedForImpact;
            const wasAirburst = finalDiameter <= 0; // Check if it was an airburst
            
            console.log(`=== IMPACT ===`);
            console.log(`finalDiameterForImpact: ${finalDiameter.toFixed(4)} km`);
            console.log(`finalSpeedForImpact: ${finalSpeed.toFixed(2)} km/s`);
            console.log(`targetImpactVel: ${targetImpactVel ? targetImpactVel.toFixed(2) : 'null'}`);
            console.log(`targetFinalDiam: ${targetFinalDiam !== null ? targetFinalDiam.toFixed(4) : 'null'}`);
            console.log(`wasAirburst check: ${wasAirburst}`);
            const initialDiam = selectedPreset?.diameter || presetAsteroid?.diameter || diameter;
            console.log(`Mass Retention: ${((finalDiameter / initialDiam) * 100).toFixed(1)}%`);
            
            // For final display, use NASA target values if available, otherwise use calculated values
            const displayFinalDiameter = targetFinalDiam !== null ? targetFinalDiam : finalDiameter;
            const displayFinalVelocity = targetImpactVel || finalSpeed;
            
            console.log(`[FINAL DISPLAY VALUES]`);
            console.log(`targetFinalDiam: ${targetFinalDiam}`);
            console.log(`finalDiameter (tracked): ${finalDiameter.toFixed(4)}`);
            console.log(`displayFinalDiameter (will display): ${displayFinalDiameter.toFixed(4)}`);
            console.log(`displayFinalVelocity (will display): ${displayFinalVelocity.toFixed(2)}`);
            
            // Update state with EXACT NASA values for final display
            setCurrentDiameter(displayFinalDiameter);
            setCurrentSpeed(displayFinalVelocity);
            
            // Skip fireball and crater for airbursts
            if (wasAirburst) {
              console.log('[AIRBURST PATH] Skipping fireball, diameter was 0');
              setIsLaunching(false);
              if (onLaunchingChange) onLaunchingChange(false);
              setHasImpacted(true);
              // Impact energy already set when airburst was detected
              return;
            }
            
            console.log('[IMPACT PATH] Not an airburst, proceeding with crater notification');
            
            // Notify parent to create crater on map at the impact coordinates
            if (onCraterCreate && targetLocation) {
              const craterSize = 100 + Math.min(energyMegatons * 15, 700);
              onCraterCreate({
                lat: targetLocation.lat,
                lng: targetLocation.lng,
                size: craterSize
              });
            }
            
            setIsLaunching(false);
            if (onLaunchingChange) onLaunchingChange(false);
            setHasImpacted(true);
            setImpactEnergy(energyMegatons);
          }
        };
        
        expandFlash();
    }, duration); // End of setTimeout
  }, [targetLocation, isLaunching, diameter, speed, selectedPreset, presetAsteroid, asteroidIndex, asteroids, surfaceTemp, currentDiameter, currentSpeed]);

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
      asteroidType: asteroids[asteroidIndex]
    });
  };

  const handlePresetPrev = () => {
    const newIndex = (currentPresetIndex - 1 + presetAsteroids.length) % presetAsteroids.length;
    setCurrentPresetIndex(newIndex);
    const newPreset = presetAsteroids[newIndex];
    setSelectedPreset(newPreset);
    setDiameter(newPreset.diameter);
    setSpeed(newPreset.velocity);
  };

  const handlePresetNext = () => {
    const newIndex = (currentPresetIndex + 1) % presetAsteroids.length;
    setCurrentPresetIndex(newIndex);
    const newPreset = presetAsteroids[newIndex];
    setSelectedPreset(newPreset);
    setDiameter(newPreset.diameter);
    setSpeed(newPreset.velocity);
  };

  const handleNewClick = () => {
    setShowResults(false);
    setHasImpacted(false);
    setIsAirburst(false);
    setAirburstAltitude(0);
    setShowCutscene(false);
    setActualFlightTime(0);
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
    <>
      {/* Atmospheric Entry Cutscene */}
      {showCutscene && (
        <div 
          className="fixed left-4 top-20 w-96 h-64 rounded-lg overflow-hidden shadow-2xl border-2 border-orange-500 z-[60]"
          style={{
            animation: 'fadeIn 0.5s ease-in'
          }}
        >
          {/* Background - zooming into space */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/asteroid-cutout-background.jpg)',
              backgroundSize: '100%',
              backgroundPosition: 'center left',
              animation: 'zoomIn 10s ease-out forwards'
            }}
          />
          
          {/* Asteroid burning GIF */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              animation: 'asteroidGrow 10s ease-out forwards'
            }}
          >
            <img 
              src="/Asteroid-Entry-Burn.gif" 
              alt="Asteroid Entry"
              style={{
                width: `${Math.max(50, diameter * 40)}px`,
                height: `${Math.max(50, diameter * 40)}px`,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 20px rgba(255, 102, 0, 0.8))',
                mixBlendMode: 'screen',
                opacity: 1.6,
                transform: 'scale(0.3)',
                animation: 'asteroidScale 10s ease-out forwards'
              }}
            />
          </div>
          
          {/* Title overlay */}
          <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-60 rounded p-3 backdrop-blur-sm">
            <div className="text-orange-400 text-sm font-bold tracking-wider">
              ⚠️ ATMOSPHERIC ENTRY
            </div>
            <div className="text-white text-xs mt-1">
              Entering Earth's atmosphere at {speed.toFixed(1)} km/s
            </div>
          </div>
        </div>
      )}
      
      <div className="fixed right-0 top-0 h-screen w-96 bg-gray-900 shadow-2xl flex flex-col z-50">
      {!showResults ? (
        // Original Launcher Panel
        <div className="flex-1 overflow-y-auto px-6 py-6 pr-4">
          <h1 className="text-3xl font-light tracking-wider mb-8 text-white">
            {presetAsteroid ? (selectedPreset ? selectedPreset.name : presetAsteroid.name) : 'ASTEROID'}<br/>LAUNCHER
          </h1>
          
          {presetAsteroid && (
            <div className="mb-6 p-4 bg-blue-900 border border-blue-700 rounded">
              <div className="text-blue-200 text-sm mb-2">Selected Asteroid:</div>
              <div className="text-white font-medium">{selectedPreset ? selectedPreset.name : presetAsteroid.name}</div>
              <div className="text-blue-300 text-xs">({selectedPreset ? selectedPreset.nickname : presetAsteroid.nickname})</div>
            </div>
          )}
      
          <div className="flex items-center justify-center mb-8">
            {presetAsteroid ? (
              // Show the preset asteroid carousel with navigation
              <>
                <button 
                  onClick={handlePresetPrev}
                  className="p-2 hover:bg-gray-800 rounded transition-colors text-white"
                >
                  <ChevronLeft size={24} />
                </button>
                
                <div className="mx-8 text-center">
                  {selectedPreset && selectedPreset.modelType === 'obj' ? (
                    <AsteroidModel3D modelPath={selectedPreset.modelPath} />
                  ) : selectedPreset && selectedPreset.modelType === 'gif' ? (
                    <img 
                      src={selectedPreset.modelPath} 
                      alt={selectedPreset.nickname} 
                      className="w-36 h-36 mx-auto object-contain"
                      style={{
                        filter: 'brightness(1.5) contrast(1.2)',
                        mixBlendMode: 'screen'
                      }}
                    />
                  ) : (
                    <div className="text-6xl mb-2">☄️</div>
                  )}
                  <div className="text-sm font-medium text-gray-300 mt-2">
                    {selectedPreset ? selectedPreset.nickname : presetAsteroid.nickname}
                  </div>
                </div>
                
                <button 
                  onClick={handlePresetNext}
                  className="p-2 hover:bg-gray-800 rounded transition-colors text-white"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            ) : (
              // Show the carousel for custom asteroids
              <>
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
              </>
            )}
          </div>
          
          {/* Composition Panel */}
          <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <h3 className="text-xs font-bold text-gray-400 mb-3 tracking-wider">COMPOSITION & PROPERTIES</h3>
            
            {/* Composition Breakdown */}
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">Composition:</div>
              <div className="space-y-1">
                {Object.entries((selectedPreset && selectedPreset.composition) || asteroids[asteroidIndex].composition).map(([material, percentage]) => (
                  <div key={material} className="flex justify-between text-xs">
                    <span className="text-gray-300 capitalize">{material}:</span>
                    <span className="text-white font-medium">{percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Density */}
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400">Density:</span>
              <span className="text-white font-medium">{(selectedPreset || presetAsteroid || asteroids[asteroidIndex]).density.toLocaleString()} kg/m³</span>
            </div>
            
            {/* Disintegration Rate */}
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400">Disintegration Rate:</span>
              <span className="text-orange-400 font-medium">{(selectedPreset || presetAsteroid || asteroids[asteroidIndex]).ablationRate.toFixed(3)} km/s</span>
            </div>
            
            {/* Velocity Reduction */}
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Velocity Reduction:</span>
              <span className="text-red-400 font-medium">{(selectedPreset || presetAsteroid || asteroids[asteroidIndex]).velocityReduction.toFixed(1)} km/s</span>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2 text-gray-300">
                <span className="text-gray-400">⭕</span> Diameter {(selectedPreset || presetAsteroid) && '(Preset)'}
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
              disabled={!!(selectedPreset || presetAsteroid)}
              className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider ${(selectedPreset || presetAsteroid) ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2 text-gray-300">
                <span className="text-gray-400">⚡</span> Speed {(selectedPreset || presetAsteroid) && '(Preset)'}
              </label>
              <span className="text-sm font-bold text-white">{speed.toFixed(1)} km/s</span>
            </div>
            <input
              type="range"
              min="3"
              max="85"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              disabled={!!(selectedPreset || presetAsteroid)}
              className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider ${(selectedPreset || presetAsteroid) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        </div>
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
            <h1 className={`text-3xl font-light tracking-wider mb-8 text-center text-white ${hasImpacted && !presetAsteroid && !selectedPreset ? 'absolute top-4 left-0 right-0' : ''}`}>
              {(selectedPreset || presetAsteroid) ? (selectedPreset ? selectedPreset.name : presetAsteroid.name) : isLaunching ? 'ASTEROID IN FLIGHT' : 'IMPACT COMPLETE'}
            </h1>
            
            {(selectedPreset || presetAsteroid) && (
              <>
                <p className="text-lg text-gray-400 mb-4 text-center">({(selectedPreset || presetAsteroid).nickname})</p>
                <div className="mb-6">
                  {(selectedPreset || presetAsteroid).modelType === 'obj' ? (
                    <AsteroidModel3D modelPath={(selectedPreset || presetAsteroid).modelPath} />
                  ) : (selectedPreset || presetAsteroid).modelType === 'gif' ? (
                    <img 
                      src={(selectedPreset || presetAsteroid).modelPath} 
                      alt={(selectedPreset || presetAsteroid).nickname} 
                      className="w-36 h-36 mx-auto object-contain"
                      style={{
                        filter: 'brightness(1.5) contrast(1.2)',
                        mixBlendMode: 'screen'
                      }}
                    />
                  ) : (
                    <div className="text-6xl mb-2">☄️</div>
                  )}
                </div>
              </>
            )}
            
            <div className={`w-full space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] px-1 pr-4 ${hasImpacted && !presetAsteroid ? 'mt-20' : ''}`}>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <span>⭕</span> {showCutscene ? 'CURRENT' : 'FINAL'} DIAMETER
                </div>
                <div className="text-3xl font-bold text-white">
                  {currentDiameter.toFixed(3)} km
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Started at {initialDiameter.toFixed(3)} km
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <span>⚡</span> {showCutscene ? 'CURRENT' : 'FINAL'} VELOCITY
                </div>
                <div className="text-3xl font-bold text-white">
                  {currentSpeed.toFixed(2)} km/s
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Started at {initialSpeed.toFixed(2)} km/s
                </div>
              </div>
              
              {/* Show temperature during both cutscene AND red dot flight */}
              {!hasImpacted && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <span>🌡️</span> SURFACE TEMPERATURE
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {Math.round(surfaceTemp)}°C
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {showCutscene ? 'Increasing from atmospheric friction' : 'Peak temperature during entry'}
                  </div>
                </div>
              )}
              
              {!showCutscene && hasImpacted && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <span>⏱️</span> ACTUAL FLIGHT TIME
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {actualFlightTime.toFixed(2)} s
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isAirburst 
                      ? 'Total time from atmospheric entry to disintegration'
                      : 'Total time from atmospheric entry to impact'}
                  </div>
                </div>
              )}
              
              {hasImpacted && !isAirburst && (
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
              
              {hasImpacted && isAirburst && (
                <div className="bg-blue-900 p-6 rounded-lg border border-blue-700">
                  <div className="text-sm text-blue-300 mb-2 flex items-center gap-2">
                    <span>☁️</span> AIRBURST ALTITUDE
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {airburstAltitude >= 1000
                      ? `${(airburstAltitude / 1000).toFixed(2)} km`
                      : `${airburstAltitude} m`
                    }
                  </div>
                  <div className="text-xs text-blue-400 mt-1">
                    Asteroid disintegrated in atmosphere
                  </div>
                </div>
              )}
              
              {hasImpacted && !isAirburst && (() => {
                // Calculate earthquake magnitude using: Mag = 0.67*log10(Energy) - 5.87
                // Energy is in megatons, need to convert to joules
                const energyJoules = impactEnergy * 4.184e15; // 1 MT = 4.184e15 joules
                const earthquakeMagnitude = 0.67 * Math.log10(energyJoules) - 5.87;
                
                return (
                  <div className="bg-amber-900 p-6 rounded-lg border border-amber-700">
                    <div className="text-sm text-amber-300 mb-2 flex items-center gap-2">
                      <span>📊</span> EARTHQUAKE MAGNITUDE
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {earthquakeMagnitude.toFixed(2)}
                    </div>
                    <div className="text-xs text-amber-400 mt-1">
                      Richter scale equivalent from impact
                    </div>
                  </div>
                );
              })()}
              
              {hasImpacted && !isAirburst && (() => {
                // Calculate fireball radius using: R ≈ k * E^(1/3)
                // Where k = 160 and E is energy in megatons
                const k = 160;
                const fireballRadiusM = k * Math.pow(impactEnergy, 1/3);
                
                return (
                  <div className="bg-yellow-600 p-6 rounded-lg border border-yellow-400">
                    <div className="text-sm text-yellow-100 mb-2 flex items-center gap-2">
                      <span>🔥</span> FIREBALL RADIUS
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {fireballRadiusM >= 1000
                        ? `${(fireballRadiusM / 1000).toFixed(2)} km`
                        : `${fireballRadiusM.toFixed(2)} m`
                      }
                    </div>
                    <div className="text-xs text-yellow-50 mt-1">
                      Maximum thermal radiation extent
                    </div>
                  </div>
                );
              })()}
              
              {hasImpacted && !isAirburst && (() => {
                // Calculate crater diameter using: D ≈ 1.161 * (ρi/ρt)^(1/3) * d^0.78 * v^0.44 * g^-0.22
                // Where:
                // ρi = impactor density (kg/m³)
                // ρt = target density (kg/m³) - Earth's crust ≈ 2750 kg/m³
                // d = impactor diameter (m)
                // v = impact velocity (m/s)
                // g = surface gravity (m/s²) = 9.81
                
                const asteroidData = selectedPreset || presetAsteroid || asteroids[asteroidIndex];
                const impactorDensity = asteroidData.density || 3000; // kg/m³
                const targetDensity = 2750; // kg/m³ (Earth's crust)
                const impactorDiameterM = currentDiameter * 1000; // convert km to m
                const impactVelocityMS = currentSpeed * 1000; // convert km/s to m/s
                const surfaceGravity = 9.81; // m/s²
                
                // Calculate crater diameter in meters
                const densityRatio = Math.pow(impactorDensity / targetDensity, 1/3);
                const craterDiameterM = 1.161 * densityRatio * 
                                        Math.pow(impactorDiameterM, 0.78) * 
                                        Math.pow(impactVelocityMS, 0.44) * 
                                        Math.pow(surfaceGravity, -0.22);
                
                return (
                  <div className="bg-stone-800 p-6 rounded-lg border border-stone-600">
                    <div className="text-sm text-stone-300 mb-2 flex items-center gap-2">
                      <span>🕳️</span> CRATER DIAMETER
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {craterDiameterM >= 1000
                        ? `${(craterDiameterM / 1000).toFixed(2)} km`
                        : `${craterDiameterM.toFixed(2)} m`
                      }
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      Final impact crater size
                    </div>
                  </div>
                );
              })()}
              
              {hasImpacted && !isAirburst && (() => {
                // Calculate tsunami wave height using crater diameter formula and then Height = D/48
                // Crater diameter formula: D ≈ 1.161 * (ρi/ρt)^(1/3) * d^0.78 * v^0.44 * g^-0.22
                // Where:
                // ρi = impactor density (kg/m³)
                // ρt = target density (kg/m³) - Earth's crust ≈ 2750 kg/m³
                // d = impactor diameter (m)
                // v = impact velocity (m/s)
                // g = surface gravity (m/s²) = 9.81
                
                const asteroidData = selectedPreset || presetAsteroid || asteroids[asteroidIndex];
                const impactorDensity = asteroidData.density || 3000; // kg/m³
                const targetDensity = 2750; // kg/m³ (Earth's crust)
                const impactorDiameterM = currentDiameter * 1000; // convert km to m
                const impactVelocityMS = currentSpeed * 1000; // convert km/s to m/s
                const surfaceGravity = 9.81; // m/s²
                
                // Calculate crater diameter in meters
                const densityRatio = Math.pow(impactorDensity / targetDensity, 1/3);
                const craterDiameterM = 1.161 * densityRatio * 
                                        Math.pow(impactorDiameterM, 0.78) * 
                                        Math.pow(impactVelocityMS, 0.44) * 
                                        Math.pow(surfaceGravity, -0.22);
                
                // Calculate tsunami wave height: Height = D/48 (in meters)
                const tsunamiHeightM = craterDiameterM / 48;
                
                return (
                  <div className="bg-cyan-900 p-6 rounded-lg border border-cyan-700">
                    <div className="text-sm text-cyan-300 mb-2 flex items-center gap-2">
                      <span>🌊</span> TSUNAMI WAVE HEIGHT
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {tsunamiHeightM >= 1000
                        ? `${(tsunamiHeightM / 1000).toFixed(2)} km`
                        : `${tsunamiHeightM.toFixed(2)} m`
                      }
                    </div>
                    <div className="text-xs text-cyan-400 mt-1">
                      Initial formation height at crater
                    </div>
                  </div>
                );
              })()}
              
              {!isLaunching && hasImpacted && !isAirburst && (
                <div className="mt-8 p-4 bg-red-900 border-2 border-red-700 rounded-lg text-center">
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="text-sm font-medium text-red-200">
                    IMPACT DETECTED
                  </div>
                  <div className="text-xs text-red-400 mt-1">
                    Click NEW to launch another asteroid
                  </div>
                </div>
              )}
              
              {!isLaunching && hasImpacted && isAirburst && (
                <div className="mt-8 p-4 bg-yellow-900 border-2 border-yellow-700 rounded-lg text-center">
                  <div className="text-2xl mb-2">💥</div>
                  <div className="text-sm font-medium text-yellow-200">
                    IMPACT ENERGY: {impactEnergy.toFixed(2)} MT
                  </div>
                  <div className="text-xs text-yellow-400 mt-1">
                    AIRBURST at {airburstAltitude.toLocaleString()} m altitude
                  </div>
                  <div className="text-xs text-yellow-400 mt-1">
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
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes zoomIn {
          from {
            backgroundSize: 100%;
            backgroundPosition: center left;
          }
          to {
            backgroundSize: 150%;
            backgroundPosition: -20% center;
          }
        }
        
        @keyframes asteroidScale {
          0% {
            transform: scale(0.3);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5);
            opacity: 1;
          }
        }
      `}</style>
    </div>
    </>
  );
};

export default AsteroidLauncher;