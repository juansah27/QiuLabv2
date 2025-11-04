import React, { useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Component for conditionally rendering children based on user permissions or roles
 * 
 * @param {Object} props
 * @param {string} [props.requiredPermission] - Permission needed to view this component
 * @param {string[]} [props.requiredPermissions] - Array of permissions (any one needed)
 * @param {string} [props.requiredRole] - Role needed to view this component
 * @param {string[]} [props.requiredRoles] - Array of roles (any one needed)
 * @param {React.ReactNode} [props.fallback] - Component to show if permission check fails
 * @param {boolean} [props.silent] - If true, renders nothing instead of fallback when check fails
 * @returns {React.ReactNode}
 */
const ProtectedComponent = ({ 
  requiredPermission,
  requiredPermissions,
  requiredRole,
  requiredRoles,
  fallback = null,
  silent = false,
  children
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasRole, 
    hasAnyRole,
    logActivity,
    user
  } = useAuth();

  // Menggunakan useMemo untuk mencegah evaluasi berulang pada setiap render
  const hasAccess = useMemo(() => {
    // Cepat return true jika user adalah admin
    if (user?.is_admin === true) {
      return true;
    }

    if (requiredPermission) {
      return hasPermission(requiredPermission);
    } else if (requiredPermissions) {
      return hasAnyPermission(requiredPermissions);
    } else if (requiredRole) {
      return hasRole(requiredRole);
    } else if (requiredRoles) {
      return hasAnyRole(requiredRoles);
    }
    
    return true;
  }, [
    user?.is_admin, // Dependency pada status admin
    requiredPermission, 
    requiredPermissions, 
    requiredRole, 
    requiredRoles,
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole
  ]);

  // Pindahkan logging ke useEffect untuk mencegah setState selama rendering
  useEffect(() => {
    // Log access denied attempt if not in silent mode
    if (!hasAccess && !silent) {
      // Determine what was required
      const requirement = requiredPermission || 
        (requiredPermissions && `one of [${requiredPermissions.join(', ')}]`) ||
        requiredRole ||
        (requiredRoles && `one of [${requiredRoles.join(', ')}]`);
        
      logActivity('access_denied', {
        component: 'ProtectedComponent',
        requirement
      });
    }
  }, [hasAccess, silent, requiredPermission, requiredPermissions, requiredRole, requiredRoles, logActivity]);

  // Render based on access check
  if (!hasAccess) {
    return silent ? null : fallback;
  }

  return children;
};

export default ProtectedComponent; 