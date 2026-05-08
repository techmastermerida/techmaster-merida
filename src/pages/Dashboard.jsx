import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useNavigate } from 'react-router-dom'

const ESTADOS = ['Recibido','Diagnóstico','En proceso','Listo','Entregado','Cancelado']
const COLORS   = ['#64748b','#fbbf24','#e41c1c','#22c55e','#4ade80','#ef4444']

export default function Dashboard() {
  const [counts, setCounts]       = useState({})
  const [recent, setRecent]       = useState([])
  const [loading, setLoading]     = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const [{ data: ords }, { data: recs }] = await Promise.all([
        supabase.from('ordenes').select('estado'),
        supabase.from('ordenes')
          .select('id,folio,estado,fecha_ingreso,clientes(nombre),equipos(tipo,marca)')
          .order('created_at', { ascending: false })
          .limit(8),
      ])
      const c = {}
      ESTADOS.forEach(e => c[e] = 0)
      ords?.forEach(o => { if (c[o.estado] !== undefined) c[o.estado]++ })
      setCounts(c)
      setRecent(recs || [])
      setLoading(false)
    }
    load()
  }, [])

  const total = Object.values(counts).reduce((a,b) => a+b, 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">⚡ <span>Dashboard</span></h1>
        <button className="btn btn-primary" onClick={() => navigate('/ordenes?nueva=1')}>
          + Nueva Orden
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--accent': '#e41c1c' }}>
          <div className="stat-label">Total órdenes</div>
          <div className="stat-val">{total}</div>
          <div className="stat-desc">En el sistema</div>
        </div>
        {ESTADOS.slice(0,5).map((e,i) => (
          <div key={e} className="stat-card" style={{ '--accent': COLORS[i] }}>
            <div className="stat-label">{e}</div>
            <div className="stat-val">{counts[e] ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div className="card">
        <div className="section-title">Últimas órdenes</div>
        {loading ? <p style={{color:'var(--brand-muted)'}}>Cargando…</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Equipo</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign:'center',color:'var(--brand-muted)',padding:'32px'}}>Sin órdenes aún</td></tr>
                ) : recent.map(o => (
                  <tr key={o.id} onClick={() => navigate(`/ordenes/${o.id}`)}>
                    <td><code style={{color:'var(--brand-blue)',fontSize:'.82rem'}}>{o.folio}</code></td>
                    <td>{o.clientes?.nombre}</td>
                    <td style={{color:'var(--brand-muted)'}}>{o.equipos?.marca} {o.equipos?.tipo}</td>
                    <td style={{color:'var(--brand-muted)',fontSize:'.82rem'}}>{o.fecha_ingreso}</td>
                    <td><StatusBadge estado={o.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export function StatusBadge({ estado }) {
  const map = {
    'Recibido':   'recibido',
    'Diagnóstico':'diagnostico',
    'En proceso': 'proceso',
    'Listo':      'listo',
    'Entregado':  'entregado',
    'Cancelado':  'cancelado',
  }
  return <span className={`badge badge-${map[estado] || 'recibido'}`}>{estado}</span>
}
