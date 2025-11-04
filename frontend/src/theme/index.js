import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#5dadff',
      main: '#2979ff',
      dark: '#0053cb',
      contrastText: '#ffffff',
    },
    secondary: {
      light: '#7bc99a',
      main: '#4caf50',
      dark: '#3b8a3e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    info: {
      main: '#17a2b8',
    },
    success: {
      main: '#28a745',
    },
    warning: {
      main: '#ffc107',
    },
    error: {
      main: '#dc3545',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      light: '#5dadff',
      main: '#2979ff',
      dark: '#0053cb',
      contrastText: '#ffffff',
    },
    secondary: {
      light: '#7bc99a',
      main: '#4caf50',
      dark: '#3b8a3e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#202124',
      paper: '#303134',
    },
    info: {
      main: '#17a2b8',
    },
    success: {
      main: '#28a745',
    },
    warning: {
      main: '#ffc107',
    },
    error: {
      main: '#dc3545',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
        },
      },
    },
  },
});

const getTheme = (mode) => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

export default getTheme; 