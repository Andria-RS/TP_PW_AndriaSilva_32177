import { useEffect, useState } from 'react'
import { authFetch, publicFetch } from './services/api.js'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [albums, setAlbums] = useState([])
  const [userAlbums, setUserAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  const [photoLikes, setPhotoLikes] = useState({})
  const [photoComments, setPhotoComments] = useState({})
  const [commentInput, setCommentInput] = useState({})
  const [activePhotoId, setActivePhotoId] = useState(null)
  const [themeFilter, setThemeFilter] = useState('')
  const [selectedAlbum, setSelectedAlbum] = useState('')
  const [status, setStatus] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [albumForm, setAlbumForm] = useState({ name: '', description: '', theme: '', isPublic: true })
  const [photoForm, setPhotoForm] = useState({ title: '', imageUrl: '', description: '', albumId: '', theme: '' })

  useEffect(() => {
    fetchAlbums()
    fetchPhotos()
    fetchCurrentUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchCurrentUser() {
    try {
      const data = await authFetch('/auth/me')
      setUser(data.user)
      fetchUserAlbums()
    } catch {
      setUser(null)
      setUserAlbums([])
    }
  }

  async function fetchAlbums() {
    try {
      const data = await publicFetch('/albums')
      setAlbums(data)
    } catch (error) {
      setStatus(error.message)
    }
  }

  async function fetchUserAlbums() {
    try {
      const data = await authFetch('/albums/mine')
      setUserAlbums(data)
    } catch {
      setUserAlbums([])
    }
  }

  async function fetchPhotos() {
    try {
      const params = []
      if (themeFilter) params.push(`theme=${encodeURIComponent(themeFilter)}`)
      if (selectedAlbum) params.push(`albumId=${encodeURIComponent(selectedAlbum)}`)
      const query = params.length ? `?${params.join('&')}` : ''
      const data = await publicFetch(`/photos${query}`)
      setPhotos(data)

      const likesMap = {}
      await Promise.all(
        data.map(async (photo) => {
          try {
            const response = await publicFetch(`/likes/photo/${photo._id}`)
            likesMap[photo._id] = response.likes
          } catch {
            likesMap[photo._id] = 0
          }
        })
      )
      setPhotoLikes(likesMap)
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleAuthChange = (event) => {
    const { name, value } = event.target
    setAuthForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register'
    try {
      const data = await publicFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(authForm)
      })
      localStorage.setItem('token', data.token)
      setUser(data.user)
      setStatus('Sessão iniciada')
      setAuthForm({ name: '', email: '', password: '' })
      fetchUserAlbums()
      fetchPhotos()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setUserAlbums([])
    setStatus('Sessão terminada')
  }

  const handleAlbumSubmit = async (event) => {
    event.preventDefault()
    try {
      await authFetch('/albums', {
        method: 'POST',
        body: JSON.stringify(albumForm)
      })
      setAlbumForm({ name: '', description: '', theme: '', isPublic: true })
      setStatus('Álbum criado')
      fetchAlbums()
      fetchUserAlbums()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handlePhotoSubmit = async (event) => {
    event.preventDefault()
    try {
      await authFetch('/photos', {
        method: 'POST',
        body: JSON.stringify(photoForm)
      })
      setPhotoForm({ title: '', imageUrl: '', description: '', albumId: '', theme: '' })
      setStatus('Foto adicionada')
      fetchPhotos()
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
      setPhotoLikes((prev) => ({ ...prev, [photoId]: response.likes }))
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

  const handleCommentChange = (photoId, text) => {
    setCommentInput((prev) => ({ ...prev, [photoId]: text }))
  }

  const handleCommentSubmit = async (event, photoId) => {
    event.preventDefault()
    try {
      await authFetch(`/comments/photo/${photoId}`, {
        method: 'POST',
        body: JSON.stringify({ text: commentInput[photoId] || '' })
      })
      setCommentInput((prev) => ({ ...prev, [photoId]: '' }))
      fetchPhotoComments(photoId)
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
      setStatus('Gostei registrado')
      fetchPhotoLikes(photoId)
    } catch (error) {
      setStatus(error.message)
    }
  }

  const filteredPhotos = photos
  const userAlbumsForPhoto = user ? userAlbums : []

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
              <button type="button" onClick={() => setAuthMode('login')}>Login</button>
              <button type="button" onClick={() => setAuthMode('register')}>Registar</button>
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
                    <small>{photo.author?.name || 'Anónimo'}</small>
                    {photo.album?.name && <small>Álbum: {photo.album.name}</small>}
                    <div className="photo-actions">
                      <button type="button" onClick={() => handleTogglePhotoDetails(photo._id)}>
                        {activePhotoId === photo._id ? 'Ocultar detalhes' : 'Ver detalhes'}
                      </button>
                      {user && (
                        <button type="button" onClick={() => handleLikePhoto(photo._id)}>
                          Gostar
                        </button>
                      )}
                      <span>{photoLikes[photo._id] ?? 0} likes</span>
                    </div>
                    {activePhotoId === photo._id && (
                      <div className="comment-panel">
                        <div className="comment-summary">
                          <strong>{photoLikes[photo._id] ?? 0} likes</strong>
                          <span>{(photoComments[photo._id]?.length ?? 0)} comentários</span>
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
                          <form className="comment-form" onSubmit={(e) => handleCommentSubmit(e, photo._id)}>
                            <input
                              type="text"
                              placeholder="Escreva um comentário..."
                              value={commentInput[photo._id] || ''}
                              onChange={(e) => handleCommentChange(photo._id, e.target.value)}
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
          {user ? (
            <>
              <h2>Área pessoal</h2>
              <form onSubmit={handleAlbumSubmit}>
                <label>
                  Nome do álbum
                  <input
                    name="name"
                    value={albumForm.name}
                    onChange={(e) => setAlbumForm({ ...albumForm, [e.target.name]: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Tema
                  <input
                    name="theme"
                    value={albumForm.theme}
                    onChange={(e) => setAlbumForm({ ...albumForm, [e.target.name]: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Descrição
                  <textarea
                    name="description"
                    value={albumForm.description}
                    onChange={(e) => setAlbumForm({ ...albumForm, [e.target.name]: e.target.value })}
                  />
                </label>
                <label>
                  Público?
                  <select
                    name="isPublic"
                    value={String(albumForm.isPublic)}
                    onChange={(e) => setAlbumForm({ ...albumForm, isPublic: e.target.value === 'true' })}
                  >
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </label>
                <button type="submit">Criar álbum</button>
              </form>

              <h2>Adicionar foto</h2>
              <form onSubmit={handlePhotoSubmit}>
                <label>
                  Título
                  <input
                    name="title"
                    value={photoForm.title}
                    onChange={(e) => setPhotoForm({ ...photoForm, [e.target.name]: e.target.value })}
                    required
                  />
                </label>
                <label>
                  URL da imagem
                  <input
                    name="imageUrl"
                    value={photoForm.imageUrl}
                    onChange={(e) => setPhotoForm({ ...photoForm, [e.target.name]: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Álbum
                  <select
                    name="albumId"
                    value={photoForm.albumId}
                    onChange={(e) => setPhotoForm({ ...photoForm, albumId: e.target.value })}
                  >
                    <option value="">Nenhum</option>
                    {userAlbumsForPhoto.map((album) => (
                      <option key={album._id} value={album._id}>{album.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Tema (se não usar álbum)
                  <input
                    name="theme"
                    value={photoForm.theme}
                    onChange={(e) => setPhotoForm({ ...photoForm, [e.target.name]: e.target.value })}
                  />
                </label>
                <label>
                  Descrição
                  <textarea
                    name="description"
                    value={photoForm.description}
                    onChange={(e) => setPhotoForm({ ...photoForm, [e.target.name]: e.target.value })}
                  />
                </label>
                <button type="submit">Adicionar foto</button>
              </form>
            </>
          ) : (
            <>
              <h2>{authMode === 'login' ? 'Entrar' : 'Registar'}</h2>
              <form onSubmit={handleAuthSubmit}>
                {authMode === 'register' && (
                  <label>
                    Nome
                    <input name="name" value={authForm.name} onChange={handleAuthChange} required />
                  </label>
                )}
                <label>
                  Email
                  <input name="email" type="email" value={authForm.email} onChange={handleAuthChange} required />
                </label>
                <label>
                  Password
                  <input name="password" type="password" value={authForm.password} onChange={handleAuthChange} required />
                </label>
                <button type="submit">{authMode === 'login' ? 'Login' : 'Registar'}</button>
              </form>
            </>
          )}

          {status && <p className="status-message">{status}</p>}
        </aside>
      </section>
    </main>
  )
}

export default App
