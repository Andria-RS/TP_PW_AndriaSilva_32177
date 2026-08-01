const API_BASE = '/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const authFetch = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...getAuthHeaders(),
    ...options.headers
  }

  const response = await fetch(`${API_BASE}${url}`, { ...options, headers })
  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.message || 'Erro na API')
    error.status = response.status
    throw error
  }

  return data
}

export const publicFetch = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers
  }
  const response = await fetch(`${API_BASE}${url}`, { ...options, headers })
  const data = await response.json()
  if (!response.ok) {
    const error = new Error(data.message || 'Erro na API')
    error.status = response.status
    throw error
  }
  return data
}
