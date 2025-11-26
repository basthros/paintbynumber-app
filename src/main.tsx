import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import PWA elements for Capacitor Camera API
import { defineCustomElements } from '@ionic/pwa-elements/loader'

// Define custom elements for camera functionality
defineCustomElements(window)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
