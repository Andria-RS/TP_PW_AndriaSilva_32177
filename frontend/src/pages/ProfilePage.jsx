import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch } from '../services/api.js'
import CreateAlbumModal from '../components/CreateAlbumModal.jsx'
import CreatePhotoModal from '../components/CreatePhotoModal.jsx'

function ProfilePage() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('')

  const [isCreateAlbumOpen, setIsCreateAlbumOpen] =
    useState(false)

  const [isAddPhotoOpen, setIsAddPhotoOpen] =
    useState(false)

  const [openMenuId, setOpenMenuId] =
    useState(null)

  const [openPhotoMenuId, setOpenPhotoMenuId] =
    useState(null)

  const [editingAlbum, setEditingAlbum] =
    useState(null)

  const [editingPhoto, setEditingPhoto] =
    useState(null)

  useEffect(() => {
    fetchProfileData()
  }, [])

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

  const fetchProfileData = async () => {
    try {
      const [
        profileResponse,
        albumsResponse,
        photosResponse
      ] = await Promise.all([
        authFetch('/auth/me'),
        authFetch('/albums/mine'),
        authFetch('/photos/mine')
      ])

      const loadedAlbums = Array.isArray(
        albumsResponse
      )
        ? albumsResponse
        : Array.isArray(albumsResponse?.albums)
          ? albumsResponse.albums
          : []

      const loadedPhotos = Array.isArray(
        photosResponse
      )
        ? photosResponse
        : Array.isArray(photosResponse?.photos)
          ? photosResponse.photos
          : []

      setUser(profileResponse.user)
      setAlbums(loadedAlbums)
      setPhotos(loadedPhotos)
    } catch (error) {
      setStatus(
        error.message ||
          'Não foi possível carregar o perfil.'
      )

      navigate('/login')
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

  const handleOpenEditAlbum = (album) => {
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

  const handleOpenEditPhoto = (photo) => {
    setEditingPhoto(photo)
    setOpenPhotoMenuId(null)
    setIsAddPhotoOpen(true)
  }

  const handleClosePhotoModal = () => {
    setEditingPhoto(null)
    setIsAddPhotoOpen(false)
  }

  const getPhotoAlbumId = (photo) => {
    if (!photo?.albumId) {
      return ''
    }

    if (
      typeof photo.albumId === 'object' &&
      photo.albumId._id
    ) {
      return photo.albumId._id
    }

    return photo.albumId
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

      if (editingAlbum) {
        await authFetch(
          `/albums/${editingAlbum._id}`,
          {
            method: 'PUT',
            body: formData
          }
        )

        setStatus('Álbum atualizado')
      } else {
        await authFetch('/albums', {
          method: 'POST',
          body: formData
        })

        setStatus('Álbum criado')
      }

      handleCloseAlbumModal()
      await fetchProfileData()
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

      if (editingPhoto) {
        await authFetch(
          `/photos/${editingPhoto._id}`,
          {
            method: 'PUT',
            body: formData
          }
        )

        setStatus('Fotografia atualizada')
      } else {
        await authFetch('/photos', {
          method: 'POST',
          body: formData
        })

        setStatus('Fotografia adicionada')
      }

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

    if (!confirmed) {
      return
    }

    try {
      await authFetch(`/albums/${albumId}`, {
        method: 'DELETE'
      })

      setOpenMenuId(null)
      setStatus('Álbum apagado')

      await fetchProfileData()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleDeletePhoto = async (photoId) => {
    const confirmed = window.confirm(
      'Tens a certeza que queres apagar esta fotografia?'
    )

    if (!confirmed) {
      return
    }

    try {
      await authFetch(`/photos/${photoId}`, {
        method: 'DELETE'
      })

      setOpenPhotoMenuId(null)
      setStatus('Fotografia apagada')

      await fetchProfileData()
    } catch (error) {
      setStatus(error.message)
    }
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <p className="status-message">
          A carregar...
        </p>
      </div>
    )
  }

  return (
    <main className="app-shell">
      <header className="hero-banner">
        <div>
          <span>Perfil</span>

          <h1>
            Bem-vind@, {user.name}
          </h1>

          <p>
            Gere os teus álbuns e partilha as tuas fotos.
          </p>
        </div>

        <div className="header-actions">
          <Link
            className="button-link"
            to="/"
          >
            Voltar à página principal
          </Link>

          <button
            type="button"
            className="button-link"
            onClick={handleLogout}
          >
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
            <div className="empty-state">
              Ainda não criou álbuns.
            </div>
          ) : (
            <div className="photo-grid">
              {albums.map((album) => (
                <div
                  key={album._id}
                  className="album-card profile-album-card"
                >
                  <div className="album-card-menu-wrapper">
                    <button
                      type="button"
                      className="album-card-menu-button"
                      aria-label={
                        `Abrir opções do álbum ${album.name}`
                      }
                      aria-expanded={
                        openMenuId === album._id
                      }
                      onClick={() => {
                        setOpenMenuId((currentId) =>
                          currentId === album._id
                            ? null
                            : album._id
                        )
                      }}
                    >
                      ⋯
                    </button>

                    {openMenuId === album._id && (
                      <div className="album-card-menu">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEditAlbum(album)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="album-menu-delete"
                          onClick={() =>
                            handleDeleteAlbum(
                              album._id
                            )
                          }
                        >
                          Apagar
                        </button>
                      </div>
                    )}
                  </div>

                  {album.coverImageUrl ? (
                    <img
                      src={getImageUrl(
                        album.coverImageUrl
                      )}
                      alt={album.name}
                      className="album-cover"
                    />
                  ) : (
                    <div className="album-cover placeholder">
                      Sem capa
                    </div>
                  )}

                  <div className="photo-info">
                    <Link
                      to={`/albums/${album._id}`}
                      className="album-title-link"
                    >
                      <strong>{album.name}</strong>
                    </Link>

                    <span>
                      {album.theme || 'Sem tema'}
                    </span>

                    <p>
                      {album.description ||
                        'Sem descrição.'}
                    </p>

                    <small>
                      {album.isPublic
                        ? 'Público'
                        : 'Privado'}
                    </small>
                  </div>
                </div>
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
            <div className="empty-state">
              Ainda não adicionou fotos.
            </div>
          ) : (
            <div className="photo-grid small-grid">
              {photos.map((photo) => (
                <div
                  key={photo._id}
                  className="photo-card profile-photo-card"
                >
                  <div className="photo-card-menu-wrapper">
                    <button
                      type="button"
                      className="photo-card-menu-button"
                      aria-label={
                        `Abrir opções da fotografia ${photo.title}`
                      }
                      aria-expanded={
                        openPhotoMenuId === photo._id
                      }
                      onClick={() => {
                        setOpenPhotoMenuId(
                          (currentId) =>
                            currentId === photo._id
                              ? null
                              : photo._id
                        )
                      }}
                    >
                      ⋯
                    </button>

                    {openPhotoMenuId === photo._id && (
                      <div className="photo-card-menu">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEditPhoto(photo)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="photo-menu-delete"
                          onClick={() =>
                            handleDeletePhoto(
                              photo._id
                            )
                          }
                        >
                          Apagar
                        </button>
                      </div>
                    )}
                  </div>

                  <img
                    src={getImageUrl(
                      photo.imageUrl
                    )}
                    alt={photo.title}
                  />

                  <div className="photo-info">
                    <strong>{photo.title}</strong>

                    <span>
                      {photo.theme || 'Sem tema'}
                    </span>

                    <small>
                      {photo.isPublic
                        ? 'Público'
                        : 'Privado'}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}

          {status && (
            <p className="status-message">
              {status}
            </p>
          )}
        </aside>
      </section>

      <CreateAlbumModal
        isOpen={isCreateAlbumOpen}
        onClose={handleCloseAlbumModal}
        onSubmit={handleAlbumSubmit}
        initialValues={
          editingAlbum
            ? {
                name: editingAlbum.name,
                description:
                  editingAlbum.description || '',
                theme: editingAlbum.theme || '',
                isPublic: editingAlbum.isPublic,
                coverImageUrl:
                  editingAlbum.coverImageUrl || ''
              }
            : undefined
        }
      />

      <CreatePhotoModal
        isOpen={isAddPhotoOpen}
        onClose={handleClosePhotoModal}
        onSubmit={handleAddPhoto}
        albums={albums}
        initialValues={
          editingPhoto
            ? {
                title: editingPhoto.title || '',
                description:
                  editingPhoto.description || '',
                albumId: getPhotoAlbumId(
                  editingPhoto
                ),
                theme: editingPhoto.theme || '',
                isPublic:
                  editingPhoto.isPublic !== false,
                imageUrl:
                  editingPhoto.imageUrl || ''
              }
            : undefined
        }
      />
    </main>
  )
}

export default ProfilePage