/**
 * Example: How to use the Python Backend API
 * 
 * This file demonstrates how to integrate Python calculations
 * into your React components.
 */

import { useState } from 'react';
import AsteroidAPI from '../services/asteroidApi';

const PythonAPIExample = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Example 1: Calculate full impact
  const handleCalculateImpact = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await AsteroidAPI.calculateImpact({
        diameter: 0.5,      // 500 meters
        velocity: 16.7,     // 16.7 km/s
        angle: 45,          // 45 degrees
        flightTime: 3.0     // 3 seconds
      });
      
      setResult(data);
      console.log('Impact calculation result:', data);
      
      // Access the data:
      // data.initial.diameter_km
      // data.atmospheric_entry.final_diameter_km
      // data.impact.megatons
      // data.crater.size_meters
      
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example 2: Calculate energy only
  const handleCalculateEnergy = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await AsteroidAPI.calculateEnergy(0.5, 16.7);
      
      console.log('Energy:', data.megatons, 'Mt');
      console.log('Mass:', data.mass_kg, 'kg');
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Example 3: Calculate mass only
  const handleCalculateMass = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await AsteroidAPI.calculateMass(0.5);
      
      console.log('Mass in kg:', data.mass_kg);
      console.log('Mass in tons:', data.mass_tons);
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Example 4: Check backend health
  const handleHealthCheck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await AsteroidAPI.healthCheck();
      console.log('Backend status:', data);
      setResult(data);
    } catch (err) {
      setError('Backend is not running! Start it with: start-backend.bat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Python Backend API Example</h1>
      
      <div className="space-y-4 mb-8">
        <button 
          onClick={handleHealthCheck}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded mr-2"
          disabled={loading}
        >
          Check Backend Health
        </button>
        
        <button 
          onClick={handleCalculateImpact}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded mr-2"
          disabled={loading}
        >
          Calculate Full Impact
        </button>
        
        <button 
          onClick={handleCalculateEnergy}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded mr-2"
          disabled={loading}
        >
          Calculate Energy Only
        </button>
        
        <button 
          onClick={handleCalculateMass}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded"
          disabled={loading}
        >
          Calculate Mass Only
        </button>
      </div>

      {loading && (
        <div className="text-yellow-400">Loading...</div>
      )}

      {error && (
        <div className="p-4 bg-red-900 border border-red-600 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-gray-800 border border-gray-600 rounded">
          <p className="font-bold mb-2">Result:</p>
          <pre className="bg-black p-4 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PythonAPIExample;
