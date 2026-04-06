const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const buildUrl = (path: string) => {
  if (path.startsWith('http')) return path
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const request = async (path: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const data = await response.json()
      message = data?.message || message
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  get: (path: string) => request(path, { method: 'GET' }),
  post: (path: string, body?: unknown) => request(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  }),
  patch: (path: string, body?: unknown) => request(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined
  })
}
