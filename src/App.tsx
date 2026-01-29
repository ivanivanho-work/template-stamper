import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TemplatesPage from './pages/TemplatesPage';
import GeneratePage from './pages/GeneratePage';
import JobsPage from './pages/JobsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link to="/" className="text-2xl font-bold text-red-500">
                Template Stamper
              </Link>
              <div className="flex gap-6">
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/templates"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Templates
                </Link>
                <Link
                  to="/generate"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Generate
                </Link>
                <Link
                  to="/jobs"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Jobs
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/jobs" element={<JobsPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 border-t border-gray-700 mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-gray-400">
            <p>&copy; 2026 Template Stamper - Phase 1: Core Infrastructure</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
