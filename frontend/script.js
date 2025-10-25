// Connexion avec l'API
const API_URL = 'https://agroai-vn9q.onrender.com/api';

// État global de l'application
let sensorData = {
    soil_type: 'loamy',
    soil_moisture: 45,
    temperature: 22,
    humidity: 65,
    precipitation: 0,
    water_retention: 0.5,
    drainage_rate: 0.3,
    timestamp: new Date().toISOString()
};

const irrigationZones = [
    {
        id: '1',
        name: 'Zone 1',
        soil_type: 'loamy',
        moistureLevel: 45,
        optimalMoisture: 60,
        isIrrigating: false,
        lastWatered: new Date(),
        waterUsed: 0,
        prediction: null,
        autoMode: true
    }
];

// Fonctions API
async function fetchSensorData() {
    try {
        const response = await fetch(`${API_URL}/sensor-data`);
        if (!response.ok) {
            throw new Error('Error retrieving sensor data');
        }
        const data = await response.json();
        sensorData = data;
        updateSensorDisplay();
    } catch (error) {
        console.error('Error API:', error);
    }
}

async function simulateSensors() {
    try {
        const response = await fetch(`${API_URL}/simulate-sensors`, {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error('Error during sensors simulation');
        }
        const data = await response.json();
        sensorData = data;
        irrigationZones[0].soil_type = sensorData.soil_type;
        updateSensorDisplay();
        predictIrrigation();
    } catch (error) {
        console.error('Erreur simulation:', error);
    }
}

async function predictIrrigation() {
    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                soil_type: sensorData.soil_type,
                soil_moisture: sensorData.soil_moisture,
                temperature: sensorData.temperature,
                humidity: sensorData.humidity,
                precipitation: sensorData.precipitation,
                water_retention: sensorData.water_retention,
                drainage_rate: sensorData.drainage_rate
            })
        });
        if (!response.ok) {
            throw new Error('Error during prediction');
        }
        const prediction = await response.json();
        
        // Mise à jour de la zone avec la prédiction
        irrigationZones[0].prediction = prediction;
        if (irrigationZones[0].autoMode) {
            irrigationZones[0].isIrrigating = prediction.needs_irrigation;
            if (prediction.needs_irrigation) {
                irrigationZones[0].waterUsed = prediction.water_amount;
            }
        }
        renderIrrigationZones();
    } catch (error) {
        console.error('Error prediction:', error);
    }
}

// Gestion du menu mobile
document.getElementById('menuToggle').addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('active');
});

// Mise à jour des données des capteurs
function updateSensorDisplay() {
    const sensorDisplay = document.getElementById('sensorData');
    sensorDisplay.innerHTML = `
        <div class="sensor-grid">
            <div class="sensor-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12h20"/><path d="M2 12c0 5 2 8 5 8"/><path d="M2 12c0-5 2-8 5-8"/>
                </svg>
                <span>Soil type: ${sensorData.soil_type}</span>
            </div>
            <div class="sensor-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
                </svg>
                <span>Soil moisture: ${sensorData.soil_moisture}%</span>
            </div>
            <div class="sensor-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
                </svg>
                <span>Temperature: ${sensorData.temperature}°C</span>
            </div>
            <div class="sensor-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v18"/><path d="M3 12h18"/>
                </svg>
                <span>Air humidity: ${sensorData.humidity}%</span>
            </div>
            <div class="sensor-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 1 1 2.5 8.242"/>
                    <path d="M16 14v6"/>
                    <path d="M8 14v6"/>
                    <path d="M12 16v6"/>
                </svg>
                <span>Precipitations: ${sensorData.precipitation}mm</span>
            </div>
            <div class="sensor-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 20.5c-2.3 2.3-5.2 2-6.5-.5S1.7 14.3 4 12c1.3-1.3 3-2 4.8-2"/>
                    <path d="M14 14c1.8 0 3.5-.7 4.8-2 2.3-2.3 3-5.2.5-6.5s-4.2-.2-6.5 2.1c-1.3 1.3-2 3-2 4.9V20"/>
                </svg>
                <span>Water Retention: ${(sensorData.water_retention * 100).toFixed(1)}%</span>
            </div>
            <div class="sensor-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z"/>
                    <path d="M12 8v8"/>
                    <path d="M8 12l8 0"/>
                </svg>
                <span>Drainage rate: ${(sensorData.drainage_rate * 100).toFixed(1)}%</span>
            </div>
        </div>
        <p class="sensor-update">Last update: ${new Date(sensorData.timestamp).toLocaleString()}</p>
    `;
}

// Gestion des zones d'irrigation
function renderIrrigationZones() {
    const zonesContainer = document.getElementById('irrigationZones');
    zonesContainer.innerHTML = irrigationZones.map(zone => {
        const prediction = zone.prediction || { needs_irrigation: false, water_amount: 0, confidence: 0, reason: 'Waiting for prediction...' };
        return `
            <div class="irrigation-zone">
                <div class="zone-header">
                    <h3>${zone.name} (${zone.soil_type})</h3>
                    <div class="zone-controls">
                        <label class="auto-mode">
                            <input type="checkbox" 
                                ${zone.autoMode ? 'checked' : ''} 
                                onchange="toggleAutoMode('${zone.id}', this.checked)"
                            >
                            Mode Auto
                        </label>
                        ${!zone.autoMode ? `
                            <button 
                                onclick="toggleIrrigation('${zone.id}')"
                                class="irrigation-button ${zone.isIrrigating ? 'stop-button' : 'start-button'}"
                            >
                                ${zone.isIrrigating ? 'Stop' : 'Start'}
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="moisture-info">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rain">
                        <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
                    </svg>
                    <span>Current humidity: ${zone.moistureLevel}%</span>
                </div>
                <div class="prediction-info ${prediction.needs_irrigation ? 'needs-water' : 'no-water'}">
                    <h4>AI analysis</h4>
                    <p>${prediction.reason}</p>
                    ${prediction.needs_irrigation ? `
                        <p>Recommended amount of water: ${prediction.water_amount.toFixed(2)}L/ha</p>
                    ` : ''}
                    <p>Trust: ${prediction.confidence}%</p>
                </div>
                ${zone.isIrrigating ? `
                    <div class="irrigation-status">
                        <p>✅ Irrigation in progress</p>
                        <p>Water used: ${zone.waterUsed.toFixed(2)}L/ha</p>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function toggleAutoMode(id, enabled) {
    const zoneIndex = irrigationZones.findIndex(zone => zone.id === id);
    if (zoneIndex !== -1) {
        irrigationZones[zoneIndex].autoMode = enabled;
        if (enabled) {
            irrigationZones[zoneIndex].isIrrigating = false;
            predictIrrigation(); // Demander une nouvelle prédiction
        }
        renderIrrigationZones();
    }
}

function toggleIrrigation(id) {
    const zoneIndex = irrigationZones.findIndex(zone => zone.id === id);
    if (zoneIndex !== -1 && !irrigationZones[zoneIndex].autoMode) {
        irrigationZones[zoneIndex].isIrrigating = !irrigationZones[zoneIndex].isIrrigating;
        if (irrigationZones[zoneIndex].isIrrigating) {
            irrigationZones[zoneIndex].waterUsed = 0;
        }
        renderIrrigationZones();
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    updateSensorDisplay();
    renderIrrigationZones();
    
    // Première récupération des données
    fetchSensorData();
    
    // Mise à jour périodique
    setInterval(() => {
        simulateSensors();
    },100000);
});