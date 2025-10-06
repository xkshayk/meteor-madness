/**
 * API service for communicating with Python backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class AsteroidAPI {
    /**
     * Health check to verify backend is running
     */
    static async healthCheck() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`);
            return await response.json();
        } catch (error) {
            console.error('Backend health check failed:', error);
            throw new Error('Backend server is not responding');
        }
    }

    /**
     * Calculate full impact analysis
     * @param {Object} params - Impact parameters
     * @param {number} params.diameter - Diameter in km
     * @param {number} params.velocity - Velocity in km/s
     * @param {number} params.angle - Angle in degrees
     * @param {number} params.flightTime - Flight time in seconds
     */
    static async calculateImpact({ diameter, velocity, angle, flightTime }) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/calculate-impact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    diameter,
                    velocity,
                    angle,
                    flightTime,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;
        } catch (error) {
            console.error('Calculate impact failed:', error);
            throw error;
        }
    }

    /**
     * Calculate impact energy only
     * @param {number} diameter - Diameter in km
     * @param {number} velocity - Velocity in km/s
     */
    static async calculateEnergy(diameter, velocity) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/calculate-energy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    diameter,
                    velocity,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;
        } catch (error) {
            console.error('Calculate energy failed:', error);
            throw error;
        }
    }

    /**
     * Calculate asteroid mass
     * @param {number} diameter - Diameter in km
     */
    static async calculateMass(diameter) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/calculate-mass`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    diameter,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;
        } catch (error) {
            console.error('Calculate mass failed:', error);
            throw error;
        }
    }

    /**
     * Get all asteroid orbital trajectories
     * @param {number} points - Number of points per orbit (default: 360)
     */
    static async getAllOrbits(points = 360) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orbits?points=${points}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;
        } catch (error) {
            console.error('Get all orbits failed:', error);
            throw error;
        }
    }

    /**
     * Get orbital trajectory for a specific asteroid
     * @param {string} asteroidName - Asteroid designation
     * @param {number} points - Number of points (default: 360)
     */
    static async getAsteroidOrbit(asteroidName, points = 360) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/orbits/${encodeURIComponent(asteroidName)}?points=${points}`
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;
        } catch (error) {
            console.error('Get asteroid orbit failed:', error);
            throw error;
        }
    }

    /**
     * Get orbital trajectories for potentially hazardous asteroids only
     * @param {number} points - Number of points per orbit (default: 360)
     */
    static async getPHAOrbits(points = 360) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orbits/pha/list?points=${points}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;
        } catch (error) {
            console.error('Get PHA orbits failed:', error);
            throw error;
        }
    }

    /**
     * Get list of all asteroid names and PHA status (lightweight)
     */
    static async getAsteroidList() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/asteroid-list`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;
        } catch (error) {
            console.error('Get asteroid list failed:', error);
            throw error;
        }
    }
}

export default AsteroidAPI;
