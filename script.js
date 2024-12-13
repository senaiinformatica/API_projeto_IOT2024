import { io } from "https://cdn.socket.io/4.7.1/socket.io.esm.min.js";

const mainHome = document.querySelector(".main_home");
const logo = document.querySelector(".logo");
const voltar = document.querySelector(".span_voltar");
const mainForm = document.querySelector(".main_form");

// function mostrarForm() {
//     mainHome.classList.remove("display_block");
//     logo.classList.remove("display_flex");
//     voltar.classList.remove("display_none");
//     mainForm.classList.remove("display_none");

//     mainHome.classList.add("display_none");
//     logo.classList.add("display_none");
//     voltar.classList.add("display_block");
//     mainForm.classList.add("display_block");
// }

window.mostrarForm = function (projeto) {
    if (!document.querySelector(".main_form")) {
        const mainForm = document.createElement("main");
        mainForm.classList.add("main_form", "display_block");

        mainForm.innerHTML = `
            <form class="main_form_container">
                <h2>MQTT Connection</h2>

                <label for="user">Nome:</label>
                <input required type="text" id="user" placeholder="Digite seu nome">

                <label for="token">Token (4 dígitos):</label>
                <input required type="password" id="token" maxlength="4" placeholder="Digite seu token">

                <button id="connectBtn" onclick="conectar(event)">Conectar</button>

                <div class="linha_btn">
                    ${projeto.payload1 ? `<button onclick="publicar(${projeto.topic})" id="btnAcao1" class="btn_acao" disabled>${projeto.payload1.acao}</button>` : ""}
                    ${projeto.payload2 ? `<button onclick="publicar(${projeto.topic})" id="btnAcao1" class="btn_acao" disabled>${projeto.payload2.acao}</button>` : ""}
                    ${projeto.payload3 ? `<button onclick="publicar(${projeto.topic})" id="btnAcao1" class="btn_acao" disabled>${projeto.payload3.acao}</button>` : ""}
                    ${projeto.payload4 ? `<button onclick="publicar(${projeto.topic})" id="btnAcao1" class="btn_acao" disabled>${projeto.payload4.acao}</button>` : ""}

                </div>

                <p id="status"></p>
            </form>
        `;

        const footer = document.querySelector("footer");
        document.body.insertBefore(mainForm, footer);
    }

    mainHome.classList.remove("display_block");
    logo.classList.remove("display_flex");
    voltar.classList.remove("display_none");

    mainHome.classList.add("display_none");
    logo.classList.add("display_none");
    voltar.classList.add("display_block");
};


window.mostrarHome = function () {
    const mainForm = document.querySelector(".main_form");

    if (mainForm) {
        mainForm.remove();
    }

    mainHome.classList.remove("display_none");
    logo.classList.remove("display_none");
    voltar.classList.remove("display_block");

    mainHome.classList.add("display_block");
    logo.classList.add("display_flex");
    voltar.classList.add("display_none");
};


let isConnected = false;
// let socket;

// Função para conectar ao broker
function conectarBroker() {
    const statusEl = document.getElementById('status');
    const user = document.getElementById('user').value;
    const token = document.getElementById('token').value;

    if (user === '' || token === '') {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    return fetch('http://projetomqttsenai.ddns.net:3000/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            endpoint: 'a3bm9b3szpp5y6-ats.iot.us-east-1.amazonaws.com', // Substitua com seu endpoint MQTT
            keyFile: 'private.pem.key',  // Ajuste conforme seus arquivos
            certFile: 'certificate.pem.crt',
            caFile: 'AmazonRootCA1.pem'
        })
    }).then(response => response.json())
      .then(data => {
          statusEl.innerText = "Conectado ao Broker!";
          return true; // Conexão bem-sucedida
      }).catch(error => {
          console.error('Erro ao conectar:', error);
          statusEl.innerText = "Erro ao conectar ao Broker.";
          return false; // Falha na conexão
      });
}

// Função para habilitar botões e inscrever no tópico
function publicarTopico() {
    const publishBtn = document.querySelectorAll('.btn_acao');
    publishBtn.forEach(b => {
        b.disabled = false; // Habilita os botões
    });

    const statusEl = document.getElementById('status');
    statusEl.innerText = "Inscrito no tópico!";
}

// Função principal que organiza o fluxo
window.conectar = async function (event) {
    event.preventDefault();

    const isConnected = await conectarBroker();
    if (isConnected) {
        publicarTopico();
    }
};


window.publicar = function (json) {
    const user = document.getElementById('user').value;
    const token = document.getElementById('token').value;

    if (!isConnected) {
        alert("Por favor, conecte-se primeiro.");
        return;
    }

    const payload = {
        user: user,
        token: token,
        LedStatus: "2"
    };

    // Publica a mensagem no tópico
    fetch('http://projetomqttsenai.ddns.net:3000/publish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            topic: 'meuTopico/mqtt',  // Substitua com seu tópico
            message: payload
        })
    }).then(response => response.json())
        .then(data => {
            console.log('Publicado com sucesso:', data);
            alert('Mensagem publicada no tópico!');
        }).catch(error => {
            console.error('Erro ao publicar:', error);
            alert('Erro ao publicar no tópico.');
        });

}

window.addEventListener = function () {
    // try {
        // Inicializa o Socket.IO e começa a escutar as mensagens
        // socket = io('http://projetomqttsenai.ddns.net:3000');
        // socket.on('mqtt_message', (msg) => {
        //     console.log('Mensagem recebida via WebSocket:', msg);
        //     const message = JSON.parse(msg.message);
    
        //     // Verifica a chave StatusLed no JSON recebido
        //     try {
        //         const message = JSON.parse(msg.message);  // Certifique-se de que a mensagem seja um JSON válido
    
        //         // Verifica a chave StatusLed no JSON recebido
        //         if (message.StatusLed === true) {
        //             publishBtn.classList.remove('red');
        //             publishBtn.classList.add('green');
        //             publishBtn.innerText = 'Led Ligado';
        //         } else if (message.StatusLed === false) {
        //             publishBtn.classList.remove('green');
        //             publishBtn.classList.add('red');
        //             publishBtn.innerText = 'Led Desligado';
        //         }
        //     } catch (error) {
        //         console.error("Erro ao processar mensagem recebida:", error);
        //     }
        // });
    // } catch (error) {
    //     console.log(error);
    // }
}