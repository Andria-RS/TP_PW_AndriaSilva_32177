import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch } from '../services/api.js'
import CreateAlbumModal from '../components/CreateAlbumModal.jsx'
import CreatePhotoModal from '../components/CreatePhotoModal.jsx'

const API_URL = 'http://localhost:4000'

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

const getPhotoAlbumId = (photo) => {
  if (!photo?.albumId) return ''

  return typeof photo.albumId === 'object'
    ? photo.albumId._id || ''
    : photo.albumId
}

function AlbumCard({
  album,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onDelete
}) {
  return (
    <article className="album-card profile-album-card">
      <div className="album-card-menu-wrapper">
        <button
          type="button"
          className="album-card-menu-button"
          aria-label={`Abrir opções do álbum ${album.name}`}
          aria-expanded={isMenuOpen}
          onClick={() => onToggleMenu(album._id)}
        >
          ⋯
        </button>

        {isMenuOpen && (
          <div className="album-card-menu">
            <button type="button" onClick={() => onEdit(album)}>
              Editar
            </button>

            <button
              type="button"
              className="album-menu-delete"
              onClick={() => onDelete(album._id)}
            >
              Apagar
            </button>
          </div>
        )}
      </div>

      {album.coverImageUrl ? (
        <img
          src={getImageUrl(album.coverImageUrl)}
          alt={album.name}
          className="album-cover"
        />
      ) : (
        <div className="album-cover placeholder">Sem capa</div>
      )}

      <div className="photo-info">
        <Link to={`/albums/${album._id}`} className="album-title-link">
          <strong>{album.name}</strong>
        </Link>

        <span>{album.theme || 'Sem tema'}</span>

        <p>{album.description || 'Sem descrição.'}</p>

        <small>{album.isPublic ? 'Público' : 'Privado'}</small>
      </div>
    </article>
  )
}

function ProfilePhotoCard({
  photo,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onDelete
}) {
  return (
    <article className="photo-card profile-photo-card">
      <div className="photo-card-menu-wrapper">
        <button
          type="button"
          className="photo-card-menu-button"
          aria-label={`Abrir opções da fotografia ${photo.title}`}
          aria-expanded={isMenuOpen}
          onClick={() => onToggleMenu(photo._id)}
        >
          ⋯
        </button>

        {isMenuOpen && (
          <div className="photo-card-menu">
            <button type="button" onClick={() => onEdit(photo)}>
              Editar
            </button>

            <button
              type="button"
              className="photo-menu-delete"
              onClick={() => onDelete(photo._id)}
            >
              Apagar
            </button>
          </div>
        )}
      </div>

      <img src={getImageUrl(photo.imageUrl)} alt={photo.title} />

      <div className="photo-info">
        <strong>{photo.title}</strong>
        <span>{photo.theme || 'Sem tema'}</span>
        <small>{photo.isPublic ? 'Público' : 'Privado'}</small>
      </div>
    </article>
  )
}

function ProfilePage() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [openMenuId, setOpenMenuId] = useState(null)
  const [openPhotoMenuId, setOpenPhotoMenuId] = useState(null)
  const [editingAlbum, setEditingAlbum] = useState(null)
  const [editingPhoto, setEditingPhoto] = useState(null)

  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false)
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false)

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)

      const [profileResponse, albumsResponse, photosResponse] =
        await Promise.all([
          authFetch('/auth/me'),
          authFetch('/albums/mine'),
          authFetch('/photos/mine')
        ])

      setUser(profileResponse.user)
      setAlbums(getListFromResponse(albumsResponse, 'albums'))
      setPhotos(getListFromResponse(photosResponse, 'photos'))
    } catch (error) {
      setStatus(error.message || 'Não foi possível carregar o perfil.')
      navigate('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleOpenCreateAlbum = () => {
    setEditingAlbum(null)
    setOpenMenuId(null)
    setIsCreateAlbumOpen(true)
  }

  const handleEditAlbum = (album) => {
    setEditingAlbum(album)
    setOpenMenuId(null)
    setIsCreateAlbumOpen(true)
  }

  const handleCloseAlbumModal = () => {
    setEditingAlbum(null)
    setIsCreateAlbumOpen(false)
  }

  const handleOpenCreatePhoto = () => {
    setEditingPhoto(null)
    setOpenPhotoMenuId(null)
    setIsAddPhotoOpen(true)
  }

  const handleEditPhoto = (photo) => {
    setEditingPhoto(photo)
    setOpenPhotoMenuId(null)
    setIsAddPhotoOpen(true)
  }

  const handleClosePhotoModal = () => {
    setEditingPhoto(null)
    setIsAddPhotoOpen(false)
  }

  const handleAlbumSubmit = async ({
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

      const url = editingAlbum
        ? `/albums/${editingAlbum._id}`
        : '/albums'

      await authFetch(url, {
        method: editingAlbum ? 'PUT' : 'POST',
        body: formData
      })

      setStatus(
        editingAlbum ? 'Álbum atualizado.' : 'Álbum criado.'
      )

      handleCloseAlbumModal()
      await fetchProfileData()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handlePhotoSubmit = async ({
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

      const url = editingPhoto
        ? `/photos/${editingPhoto._id}`
        : '/photos'

      await authFetch(url, {
        method: editingPhoto ? 'PUT' : 'POST',
        body: formData
      })

      setStatus(
        editingPhoto
          ? 'Fotografia atualizada.'
          : 'Fotografia adicionada.'
      )

      handleClosePhotoModal()
      await fetchProfileData()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleDeleteAlbum = async (albumId) => {
    const confirmed = window.confirm(
      'Tens a certeza que queres apagar este álbum?'
    )

    if (!confirmed) return

    try {
      await authFetch(`/albums/${albumId}`, {
        method: 'DELETE'
      })

      setOpenMenuId(null)
      setStatus('Álbum apagado.')
      await fetchProfileData()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleDeletePhoto = async (photoId) => {
    const confirmed = window.confirm(
      'Tens a certeza que queres apagar esta fotografia?'
    )

    if (!confirmed) return

    try {
      await authFetch(`/photos/${photoId}`, {
        method: 'DELETE'
      })

      setOpenPhotoMenuId(null)
      setStatus('Fotografia apagada.')
      await fetchProfileData()
    } catch (error) {
      setStatus(error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="auth-shell">
        <p className="status-message">A carregar...</p>
      </div>
    )
  }

  if (!user) return null

  const albumInitialValues = editingAlbum
    ? {
        name: editingAlbum.name || '',
        description: editingAlbum.description || '',
        theme: editingAlbum.theme || '',
        isPublic: editingAlbum.isPublic !== false,
        coverImageUrl: editingAlbum.coverImageUrl || ''
      }
    : undefined

  const photoInitialValues = editingPhoto
    ? {
        title: editingPhoto.title || '',
        description: editingPhoto.description || '',
        albumId: getPhotoAlbumId(editingPhoto),
        theme: editingPhoto.theme || '',
        isPublic: editingPhoto.isPublic !== false,
        imageUrl: editingPhoto.imageUrl || ''
      }
    : undefined

  return (
    <main className="app-shell">
      <header className="hero-banner">
        <div>
          <span>Perfil</span>

          <h1>Bem-vind@, {user.name}</h1>

          <p>Gere os teus álbuns e partilha as tuas fotos.</p>
        </div>

        <div className="header-actions">
          <Link to="/" className="button-link">
            Voltar à página principal
          </Link>

          <button type="button" className="button-link" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <section className="content-grid">
        <article className="photo-panel">
          <div className="panel-header">
            <h2>Os meus álbuns</h2>

            <button
              type="button"
              className="button-link"
              onClick={handleOpenCreateAlbum}
            >
              Criar álbum
            </button>
          </div>

          {albums.length === 0 ? (
            <div className="empty-state">Ainda não criaste álbuns.</div>
          ) : (
            <div className="photo-grid">
              {albums.map((album) => (
                <AlbumCard
                  key={album._id}
                  album={album}
                  isMenuOpen={openMenuId === album._id}
                  onToggleMenu={(id) =>
                    setOpenMenuId((currentId) =>
                      currentId === id ? null : id
                    )
                  }
                  onEdit={handleEditAlbum}
                  onDelete={handleDeleteAlbum}
                />
              ))}
            </div>
          )}
        </article>

        <aside className="form-panel">
          <div className="panel-header">
            <h2>As minhas fotos</h2>

            <button
              type="button"
              className="button-link"
              onClick={handleOpenCreatePhoto}
            >
              Publicar foto
            </button>
          </div>

          {photos.length === 0 ? (
            <div className="empty-state">Ainda não adicionaste fotos.</div>
          ) : (
            <div className="photo-grid small-grid">
              {photos.map((photo) => (
                <ProfilePhotoCard
                  key={photo._id}
                  photo={photo}
                  isMenuOpen={openPhotoMenuId === photo._id}
                  onToggleMenu={(id) =>
                    setOpenPhotoMenuId((currentId) =>
                      currentId === id ? null : id
                    )
                  }
                  onEdit={handleEditPhoto}
                  onDelete={handleDeletePhoto}
                />
              ))}
            </div>
          )}

          {status && <p className="status-message">{status}</p>}
        </aside>
      </section>

      <CreateAlbumModal
        isOpen={isCreateAlbumOpen}
        onClose={handleCloseAlbumModal}
        onSubmit={handleAlbumSubmit}
        initialValues={albumInitialValues}
      />

      <CreatePhotoModal
        isOpen={isAddPhotoOpen}
        onClose={handleClosePhotoModal}
        onSubmit={handlePhotoSubmit}
        albums={albums}
        initialValues={photoInitialValues}
      />
    </main>
  )
}

export default ProfilePage