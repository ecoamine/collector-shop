import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const normalizedRole = role?.replace(/^ROLE_/, '') || null;

  useEffect(() => {
    if (requiredRole && normalizedRole !== requiredRole && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [requiredRole, normalizedRole, isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && normalizedRole !== requiredRole) {
    return null;
  }

  return children;
}

