import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import NewProject from './pages/NewProject'
import Results from './pages/Results'
import WhatIf from './pages/WhatIf'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
        <Route path="/projects/:id/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/projects/:id/whatif" element={<ProtectedRoute><WhatIf /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
