import React from 'react';
import { useAuth } from '../hooks/useAuth';
import ProtectedComponent from './ProtectedComponent';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

/**
 * Button component with built-in permission checking
 * 
 * @param {Object} props
 * @param {string} [props.requiredPermission] - Permission needed to see/use this button
 * @param {string[]} [props.requiredPermissions] - Array of permissions (any one needed)
 * @param {string} [props.requiredRole] - Role needed to see/use this button
 * @param {string[]} [props.requiredRoles] - Array of roles (any one needed)
 * @param {boolean} [props.hideOnNoAccess] - If true, hides button instead of disabling it
 * @param {string} [props.tooltip] - Tooltip to show when hovering over disabled button
 * @param {React.ReactNode} props.children - Button content
 * @returns {React.ReactNode}
 */
const PermissionButton = ({ 
  requiredPermission,
  requiredPermissions,
  requiredRole,
  requiredRoles,
  hideOnNoAccess = false,
  tooltip = "Anda tidak memiliki izin untuk aksi ini",
  className = "",
  variant = "default",
  size = "default",
  onClick,
  children,
  ...props
}) => {
  const { user } = useAuth();
  
  // If user is not logged in, don't show the button
  if (!user) {
    return null;
  }
  
  if (hideOnNoAccess) {
    return (
      <ProtectedComponent
        requiredPermission={requiredPermission}
        requiredPermissions={requiredPermissions}
        requiredRole={requiredRole}
        requiredRoles={requiredRoles}
        silent={true}
      >
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={onClick}
          {...props}
        >
          {children}
        </Button>
      </ProtectedComponent>
    );
  }
  
  return (
    <ProtectedComponent
      requiredPermission={requiredPermission}
      requiredPermissions={requiredPermissions}
      requiredRole={requiredRole}
      requiredRoles={requiredRoles}
      fallback={
        <Button
          variant={variant}
          size={size}
          disabled
          className={cn("opacity-50 cursor-not-allowed", className)}
          title={tooltip}
          {...props}
        >
          {children}
        </Button>
      }
    >
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={onClick}
        {...props}
      >
        {children}
      </Button>
    </ProtectedComponent>
  );
};

export default PermissionButton; 