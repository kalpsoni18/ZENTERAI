import { FileItem } from './FileItem'

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

interface FileListProps {
  files: File[]
  onDelete: (fileId: string) => void
  onShare: (file: File) => void
}

export function FileList({ files, onDelete, onShare }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-soft">
        <p className="text-gray-500">No files yet. Upload your first file to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-soft overflow-hidden">
      <div className="divide-y divide-gray-200">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            onDelete={onDelete}
            onShare={onShare}
          />
        ))}
      </div>
    </div>
  )
}

