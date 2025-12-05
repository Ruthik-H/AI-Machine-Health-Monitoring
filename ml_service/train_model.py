import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

def generate_synthetic_data(n_samples=1000):
    """Generates synthetic sensor data for training."""
    np.random.seed(42)
    
    # Generate random data
    temperature = np.random.uniform(40, 100, n_samples)
    vibration = np.random.uniform(0, 10, n_samples)
    load = np.random.uniform(0, 100, n_samples)
    rpm = np.random.uniform(500, 3000, n_samples)
    humidity = np.random.uniform(20, 80, n_samples)
    
    # Define logic for status (Ground Truth)
    status = []
    for i in range(n_samples):
        if temperature[i] > 90 or vibration[i] > 8 or load[i] > 90:
            status.append("critical")
        elif temperature[i] > 75 or vibration[i] > 5 or load[i] > 70:
            status.append("warning")
        else:
            status.append("normal")
            
    df = pd.DataFrame({
        "temperature": temperature,
        "vibration": vibration,
        "load": load,
        "rpm": rpm,
        "humidity": humidity,
        "status": status
    })
    
    return df

def train():
    csv_file = "machine_data.csv"
    
    # Check if CSV exists, if not generate it
    try:
        df = pd.read_csv(csv_file)
        print(f"Loaded data from {csv_file}")
    except FileNotFoundError:
        print("CSV not found. Generating synthetic data...")
        from generate_csv import generate_csv
        generate_csv(csv_file)
        df = pd.read_csv(csv_file)
    
    # Features: temperature, vibration, current, voltage, rpm
    # Note: 'load' and 'humidity' removed to match new requirements, or keep if needed.
    # The user asked for current/voltage. Let's stick to what's in the CSV.
    feature_cols = ["temperature", "vibration", "current", "voltage", "rpm"]
    
    # Ensure columns exist
    for col in feature_cols:
        if col not in df.columns:
            # Fallback if using old CSV format
            print(f"Missing column {col}, regenerating...")
            from generate_csv import generate_csv
            generate_csv(csv_file)
            df = pd.read_csv(csv_file)
            break

    X = df[feature_cols]
    y = df["status"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    
    joblib.dump(model, "model.pkl")
    print("Model saved to model.pkl")

if __name__ == "__main__":
    train()
