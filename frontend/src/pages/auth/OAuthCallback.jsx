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

    if (error) {
      toast.error('OAuth authentication failed. Please try again.')
      navigate('/login')
      return
    }

    if (token) {
      // Store token
      localStorage.setItem('token', token)
      
      // Fetch user data
      dispatch(fetchCurrentUser())
        .then(() => {
          toast.success(`Successfully signed in with ${provider === 'google' ? 'Google' : 'GitHub'}!`)
          navigate('/dashboard')
        })
        .catch(() => {
          toast.error('Failed to load user data')
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

