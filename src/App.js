import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AsteroidLanding from './components/AsteroidLanding';
import SimulatorPage from './components/SimulatorPage';
import AsteroidDetail from './components/AsteroidDetail';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AsteroidLanding />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/asteroid/:id" element={<AsteroidDetail />} />
      </Routes>
    </Router>
  );
}

export default App;