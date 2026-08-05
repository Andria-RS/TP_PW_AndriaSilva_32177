import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch } from '../services/api.js'
import { ALLOWED_THEMES } from '../constants/themes.js'

const initialAlbumForm = {
  name: '',
  description: '',
  theme: '',
  isPublic: true,
  coverImageUrl: ''
}

const initialEditAlbumForm = {
  name: '',
  description: '',
  theme: '',
  isPublic: true,
  coverImageUrl: ''
}

const initialPhotoForm = {
  title: '',
  imageUrl: '',
  description: '',
  albumId: '',
  theme: ''
}

function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  const [albumForm, setAlbumForm] = useState(initialAlbumForm)
  const [photoForm, setPhotoForm] = useState(initialPhotoForm)
  const [imageFile, setImageFile] = useState(null)
  const [coverImageFile, setCoverImageFile] = useState(null)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingAlbumId, setEditingAlbumId] = useState(null)
  const [editAlbumForm, setEditAlbumForm] = useState(initialEditAlbumForm)
  const [editCoverImageFile, setEditCoverImageFile] = useState(null)

  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchProfileData()
  }, [])

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('http')) return imageUrl
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

  const resetAlbumForm = () => {
    setAlbumForm(initialAlbumForm)
    setCoverImageFile(null)
  }

  const resetPhotoForm = () => {
    setPhotoForm(initialPhotoForm)
    setImageFile(null)
  }

  const openEditAlbumModal = (album) => {
    setEditingAlbumId(album._id)
    setEditAlbumForm({
      name: album.name || '',
      description: album.description || '',
      theme: album.theme || '',
      isPublic: Boolean(album.isPublic),
      coverImageUrl: album.coverImageUrl || ''
    })
    setEditCoverImageFile(null)
    setIsEditModalOpen(true)
    setStatus('')
  }

  const closeEditAlbumModal = () => {
    setIsEditModalOpen(false)
    setEditingAlbumId(null)
    setEditAlbumForm(initialEditAlbumForm)
    setEditCoverImageFile(null)
  }

  const handleDeleteAlbum = async (albumId) => {
    const confirmed = window.confirm('Tens a certeza que queres apagar este álbum?')
    if (!confirmed) return

    try {
      await authFetch(`/albums/${albumId}`, {
        method: 'DELETE'
      })

      if (editingAlbumId === albumId) {
        closeEditAlbumModal()
      }

      setStatus('Álbum apagado')
      fetchProfileData()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleAlbumSubmit = async (event) => {
    event.preventDefault()

    if (!coverImageFile && !albumForm.coverImageUrl) {
      setStatus('Seleciona uma imagem para a capa ou introduz uma URL válida')
      return
    }

    const formData = new FormData()
    formData.append('name', albumForm.name)
    formData.append('description', albumForm.description)
    formData.append('theme', albumForm.theme)
    formData.append('isPublic', String(albumForm.isPublic))

    if (coverImageFile) {
      formData.append('coverImage', coverImageFile)
    } else {
      formData.append('coverImageUrl', albumForm.coverImageUrl)
    }

    try {
      await authFetch('/albums', {
        method: 'POST',
        body: formData
      })

      resetAlbumForm()
      setStatus('Álbum criado')
      fetchProfileData()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleEditAlbumSubmit = async (event) => {
    event.preventDefault()

    if (!editingAlbumId) return

    const formData = new FormData()
    formData.append('name', editAlbumForm.name)
    formData.append('description', editAlbumForm.description)
    formData.append('theme', editAlbumForm.theme)
    formData.append('isPublic', String(editAlbumForm.isPublic))

    if (editCoverImageFile) {
      formData.append('coverImage', editCoverImageFile)
    } else if (editAlbumForm.coverImageUrl) {
      formData.append('coverImageUrl', editAlbumForm.coverImageUrl)
    }

    try {
      await authFetch(`/albums/${editingAlbumId}`, {
        method: 'PUT',
        body: formData
      })

      closeEditAlbumModal()
      setStatus('Álbum atualizado')
      fetchProfileData()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handlePhotoSubmit = async (event) => {
    event.preventDefault()

    if (!imageFile && !photoForm.imageUrl) {
      setStatus('Seleciona uma imagem ou introduz uma URL válida')
      return
    }

    const formData = new FormData()
    formData.append('title', photoForm.title)
    formData.append('description', photoForm.description)
    formData.append('albumId', photoForm.albumId)
    formData.append('theme', photoForm.theme)

    if (imageFile) {
      formData.append('image', imageFile)
    } else {
      formData.append('imageUrl', photoForm.imageUrl)
    }

    try {
      await authFetch('/photos', {
        method: 'POST',
        body: formData
      })

      resetPhotoForm()
      setStatus('Foto adicionada')
      fetchProfileData()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
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
          <h1>Bem-vindo, {user.name}</h1>
          <p>Gere os teus álbuns e partilha as tuas fotos.</p>
        </div>

        <div className="header-actions">
          <Link className="button-link" to="/">Voltar à galeria</Link>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <section className="content-grid">
        <article className="photo-panel">
          <div className="panel-header">
            <h2>Os meus álbuns</h2>
          </div>

          {albums.length === 0 ? (
            <div className="empty-state">Ainda não criou álbuns.</div>
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
                    <div className="album-cover placeholder">Sem capa</div>
                  )}

                  <div className="photo-info">
                    <Link to={`/albums/${album._id}`} className="album-title-link">
                      <strong>{album.name}</strong>
                    </Link>
                    <span>{album.theme}</span>
                    <p>{album.description}</p>
                    <small>{album.isPublic ? 'Público' : 'Privado'}</small>

                    <div className="album-card-actions">
                      <button type="button" onClick={() => openEditAlbumModal(album)}>
                        Editar
                      </button>
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
          <h2>Criar álbum</h2>

          <form onSubmit={handleAlbumSubmit}>
            <label>
              Nome do álbum
              <input
                name="name"
                value={albumForm.name}
                onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
                required
              />
            </label>

            <label>
              Tema
              <select
                name="theme"
                value={albumForm.theme}
                onChange={(e) => setAlbumForm({ ...albumForm, theme: e.target.value })}
                required
              >
                <option value="">Seleciona um tema</option>
                {ALLOWED_THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Descrição
              <textarea
                name="description"
                value={albumForm.description}
                onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
              />
            </label>

            <label>
              Capa do álbum
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
              />
            </label>

            <label>
              Ou introduz uma URL da capa
              <input
                name="coverImageUrl"
                value={albumForm.coverImageUrl}
                onChange={(e) => setAlbumForm({ ...albumForm, coverImageUrl: e.target.value })}
              />
            </label>

            <label>
              Público?
              <select
                value={String(albumForm.isPublic)}
                onChange={(e) =>
                  setAlbumForm({ ...albumForm, isPublic: e.target.value === 'true' })
                }
              >
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </label>

            <button type="submit">Criar álbum</button>
          </form>

          <h2>Adicionar foto</h2>

          <form onSubmit={handlePhotoSubmit}>
            <label>
              Título
              <input
                name="title"
                value={photoForm.title}
                onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                required
              />
            </label>

            <label>
              Imagem
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </label>

            <label>
              Ou introduz uma URL
              <input
                name="imageUrl"
                value={photoForm.imageUrl}
                onChange={(e) => setPhotoForm({ ...photoForm, imageUrl: e.target.value })}
              />
            </label>

            <label>
              Álbum
              <select
                value={photoForm.albumId}
                onChange={(e) => setPhotoForm({ ...photoForm, albumId: e.target.value })}
              >
                <option value="">Nenhum</option>
                {albums.map((album) => (
                  <option key={album._id} value={album._id}>
                    {album.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tema
              <select
                name="theme"
                value={photoForm.theme}
                onChange={(e) => setPhotoForm({ ...photoForm, theme: e.target.value })}
              >
                <option value="">Seleciona um tema</option>
                {ALLOWED_THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Descrição
              <textarea
                name="description"
                value={photoForm.description}
                onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })}
              />
            </label>

            <button type="submit">Adicionar foto</button>
          </form>

          <h2>As minhas fotos</h2>

          {photos.length === 0 ? (
            <div className="empty-state">Ainda não adicionou fotos.</div>
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

          {status && <p className="status-message">{status}</p>}
        </aside>
      </section>

      {isEditModalOpen && (
        <div className="photo-modal-backdrop" onClick={closeEditAlbumModal}>
          <div className="album-edit-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="photo-modal-close"
              onClick={closeEditAlbumModal}
            >
              ✕
            </button>

            <h2>Editar álbum</h2>

            <form onSubmit={handleEditAlbumSubmit} className="album-edit-form">
              <label>
                Nome do álbum
                <input
                  name="name"
                  value={editAlbumForm.name}
                  onChange={(e) => setEditAlbumForm({ ...editAlbumForm, name: e.target.value })}
                  required
                />
              </label>

              <label>
                Tema
                <select
                  name="theme"
                  value={editAlbumForm.theme}
                  onChange={(e) => setEditAlbumForm({ ...editAlbumForm, theme: e.target.value })}
                  required
                >
                  <option value="">Seleciona um tema</option>
                  {ALLOWED_THEMES.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Descrição
                <textarea
                  name="description"
                  value={editAlbumForm.description}
                  onChange={(e) =>
                    setEditAlbumForm({ ...editAlbumForm, description: e.target.value })
                  }
                />
              </label>

              <label>
                Nova capa do álbum
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditCoverImageFile(e.target.files?.[0] || null)}
                />
              </label>

              <label>
                Ou introduz uma URL da capa
                <input
                  name="coverImageUrl"
                  value={editAlbumForm.coverImageUrl}
                  onChange={(e) =>
                    setEditAlbumForm({ ...editAlbumForm, coverImageUrl: e.target.value })
                  }
                />
              </label>

              <label>
                Público?
                <select
                  value={String(editAlbumForm.isPublic)}
                  onChange={(e) =>
                    setEditAlbumForm({ ...editAlbumForm, isPublic: e.target.value === 'true' })
                  }
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </label>

              <div className="form-actions">
                <button type="submit">Guardar alterações</button>
                <button type="button" className="button-link" onClick={closeEditAlbumModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default ProfilePage