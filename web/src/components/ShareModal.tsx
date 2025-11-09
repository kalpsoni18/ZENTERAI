import { useState } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface File {
  id: string
  name: string
  type: 'file' | 'folder'
}

interface ShareModalProps {
  file: File
  onClose: () => void
}

export function ShareModal({ file, onClose }: ShareModalProps) {
  const [shareType, setShareType] = useState<'role' | 'user' | 'link'>('link')
  const [role, setRole] = useState('Member')
  const [email, setEmail] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    try {
      setSharing(true)
      const result = await api.shareFile(file.id, {
        role: shareType === 'role' ? role : undefined,
        email: shareType === 'user' ? email : undefined,
        expiresAt: expiresAt || undefined,
      })
      
      if (result.shareToken) {
        const shareUrl = `${window.location.origin}/share/${result.shareToken}`
        navigator.clipboard.writeText(shareUrl)
        toast.success('Share link copied to clipboard!')
      } else {
        toast.success('File shared successfully')
      }
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to share file')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Share {file.name}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Type
            </label>
            <select
              value={shareType}
              onChange={(e) => setShareType(e.target.value as any)}
              className="input"
            >
              <option value="link">Public Link</option>
              <option value="role">By Role</option>
              <option value="user">By User</option>
            </select>
          </div>

          {shareType === 'role' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Member">Member</option>
                <option value="Guest">Guest</option>
              </select>
            </div>
          )}

          {shareType === 'user' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="user@example.com"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires At (optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="btn-primary"
          >
            {sharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  )
}

