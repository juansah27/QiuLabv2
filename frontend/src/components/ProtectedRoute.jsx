import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from './ui/card';

const ProtectedRoute = ({ requiredRoles }) => {
  const { user, loading, hasAnyRole } = useAuth();
  const location = useLocation();

  // If still loading auth state, show a loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="w-20 h-20 flex items-center justify-center">
          <CardContent className="p-0">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified and user doesn't have any of the required roles
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render children routes
  return <Outlet />;
};

export default ProtectedRoute; 