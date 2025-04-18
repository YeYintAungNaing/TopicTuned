//import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { GlobalContext } from './context/GlobalContext.tsx'

createRoot(document.getElementById('root')!).render(
  <>
    <GlobalContext>
      <App />
    </GlobalContext>
  </>,
)
