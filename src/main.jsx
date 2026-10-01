import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

// ============================================
// POINT D'ENTRÉE DE L'APPLICATION
// ============================================

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#2d3748',
            border: '1px solid #e2e8f0',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)