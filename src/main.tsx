import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ThreeJSRecorder from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThreeJSRecorder />
  </StrictMode>,
)
