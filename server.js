const mqtt = require('mqtt');
const fs = require('fs');
const express = require('express');
const http = require('http');  // Precisamos do http para integrar com Socket.IO
const socketIo = require('socket.io');  // Adicionar suporte para Socket.IO
const cors = require('cors');


const app = express();
const server = http.createServer(app);  // Criar servidor HTTP com Express
const io = socketIo(server, {
    cors: {
        origin: "*",  // Permite todas as origens. Para mais segurança, especifique o domínio do frontend.
        methods: ["GET", "POST"] // Métodos permitidos
    }
});  // Inicializar Socket.IO
const port = 3000;

let client;  // Variável global para manter a conexão MQTT
let isConnected = false;  // Verifica se o cliente está conectado
let subscribedTopics = [];  // Armazena os tópicos aos quais estamos inscritos

app.use(cors());

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
        protocol: 'mqtts',
        reconnectPeriod: 0,  // Desativa a reconexão automática para diagnóstico
        connectTimeout: 30 * 1000  // Timeout de 30 segundos para a conexão
    };

    console.log('Iniciando conexão com MQTT...');

    client = mqtt.connect(`mqtts://${endpoint}`, options);

    client.on('connect', () => {
        isConnected = true;
        console.log(`Conectado ao endpoint ${endpoint}`);
    });

    client.on('error', (err) => {
        console.error('Erro de conexão:', err.message);
    });

    client.on('close', () => {
        isConnected = false;
        console.log('Conexão encerrada. Verifique o broker ou os certificados.');
    });

    // Listener para mensagens recebidas nos tópicos aos quais o cliente está inscrito
    client.on('message', (topic, message) => {
        const msg = message.toString();
        console.log(`Mensagem recebida no tópico ${topic}: ${msg}`);

        // Emitir a mensagem para todos os clientes conectados ao Socket.IO
        io.emit('mqtt_message', { topic, message: msg });
    });
}

// Função para desconectar do MQTT broker
function disconnectFromMQTT() {
    if (client && isConnected) {
        client.end(false, () => {
            console.log("Desconectado do broker MQTT.");
            isConnected = false;
            subscribedTopics = [];  // Limpa os tópicos inscritos ao desconectar
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

    console.log('Tentando conectar ao broker MQTT com os seguintes dados:');
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Key: ${keyPath}`);
    console.log(`Cert: ${certPath}`);
    console.log(`CA: ${caPath}`);

    connectToMQTT(endpoint, keyPath, certPath, caPath);
    res.json({ message: `Tentando conectar ao endpoint ${endpoint}...` });
});

// Rota para desconectar do broker MQTT
app.post('/disconnect', (req, res) => {
    disconnectFromMQTT();
    res.json({ message: 'Desconectado do broker MQTT.' });
});

// Rota para publicar JSON em um tópico MQTT
app.post('/publish', (req, res) => {
    const { topic, message } = req.body;

    if (!isConnected) {
        return res.status(400).json({ error: 'Cliente MQTT não está conectado.' });
    }

    if (!topic || !message) {
        return res.status(400).json({ error: 'Tópico ou mensagem ausente.' });
    }

    try {
        const payload = JSON.stringify(message);  // Converte o objeto JSON em string
        client.publish(topic, payload, { qos: 0 }, (err) => {
            if (err) {
                console.error('Erro ao publicar no tópico:', err.message);
                return res.status(500).json({ error: 'Falha ao publicar no tópico MQTT.' });
            }
            console.log(`Mensagem publicada no tópico ${topic}: ${payload}`);
            res.json({ message: `Publicado no tópico ${topic}` });
        });
    } catch (error) {
        console.error('Erro ao processar o payload JSON:', error.message);
        res.status(500).json({ error: 'Erro ao processar a mensagem JSON.' });
    }
});

// Rota para se inscrever em um tópico MQTT
app.post('/subscribe', (req, res) => {
    const { topic } = req.body;

    if (!isConnected) {
        return res.status(400).json({ error: 'Cliente MQTT não está conectado.' });
    }

    if (!topic) {
        return res.status(400).json({ error: 'Tópico ausente.' });
    }

    if (subscribedTopics.includes(topic)) {
        return res.status(400).json({ error: `Já inscrito no tópico ${topic}.` });
    }

    client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
            console.error('Erro ao se inscrever no tópico:', err.message);
            return res.status(500).json({ error: 'Falha ao se inscrever no tópico MQTT.' });
        }

        subscribedTopics.push(topic);  // Armazena o tópico no array de tópicos inscritos
        console.log(`Inscrito no tópico ${topic}`);
        res.json({ message: `Inscrito no tópico ${topic}` });
    });
});

// Servidor ouvindo na porta 3000
server.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
