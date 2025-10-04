// NASA Near-Earth Object API Service
// Documentation: https://api.nasa.gov/

const NASA_API_KEY = 'DEMO_KEY'; // Replace with your API key from https://api.nasa.gov/
const NEO_API_URL = 'https://api.nasa.gov/neo/rest/v1';

/**
 * Fetch a list of Near-Earth Asteroids
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Number of results per page (default: 20, max: 100)
 * @returns {Promise<Array>} Array of asteroid objects
 */
export const fetchNearEarthAsteroids = async (page = 0, size = 50) => {
    try {
        const response = await fetch(
            `${NEO_API_URL}/neo/browse?page=${page}&size=${size}&api_key=${NASA_API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch asteroid data');
        }

        const data = await response.json();

        // Transform the data to match our needs
        const asteroids = data.near_earth_objects.map(neo => ({
            id: neo.id,
            name: neo.name,
            // Diameter in km (average of min and max)
            diameter: (
                (neo.estimated_diameter.kilometers.estimated_diameter_min +
                    neo.estimated_diameter.kilometers.estimated_diameter_max) / 2
            ),
            // Get velocity from first close approach if available
            velocity: neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_hour
                ? parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_hour)
                : 60000, // Default velocity if no close approach data
            // Distance from Earth in km
            distance: neo.close_approach_data?.[0]?.miss_distance?.kilometers
                ? parseFloat(neo.close_approach_data[0].miss_distance.kilometers)
                : null,
            // Orbital data
            orbitalData: {
                eccentricity: neo.orbital_data?.eccentricity,
                semiMajorAxis: neo.orbital_data?.semi_major_axis,
                inclination: neo.orbital_data?.inclination,
                ascendingNode: neo.orbital_data?.ascending_node_longitude,
                perihelion: neo.orbital_data?.perihelion_distance,
                aphelion: neo.orbital_data?.aphelion_distance,
            },
            isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
            nasaJplUrl: neo.nasa_jpl_url,
        }));

        return asteroids;
    } catch (error) {
        console.error('Error fetching asteroid data:', error);
        throw error;
    }
};

/**
 * Get details for a specific asteroid by ID
 * @param {string} asteroidId - NASA asteroid ID
 * @returns {Promise<Object>} Detailed asteroid object
 */
export const fetchAsteroidById = async (asteroidId) => {
    try {
        const response = await fetch(
            `${NEO_API_URL}/neo/${asteroidId}?api_key=${NASA_API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch asteroid details');
        }

        const neo = await response.json();

        return {
            id: neo.id,
            name: neo.name,
            diameter: (
                (neo.estimated_diameter.kilometers.estimated_diameter_min +
                    neo.estimated_diameter.kilometers.estimated_diameter_max) / 2
            ),
            velocity: neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_hour
                ? parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_hour)
                : 60000,
            distance: neo.close_approach_data?.[0]?.miss_distance?.kilometers
                ? parseFloat(neo.close_approach_data[0].miss_distance.kilometers)
                : null,
            orbitalData: {
                eccentricity: neo.orbital_data?.eccentricity,
                semiMajorAxis: neo.orbital_data?.semi_major_axis,
                inclination: neo.orbital_data?.inclination,
                ascendingNode: neo.orbital_data?.ascending_node_longitude,
                perihelion: neo.orbital_data?.perihelion_distance,
                aphelion: neo.orbital_data?.aphelion_distance,
            },
            isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
            nasaJplUrl: neo.nasa_jpl_url,
            closeApproachData: neo.close_approach_data,
        };
    } catch (error) {
        console.error('Error fetching asteroid details:', error);
        throw error;
    }
};

/**
 * Cache asteroid data locally to avoid excessive API calls
 * Recommended: Fetch once and save to localStorage or state management
 */
export const cacheAsteroidData = async () => {
    const cachedData = localStorage.getItem('asteroid_data');
    const cacheTimestamp = localStorage.getItem('asteroid_data_timestamp');
    const ONE_DAY = 24 * 60 * 60 * 1000; // Cache for 1 day

    // Return cached data if it's less than 1 day old
    if (cachedData && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < ONE_DAY) {
            return JSON.parse(cachedData);
        }
    }

    // Fetch fresh data
    const asteroids = await fetchNearEarthAsteroids(0, 100);
    localStorage.setItem('asteroid_data', JSON.stringify(asteroids));
    localStorage.setItem('asteroid_data_timestamp', Date.now().toString());

    return asteroids;
};

// Example usage:
/*
  import { fetchNearEarthAsteroids, cacheAsteroidData } from './services/nasaApi';

  // In your component:
  useEffect(() => {
    const loadAsteroids = async () => {
      try {
        const asteroids = await cacheAsteroidData();
        setAsteroidList(asteroids);
      } catch (error) {
        console.error('Failed to load asteroids:', error);
      }
    };
    
    loadAsteroids();
  }, []);
*/
