import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch } from '../services/api.js'

function Navbar() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await authFetch('/auth/me')
        setUser(data.user)
      } catch {
        setUser(null)
      }
    }

    fetchCurrentUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  return (
    <header className="lumen-navbar">
      <Link to="/" className="lumen-logo">
        <div className="lumen-logo-mark">◎</div>
        <span>LUMEN</span>
      </Link>

      <nav className="lumen-nav-links">
        <Link to="/explore">Explorar</Link>
        <Link to="/albums">Álbuns</Link>
      </nav>

      <div className="lumen-nav-actions">
        {user ? (
          <>
            <Link to="/profile" className="button-link">
              Perfil
            </Link>

            <button type="button" className="button-link" onClick={handleLogout}>
              Sair
            </button>
          </>
        ) : (
          <Link to="/login" className="button-link">
            Entrar
          </Link>
        )}
      </div>
    </header>
  )
}

export default Navbar