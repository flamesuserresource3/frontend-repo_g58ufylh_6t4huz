import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import HomePage from './components/HomePage';
import MyBookings from './components/MyBookings';
import ContactPage from './components/ContactPage';
import AdminDashboard from './components/AdminDashboard';

function RequireAdmin({ children }) {
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';
  const location = useLocation();
  if (!isAdmin) {
    if (location.pathname === '/rj-admin') {
      // Admin route itself handles login view, allow rendering
      return children;
    }
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 text-gray-900">
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="my" element={<MyBookings />} />
        <Route path="contact" element={<ContactPage />} />
        <Route
          path="rj-admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
