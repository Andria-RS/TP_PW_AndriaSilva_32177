import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { authFetch, publicFetch } from '../services/api.js'
import PhotoCard from '../components/PhotoCard.jsx'
import PhotoModal from '../components/PhotoModal.jsx'

const API_URL = 'http://localhost:4000'

function AlbumPage() {
  const { albumId } = useParams()

  const [user, setUser] = useState(null)
  const [album, setAlbum] = useState(null)
  const [photos, setPhotos] = useState([])
  const [photoComments, setPhotoComments] = useState({})
  const [photoLikes, setPhotoLikes] = useState({})
  const [photoLikedByMe, setPhotoLikedByMe] = useState({})
  const [commentInput, setCommentInput] = useState({})
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const hasToken = () => Boolean(localStorage.getItem('token'))

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }

    return `${API_URL}${imageUrl}`
  }

  useEffect(() => {
    loadPage()
  }, [albumId])

  const loadPage = async () => {
    try {
      setIsLoading(true)
      setStatus('')
      setAlbum(null)

      const currentUser = await loadCurrentUser()
      await loadAlbum(currentUser)
    } catch (error) {
      setStatus(error.message || 'Não foi possível carregar o álbum.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentUser = async () => {
    if (!hasToken()) {
      setUser(null)
      return null
    }

    try {
      const data = await authFetch('/auth/me')
      const currentUser = data.user || null

      setUser(currentUser)
      return currentUser
    } catch {
      localStorage.removeItem('token')
      setUser(null)
      return null
    }
  }

  const loadAlbum = async (currentUser) => {
    const request = currentUser || hasToken()
      ? authFetch
      : publicFetch

    const data = await request(`/albums/${albumId}`)
    const loadedAlbum = data.album || data
    const loadedPhotos = Array.isArray(data.photos) ? data.photos : []

    setAlbum(loadedAlbum)
    setPhotos(loadedPhotos)

    await loadPhotoData(loadedPhotos)
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
      setStatus(error.message)
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
      setStatus(error.message)
    }
  }

  const getSelectedPhotoData = () => {
    if (!selectedPhoto) {
      return {
        likes: 0,
        likedByMe: false,
        comments: [],
        commentValue: ''
      }
    }

    const photoId = selectedPhoto._id

    return {
      likes: photoLikes[photoId] ?? 0,
      likedByMe: photoLikedByMe[photoId] ?? false,
      comments: photoComments[photoId] || [],
      commentValue: commentInput[photoId] || ''
    }
  }

  if (isLoading) {
    return (
      <main className="app-shell albums-page">
        <div className="auth-shell">
          <p className="status-message">A carregar álbum...</p>
        </div>
      </main>
    )
  }

  if (!album) {
    return (
      <main className="app-shell albums-page">
        <div className="empty-state">
          <p>{status || 'Álbum não encontrado ou sem acesso.'}</p>
        </div>
      </main>
    )
  }

  const selectedPhotoData = getSelectedPhotoData()

  return (
    <main className="app-shell albums-page">
      <section className="hero-banner">
        <span>{album.isPublic ? 'Álbum público' : 'Álbum privado'}</span>

        <h1>{album.name}</h1>

        <p>{album.description || 'Sem descrição.'}</p>

        {album.theme && (
          <span className="public-album-theme">{album.theme}</span>
        )}

        {album.coverImageUrl && (
          <img
            src={getImageUrl(album.coverImageUrl)}
            alt={album.name}
            className="album-cover album-banner-cover"
          />
        )}
      </section>

      {status && <p className="status-message">{status}</p>}

      {photos.length === 0 ? (
        <div className="empty-state">Não há fotos neste álbum.</div>
      ) : (
        <section className="photo-grid">
          {photos.map((photo) => (
            <PhotoCard
              key={photo._id}
              photo={photo}
              likesCount={photoLikes[photo._id] ?? 0}
              likedByMe={photoLikedByMe[photo._id] ?? false}
              commentsCount={(photoComments[photo._id] || []).length}
              onOpen={handleOpenPhoto}
              getImageUrl={getImageUrl}
              showAlbumLink={false}
            />
          ))}
        </section>
      )}

      <PhotoModal
        photo={selectedPhoto}
        isOpen={Boolean(selectedPhoto)}
        onClose={handleClosePhoto}
        user={user}
        likesCount={selectedPhotoData.likes}
        likedByMe={selectedPhotoData.likedByMe}
        comments={selectedPhotoData.comments}
        commentValue={selectedPhotoData.commentValue}
        onCommentChange={handleCommentChange}
        onCommentSubmit={handleCommentSubmit}
        onLike={handleLikePhoto}
        getImageUrl={getImageUrl}
      />
    </main>
  )
}

export default AlbumPage