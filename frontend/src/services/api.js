const API_BASE = '/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()

  if (!response.ok) {
    throw new Error(text || 'Erro na API')
  }

  return text
}

export const authFetch = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  }

  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  } else {
    delete headers['Content-Type']
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  })

  let data
  try {
    data = await parseResponse(response)
  } catch (error) {
    const enhancedError = new Error(error.message || 'Erro na API')
    enhancedError.status = response.status
    throw enhancedError
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Erro na API')
    error.status = response.status
    throw error
  }

  return data
}

export const publicFetch = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData
  const headers = {
    ...options.headers
  }

  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  } else {
    delete headers['Content-Type']
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  })

  let data
  try {
    data = await parseResponse(response)
  } catch (error) {
    const enhancedError = new Error(error.message || 'Erro na API')
    enhancedError.status = response.status
    throw enhancedError
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Erro na API')
    error.status = response.status
    throw error
  }

  return data
}