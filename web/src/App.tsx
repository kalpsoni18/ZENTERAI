import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/Layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Files } from './pages/Files'
import { Team } from './pages/Team'
import { Billing } from './pages/Billing'
import { Settings } from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/files" element={<Files />} />
          <Route path="/team" element={<Team />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

export default App

