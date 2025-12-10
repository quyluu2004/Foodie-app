import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'animate.css'
import 'hover.css/css/hover-min.css'
import './index.css'
import './adminAnimations.css'
import App from './App.jsx'
import { DarkModeProvider } from './contexts/DarkModeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DarkModeProvider>
      <App />
    </DarkModeProvider>
  </StrictMode>,
)
