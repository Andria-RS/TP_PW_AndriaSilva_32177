import { useEffect } from 'react'

function PhotoModal({
  photo,
  isOpen,
  onClose,
  user,
  likesCount = 0,
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
                  className="photo-like-btn"
                  onClick={() => onLike(photo._id)}
                >
                  Gostar
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