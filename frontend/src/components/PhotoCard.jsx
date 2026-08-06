import { Link } from 'react-router-dom'

function PhotoCard({
  photo,
  likesCount = 0,
  commentsCount = 0,
  onOpen,
  getImageUrl,
  showAlbumLink = false
}) {
  const handleOpen = () => {
    onOpen(photo)
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    handleOpen()
  }

  const authorName = photo.author?.name || 'Anónimo'
  const albumId = photo.album?._id
  const albumName = photo.album?.name || 'Álbum'

  return (
    <article
      className="lumen-photo-card lumen-photo-card-clickable"
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
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
          <small>{authorName}</small>
        </div>
      </div>

      <div className="lumen-photo-body">
        <div className="refined-meta-row">
          <span>{photo.theme}</span>

          {showAlbumLink && albumId && (
            <Link
              to={`/albums/${albumId}`}
              className="album-inline-link"
              onClick={(event) => event.stopPropagation()}
            >
              {albumName}
            </Link>
          )}
        </div>

        <strong>{photo.title}</strong>
      </div>
    </article>
  )
}

export default PhotoCard