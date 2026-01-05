import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Zap, Check, CreditCard, Sparkles } from 'lucide-react'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

export default function BuyCredits() {
  const { user } = useSelector((state) => state.auth)
  const [processing, setProcessing] = useState(false)
  const [purchaseConfirm, setPurchaseConfirm] = useState({ isOpen: false, packageData: null })
  const navigate = useNavigate()

  const packages = [
    {
      name: 'Starter',
      credits: 10,
      price: 9.99,
      popular: false,
      features: [
        '10 Resume Exports',
        '10 ATS Analyses',
        'Basic Templates',
        'Email Support'
      ]
    },
    {
      name: 'Professional',
      credits: 50,
      price: 39.99,
      popular: true,
      features: [
        '50 Resume Exports',
        '50 ATS Analyses',
        'Premium Templates',
        'Priority Support',
        'Custom Branding'
      ]
    },
    {
      name: 'Enterprise',
      credits: 200,
      price: 129.99,
      popular: false,
      features: [
        '200 Resume Exports',
        '200 ATS Analyses',
        'All Templates',
        '24/7 Support',
        'Custom Branding',
        'API Access'
      ]
    }
  ]

  const handlePurchase = (packageData) => {
    setPurchaseConfirm({ isOpen: true, packageData })
  }

  const confirmPurchase = async () => {
    if (!purchaseConfirm.packageData) return

    setProcessing(true)
    setPurchaseConfirm({ isOpen: false, packageData: null })
    
    try {
      const response = await api.post('/payments/create', {
        credits: purchaseConfirm.packageData.credits,
        amount: purchaseConfirm.packageData.price
      })

      if (response.data.success) {
        toast.success('Payment successful! Credits added to your account.')
        setTimeout(() => navigate('/dashboard'), 1500)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold mb-4">
          <Sparkles className="w-4 h-4" />
          Pricing Plans
        </div>
        <h1 className="text-4xl font-heading font-bold text-neutral-900 mb-4">
          Choose Your Perfect Plan
        </h1>
        <p className="text-lg text-neutral-600">
          Get credits to unlock premium features and create unlimited professional resumes
        </p>
      </div>

      {/* Current Credits */}
      <div className="max-w-md mx-auto">
        <div className="card p-6 text-center" style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
        }}>
          <Zap className="w-12 h-12 text-primary-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-neutral-700 mb-1">Current Balance</p>
          <p className="text-4xl font-bold text-gradient">{user?.credits || 0} Credits</p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {packages.map((pkg, index) => (
          <div
            key={index}
            className={`card relative ${pkg.popular ? 'ring-2 ring-primary-500 shadow-primary' : ''}`}
          >
            {pkg.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1 rounded-full text-sm font-bold text-white" style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
                }}>
                  POPULAR
                </span>
              </div>
            )}

            <div className="p-6">
              {/* Package Header */}
              <h3 className="text-2xl font-heading font-bold text-neutral-900 mb-2">{pkg.name}</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-neutral-900">${pkg.price}</span>
                <span className="text-neutral-600">/ {pkg.credits} credits</span>
              </div>

              {/* Credits Display */}
              <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-success-50 to-success-100">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-6 h-6 text-success-600" />
                  <span className="text-2xl font-bold text-success-700">{pkg.credits}</span>
                  <span className="text-success-600">Credits</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Purchase Button */}
              <button
                onClick={() => handlePurchase(pkg)}
                disabled={processing}
                className={`w-full ${pkg.popular ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Purchase Now
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mt-12">
        <div className="card p-8">
          <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-6 text-center">
            How Credits Work
          </h2>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">💎 What are credits?</h4>
              <p className="text-neutral-600">Credits are used to export resumes as PDF and analyze them with our ATS system. Each action costs 1 credit.</p>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">⏰ Do credits expire?</h4>
              <p className="text-neutral-600">No! Your credits never expire and roll over month to month.</p>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">🔒 Is payment secure?</h4>
              <p className="text-neutral-600">Yes, all payments are processed securely through industry-standard encryption.</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={purchaseConfirm.isOpen}
        onClose={() => setPurchaseConfirm({ isOpen: false, packageData: null })}
        onConfirm={confirmPurchase}
        title="Confirm Purchase"
        message={purchaseConfirm.packageData ? `Purchase ${purchaseConfirm.packageData.credits} credits for $${purchaseConfirm.packageData.price}?` : ''}
        type="info"
        confirmText="Purchase"
        loading={processing}
      />
    </div>
  )
}
