from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import numpy as np
from datetime import datetime
import sqlite3
import os
import pandas as pd

app = Flask(__name__)
CORS(app)

# Initialisation de la base de données
def init_db():
    conn = sqlite3.connect('sensors.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS sensor_data
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         timestamp DATETIME,
         soil_type TEXT,
         soil_moisture REAL,
         temperature REAL,
         humidity REAL,
         precipitation REAL,
         water_retention REAL,
         drainage_rate REAL,
         water_needed REAL)
    ''')
    conn.commit()
    conn.close()

# Charger le modèle préexistant
def init_model():
    model_path = 'meilleur_modele.pkl'
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"❌ Le modèle '{model_path}' est introuvable. Assurez-vous qu'il est bien placé dans le répertoire.")
    
    model = joblib.load(model_path)
    return model

# Initialiser le modèle
model = init_model()

# Route pour obtenir les dernières données des capteurs
@app.route('/api/sensor-data', methods=['GET'])
def get_sensor_data():
    conn = sqlite3.connect('sensors.db')
    df = pd.read_sql_query('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1', conn)
    conn.close()
    
    if df.empty:
        return jsonify({
            'error': 'No sensor data available'
        }), 404
        
    return jsonify({
        'soil_type': df['soil_type'].iloc[0],
        'soil_moisture': float(df['soil_moisture'].iloc[0]),
        'temperature': float(df['temperature'].iloc[0]),
        'humidity': float(df['humidity'].iloc[0]),
        'precipitation': float(df['precipitation'].iloc[0]),
        'water_retention': float(df['water_retention'].iloc[0]),
        'drainage_rate': float(df['drainage_rate'].iloc[0]),
        'timestamp': df['timestamp'].iloc[0]
    })

# Route pour prédire l'irrigation
@app.route('/api/predict', methods=['POST'])
def predict_irrigation():
    data = request.get_json()

    # Convertir le type de sol en nombre
    soil_type_mapping = {
        'sandy': 0,
        'clay': 1,
        'loamy': 2,
        'siliceous': 3
    }
    
    soil_type_num = soil_type_mapping.get(data['soil_type'], -1)  # -1 si type non valide
    
    if soil_type_num == -1:
        return jsonify({
            'error': 'Invalid soil type'
        }), 400
    
    # Préparer les features dans le même ordre que l'entraînement
    features = np.array([[
        soil_type_num,  # Utiliser le numéro du type de sol
        data['soil_moisture'],
        data['temperature'],
        data['humidity'],
        data['precipitation'],
        data['water_retention'],
        data['drainage_rate']
    ]])
    
    # Calculer l'eau nécessaire selon la formule FAO
    water_needed_fao = (
        (1 - data['soil_moisture'] / 100)
        * data['water_retention']
        * 1000
    )
    
    # Prédiction du modèle
    water_needed_pred = float(model.predict(features)[0])
    
    # Moyenne pondérée entre la formule FAO et la prédiction du modèle
    water_needed = 0.7 * water_needed_pred + 0.3 * water_needed_fao
    
    # Logique de décision
    needs_irrigation = water_needed > 100  # Seuil arbitraire de 100L/ha
    confidence = float(max(0.6, min(0.95, 1 - abs(water_needed_pred - water_needed_fao) / water_needed_fao)))
    
    return jsonify({
        'needs_irrigation': needs_irrigation,
        'water_amount': round(water_needed, 2),
        'confidence': round(confidence * 100, 2),
        'reason': f"Calculated water requirement: {round(water_needed, 2)}L/ha" if needs_irrigation 
                 else "Irrigation not necessary"
    })

# Route pour simuler des données de capteurs
@app.route('/api/simulate-sensors', methods=['POST'])
def simulate_sensors():
    soil_types = ['sandy', 'clay', 'loamy', 'siliceous']
    # Simulation de nouvelles données de capteurs
    new_data = {
        'timestamp': datetime.now().isoformat(),
        'soil_type': np.random.choice(soil_types),
        'soil_moisture': round(np.random.uniform(30, 70), 2),
        'temperature': round(np.random.uniform(15, 30), 2),
        'humidity': round(np.random.uniform(40, 80), 2),
        'precipitation': round(np.random.uniform(0, 10), 2),
        'water_retention': round(np.random.uniform(0.3, 0.8), 2),
        'drainage_rate': round(np.random.uniform(0.1, 0.5), 2)
    }
    
    # Calculer water_needed selon la formule FAO
    new_data['water_needed'] = round(
        (1 - new_data['soil_moisture'] / 100)
        * new_data['water_retention']
        * 1000,
        2
    )
    
    # Sauvegarde dans la base de données
    conn = sqlite3.connect('sensors.db')
    c = conn.cursor()
    c.execute('''
        INSERT INTO sensor_data
        (timestamp, soil_type, soil_moisture, temperature, humidity, 
         precipitation, water_retention, drainage_rate, water_needed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        new_data['timestamp'],
        new_data['soil_type'],
        new_data['soil_moisture'],
        new_data['temperature'],
        new_data['humidity'],
        new_data['precipitation'],
        new_data['water_retention'],
        new_data['drainage_rate'],
        new_data['water_needed']
    ))
    conn.commit()
    conn.close()
    
    return jsonify(new_data)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)