"""
Asteroid impact physics calculations
"""
import math

class AsteroidPhysics:
    """Calculate asteroid impact parameters"""
    
    # Constants
    ATMOSPHERE_DRAG_DIAMETER = 0.08  # km/s
    ATMOSPHERE_DRAG_VELOCITY = 2.2  # km/s (converted from 8000 km/h/s)
    ASTEROID_DENSITY = 3000  # kg/m³
    TNT_EQUIVALENT_JOULES = 4.184e15  # Joules per megaton
    
    @staticmethod
    def calculate_mass(diameter_km):
        """
        Calculate asteroid mass from diameter assuming spherical shape
        
        Args:
            diameter_km: Diameter in kilometers
            
        Returns:
            Mass in kilograms
        """
        radius_m = (diameter_km / 2) * 1000  # Convert to meters
        volume_m3 = (4/3) * math.pi * (radius_m ** 3)
        mass_kg = volume_m3 * AsteroidPhysics.ASTEROID_DENSITY
        return mass_kg
    
    @staticmethod
    def calculate_impact_energy(diameter_km, velocity_kms):
        """
        Calculate kinetic energy at impact
        
        Args:
            diameter_km: Diameter in kilometers
            velocity_kms: Velocity in km/s
            
        Returns:
            Dictionary with energy in different units
        """
        mass_kg = AsteroidPhysics.calculate_mass(diameter_km)
        velocity_ms = velocity_kms * 1000  # Convert km/s to m/s
        
        energy_joules = 0.5 * mass_kg * (velocity_ms ** 2)
        energy_megatons = energy_joules / AsteroidPhysics.TNT_EQUIVALENT_JOULES
        energy_kilotons = energy_megatons * 1000
        energy_gigatons = energy_megatons / 1000
        
        return {
            'joules': energy_joules,
            'megatons': energy_megatons,
            'kilotons': energy_kilotons,
            'gigatons': energy_gigatons,
            'mass_kg': mass_kg
        }
    
    @staticmethod
    def calculate_atmospheric_entry(diameter_km, velocity_kms, angle_deg, flight_time_s):
        """
        Calculate diameter and velocity changes during atmospheric entry
        
        Args:
            diameter_km: Initial diameter in kilometers
            velocity_kms: Initial velocity in km/s
            angle_deg: Entry angle in degrees
            flight_time_s: Flight duration in seconds
            
        Returns:
            Dictionary with final diameter and velocity
        """
        # Calculate final values after atmospheric burn
        final_diameter = max(0, diameter_km - (AsteroidPhysics.ATMOSPHERE_DRAG_DIAMETER * flight_time_s))
        final_velocity = max(0, velocity_kms - (AsteroidPhysics.ATMOSPHERE_DRAG_VELOCITY * flight_time_s))
        
        return {
            'final_diameter_km': final_diameter,
            'final_velocity_kms': final_velocity,
            'diameter_loss_km': diameter_km - final_diameter,
            'velocity_loss_kms': velocity_kms - final_velocity
        }
    
    @staticmethod
    def calculate_crater_size(energy_megatons):
        """
        Estimate crater size based on impact energy
        
        Args:
            energy_megatons: Impact energy in megatons
            
        Returns:
            Crater diameter in meters
        """
        # Simplified crater scaling: base 100m + 15m per megaton
        # Capped at 800m for visualization purposes
        crater_size = 100 + (energy_megatons * 15)
        return min(crater_size, 800)
    
    @staticmethod
    def calculate_full_impact(diameter_km, velocity_kms, angle_deg, flight_time_s):
        """
        Complete impact calculation pipeline
        
        Args:
            diameter_km: Initial diameter in kilometers
            velocity_kms: Initial velocity in km/s
            angle_deg: Entry angle in degrees
            flight_time_s: Flight duration in seconds
            
        Returns:
            Complete impact analysis dictionary
        """
        # Atmospheric entry effects
        entry_data = AsteroidPhysics.calculate_atmospheric_entry(
            diameter_km, velocity_kms, angle_deg, flight_time_s
        )
        
        # Impact energy
        energy_data = AsteroidPhysics.calculate_impact_energy(
            entry_data['final_diameter_km'],
            entry_data['final_velocity_kms']
        )
        
        # Crater size
        crater_size = AsteroidPhysics.calculate_crater_size(energy_data['megatons'])
        
        return {
            'initial': {
                'diameter_km': diameter_km,
                'velocity_kms': velocity_kms,
                'angle_deg': angle_deg
            },
            'atmospheric_entry': entry_data,
            'impact': energy_data,
            'crater': {
                'size_meters': crater_size,
                'radius_meters': crater_size / 2
            }
        }
