# Meteor Madness - Backend Integration Guide

## 🚀 Quick Start

### Step 1: Install Python Backend

Run the setup script (Windows):
```bash
setup-backend.bat
```

Or manually:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Start the Backend Server

Run the start script (Windows):
```bash
start-backend.bat
```

Or manually:
```bash
cd backend
venv\Scripts\activate
python app.py
```

The server will start on `http://localhost:5000`

### Step 3: Start the React Frontend

In a **new terminal**:
```bash
npm start
```

The React app will run on `http://localhost:3000`

## 📡 API Integration

The React app can now call Python backend functions!

### Example Usage in React:

```javascript
import AsteroidAPI from './services/asteroidApi';

// Check if backend is running
const health = await AsteroidAPI.healthCheck();
console.log(health); // { status: 'healthy', service: 'Meteor Madness API' }

// Calculate full impact
const impact = await AsteroidAPI.calculateImpact({
  diameter: 0.5,
  velocity: 60000,
  angle: 45,
  flightTime: 3.0
});

console.log(impact);
// Returns: { initial, atmospheric_entry, impact, crater }

// Calculate just energy
const energy = await AsteroidAPI.calculateEnergy(0.5, 60000);
console.log(energy.megatons);

// Calculate mass
const mass = await AsteroidAPI.calculateMass(0.5);
console.log(mass.mass_kg);
```

## 🛠️ Available API Endpoints

### Health Check
```
GET /api/health
```

### Calculate Full Impact
```
POST /api/calculate-impact
Body: { diameter, velocity, angle, flightTime }
```

### Calculate Energy
```
POST /api/calculate-energy
Body: { diameter, velocity }
```

### Calculate Mass
```
POST /api/calculate-mass
Body: { diameter }
```

## 📁 Project Structure

```
meteor-madness/
├── backend/                    # Python Flask backend
│   ├── app.py                 # Main Flask application
│   ├── asteroid_calculations.py  # Physics calculations
│   ├── requirements.txt       # Python dependencies
│   └── README.md             # Backend documentation
├── src/
│   ├── services/
│   │   ├── nasaApi.js        # NASA API service
│   │   └── asteroidApi.js    # Python backend API service (NEW)
│   └── components/
├── setup-backend.bat         # Windows setup script
└── start-backend.bat         # Windows start script
```

## 🔧 Troubleshooting

### Backend not starting?
- Make sure Python 3.8+ is installed: `python --version`
- Check if port 5000 is available
- Try running `pip install -r requirements.txt` manually

### CORS errors?
- The backend has CORS enabled for `http://localhost:3000`
- Make sure both servers are running

### Import errors in Python?
- Activate the virtual environment first
- Run `pip install -r requirements.txt` again

## 🎯 Next Steps

Now you can:
1. Use Python for complex physics calculations
2. Add machine learning models for asteroid trajectory prediction
3. Integrate scientific Python libraries (scipy, pandas, etc.)
4. Create data visualizations with matplotlib/plotly

Enjoy building with Python + React! 🚀
