import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicFetch } from '../services/api.js'
import Navbar from '../components/Navbar.jsx'

function AlbumsPage() {
  const [albums, setAlbums] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAlbums()
  }, [])

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return ''

    if (imageUrl.startsWith('http')) {
      return imageUrl
    }

    return `http://localhost:4000${imageUrl}`
  }

  const fetchAlbums = async () => {
    try {
      setIsLoading(true)

      const data = await publicFetch('/albums')
      setAlbums(data)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAlbums = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase()

    if (!normalizedSearch) {
      return albums
    }

    return albums.filter((album) => {
      const albumName = (album.name || '').toLowerCase()
      const albumTheme = (album.theme || '').toLowerCase()

      return (
        albumName.includes(normalizedSearch) ||
        albumTheme.includes(normalizedSearch)
      )
    })
  }, [albums, searchTerm])

  return (
    <main className="app-shell albums-page">
      <Navbar />

      <section className="albums-page-header">
        <div>
          <span className="albums-page-kicker">
            Coleções da comunidade
          </span>

          <h1>Explora álbuns</h1>

          <p>
            Pesquisa por nome ou tema e encontra novas
            fotografias para explorar.
          </p>
        </div>

        <div className="albums-search-wrapper">
          <label htmlFor="album-search">
            Pesquisar álbuns
          </label>

          <div className="albums-search-box">
            <span aria-hidden="true">⌕</span>

            <input
              id="album-search"
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Nome do álbum ou tema..."
            />

            {searchTerm && (
              <button
                type="button"
                className="albums-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Limpar pesquisa"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="albums-results-header">
        <h2>
          {searchTerm
            ? `Resultados para "${searchTerm}"`
            : 'Todos os álbuns'}
        </h2>

        <span>
          {filteredAlbums.length}{' '}
          {filteredAlbums.length === 1
            ? 'álbum'
            : 'álbuns'}
        </span>
      </section>

      {status && (
        <p className="status-message">
          {status}
        </p>
      )}

      {isLoading ? (
        <div className="empty-state">
          A carregar álbuns...
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="empty-state albums-empty-state">
          {searchTerm
            ? 'Não foram encontrados álbuns com essa pesquisa.'
            : 'Ainda não existem álbuns públicos.'}
        </div>
      ) : (
        <section className="albums-grid">
          {filteredAlbums.map((album) => (
            <article
              key={album._id}
              className="public-album-card"
            >
              <Link
                to={`/albums/${album._id}`}
                className="public-album-image-link"
              >
                {album.coverImageUrl ? (
                  <img
                    src={getImageUrl(album.coverImageUrl)}
                    alt={album.name}
                    className="public-album-cover"
                  />
                ) : (
                  <div className="public-album-cover public-album-placeholder">
                    <span>Sem imagem de capa</span>
                  </div>
                )}
              </Link>

              <div className="public-album-content">
                <span className="public-album-theme">
                  {album.theme}
                </span>

                <Link
                  to={`/albums/${album._id}`}
                  className="public-album-title"
                >
                  {album.name}
                </Link>

                <p>
                  {album.description || 'Sem descrição.'}
                </p>

                <div className="public-album-footer">
                  <small>
                    Por {album.owner?.name || 'Utilizador'}
                  </small>

                  <Link
                    to={`/albums/${album._id}`}
                    className="public-album-link"
                  >
                    Ver álbum →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default AlbumSearch