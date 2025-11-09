import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { loadStripe } from '@stripe/stripe-js'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

export function Billing() {
  const [billing, setBilling] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBilling()
  }, [])

  const loadBilling = async () => {
    try {
      setLoading(true)
      const data = await api.getBillingInfo()
      setBilling(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load billing information')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async (priceId: string) => {
    try {
      const { sessionId } = await api.createCheckoutSession(priceId)
      const stripe = await stripePromise
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Billing</h1>
        <p className="text-gray-600 mt-1">Manage your subscription and billing</p>
      </div>

      {billing && (
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Plan:</span> {billing.plan || 'Starter'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Status:</span> {billing.status || 'Active'}
            </p>
            {billing.nextBillingDate && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Next Billing:</span> {new Date(billing.nextBillingDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Starter</h3>
          <p className="text-3xl font-bold text-gray-900 mb-4">$29<span className="text-lg text-gray-600">/mo</span></p>
          <ul className="space-y-2 mb-6 text-sm text-gray-600">
            <li>5 users</li>
            <li>200 GB storage</li>
            <li>Basic support</li>
          </ul>
          <button
            onClick={() => handleCheckout('price_starter')}
            className="btn-primary w-full"
          >
            Select Plan
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-soft border-2 border-primary-500">
          <div className="text-xs font-semibold text-primary-600 mb-2">POPULAR</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Business</h3>
          <p className="text-3xl font-bold text-gray-900 mb-4">$99<span className="text-lg text-gray-600">/mo</span></p>
          <ul className="space-y-2 mb-6 text-sm text-gray-600">
            <li>50 users</li>
            <li>2 TB storage</li>
            <li>Priority support</li>
          </ul>
          <button
            onClick={() => handleCheckout('price_business')}
            className="btn-primary w-full"
          >
            Select Plan
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Enterprise</h3>
          <p className="text-3xl font-bold text-gray-900 mb-4">Custom</p>
          <ul className="space-y-2 mb-6 text-sm text-gray-600">
            <li>Unlimited users</li>
            <li>Unlimited storage</li>
            <li>Dedicated support</li>
          </ul>
          <button
            onClick={() => window.location.href = 'mailto:sales@zenterai.com'}
            className="btn-secondary w-full"
          >
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  )
}

