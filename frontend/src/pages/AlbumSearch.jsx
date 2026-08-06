import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicFetch } from '../services/api.js'
import { ALLOWED_THEMES } from '../constants/themes.js'
import Navbar from '../components/Navbar.jsx'

const API_URL = 'http://localhost:4000'

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  return `${API_URL}${imageUrl}`
}

const getResultsTitle = (searchTerm, themeFilter) => {
  if (searchTerm.trim()) return `Resultados para "${searchTerm}"`
  if (themeFilter) return themeFilter

  return 'Todos os álbuns'
}

const getEmptyMessage = (searchTerm, themeFilter) => {
  if (searchTerm.trim() && themeFilter) {
    return 'Não foram encontrados álbuns com esse nome nesse tema.'
  }

  if (searchTerm.trim()) {
    return 'Não foram encontrados álbuns com esse nome.'
  }

  if (themeFilter) {
    return `Não foram encontrados álbuns do tema "${themeFilter}".`
  }

  return 'Ainda não existem álbuns públicos.'
}

function AlbumCard({ album }) {
  const albumUrl = `/albums/${album._id}`
  const albumName = album.name || 'Álbum sem nome'
  const ownerName =
    album.owner?.name || album.owner?.username || 'Utilizador'

  return (
    <article className="public-album-card">
      <Link to={albumUrl} className="public-album-image-link">
        {album.coverImageUrl ? (
          <img
            src={getImageUrl(album.coverImageUrl)}
            alt={albumName}
            className="public-album-cover"
          />
        ) : (
          <div className="public-album-cover public-album-placeholder">
            Sem imagem de capa
          </div>
        )}
      </Link>

      <div className="public-album-content">
        <span className="public-album-theme">
          {album.theme || 'Sem tema'}
        </span>

        <Link to={albumUrl} className="public-album-title">
          {albumName}
        </Link>

        <p>{album.description || 'Sem descrição.'}</p>

        <div className="public-album-footer">
          <small>Por {ownerName}</small>

          <Link to={albumUrl} className="public-album-link">
            Ver álbum →
          </Link>
        </div>
      </div>
    </article>
  )
}

function AlbumSearch() {
  const [albums, setAlbums] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [themeFilter, setThemeFilter] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setIsLoading(true)
        setStatus('')

        const data = await publicFetch('/albums')
        setAlbums(Array.isArray(data) ? data : [])
      } catch (error) {
        setStatus(error.message || 'Não foi possível carregar os álbuns.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlbums()
  }, [])

  const themeSuggestions = useMemo(() => {
    const usedThemes = new Set(
      albums.map((album) => album.theme).filter(Boolean)
    )

    return ALLOWED_THEMES.filter((theme) => usedThemes.has(theme))
  }, [albums])

  const filteredAlbums = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return albums.filter((album) => {
      const albumName = String(album.name || '').toLowerCase()
      const matchesName =
        !normalizedSearch || albumName.includes(normalizedSearch)
      const matchesTheme =
        !themeFilter || album.theme === themeFilter

      return matchesName && matchesTheme
    })
  }, [albums, searchTerm, themeFilter])

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
  }

  const handleThemeChange = (theme) => {
    setThemeFilter(theme)
  }

  const albumCountLabel =
    filteredAlbums.length === 1 ? 'álbum' : 'álbuns'

  return (
    <main className="app-shell albums-page">
      <Navbar />

      <section className="albums-page-header">
        <div>
          <span className="albums-page-kicker">
            Álbuns da comunidade
          </span>

          <h1>Explora álbuns</h1>

          <p>
            Pesquisa pelo nome do álbum e/ou seleciona um tema para encontrares álbuns.
          </p>
        </div>

        <div className="albums-search-wrapper">
          <label htmlFor="album-search">
            Pesquisar pelo nome
          </label>

          <div className="albums-search-box">
            <span aria-hidden="true">⌕</span>

            <input
              id="album-search"
              type="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Nome do álbum..."
            />

            {searchTerm && (
              <button
                type="button"
                className="albums-search-clear"
                onClick={handleClearSearch}
                aria-label="Limpar pesquisa"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="explore-filter-bar albums-filter-bar">
        <button
          type="button"
          className={`theme-chip ${!themeFilter ? 'active' : ''}`}
          onClick={() => handleThemeChange('')}
        >
          Todos
        </button>

        {themeSuggestions.map((theme) => (
          <button
            key={theme}
            type="button"
            className={`theme-chip ${themeFilter === theme ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme)}
          >
            {theme}
          </button>
        ))}
      </section>

      <section className="albums-results-header">
        <h2>{getResultsTitle(searchTerm, themeFilter)}</h2>
        <span>
          {filteredAlbums.length} {albumCountLabel}
        </span>
      </section>

      {status && <p className="status-message">{status}</p>}

      {isLoading ? (
        <div className="empty-state">A carregar álbuns...</div>
      ) : filteredAlbums.length === 0 ? (
        <div className="empty-state albums-empty-state">
          {getEmptyMessage(searchTerm, themeFilter)}
        </div>
      ) : (
        <section className="albums-grid">
          {filteredAlbums.map((album) => (
            <AlbumCard key={album._id} album={album} />
          ))}
        </section>
      )}
    </main>
  )
}

export default AlbumSearch