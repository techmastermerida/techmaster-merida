import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Login() {
  const [email, setEmail]     = useState('')
  const [pass,  setPass]      = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (err) setError('Usuario o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: '#111111',
        border: '1px solid #2a1010',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 8px 40px rgba(228,28,28,0.15)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="TechMaster Mérida"
            style={{ height: 90, objectFit: 'contain' }}
            onError={e => e.target.style.display = 'none'}
          />
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: '1.4rem',
            fontWeight: 900,
            color: '#e41c1c',
            letterSpacing: '0.05em',
            marginTop: 12,
          }}>
            TECHMASTER
          </div>
          <div style={{
            fontSize: '0.72rem',
            color: '#6b7280',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: 4,
          }}>
            Mérida · Soporte PC
          </div>
        </div>

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>
            Inicia sesión para continuar
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Correo</label>
            <input
              type="email"
              placeholder="usuario@techmaster.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(228,28,28,0.1)',
              border: '1px solid rgba(228,28,28,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#ff4444',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 8, justifyContent: 'center', padding: '12px' }}
          >
            {loading ? 'Entrando…' : '🔐 Iniciar sesión'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.72rem', color: '#6b7280' }}>
          TechMaster Mérida © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
