const mqtt = require('mqtt');
const fs = require('fs');
const express = require('express');
const app = express();
const port = 3000;

let client;  // Variável global para manter a conexão MQTT
let isConnected = false;  // Verifica se o cliente está conectado

// Função para conectar ao MQTT broker com os certificados
function connectToMQTT(endpoint, keyPath, certPath, caPath) {
    if (isConnected) {
        console.log("Já conectado, desconecte primeiro.");
        return;
    }

    const options = {
        clientId: 'mqtt-client-id-' + Math.random().toString(16).substr(2, 8),
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        ca: fs.readFileSync(caPath),
        port: 8883,
        protocol: 'mqtts'
    };

    client = mqtt.connect(`mqtts://${endpoint}`, options);

    client.on('connect', () => {
        isConnected = true;
        console.log(`Conectado ao endpoint ${endpoint}`);
    });

    client.on('error', (err) => {
        console.error('Erro de conexão:', err);
    });

    client.on('close', () => {
        isConnected = false;
        console.log('Conexão encerrada');
    });
}

// Função para desconectar do MQTT broker
function disconnectFromMQTT() {
    if (client && isConnected) {
        client.end(() => {
            console.log("Desconectado do broker MQTT.");
            isConnected = false;
        });
    } else {
        console.log("Não há conexão ativa.");
    }
}

// Middleware para parsing de JSON
app.use(express.json());

// Rota para conectar ao broker MQTT
app.post('/connect', (req, res) => {
    const { endpoint, keyFile, certFile, caFile } = req.body;

    if (!endpoint || !keyFile || !certFile || !caFile) {
        return res.status(400).json({ error: 'Faltam informações para a conexão.' });
    }

    const keyPath = `./certificates/${keyFile}`;
    const certPath = `./certificates/${certFile}`;
    const caPath = `./certificates/${caFile}`;

    try {
        connectToMQTT(endpoint, keyPath, certPath, caPath);
        res.json({ message: `Tentando conectar ao endpoint ${endpoint}...` });
    } catch (err) {
        res.status(500).json({ error: `Erro ao tentar conectar: ${err.message}` });
    }
});

// Rota para desconectar do broker MQTT
app.post('/disconnect', (req, res) => {
    disconnectFromMQTT();
    res.json({ message: 'Desconectado do broker MQTT.' });
});

// Servidor ouvindo na porta 3000
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
