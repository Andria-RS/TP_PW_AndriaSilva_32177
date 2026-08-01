import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { publicFetch } from '../services/api.js'

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const data = await publicFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      localStorage.setItem('token', data.token)
      navigate('/profile')
    } catch (error) {
      setStatus(error.message)
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Entrar</h2>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Palavra-passe
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <button type="submit">Entrar</button>
        <p>
          Ainda não tens conta? <Link to="/register">Regista-te</Link>
        </p>
        {status && <p className="status-message">{status}</p>}
      </form>
    </main>
  )
}

export default LoginPage
