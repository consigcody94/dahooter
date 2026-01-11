import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#f1f5f9',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          borderRadius: '12px',
        },
        success: {
          iconTheme: {
            primary: '#0ea5e9',
            secondary: '#f1f5f9',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#f1f5f9',
          },
        },
      }}
    />
  </React.StrictMode>,
)
