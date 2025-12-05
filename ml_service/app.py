from flask import Flask, request, jsonify
import joblib
import pandas as pd
import os

app = Flask(__name__)

# Load model
MODEL_PATH = "model.pkl"
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
else:
    model = None
    print("Warning: model.pkl not found. Run train_model.py first.")

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        data = request.json
        # Expecting data like: {"temperature": 80, "vibration": 2, ...}
        
        # Convert to DataFrame for prediction (ensure order matches training)
        features = pd.DataFrame([data], columns=["temperature", "vibration", "current", "voltage", "rpm"])
        
        prediction = model.predict(features)[0]
        return jsonify({"status": prediction})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
