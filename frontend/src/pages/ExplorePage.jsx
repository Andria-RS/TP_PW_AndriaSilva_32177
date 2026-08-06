import { useEffect, useMemo, useState } from 'react'
import { publicFetch, authFetch } from '../services/api.js'
import { ALLOWED_THEMES } from '../constants/themes.js'
import PhotoCard from '../components/PhotoCard.jsx'
import PhotoModal from '../components/PhotoModal.jsx'
import Navbar from '../components/Navbar.jsx'

function ExplorePage() {
  const [user, setUser] = useState(null)
  const [photos, setPhotos] = useState([])
  const [photoComments, setPhotoComments] = useState({})
  const [photoLikes, setPhotoLikes] = useState({})
  const [photoLikedByMe, setPhotoLikedByMe] =
    useState({})
  const [selectedPhoto, setSelectedPhoto] =
    useState(null)
  const [themeFilter, setThemeFilter] =
    useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchCurrentUser()
    fetchPublicPhotos()
  }, [])

  const hasToken = () => {
    return Boolean(localStorage.getItem('token'))
  }

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return ''
    }

    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://')
    ) {
      return imageUrl
    }

    return `http://localhost:4000${imageUrl}`
  }

  const fetchCurrentUser = async () => {
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

  const fetchPublicPhotos = async (
    nextTheme = themeFilter
  ) => {
    try {
      setStatus('')

      const query = nextTheme
        ? `?theme=${encodeURIComponent(nextTheme)}`
        : ''

      const response = await publicFetch(
        `/photos${query}`
      )

      const loadedPhotos = Array.isArray(response)
        ? response
        : Array.isArray(response?.photos)
          ? response.photos
          : []

      setPhotos(loadedPhotos)

      const likesEntries = await Promise.all(
        loadedPhotos.map(async (photo) => {
          try {
            const request = hasToken()
              ? authFetch
              : publicFetch

            const likesResponse = await request(
              `/likes/photo/${photo._id}`
            )

            return {
              id: photo._id,
              likes: likesResponse.likes || 0,
              likedByMe: Boolean(
                likesResponse.likedByMe
              )
            }
          } catch {
            return {
              id: photo._id,
              likes: 0,
              likedByMe: false
            }
          }
        })
      )

      const commentsEntries = await Promise.all(
        loadedPhotos.map(async (photo) => {
          try {
            const commentsResponse =
              await publicFetch(
                `/comments/photo/${photo._id}`
              )

            return [photo._id, commentsResponse]
          } catch {
            return [photo._id, []]
          }
        })
      )

      const likesMap = {}
      const likedByMeMap = {}

      likesEntries.forEach(
        ({ id, likes, likedByMe }) => {
          likesMap[id] = likes
          likedByMeMap[id] = likedByMe
        }
      )

      setPhotoLikes(likesMap)
      setPhotoLikedByMe(likedByMeMap)
      setPhotoComments(
        Object.fromEntries(commentsEntries)
      )
    } catch (error) {
      setStatus(
        error.message ||
          'Não foi possível carregar as fotografias.'
      )
    }
  }

  const fetchPhotoComments = async (photoId) => {
    try {
      const data = await publicFetch(
        `/comments/photo/${photoId}`
      )

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
      const request = hasToken()
        ? authFetch
        : publicFetch

      const response = await request(
        `/likes/photo/${photoId}`
      )

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

  const handleLikePhoto = async (photoId) => {
    if (!hasToken()) {
      setStatus(
        'Tens de iniciar sessão para gostar de uma fotografia.'
      )
      return
    }

    try {
      const response = await authFetch(
        `/likes/photo/${photoId}`,
        {
          method: 'POST'
        }
      )

      setPhotoLikes((previous) => ({
        ...previous,
        [photoId]: response.likes || 0
      }))

      setPhotoLikedByMe((previous) => ({
        ...previous,
        [photoId]: Boolean(response.likedByMe)
      }))

      setStatus(
        response.message || 'Gostei atualizado'
      )
    } catch (error) {
      setStatus(
        error.message ||
          'Não foi possível atualizar o like.'
      )
    }
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
    const themes = [
      ...new Set(
        photos
          .map((photo) => photo.theme)
          .filter(Boolean)
      )
    ]

    return themes
  }, [photos])

  const visibleThemes = ALLOWED_THEMES.filter(
    (theme) => themeSuggestions.includes(theme)
  )

  return (
    <main className="app-shell explore-page">
      <Navbar />

      <header className="hero-banner">
        <div>
          <span>Explorar</span>

          <h1>Galeria de Fotografias</h1>

          <p>
            Descobre todas as fotos públicas partilhadas
            na plataforma e filtra por tema.
          </p>
        </div>
      </header>

      <section className="explore-filter-bar">
        <button
          type="button"
          className={
            !themeFilter
              ? 'theme-chip active'
              : 'theme-chip'
          }
          onClick={clearFilter}
        >
          Todos
        </button>

        {visibleThemes.map((theme) => (
          <button
            key={theme}
            type="button"
            className={
              themeFilter === theme
                ? 'theme-chip active'
                : 'theme-chip'
            }
            onClick={() => handleThemeClick(theme)}
          >
            {theme}
          </button>
        ))}
      </section>

      {status && (
        <p className="status-message">
          {status}
        </p>
      )}

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
              likesCount={
                photoLikes[photo._id] ?? 0
              }
              likedByMe={
                photoLikedByMe[photo._id] ?? false
              }
              commentsCount={
                (photoComments[photo._id] || [])
                  .length
              }
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
        likesCount={
          selectedPhoto
            ? photoLikes[selectedPhoto._id] ?? 0
            : 0
        }
        likedByMe={
          selectedPhoto
            ? photoLikedByMe[selectedPhoto._id] ?? false
            : false
        }
        comments={
          selectedPhoto
            ? photoComments[selectedPhoto._id] || []
            : []
        }
        commentValue=""
        onCommentChange={() => {}}
        onCommentSubmit={() => {}}
        onLike={handleLikePhoto}
        getImageUrl={getImageUrl}
      />
    </main>
  )
}

export default ExplorePage