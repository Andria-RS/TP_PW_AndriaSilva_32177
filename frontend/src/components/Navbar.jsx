import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authFetch } from '../services/api.js'

function Navbar() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const data = await authFetch('/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    }
  }

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
            <Link className="button-link" to="/profile">
              Perfil
            </Link>

            <button
              type="button"
              className="button-link"
              onClick={handleLogout}
            >
              Sair
            </button>
          </>
        ) : (
          <Link className="button-link" to="/login">
            Entrar
          </Link>
        )}
      </div>
    </header>
  )
}

export default Navbar