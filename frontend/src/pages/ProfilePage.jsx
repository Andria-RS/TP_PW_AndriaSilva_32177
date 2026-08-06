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
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false)
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false)

  useEffect(() => {
    fetchProfileData()
  }, [])

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return ''

    if (imageUrl.startsWith('http')) {
      return imageUrl
    }

    return `http://localhost:4000${imageUrl}`
  }

  const fetchProfileData = async () => {
    try {
      const [profile, userAlbums, allPhotos] = await Promise.all([
        authFetch('/auth/me'),
        authFetch('/albums/mine'),
        authFetch('/photos/mine')
      ])

      setUser(profile.user)
      setAlbums(userAlbums)
      setPhotos(allPhotos)
    } catch (error) {
      setStatus(error.message)
      navigate('/login')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
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

      setStatus('Álbum criado')
      setIsCreateAlbumOpen(false)

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

      setStatus('Fotografia adicionada')
      setIsAddPhotoOpen(false)

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

      setStatus('Álbum apagado')

      await fetchProfileData()
    } catch (error) {
      setStatus(error.message)
    }
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <p className="status-message">A carregar...</p>
      </div>
    )
  }

  return (
    <main className="app-shell">
      <header className="hero-banner">
        <div>
          <span>Perfil</span>

          <h1>Bem-vind@, {user.name}</h1>

          <p>Gere os teus álbuns e partilha as tuas fotos.</p>
        </div>

        <div className="header-actions">
          <Link className="button-link" to="/">
            Voltar à galeria
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
              onClick={() => setIsCreateAlbumOpen(true)}
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
                <div key={album._id} className="album-card">
                  {album.coverImageUrl ? (
                    <img
                      src={getImageUrl(album.coverImageUrl)}
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

                    <span>{album.theme}</span>

                    <p>
                      {album.description || 'Sem descrição.'}
                    </p>

                    <small>
                      {album.isPublic ? 'Público' : 'Privado'}
                    </small>

                    <div className="album-card-actions">
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDeleteAlbum(album._id)}
                      >
                        Apagar
                      </button>
                    </div>
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
              onClick={() => setIsAddPhotoOpen(true)}
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
                <div key={photo._id} className="photo-card">
                  <img
                    src={getImageUrl(photo.imageUrl)}
                    alt={photo.title}
                  />

                  <div className="photo-info">
                    <strong>{photo.title}</strong>
                    <span>{photo.theme}</span>
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
        onClose={() => setIsCreateAlbumOpen(false)}
        onSubmit={handleCreateAlbum}
      />

      <CreatePhotoModal
        isOpen={isAddPhotoOpen}
        onClose={() => setIsAddPhotoOpen(false)}
        onSubmit={handleAddPhoto}
        albums={albums}
      />
    </main>
  )
}

export default ProfilePage