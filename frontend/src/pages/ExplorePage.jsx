import { useEffect, useMemo, useState } from 'react'
import { publicFetch, authFetch } from '../services/api.js'
import { ALLOWED_THEMES } from '../constants/themes.js'
import PhotoCard from '../components/PhotoCard.jsx'
import PhotoModal from '../components/PhotoModal.jsx'
import Navbar from '../components/Navbar.jsx'

const API_URL = 'http://localhost:4000'

const hasToken = () => Boolean(localStorage.getItem('token'))

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  return `${API_URL}${imageUrl}`
}

function ExplorePage() {
  const [user, setUser] = useState(null)
  const [photos, setPhotos] = useState([])
  const [photoComments, setPhotoComments] = useState({})
  const [photoLikes, setPhotoLikes] = useState({})
  const [photoLikedByMe, setPhotoLikedByMe] = useState({})
  const [commentInput, setCommentInput] = useState({})
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [themeFilter, setThemeFilter] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    loadCurrentUser()
    fetchPublicPhotos()
  }, [])

  const loadCurrentUser = async () => {
    if (!hasToken()) {
      setUser(null)
      return
    }

    try {
      const data = await authFetch('/auth/me')
      setUser(data.user || null)
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  const fetchPublicPhotos = async (theme = '') => {
    try {
      setStatus('')

      const query = theme
        ? `?theme=${encodeURIComponent(theme)}`
        : ''

      const response = await publicFetch(`/photos${query}`)

      const loadedPhotos = Array.isArray(response)
        ? response
        : Array.isArray(response?.photos)
          ? response.photos
          : []

      setPhotos(loadedPhotos)
      await loadPhotoData(loadedPhotos)
    } catch (error) {
      setStatus(
        error.message || 'Não foi possível carregar as fotografias.'
      )
    }
  }

  const loadPhotoData = async (loadedPhotos) => {
    const [likesEntries, commentsEntries] = await Promise.all([
      Promise.all(loadedPhotos.map(loadPhotoLikes)),
      Promise.all(loadedPhotos.map(loadPhotoComments))
    ])

    const likesMap = {}
    const likedByMeMap = {}

    likesEntries.forEach(({ id, likes, likedByMe }) => {
      likesMap[id] = likes
      likedByMeMap[id] = likedByMe
    })

    setPhotoLikes(likesMap)
    setPhotoLikedByMe(likedByMeMap)
    setPhotoComments(Object.fromEntries(commentsEntries))
  }

  const loadPhotoLikes = async (photo) => {
    try {
      const request = hasToken() ? authFetch : publicFetch
      const response = await request(`/likes/photo/${photo._id}`)

      return {
        id: photo._id,
        likes: response.likes || 0,
        likedByMe: Boolean(response.likedByMe)
      }
    } catch {
      return {
        id: photo._id,
        likes: 0,
        likedByMe: false
      }
    }
  }

  const loadPhotoComments = async (photo) => {
    try {
      const data = await publicFetch(`/comments/photo/${photo._id}`)
      return [photo._id, data]
    } catch {
      return [photo._id, []]
    }
  }

  const fetchPhotoComments = async (photoId) => {
    try {
      const data = await publicFetch(`/comments/photo/${photoId}`)

      setPhotoComments((previous) => ({
        ...previous,
        [photoId]: data
      }))
    } catch {
      setPhotoComments((previous) => ({
        ...previous,
        [photoId]: []
      }))
    }
  }

  const fetchPhotoLikes = async (photoId) => {
    try {
      const request = hasToken() ? authFetch : publicFetch
      const response = await request(`/likes/photo/${photoId}`)

      setPhotoLikes((previous) => ({
        ...previous,
        [photoId]: response.likes || 0
      }))

      setPhotoLikedByMe((previous) => ({
        ...previous,
        [photoId]: Boolean(response.likedByMe)
      }))
    } catch {
      setPhotoLikes((previous) => ({
        ...previous,
        [photoId]: 0
      }))

      setPhotoLikedByMe((previous) => ({
        ...previous,
        [photoId]: false
      }))
    }
  }

  const handleOpenPhoto = async (photo) => {
    setSelectedPhoto(photo)

    await Promise.all([
      fetchPhotoComments(photo._id),
      fetchPhotoLikes(photo._id)
    ])
  }

  const handleClosePhoto = () => {
    setSelectedPhoto(null)
  }

  const handleCommentChange = (photoId, value) => {
    setCommentInput((previous) => ({
      ...previous,
      [photoId]: value
    }))
  }

  const handleCommentSubmit = async (event, photoId) => {
    event.preventDefault()

    const text = (commentInput[photoId] || '').trim()

    if (!text) return

    if (!hasToken()) {
      setStatus('Tens de iniciar sessão para comentar.')
      return
    }

    try {
      await authFetch(`/comments/photo/${photoId}`, {
        method: 'POST',
        body: JSON.stringify({ text })
      })

      setCommentInput((previous) => ({
        ...previous,
        [photoId]: ''
      }))

      await fetchPhotoComments(photoId)
      setStatus('Comentário adicionado.')
    } catch (error) {
      setStatus(error.message || 'Não foi possível adicionar o comentário.')
    }
  }

  const handleLikePhoto = async (photoId) => {
    if (!hasToken()) {
      setStatus('Tens de iniciar sessão para gostar de uma fotografia.')
      return
    }

    try {
      const response = await authFetch(`/likes/photo/${photoId}`, {
        method: 'POST'
      })

      setPhotoLikes((previous) => ({
        ...previous,
        [photoId]: response.likes || 0
      }))

      setPhotoLikedByMe((previous) => ({
        ...previous,
        [photoId]: Boolean(response.likedByMe)
      }))

      setStatus(response.message || 'Gosto atualizado.')
    } catch (error) {
      setStatus(error.message || 'Não foi possível atualizar o gosto.')
    }
  }

  const handleThemeChange = async (theme) => {
    setThemeFilter(theme)
    await fetchPublicPhotos(theme)
  }

  const visibleThemes = useMemo(() => {
    const usedThemes = new Set(
      photos.map((photo) => photo.theme).filter(Boolean)
    )

    return ALLOWED_THEMES.filter((theme) => usedThemes.has(theme))
  }, [photos])

  const selectedPhotoId = selectedPhoto?._id

  return (
    <main className="app-shell explore-page">
      <Navbar />

      <header className="hero-banner">
        <span>Explorar</span>

        <h1>Galeria de Fotografias</h1>

        <p>
          Descobre todas as fotos públicas partilhadas na plataforma e filtra por tema.
        </p>
      </header>

      <section className="explore-filter-bar">
        <button
          type="button"
          className={`theme-chip ${!themeFilter ? 'active' : ''}`}
          onClick={() => handleThemeChange('')}
        >
          Todos
        </button>

        {visibleThemes.map((theme) => (
          <button
            key={theme}
            type="button"
            className={`theme-chip ${themeFilter === theme ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme)}
          >
            {theme}
          </button>
        ))}
      </section>

      {status && <p className="status-message">{status}</p>}

      {photos.length === 0 ? (
        <div className="empty-state">
          Nenhuma fotografia pública encontrada.
        </div>
      ) : (
        <section className="lumen-photo-row explore-grid">
          {photos.map((photo) => (
            <PhotoCard
              key={photo._id}
              photo={photo}
              likesCount={photoLikes[photo._id] ?? 0}
              likedByMe={photoLikedByMe[photo._id] ?? false}
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
        user={user}
        likesCount={photoLikes[selectedPhotoId] ?? 0}
        likedByMe={photoLikedByMe[selectedPhotoId] ?? false}
        comments={photoComments[selectedPhotoId] || []}
        commentValue={commentInput[selectedPhotoId] || ''}
        onCommentChange={handleCommentChange}
        onCommentSubmit={handleCommentSubmit}
        onLike={handleLikePhoto}
        getImageUrl={getImageUrl}
      />
    </main>
  )
}

export default ExplorePage