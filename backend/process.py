import sqlite3
import pandas as pd
from sklearn.preprocessing import StandardScaler

# Connexion à la base de données SQLite
conn = sqlite3.connect("sensors.db")

# Charger les données dans un DataFrame
query = "SELECT * FROM sensor_data"
df = pd.read_sql_query(query, conn)

# Fermer la connexion
conn.close()

# Afficher les premières lignes
print("🔹 Aperçu des données :")
print(df.head())

# Vérifier les valeurs manquantes
print("\n🔹 Valeurs manquantes :")
print(df.isnull().sum())

# Supprimer les lignes avec des valeurs manquantes (si nécessaire)
df = df.dropna()

# Sélection des features (entrées) et de la target (sortie)
X = df[['soil_moisture', 'temperature', 'humidity', 'precipitation', 'water_retention', 'drainage_rate']]
y = df['water_needed']

# Normalisation des données
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Conversion en DataFrame
X_scaled_df = pd.DataFrame(X_scaled, columns=X.columns)

# Affichage des données normalisées
print("\n🔹 Données normalisées :")
print(X_scaled_df.head())
