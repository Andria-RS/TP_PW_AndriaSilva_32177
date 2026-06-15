import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = '/api'

function App() {
  const [photos, setPhotos] = useState([])
  const [themeFilter, setThemeFilter] = useState('')
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    theme: '',
    description: '',
    authorName: ''
  })
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`${API_BASE}/photos`)
      const data = await res.json()
      setPhotos(data)
    } catch (error) {
      setStatus('Não foi possível carregar as fotos. Verifica o backend.')
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('A enviar...')

    try {
      const res = await fetch(`${API_BASE}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Erro ao adicionar foto')
      }

      setForm({ title: '', imageUrl: '', theme: '', description: '', authorName: '' })
      setStatus('Foto adicionada com sucesso!')
      fetchPhotos()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const filteredPhotos = photos.filter((photo) =>
    themeFilter ? photo.theme.toLowerCase().includes(themeFilter.toLowerCase()) : true
  )

  return (
    <main className="app-shell">
      <header className="hero-banner">
        <div>
          <span>Plataforma de coco</span>
          <h1>Partilha fotografias por tema</h1>
          <p>Inspira-te com temas, adiciona imagens e vê as galerias por tema.</p>
        </div>
      </header>

      <section className="content-grid">
        <article className="photo-panel">
          <div className="panel-header">
            <h2>Galeria</h2>
            <input
              type="text"
              placeholder="Filtrar por tema"
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
            />
          </div>

          {filteredPhotos.length === 0 ? (
            <div className="empty-state">Nenhuma fotografia encontrada.</div>
          ) : (
            <div className="photo-grid">
              {filteredPhotos.map((photo) => (
                <article key={photo._id} className="photo-card">
                  <img src={photo.imageUrl} alt={photo.title} />
                  <div className="photo-info">
                    <strong>{photo.title}</strong>
                    <span>{photo.theme}</span>
                    <p>{photo.description}</p>
                    <small>{photo.authorName || 'Anónimo'}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <aside className="form-panel">
          <h2>Partilha uma foto</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Título
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>
            <label>
              URL da imagem
              <input name="imageUrl" value={form.imageUrl} onChange={handleChange} required />
            </label>
            <label>
              Tema
              <input name="theme" value={form.theme} onChange={handleChange} required />
            </label>
            <label>
              Descrição
              <textarea name="description" value={form.description} onChange={handleChange} />
            </label>
            <label>
              Autor
              <input name="authorName" value={form.authorName} onChange={handleChange} />
            </label>
            <button type="submit">Enviar foto</button>
          </form>
          {status && <p className="status-message">{status}</p>}
        </aside>
      </section>
    </main>
  )
}

export default App
