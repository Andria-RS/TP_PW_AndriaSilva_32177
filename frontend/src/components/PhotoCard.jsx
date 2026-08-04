import React from 'react'
import { Link } from 'react-router-dom'

function PhotoCard({
  photo,
  likesCount = 0,
  commentsCount = 0,
  onOpen,
  getImageUrl,
  showAlbumLink = false
}) {
  return (
    <article
      className="lumen-photo-card lumen-photo-card-clickable"
      onClick={() => onOpen(photo)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(photo)
        }
      }}
    >
      <div className="lumen-photo-thumb">
        <img src={getImageUrl(photo.imageUrl)} alt={photo.title} />
      </div>

      <div className="lumen-photo-overlay">
        <div className="lumen-photo-stats">
          <span>♡ {likesCount}</span>
          <span>💬 {commentsCount}</span>
        </div>

        <div className="lumen-photo-meta">
          <small>{photo.author?.name || 'Anónimo'}</small>
        </div>
      </div>

      <div className="lumen-photo-body">
        <div className="refined-meta-row">
          <span>{photo.theme}</span>

          {showAlbumLink && photo.album?._id ? (
            <Link
              to={`/albums/${photo.album._id}`}
              className="album-inline-link"
              onClick={(event) => event.stopPropagation()}
            >
              {photo.album.name || 'Álbum'}
            </Link>
          ) : null}
        </div>

        <strong>{photo.title}</strong>
      </div>
    </article>
  )
}

export default PhotoCard