// API Configuration
// For regular API calls, use the proxy (just '/api')
// For OAuth redirects, use the full backend URL

const getApiUrl = () => {
  // In development, Vite proxy handles /api requests
  // But OAuth needs full URL for redirects
  return import.meta.env.VITE_API_URL || 'http://localhost:5000'
}

export const API_BASE_URL = getApiUrl()
export const API_ENDPOINT = '/api'

// Helper to get OAuth URLs
export const getOAuthUrl = (provider) => {
  return `${API_BASE_URL}${API_ENDPOINT}/auth/${provider}`
}

