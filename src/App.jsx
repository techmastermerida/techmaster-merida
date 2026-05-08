import React from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { ToastProvider } from './lib/toast.jsx'
import Dashboard   from './pages/Dashboard.jsx'
import Clientes    from './pages/Clientes.jsx'
import Ordenes     from './pages/Ordenes.jsx'
import OrdenDetalle from './pages/OrdenDetalle.jsx'

const NAV = [
  { to: '/',         icon: '📊', label: 'Dashboard' },
  { to: '/ordenes',  icon: '🔧', label: 'Órdenes de Servicio' },
  { to: '/clientes', icon: '👥', label: 'Clientes' },
]

export default function App() {
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
          <div className="sidebar-footer">
            TechMaster Mérida © {new Date().getFullYear()}
          </div>
        </aside>

        {/* MAIN */}
        <main className="main-content">
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/ordenes"       element={<Ordenes />} />
            <Route path="/ordenes/:id"   element={<OrdenDetalle />} />
            <Route path="/clientes"      element={<Clientes />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  )
}
