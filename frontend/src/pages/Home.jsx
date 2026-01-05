import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FileText, Target, Wand2, Coins, CheckCircle, ArrowRight, TrendingUp, Users, Zap, Shield, Globe, Sparkles } from 'lucide-react'
import { BackgroundPaths } from '@/components/ui/background-paths'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Home() {
  const { user } = useSelector((state) => state.auth)

  const features = [
    {
      icon: FileText,
      title: 'AI-Powered Resume Builder',
      description: 'Create professional resumes in minutes with our intelligent builder. Choose from multiple templates and customize every detail.',
      color: 'primary'
    },
    {
      icon: Target,
      title: 'ATS Score Analyzer',
      description: 'Get instant feedback on how well your resume performs with Applicant Tracking Systems. Optimize for maximum visibility.',
      color: 'accent'
    },
    {
      icon: Wand2,
      title: 'AI Content Enhancement',
      description: 'Enhance your resume with AI-powered suggestions. Make it ATS-friendly and impactful with just one click.',
      color: 'success'
    },
    {
      icon: Coins,
      title: 'Flexible Credit System',
      description: 'Pay only for what you use. Credits never expire and can be used for exports, analysis, and enhancements.',
      color: 'warning'
    }
  ]

  const stats = [
    { label: 'Resumes Created', value: '10K+', icon: FileText },
    { label: 'ATS Analyses', value: '25K+', icon: Target },
    { label: 'Happy Users', value: '5K+', icon: Users },
    { label: 'Success Rate', value: '95%', icon: TrendingUp }
  ]

  const steps = [
    {
      number: '01',
      title: 'Create Your Resume',
      description: 'Use our intuitive builder or import your existing resume. Choose from professional templates.'
    },
    {
      number: '02',
      title: 'Analyze with ATS',
      description: 'Get instant feedback on keyword optimization, formatting, and ATS compatibility score.'
    },
    {
      number: '03',
      title: 'Enhance with AI',
      description: 'Let AI optimize your content for maximum impact and ATS compatibility.'
    },
    {
      number: '04',
      title: 'Export & Apply',
      description: 'Download your polished resume as PDF and start applying to your dream jobs!'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section with BackgroundPaths */}
      <section className="relative overflow-hidden pt-16">
        <BackgroundPaths title="Build Resumes That Get You Hired" />
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="text-4xl font-bold text-neutral-900 mb-2">{stat.value}</div>
                  <div className="text-sm font-semibold text-neutral-600">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-neutral-900 mb-4">
              Everything You Need to Build the Perfect Resume
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Powerful features designed to help you create resumes that stand out and pass ATS filters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colorClasses = {
                primary: 'bg-primary-100 text-primary-600',
                accent: 'bg-accent-100 text-accent-600',
                success: 'bg-success-100 text-success-600',
                warning: 'bg-warning-100 text-warning-600'
              }
              return (
                <div key={index} className="card p-6 hover:shadow-lg transition-all">
                  <div className={`w-12 h-12 rounded-lg ${colorClasses[feature.color] || colorClasses.primary} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-neutral-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-neutral-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Get from idea to application-ready resume in just 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="card p-6 text-center">
                  <div className="text-6xl font-bold text-primary-200 mb-4">{step.number}</div>
                  <h3 className="text-xl font-heading font-bold text-neutral-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-neutral-600">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-primary-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-heading font-bold text-neutral-900 mb-6">
                Why Choose Resumly?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold text-neutral-900 mb-2">
                      AI-Powered Optimization
                    </h3>
                    <p className="text-neutral-600">
                      Our advanced AI analyzes your resume and provides actionable suggestions to improve ATS compatibility and impact.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold text-neutral-900 mb-2">
                      Lightning Fast
                    </h3>
                    <p className="text-neutral-600">
                      Create a professional resume in minutes, not hours. Our intuitive interface makes resume building effortless.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold text-neutral-900 mb-2">
                      Secure & Private
                    </h3>
                    <p className="text-neutral-600">
                      Your data is encrypted and secure. We never share your information with third parties.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-warning-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold text-neutral-900 mb-2">
                      Industry Standard Templates
                    </h3>
                    <p className="text-neutral-600">
                      Choose from professionally designed templates that are ATS-friendly and recruiter-approved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="card p-8" style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
              }}>
                <div className="text-center">
                  <Sparkles className="w-24 h-24 text-primary-500 mx-auto mb-6" />
                  <h3 className="text-3xl font-heading font-bold text-neutral-900 mb-4">
                    Start Building Today
                  </h3>
                  <p className="text-lg text-neutral-700 mb-8">
                    Join thousands of professionals who have landed their dream jobs with Resumly
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Create Your Resume
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

