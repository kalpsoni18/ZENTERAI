import { getUser, removeAuthToken } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const user = getUser()
  const navigate = useNavigate()

  const handleLogout = () => {
    removeAuthToken()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">Welcome back</h2>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

