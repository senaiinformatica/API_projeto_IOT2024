// Carrega variáveis de ambiente do arquivo .env
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mqtt = require('mqtt');
const fs = require('fs');
const winston = require('winston');
const app = express();
app.use(express.json());

let client;
let isConnected = false;

// Logger para gerenciar logs
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

// Função para conectar ao MQTT broker com os certificados
function connectToMQTT(endpoint, keyPath, certPath, caPath) {
    if (isConnected) {
        logger.info("Já conectado ao broker.");
        return;
    }

    const options = {
        clientId: `mqtt-client-id-${Math.random().toString(16).substr(2, 8)}`,
        key: fs.readFileSync(process.env.KEY_PATH || keyPath),
        cert: fs.readFileSync(process.env.CERT_PATH || certPath),
        ca: fs.readFileSync(process.env.CA_PATH || caPath),
        port: process.env.MQTT_PORT || 8883,
        protocol: 'mqtts',
        reconnectPeriod: process.env.RECONNECT_PERIOD || 5000,  // Reativar reconexão automática
        connectTimeout: 30 * 1000
    };

    logger.info('Iniciando conexão com MQTT...');

    client = mqtt.connect(`mqtts://${endpoint}`, options);

    client.on('connect', () => {
        isConnected = true;
        logger.info(`Conectado ao endpoint ${endpoint}`);
    });

    client.on('error', (err) => {
        logger.error('Erro na conexão MQTT:', err.message);
        isConnected = false;
    });

    client.on('close', () => {
        isConnected = false;
        logger.info('Conexão encerrada com o broker MQTT');
    });
}

// Função para responder com um padrão de resposta HTTP
function respond(res, status, message, data = null) {
    return res.status(status).json({ message, data });
}

// Rota para conectar ao broker MQTT
app.post('/connect', (req, res) => {
    const { endpoint, keyFile, certFile, caFile } = req.body;
    if (!endpoint || !keyFile || !certFile || !caFile) {
        return respond(res, 400, 'Faltam informações para a conexão.');
    }

    const keyPath = `./certificates/${keyFile}`;
    const certPath = `./certificates/${certFile}`;
    const caPath = `./certificates/${caFile}`;

    logger.info(`Tentando conectar ao broker MQTT no endpoint ${endpoint} com os certificados fornecidos.`);

    connectToMQTT(endpoint, keyPath, certPath, caPath);
    return respond(res, 200, `Tentando conectar ao endpoint ${endpoint}...`);
});

// Rota para publicar mensagem no tópico MQTT
app.post('/publish', (req, res) => {
    const { topic, message } = req.body;

    if (!isConnected) {
        return respond(res, 400, 'Cliente MQTT não está conectado.');
    }

    if (!topic || !message) {
        return respond(res, 400, 'Tópico ou mensagem ausente.');
    }

    try {
        const payload = JSON.stringify(message);
        client.publish(topic, payload, { qos: 0 }, (err) => {
            if (err) {
                throw new Error('Falha ao publicar no tópico MQTT.');
            }
            return respond(res, 200, `Mensagem publicada no tópico ${topic}`);
        });
    } catch (error) {
        logger.error('Erro ao processar o payload JSON:', error.message);
        return respond(res, 500, 'Erro ao processar a mensagem JSON.');
    }
});

// Rota para desconectar do broker MQTT
app.post('/disconnect', (req, res) => {
    if (isConnected && client) {
        client.end();
        logger.info('Desconectado do broker MQTT.');
        return respond(res, 200, 'Desconectado do broker MQTT.');
    }
    return respond(res, 400, 'Nenhuma conexão ativa para desconectar.');
});

// Inicializando o servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
    logger.info(`Servidor rodando na porta ${port}`);
});