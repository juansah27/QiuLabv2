import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorFallback from './components/ErrorFallback';
import './index.css';

// Import utilitas untuk menonaktifkan console.log di lingkungan produksi
import { setupConsoleForEnvironment } from './utils/disableConsoleLog';
// Inisialisasi penanganan konsol
setupConsoleForEnvironment();

// Inisialisasi Axios global
import { useAxios } from './hooks/useAxios';
const AxiosInitializer = ({ children }) => {
  useAxios(); // Panggil useAxios hook untuk inisialisasi
  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AxiosInitializer>
              <App />
            </AxiosInitializer>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
); 