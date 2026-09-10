import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ElementosGlobalesProvider from './context/ElementosGlobales'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ElementosGlobalesProvider>
      <App />
    </ElementosGlobalesProvider>
  </BrowserRouter>
)
