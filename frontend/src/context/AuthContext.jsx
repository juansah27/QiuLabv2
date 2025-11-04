import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { getApiUrl } from '../config';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

// Define user roles dan their hierarchy
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

// Define permissions
export const PERMISSIONS = {
  // Excel permissions
  EXCEL_CREATE: 'excel:create',
  EXCEL_READ: 'excel:read',
  EXCEL_UPDATE: 'excel:update',
  EXCEL_DELETE: 'excel:delete',
  
  // Query permissions
  QUERY_CREATE: 'query:create',
  QUERY_READ: 'query:read',
  QUERY_UPDATE: 'query:update',
  QUERY_DELETE: 'query:delete',
  QUERY_EXECUTE: 'query:execute',
  
  // Database permissions
  DB_READ: 'database:read',
  DB_MODIFY: 'database:modify',
  
  // Setup request permissions
  SETUP_CREATE: 'setup:create',
  SETUP_READ: 'setup:read',
  
  // User management permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
};

// Role hierarchy for permission checks
export const ROLE_HIERARCHY = {
  [USER_ROLES.ADMIN]: [USER_ROLES.ADMIN, USER_ROLES.USER],
  [USER_ROLES.USER]: [USER_ROLES.USER],
};

// Permission mapping to roles
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS)
  ],
  [USER_ROLES.USER]: [
    // Excel full access
    PERMISSIONS.EXCEL_CREATE,
    PERMISSIONS.EXCEL_READ,
    PERMISSIONS.EXCEL_UPDATE,
    PERMISSIONS.EXCEL_DELETE,
    
    // Query full access
    PERMISSIONS.QUERY_CREATE,
    PERMISSIONS.QUERY_READ,
    PERMISSIONS.QUERY_UPDATE,
    PERMISSIONS.QUERY_DELETE,
    PERMISSIONS.QUERY_EXECUTE,
    
    // Database read access
    PERMISSIONS.DB_READ,
    
    // Setup request read access
    PERMISSIONS.SETUP_READ,
    
    // User management (limited access)
    PERMISSIONS.USER_READ,
  ],
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState(true); // Enable debug mode by default
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();

  // Initialize auth state from localStorage on app load
  useEffect(() => {
    // Mengatur konfigurasi default axios
    const axiosTimeout = parseInt(import.meta.env.VITE_AXIOS_TIMEOUT || '30000', 10);
    axios.defaults.timeout = axiosTimeout; // Gunakan timeout dari variabel lingkungan
    axios.defaults.withCredentials = false; // Nonaktifkan credentials untuk mendukung CORS '*'
    
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const currentApiUrl = getApiUrl();
      
      if (token) {
        try {
          // Check if token is expired
          let decodedToken;
          try {
            decodedToken = jwtDecode(token);
            
            // Validasi bahwa subject ada dan berupa string
            if (!decodedToken.sub || typeof decodedToken.sub !== 'string') {
              console.warn('Token tidak memiliki subject yang valid. Memperbaiki token...');
              // Jika tidak ada subject atau bukan string, buat token baru
              decodedToken.sub = decodedToken.sub || 'fallback-user';
              if (typeof decodedToken.sub !== 'string') {
                decodedToken.sub = String(decodedToken.sub);
              }
            }
          } catch (tokenErr) {
            console.error('Token decode error:', tokenErr);
            localStorage.removeItem('token');
            setLoading(false);
            return;
          }
          
          const currentTime = Date.now() / 1000;
          
          console.log('Token decoded:', { 
            exp: new Date(decodedToken.exp * 1000).toLocaleString(), 
            now: new Date(currentTime * 1000).toLocaleString() 
          });
          
          if (decodedToken.exp < currentTime) {
            console.log('Token expired, logging out');
            // Token expired, logout user
            localStorage.removeItem('token');
            setLoading(false);
            return;
          }
          
          // Set auth header for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Gunakan debug endpoint terlebih dahulu dengan penanganan error yang lebih baik
          try {
            console.log('Validating token first...');
            const debugResponse = await axios.get(`${currentApiUrl}/auth/debug-token`, {
              validateStatus: function (status) {
                // Terima semua status kode untuk menghindari exception
                return true;
              }
            });
            
            // Check if valid response
            if (debugResponse.status !== 200) {
              console.warn(`Token validation responded with status ${debugResponse.status}. Continuing with fallback...`);
              // Lanjutkan dengan token yang ada meskipun validasi gagal
            } else {
              console.log('Token valid:', debugResponse.data);
            }
          } catch (debugErr) {
            console.warn('Token validation failed, but continuing:', debugErr);
            // Jangan keluar jika validasi gagal, coba lanjutkan dengan token yang ada
          }
          
          // Jika token valid, coba fetch user (dengan penanganan error yang lebih baik)
          console.log('Fetching user data from:', `${currentApiUrl}/auth/me`);
          try {
            const response = await axios.get(`${currentApiUrl}/auth/me`, {
              validateStatus: function (status) {
                // Terima status 200-299 dan 422 sebagai valid
                return (status >= 200 && status < 300) || status === 422;
              }
            });
            
            // Jika berhasil mendapatkan user data
            if (response.status >= 200 && response.status < 300) {
              console.log('User data fetched:', response.data);
              
              // Periksa role user
              const userData = response.data;
              if (!userData.role && userData.is_admin) {
                console.log('Adding admin role to user with is_admin=true');
                userData.role = USER_ROLES.ADMIN;
              } else if (!userData.role) {
                console.log('Adding default user role');
                userData.role = USER_ROLES.USER;
              }
              
              // Coba ambil izin khusus pengguna dengan lebih robust
              try {
                // Hanya coba ambil izin pengguna jika userData memiliki id
                if (userData && userData.id) {
                  console.log(`Attempting to fetch permissions for user ID: ${userData.id}`);
                  
                  // Tambahkan variabel untuk menandai jika permintaan izin berhasil
                  let permissionsSuccess = false;
                  
                  try {
                    const permissionsUrl = `${currentApiUrl}/auth/users/${userData.id}/permissions`;
                    console.log(`Trying primary permissions URL: ${permissionsUrl}`);
                    
                    try {
                      const permissionsResponse = await axios.get(permissionsUrl, {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        timeout: axiosTimeout // Gunakan timeout yang sama
                      });
                      
                      console.log('User permissions response status:', permissionsResponse.status);
                      
                      if (permissionsResponse.data && permissionsResponse.data.permissions) {
                        userData.permissions = permissionsResponse.data.permissions;
                        console.log(`Received ${userData.permissions.length} permissions for user from primary endpoint`);
                        permissionsSuccess = true;
                      } else {
                        console.warn('Primary permissions endpoint response without expected data format:', permissionsResponse.data);
                        // Lanjut ke fallback endpoint
                      }
                    } catch (primaryError) {
                      // Coba gunakan endpoint simple-permissions sebagai fallback
                      console.log('Primary permissions endpoint failed:', primaryError.message);
                      console.log('Trying simple-permissions endpoint instead');
                    }
                    
                    // Jika endpoint pertama gagal, langsung gunakan role-based permissions
                    if (!permissionsSuccess) {
                      console.log('Using role-based permissions as fallback');
                      const userRole = userData.role || (userData.is_admin ? USER_ROLES.ADMIN : USER_ROLES.USER);
                      userData.permissions = ROLE_PERMISSIONS[userRole] || [];
                      console.log(`Assigned ${userData.permissions.length} permissions based on role:`, userRole);
                      permissionsSuccess = true;
                    }
                  } catch (permRequestError) {
                    // Penanganan kesalahan pada permintaan HTTP
                    console.warn(`HTTP error fetching permissions: ${permRequestError.message}`);
                    
                    // Jangan lempar error, gunakan fallback sebagai gantinya
                    console.log('Using role-based permissions due to HTTP error');
                    const userRole = userData.role || (userData.is_admin ? USER_ROLES.ADMIN : USER_ROLES.USER);
                    userData.permissions = ROLE_PERMISSIONS[userRole] || [];
                    console.log(`Assigned ${userData.permissions.length} permissions based on role:`, userRole);
                  }
                } else {
                  console.log('Skipping permissions fetch - no user ID available');
                  // Gunakan role-based permissions sebagai fallback jika tidak ada user ID
                  const userRole = userData.role || (userData.is_admin ? USER_ROLES.ADMIN : USER_ROLES.USER);
                  userData.permissions = ROLE_PERMISSIONS[userRole] || [];
                  console.log('Using role-based permissions (no user ID):', userData.permissions);
                }
              } catch (permError) {
                console.warn('Unhandled error while handling permissions, using role-based permissions:', permError);
                
                // Tambahkan role-based permissions sebagai fallback
                const userRole = userData.role || (userData.is_admin ? USER_ROLES.ADMIN : USER_ROLES.USER);
                userData.permissions = ROLE_PERMISSIONS[userRole] || [];
                console.log('Using fallback permissions due to error:', userData.permissions);
              }
              
              // Set user state
              setUser(userData);
              
              // Log successful login/session restore
              logActivity('session_restore', { status: 'success' });
            } else {
              console.warn(`User data fetch failed with status ${response.status}, using fallback data...`);
              // Fallback user data jika gagal mendapatkan data user
              const fallbackUser = {
                username: decodedToken.sub || 'fallback-user',
                name: decodedToken.name || 'User',
                role: decodedToken.role || USER_ROLES.USER,
                is_admin: decodedToken.is_admin || false,
                permissions: ROLE_PERMISSIONS[decodedToken.role || USER_ROLES.USER] || []
              };
              setUser(fallbackUser);
            }
          } catch (userErr) {
            console.error('Error fetching user data:', userErr);
            // Fallback untuk kasus error saat fetching user
            const fallbackUser = {
              username: decodedToken.sub || 'fallback-user',
              name: decodedToken.name || 'User',
              role: decodedToken.role || USER_ROLES.USER,
              is_admin: decodedToken.is_admin || false,
              permissions: ROLE_PERMISSIONS[decodedToken.role || USER_ROLES.USER] || []
            };
            setUser(fallbackUser);
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          // Hapus token karena tidak valid
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          
          logActivity('session_restore', { 
            status: 'error', 
            error: error.message || 'Unknown error' 
          });
        }
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      console.log('Login attempt:', credentials.username);
      
      // Call API to login - pastikan path yang benar
      const axiosTimeout = parseInt(import.meta.env.VITE_AXIOS_TIMEOUT || '30000', 10);
      
      // Gunakan URL backend langsung untuk menghindari masalah proxy
      const apiBaseUrl = getApiUrl().replace('/api', '');
      const loginUrl = `${apiBaseUrl}/api/auth/login`;
      console.log('Login URL:', loginUrl);
      
      const response = await axios.post(loginUrl, credentials, {
        timeout: axiosTimeout, // Gunakan timeout dari variabel lingkungan
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: false // Nonaktifkan credentials untuk konsistensi dengan konfigurasi baru
      });
      
      // Extract user and token from response
      // Sekarang mendukung format respons lama (access_token) dan baru (token)
      const { user } = response.data;
      const access_token = response.data.access_token || response.data.token;
      
      // Add debug logs
      console.log('Login response received:', {
        user: user ? {...user, password: '[REDACTED]'} : null,
        tokenReceived: !!access_token,
        tokenLength: access_token ? access_token.length : 0,
        responseData: JSON.stringify(response.data)
      });
      
      if (!access_token) {
        console.error('No token received in login response, full response:', response.data);
        return {
          success: false,
          message: 'Server tidak mengirimkan token otentikasi'
        };
      }
      
      // Add role if missing but is_admin exists
      if (!user.role && user.is_admin) {
        user.role = 'admin';
        console.log('Added admin role based on is_admin flag');
      }
      
      // Save token to localStorage
      localStorage.setItem('token', access_token);
      
      // Set auth header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Update state
      setUser(user);
      
      // Log successful login
      logActivity('login', { status: 'success', username: user.username });
      
      // Return success but don't redirect automatically
      // Let the Login component handle the redirection
      return { 
        success: true, 
        user,
        message: 'Login berhasil'
      };
    } catch (error) {
      // Improved error handling
      console.log('Login error details:', error);
      
      let errorMessage = 'Terjadi kesalahan saat login. Pastikan server backend berjalan dan dapat diakses.';
      
      // Enhanced error handling
      if (error.response) {
        // The server responded with an error status
        if (error.response.status === 500) {
          console.error("Server error (500) during login:", error.response.data);
          errorMessage = "Terjadi kesalahan pada server. Silakan coba lagi nanti atau hubungi administrator.";
          
          // Add debug info
          console.log("Server error details:", error.response.data?.error || "Unknown server error");
        } else if (error.response.status === 401) {
          errorMessage = "Username atau password salah";
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.error || "Data login tidak lengkap";
        } else {
          errorMessage = `Error: ${error.response.data?.error || error.response.statusText || "Unknown error"}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        errorMessage = "Server tidak merespons. Coba lagi nanti.";
      } else if (error.request) {
        // Request was made but no response
        errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      }
      
      // Log failed login attempt
      logActivity('login', { 
        status: 'error', 
        username: credentials.username, 
        error: error.response?.data?.error || error.message 
      });
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const handleRegister = async (userData) => {
    try {
      const response = await axios.post(`/api/auth/register`, userData);
      const { user, access_token } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', access_token);
      
      // Set auth header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Update state
      setUser(user);
      
      // Log successful registration
      logActivity('register', { 
        status: 'success', 
        username: user.username 
      });
      
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      
      // Log failed registration
      logActivity('register', { 
        status: 'error', 
        username: userData.username, 
        error: error.response?.data?.error || error.message 
      });
      
      return {
        success: false,
        message: error.response?.data?.error || 'Terjadi kesalahan saat registrasi'
      };
    }
  };

  const handleLogout = () => {
    // Log logout event before removing user info
    if (user) {
      logActivity('logout', { status: 'success', username: user.username });
    }
    
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    
    // Update state
    setUser(null);
  };

  const updateUserProfile = async (updatedUserData) => {
    try {
      // Call API to update user profile
      const response = await axios.put(`/api/auth/profile`, updatedUserData);
      
      if (response.data.success) {
        // Update local user state
        setUser(prevUser => ({
          ...prevUser,
          ...updatedUserData
        }));
        
        // Log profile update
        logActivity('profile_update', { 
          status: 'success',
          fields: Object.keys(updatedUserData).filter(k => k !== 'password')
        });
        
        return { success: true };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      
      // Log failed profile update
      logActivity('profile_update', { 
        status: 'error', 
        error: error.response?.data?.error || error.message 
      });
      
      return {
        success: false,
        message: error.response?.data?.error || 'Terjadi kesalahan saat memperbarui profil'
      };
    }
  };
  
  // Activity logging function
  const logActivity = async (action, details) => {
    if (!user) return;
    
    // Hanya log aktivitas di console
    console.log(`[Activity Log] ${action}:`, details);
    
    // Tambahkan entry ke log lokal
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: user.username,
      action,
      details
    };
    
    // Hanya log di console, tidak perlu menyimpan log
    console.log('Log Entry:', logEntry);
  };

  // Check if user has the required role
  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    // Hapus console.log yang berlebihan untuk meningkatkan performa
    // Hanya log dalam mode development dan untuk debugging
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_AUTH === 'true') {
      console.log("hasRole check:", {
        requiredRole,
        userRole: user.role,
        isAdmin: user.is_admin,
        result: user.role === requiredRole || (user.is_admin === true)
      });
      
      // Admin selalu memiliki semua hak akses
      if (user.is_admin === true) {
        console.log("User is admin, granting access regardless of role");
      }
    }
    
    // Admin selalu memiliki semua hak akses
    if (user.is_admin === true) {
      return true;
    }
    
    // Cek berdasarkan role
    return user.role === requiredRole;
  };

  // Check if user has any of the required roles
  const hasAnyRole = (requiredRoles) => {
    if (!user) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    
    // Hanya log dalam mode development dan untuk debugging
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_AUTH === 'true') {
      console.log("hasAnyRole check:", {
        requiredRoles,
        userRole: user.role,
        isAdmin: user.is_admin
      });
      
      // Admin selalu memiliki semua hak akses
      if (user.is_admin === true) {
        console.log("User is admin, granting access to any role");
      }
    }
    
    // Admin selalu memiliki semua hak akses
    if (user.is_admin === true) {
      return true;
    }
    
    // Cek apakah salah satu role cocok
    return requiredRoles.some(role => user.role === role);
  };
  
  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // If user has custom permissions
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }
    
    // Fall back to role-based permissions
    const userRole = user.role || (user.is_admin ? USER_ROLES.ADMIN : USER_ROLES.USER);
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    
    return rolePermissions.includes(permission);
  };
  
  // Check if user has any of the specified permissions
  const hasAnyPermission = (requiredPermissions) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return requiredPermissions.some(permission => hasPermission(permission));
  };
  
  // Get all permissions for the current user
  const getUserPermissions = () => {
    if (!user) return [];
    
    // Fallback: Jika user.role tidak ada, tentukan permissions berdasarkan is_admin
    if (!user.role && user.is_admin) {
      // Admin memiliki semua permission
      return Object.values(PERMISSIONS);
    } else if (!user.role) {
      // User hanya memiliki permission dasar
      return ROLE_PERMISSIONS[USER_ROLES.USER] || [];
    }
    
    return ROLE_PERMISSIONS[user.role] || [];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: authLoading || loading,
        error: authError,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        updateProfile: updateUserProfile,
        hasRole,
        hasAnyRole,
        hasPermission,
        hasAnyPermission,
        roles: USER_ROLES
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 