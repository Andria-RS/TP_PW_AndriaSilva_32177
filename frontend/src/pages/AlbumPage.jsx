import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authFetch, publicFetch } from '../services/api.js'
import PhotoCard from '../components/PhotoCard.jsx'
import PhotoModal from '../components/PhotoModal.jsx'

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

  useEffect(() => {
    fetchAlbum()
    fetchCurrentUser()
  }, [albumId])

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

  const fetchAlbum = async () => {
    try {
      const data = await publicFetch(`/albums/${albumId}`)
      setAlbum(data.album)
      setPhotos(data.photos)

      const likesEntries = await Promise.all(
        data.photos.map(async (photo) => {
          try {
            const response = await authFetch(`/likes/photo/${photo._id}`)
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
        })
      )

      const commentsEntries = await Promise.all(
        data.photos.map(async (photo) => {
          try {
            const response = await publicFetch(`/comments/photo/${photo._id}`)
            return [photo._id, response]
          } catch {
            return [photo._id, []]
          }
        })
      )

      setPhotoLikes(Object.fromEntries(likesEntries.map(({ id, likes }) => [id, likes])))
      setPhotoLikedByMe(Object.fromEntries(likesEntries.map(({ id, likedByMe }) => [id, likedByMe])))
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
      const response = await authFetch(`/likes/photo/${photoId}`)
      setPhotoLikes((prev) => ({ ...prev, [photoId]: response.likes || 0 }))
      setPhotoLikedByMe((prev) => ({ ...prev, [photoId]: Boolean(response.likedByMe) }))
    } catch {
      setPhotoLikes((prev) => ({ ...prev, [photoId]: 0 }))
      setPhotoLikedByMe((prev) => ({ ...prev, [photoId]: false }))
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
      const response = await authFetch(`/likes/photo/${photoId}`, {
        method: 'POST'
      })

      setPhotoLikes((prev) => ({ ...prev, [photoId]: response.likes || 0 }))
      setPhotoLikedByMe((prev) => ({ ...prev, [photoId]: Boolean(response.likedByMe) }))
      setStatus(response.message || 'Gostei atualizado')
    } catch (error) {
      setStatus(error.message)
    }
  }

  if (!album) {
    return (
      <div className="auth-shell">
        <p className="status-message">A carregar álbum...</p>
      </div>
    )
  }

  return (
    <main className="app-shell">
      <div className="hero-banner">
        <span>Álbum</span>
        <h1>{album.name}</h1>
        <p>{album.description}</p>

        {album.coverImageUrl && (
          <img
            src={getImageUrl(album.coverImageUrl)}
            alt={album.name}
            className="album-cover album-banner-cover"
          />
        )}

        <Link className="button-link" to="/">
          Voltar à galeria
        </Link>
      </div>

      {photos.length === 0 ? (
        <div className="empty-state">Não há fotos neste álbum.</div>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <PhotoCard
              key={photo._id}
              photo={photo}
              likesCount={photoLikes[photo._id] ?? 0}
              likedByMe={photoLikedByMe[photo._id] ?? false}
              commentsCount={(photoComments[photo._id] || []).length}
              onOpen={handleOpenPhoto}
              getImageUrl={getImageUrl}
            />
          ))}
        </div>
      )}

      <PhotoModal
        photo={selectedPhoto}
        isOpen={Boolean(selectedPhoto)}
        onClose={handleClosePhoto}
        user={user}
        likesCount={selectedPhoto ? photoLikes[selectedPhoto._id] ?? 0 : 0}
        likedByMe={selectedPhoto ? photoLikedByMe[selectedPhoto._id] ?? false : false}
        comments={selectedPhoto ? photoComments[selectedPhoto._id] || [] : []}
        commentValue={selectedPhoto ? commentInput[selectedPhoto._id] || '' : ''}
        onCommentChange={handleCommentChange}
        onCommentSubmit={handleCommentSubmit}
        onLike={handleLikePhoto}
        getImageUrl={getImageUrl}
      />

      {status && <p className="status-message">{status}</p>}
    </main>
  )
}

export default AlbumPage