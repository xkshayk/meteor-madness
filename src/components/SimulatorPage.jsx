import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MapContainer from './MapContainer';
import AsteroidLauncher from './AsteroidLauncher';

const SimulatorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [targetLocation, setTargetLocation] = useState(null);
  const [launchTrigger, setLaunchTrigger] = useState(0);
  const [presetAsteroid, setPresetAsteroid] = useState(null);
  const [craterInfo, setCraterInfo] = useState(null);
  const [isLaunching, setIsLaunching] = useState(false);

  // Check if a preset asteroid was passed
  useEffect(() => {
    if (location.state?.presetAsteroid) {
      setPresetAsteroid(location.state.presetAsteroid);
    }
  }, [location.state]);

  const handleMapClick = useCallback((location) => {
    setTargetLocation(location);
  }, []);

  const handleLaunch = useCallback((asteroidData) => {
    if (targetLocation) {
      setLaunchTrigger(prev => prev + 1);
    }
  }, [targetLocation]);

  const handleCraterCreate = useCallback((crater) => {
    setCraterInfo(crater);
  }, []);

  const handleLaunchingChange = useCallback((launching) => {
    setIsLaunching(launching);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Back button */}
      <button
        onClick={() => navigate('/asteroids')}
        className="absolute top-20 left-3 z-50 flex items-center gap-2 px-3 py-2 bg-gray-900 bg-opacity-90 border border-gray-700 hover:bg-gray-800 transition-colors text-white rounded text-sm shadow-lg"
      >
        <span>←</span>
        <span className="font-medium">BACK TO ASTEROIDS</span>
      </button>

      {/* Mitigation Strategies Button - Aligned with map controls at very top */}
      <button
        onClick={() => navigate('/mitigation')}
        className="absolute top-3 left-[500px] z-10 px-6 py-3 bg-blue-900 bg-opacity-90 border-2 border-blue-600 hover:bg-blue-800 transition-all text-white rounded-lg shadow-2xl"
      >
        <div className="font-bold text-lg tracking-wide">🛡️ MITIGATION STRATEGIES</div>
        <div className="text-xs text-blue-200 mt-1">What NASA does to reduce impact consequences</div>
      </button>

      <MapContainer 
        onMapClick={handleMapClick}
        targetLocation={targetLocation}
        craterInfo={craterInfo}
        isLaunching={isLaunching}
      />
      <AsteroidLauncher 
        onLaunch={handleLaunch}
        targetLocation={targetLocation}
        launchTrigger={launchTrigger}
        presetAsteroid={presetAsteroid}
        onCraterCreate={handleCraterCreate}
        onLaunchingChange={handleLaunchingChange}
      />
    </div>
  );
};

export default SimulatorPage;
