import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, publicFetch } from '../services/api.js'
import { ALLOWED_THEMES } from '../constants/themes.js'
import PhotoCard from '../components/PhotoCard.jsx'
import PhotoModal from '../components/PhotoModal.jsx'
import CreateAlbumModal from '../components/CreateAlbumModal.jsx'

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
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false)

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

      const likesEntries = await Promise.all(
        data.map(async (photo) => {
          try {
            const response = await publicFetch(`/likes/photo/${photo._id}`)
            return [photo._id, response.likes || 0]
          } catch {
            return [photo._id, 0]
          }
        })
      )

      const commentsEntries = await Promise.all(
        data.map(async (photo) => {
          try {
            const response = await publicFetch(`/comments/photo/${photo._id}`)
            return [photo._id, response]
          } catch {
            return [photo._id, []]
          }
        })
      )

      setPhotoLikes(Object.fromEntries(likesEntries))
      setPhotoComments(Object.fromEntries(commentsEntries))
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

  const handleOpenPhoto = async (photo) => {
    setSelectedPhoto(photo)
    await Promise.all([fetchPhotoComments(photo._id), fetchPhotoLikes(photo._id)])
  }

  const handleClosePhoto = () => {
    setSelectedPhoto(null)
  }

  const handleCommentChange = (photoId, value) => {
    setCommentInput((prev) => ({
      ...prev,
      [photoId]: value
    }))
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

  const handleCreateAlbum = async ({
    name,
    description,
    theme,
    isPublic,
    coverImageFile,
    coverImageUrl
  }) => {
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('theme', theme)
      formData.append('isPublic', String(isPublic))

      if (coverImageFile) {
        formData.append('coverImage', coverImageFile)
      } else if (coverImageUrl) {
        formData.append('coverImageUrl', coverImageUrl)
      }

      await authFetch('/albums', {
        method: 'POST',
        body: formData
      })

      setStatus('Álbum criado')
      setIsCreateAlbumOpen(false)
      await fetchAlbums()
      await fetchPhotos()
    } catch (error) {
      setStatus(error.message)
    }
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
            <Link className="button-link" to="/login">Entrar</Link>
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
            <button
              type="button"
              className="hero-main-btn"
              onClick={() => fetchPhotos()}
            >
              Explorar fotografias
            </button>

            <button
              type="button"
              className="button-link"
              onClick={() => setIsCreateAlbumOpen(true)}
            >
              Criar álbum
            </button>
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
            <PhotoCard
              key={photo._id}
              photo={photo}
              likesCount={photoLikes[photo._id] ?? 0}
              commentsCount={(photoComments[photo._id] || []).length}
              onOpen={handleOpenPhoto}
              getImageUrl={getImageUrl}
              showAlbumLink
            />
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

      <PhotoModal
        photo={selectedPhoto}
        isOpen={Boolean(selectedPhoto)}
        onClose={handleClosePhoto}
        user={user}
        likesCount={selectedPhoto ? photoLikes[selectedPhoto._id] ?? 0 : 0}
        comments={selectedPhoto ? photoComments[selectedPhoto._id] || [] : []}
        commentValue={selectedPhoto ? commentInput[selectedPhoto._id] || '' : ''}
        onCommentChange={handleCommentChange}
        onCommentSubmit={handleCommentSubmit}
        onLike={handleLikePhoto}
        getImageUrl={getImageUrl}
      />

      <CreateAlbumModal
        isOpen={isCreateAlbumOpen}
        onClose={() => setIsCreateAlbumOpen(false)}
        onSubmit={handleCreateAlbum}
      />

      {status && <p className="status-message home-status">{status}</p>}
    </main>
  )
}

export default HomePage