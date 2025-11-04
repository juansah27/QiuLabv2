import { useContext, useCallback } from 'react';
import { AuthContext, PERMISSIONS } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Gunakan useCallback untuk meng-cache fungsi-fungsi
  const hasPermissionMemoized = useCallback(context.hasPermission, [context.user?.id, context.user?.permissions]);
  const hasRoleMemoized = useCallback(context.hasRole, [context.user?.id, context.user?.role, context.user?.is_admin]);
  const hasAnyRoleMemoized = useCallback(context.hasAnyRole, [context.user?.id, context.user?.role, context.user?.is_admin]);
  const hasAnyPermissionMemoized = useCallback(context.hasAnyPermission, [context.user?.id, context.user?.permissions]);
  
  // Tambahkan debug logging hanya jika debug mode aktif
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_AUTH === 'true') {
    const { user } = context;
    
    return {
      ...context,
      hasPermission: (permission) => {
        const result = hasPermissionMemoized(permission);
        console.log(
          `Permission check: ${permission}, Result: ${result}`, 
          'User:', user, 
          'User Role:', user?.role,
          'Is Admin:', user?.is_admin
        );
        return result;
      },
      hasRole: (role) => {
        const result = hasRoleMemoized(role);
        console.log(
          `Role check: ${role}, Result: ${result}`, 
          'User:', user, 
          'User Role:', user?.role
        );
        return result;
      }
    };
  }
  
  // Memastikan permissions diekspor dan menggunakan versi memoized dari fungsi-fungsi
  return {
    ...context,
    permissions: PERMISSIONS,
    hasPermission: hasPermissionMemoized,
    hasRole: hasRoleMemoized,
    hasAnyRole: hasAnyRoleMemoized,
    hasAnyPermission: hasAnyPermissionMemoized
  };
};

export default useAuth; 