import { useState, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'neo_leads'

function App() {
  const [leads, setLeads] = useState([])
  const [tab, setTab] = useState('form')
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: 'Web', notes: '' })
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setLeads(saved)
    } catch {}
  }, [])

  const saveLeads = (newLeads) => {
    setLeads(newLeads)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLeads))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return
    const newLead = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ...form,
      date: new Date().toISOString()
    }
    const updated = [newLead, ...leads]
    saveLeads(updated)
    setForm({ name: '', email: '', phone: '', source: 'Web', notes: '' })
  }

  const handleDelete = (id) => {
    const updated = leads.filter(l => l.id !== id)
    saveLeads(updated)
    setConfirmDelete(null)
    if (selected === id) setSelected(null)
  }

  const exportCSV = () => {
    const headers = ['Nombre', 'Email', 'Tel\u00e9fono', 'Fuente', 'Notas', 'Fecha']
    const rows = leads.map(l => [
      l.name, l.email, l.phone, l.source,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      new Date(l.date).toLocaleDateString('es-ES')
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `neo_leads_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `neo_leads_${new Date().toISOString().slice(0,10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const sortedLeads = [...leads].sort((a, b) => {
    let va, vb
    if (sortBy === 'name') { va = a.name; vb = b.name }
    else if (sortBy === 'source') { va = a.source; vb = b.source }
    else { va = new Date(a.date); vb = new Date(b.date) }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const sortArrow = (field) => sortBy === field ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''

  const sources = ['Web', 'Referido', 'Redes Sociales', 'Otro']

  return (
    <div className="app">
      <nav>
        <div className="nav-inner">
          <div className="nav-logo">NE<span>O</span></div>
          <div className="nav-tabs">
            <button className={`tab ${tab === 'form' ? 'active' : ''}`} onClick={() => setTab('form')}>Capturar</button>
            <button className={`tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
              Dashboard {leads.length > 0 && <span className="badge">{leads.length}</span>}
            </button>
          </div>
        </div>
      </nav>

      <main>
        {tab === 'form' && (
          <div className="form-section">
            <div className="form-card">
              <h2>Capturar <span>Lead</span></h2>
              <p className="form-sub">Registra un nuevo contacto en tu base de datos</p>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nombre completo" required />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@ejemplo.com" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tel\u00e9fono</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+34 600 000 000" />
                  </div>
                  <div className="form-group">
                    <label>Fuente</label>
                    <select value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                      {sources.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Notas</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} placeholder="Informaci\u00f3n adicional..."></textarea>
                </div>
                <button type="submit" className="btn-primary">Guardar Lead</button>
              </form>
            </div>
          </div>
        )}

        {tab === 'dashboard' && (
          <div className="dash-section">
            <div className="dash-header">
              <h2>Panel de <span>Leads</span></h2>
              <div className="dash-actions">
                <span className="lead-count">{leads.length} leads</span>
                <button className="btn-secondary" onClick={exportCSV}>CSV</button>
                <button className="btn-secondary" onClick={exportJSON}>JSON</button>
              </div>
            </div>

            {leads.length === 0 ? (
              <div className="empty-state">
                <p>No hay leads registrados a\u00fan.</p>
                <button className="btn-primary" onClick={() => setTab('form')}>Capturar primer lead</button>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th onClick={() => toggleSort('name')}>Nombre{sortArrow('name')}</th>
                      <th>Email</th>
                      <th>Tel\u00e9fono</th>
                      <th onClick={() => toggleSort('source')}>Fuente{sortArrow('source')}</th>
                      <th onClick={() => toggleSort('date')}>Fecha{sortArrow('date')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLeads.map(lead => (
                      <>
                        <tr key={lead.id} className={`lead-row ${selected === lead.id ? 'selected' : ''}`}
                            onClick={() => setSelected(selected === lead.id ? null : lead.id)}>
                          <td className="lead-name">{lead.name}</td>
                          <td>{lead.email}</td>
                          <td>{lead.phone || '---'}</td>
                          <td><span className="source-tag">{lead.source}</span></td>
                          <td className="lead-date">{new Date(lead.date).toLocaleDateString('es-ES')}</td>
                          <td>
                            <button className="btn-del" onClick={(e) => { e.stopPropagation(); setConfirmDelete(lead.id) }}
                              title="Eliminar">X</button>
                          </td>
                        </tr>
                        {selected === lead.id && (
                          <tr className="detail-row">
                            <td colSpan={6}>
                              <div className="lead-detail">
                                <div className="detail-grid">
                                  <div><strong>Nombre:</strong> {lead.name}</div>
                                  <div><strong>Email:</strong> {lead.email}</div>
                                  <div><strong>Tel\u00e9fono:</strong> {lead.phone || '---'}</div>
                                  <div><strong>Fuente:</strong> {lead.source}</div>
                                  <div><strong>Fecha:</strong> {new Date(lead.date).toLocaleString('es-ES')}</div>
                                  <div><strong>ID:</strong> {lead.id}</div>
                                </div>
                                {lead.notes && <div className="detail-notes"><strong>Notas:</strong><p>{lead.notes}</p></div>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {confirmDelete && (
              <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <h3>Eliminar Lead</h3>
                  <p>\u00bfEst\u00e1s seguro de eliminar este lead? Esta acci\u00f3n no se puede deshacer.</p>
                  <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                    <button className="btn-danger" onClick={() => handleDelete(confirmDelete)}>Eliminar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
