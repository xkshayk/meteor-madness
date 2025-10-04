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

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-20 left-3 z-50 flex items-center gap-2 px-3 py-2 bg-gray-900 bg-opacity-90 border border-gray-700 hover:bg-gray-800 transition-colors text-white rounded text-sm shadow-lg"
      >
        <span>←</span>
        <span className="font-medium">BACK TO ASTEROIDS</span>
      </button>

      <MapContainer 
        onMapClick={handleMapClick}
        targetLocation={targetLocation}
        craterInfo={craterInfo}
      />
      <AsteroidLauncher 
        onLaunch={handleLaunch}
        targetLocation={targetLocation}
        launchTrigger={launchTrigger}
        presetAsteroid={presetAsteroid}
        onCraterCreate={handleCraterCreate}
      />
    </div>
  );
};

export default SimulatorPage;
