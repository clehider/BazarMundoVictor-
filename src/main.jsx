import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { initializeDatabase } from './firebase/init-db'

// Inicializar la base de datos
initializeDatabase().catch(console.error);

// Configuración de desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('Modo desarrollo activado');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
