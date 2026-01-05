import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCurrentUser } from '../../store/slices/authSlice'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { FileText, Upload, CheckCircle, XCircle, AlertCircle, Target, TrendingUp, Sparkles, ArrowRight, Wand2, Plus, Coins } from 'lucide-react'
import TemplateSelectionModal from '../../components/TemplateSelectionModal'
import ConfirmationModal from '../../components/ui/ConfirmationModal'
import AnalysisLoadingModal from '../../components/ui/AnalysisLoadingModal'

export default function ATSAnalyzer() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const { user } = useSelector((state) => state.auth)
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [formData, setFormData] = useState({
    targetRole: '',
    experienceLevel: '',
    industry: ''
  })
  const [analyzing, setAnalyzing] = useState(false)
  const [report, setReport] = useState(null)
  const [extractedMetadata, setExtractedMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [creatingResume, setCreatingResume] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: null, title: '', message: '', type: 'info' })
  
  const ATS_CREDITS_COST = 5

  useEffect(() => {
    fetchResumes()
    
    // Load report from URL if reportId is present
    const reportId = searchParams.get('reportId')
    if (reportId) {
      loadReport(reportId)
    }
  }, [searchParams])

  const fetchResumes = async () => {
    try {
      const response = await api.get('/resumes')
      if (response.data.success) {
        setResumes(response.data.data.resumes)
      }
    } catch (error) {
      toast.error('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or DOCX file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploadedFile(file)
    setSelectedResumeId('')
  }

  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [showResumeCreationModal, setShowResumeCreationModal] = useState(false)
  const [resumeCreationProgress, setResumeCreationProgress] = useState(0)

  const handleAnalyze = async () => {
    if (!selectedResumeId && !uploadedFile) {
      toast.error('Please select a resume or upload a file')
      return
    }

    // Target role and industry are now optional - removed validation

    // Check credits before analyzing
    if (!user || (user.credits || 0) < ATS_CREDITS_COST) {
      toast.error(`Insufficient credits. ${ATS_CREDITS_COST} credits required. You have ${user?.credits || 0} credits.`, {
        duration: 5000
      })
      return
    }

    setAnalyzing(true)
    setShowLoadingModal(true)
    setAnalysisProgress(0)
    
    // Simulate progress updates
    let progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval) // Stop the interval at 90%
          return 90
        }
        const increment = Math.random() * 8 + 2
        const newProgress = Math.min(prev + increment, 90)
        return newProgress
      })
    }, 500)
    
    try {
      const payload = new FormData()
      if (uploadedFile) {
        payload.append('resume', uploadedFile)
      } else {
        payload.append('resumeId', selectedResumeId)
      }
      payload.append('targetRole', formData.targetRole || '')
      payload.append('experienceLevel', formData.experienceLevel)
      payload.append('industry', formData.industry || '')

      const response = await api.post('/ats/analyze', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      clearInterval(progressInterval)
      setAnalysisProgress(100)
      // Wait a moment for the progress to show 100%
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setReport(response.data.data.report)
      setExtractedMetadata(response.data.data.extractedMetadata)
      // Refresh user credits
      await dispatch(fetchCurrentUser())
      setShowLoadingModal(false)
      toast.success(`Analysis complete! ${ATS_CREDITS_COST} credits used. ${response.data.data.creditsRemaining || user?.credits || 0} credits remaining.`, {
        duration: 5000
      })
    } catch (error) {
      clearInterval(progressInterval)
      setShowLoadingModal(false)
      setAnalysisProgress(0)
      toast.error(error.response?.data?.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-300' }
    if (score >= 60) return { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-300' }
    return { bg: 'bg-error-100', text: 'text-error-700', border: 'border-error-300' }
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Improvement'
  }

  const handleCreateResume = async (templateId) => {
    if (!extractedMetadata) {
      toast.error('No resume data available to create resume')
      return
    }

    setCreatingResume(true)
    setShowTemplateModal(false)
    
    try {
      const response = await api.post('/resumes', {
        title: `${formData.targetRole} Resume - ${new Date().toLocaleDateString()}`,
        templateId,
        templateStyle: 'standard',
        metadata: extractedMetadata
      })

      if (response.data.success) {
        toast.success('Resume created successfully!')
        navigate(`/resume-builder?id=${response.data.data.resume._id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create resume')
    } finally {
      setCreatingResume(false)
    }
  }

  const loadReport = async (reportId) => {
    try {
      setLoading(true)
      const response = await api.get(`/ats/reports/${reportId}`)
      if (response.data.success) {
        setReport(response.data.data.report)
        const reportData = response.data.data.report
        
        // Try to get extracted metadata from multiple sources
        // First, check if metadata is stored in the report
        if (reportData.metadata && typeof reportData.metadata === 'object' && Object.keys(reportData.metadata).length > 0) {
          setExtractedMetadata(reportData.metadata)
        }
        // If not, try to get from existing resume
        else if (reportData.resumeId) {
          try {
            // Ensure resumeId is a string
            const resumeIdStr = typeof reportData.resumeId === 'object' ? reportData.resumeId.toString() : reportData.resumeId
            const resumeResponse = await api.get(`/resumes/${resumeIdStr}`)
            if (resumeResponse.data.success) {
              setExtractedMetadata(resumeResponse.data.data.resume.metadata)
            }
          } catch (err) {
            console.log('Could not load resume metadata:', err)
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOptimizedResume = async (templateId) => {
    if (!report || !report._id) {
      toast.error('No analysis report available')
      return
    }

    if (!user || (user?.credits || 0) < 5) {
      toast.error(`Insufficient credits. 5 credits required. You have ${user?.credits || 0} credits.`)
      return
    }

    if (!templateId) {
      toast.error('Please select a template')
      return
    }

    setCreatingResume(true)
    setShowTemplateModal(false)
    setShowResumeCreationModal(true)
    setResumeCreationProgress(0)
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setResumeCreationProgress((prev) => {
        if (prev >= 90) {
          return 90 // Hold at 90% until API completes
        }
        const increment = Math.random() * 8 + 2
        return Math.min(prev + increment, 90)
      })
    }, 300)
    
    try {
      console.log('Creating optimized resume:', { reportId: report._id, templateId })
      const response = await api.post(`/ats/reports/${report._id}/create-resume`, {
        templateId
      })

      // Complete progress
      clearInterval(progressInterval)
      setResumeCreationProgress(100)

      if (response.data.success && response.data.data.resume && response.data.data.resume._id) {
        const resumeId = typeof response.data.data.resume._id === 'object' 
          ? response.data.data.resume._id.toString() 
          : response.data.data.resume._id.toString()
        
        await dispatch(fetchCurrentUser())
        
        // Wait a moment for modal to show completion, then navigate
        setTimeout(() => {
          setShowResumeCreationModal(false)
          // Navigate to resume builder with the new resume ID using React Router
          navigate(`/resume-builder?id=${resumeId}`, { replace: true })
        }, 1000)
      } else {
        clearInterval(progressInterval)
        setShowResumeCreationModal(false)
        console.error('Invalid response:', response.data)
        toast.error('Resume created but data is missing. Please refresh and try again.')
      }
    } catch (error) {
      clearInterval(progressInterval)
      setShowResumeCreationModal(false)
      console.error('Create optimized resume error:', error)
      toast.error(error.response?.data?.message || 'Failed to create optimized resume')
    } finally {
      setCreatingResume(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #7dd3fc 50%, #f97316 100%)'
      }}>
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-6 h-6" />
            <span className="text-sm font-semibold opacity-90">ATS Score Analyzer</span>
          </div>
          <h1 className="text-4xl font-heading font-bold mb-3">
            Optimize Your Resume for ATS
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            Get instant feedback on how well your resume performs with Applicant Tracking Systems
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {!report ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Resume Selection */}
            <div className="card p-6">
              <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Select Resume</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Choose from your resumes
                  </label>
                  <div className="relative">
                    <select
                      value={selectedResumeId}
                      onChange={(e) => {
                        setSelectedResumeId(e.target.value)
                        setUploadedFile(null)
                      }}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer pr-10"
                    >
                      <option value="">Select a resume...</option>
                      {resumes.length === 0 ? (
                        <option value="" disabled>No saved resumes found</option>
                      ) : (
                        resumes.map((resume) => (
                          <option key={resume._id} value={resume._id}>
                            {resume.title || 'Untitled Resume'}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {resumes.length === 0 && (
                    <p className="mt-2 text-sm text-neutral-500">
                      No saved resumes. Upload a file below or create a resume first.
                    </p>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-neutral-500">or</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Upload a file
                  </label>
                  <div className="relative border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2 pointer-events-none" />
                    <p className="text-sm text-neutral-600 mb-2 pointer-events-none">
                      {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-neutral-500 pointer-events-none">PDF or DOCX (max 5MB)</p>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="card p-6">
              <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Job Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Software Engineer (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Experience Level (Optional)</option>
                    <option value="fresher">Fresher (0-1 years)</option>
                    <option value="1-3">Entry Level (1-3 years)</option>
                    <option value="3-5">Mid Level (3-5 years)</option>
                    <option value="5+">Senior (5+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Technology, Finance (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Credit Cost Info */}
            <div className="card p-4 bg-warning-50 border border-warning-200">
              <div className="flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-warning-600" />
                <span className="text-neutral-700">
                  This analysis costs <strong>{ATS_CREDITS_COST} credits</strong>. 
                  {user && (
                    <span> You have <strong>{user.credits || 0} credits</strong> remaining.</span>
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !user || (user?.credits || 0) < ATS_CREDITS_COST}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={user && (user.credits || 0) < ATS_CREDITS_COST ? `${ATS_CREDITS_COST} credits required` : 'Analyze resume'}
            >
              {analyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze Resume ({ATS_CREDITS_COST} credits)
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <div className="card p-6" style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
            }}>
              <h3 className="text-lg font-heading font-bold text-neutral-900 mb-4">
                How ATS Analysis Works
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Upload or Select</p>
                    <p className="text-sm text-neutral-600">Choose a resume from your library or upload a new one</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Add Job Details</p>
                    <p className="text-sm text-neutral-600">Specify your target role and industry</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Get Insights</p>
                    <p className="text-sm text-neutral-600">Receive detailed feedback and improvement suggestions</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-heading font-bold text-neutral-900 mb-3">
                What We Analyze
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-neutral-700">Keyword optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-neutral-700">Format compatibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-neutral-700">Section structure</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-neutral-700">Content quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span className="text-neutral-700">ATS compatibility score</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`card p-6 border-2 ${getScoreColor(report.score || report.overallScore || 0).border}`}>
              <div className="text-center">
                <TrendingUp className={`w-12 h-12 mx-auto mb-3 ${getScoreColor(report.score || report.overallScore || 0).text}`} />
                <p className="text-sm font-semibold text-neutral-600 mb-2">Overall ATS Score</p>
                <div className={`text-5xl font-bold mb-2 ${getScoreColor(report.score || report.overallScore || 0).text}`}>
                  {report.score || report.overallScore || 0}
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(report.score || report.overallScore || 0).bg} ${getScoreColor(report.score || report.overallScore || 0).text}`}>
                  {getScoreLabel(report.score || report.overallScore || 0)}
                </span>
              </div>
            </div>

            <div className="card p-6">
              <p className="text-sm font-semibold text-neutral-600 mb-3">Keywords Matched</p>
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {report.keywordMatch || report.keywordsMatched || 0}%
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-gradient-primary h-2 rounded-full"
                  style={{ width: `${report.keywordMatch || report.keywordsMatched || 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-neutral-500 mt-2">Keyword optimization score</p>
            </div>

            <div className="card p-6">
              <p className="text-sm font-semibold text-neutral-600 mb-3">Improvements Found</p>
              <div className="text-3xl font-bold text-accent-600 mb-2">
                {report.suggestions?.length || 0}
              </div>
              <p className="text-sm text-neutral-600">Action items to improve your score</p>
            </div>
          </div>

          {/* Suggestions - Structured Format */}
          {report.suggestions && report.suggestions.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Improvement Suggestions</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {report.suggestions.map((suggestion, index) => {
                  // Handle both string and object formats
                  const suggestionText = typeof suggestion === 'string' ? suggestion : (suggestion.title || suggestion.message || suggestion.description || '')
                  const suggestionType = typeof suggestion === 'object' ? (suggestion.type || 'info') : 'info'
                  
                  const Icon = suggestionType === 'critical' ? XCircle : suggestionType === 'warning' ? AlertCircle : CheckCircle
                  const colors = suggestionType === 'critical' ? 'text-error-600' : suggestionType === 'warning' ? 'text-warning-600' : 'text-success-600'
                  const bgColors = suggestionType === 'critical' ? 'bg-error-50 border-error-200' : suggestionType === 'warning' ? 'bg-warning-50 border-warning-200' : 'bg-success-50 border-success-200'

                  return (
                    <div key={index} className={`flex items-start gap-3 p-4 rounded-lg border ${bgColors}`}>
                      <Icon className={`w-5 h-5 ${colors} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-900 mb-1">{suggestionText}</p>
                        {typeof suggestion === 'object' && suggestion.description && suggestion.description !== suggestionText && (
                          <p className="text-sm text-neutral-600 mt-1">{suggestion.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section-wise Tips */}
          {report.sectionWiseTips && Object.keys(report.sectionWiseTips).length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Section-wise Recommendations</h2>
              <div className="space-y-4">
                {Object.entries(report.sectionWiseTips).map(([section, tips]) => {
                  if (!tips || !Array.isArray(tips) || tips.length === 0) return null
                  
                  const sectionNames = {
                    personalInfo: 'Personal Information',
                    summary: 'Summary',
                    education: 'Education',
                    experience: 'Experience',
                    skills: 'Skills',
                    projects: 'Projects',
                    certifications: 'Certifications',
                    achievements: 'Achievements'
                  }
                  
                  return (
                    <div key={section} className="border-l-4 border-primary-500 pl-4">
                      <h3 className="font-semibold text-neutral-900 mb-2">{sectionNames[section] || section}</h3>
                      <ul className="space-y-2">
                        {tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start gap-2 text-sm text-neutral-700">
                            <span className="text-primary-600 mt-1">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Formatting Suggestions */}
          {report.formattingSuggestions && report.formattingSuggestions.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Formatting & Structure Issues</h2>
              <div className="space-y-2">
                {report.formattingSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-warning-50 border border-warning-200">
                    <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-neutral-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {report.missingKeywords && report.missingKeywords.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Missing Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {report.missingKeywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 rounded-full bg-error-100 text-error-700 text-sm font-medium">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis Text */}
          {report.aiAnalysis && (
            <div className="card p-6">
              <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Detailed Analysis</h2>
              <div className="prose max-w-none">
                <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                  {report.aiAnalysis}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                setReport(null)
                setExtractedMetadata(null)
                setUploadedFile(null)
                setSelectedResumeId('')
              }}
              className="btn-secondary"
            >
              Analyze Another Resume
            </button>
            
            {report && report._id && (
              <button
                onClick={() => setShowTemplateModal(true)}
                disabled={creatingResume || !user || (user?.credits || 0) < 5}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
                title={user && (user.credits || 0) < 5 ? '5 credits required' : 'Create optimized resume with all AI suggestions applied'}
              >
                {creatingResume ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Create Resume with All Changes (5 credits)
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Parsed Resume Data */}
          {extractedMetadata && (
            <div className="card p-6">
              <h3 className="text-lg font-heading font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Extracted Resume Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extractedMetadata.personalInfo && (
                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">Personal Information</h4>
                    <div className="text-sm text-neutral-600 space-y-1">
                      {extractedMetadata.personalInfo.name && <p><strong>Name:</strong> {extractedMetadata.personalInfo.name}</p>}
                      {extractedMetadata.personalInfo.email && <p><strong>Email:</strong> {extractedMetadata.personalInfo.email}</p>}
                      {extractedMetadata.personalInfo.phone && <p><strong>Phone:</strong> {extractedMetadata.personalInfo.phone}</p>}
                      {extractedMetadata.personalInfo.location && <p><strong>Location:</strong> {extractedMetadata.personalInfo.location}</p>}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-neutral-700 mb-2">Sections Found</h4>
                  <div className="text-sm text-neutral-600 space-y-1">
                    {extractedMetadata.experience?.length > 0 && <p><strong>Experience:</strong> {extractedMetadata.experience.length} entries</p>}
                    {extractedMetadata.education?.length > 0 && <p><strong>Education:</strong> {extractedMetadata.education.length} entries</p>}
                    {extractedMetadata.projects?.length > 0 && <p><strong>Projects:</strong> {extractedMetadata.projects.length} entries</p>}
                    {extractedMetadata.skills?.length > 0 && <p><strong>Skills:</strong> {extractedMetadata.skills.length} skills</p>}
                    {extractedMetadata.certifications?.length > 0 && <p><strong>Certifications:</strong> {extractedMetadata.certifications.length} entries</p>}
                    {extractedMetadata.achievements?.length > 0 && <p><strong>Achievements:</strong> {extractedMetadata.achievements.length} entries</p>}
                    {extractedMetadata.customSections?.length > 0 && <p><strong>Custom Sections:</strong> {extractedMetadata.customSections.length} sections</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Credit Usage Info */}
          <div className="card p-4 bg-primary-50 border border-primary-200">
            <div className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-primary-600" />
              <span className="text-neutral-700">
                <strong>{ATS_CREDITS_COST} credits</strong> were used for this analysis. 
                {report && report._id && ' Create an optimized resume with all AI suggestions applied for 5 credits.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelect={handleCreateOptimizedResume}
      />

      {/* Resume Creation Loading Modal */}
      <AnalysisLoadingModal
        isOpen={showResumeCreationModal}
        progress={resumeCreationProgress}
        title="Creating Optimized Resume..."
        message="Our AI is creating your optimized resume with all ATS analysis improvements applied."
        onComplete={() => {
          // Modal will close automatically when navigation happens
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, onConfirm: null, title: '', message: '', type: 'info' })}
        onConfirm={confirmModal.onConfirm || (() => {})}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        loading={false}
      />

      {/* Analysis Loading Modal */}
      <AnalysisLoadingModal
        isOpen={showLoadingModal}
        progress={analysisProgress}
        onComplete={() => {
          setShowLoadingModal(false)
          setAnalysisProgress(0)
        }}
      />
    </div>
  )
}



