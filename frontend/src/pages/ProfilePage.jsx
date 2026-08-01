import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, publicFetch } from '../services/api.js'

function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  const [albumForm, setAlbumForm] = useState({ name: '', description: '', theme: '', isPublic: true, coverImageUrl: '' })
  const [photoForm, setPhotoForm] = useState({ title: '', imageUrl: '', description: '', albumId: '', theme: '' })
  const [imageFile, setImageFile] = useState(null)
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchProfileData()
  }, [])

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
      setAlbumForm({ name: '', description: '', theme: '', isPublic: true, coverImageUrl: '' })
      setCoverImageFile(null)
      setStatus('Álbum criado')
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
      setPhotoForm({ title: '', imageUrl: '', description: '', albumId: '', theme: '' })
      setImageFile(null)
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
    return <div className="auth-shell"><p className="status-message">A carregar...</p></div>
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
          {albums.length === 0 ? <div className="empty-state">Ainda não criou álbuns.</div> : (
            <div className="photo-grid">
              {albums.map((album) => (
                <div key={album._id} className="album-card">
                  {album.coverImageUrl ? (
                    <img src={album.coverImageUrl} alt={album.name} className="album-cover" />
                  ) : (
                    <div className="album-cover placeholder">Sem capa</div>
                  )}
                  <div className="photo-info">
                    <Link to={`/albums/${album._id}`} className="album-title-link"><strong>{album.name}</strong></Link>
                    <span>{album.theme}</span>
                    <p>{album.description}</p>
                    <small>{album.isPublic ? 'Público' : 'Privado'}</small>
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
              <input name="name" value={albumForm.name} onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })} required />
            </label>
            <label>
              Tema
              <input name="theme" value={albumForm.theme} onChange={(e) => setAlbumForm({ ...albumForm, theme: e.target.value })} required />
            </label>
            <label>
              Descrição
              <textarea name="description" value={albumForm.description} onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })} />
            </label>
            <label>
              Capa do álbum
              <input type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)} />
            </label>
            <label>
              Ou introduz uma URL da capa
              <input name="coverImageUrl" value={albumForm.coverImageUrl} onChange={(e) => setAlbumForm({ ...albumForm, coverImageUrl: e.target.value })} />
            </label>
            <label>
              Público?
              <select value={String(albumForm.isPublic)} onChange={(e) => setAlbumForm({ ...albumForm, isPublic: e.target.value === 'true' })}>
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
              <input name="title" value={photoForm.title} onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })} required />
            </label>
            <label>
              Imagem
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </label>
            <label>
              Ou introduz uma URL
              <input name="imageUrl" value={photoForm.imageUrl} onChange={(e) => setPhotoForm({ ...photoForm, imageUrl: e.target.value })} />
            </label>
            <label>
              Álbum
              <select value={photoForm.albumId} onChange={(e) => setPhotoForm({ ...photoForm, albumId: e.target.value })}>
                <option value="">Nenhum</option>
                {albums.map((album) => (
                  <option key={album._id} value={album._id}>{album.name}</option>
                ))}
              </select>
            </label>
            <label>
              Tema
              <input name="theme" value={photoForm.theme} onChange={(e) => setPhotoForm({ ...photoForm, theme: e.target.value })} />
            </label>
            <label>
              Descrição
              <textarea name="description" value={photoForm.description} onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })} />
            </label>
            <button type="submit">Adicionar foto</button>
          </form>

          <h2>As minhas fotos</h2>
          {photos.length === 0 ? <div className="empty-state">Ainda não adicionou fotos.</div> : (
            <div className="photo-grid small-grid">
              {photos.map((photo) => (
                <div key={photo._id} className="photo-card">
                  <img src={photo.imageUrl} alt={photo.title} />
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
    </main>
  )
}

export default ProfilePage
