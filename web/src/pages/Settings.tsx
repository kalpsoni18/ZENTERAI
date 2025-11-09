import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export function Settings() {
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadOrg()
  }, [])

  const loadOrg = async () => {
    try {
      setLoading(true)
      const data = await api.getOrg()
      setOrg(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.updateOrgSettings(org.settings)
      toast.success('Settings saved successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!org) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your organization settings</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-soft space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name
          </label>
          <input
            type="text"
            value={org.name || ''}
            onChange={(e) => setOrg({ ...org, name: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Storage Quota (GB)
          </label>
          <input
            type="number"
            value={org.settings?.storageQuotaGB || 200}
            onChange={(e) => setOrg({
              ...org,
              settings: { ...org.settings, storageQuotaGB: parseFloat(e.target.value) }
            })}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Storage Isolation Mode
          </label>
          <select
            value={org.settings?.isolationMode || 'prefix'}
            onChange={(e) => setOrg({
              ...org,
              settings: { ...org.settings, isolationMode: e.target.value }
            })}
            className="input"
          >
            <option value="prefix">Prefix (Shared Bucket)</option>
            <option value="bucket">Bucket (Dedicated Bucket)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Prefix mode uses a shared bucket with org-specific prefixes. Bucket mode uses a dedicated bucket per org.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Encryption Mode
          </label>
          <select
            value={org.settings?.encryptionMode || 'sse-kms'}
            onChange={(e) => setOrg({
              ...org,
              settings: { ...org.settings, encryptionMode: e.target.value }
            })}
            className="input"
          >
            <option value="sse-kms">SSE-KMS (Server-side)</option>
            <option value="zero-knowledge">Zero-Knowledge (Client-side)</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

