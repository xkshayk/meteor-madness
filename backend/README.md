# Meteor Madness - Python Backend

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or with a virtual environment (recommended):

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Mac/Linux
pip install -r requirements.txt
```

### 2. Start the Flask Server

```bash
cd backend
python app.py
```

The server will start on `http://localhost:5000`

### 3. API Endpoints

#### Health Check
```
GET /api/health
```

#### Calculate Full Impact
```
POST /api/calculate-impact
Content-Type: application/json

{
  "diameter": 0.5,      // km
  "velocity": 60000,    // km/h
  "angle": 45,          // degrees
  "flightTime": 3.0     // seconds
}
```

#### Calculate Energy Only
```
POST /api/calculate-energy
Content-Type: application/json

{
  "diameter": 0.5,    // km
  "velocity": 60000   // km/h
}
```

#### Calculate Mass Only
```
POST /api/calculate-mass
Content-Type: application/json

{
  "diameter": 0.5    // km
}
```

## Development

The Flask server runs in debug mode and will auto-reload when you make changes to Python files.

## CORS

CORS is enabled to allow the React frontend (running on port 3000) to communicate with the backend (port 5000).
