import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react'

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  loading = false
}) {
  if (!isOpen) return null

  const typeConfig = {
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-warning-600',
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      buttonColor: 'bg-warning-600 hover:bg-warning-700'
    },
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-error-600',
      bgColor: 'bg-error-50',
      borderColor: 'border-error-200',
      buttonColor: 'bg-error-600 hover:bg-error-700'
    },
    info: {
      icon: Info,
      iconColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      buttonColor: 'bg-primary-600 hover:bg-primary-700'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-success-600',
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      buttonColor: 'bg-success-600 hover:bg-success-700'
    }
  }

  const config = typeConfig[type] || typeConfig.warning
  const Icon = config.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl overflow-hidden">
        <div className={`p-6 ${config.bgColor} border-b ${config.borderColor}`}>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 ${config.iconColor}`}>
              <Icon size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-heading font-bold text-neutral-900 mb-2">
                {title}
              </h2>
              <p className="text-neutral-700">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors font-medium disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-white ${config.buttonColor} rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2`}
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

