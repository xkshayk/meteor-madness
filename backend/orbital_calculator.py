"""
Orbital mechanics calculator for asteroid trajectories
Converts Keplerian orbital elements to 3D Cartesian coordinates
"""
import numpy as np
import pandas as pd
import os

class OrbitalCalculator:
    """Calculate 3D orbital trajectories from Keplerian elements"""
    
    def __init__(self, csv_path=None):
        """
        Initialize calculator and optionally load asteroid data
        
        Args:
            csv_path: Path to CSV file with orbital elements
        """
        self.asteroids = {}
        if csv_path and os.path.exists(csv_path):
            self.load_asteroids(csv_path)
    
    def load_asteroids(self, csv_path):
        """
        Load asteroid data from CSV
        
        Expected columns: obj_designation, PHA, i, e, a, node, peri
        """
        df = pd.read_csv(csv_path)
        
        for _, row in df.iterrows():
            name = row['obj_designation']
            self.asteroids[name] = {
                'name': name,
                'pha': row['PHA'] == 'Y',
                'a': float(row['a']),  # semi-major axis (AU)
                'e': float(row['e']),  # eccentricity
                'i': float(row['i']),  # inclination (degrees)
                'node': float(row['node']),  # longitude of ascending node (degrees)
                'peri': float(row['peri'])  # argument of perihelion (degrees)
            }
    
    @staticmethod
    def calculate_orbit_point(a, e, i, node, peri, theta):
        """
        Calculate single 3D position on orbit
        
        Args:
            a: semi-major axis (AU)
            e: eccentricity
            i: inclination (degrees)
            node: longitude of ascending node (degrees)
            peri: argument of perihelion (degrees)
            theta: true anomaly (radians)
        
        Returns:
            tuple: (X, Y, Z) in AU
        """
        # Convert angles to radians
        i_rad = np.radians(i)
        node_rad = np.radians(node)
        peri_rad = np.radians(peri)
        
        # Calculate radial distance (standard Keplerian orbit equation)
        r = a * (1 - e**2) / (1 + e * np.cos(theta))
        
        # Orbital plane coordinates
        x = r * np.cos(theta)
        y = r * np.sin(theta)
        
        # Precompute trig functions for efficiency
        cos_node = np.cos(node_rad)
        sin_node = np.sin(node_rad)
        cos_peri = np.cos(peri_rad)
        sin_peri = np.sin(peri_rad)
        cos_i = np.cos(i_rad)
        sin_i = np.sin(i_rad)
        
        # Transform to 3D ecliptic coordinates
        X = x * (cos_node * cos_peri - sin_node * sin_peri * cos_i) - \
            y * (cos_node * sin_peri + sin_node * cos_peri * cos_i)
        
        Y = x * (sin_node * cos_peri + cos_node * sin_peri * cos_i) - \
            y * (sin_node * sin_peri - cos_node * cos_peri * cos_i)
        
        Z = x * (sin_peri * sin_i) + y * (cos_peri * sin_i)
        
        return (X, Y, Z)
    
    def calculate_full_orbit(self, a, e, i, node, peri, num_points=360):
        """
        Calculate complete orbital path
        
        Args:
            a, e, i, node, peri: Orbital elements
            num_points: Number of points to calculate
        
        Returns:
            dict: {'x': [...], 'y': [...], 'z': [...]}
        """
        thetas = np.linspace(0, 2 * np.pi, num_points)
        
        X_points = []
        Y_points = []
        Z_points = []
        
        for theta in thetas:
            X, Y, Z = self.calculate_orbit_point(a, e, i, node, peri, theta)
            X_points.append(X)
            Y_points.append(Y)
            Z_points.append(Z)
        
        return {
            'x': X_points,
            'y': Y_points,
            'z': Z_points
        }
    
    def get_asteroid_orbit(self, name, num_points=360):
        """
        Get orbital path for a specific asteroid
        
        Args:
            name: Asteroid designation
            num_points: Number of points to calculate
        
        Returns:
            dict: Orbital data with trajectory points
        """
        if name not in self.asteroids:
            return None
        
        asteroid = self.asteroids[name]
        orbit = self.calculate_full_orbit(
            asteroid['a'],
            asteroid['e'],
            asteroid['i'],
            asteroid['node'],
            asteroid['peri'],
            num_points
        )
        
        return {
            'name': asteroid['name'],
            'pha': asteroid['pha'],
            'orbital_elements': {
                'a': asteroid['a'],
                'e': asteroid['e'],
                'i': asteroid['i'],
                'node': asteroid['node'],
                'peri': asteroid['peri']
            },
            'trajectory': orbit
        }
    
    def get_all_orbits(self, num_points=360):
        """
        Get orbital paths for all loaded asteroids
        
        Args:
            num_points: Number of points per orbit
        
        Returns:
            list: List of orbital data dictionaries
        """
        return [
            self.get_asteroid_orbit(name, num_points)
            for name in self.asteroids.keys()
        ]
    
    def get_pha_orbits(self, num_points=360):
        """
        Get orbital paths for potentially hazardous asteroids only
        
        Args:
            num_points: Number of points per orbit
        
        Returns:
            list: List of PHA orbital data dictionaries
        """
        return [
            self.get_asteroid_orbit(name, num_points)
            for name, data in self.asteroids.items()
            if data['pha']
        ]
    
    def create_trajectory_summary_csv(self, output_path):
        """
        Create a summary CSV with asteroid names, trajectory equations, and PHA status
        
        Args:
            output_path: Path to save CSV file
        """
        summary_data = []
        
        for name, asteroid in self.asteroids.items():
            a = asteroid['a']
            e = asteroid['e']
            i = asteroid['i']
            node = asteroid['node']
            peri = asteroid['peri']
            
            # Create trajectory equation string
            trajectory_eq = (
                f"r(θ)={a:.4f}(1-{e:.4f}²)/(1+{e:.4f}cos(θ)); "
                f"x=r·cos(θ), y=r·sin(θ); "
                f"X,Y,Z transformed with i={i:.2f}°, Ω={node:.2f}°, ω={peri:.2f}°"
            )
            
            summary_data.append({
                'Asteroid Name': name,
                'Trajectory Equation': trajectory_eq,
                'PHA': 'Yes' if asteroid['pha'] else 'No'
            })
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_csv(output_path, index=False)
        print(f"✅ Trajectory summary saved to: {output_path}")
        
        return summary_df


# Initialize global calculator instance
_calculator = None

def get_calculator():
    """Get or create the global orbital calculator instance"""
    global _calculator
    if _calculator is None:
        csv_path = os.path.join(os.path.dirname(__file__), 'asteroid_data.csv')
        _calculator = OrbitalCalculator(csv_path)
    return _calculator
