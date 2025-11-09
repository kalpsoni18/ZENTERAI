import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  FolderIcon, 
  UsersIcon, 
  CreditCardIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Files', href: '/files', icon: FolderIcon },
  { name: 'Team', href: '/team', icon: UsersIcon },
  { name: 'Billing', href: '/billing', icon: CreditCardIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Zenterai</h1>
        <p className="text-sm text-gray-500 mt-1">Enterprise Storage</p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

