import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { FileList } from '@/components/FileList/FileList'
import { UploadModal } from '@/components/FileUpload/UploadModal'
import { ShareModal } from '@/components/ShareModal'
import toast from 'react-hot-toast'

interface File {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  contentType?: string
  createdAt: string
  updatedAt: string
}

export function Files() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState('/')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    loadFiles()
  }, [currentPath])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const data = await api.listFiles(currentPath)
      setFiles(data.files || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    await loadFiles()
    setShowUploadModal(false)
    toast.success('File uploaded successfully')
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      await api.deleteFile(fileId)
      toast.success('File deleted')
      await loadFiles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete file')
    }
  }

  const handleShare = (file: File) => {
    setSelectedFile(file)
    setShowShareModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Files</h1>
          <p className="text-gray-600 mt-1">Manage your organization's files</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary"
        >
          Upload File
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <FileList
          files={files}
          onDelete={handleDelete}
          onShare={handleShare}
        />
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          parentPath={currentPath}
        />
      )}

      {showShareModal && selectedFile && (
        <ShareModal
          file={selectedFile}
          onClose={() => {
            setShowShareModal(false)
            setSelectedFile(null)
          }}
        />
      )}
    </div>
  )
}

