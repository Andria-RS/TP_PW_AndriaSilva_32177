import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authFetch, publicFetch } from '../services/api.js'

function AlbumPage() {
  const { albumId } = useParams()
  const [album, setAlbum] = useState(null)
  const [photos, setPhotos] = useState([])
  const [photoComments, setPhotoComments] = useState({})
  const [photoLikes, setPhotoLikes] = useState({})
  const [commentInput, setCommentInput] = useState({})
  const [activePhotoId, setActivePhotoId] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchAlbum()
  }, [albumId])

  const fetchAlbum = async () => {
    try {
      const data = await publicFetch(`/albums/${albumId}`)
      setAlbum(data.album)
      setPhotos(data.photos)
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
      const response = await publicFetch(`/likes/photo/${photoId}`)
      setPhotoLikes((prev) => ({ ...prev, [photoId]: response.likes || 0 }))
    } catch {
      setPhotoLikes((prev) => ({ ...prev, [photoId]: 0 }))
    }
  }

  const handleTogglePhotoDetails = async (photoId) => {
    const nextId = activePhotoId === photoId ? null : photoId
    setActivePhotoId(nextId)
    if (nextId) {
      await Promise.all([fetchPhotoComments(photoId), fetchPhotoLikes(photoId)])
    }
  }

  const handleCommentSubmit = async (event, photoId) => {
    event.preventDefault()
    const text = (commentInput[photoId] || '').trim()
    if (!text) {
      return
    }

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
      await authFetch(`/likes/photo/${photoId}`, {
        method: 'POST'
      })
      await fetchPhotoLikes(photoId)
      setStatus('Gostei registado')
    } catch (error) {
      setStatus(error.message)
    }
  }

  if (!album) {
    return <div className="auth-shell"><p className="status-message">A carregar álbum...</p></div>
  }

  return (
    <main className="app-shell">
      <div className="hero-banner">
        <span>Álbum</span>
        <h1>{album.name}</h1>
        <p>{album.description}</p>
        {album.coverImageUrl && <img src={album.coverImageUrl} alt={album.name} className="album-cover album-banner-cover" />}
        <Link className="button-link" to="/">Voltar à galeria</Link>
      </div>
      {photos.length === 0 ? <div className="empty-state">Não há fotos neste álbum.</div> : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <article key={photo._id} className="photo-card">
              <img src={photo.imageUrl} alt={photo.title} />
              <div className="photo-info">
                <strong>{photo.title}</strong>
                <span>{photo.theme}</span>
                <p>{photo.description}</p>
                <div className="photo-actions">
                  <button type="button" onClick={() => handleTogglePhotoDetails(photo._id)}>
                    {activePhotoId === photo._id ? 'Ocultar detalhes' : 'Ver detalhes'}
                  </button>
                  <button type="button" onClick={() => handleLikePhoto(photo._id)}>
                    Gostar
                  </button>
                  <span>{photoLikes[photo._id] ?? 0} likes</span>
                </div>
                {activePhotoId === photo._id && (
                  <div className="comment-panel">
                    <div className="comment-summary">
                      <strong>{photoLikes[photo._id] ?? 0} likes</strong>
                      <span>{(photoComments[photo._id] || []).length} comentários</span>
                    </div>
                    {(photoComments[photo._id] || []).length === 0 ? (
                      <p className="empty-state">Sem comentários ainda.</p>
                    ) : (
                      <div className="comments-list">
                        {photoComments[photo._id].map((comment) => (
                          <div key={comment._id} className="comment-item">
                            <strong>{comment.author?.name || 'Anónimo'}</strong>
                            <p>{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <form className="comment-form" onSubmit={(event) => handleCommentSubmit(event, photo._id)}>
                      <input
                        type="text"
                        placeholder="Escreva um comentário..."
                        value={commentInput[photo._id] || ''}
                        onChange={(event) => setCommentInput((prev) => ({ ...prev, [photo._id]: event.target.value }))}
                        required
                      />
                      <button type="submit">Enviar</button>
                    </form>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {status && <p className="status-message">{status}</p>}
    </main>
  )
}

export default AlbumPage
