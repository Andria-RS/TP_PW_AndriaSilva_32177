import { useEffect } from 'react'

function PhotoModal({
  photo,
  isOpen,
  onClose,
  user,
  likesCount = 0,
  likedByMe = false,
  comments = [],
  commentValue = '',
  onCommentChange,
  onCommentSubmit,
  onLike,
  getImageUrl
}) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !photo) return null

  return (
    <div className="photo-modal-backdrop" onClick={onClose}>
      <div className="photo-modal photo-modal-reference" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="photo-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="photo-modal-media">
          <img src={getImageUrl(photo.imageUrl)} alt={photo.title} />
        </div>

        <aside className="photo-modal-sidebar">
          <div className="photo-modal-header">
            <h2>{photo.title}</h2>

            <div className="photo-modal-author">
              <div className="photo-author-avatar">
                {(photo.author?.name || 'A').charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{photo.author?.name || 'Anónimo'}</strong>
                <small>
                  {photo.theme}
                  {photo.album?.name ? ` • ${photo.album.name}` : ''}
                </small>
              </div>
            </div>

            {photo.description ? <p>{photo.description}</p> : null}
          </div>

          <div className="photo-modal-meta">
            <span>♡ {likesCount} gostos</span>
            <span>💬 {comments.length} comentários</span>
          </div>

          <div className="photo-modal-comments">
            <h3>Comentários ({comments.length})</h3>

            {comments.length === 0 ? (
              <p className="empty-state">Sem comentários ainda.</p>
            ) : (
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment._id} className="comment-item">
                    <div className="comment-avatar">
                      {(comment.author?.name || 'A').charAt(0).toUpperCase()}
                    </div>

                    <div className="comment-content">
                      <strong>{comment.author?.name || 'Anónimo'}</strong>
                      <p>{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="photo-modal-footer">
            {user ? (
              <>
                <button
                  type="button"
                  className={`photo-like-icon-btn ${likedByMe ? 'liked' : ''}`}
                  onClick={() => onLike(photo._id)}
                  aria-label={likedByMe ? 'Remover gosto' : 'Gostar'}
                  title={likedByMe ? 'Remover gosto' : 'Gostar'}
                >
                  <svg viewBox="0 0 24 24" className="photo-like-icon" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.53L12 21.35z" />
                  </svg>
                </button>

                <form
                  className="comment-form photo-modal-form"
                  onSubmit={(event) => onCommentSubmit(event, photo._id)}
                >
                  <input
                    type="text"
                    placeholder="Escreve um comentário..."
                    value={commentValue}
                    onChange={(event) => onCommentChange(photo._id, event.target.value)}
                    required
                  />
                  <button type="submit">Enviar</button>
                </form>
              </>
            ) : (
              <p className="photo-login-hint">Faz login para gostar e comentar.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default PhotoModal