import React from 'react';

const Form = ({ endpoint, keyFile, certFile, caFile, setEndpoint, setKeyFile, setCertFile, setCaFile, connectToBroker, loading }) => (
  <div>
    <div>
      <label>Endpoint: </label>
      <input type="text" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
    </div>
    <div>
      <label>Key File: </label>
      <input type="text" value={keyFile} onChange={(e) => setKeyFile(e.target.value)} />
    </div>
    <div>
      <label>Cert File: </label>
      <input type="text" value={certFile} onChange={(e) => setCertFile(e.target.value)} />
    </div>
    <div>
      <label>CA File: </label>
      <input type="text" value={caFile} onChange={(e) => setCaFile(e.target.value)} />
    </div>
    <button onClick={connectToBroker} disabled={loading}>
      {loading ? 'Conectando...' : 'Conectar'}
    </button>
  </div>
);

export default Form;
