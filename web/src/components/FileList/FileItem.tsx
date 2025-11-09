import { formatDistanceToNow } from 'date-fns'
import { DocumentIcon, FolderIcon } from '@heroicons/react/24/outline'

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

interface FileItemProps {
  file: File
  onDelete: (fileId: string) => void
  onShare: (file: File) => void
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function FileItem({ file, onDelete, onShare }: FileItemProps) {
  return (
    <div className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0 mr-4">
        {file.type === 'folder' ? (
          <FolderIcon className="w-8 h-8 text-primary-500" />
        ) : (
          <DocumentIcon className="w-8 h-8 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">
          {formatFileSize(file.size)} • {formatDistanceToNow(new Date(file.updatedAt), { addSuffix: true })}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onShare(file)}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Share
        </button>
        <button
          onClick={() => onDelete(file.id)}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

