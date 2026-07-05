import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'

// #292 — single auth gate. App.jsx owns ALL auth (Google login, ALLOWED_EMAILS, #244 daily re-login).
// main.jsx only provides the OAuth context + mounts App. The old AuthWrapper here was a second, diverging
// gate (stored kc_user without a _loginDate stamp) that App.jsx then rejected → double login on first sign-in.
const CLIENT_ID = "525212845492-jrkm4drtekb8fccnkgbfitlrqkqv3p0n.apps.googleusercontent.com"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
)
