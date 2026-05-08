import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../lib/toast.jsx'
import { StatusBadge } from './Dashboard.jsx'

const ESTADOS = ['Todos','Recibido','Diagnóstico','En proceso','Listo','Entregado','Cancelado']
const EQ_TIPOS = ['PC de Escritorio','Laptop','Impresora','Tablet','All-in-One','Servidor','Otro']

export default function Ordenes() {
  const [ordenes, setOrdenes]   = useState([])
  const [filter, setFilter]     = useState('Todos')
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [clientes, setClientes] = useState([])
  const [equipos, setEquipos]   = useState([])
  const [form, setForm]         = useState(emptyForm())
  const [saving, setSaving]     = useState(false)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast    = useToast()

  function emptyForm() {
    return {
      cliente_id:'', equipo_id:'', fecha_ingreso: new Date().toISOString().split('T')[0],
      estado:'Recibido', descripcion_problema:'', observaciones:''
    }
  }

  const load = async () => {
    const q = supabase
      .from('ordenes')
      .select('id,folio,estado,fecha_ingreso,fecha_entrega,clientes(nombre,telefono),equipos(tipo,marca,modelo)')
      .order('created_at', { ascending: false })
    const { data } = await q
    setOrdenes(data || [])
  }

  useEffect(() => {
    load()
    supabase.from('clientes').select('id,nombre').order('nombre').then(({ data }) => setClientes(data || []))
  }, [])

  // Open new modal if query param set
  useEffect(() => {
    if (params.get('nueva')) {
      const clienteId = params.get('cliente') || ''
      const equipoId  = params.get('equipo')  || ''
      setForm({ ...emptyForm(), cliente_id: clienteId, equipo_id: equipoId })
      if (clienteId) {
        supabase.from('equipos').select('id,tipo,marca,modelo').eq('cliente_id', clienteId)
          .then(({ data }) => setEquipos(data || []))
      }
      setModal(true)
    }
  }, [params])

  const onClienteChange = async (id) => {
    setForm(f => ({ ...f, cliente_id: id, equipo_id: '' }))
    if (!id) { setEquipos([]); return }
    const { data } = await supabase.from('equipos').select('id,tipo,marca,modelo').eq('cliente_id', id)
    setEquipos(data || [])
  }

  const save = async () => {
    if (!form.cliente_id) { toast('Selecciona un cliente','error'); return }
    if (!form.equipo_id)  { toast('Selecciona un equipo','error'); return }
    setSaving(true)
    // Get next folio
    const { data: folioData } = await supabase.rpc('next_folio')
    const { error } = await supabase.from('ordenes').insert({
      ...form,
      folio: folioData,
    })
    if (error) { toast('Error al crear la orden','error'); setSaving(false); return }
    toast('Orden creada ✓','success')
    setSaving(false)
    setModal(false)
    load()
  }

  const filtered = ordenes.filter(o => {
    const matchEstado = filter === 'Todos' || o.estado === filter
    const q = search.toLowerCase()
    const matchSearch = !q || (o.folio||'').toLowerCase().includes(q) ||
      (o.clientes?.nombre||'').toLowerCase().includes(q) ||
      (o.equipos?.marca||'').toLowerCase().includes(q)
    return matchEstado && matchSearch
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔧 <span>Órdenes de Servicio</span></h1>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm()); setEquipos([]); setModal(true) }}>
          + Nueva Orden
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input placeholder="Buscar folio, cliente, equipo…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tabs">
          {ESTADOS.map(e => (
            <button key={e} className={`tab-btn${filter===e?' active':''}`} onClick={() => setFilter(e)}>{e}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Ingreso</th>
                <th>Estado</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">🔧</div><p>Sin órdenes</p></div></td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} onClick={() => navigate(`/ordenes/${o.id}`)}>
                  <td><code style={{color:'var(--brand-blue)',fontSize:'.82rem'}}>{o.folio}</code></td>
                  <td style={{fontWeight:600}}>{o.clientes?.nombre}</td>
                  <td style={{color:'var(--brand-muted)'}}>{o.equipos?.marca} {o.equipos?.tipo}</td>
                  <td style={{color:'var(--brand-muted)',fontSize:'.82rem'}}>{o.fecha_ingreso}</td>
                  <td><StatusBadge estado={o.estado} /></td>
                  <td style={{color:'var(--brand-muted)',fontSize:'.82rem'}}>{o.clientes?.telefono}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nueva orden */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">➕ Nueva Orden de Servicio</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="form-grid">
              <div className="form-row">
                <div className="field">
                  <label>Cliente *</label>
                  <select value={form.cliente_id} onChange={e => onClienteChange(e.target.value)}>
                    <option value="">— Seleccionar —</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Equipo *</label>
                  <select value={form.equipo_id} onChange={e => setForm({...form, equipo_id:e.target.value})} disabled={!form.cliente_id}>
                    <option value="">— Seleccionar —</option>
                    {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.tipo} — {eq.marca} {eq.modelo}</option>)}
                  </select>
                  {form.cliente_id && equipos.length === 0 && (
                    <span style={{fontSize:'.75rem',color:'var(--brand-warn)'}}>
                      ⚠️ Este cliente no tiene equipos. Regístralos primero en "Clientes".
                    </span>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Fecha de ingreso</label>
                  <input type="date" value={form.fecha_ingreso} onChange={e => setForm({...form,fecha_ingreso:e.target.value})} />
                </div>
                <div className="field">
                  <label>Estado inicial</label>
                  <select value={form.estado} onChange={e => setForm({...form,estado:e.target.value})}>
                    {['Recibido','Diagnóstico','En proceso'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Descripción del problema (reportado por el cliente)</label>
                <textarea value={form.descripcion_problema} onChange={e => setForm({...form,descripcion_problema:e.target.value})} placeholder="Ej. La laptop no enciende, hace click pero no arranca…" />
              </div>
              <div className="field">
                <label>Observaciones adicionales</label>
                <textarea value={form.observaciones} onChange={e => setForm({...form,observaciones:e.target.value})} placeholder="Accesorios que trae, cargador, estado visible, etc." rows={2} style={{minHeight:60}} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Creando…' : '✅ Crear Orden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
