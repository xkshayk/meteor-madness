import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingScreen from './components/LandingScreen';
import AsteroidLanding from './components/AsteroidLanding';
import SimulatorPage from './components/SimulatorPage';
import AsteroidDetail from './components/AsteroidDetail';
import MitigationStrategies from './components/MitigationStrategies';
import BackgroundMusic from './components/BackgroundMusic';
import './App.css';

function App() {
  return (
    <Router>
      <BackgroundMusic />
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/asteroids" element={<AsteroidLanding />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/asteroid/:id" element={<AsteroidDetail />} />
        <Route path="/mitigation" element={<MitigationStrategies />} />
      </Routes>
    </Router>
  );
}

export default App;