import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');

  useEffect(() => {
    fetch('http://localhost:5000')
      .then((res) => res.text())
      .then((data) => setBackendStatus('✅ Backend Connected!'))
      .catch((err) => {
        console.error(err);
        setBackendStatus('❌ Backend not connected');
      });
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Frontend (React + Vite) is Running 🚀</h1>
      <h2>Backend Status: {backendStatus}</h2>
    </div>
  );
}

export default App;
