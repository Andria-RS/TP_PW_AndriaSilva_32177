import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicFetch } from '../services/api.js'
import { ALLOWED_THEMES } from '../constants/themes.js'
import PhotoCard from '../components/PhotoCard.jsx'
import PhotoModal from '../components/PhotoModal.jsx'

function ExplorePage() {
  const [photos, setPhotos] = useState([])
  const [photoComments, setPhotoComments] = useState({})
  const [photoLikes, setPhotoLikes] = useState({})
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [themeFilter, setThemeFilter] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchPublicPhotos()
  }, [])

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('http')) return imageUrl
    return `http://localhost:4000${imageUrl}`
  }

  const fetchPublicPhotos = async (nextTheme = themeFilter) => {
    try {
      const query = nextTheme ? `?theme=${encodeURIComponent(nextTheme)}` : ''
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

  const handleThemeClick = async (theme) => {
    setThemeFilter(theme)
    await fetchPublicPhotos(theme)
  }

  const clearFilter = async () => {
    setThemeFilter('')
    await fetchPublicPhotos('')
  }

  const themeSuggestions = useMemo(() => {
    const themes = [...new Set(photos.map((photo) => photo.theme).filter(Boolean))]
    return themes.slice(0, 8)
  }, [photos])

  return (
    <main className="app-shell explore-page">
      <header className="hero-banner">
        <div>
          <span>Explorar</span>
          <h1>Galeria de Fotografias</h1>
          <p>Descobre todas as fotos públicas partilhadas na plataforma e filtra por tema.</p>
        </div>

        <div className="header-actions">
          <Link className="button-link" to="/">Voltar à home</Link>
        </div>
      </header>

      <section className="explore-filter-bar">
        <button
          type="button"
          className={!themeFilter ? 'theme-chip active' : 'theme-chip'}
          onClick={clearFilter}
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

      {photos.length === 0 ? (
        <div className="empty-state">Nenhuma fotografia pública encontrada.</div>
      ) : (
        <section className="lumen-photo-row explore-grid">
          {photos.map((photo) => (
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

      <PhotoModal
        photo={selectedPhoto}
        isOpen={Boolean(selectedPhoto)}
        onClose={handleClosePhoto}
        user={null}
        likesCount={selectedPhoto ? photoLikes[selectedPhoto._id] ?? 0 : 0}
        comments={selectedPhoto ? photoComments[selectedPhoto._id] || [] : []}
        commentValue=""
        onCommentChange={() => {}}
        onCommentSubmit={() => {}}
        onLike={() => {}}
        getImageUrl={getImageUrl}
      />

      {status && <p className="status-message">{status}</p>}
    </main>
  )
}

export default ExplorePage