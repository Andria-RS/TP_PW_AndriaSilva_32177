import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch, publicFetch } from '../services/api.js'
import PhotoCard from '../components/PhotoCard.jsx'
import PhotoModal from '../components/PhotoModal.jsx'
import CreateAlbumModal from '../components/CreateAlbumModal.jsx'
import CreatePhotoModal from '../components/CreatePhotoModal.jsx'
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

const getListFromResponse = (data, key) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.[key])) return data[key]

  return []
}

function HomePage() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  const [photoComments, setPhotoComments] = useState({})
  const [photoLikes, setPhotoLikes] = useState({})
  const [photoLikedByMe, setPhotoLikedByMe] = useState({})
  const [commentInput, setCommentInput] = useState({})
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [themeFilter, setThemeFilter] = useState('')
  const [selectedAlbum, setSelectedAlbum] = useState('')
  const [status, setStatus] = useState('')
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false)
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false)

  const featuredPhoto = photos[0] || null

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [user, themeFilter, selectedAlbum])

  const loadInitialData = async () => {
    const currentUser = await fetchCurrentUser()
    await fetchAlbums(Boolean(currentUser))
  }

  const fetchCurrentUser = async () => {
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

  const fetchAlbums = async (authenticated = hasToken()) => {
    try {
      setStatus('')

      const data = authenticated
        ? await authFetch('/albums/mine')
        : await publicFetch('/albums')

      const loadedAlbums = getListFromResponse(data, 'albums')

      setAlbums(loadedAlbums)
      return loadedAlbums
    } catch (error) {
      setAlbums([])
      setStatus(error.message || 'Não foi possível carregar os álbuns.')

      return []
    }
  }

  const fetchPhotos = async () => {
    try {
      const params = new URLSearchParams()

      if (themeFilter) {
        params.set('theme', themeFilter)
      }

      if (selectedAlbum) {
        params.set('albumId', selectedAlbum)
      }

      const query = params.toString()
        ? `?${params.toString()}`
        : ''

      const data = await publicFetch(`/photos${query}`)
      const loadedPhotos = getListFromResponse(data, 'photos')

      setPhotos(loadedPhotos)
      await loadPhotoData(loadedPhotos)
    } catch (error) {
      setStatus(error.message || 'Não foi possível carregar as fotografias.')
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

    if (!hasToken()) {
      setStatus('Tens de iniciar sessão para comentar.')
      return
    }

    const text = (commentInput[photoId] || '').trim()

    if (!text) return

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

  const handleEditComment = async (commentId, text) => {
    try {
      await authFetch(`/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ text })
      })

      if (selectedPhoto) {
        await fetchPhotoComments(selectedPhoto._id)
      }

      setStatus('Comentário atualizado.')
    } catch (error) {
      setStatus(error.message)
      throw error
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await authFetch(`/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (selectedPhoto) {
        await fetchPhotoComments(selectedPhoto._id)
      }

      setStatus('Comentário apagado.')
    } catch (error) {
      setStatus(error.message)
      throw error
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
      formData.append('description', description || '')
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

      setStatus('Álbum criado.')
      setIsCreateAlbumOpen(false)
      await fetchAlbums(true)
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleAddPhoto = async ({
    title,
    description,
    albumId,
    theme,
    isPublic,
    photoFile,
    imageUrl
  }) => {
    try {
      const formData = new FormData()

      formData.append('title', title)
      formData.append('description', description || '')
      formData.append('albumId', albumId || '')
      formData.append('theme', theme || '')
      formData.append('isPublic', String(isPublic))

      if (photoFile) {
        formData.append('image', photoFile)
      } else if (imageUrl) {
        formData.append('imageUrl', imageUrl)
      }

      await authFetch('/photos', {
        method: 'POST',
        body: formData
      })

      setStatus('Fotografia adicionada.')
      setIsAddPhotoOpen(false)

      await fetchAlbums(true)
      await fetchPhotos()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const selectedPhotoId = selectedPhoto?._id

  return (
    <main className="app-shell lumen-home">
      <Navbar />

      <section className="lumen-hero">
        <div className="lumen-hero-copy">
          <h1>Descobre o mundo através de outras lentes</h1>

          <p>
            Explora fotografias, encontra novas perspetivas e partilha os teus melhores momentos na Lumen.
          </p>

          <div className="lumen-hero-actions">
            <button
              type="button"
              className="button-link"
              onClick={() => setIsCreateAlbumOpen(true)}
            >
              Criar álbum
            </button>

            {user && (
              <button
                type="button"
                className="button-link"
                onClick={() => setIsAddPhotoOpen(true)}
              >
                Publicar fotografia
              </button>
            )}
          </div>
        </div>

        <div className="lumen-hero-image-card">
          {featuredPhoto?.imageUrl ? (
            <img
              src={getImageUrl(featuredPhoto.imageUrl)}
              alt={featuredPhoto.title || 'Fotografia em destaque'}
            />
          ) : (
            <div className="lumen-hero-placeholder">
              <div>
                <strong>Sem fotografia em destaque</strong>
                <p>
                  Adiciona fotos públicas para dar vida à homepage da Lumen.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="lumen-section-header">
        <h2>Fotografias recentes</h2>

        <button
          type="button"
          className="lumen-inline-action"
          onClick={() => navigate('/explore')}
        >
          Ver todas →
        </button>
      </section>

      {photos.length === 0 ? (
        <div className="empty-state">
          Nenhuma fotografia encontrada.
        </div>
      ) : (
        <section className="lumen-photo-row">
          {photos.slice(0, 4).map((photo) => (
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
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        getImageUrl={getImageUrl}
      />

      <CreateAlbumModal
        isOpen={isCreateAlbumOpen}
        onClose={() => setIsCreateAlbumOpen(false)}
        onSubmit={handleCreateAlbum}
      />

      <CreatePhotoModal
        isOpen={isAddPhotoOpen}
        onClose={() => setIsAddPhotoOpen(false)}
        onSubmit={handleAddPhoto}
        albums={albums}
      />

      {status && (
        <p className="status-message home-status">{status}</p>
      )}
    </main>
  )
}

export default HomePage