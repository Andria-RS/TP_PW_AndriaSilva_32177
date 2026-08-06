import { useEffect, useState } from 'react'

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
  const [openCommentMenuId, setOpenCommentMenuId] = useState(null)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingText, setEditingText] = useState('')

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

  useEffect(() => {
    setOpenCommentMenuId(null)
    setEditingCommentId(null)
    setEditingText('')
  }, [photo])

  if (!isOpen || !photo) {
    return null
  }

  const getUserId = (value) => {
    if (!value) return null

    if (typeof value === 'object') {
      return value._id || value.id || null
    }

    return value
  }

  const isCommentOwner = (comment) => {
    const currentUserId = getUserId(user)
    const commentAuthorId = getUserId(comment.author)

    if (!currentUserId || !commentAuthorId) {
      return false
    }

    return String(currentUserId) === String(commentAuthorId)
  }

  const handleStartEdit = (comment) => {
    setOpenCommentMenuId(null)
    setEditingCommentId(comment._id)
    setEditingText(comment.text)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingText('')
  }

  const handleConfirmEdit = async (commentId) => {
    const text = editingText.trim()

    if (!text) return

    try {
      await onEditComment(commentId, text)
      setEditingCommentId(null)
      setEditingText('')
    } catch {
      // O componente pai apresenta o erro.
    }
  }

  const handleDelete = async (commentId) => {
    const confirmed = window.confirm(
      'Tens a certeza que queres apagar este comentário?'
    )

    if (!confirmed) return

    try {
      setOpenCommentMenuId(null)
      await onDeleteComment(commentId)
    } catch {
      // O componente pai apresenta o erro.
    }
  }

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

                  {albumName
                    ? ` • ${albumName}`
                    : ''}
                </small>
              </div>
            </div>

            {photo.description ? (
              <p>{photo.description}</p>
            ) : null}
          </div>

          <div className="photo-modal-meta">
            <span>♡ {likesCount} gostos</span>
            <span>💬 {comments.length} comentários</span>
          </div>

          <div className="photo-modal-comments">
            <h3>Comentários ({comments.length})</h3>

            {comments.length === 0 ? (
              <p className="empty-state">
                Sem comentários ainda.
              </p>
            ) : (
              <div className="comments-list">
                {comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="comment-item comment-item-editable"
                  >
                    <div className="comment-avatar">
                      {(comment.author?.name || 'A')
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="comment-content">
                      <div className="comment-header">
                        <strong>
                          {comment.author?.name || 'Anónimo'}
                        </strong>

                        {isCommentOwner(comment) && (
                          <div className="comment-menu-wrapper">
                            <button
                              type="button"
                              className="comment-menu-button"
                              aria-label="Opções do comentário"
                              aria-expanded={
                                openCommentMenuId === comment._id
                              }
                              onClick={() => {
                                setOpenCommentMenuId((currentId) =>
                                  currentId === comment._id
                                    ? null
                                    : comment._id
                                )
                              }}
                            >
                              ⋯
                            </button>

                            {openCommentMenuId === comment._id && (
                              <div className="comment-menu">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartEdit(comment)
                                  }
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  className="comment-menu-delete"
                                  onClick={() =>
                                    handleDelete(comment._id)
                                  }
                                >
                                  Apagar
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {editingCommentId === comment._id ? (
                        <div className="comment-edit-box">
                          <textarea
                            value={editingText}
                            onChange={(event) =>
                              setEditingText(event.target.value)
                            }
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
                              onClick={() =>
                                handleConfirmEdit(comment._id)
                              }
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
                ))}
              </div>
            )}
          </div>

          <div className="photo-modal-footer">
            {user ? (
              <>
                <button
                  type="button"
                  className={`photo-like-icon-btn ${
                    likedByMe ? 'liked' : ''
                  }`}
                  onClick={() => onLike(photo._id)}
                  aria-label={
                    likedByMe
                      ? 'Remover gosto'
                      : 'Gostar'
                  }
                  title={
                    likedByMe
                      ? 'Remover gosto'
                      : 'Gostar'
                  }
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
                  onSubmit={(event) =>
                    onCommentSubmit(event, photo._id)
                  }
                >
                  <input
                    type="text"
                    placeholder="Escreve um comentário..."
                    value={commentValue}
                    onChange={(event) =>
                      onCommentChange(
                        photo._id,
                        event.target.value
                      )
                    }
                    required
                  />

                  <button type="submit">
                    Enviar
                  </button>
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