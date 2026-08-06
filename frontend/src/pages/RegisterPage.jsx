import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { publicFetch } from '../services/api.js'

const INITIAL_FORM = {
  name: '',
  email: '',
  password: ''
}

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [status, setStatus] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('')

    try {
      const data = await publicFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
      })

      localStorage.setItem('token', data.token)
      navigate('/', { replace: true })
    } catch (error) {
      setStatus(error.message || 'Não foi possível criar a conta.')
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Registar</h2>

        <label>
          Nome
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Palavra-passe
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit">Criar conta</button>

        <p>
          Já tens conta? <Link to="/login">Entrar</Link>
        </p>

        {status && <p className="status-message">{status}</p>}
      </form>
    </main>
  )
}

export default RegisterPage