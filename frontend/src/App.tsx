import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '@/stores/auth'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import UploadPage from '@/pages/Upload'
import Result from '@/pages/Result'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '40vh' }} />
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
      <Route path="/tasks/:id" element={<PrivateRoute><Result /></PrivateRoute>} />
    </Routes>
  )
}

export default App
