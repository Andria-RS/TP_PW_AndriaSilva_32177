import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, publicFetch } from '../services/api.js'
import { ALLOWED_THEMES } from '../constants/themes.js'

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

  const themeSuggestions = useMemo(() => {
    const themes = [...new Set(albums.map((album) => album.theme).filter(Boolean))]
    return themes.slice(0, 8)
  }, [albums])

  const featuredPhoto = photos[0] || null

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('http')) return imageUrl
    return `http://localhost:4000${imageUrl}`
  }

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

  const fetchPhotos = async (nextTheme = themeFilter, nextAlbum = selectedAlbum) => {
    try {
      const params = []
      if (nextTheme) params.push(`theme=${encodeURIComponent(nextTheme)}`)
      if (nextAlbum) params.push(`albumId=${encodeURIComponent(nextAlbum)}`)
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
    if (!text) return

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

  const handleThemeClick = async (theme) => {
    setThemeFilter(theme)
    setSelectedAlbum('')
    await fetchPhotos(theme, '')
  }

  const clearFilters = async () => {
    setThemeFilter('')
    setSelectedAlbum('')
    await fetchPhotos('', '')
  }

  return (
    <main className="app-shell lumen-home">
      <header className="lumen-navbar">
        <div className="lumen-logo">
          <div className="lumen-logo-mark">◎</div>
          <span>LUMEN</span>
        </div>

        <nav className="lumen-nav-links">
          <Link to="/">Explorar</Link>
          <button type="button" onClick={clearFilters}>Álbuns</button>
          <button type="button" onClick={clearFilters}>Comunidade</button>
        </nav>

        <div className="lumen-nav-actions">
          <div className="lumen-search-box">
            <select
              value={themeFilter}
              onChange={async (e) => {
                const nextTheme = e.target.value
                setThemeFilter(nextTheme)
                await fetchPhotos(nextTheme, selectedAlbum)
              }}
            >
              <option value="">Todos os temas</option>
              {ALLOWED_THEMES.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>

          {user ? (
            <>
              <Link className="button-link" to="/profile">Perfil</Link>
              <button type="button" onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <>
              <Link className="button-link" to="/login">Entrar</Link>
              <Link className="hero-main-btn" to="/register">Registar</Link>
            </>
          )}
        </div>
      </header>

      <section className="lumen-hero">
        <div className="lumen-hero-copy">
          <h1>Descobre o mundo através de outras lentes</h1>
          <p>
            Explora fotografias, encontra novas perspetivas e partilha os teus
            melhores momentos na Lumen.
          </p>

          <div className="lumen-hero-actions">
            <button type="button" className="hero-main-btn" onClick={() => fetchPhotos()}>
              Explorar fotografias
            </button>
            <Link className="button-link" to={user ? '/profile' : '/register'}>
              {user ? 'Ir para o perfil' : 'Criar conta'}
            </Link>
          </div>
        </div>

        <div className="lumen-hero-image-card">
          {featuredPhoto?.imageUrl ? (
            <img
              src={getImageUrl(featuredPhoto.imageUrl)}
              alt={featuredPhoto.title}
            />
          ) : (
            <div className="lumen-hero-placeholder">
              <div>
                <strong>Sem fotografia em destaque</strong>
                <p>Adiciona fotos públicas para dar vida à homepage da Lumen.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="lumen-section-header">
        <h2>Fotografias recentes</h2>
        <button type="button" className="lumen-inline-action" onClick={clearFilters}>
          Ver todas →
        </button>
      </section>

      {photos.length === 0 ? (
        <div className="empty-state">Nenhuma fotografia encontrada.</div>
      ) : (
        <section className="lumen-photo-row">
          {photos.slice(0, 4).map((photo) => (
            <article key={photo._id} className="lumen-photo-card">
              <div className="lumen-photo-thumb">
                <img
                  src={getImageUrl(photo.imageUrl)}
                  alt={photo.title}
                />
              </div>

              <div className="lumen-photo-overlay">
                <div className="lumen-photo-stats">
                  <span>♡ {photoLikes[photo._id] ?? 0}</span>
                  <span>💬 {(photoComments[photo._id] || []).length}</span>
                </div>

                <div className="lumen-photo-meta">
                  <small>{photo.author?.name || 'Anónimo'}</small>
                </div>
              </div>

              <div className="lumen-photo-body">
                <div className="refined-meta-row">
                  <span>{photo.theme}</span>
                  {photo.album?._id ? (
                    <Link to={`/albums/${photo.album._id}`} className="album-inline-link">
                      Álbum
                    </Link>
                  ) : null}
                </div>

                <strong>{photo.title}</strong>

                <div className="photo-footer-row">
                  <button type="button" onClick={() => handleTogglePhotoDetails(photo._id)}>
                    {activePhotoId === photo._id ? 'Fechar' : 'Detalhes'}
                  </button>
                </div>

                {activePhotoId === photo._id && (
                  <div className="comment-panel refined-comment-panel">
                    <div className="comment-summary">
                      {user ? (
                        <button type="button" onClick={() => handleLikePhoto(photo._id)}>
                          Gostar
                        </button>
                      ) : (
                        <span>Faz login para interagir</span>
                      )}
                      <span>{photoLikes[photo._id] ?? 0} likes</span>
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
                      <form
                        className="comment-form"
                        onSubmit={(event) => handleCommentSubmit(event, photo._id)}
                      >
                        <input
                          type="text"
                          placeholder="Escreve um comentário..."
                          value={commentInput[photo._id] || ''}
                          onChange={(event) =>
                            setCommentInput((prev) => ({
                              ...prev,
                              [photo._id]: event.target.value
                            }))
                          }
                          required
                        />
                        <button type="submit">Enviar</button>
                      </form>
                    ) : null}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="lumen-section-header themes-header">
        <h2>Explora por tema</h2>
      </section>

      <section className="theme-chip-row lumen-theme-row">
        <button
          type="button"
          className={!themeFilter ? 'theme-chip active' : 'theme-chip'}
          onClick={clearFilters}
        >
          Todos
        </button>

        {ALLOWED_THEMES.filter((theme) => themeSuggestions.includes(theme)).map((theme) => (
          <button
            key={theme}
            type="button"
            className={themeFilter === theme ? 'theme-chip active' : 'theme-chip'}
            onClick={() => handleThemeClick(theme)}
          >
            {theme}
          </button>
        ))}
      </section>

      {albums.length > 0 && (
        <section className="lumen-album-filter">
          <label>
            Filtrar por álbum
            <select
              value={selectedAlbum}
              onChange={async (e) => {
                const nextAlbum = e.target.value
                setSelectedAlbum(nextAlbum)
                await fetchPhotos(themeFilter, nextAlbum)
              }}
            >
              <option value="">Todos os álbuns</option>
              {albums.map((album) => (
                <option key={album._id} value={album._id}>
                  {album.name}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {status && <p className="status-message home-status">{status}</p>}
    </main>
  )
}

export default HomePage