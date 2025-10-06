"""
Script to generate asteroid trajectory summary CSV
Run this once to create the summary file
"""
from orbital_calculator import get_calculator
import os

def main():
    # Get the calculator instance (loads asteroid_data.csv)
    calc = get_calculator()
    
    # Create output path
    output_path = os.path.join(os.path.dirname(__file__), 'asteroid_trajectory_summary.csv')
    
    # Generate the summary CSV
    calc.create_trajectory_summary_csv(output_path)
    
    print(f"\n📊 Summary:")
    print(f"   Total asteroids: {len(calc.asteroids)}")
    print(f"   PHAs: {sum(1 for a in calc.asteroids.values() if a['pha'])}")
    print(f"   Non-PHAs: {sum(1 for a in calc.asteroids.values() if not a['pha'])}")

if __name__ == '__main__':
    main()
