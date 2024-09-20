const express = require('express');
const mqtt = require('mqtt');
const app = express();
const port = 3000;

app.use(express.json());

// Configurações do MQTT
const mqttEndpoint = 'mqtts://your-mqtt-endpoint.amazonaws.com';
const client = mqtt.connect(mqttEndpoint, {
    ca: `-----BEGIN CERTIFICATE-----
    YOUR_CA_CERTIFICATE_HERE
    -----END CERTIFICATE-----`,
    cert: `-----BEGIN CERTIFICATE-----
    YOUR_CLIENT_CERTIFICATE_HERE
    -----END CERTIFICATE-----`,
    key: `-----BEGIN PRIVATE KEY-----
    YOUR_CLIENT_PRIVATE_KEY_HERE
    -----END PRIVATE KEY-----`
});

/*
const fs = require('fs');
const path = require('path');

const client = mqtt.connect(mqttEndpoint, {
    ca: fs.readFileSync(path.join(__dirname, 'certs/ca.crt')),
    cert: fs.readFileSync(path.join(__dirname, 'certs/client.crt')),
    key: fs.readFileSync(path.join(__dirname, 'certs/client.key'))
});
*/

client.on('connect', function () {
    console.log('Conectado ao broker MQTT');
});

app.post('/send', (req, res) => {
    const message = req.body;
    client.publish('controlTopic', JSON.stringify(message), (err) => {
        if (err) {
            res.status(500).send('Erro ao enviar a mensagem');
        } else {
            res.status(200).send('Mensagem enviada com sucesso');
        }
    });
});

app.get('/message', (req, res) => {
    // Substitua com a lógica para armazenar e buscar a última mensagem recebida
    client.subscribe('responseTopic');
    client.on('message', (topic, message) => {
        if (topic === 'responseTopic') {
            res.json({ msg: message.toString() });
        }
    });
});

app.listen(port, () => {
    console.log(`Servidor ouvindo na porta ${port}`);
});
