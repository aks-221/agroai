import sqlite3
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingRegressor

# Connexion à la base de données
def load_data():
    conn = sqlite3.connect("sensors.db")
    df = pd.read_sql_query("SELECT * FROM sensor_data", conn)
    conn.close()
    return df

# Préparation des données
def preprocess_data(df):
    df = df.dropna()  # Supprimer les valeurs manquantes
    
    # Encodage du type de sol
    soil_mapping = {"sandy": 0, "clay": 1, "loamy": 2, "siliceous": 3}
    df["soil_type"] = df["soil_type"].map(soil_mapping)
    
    # Sélection des features et de la target
    X = df[["soil_type", "soil_moisture", "temperature", "humidity", "precipitation", "water_retention", "drainage_rate"]]
    y = df["water_needed"]
    
    # Normalisation
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    return X_scaled, y, scaler

# Entraînement du modèle
def train_model():
    df = load_data()
    X, y, scaler = preprocess_data(df)
    
    # Séparer en ensemble d'entraînement et de test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Modèle de régression
    model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)
    
    # Évaluation
    score = model.score(X_test, y_test)
    print(f"✅ Modèle entraîné avec un score de {score:.2f}")
    
    # Sauvegarde du modèle et du scaler
    joblib.dump(model, "meilleur_modele.pkl")
    joblib.dump(scaler, "scaler.pkl")
    print("📁 Modèle et scaler sauvegardés !")

if __name__ == "__main__":
    train_model()
