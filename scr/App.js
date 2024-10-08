import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { connectToBroker } from './services/api';
import { initializeSocket } from './utils/socket';
import Form from './components/Form';

const App = () => {
  const [endpoint, setEndpoint] = useState('');
  const [keyFile, setKeyFile] = useState('');
  const [certFile, setCertFile] = useState('');
  const [caFile, setCaFile] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const socket = initializeSocket();

    return () => socket.disconnect();
  }, []);

  const handleConnect = async () => {
    if (!endpoint || !keyFile || !certFile || !caFile) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const response = await connectToBroker({ endpoint, keyFile, certFile, caFile });
      toast.success(response.data.message);
    } catch (error) {
      toast.error(`Erro ao conectar: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Conectar ao Broker MQTT</h1>
      <Form
        endpoint={endpoint}
        keyFile={keyFile}
        certFile={certFile}
        caFile={caFile}
        setEndpoint={setEndpoint}
        setKeyFile={setKeyFile}
        setCertFile={setCertFile}
        setCaFile={setCaFile}
        connectToBroker={handleConnect}
        loading={loading}
      />
      <ToastContainer />
    </div>
  );
};

export default App;
