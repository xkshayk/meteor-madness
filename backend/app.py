"""
Flask backend server for Meteor Madness asteroid simulator
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from asteroid_calculations import AsteroidPhysics
from orbital_calculator import get_calculator

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize physics calculator
physics = AsteroidPhysics()

# Initialize orbital calculator (loads CSV on startup)
orbital_calc = get_calculator()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Meteor Madness API',
        'version': '1.0.0'
    })

@app.route('/api/calculate-impact', methods=['POST'])
def calculate_impact():
    """
    Calculate complete impact analysis
    
    Expected JSON body:
    {
        "diameter": 0.5,        # km
        "velocity": 16.7,       # km/s
        "angle": 45,            # degrees
        "flightTime": 3.0       # seconds
    }
    """
    try:
        data = request.json
        
        # Validate input
        required_fields = ['diameter', 'velocity', 'angle', 'flightTime']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        diameter = float(data['diameter'])
        velocity = float(data['velocity'])
        angle = float(data['angle'])
        flight_time = float(data['flightTime'])
        
        # Validate ranges
        if not (0.001 <= diameter <= 100):
            return jsonify({'error': 'Diameter must be between 0.001 and 100 km'}), 400
        if not (0.3 <= velocity <= 140):
            return jsonify({'error': 'Velocity must be between 0.3 and 140 km/s'}), 400
        if not (0 <= angle <= 90):
            return jsonify({'error': 'Angle must be between 0 and 90 degrees'}), 400
        
        # Calculate impact
        result = physics.calculate_full_impact(diameter, velocity, angle, flight_time)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except ValueError as e:
        return jsonify({
            'error': f'Invalid input values: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/calculate-energy', methods=['POST'])
def calculate_energy():
    """
    Calculate impact energy only
    
    Expected JSON body:
    {
        "diameter": 0.5,    # km
        "velocity": 16.7    # km/s
    }
    """
    try:
        data = request.json
        
        if 'diameter' not in data or 'velocity' not in data:
            return jsonify({
                'error': 'Missing required fields: diameter and velocity'
            }), 400
        
        diameter = float(data['diameter'])
        velocity = float(data['velocity'])
        
        energy_data = physics.calculate_impact_energy(diameter, velocity)
        
        return jsonify({
            'success': True,
            'data': energy_data
        })
        
    except ValueError as e:
        return jsonify({
            'error': f'Invalid input values: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/calculate-mass', methods=['POST'])
def calculate_mass():
    """
    Calculate asteroid mass from diameter
    
    Expected JSON body:
    {
        "diameter": 0.5    # km
    }
    """
    try:
        data = request.json
        
        if 'diameter' not in data:
            return jsonify({
                'error': 'Missing required field: diameter'
            }), 400
        
        diameter = float(data['diameter'])
        mass = physics.calculate_mass(diameter)
        
        return jsonify({
            'success': True,
            'data': {
                'mass_kg': mass,
                'mass_tons': mass / 1000,
                'mass_kilotons': mass / 1000000
            }
        })
        
    except ValueError as e:
        return jsonify({
            'error': f'Invalid input value: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/orbits', methods=['GET'])
def get_all_orbits():
    """
    Get orbital trajectories for all asteroids
    
    Query params:
        points: Number of points per orbit (default: 360)
    """
    try:
        num_points = int(request.args.get('points', 360))
        
        orbits = orbital_calc.get_all_orbits(num_points)
        
        return jsonify({
            'success': True,
            'count': len(orbits),
            'data': orbits
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/orbits/<asteroid_name>', methods=['GET'])
def get_asteroid_orbit(asteroid_name):
    """
    Get orbital trajectory for a specific asteroid
    
    Args:
        asteroid_name: Asteroid designation (e.g., "433 Eros")
    
    Query params:
        points: Number of points (default: 360)
    """
    try:
        num_points = int(request.args.get('points', 360))
        
        orbit = orbital_calc.get_asteroid_orbit(asteroid_name, num_points)
        
        if orbit is None:
            return jsonify({
                'error': f'Asteroid "{asteroid_name}" not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': orbit
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/orbits/pha/list', methods=['GET'])
def get_pha_orbits():
    """
    Get orbital trajectories for potentially hazardous asteroids only
    
    Query params:
        points: Number of points per orbit (default: 360)
    """
    try:
        num_points = int(request.args.get('points', 360))
        
        pha_orbits = orbital_calc.get_pha_orbits(num_points)
        
        return jsonify({
            'success': True,
            'count': len(pha_orbits),
            'data': pha_orbits
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/asteroid-list', methods=['GET'])
def get_asteroid_list():
    """
    Get list of all asteroid names and PHA status (lightweight)
    """
    try:
        asteroid_list = [
            {
                'name': data['name'],
                'pha': data['pha']
            }
            for name, data in orbital_calc.asteroids.items()
        ]
        
        return jsonify({
            'success': True,
            'count': len(asteroid_list),
            'data': asteroid_list
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Meteor Madness API Server...")
    print("📡 Server running on http://localhost:5000")
    print("✅ CORS enabled for frontend communication")
    print(f"🛰️  Loaded {len(orbital_calc.asteroids)} asteroid orbits")
    app.run(debug=True, port=5000)
