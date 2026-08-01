import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, publicFetch } from '../services/api.js'

function HomePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('')
  const [themeFilter, setThemeFilter] = useState('')
  const [selectedAlbum, setSelectedAlbum] = useState('')
  const [photoComments, setPhotoComments] = useState({})
  const [photoLikes, setPhotoLikes] = useState({})
  const [commentInput, setCommentInput] = useState({})
  const [activePhotoId, setActivePhotoId] = useState(null)

  useEffect(() => {
    fetchAlbums()
    fetchPhotos()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const data = await authFetch('/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    }
  }

  const fetchAlbums = async () => {
    try {
      const data = await publicFetch('/albums')
      setAlbums(data)
    } catch (error) {
      setStatus(error.message)
    }
  }

  const fetchPhotos = async () => {
    try {
      const params = []
      if (themeFilter) params.push(`theme=${encodeURIComponent(themeFilter)}`)
      if (selectedAlbum) params.push(`albumId=${encodeURIComponent(selectedAlbum)}`)
      const query = params.length ? `?${params.join('&')}` : ''
      const data = await publicFetch(`/photos${query}`)
      setPhotos(data)
    } catch (error) {
      setStatus(error.message)
    }
  }

  const fetchPhotoComments = async (photoId) => {
    try {
      const data = await publicFetch(`/comments/photo/${photoId}`)
      setPhotoComments((prev) => ({ ...prev, [photoId]: data }))
    } catch {
      setPhotoComments((prev) => ({ ...prev, [photoId]: [] }))
    }
  }

  const fetchPhotoLikes = async (photoId) => {
    try {
      const response = await publicFetch(`/likes/photo/${photoId}`)
      setPhotoLikes((prev) => ({ ...prev, [photoId]: response.likes || 0 }))
    } catch {
      setPhotoLikes((prev) => ({ ...prev, [photoId]: 0 }))
    }
  }

  const handleTogglePhotoDetails = async (photoId) => {
    const nextId = activePhotoId === photoId ? null : photoId
    setActivePhotoId(nextId)
    if (nextId) {
      await Promise.all([fetchPhotoComments(photoId), fetchPhotoLikes(photoId)])
    }
  }

  const handleCommentSubmit = async (event, photoId) => {
    event.preventDefault()
    const text = (commentInput[photoId] || '').trim()
    if (!text) {
      return
    }

    try {
      await authFetch(`/comments/photo/${photoId}`, {
        method: 'POST',
        body: JSON.stringify({ text })
      })
      setCommentInput((prev) => ({ ...prev, [photoId]: '' }))
      await fetchPhotoComments(photoId)
      setStatus('Comentário adicionado')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleLikePhoto = async (photoId) => {
    try {
      await authFetch(`/likes/photo/${photoId}`, {
        method: 'POST'
      })
      await fetchPhotoLikes(photoId)
      setStatus('Gostei registado')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setStatus('Sessão terminada')
    navigate('/login')
  }

  return (
    <main className="app-shell">
      <header className="hero-banner">
        <div>
          <span>Plataforma de fotografias</span>
          <h1>Partilha fotos por tema e álbum</h1>
          <p>Explora álbuns públicos, faz login e adiciona fotos aos teus álbuns.</p>
        </div>
        <div className="header-actions">
          {user ? (
            <div className="user-box">
              <span>Olá, {user.name}</span>
              <button type="button" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="auth-toggle">
              <Link to="/login" className="button-link">Login</Link>
              <Link to="/register" className="button-link">Registar</Link>
            </div>
          )}
        </div>
      </header>

      <section className="content-grid">
        <article className="photo-panel">
          <div className="panel-header">
            <h2>Galeria pública</h2>
            <div className="filters-row">
              <input
                type="text"
                placeholder="Filtrar por tema"
                value={themeFilter}
                onChange={(e) => setThemeFilter(e.target.value)}
              />
              <select value={selectedAlbum} onChange={(e) => setSelectedAlbum(e.target.value)}>
                <option value="">Todos os álbuns</option>
                {albums.map((album) => (
                  <option key={album._id} value={album._id}>{album.name}</option>
                ))}
              </select>
              <button type="button" onClick={fetchPhotos}>Filtrar</button>
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="empty-state">Nenhuma fotografia encontrada.</div>
          ) : (
            <div className="photo-grid">
              {photos.map((photo) => (
                <article key={photo._id} className="photo-card">
                  <img src={photo.imageUrl} alt={photo.title} />
                  <div className="photo-info">
                    <strong>{photo.title}</strong>
                    <span>{photo.theme}</span>
                    <p>{photo.description}</p>
                    <small>{photo.author?.name || 'Anónimo'}</small>
                    {photo.album?.name && <small>Álbum: {photo.album.name}</small>}
                    <div className="photo-actions">
                      <button type="button" onClick={() => handleTogglePhotoDetails(photo._id)}>
                        {activePhotoId === photo._id ? 'Ocultar detalhes' : 'Ver detalhes'}
                      </button>
                      {user ? (
                        <button type="button" onClick={() => handleLikePhoto(photo._id)}>
                          Gostar
                        </button>
                      ) : null}
                      <span>{photoLikes[photo._id] ?? 0} likes</span>
                    </div>
                    {activePhotoId === photo._id && (
                      <div className="comment-panel">
                        <div className="comment-summary">
                          <strong>{photoLikes[photo._id] ?? 0} likes</strong>
                          <span>{(photoComments[photo._id] || []).length} comentários</span>
                        </div>
                        {(photoComments[photo._id] || []).length === 0 ? (
                          <p className="empty-state">Sem comentários ainda.</p>
                        ) : (
                          <div className="comments-list">
                            {photoComments[photo._id].map((comment) => (
                              <div key={comment._id} className="comment-item">
                                <strong>{comment.author?.name || 'Anónimo'}</strong>
                                <p>{comment.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {user ? (
                          <form className="comment-form" onSubmit={(event) => handleCommentSubmit(event, photo._id)}>
                            <input
                              type="text"
                              placeholder="Escreva um comentário..."
                              value={commentInput[photo._id] || ''}
                              onChange={(event) => setCommentInput((prev) => ({ ...prev, [photo._id]: event.target.value }))}
                              required
                            />
                            <button type="submit">Enviar</button>
                          </form>
                        ) : (
                          <p className="comment-note">Faça login para comentar ou gostar.</p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <aside className="form-panel">
          <h2>Explora</h2>
          <p className="intro-copy">Entra na tua conta para criar álbuns, adicionar fotos e gerir a tua coleção.</p>
          <Link className="hero-main-btn" to={user ? '/profile' : '/login'}>
            {user ? 'Ir para o perfil' : 'Entrar na plataforma'}
          </Link>
          {status && <p className="status-message">{status}</p>}
        </aside>
      </section>
    </main>
  )
}

export default HomePage
