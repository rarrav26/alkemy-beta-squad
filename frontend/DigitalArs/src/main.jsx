import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ElementosGlobalesProvider from './context/ElementosGlobales'
import AuthProvider from './context/AuthProvider'
import NotificacionesProvider from './context/NotificacionesProvider'

// NotificacionesProvider va DEBAJO de AuthProvider, porque necesita la sesión, y POR ENCIMA de
// App, porque la campana vive en el encabezado y el aviso puede llegar en cualquier pantalla.
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ElementosGlobalesProvider>
      <AuthProvider>
        <NotificacionesProvider><App /></NotificacionesProvider>
      </AuthProvider>
    </ElementosGlobalesProvider>
  </BrowserRouter>
)
