import io from 'socket.io-client';

export const initializeSocket = () => {
  const socket = io(process.env.REACT_APP_API_URL);

  socket.on('mqtt-message', (message) => {
    console.log('Mensagem MQTT recebida: ', message);
  });

  return socket;
};
