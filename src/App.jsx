import React, { useEffect, useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { ToastProvider } from './lib/toast.jsx'
import { supabase } from './lib/supabase.js'
import Dashboard    from './pages/Dashboard.jsx'
import Clientes     from './pages/Clientes.jsx'
import Ordenes      from './pages/Ordenes.jsx'
import OrdenDetalle from './pages/OrdenDetalle.jsx'
import Login        from './pages/Login.jsx'

const NAV = [
  { to: '/',         icon: '📊', label: 'Dashboard' },
  { to: '/ordenes',  icon: '🔧', label: 'Órdenes de Servicio' },
  { to: '/clientes', icon: '👥', label: 'Clientes' },
]

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = cargando

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    // Escuchar cambios (login / logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  // Mientras verifica la sesión
  if (session === undefined) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#6b7280', fontFamily: 'DM Sans, sans-serif'
      }}>
        Cargando…
      </div>
    )
  }

  // Sin sesión → Login
  if (!session) return <Login />

  // Con sesión → App completa
  return (
    <ToastProvider>
      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-text">⚡ TechMaster</div>
            <div className="logo-sub">Mérida · Taller</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section">Menú</div>
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="icon">{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              👤 {session.user.email}
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                background: 'rgba(228,28,28,0.1)',
                border: '1px solid rgba(228,28,28,0.25)',
                borderRadius: 8,
                color: '#ff4444',
                padding: '6px 12px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
              }}
            >
              🚪 Cerrar sesión
            </button>
            <span>TechMaster Mérida © {new Date().getFullYear()}</span>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main-content">
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/ordenes"     element={<Ordenes />} />
            <Route path="/ordenes/:id" element={<OrdenDetalle />} />
            <Route path="/clientes"    element={<Clientes />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  )
}
