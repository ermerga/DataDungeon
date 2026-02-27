import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NewProject from './pages/NewProject'
import Results from './pages/Results'
import WhatIf from './pages/WhatIf'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NewProject />} />
        <Route path="/projects/:id/results" element={<Results />} />
        <Route path="/projects/:id/whatif" element={<WhatIf />} />
      </Routes>
    </BrowserRouter>
  )
}
