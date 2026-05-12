import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { TenantProvider } from './context/TenantContext.tsx'
import { ConfirmationProvider } from './context/ConfirmationContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <TenantProvider>
        <ConfirmationProvider>
          <App />
        </ConfirmationProvider>
      </TenantProvider>
    </AuthProvider>
  </StrictMode>,
)

// trigger build v2
