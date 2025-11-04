import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Role-based route component that restricts access based on user roles
 * @param {Array} requiredRoles - Array of roles that are allowed to access this route
 * @returns Rendered component or redirect
 */
const RoleBasedRoute = ({ requiredRoles }) => {
  const { user, loading, hasAnyRole } = useAuth();

  // Debug logging
  console.log('RoleBasedRoute - Required roles:', requiredRoles);
  console.log('RoleBasedRoute - User:', user);
  console.log('RoleBasedRoute - User role:', user?.role);
  console.log('RoleBasedRoute - Has required role:', hasAnyRole(requiredRoles));

  // If still loading auth state, show nothing to prevent flash
  if (loading) {
    return null;
  }

  // Check if user is authenticated and has the required role
  if (!user || !hasAnyRole(requiredRoles)) {
    console.log('RoleBasedRoute - Access denied, redirecting to /unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  // Render the protected route
  console.log('RoleBasedRoute - Access granted');
  return <Outlet />;
};

export default RoleBasedRoute; 