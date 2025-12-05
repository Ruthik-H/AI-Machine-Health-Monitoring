# Machine Health Monitoring System with ML

This project consists of three parts:
1.  **Frontend**: The React dashboard.
2.  **Backend**: The Node.js server that updates the database.
3.  **ML Service**: The Python service that predicts machine health.

## How to Run Everything

You need to open **3 separate terminals** (command prompts) to run the full system.

### Terminal 1: Start the ML Service (Python)
This service calculates the health status (Normal/Warning/Critical).
```bash
cd ml_service
python app.py
```
*It will say "Running on http://0.0.0.0:5000"*

### Terminal 2: Start the Backend (Node.js)
This generates data and sends it to the ML service.
```bash
node backend/backend.mjs
```
*It will say "Server running..." and "Machine data updated..."*

### Terminal 3: Start the Frontend (React)
This shows the dashboard.
```bash
cd frontend
npm start
```
*It will open your browser to http://localhost:3000*

## Setup (First Time Only)
If you are running this on a new computer, install dependencies first:
```bash
# Backend
npm install

# Frontend
cd frontend
npm install

# ML Service
cd ml_service
pip install -r requirements.txt
python train_model.py
```
