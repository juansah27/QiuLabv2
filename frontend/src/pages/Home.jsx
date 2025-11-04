import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, Grid, Paper, useTheme, Stack, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../utils/pageTitle';
import logoSrc from '../assets/images/qiulab-logo.svg';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const theme = useTheme();
  const { isDarkMode, toggleDarkMode } = useAppTheme();
  
  // Menambahkan judul halaman
  usePageTitle('Home');
  
  // Use useEffect to safely try to get user info
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Import statically but wrap in try-catch for safety
        const authModule = require('../hooks/useAuth');
        if (authModule && authModule.useAuth) {
          const authContext = authModule.useAuth();
          if (authContext && authContext.user) {
            setUser(authContext.user);
          }
        }
      } catch (error) {
        console.log('Auth not available yet, showing unauthenticated view');
      }
    };
    
    checkAuth();
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          py: 1.5, 
          px: 3, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" component="h1" fontWeight="bold" sx={{ mb: 0 }}>
              <Box component="span" sx={{ color: '#00BCD4' }}>Qiu</Box>
              <Box component="span" sx={{ color: '#5D4AFF' }}>Lab</Box>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              sx={{ mr: 1 }} 
              onClick={toggleDarkMode} 
              color="inherit"
              aria-label="toggle dark mode"
            >
              {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            {user ? (
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard')}
                size="medium"
                sx={{ textTransform: 'none' }}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  sx={{ mr: 1, textTransform: 'none' }}
                  size="medium"
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/register')}
                  size="medium"
                  sx={{ textTransform: 'none' }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ mt: 6, mb: 8 }}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div variants={fadeInUp}>
                <Box
                  component="img"
                  src={logoSrc}
                  alt="QiuLab Logo"
                  sx={{
                    height: { xs: 80, sm: 100, md: 120 },
                    width: 'auto',
                    mb: 3,
                    filter: theme.palette.mode === 'dark' ? 'brightness(1.2) contrast(0.85)' : 'none',
                    transition: 'filter 0.3s ease-in-out',
                  }}
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 500, 
                    color: 'text.secondary',
                    fontSize: '1.2rem' 
                  }}
                >
                  Transform Anything. Track Everything.
                </Typography>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Platform pengolahan data dan monitoring order yang terintegrasi. QiuLab membantu Anda
                  mengelola dan memantau order, menganalisis data transaksi, dan meningkatkan efisiensi
                  operasional bisnis Anda.
                </Typography>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => navigate(user ? '/dashboard' : '/register')}
                  sx={{ mt: 2, px: 4, py: 1, textTransform: 'none' }}
                >
                  {user ? 'Buka Dashboard' : 'Mulai Sekarang'}
                </Button>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Paper 
                  elevation={3}
                  sx={{ 
                    height: 300, 
                    bgcolor: 'primary.light',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Animated background gradient pattern */}
                  <motion.div
                    animate={{
                      background: [
                        `radial-gradient(circle, ${theme.palette.primary.main} 10%, transparent 10.5%) 0 0/20px 20px`,
                        `radial-gradient(circle, ${theme.palette.primary.main} 10%, transparent 10.5%) 10px 10px/20px 20px`,
                        `radial-gradient(circle, ${theme.palette.primary.main} 10%, transparent 10.5%) 0 0/20px 20px`
                      ]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      opacity: 0.1
                    }}
                  />
                  
                  {/* Animated chart visualization */}
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    height: '50%',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'flex-end',
                    padding: 2,
                  }}>
                    {[60, 80, 30, 55, 70, 40, 90, 45, 65].map((height, index) => (
                      <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        style={{
                          width: '8%',
                          backgroundColor: 'white',
                          opacity: 0.7,
                          borderTopLeftRadius: 2,
                          borderTopRightRadius: 2,
                        }}
                      />
                    ))}
                  </Box>

                  {/* Animated connection lines */}
                  <Box sx={{ 
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    right: '10%',
                    height: '40%'
                  }}>
                    {[1, 2, 3].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: 1,
                          backgroundColor: 'white',
                          opacity: 0.4,
                          top: `${30 * i}%`,
                          transform: i % 2 === 0 ? 'rotate(1deg)' : 'rotate(-1deg)',
                          transformOrigin: 'left'
                        }}
                      />
                    ))}
                  </Box>

                  {/* Animated data nodes */}
                  <Box sx={{
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    right: '10%',
                    height: '40%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap'
                  }}>
                    {[1, 2, 3, 4, 5, 6].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                          delay: i * 0.1
                        }}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          opacity: 0.8,
                          margin: '5%'
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>

      {/* Feature Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            Fitur Utama
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {[
              {
                title: 'Dashboard Analitik',
                description: 'Visualisasi data order dan transaksi dengan dashboard interaktif'
              },
              {
                title: 'Monitoring Order',
                description: 'Pantau status dan progres order secara real-time'
              },
              {
                title: 'Pengolahan Data',
                description: 'Olah dan analisis data transaksi dengan mudah'
              },
              {
                title: 'Manajemen Pengguna',
                description: 'Kelola pengguna dan hak akses dengan sistem yang aman'
              },
              {
                title: 'Enkripsi SSL',
                description: 'Keamanan data terjamin dengan sertifikat SSL untuk koneksi aman'
              },
              {
                title: 'Akses Multi-Perangkat',
                description: 'Akses aplikasi dari berbagai perangkat di jaringan yang sama'
              }
            ].map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  elevation={1}
                >
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        mt: 'auto',
        py: 3, 
        bgcolor: 'background.paper', 
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Container>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} QiuLab
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 