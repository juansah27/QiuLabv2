import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { USER_ROLES } from './context/AuthContext';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import getTheme from './theme';
import { setPageTitle } from './utils/pageTitle';
import TableExample from './components/TableExample';
// Import komponen diagnostik
import ConnectionDiagnostic from './components/diagnostics/ConnectionDiagnostic';

// Layout Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Profile/Profile';
import Queries from './pages/Queries/Queries';
import QueryDetail from './pages/Queries/QueryDetail';
import GenerateQueries from './pages/Queries/GenerateQueries';
import NotFound from './pages/NotFound';
import Home from './pages/Home';
import SetupRequestTailwind from './pages/SetupRequestTailwind';
import Statistics from './pages/Statistics';
import Unauthorized from './pages/Unauthorized';
import TokenDebug from './pages/Debug/TokenDebug';
import DebugTest from './pages/Debug/DebugTest';
import PasswordReset from './pages/Debug/PasswordReset';
import ConnectionTest from './pages/Debug/ConnectionTest';
import MonitoringPage from './pages/Monitoring/MonitoringPage';
import MonitoringOrder from './pages/MonitoringOrder/MonitoringOrder';
import UserManagement from './pages/UserManagement/UserManagement';
import GetOrder from './pages/Otomasi/GetOrder';
import RefreshDB from './pages/RefreshDB';



function App() {
  // Note: Individual pages will set their own titles using usePageTitle hook

  // Wrap these hooks in try/catch to prevent blank screen if context providers are missing
  let user = null;
  let authLoading = false;
  let themeMode = 'light';
  let userRoles = {};

  try {
    const auth = useAuth();
    user = auth.user;
    authLoading = auth.loading;
    userRoles = auth.roles;
  } catch (error) {
    console.error('Auth context error:', error);
  }

  try {
    themeMode = useTheme().theme;
  } catch (error) {
    console.error('Theme context error:', error);
  }

  const [appLoading, setAppLoading] = useState(true);
  const muiTheme = getTheme(themeMode);

  useEffect(() => {
    // Set dark mode class on body based on theme
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  useEffect(() => {
    // Simulate app initialization
    if (!authLoading) {
      setAppLoading(false);
    }
  }, [authLoading]);

  if (appLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/monitoring" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/monitoring" /> : <Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/debug-token" element={<TokenDebug />} />
        <Route path="/debug-test" element={<DebugTest />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/connection-test" element={<ConnectionTest />} />

        {/* Protected routes with shared layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to={user ? "/monitoring" : "/login"} />} />

          {/* Basic authenticated routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/generate" element={<GenerateQueries />} />
            <Route path="/queries/:id" element={<QueryDetail />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/monitoring-order" element={<MonitoringOrder />} />
            <Route path="/setup-request" element={<SetupRequestTailwind />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/table-example" element={<TableExample />} />
            <Route path="/otomasi/get-order" element={<GetOrder />} />
            <Route path="/refreshdb" element={<RefreshDB />} />

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
              <Route path="/manage-users" element={<UserManagement />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Tambahkan diagnostik koneksi (hanya muncul di mode development) */}
      {import.meta.env.DEV && <ConnectionDiagnostic />}
    </MuiThemeProvider>
  );
}

export default App; 