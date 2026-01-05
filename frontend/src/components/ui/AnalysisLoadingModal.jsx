import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, CheckCircle } from 'lucide-react'

export default function AnalysisLoadingModal({ 
  isOpen, 
  progress: externalProgress, 
  onComplete,
  title,
  message
}) {
  const [internalProgress, setInternalProgress] = useState(0)
  const progress = externalProgress !== undefined ? externalProgress : internalProgress

  useEffect(() => {
    if (!isOpen) {
      setInternalProgress(0)
      return
    }

    // If external progress is provided, don't simulate
    if (externalProgress !== undefined) {
      if (externalProgress >= 100) {
        setTimeout(() => {
          onComplete?.()
        }, 500)
      }
      return
    }

    // Simulate progress (not real, just for UX)
    const interval = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 95) {
          return 95 // Stop at 95% until real completion
        }
        // Increment by random amounts to make it feel natural
        const increment = Math.random() * 8 + 2
        return Math.min(prev + increment, 95)
      })
    }, 300)

    return () => clearInterval(interval)
  }, [isOpen, externalProgress, onComplete])

  useEffect(() => {
    if (isOpen && progress >= 100 && externalProgress === undefined) {
      setTimeout(() => {
        onComplete?.()
      }, 500)
    }
  }, [progress, isOpen, onComplete, externalProgress])

  // Prevent body scroll when modal is open - must be before early return
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4" 
      style={{ 
        position: 'fixed', 
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw', 
        height: '100vh',
        minWidth: '100vw',
        minHeight: '100vh',
        zIndex: 99999,
        overflow: 'hidden',
        margin: 0,
        padding: '1rem',
        // Force hardware acceleration and new stacking context
        transform: 'translateZ(0)',
        willChange: 'transform',
        // Ensure it's above everything
        isolation: 'isolate'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-lg max-w-md w-full p-8 shadow-2xl relative z-10">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            {progress < 100 ? (
              <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto" />
            ) : (
              <CheckCircle className="w-16 h-16 text-success-600 mx-auto" />
            )}
          </div>
          
          <h3 className="text-2xl font-heading font-bold text-neutral-900 mb-2">
            {progress < 100 ? (title || 'Analyzing Resume...') : (title?.replace('...', ' Complete!') || 'Analysis Complete!')}
          </h3>
          
          <p className="text-neutral-600 mb-6">
            {progress < 100 
              ? (message || 'Our AI is analyzing your resume for ATS compatibility, keyword optimization, and content quality.')
              : (message?.replace('...', ' is ready!') || 'Your resume analysis is ready!')
            }
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-200 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <p className="text-sm font-semibold text-primary-600">
            {Math.round(Math.min(progress, 100))}% Complete
          </p>
        </div>
      </div>
    </div>
  )

  // Render modal using portal to document.body to ensure it's above everything
  return createPortal(modalContent, document.body)
}

