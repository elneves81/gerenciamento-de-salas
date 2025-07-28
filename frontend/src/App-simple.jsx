import React from 'react';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        background: 'rgba(255,255,255,0.1)',
        padding: '40px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ fontSize: '3em', marginBottom: '20px' }}>🎉 SalaFácil v2.0</h1>
        <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>Sistema de Gerenciamento de Salas</p>
        <div style={{
          background: '#4CAF50',
          padding: '10px 20px',
          borderRadius: '25px',
          display: 'inline-block',
          fontWeight: 'bold'
        }}>
          ✅ REACT APP FUNCIONANDO
        </div>
        <br /><br />
        <p>
          <strong>Data:</strong> {new Date().toLocaleString('pt-BR')}<br />
          <strong>Status:</strong> Conectado e Operacional
        </p>
      </div>
    </div>
  );
}

export default App;
