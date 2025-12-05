import pandas as pd
import numpy as np

def generate_csv(filename="machine_data.csv", n_samples=5000):
    """Generates a CSV file with synthetic machine data."""
    np.random.seed(42)
    
    # Generate random data
    temperature = np.random.uniform(40, 110, n_samples)
    vibration = np.random.uniform(0, 12, n_samples)
    current = np.random.uniform(10, 60, n_samples)
    voltage = np.random.uniform(200, 250, n_samples)
    rpm = np.random.uniform(500, 3500, n_samples)
    
    # Define logic for status (Ground Truth)
    status = []
    for i in range(n_samples):
        # Critical conditions
        if (temperature[i] > 95 or 
            vibration[i] > 8 or 
            current[i] > 50 or 
            voltage[i] < 205 or voltage[i] > 245):
            status.append("critical")
        
        # Warning conditions
        elif (temperature[i] > 80 or 
              vibration[i] > 5 or 
              current[i] > 40):
            status.append("warning")
            
        # Normal
        else:
            status.append("normal")
            
    df = pd.DataFrame({
        "temperature": temperature,
        "vibration": vibration,
        "current": current,
        "voltage": voltage,
        "rpm": rpm,
        "status": status
    })
    
    df.to_csv(filename, index=False)
    print(f"Generated {filename} with {n_samples} samples.")

if __name__ == "__main__":
    generate_csv()
