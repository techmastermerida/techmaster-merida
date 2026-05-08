import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useToast } from '../lib/toast.jsx'
import { StatusBadge } from './Dashboard.jsx'

const ESTADOS = ['Recibido','Diagnóstico','En proceso','Listo','Entregado','Cancelado']

export default function OrdenDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast    = useToast()

  const [orden,    setOrden]    = useState(null)
  const [historial,setHistorial]= useState([])
  const [partidas, setPartidas] = useState([])
  const [loading,  setLoading]  = useState(true)

  const [editServicio, setEditServicio] = useState(false)
  const [descServicio, setDescServicio] = useState('')
  const [editEstado,   setEditEstado]   = useState(false)
  const [nuevoEstado,  setNuevoEstado]  = useState('')
  const [notaEstado,   setNotaEstado]   = useState('')

  const [editPartidas, setEditPartidas] = useState(false)
  const [items, setItems] = useState([])

  const load = async () => {
    const [{ data: o }, { data: h }, { data: p }] = await Promise.all([
      supabase.from('ordenes').select(`
        *,
        clientes(id,nombre,telefono,email,direccion),
        equipos(id,tipo,marca,modelo,serie,color,descripcion)
      `).eq('id', id).single(),
      supabase.from('historial').select('*').eq('orden_id', id).order('created_at'),
      supabase.from('partidas').select('*').eq('orden_id', id).order('id'),
    ])
    setOrden(o)
    setHistorial(h || [])
    setPartidas(p || [])
    setDescServicio(o?.descripcion_servicio || '')
    setNuevoEstado(o?.estado || 'Recibido')
    setItems(p?.length ? p.map(x => ({ ...x })) : [{ concepto:'', cantidad:1, precio_unit:0 }])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const saveServicio = async () => {
    await supabase.from('ordenes').update({ descripcion_servicio: descServicio }).eq('id', id)
    toast('Descripción guardada ✓','success')
    setEditServicio(false)
    load()
  }

  const saveEstado = async () => {
    await supabase.from('ordenes').update({ estado: nuevoEstado }).eq('id', id)
    if (notaEstado.trim()) {
      await supabase.from('historial').insert({ orden_id: id, estado: nuevoEstado, nota: notaEstado })
    }
    toast('Estado actualizado ✓','success')
    setEditEstado(false)
    setNotaEstado('')
    load()
  }

  const savePartidas = async () => {
    const validas = items.filter(i => i.concepto.trim())
    await supabase.from('partidas').delete().eq('orden_id', id)
    if (validas.length) {
      await supabase.from('partidas').insert(
        validas.map(({ concepto, cantidad, precio_unit }) => ({
          orden_id: id, concepto,
          cantidad: parseFloat(cantidad) || 1,
          precio_unit: parseFloat(precio_unit) || 0,
        }))
      )
    }
    toast('Partidas guardadas ✓','success')
    setEditPartidas(false)
    load()
  }

  const addItem    = () => setItems(x => [...x, { concepto:'', cantidad:1, precio_unit:0 }])
  const removeItem = (i) => setItems(x => x.filter((_,j) => j !== i))
  const updateItem = (i, k, v) => setItems(x => x.map((row,j) => j===i ? {...row,[k]:v} : row))

  const total = partidas.reduce((s,p) => s + (p.cantidad * p.precio_unit), 0)

  const printNota = () => {
    const win = window.open('', '_blank', 'width=800,height=900')
    win.document.write(buildNotaHTML(orden, partidas, total))
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  if (loading) return <div style={{padding:40,color:'var(--brand-muted)'}}>Cargando…</div>
  if (!orden)  return <div style={{padding:40,color:'var(--brand-danger)'}}>Orden no encontrada</div>

  const { clientes: cl, equipos: eq } = orden

  return (
    <div>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/ordenes')}>← Volver</button>
          <h1 className="page-title" style={{fontSize:'1.2rem'}}>
            🔧 Orden <span>{orden.folio}</span>
          </h1>
          <StatusBadge estado={orden.estado} />
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditEstado(true)}>📋 Cambiar estado</button>
          <button className="btn btn-primary btn-sm no-print" onClick={printNota}>🖨️ Nota de Servicio</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <div className="card card-sm">
          <div className="section-title">👤 Cliente</div>
          <InfoRow label="Nombre"    val={cl?.nombre} />
          <InfoRow label="Teléfono"  val={cl?.telefono} />
          <InfoRow label="Email"     val={cl?.email} />
          <InfoRow label="Dirección" val={cl?.direccion} />
        </div>
        <div className="card card-sm">
          <div className="section-title">🖥️ Equipo</div>
          <InfoRow label="Tipo"   val={eq?.tipo} />
          <InfoRow label="Marca"  val={eq?.marca} />
          <InfoRow label="Modelo" val={eq?.modelo} />
          <InfoRow label="Serie"  val={eq?.serie} />
          <InfoRow label="Color"  val={eq?.color} />
          {eq?.descripcion && <InfoRow label="Estado al recibir" val={eq.descripcion} />}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <div className="card card-sm">
          <div className="section-title">⚠️ Problema reportado por cliente</div>
          <p style={{fontSize:'.9rem',color:'var(--brand-text)',lineHeight:1.6}}>
            {orden.descripcion_problema || <em style={{color:'var(--brand-muted)'}}>Sin descripción</em>}
          </p>
          {orden.observaciones && (
            <p style={{fontSize:'.82rem',color:'var(--brand-muted)',marginTop:8}}>{orden.observaciones}</p>
          )}
        </div>

        <div className="card card-sm">
          <div className="section-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>🛠️ Servicio realizado</span>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDescServicio(orden.descripcion_servicio||''); setEditServicio(true) }}>
              ✏️ Editar
            </button>
          </div>
          {editServicio ? (
            <div>
              <textarea
                style={{width:'100%',background:'var(--brand-dark3)',border:'1px solid var(--brand-border)',borderRadius:'var(--radius)',color:'var(--brand-text)',padding:'10px',fontFamily:'DM Sans,sans-serif',fontSize:'.9rem',minHeight:120,outline:'none'}}
                value={descServicio}
                onChange={e => setDescServicio(e.target.value)}
                placeholder="Describe detalladamente el servicio realizado…"
              />
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditServicio(false)}>Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={saveServicio}>💾 Guardar</button>
              </div>
            </div>
          ) : (
            <p style={{fontSize:'.9rem',color:'var(--brand-text)',lineHeight:1.6}}>
              {orden.descripcion_servicio || <em style={{color:'var(--brand-muted)'}}>Aún no se captura el servicio realizado.</em>}
            </p>
          )}
        </div>
      </div>

      {/* Partidas */}
      <div className="card" style={{marginBottom:20}}>
        <div className="section-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>💰 Conceptos de Cobro</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { setItems(partidas.length ? partidas.map(x=>({...x})) : [{concepto:'',cantidad:1,precio_unit:0}]); setEditPartidas(true) }}>
            ✏️ Editar partidas
          </button>
        </div>

        {editPartidas ? (
          <div>
            <table className="partidas-table" style={{marginBottom:12}}>
              <thead><tr><th>Concepto</th><th style={{width:80}}>Cant.</th><th style={{width:120}}>Precio unit.</th><th style={{width:40}}></th></tr></thead>
              <tbody>
                {items.map((item,i) => (
                  <tr key={i}>
                    <td><input style={{width:'100%',background:'var(--brand-dark3)',border:'1px solid var(--brand-border)',borderRadius:6,padding:'6px 10px',color:'var(--brand-text)',fontFamily:'DM Sans,sans-serif'}} value={item.concepto} onChange={e => updateItem(i,'concepto',e.target.value)} placeholder="Ej. Limpieza interna…" /></td>
                    <td><input type="number" style={{width:'100%',background:'var(--brand-dark3)',border:'1px solid var(--brand-border)',borderRadius:6,padding:'6px 10px',color:'var(--brand-text)',fontFamily:'DM Sans,sans-serif'}} value={item.cantidad} onChange={e => updateItem(i,'cantidad',e.target.value)} min={1} /></td>
                    <td><input type="number" style={{width:'100%',background:'var(--brand-dark3)',border:'1px solid var(--brand-border)',borderRadius:6,padding:'6px 10px',color:'var(--brand-text)',fontFamily:'DM Sans,sans-serif'}} value={item.precio_unit} onChange={e => updateItem(i,'precio_unit',e.target.value)} min={0} /></td>
                    <td><button className="btn btn-danger btn-sm btn-icon" onClick={() => removeItem(i)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Agregar línea</button>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditPartidas(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={savePartidas}>💾 Guardar cobro</button>
            </div>
          </div>
        ) : (
          partidas.length === 0
            ? <p style={{color:'var(--brand-muted)',fontSize:'.88rem'}}>Sin conceptos de cobro registrados.</p>
            : (
              <table className="partidas-table">
                <thead><tr><th>Concepto</th><th style={{textAlign:'right'}}>Cant.</th><th style={{textAlign:'right'}}>Precio unit.</th><th style={{textAlign:'right'}}>Subtotal</th></tr></thead>
                <tbody>
                  {partidas.map(p => (
                    <tr key={p.id} className="item-row">
                      <td>{p.concepto}</td>
                      <td style={{textAlign:'right'}}>{p.cantidad}</td>
                      <td style={{textAlign:'right'}}>${Number(p.precio_unit).toFixed(2)}</td>
                      <td style={{textAlign:'right'}}>${(p.cantidad*p.precio_unit).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={3} style={{textAlign:'right'}}>TOTAL</td>
                    <td style={{textAlign:'right'}}>${total.toFixed(2)} MXN</td>
                  </tr>
                </tbody>
              </table>
            )
        )}
      </div>

      {/* Historial */}
      <div className="card">
        <div className="section-title">📜 Historial de la Orden</div>
        {historial.length === 0
          ? <p style={{color:'var(--brand-muted)',fontSize:'.88rem'}}>Sin historial</p>
          : (
            <div className="timeline">
              {historial.map((h,i) => (
                <div key={h.id} className="tl-item">
                  <div style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center'}}>
                    <div className="tl-dot"></div>
                    {i < historial.length-1 && <div className="tl-line"></div>}
                  </div>
                  <div className="tl-body">
                    <div className="tl-estado">{h.estado}</div>
                    {h.nota && <div className="tl-nota">{h.nota}</div>}
                    <div className="tl-fecha">{new Date(h.created_at).toLocaleString('es-MX')}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Modal cambiar estado */}
      {editEstado && (
        <div className="modal-backdrop" onClick={() => setEditEstado(false)}>
          <div className="modal" style={{maxWidth:420}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📋 Cambiar Estado</div>
              <button className="modal-close" onClick={() => setEditEstado(false)}>×</button>
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Nuevo estado</label>
                <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
                  {ESTADOS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Nota (opcional)</label>
                <textarea value={notaEstado} onChange={e => setNotaEstado(e.target.value)} placeholder="Ej. Se esperan refacciones…" rows={3} style={{minHeight:70}} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditEstado(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveEstado}>✅ Actualizar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, val }) {
  return (
    <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'flex-start'}}>
      <span style={{fontSize:'.72rem',fontWeight:600,color:'var(--brand-muted)',textTransform:'uppercase',letterSpacing:'.08em',minWidth:90,paddingTop:2}}>{label}</span>
      <span style={{fontSize:'.9rem',color: val ? 'var(--brand-text)' : 'var(--brand-muted)'}}>{val || '—'}</span>
    </div>
  )
}

// ── Nota de Servicio imprimible con branding TechMaster ──────────────────────
function buildNotaHTML(orden, partidas, total) {
  const cl = orden.clientes
  const eq = orden.equipos
  const items = partidas.map(p => `
    <tr>
      <td>${p.concepto}</td>
      <td style="text-align:center">${p.cantidad}</td>
      <td style="text-align:right">$${Number(p.precio_unit).toFixed(2)}</td>
      <td style="text-align:right">$${(p.cantidad * p.precio_unit).toFixed(2)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Nota de Servicio ${orden.folio}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&family=Orbitron:wght@700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 28px; }

  /* ── ENCABEZADO ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #111;
    border-radius: 12px;
    padding: 18px 24px;
    margin-bottom: 20px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  /* Hexágono SVG inline como logo placeholder */
  .logo-icon {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
  }
  .brand-text {
    display: flex;
    flex-direction: column;
  }
  .brand-name {
    font-family: 'Orbitron', monospace;
    font-size: 20px;
    font-weight: 900;
    letter-spacing: .04em;
    line-height: 1;
  }
  .brand-name .tech { color: #fff; }
  .brand-name .master { color: #e41c1c; }
  .brand-sub {
    font-size: 9px;
    color: #888;
    letter-spacing: .18em;
    text-transform: uppercase;
    margin-top: 4px;
  }
  .brand-tagline {
    font-size: 10px;
    color: #aaa;
    margin-top: 6px;
    border-top: 1px solid #2a2a2a;
    padding-top: 5px;
  }

  /* Folio box */
  .folio-box {
    text-align: right;
  }
  .nota-label {
    font-size: 9px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: .15em;
    margin-bottom: 4px;
  }
  .folio-num {
    font-family: 'Orbitron', monospace;
    font-size: 22px;
    font-weight: 900;
    color: #e41c1c;
    letter-spacing: .05em;
  }
  .folio-meta {
    font-size: 10px;
    color: #aaa;
    margin-top: 6px;
    line-height: 1.7;
  }
  .estado-badge {
    display: inline-block;
    background: #e41c1c;
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .12em;
    padding: 3px 10px;
    border-radius: 20px;
    margin-top: 6px;
  }

  /* ── FRANJA ROJA ── */
  .red-bar {
    height: 3px;
    background: linear-gradient(90deg, #e41c1c, #ff4444, #e41c1c);
    border-radius: 2px;
    margin-bottom: 18px;
  }

  /* ── SECCIONES ── */
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .section {
    background: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 12px 14px;
  }
  .section h3 {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .15em;
    color: #e41c1c;
    margin-bottom: 8px;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  }
  .row { display: flex; gap: 6px; margin-bottom: 5px; align-items: flex-start; }
  .row .lbl { font-size: 9px; font-weight: 700; color: #999; text-transform: uppercase; min-width: 72px; padding-top: 1px; }
  .row .val { font-size: 11px; color: #111; flex: 1; }

  /* ── DESCRIPCIONES ── */
  .desc-box {
    background: #f9f9f9;
    border: 1px solid #eee;
    border-left: 3px solid #e41c1c;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 14px;
  }
  .desc-box h3 {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .15em;
    color: #e41c1c;
    margin-bottom: 6px;
  }
  .desc-box p { font-size: 11px; color: #333; line-height: 1.65; }

  /* ── TABLA COBROS ── */
  .cobros-section {
    background: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 14px;
  }
  .cobros-section h3 {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .15em;
    color: #e41c1c;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    background: #e41c1c;
    color: #fff;
    padding: 7px 10px;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: .1em;
    font-weight: 700;
  }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
  tbody tr:last-child td { border-bottom: none; }
  .total-row td {
    font-weight: 700;
    font-size: 13px;
    color: #e41c1c;
    background: #fff0f0;
    padding: 10px;
    border-top: 2px solid #e41c1c;
  }

  /* ── FIRMA ── */
  .firma-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 24px;
    margin-bottom: 20px;
  }
  .firma-box {
    border-top: 1px solid #ccc;
    padding-top: 8px;
    text-align: center;
    font-size: 9px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: .1em;
  }

  /* ── FOOTER ── */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #eee;
    padding-top: 10px;
    font-size: 9px;
    color: #aaa;
  }
  .footer .fb { color: #e41c1c; font-weight: 700; }

  @media print { body { padding: 14px; } }
</style>
</head>
<body>

<!-- ENCABEZADO -->
<div class="header">
  <div class="brand">
    <!-- Logo SVG TechMaster (hexágono + T) -->
    <svg class="logo-icon" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="28,2 52,15 52,41 28,54 4,41 4,15" fill="#e41c1c" opacity=".15"/>
      <polygon points="28,6 49,17.5 49,38.5 28,50 7,38.5 7,17.5" fill="none" stroke="#e41c1c" stroke-width="1.5"/>
      <text x="28" y="36" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="22" font-weight="900" fill="#e41c1c">T</text>
      <!-- circuito decorativo -->
      <circle cx="46" cy="24" r="2" fill="#e41c1c" opacity=".7"/>
      <circle cx="46" cy="32" r="2" fill="#e41c1c" opacity=".7"/>
      <line x1="44" y1="24" x2="40" y2="24" stroke="#e41c1c" stroke-width="1" opacity=".5"/>
      <line x1="44" y1="32" x2="40" y2="32" stroke="#e41c1c" stroke-width="1" opacity=".5"/>
    </svg>
    <div class="brand-text">
      <div class="brand-name">
        <span class="tech">TECH</span><span class="master">MASTER</span>
      </div>
      <div class="brand-sub">— Mérida · Soporte PC —</div>
      <div class="brand-tagline">Eliminación de virus · Formateo · Instalación · Optimización</div>
    </div>
  </div>
  <div class="folio-box">
    <div class="nota-label">Nota de Servicio</div>
    <div class="folio-num">${orden.folio}</div>
    <div class="folio-meta">
      Ingreso: ${orden.fecha_ingreso}<br>
      ${orden.fecha_entrega ? `Entrega: ${orden.fecha_entrega}<br>` : ''}
    </div>
    <div class="estado-badge">${orden.estado}</div>
  </div>
</div>

<div class="red-bar"></div>

<!-- CLIENTE Y EQUIPO -->
<div class="grid2">
  <div class="section">
    <h3>👤 Datos del Cliente</h3>
    <div class="row"><div class="lbl">Nombre</div><div class="val">${cl?.nombre || '—'}</div></div>
    <div class="row"><div class="lbl">Teléfono</div><div class="val">${cl?.telefono || '—'}</div></div>
    <div class="row"><div class="lbl">Email</div><div class="val">${cl?.email || '—'}</div></div>
    <div class="row"><div class="lbl">Dirección</div><div class="val">${cl?.direccion || '—'}</div></div>
  </div>
  <div class="section">
    <h3>🖥️ Equipo</h3>
    <div class="row"><div class="lbl">Tipo</div><div class="val">${eq?.tipo || '—'}</div></div>
    <div class="row"><div class="lbl">Marca</div><div class="val">${eq?.marca || '—'}</div></div>
    <div class="row"><div class="lbl">Modelo</div><div class="val">${eq?.modelo || '—'}</div></div>
    <div class="row"><div class="lbl">Serie</div><div class="val">${eq?.serie || '—'}</div></div>
    <div class="row"><div class="lbl">Color</div><div class="val">${eq?.color || '—'}</div></div>
  </div>
</div>

<!-- PROBLEMA -->
${orden.descripcion_problema ? `
<div class="desc-box">
  <h3>⚠️ Problema reportado por el cliente</h3>
  <p>${orden.descripcion_problema}</p>
</div>` : ''}

<!-- SERVICIO REALIZADO -->
${orden.descripcion_servicio ? `
<div class="desc-box">
  <h3>🛠️ Descripción del servicio realizado</h3>
  <p>${orden.descripcion_servicio}</p>
</div>` : ''}

<!-- COBROS -->
${partidas.length > 0 ? `
<div class="cobros-section">
  <h3>💰 Conceptos de Cobro</h3>
  <table>
    <thead>
      <tr>
        <th style="text-align:left">Concepto</th>
        <th style="text-align:center;width:60px">Cant.</th>
        <th style="text-align:right;width:110px">Precio unit.</th>
        <th style="text-align:right;width:110px">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${items}
      <tr class="total-row">
        <td colspan="3" style="text-align:right">TOTAL</td>
        <td style="text-align:right">$${total.toFixed(2)} MXN</td>
      </tr>
    </tbody>
  </table>
</div>` : ''}

<!-- FIRMAS -->
<div class="firma-grid">
  <div class="firma-box">Firma del técnico</div>
  <div class="firma-box">Firma de conformidad del cliente</div>
</div>

<!-- FOOTER -->
<div class="footer">
  <span>📍 Mérida, Yucatán &nbsp;|&nbsp; <span class="fb">facebook.com/techmastermerida</span> &nbsp;|&nbsp; Servicio a domicilio y remoto</span>
  <span>Generado: ${new Date().toLocaleString('es-MX')}</span>
</div>

</body>
</html>`
}
