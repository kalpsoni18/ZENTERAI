import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadFile, UploadProgress } from '@/lib/storage'
import toast from 'react-hot-toast'

interface UploadModalProps {
  onClose: () => void
  onUpload: () => void
  parentPath: string
}

export function UploadModal({ onClose, onUpload, parentPath }: UploadModalProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)

    try {
      await uploadFile(file, parentPath, (prog) => {
        setProgress(prog)
      })
      toast.success('File uploaded successfully')
      onUpload()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload File</h2>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              {progress && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Uploading... {progress.percentage.toFixed(1)}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
              </p>
              <p className="text-xs text-gray-500">Supports all file types</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

