import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch, publicFetch } from '../services/api.js'
import PhotoCard from '../components/PhotoCard.jsx'
import PhotoModal from '../components/PhotoModal.jsx'
import CreateAlbumModal from '../components/CreateAlbumModal.jsx'
import CreatePhotoModal from '../components/CreatePhotoModal.jsx'
import Navbar from '../components/Navbar.jsx'

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
  const [photoLikedByMe, setPhotoLikedByMe] = useState({})
  const [commentInput, setCommentInput] = useState({})
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false)
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
    fetchAlbums()
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [user, themeFilter, selectedAlbum])

  const featuredPhoto = photos[0] || null

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return ''
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl
    }

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

  const fetchPhotos = async () => {
    try {
      const params = []

      if (themeFilter) {
        params.push(
          `theme=${encodeURIComponent(themeFilter)}`
        )
      }

      if (selectedAlbum) {
        params.push(
          `albumId=${encodeURIComponent(selectedAlbum)}`
        )
      }

      const query = params.length
        ? `?${params.join('&')}`
        : ''

      const data = await publicFetch(`/photos${query}`)

      setPhotos(data)

      const likesEntries = await Promise.all(
        data.map(async (photo) => {
          try {
            const response = user
              ? await authFetch(`/likes/photo/${photo._id}`)
              : await publicFetch(`/likes/photo/${photo._id}`)

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
        data.map(async (photo) => {
          try {
            const response = await publicFetch(
              `/comments/photo/${photo._id}`
            )

            return [photo._id, response]
          } catch {
            return [photo._id, []]
          }
        })
      )

      const likesMap = {}
      const likedMap = {}

      likesEntries.forEach(
        ({ id, likes, likedByMe }) => {
          likesMap[id] = likes
          likedMap[id] = likedByMe
        }
      )

      setPhotoLikes(likesMap)
      setPhotoLikedByMe(likedMap)
      setPhotoComments(
        Object.fromEntries(commentsEntries)
      )
    } catch (error) {
      setStatus(error.message)
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
      const response = user
        ? await authFetch(`/likes/photo/${photoId}`)
        : await publicFetch(`/likes/photo/${photoId}`)

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

    const text = (
      commentInput[photoId] || ''
    ).trim()

    if (!text) {
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
      setStatus('Comentário adicionado')
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

      setStatus('Comentário atualizado')
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

      setStatus('Comentário apagado')
    } catch (error) {
      setStatus(error.message)
      throw error
    }
  }

  const handleLikePhoto = async (photoId) => {
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
      formData.append(
        'description',
        description || ''
      )
      formData.append('theme', theme)
      formData.append(
        'isPublic',
        String(isPublic)
      )

      if (coverImageFile) {
        formData.append(
          'coverImage',
          coverImageFile
        )
      } else if (coverImageUrl) {
        formData.append(
          'coverImageUrl',
          coverImageUrl
        )
      }

      await authFetch('/albums', {
        method: 'POST',
        body: formData
      })

      setStatus('Álbum criado')
      setIsCreateAlbumOpen(false)

      await fetchAlbums()
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
      formData.append(
        'description',
        description || ''
      )
      formData.append(
        'albumId',
        albumId || ''
      )
      formData.append(
        'theme',
        theme || ''
      )
      formData.append(
        'isPublic',
        String(isPublic)
      )

      if (photoFile) {
        formData.append('image', photoFile)
      } else if (imageUrl) {
        formData.append('imageUrl', imageUrl)
      }

      await authFetch('/photos', {
        method: 'POST',
        body: formData
      })

      setStatus('Fotografia adicionada')
      setIsAddPhotoOpen(false)

      await fetchAlbums()
      await fetchPhotos()
    } catch (error) {
      setStatus(error.message)
    }
  }

  return (
    <main className="app-shell lumen-home">
      <Navbar />

      <section className="lumen-hero">
        <div className="lumen-hero-copy">
          <h1>
            Descobre o mundo através de outras lentes
          </h1>

          <p>
            Explora fotografias, encontra novas
            perspetivas e partilha os teus melhores
            momentos na Lumen.
          </p>

          <div className="lumen-hero-actions">
            <button
              type="button"
              className="button-link"
              onClick={() =>
                setIsCreateAlbumOpen(true)
              }
            >
              Criar álbum
            </button>

            {user && (
              <button
                type="button"
                className="button-link"
                onClick={() =>
                  setIsAddPhotoOpen(true)
                }
              >
                Publicar fotografia
              </button>
            )}
          </div>
        </div>

        <div className="lumen-hero-image-card">
          {featuredPhoto?.imageUrl ? (
            <img
              src={getImageUrl(
                featuredPhoto.imageUrl
              )}
              alt={featuredPhoto.title}
            />
          ) : (
            <div className="lumen-hero-placeholder">
              <div>
                <strong>
                  Sem fotografia em destaque
                </strong>

                <p>
                  Adiciona fotos públicas para dar
                  vida à homepage da Lumen.
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
        commentValue={
          selectedPhoto
            ? commentInput[selectedPhoto._id] || ''
            : ''
        }
        onCommentChange={handleCommentChange}
        onCommentSubmit={handleCommentSubmit}
        onLike={handleLikePhoto}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        getImageUrl={getImageUrl}
      />

      <CreateAlbumModal
        isOpen={isCreateAlbumOpen}
        onClose={() =>
          setIsCreateAlbumOpen(false)
        }
        onSubmit={handleCreateAlbum}
      />

      <CreatePhotoModal
        isOpen={isAddPhotoOpen}
        onClose={() =>
          setIsAddPhotoOpen(false)
        }
        onSubmit={handleAddPhoto}
        albums={albums}
      />

      {status && (
        <p className="status-message home-status">
          {status}
        </p>
      )}
    </main>
  )
}

export default HomePage