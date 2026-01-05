import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { User, Mail, Lock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { getOAuthUrl } from '../../config/api.config'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', { name, email, password })
      toast.success('Account created successfully! Please log in.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #7dd3fc 50%, #f97316 100%)'
      }}>
        {/* Decorative Circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-10 h-10" />
            <h1 className="text-4xl font-heading font-bold">Resumly</h1>
          </div>

          <h2 className="text-5xl font-heading font-bold mb-6 leading-tight">
            Start Your Success<br />
            Story Today
          </h2>

          <p className="text-xl opacity-90 mb-8 max-w-md">
            Join thousands of professionals who have landed their dream jobs with our AI-powered resume builder.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <p className="text-lg">Free to start, upgrade anytime</p>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <p className="text-lg">AI-powered resume optimization</p>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <p className="text-lg">ATS score analysis included</p>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <p className="text-lg">Multiple professional templates</p>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <p className="text-lg">Export to PDF instantly</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold">10K+</div>
              <div className="text-sm opacity-80">Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold">50K+</div>
              <div className="text-sm opacity-80">Resumes</div>
            </div>
            <div>
              <div className="text-4xl font-bold">95%</div>
              <div className="text-sm opacity-80">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-neutral-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <Sparkles className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-heading font-bold text-gradient">Resumly</h1>
          </div>

          <div className="card p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-heading font-bold text-neutral-900 mb-2">
                Create Account
              </h2>
              <p className="text-neutral-600">
                Sign up to start building your professional resume
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-12"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12"
                    placeholder="At least 6 characters"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-12"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  className="mt-1 w-4 h-4 text-primary-500 rounded border-neutral-300 focus:ring-primary-500"
                />
                <label className="text-sm text-neutral-600">
                  I agree to the{' '}
                  <a href="#" className="text-primary-500 hover:text-primary-600 font-semibold">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-500 hover:text-primary-600 font-semibold">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">Or sign up with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <a
                href={getOAuthUrl('google')}
                className="btn-secondary py-3 flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </a>
              <a
                href={getOAuthUrl('github')}
                className="btn-secondary py-3 flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>

            {/* Sign In Link */}
            <p className="text-center mt-6 text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



