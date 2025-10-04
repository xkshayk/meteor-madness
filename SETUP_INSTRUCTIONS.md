# Setup Instructions

## Install React Router

Run this command in PowerShell (you may need to run PowerShell as Administrator):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install react-router-dom
```

Or using Command Prompt:
```cmd
npm install react-router-dom
```

## Get NASA API Key (Optional but Recommended)

1. Visit: https://api.nasa.gov/
2. Fill out the form to get a free API key
3. Replace `DEMO_KEY` in `src/services/nasaApi.js` with your API key
4. Note: DEMO_KEY has lower rate limits (30 requests/hour vs 1000 requests/hour)

## NASA Asteroid Data Sources

### 1. **NeoWs API (Recommended - Easiest)**
- **URL**: `https://api.nasa.gov/neo/rest/v1/neo/browse`
- **What you get**: 
  - Asteroid name and ID
  - Estimated diameter (min/max in various units)
  - Orbital parameters (eccentricity, semi-major axis, etc.)
  - Close approach data (velocity, distance)
  - Potentially hazardous designation
- **Pros**: Simple REST API, well-documented, free
- **Cons**: Limited to ~20,000 asteroids, basic orbital data
- **Rate Limit**: 1,000 requests/hour with API key

### 2. **JPL Small-Body Database (SBDB)**
- **URL**: `https://ssd-api.jpl.nasa.gov/sbdb.api`
- **What you get**:
  - More detailed orbital elements
  - Physical properties
  - Discovery information
- **Pros**: More comprehensive data, scientific accuracy
- **Cons**: Slightly more complex API
- **Rate Limit**: No official limit but be respectful

### 3. **Horizons System**
- **URL**: `https://ssd.jpl.nasa.gov/horizons/`
- **What you get**:
  - Precise ephemeris data
  - Can compute positions at any time
  - Full orbital state vectors
- **Pros**: Most accurate for orbital visualization
- **Cons**: Steeper learning curve, batch processing

## Recommended Approach

**For your use case (50-100 asteroids), I recommend:**

1. **Use NeoWs API** - It's the simplest and has all the data you need
2. **Fetch once and cache** - The provided `cacheAsteroidData()` function stores data in localStorage
3. **Update daily** - Cached data expires after 24 hours automatically

## Data Fields You'll Get

```javascript
{
  id: "2000433",
  name: "433 Eros (A898 PA)",
  diameter: 16.84, // km
  velocity: 86400, // km/h
  distance: 26700000, // km from Earth
  orbitalData: {
    eccentricity: 0.223,
    semiMajorAxis: 1.458,
    inclination: 10.83,
    // ... more orbital parameters
  },
  isPotentiallyHazardous: false,
  nasaJplUrl: "http://ssd.jpl.nasa.gov/..."
}
```

## Page Structure

- **`/`** - Landing page with asteroid selection grid (AsteroidLanding.jsx)
- **`/simulator`** - Custom asteroid creator with Google Maps (SimulatorPage.jsx)

The landing page includes smooth fade transitions when navigating to the simulator.
