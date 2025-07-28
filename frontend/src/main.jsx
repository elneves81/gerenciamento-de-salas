import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App-no-auth.jsx'
import './index.css'
import './styles/darkMode.css'

// Verifica se o modo escuro está ativo ao carregar a aplicação
const isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
  document.body.classList.add('dark-mode');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
