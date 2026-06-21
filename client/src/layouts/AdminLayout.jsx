import { Outlet, Navigate } from 'react-router-dom';
import AdminNavbar from '../pages/admin/AdminNavbar';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

function AdminLayout() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  // Show loading spinner while checking authentication
  if (loading || !isReady) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // Render admin layout
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;