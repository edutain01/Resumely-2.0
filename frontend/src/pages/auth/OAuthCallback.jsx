import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { fetchCurrentUser } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    const token = searchParams.get('token')
    const provider = searchParams.get('provider')
    const error = searchParams.get('error')
    const errorMessage = searchParams.get('message')

    if (error) {
      let displayMessage = 'OAuth authentication failed. Please try again.'
      
      if (error === 'google_not_configured') {
        displayMessage = 'Google authentication is not configured. Please contact support.'
      } else if (error === 'github_not_configured') {
        displayMessage = 'GitHub authentication is not configured. Please contact support.'
      } else if (errorMessage) {
        displayMessage = decodeURIComponent(errorMessage)
      }
      
      toast.error(displayMessage)
      navigate('/login')
      return
    }

    if (token) {
      // Store token
      localStorage.setItem('token', token)
      
      // Fetch user data
      dispatch(fetchCurrentUser())
        .then((result) => {
          if (fetchCurrentUser.fulfilled.match(result)) {
            const providerName = provider === 'google' ? 'Google' : 'GitHub'
            toast.success(`Successfully signed in with ${providerName}!`)
            navigate('/dashboard')
          } else {
            toast.error('Failed to load user data')
            localStorage.removeItem('token')
            navigate('/login')
          }
        })
        .catch(() => {
          toast.error('Failed to load user data')
          localStorage.removeItem('token')
          navigate('/login')
        })
    } else {
      toast.error('Authentication failed. Please try again.')
      navigate('/login')
    }
  }, [searchParams, navigate, dispatch])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-neutral-600">Completing authentication...</p>
      </div>
    </div>
  )
}

