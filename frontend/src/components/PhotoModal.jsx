import { useEffect, useState } from 'react'

const getUserId = (value) => {
  if (!value) return null

  return typeof value === 'object'
    ? value._id || value.id || null
    : value
}

function CommentItem({
  comment,
  user,
  onEditComment,
  onDeleteComment
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingText, setEditingText] = useState(comment.text)

  const authorName = comment.author?.name || 'Anónimo'
  const isOwner =
    String(getUserId(user)) === String(getUserId(comment.author))

  const handleStartEdit = () => {
    setIsMenuOpen(false)
    setIsEditing(true)
    setEditingText(comment.text)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingText(comment.text)
  }

  const handleConfirmEdit = async () => {
    const text = editingText.trim()

    if (!text) return

    try {
      await onEditComment(comment._id, text)
      setIsEditing(false)
    } catch {
      // O componente pai trata o erro.
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Tens a certeza que queres apagar este comentário?'
    )

    if (!confirmed) return

    try {
      setIsMenuOpen(false)
      await onDeleteComment(comment._id)
    } catch {
      // O componente pai trata o erro.
    }
  }

  return (
    <div className="comment-item comment-item-editable">
      <div className="comment-avatar">
        {authorName.charAt(0).toUpperCase()}
      </div>

      <div className="comment-content">
        <div className="comment-header">
          <strong>{authorName}</strong>

          {isOwner && (
            <div className="comment-menu-wrapper">
              <button
                type="button"
                className="comment-menu-button"
                aria-label="Opções do comentário"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
              >
                ⋯
              </button>

              {isMenuOpen && (
                <div className="comment-menu">
                  <button type="button" onClick={handleStartEdit}>
                    Editar
                  </button>

                  <button
                    type="button"
                    className="comment-menu-delete"
                    onClick={handleDelete}
                  >
                    Apagar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="comment-edit-box">
            <textarea
              value={editingText}
              onChange={(event) => setEditingText(event.target.value)}
              autoFocus
            />

            <div className="comment-edit-actions">
              <button
                type="button"
                className="comment-edit-cancel"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="comment-edit-confirm"
                onClick={handleConfirmEdit}
              >
                Confirmar
              </button>
            </div>
          </div>
        ) : (
          <p>{comment.text}</p>
        )}
      </div>
    </div>
  )
}

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
  onEditComment,
  onDeleteComment,
  getImageUrl
}) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !photo) return null

  const authorName = photo.author?.name || 'Anónimo'
  const photoTheme = photo.theme || ''
  const albumName = photo.album?.name || ''

  return (
    <div className="photo-modal-backdrop" onClick={onClose}>
      <div
        className="photo-modal photo-modal-reference"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="photo-modal-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ✕
        </button>

        <div className="photo-modal-media">
          <img
            src={getImageUrl(photo.imageUrl)}
            alt={photo.title}
          />
        </div>

        <aside className="photo-modal-sidebar">
          <div className="photo-modal-header">
            <h2>{photo.title}</h2>

            <div className="photo-modal-author">
              <div className="photo-author-avatar">
                {authorName.charAt(0).toUpperCase()}
              </div>

              <div className="photo-modal-author-text">
                <strong>{authorName}</strong>

                <small>
                  {photoTheme}
                  {albumName && ` • ${albumName}`}
                </small>
              </div>
            </div>

            {photo.description && <p>{photo.description}</p>}
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
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    user={user}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                  />
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
                  <svg
                    viewBox="0 0 24 24"
                    className="photo-like-icon"
                    aria-hidden="true"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.53L12 21.35z" />
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
                    onChange={(event) =>
                      onCommentChange(photo._id, event.target.value)
                    }
                    required
                  />

                  <button type="submit">Enviar</button>
                </form>
              </>
            ) : (
              <p className="photo-login-hint">
                Faz login para gostar e comentar.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default PhotoModal