import { io } from "https://cdn.socket.io/4.7.1/socket.io.esm.min.js";

const mainHome = document.querySelector(".main_home");
const logo = document.querySelector(".logo");
const voltar = document.querySelector(".span_voltar");
const mainForm = document.querySelector(".main_form");

let socket;
let statusEl;
let user = document.getElementById('user');
let token = document.getElementById('token');

//Função que renderiza o Form
window.mostrarForm = function (projeto) {
    if (!document.querySelector(".main_form")) {
        const mainForm = document.createElement("main");
        mainForm.classList.add("main_form", "display_block");

        mainForm.innerHTML = `
            <form class="main_form_container">
                <h2>${projeto.nome}</h2>

                <label for="user">Nome:</label>
                <input required type="text" id="user" placeholder="Digite seu nome">

                <label for="token">Token (4 dígitos):</label>
                <input required type="password" id="token" maxlength="4" placeholder="Digite seu token">

                
                <div class="linha_btn">
                ${projeto.payload1 ? `<button id="btnAcao1" class="btn_acao" disabled>${projeto.payload1.acao}</button>` : ""}
                ${projeto.payload2 ? `<button id="btnAcao2" class="btn_acao" disabled>${projeto.payload2.acao}</button>` : ""}
                ${projeto.payload3 ? `<button id="btnAcao3" class="btn_acao" disabled>${projeto.payload3.acao}</button>` : ""}
                ${projeto.payload4 ? `<button id="btnAcao4" class="btn_acao" disabled>${projeto.payload4.acao}</button>` : ""}
                </div>
                
                <p id="status"></p>
                </form>
                `;
        // <button id="connectBtn" onclick="conectarBroker(${projeto})">Conectar</button>

        const footer = document.querySelector("footer");
        document.body.insertBefore(mainForm, footer);

        const userInput = document.getElementById("user");
        const tokenInput = document.getElementById("token");
        const buttons = document.querySelectorAll(".btn_acao");

        function validarCampos() {
            const userValido = userInput.value.trim() !== "";
            const tokenValido = tokenInput.value.length === 4;

            buttons.forEach((btn) => {
                btn.disabled = !(userValido && tokenValido);
            });
        }

        userInput.addEventListener("input", validarCampos);
        tokenInput.addEventListener("input", validarCampos);

        if (projeto.payload1)
            document.getElementById("btnAcao1").addEventListener("click", () => publicar(projeto, projeto.payload1));

        if (projeto.payload2)
            document.getElementById("btnAcao2").addEventListener("click", () => publicar(projeto, projeto.payload2));

        if (projeto.payload3)
            document.getElementById("btnAcao3").addEventListener("click", () => publicar(projeto, projeto.payload3));

        if (projeto.payload4)
            document.getElementById("btnAcao4").addEventListener("click", () => publicar(projeto, projeto.payload4));

    }

    mainHome.classList.remove("display_block");
    logo.classList.remove("display_flex");
    voltar.classList.remove("display_none");

    mainHome.classList.add("display_none");
    logo.classList.add("display_none");
    voltar.classList.add("display_block");

    conectarBroker(projeto);

};

//Função que desconecta e limpa o socket
function desconectarBroker() {
    if (socket) {
        socket.disconnect();
        console.log("Desconectado do broker.");
        socket = null;
    }
}

//Função que renderiza a Home
window.mostrarHome = function () {
    desconectarBroker();

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

// Função para conectar ao broker do projeto selecionado
function conectarBroker(projeto) {
    statusEl = document.getElementById('status');

    return fetch(projeto.linkConnect, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            endpoint: projeto.endPoint,
            keyFile: projeto.keyFile,
            certFile: projeto.certFile,
            caFile: projeto.caFile
        })
    }).then(response => response.json())
        .then(data => {
            statusEl.innerText = "Conectado ao Broker!";
            console.log(data);
            
            configurarSocket(projeto);
        }).catch(error => {
            console.error('Erro ao conectar:', error);
            statusEl.innerText = "Erro ao conectar ao Broker.";
        });
}

// Função para publicar no tópico
window.publicar = function (projeto) {
    console.log('entrou pub');
    
    const userInput = document.getElementById('user').value.trim();
    const tokenInput = document.getElementById('token').value.trim();

    if (!userInput || tokenInput.length !== 4) {
        alert("Preencha todos os campos corretamente!");
        return;
    }

    const mensagem = {
        user: userInput,
        token: tokenInput,
        [projeto.payload1.atributo]: projeto.payload1.valor
    };

    fetch(projeto.linkPublish, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            topic: projeto.topico,
            message: mensagem
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // statusEl.innerHTML = 'Mensagem publicada no tópico!';
        })
        .catch(error => {
            console.error('Erro ao publicar:', error);
            // statusEl.innerHTML = 'Erro ao publicar no tópico.';
        });
};


// Função para configurar o Socket.IO e ouvir as mensagens
function configurarSocket(projeto) {
    socket = io(projeto.link);

    socket.on('mqtt_message', (msg) => {
        console.log('Mensagem recebida via WebSocket:', msg);

        try {
            const message = JSON.parse(msg.message);

            statusEl = document.getElementById('status');
            statusEl.innerText = `Mensagem recebida: ${JSON.stringify(message)}`;
        } catch (error) {
            console.error("Erro ao processar mensagem recebida:", error);
        }
    });
}