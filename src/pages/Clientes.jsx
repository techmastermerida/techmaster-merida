import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useToast } from '../lib/toast.jsx'
import { useNavigate } from 'react-router-dom'

const EMPTY = { nombre:'', telefono:'', email:'', direccion:'', notas:'' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)   // null | 'new' | cliente obj
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [equiposModal, setEquiposModal] = useState(null) // cliente para ver equipos
  const toast   = useToast()
  const navigate = useNavigate()

  const load = async () => {
    const { data } = await supabase
      .from('clientes')
      .select('*, equipos(count)')
      .order('nombre')
    setClientes(data || [])
  }
  useEffect(() => { load() }, [])

  const open = (c = null) => {
    setForm(c ? { nombre:c.nombre, telefono:c.telefono||'', email:c.email||'', direccion:c.direccion||'', notas:c.notas||'' } : EMPTY)
    setModal(c || 'new')
  }
  const close = () => setModal(null)

  const save = async () => {
    if (!form.nombre.trim()) { toast('El nombre es requerido','error'); return }
    setSaving(true)
    if (modal === 'new') {
      const { error } = await supabase.from('clientes').insert(form)
      if (error) { toast('Error al guardar','error'); setSaving(false); return }
      toast('Cliente creado ✓','success')
    } else {
      const { error } = await supabase.from('clientes').update(form).eq('id', modal.id)
      if (error) { toast('Error al actualizar','error'); setSaving(false); return }
      toast('Cliente actualizado ✓','success')
    }
    setSaving(false)
    close()
    load()
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar este cliente y todos sus datos?')) return
    await supabase.from('clientes').delete().eq('id', id)
    toast('Cliente eliminado')
    load()
  }

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.telefono || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 <span>Clientes</span></h1>
        <button className="btn btn-primary" onClick={() => open()}>+ Nuevo Cliente</button>
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:12, marginBottom:20 }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input placeholder="Buscar por nombre, teléfono o email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Equipos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">👥</div><p>Sin clientes aún</p></div></td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td style={{fontWeight:600}}>{c.nombre}</td>
                  <td>{c.telefono || '—'}</td>
                  <td style={{color:'var(--brand-muted)'}}>{c.email || '—'}</td>
                  <td style={{color:'var(--brand-muted)',fontSize:'.82rem'}}>{c.direccion || '—'}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEquiposModal(c)}>
                      Ver equipos
                    </button>
                  </td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-ghost btn-sm" onClick={() => open(c)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(c.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cliente */}
      {modal && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal === 'new' ? '➕ Nuevo Cliente' : '✏️ Editar Cliente'}</div>
              <button className="modal-close" onClick={close}>×</button>
            </div>
            <div className="form-grid">
              <div className="form-row">
                <div className="field">
                  <label>Nombre completo *</label>
                  <input value={form.nombre} onChange={e => setForm({...form,nombre:e.target.value})} placeholder="Juan Pérez García" />
                </div>
                <div className="field">
                  <label>Teléfono</label>
                  <input value={form.telefono} onChange={e => setForm({...form,telefono:e.target.value})} placeholder="999 123 4567" />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="correo@ejemplo.com" />
                </div>
                <div className="field">
                  <label>Dirección</label>
                  <input value={form.direccion} onChange={e => setForm({...form,direccion:e.target.value})} placeholder="Calle, Colonia, Mérida" />
                </div>
              </div>
              <div className="field">
                <label>Notas internas</label>
                <textarea value={form.notas} onChange={e => setForm({...form,notas:e.target.value})} placeholder="Observaciones sobre el cliente…" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Guardando…' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Equipos del cliente */}
      {equiposModal && (
        <EquiposClienteModal
          cliente={equiposModal}
          onClose={() => { setEquiposModal(null); load() }}
          toast={toast}
        />
      )}
    </div>
  )
}

const EQ_TIPOS = ['PC de Escritorio','Laptop','Impresora','Tablet','All-in-One','Servidor','Otro']
const EQ_EMPTY = { tipo:'PC de Escritorio', marca:'', modelo:'', serie:'', color:'', descripcion:'' }

function EquiposClienteModal({ cliente, onClose, toast }) {
  const [equipos, setEquipos]   = useState([])
  const [form, setForm]         = useState(EQ_EMPTY)
  const [adding, setAdding]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const navigate = useNavigate()

  const loadEq = async () => {
    const { data } = await supabase.from('equipos').select('*').eq('cliente_id', cliente.id).order('created_at')
    setEquipos(data || [])
  }
  useEffect(() => { loadEq() }, [])

  const saveEq = async () => {
    if (!form.tipo) return
    setSaving(true)
    const { error } = await supabase.from('equipos').insert({ ...form, cliente_id: cliente.id })
    if (error) { toast('Error al guardar equipo','error'); setSaving(false); return }
    toast('Equipo registrado ✓','success')
    setSaving(false)
    setAdding(false)
    setForm(EQ_EMPTY)
    loadEq()
  }
  const delEq = async (id) => {
    if (!confirm('¿Eliminar este equipo?')) return
    await supabase.from('equipos').delete().eq('id', id)
    loadEq()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">🖥️ Equipos — {cliente.nombre}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Lista equipos */}
        <div style={{marginBottom:16}}>
          {equipos.length === 0
            ? <p style={{color:'var(--brand-muted)',fontSize:'.88rem'}}>Este cliente no tiene equipos registrados.</p>
            : equipos.map(eq => (
              <div key={eq.id} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                background:'var(--brand-dark3)', borderRadius:'var(--radius)', padding:'12px 16px', marginBottom:8
              }}>
                <div>
                  <span style={{fontWeight:600,color:'var(--brand-blue)'}}>{eq.tipo}</span>
                  <span style={{color:'var(--brand-muted)',margin:'0 8px'}}>·</span>
                  <span>{eq.marca} {eq.modelo}</span>
                  {eq.serie && <span style={{color:'var(--brand-muted)',fontSize:'.8rem',marginLeft:8}}>S/N: {eq.serie}</span>}
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/ordenes?nueva=1&cliente=${cliente.id}&equipo=${eq.id}`)}>+ Orden</button>
                  <button className="btn btn-danger btn-sm" onClick={() => delEq(eq.id)}>🗑️</button>
                </div>
              </div>
            ))
          }
        </div>

        {/* Agregar equipo */}
        {!adding ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>➕ Agregar equipo</button>
        ) : (
          <div style={{background:'var(--brand-dark3)',borderRadius:'var(--radius)',padding:16}}>
            <div className="section-title" style={{marginBottom:12}}>Nuevo Equipo</div>
            <div className="form-row-3" style={{marginBottom:12}}>
              <div className="field">
                <label>Tipo *</label>
                <select value={form.tipo} onChange={e => setForm({...form,tipo:e.target.value})}>
                  {EQ_TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Marca</label>
                <input value={form.marca} onChange={e => setForm({...form,marca:e.target.value})} placeholder="HP, Dell, Lenovo…" />
              </div>
              <div className="field">
                <label>Modelo</label>
                <input value={form.modelo} onChange={e => setForm({...form,modelo:e.target.value})} placeholder="Ej. Pavilion 15" />
              </div>
            </div>
            <div className="form-row" style={{marginBottom:12}}>
              <div className="field">
                <label>Número de serie</label>
                <input value={form.serie} onChange={e => setForm({...form,serie:e.target.value})} placeholder="S/N del equipo" />
              </div>
              <div className="field">
                <label>Color / características</label>
                <input value={form.color} onChange={e => setForm({...form,color:e.target.value})} placeholder="Negro, plateado…" />
              </div>
            </div>
            <div className="field" style={{marginBottom:12}}>
              <label>Estado / descripción al recibirlo</label>
              <textarea value={form.descripcion} onChange={e => setForm({...form,descripcion:e.target.value})} placeholder="Ej. pantalla rota, enciende pero no carga, teclado sin la tecla A…" />
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={saveEq} disabled={saving}>
                {saving ? 'Guardando…' : '💾 Guardar equipo'}
              </button>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
