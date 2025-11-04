import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, Container, Typography, Button, TextField, 
  FormControl, InputLabel, Select, MenuItem, 
  FormControlLabel, Checkbox, Paper, Grid, 
  Alert, CircularProgress, Divider, Snackbar,
  List, ListItem, ListItemText, IconButton,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Card, CardContent, Chip,
  useTheme, Collapse, AlertTitle
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import axios from 'axios';
import { getApiUrl } from '../config';
import { useAuth } from '../hooks/useAuth';
import { 
  getErrorMessage, 
  handleAxiosError, 
  validateFile, 
  withRetry,
  logError 
} from '../utils/errorHandler';

// Styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const LogItem = styled(ListItem)(({ theme, level }) => ({
  padding: theme.spacing(1),
  borderLeft: `4px solid ${
    level === 'error' ? theme.palette.error.main : 
    level === 'warning' ? theme.palette.warning.main : 
    theme.palette.info.main
  }`,
  backgroundColor: level === 'error' ? 'rgba(220, 53, 69, 0.08)' : 'transparent',
  marginBottom: theme.spacing(0.5),
  borderRadius: '0 4px 4px 0',
}));

const DropzoneBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(6),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(41, 121, 255, 0.04)',
    borderColor: theme.palette.primary.main,
  }
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
  }
}));

const PageHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  padding: theme.spacing(4, 0),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  color: 'white',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

// Main component
const SetupRequest = () => {
  // Theme
  const theme = useTheme();
  
  // States
  const [selectedFile, setSelectedFile] = useState(null);
  const [processType, setProcessType] = useState('Bundle');
  const [createdBy, setCreatedBy] = useState('');
  const [combineSheets, setCombineSheets] = useState(false);
  const [outputFormat, setOutputFormat] = useState('xlsx');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [shopMappings, setShopMappings] = useState([]);
  const [newMapping, setNewMapping] = useState({
    marketplace: '',
    client: '',
    shop_id: '',
    client_id: ''
  });
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'mappings'
  
  const fileInputRef = useRef(null);
  const logsEndRef = useRef(null);

  const { user, hasRole } = useAuth();

  // Fetch shop mappings on component mount
  useEffect(() => {
    fetchShopMappings();
  }, []);

  // Auto scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);
  
  // Fetch shop mappings from API
  const fetchShopMappings = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await withRetry(async () => {
        return await axios.get(`${apiUrl}/setup-request/mappings`);
      }, 2, 1000);
      
      if (response.data.status === 'success') {
        setShopMappings(response.data.mappings);
      }
    } catch (error) {
      const { message } = handleAxiosError(error, 'mapping');
      setErrorMessage(message);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file using utility function
      const validation = validateFile(file);
      
      if (!validation.isValid) {
        setErrorMessage(validation.errorMessage);
        setLogs(prev => [...prev, { 
          level: 'error', 
          message: `Validasi file gagal: ${validation.errorMessage}`, 
          time: new Date().toLocaleTimeString() 
        }]);
        return;
      }
      
      setSelectedFile(file);
      setErrorMessage(''); // Clear any previous errors
      
      // Add log entry
      setLogs(prev => [...prev, { 
        level: 'info', 
        message: `File dipilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 
        time: new Date().toLocaleTimeString() 
      }]);
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      // Validate file using utility function
      const validation = validateFile(file);
      
      if (!validation.isValid) {
        setErrorMessage(validation.errorMessage);
        setLogs(prev => [...prev, { 
          level: 'error', 
          message: `Validasi file gagal: ${validation.errorMessage}`, 
          time: new Date().toLocaleTimeString() 
        }]);
        return;
      }
      
      setSelectedFile(file);
      setErrorMessage(''); // Clear any previous errors
      
      // Add log entry
      setLogs(prev => [...prev, { 
        level: 'info', 
        message: `File dipilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 
        time: new Date().toLocaleTimeString() 
      }]);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setErrorMessage('Pilih file terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setLogs(prev => [...prev, { 
      level: 'info', 
      message: 'Memulai pemrosesan file...', 
      time: new Date().toLocaleTimeString() 
    }]);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('process_type', processType);
      formData.append('created_by', createdBy);
      formData.append('combine_sheets', combineSheets);
      formData.append('output_format', outputFormat);

      console.log("Submitting file:", selectedFile.name);
      
      // Use retry mechanism for better reliability
      const response = await withRetry(async () => {
        return await axios.post(`${getApiUrl()}/setup-request/process`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 300000 // 5 minutes timeout for large files
        });
      }, 3, 2000);

      console.log("Process response:", response.data);
      if (response.data.status === 'success') {
        setSuccessMessage('File berhasil diproses!');
        setRequestId(response.data.request_id);
        // Update logs with server logs
        if (response.data.logs && Array.isArray(response.data.logs)) {
          setLogs(response.data.logs);
        }
        
        // Trigger visual effect untuk tombol download di navbar
        setTimeout(() => {
          console.log("Attempting to call handleFileProcessed");
          if (window.handleFileProcessed && selectedFile) {
            console.log("Calling handleFileProcessed with:", selectedFile.name);
            window.handleFileProcessed(selectedFile.name);
            console.log("HandleFileProcessed called successfully");
          } else {
            console.warn("handleFileProcessed tidak tersedia:", !!window.handleFileProcessed, "atau tidak ada file terpilih:", !!selectedFile);
          }
        }, 500);
      } else {
        const errorMsg = response.data.message || 'Terjadi kesalahan saat memproses file';
        setErrorMessage(errorMsg);
        setLogs(prev => [...prev, { 
          level: 'error', 
          message: errorMsg, 
          time: new Date().toLocaleTimeString() 
        }]);
      }
    } catch (error) {
      // Use centralized error handling
      const { message } = handleAxiosError(error, 'upload');
      setErrorMessage(message);
      
      // Add error to logs
      setLogs(prev => [...prev, { 
        level: 'error', 
        message: `Error: ${message}`, 
        time: new Date().toLocaleTimeString() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file download
  const handleDownload = async () => {
    if (!requestId) return;
    
    try {
      const response = await withRetry(async () => {
        return await axios.get(`${getApiUrl()}/setup-request/download/${requestId}`, {
          responseType: 'blob',
          timeout: 60000 // 1 minute timeout for download
        });
      }, 2, 1000);
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'output.' + outputFormat;
      
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Tambah notifikasi ke logs
      setLogs(prev => [...prev, { 
        level: 'success', 
        message: `File berhasil diunduh: ${filename}`, 
        time: new Date().toLocaleTimeString() 
      }]);
      
    } catch (error) {
      const { message } = handleAxiosError(error, 'download');
      setErrorMessage(message);
      
      // Add error to logs
      setLogs(prev => [...prev, { 
        level: 'error', 
        message: `Download gagal: ${message}`, 
        time: new Date().toLocaleTimeString() 
      }]);
    }
  };

  // Handle setup request template download
  const handleDownloadRequestTemplate = async (format = 'csv') => {
    const fileExtension = format === 'xlsx' ? 'xlsx' : 'csv';
    const templateFile = `/templates/${processType.toLowerCase()}_template.${fileExtension}`;
    
    try {
      const response = await withRetry(async () => {
        return await fetch(templateFile);
      }, 2, 1000);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Membuat blob dan download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${processType.toLowerCase()}_template.${fileExtension}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMessage(`Template ${processType} (${fileExtension.toUpperCase()}) berhasil diunduh`);
      
      // Tambah notifikasi ke logs
      setLogs(prev => [...prev, { 
        level: 'info', 
        message: `Template ${processType} (${fileExtension.toUpperCase()}) berhasil diunduh`, 
        time: new Date().toLocaleTimeString() 
      }]);
    } catch (error) {
      const { message } = handleAxiosError(error, 'template');
      setErrorMessage(message);
      
      // Tambah notifikasi ke logs
      setLogs(prev => [...prev, { 
        level: 'error', 
        message: `Gagal mengunduh template: ${message}`, 
        time: new Date().toLocaleTimeString() 
      }]);
    }
  };

  // Handle new mapping submission
  const handleAddMapping = async () => {
    try {
      if (!newMapping.marketplace || !newMapping.client || !newMapping.shop_id) {
        setErrorMessage('Marketplace, Client, dan Shop ID diperlukan');
        return;
      }
      
      const response = await withRetry(async () => {
        return await axios.post(`${getApiUrl()}/setup-request/mappings`, newMapping);
      }, 2, 1000);
      
      if (response.data.status === 'success') {
        setSuccessMessage('Mapping berhasil ditambahkan');
        // Reset form and refresh data
        setNewMapping({
          marketplace: '',
          client: '',
          shop_id: '',
          client_id: ''
        });
        fetchShopMappings();
      }
    } catch (error) {
      const { message } = handleAxiosError(error, 'mapping');
      setErrorMessage(message);
    }
  };

  // Handle mapping deletion
  const handleDeleteMapping = async (id) => {
    try {
      const response = await withRetry(async () => {
        return await axios.delete(`${getApiUrl()}/setup-request/mappings/${id}`);
      }, 2, 1000);
      
      if (response.data.status === 'success') {
        setSuccessMessage('Mapping berhasil dihapus');
        fetchShopMappings();
      }
    } catch (error) {
      const { message } = handleAxiosError(error, 'mapping');
      setErrorMessage(message);
    }
  };

  // Handle close of alert messages
  const handleCloseAlert = (type) => {
    if (type === 'success') {
      setSuccessMessage('');
    } else {
      setErrorMessage('');
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <PageHeader>
        <Container maxWidth="lg">
          <Box display="flex" alignItems="center" mb={1}>
            <SettingsIcon fontSize="large" sx={{ mr: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Setup Request
            </Typography>
          </Box>
          <Typography variant="subtitle1">
            Kelola pengaturan dan pemrosesan file data setup
          </Typography>
        </Container>
      </PageHeader>
      
      <Container maxWidth="lg">
        {/* Navigation Tabs */}
        <Box 
          sx={{ 
            display: 'flex', 
            mb: 4, 
            borderRadius: 1, 
            overflow: 'hidden',
            boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
          }}
        >
          <Button 
            variant={activeTab === 'upload' ? 'contained' : 'text'}
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={() => setActiveTab('upload')}
            sx={{ 
              flex: 1, 
              py: 1.5,
              borderRadius: 0
            }}
          >
            Upload & Proses
          </Button>
          <Button 
            variant={activeTab === 'mappings' ? 'contained' : 'text'} 
            color="primary"
            startIcon={<AssignmentIcon />}
            onClick={() => setActiveTab('mappings')}
            sx={{ 
              flex: 1, 
              py: 1.5,
              borderRadius: 0
            }}
          >
            Shop Mappings
          </Button>
        </Box>
        
        {/* Upload & Process Tab */}
        {activeTab === 'upload' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <StyledCard elevation={3}>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CloudUploadIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Upload File
                    </Typography>
                  </Box>
                  
                  <form onSubmit={handleSubmit}>
                    <DropzoneBox 
                      onClick={() => fileInputRef.current.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      sx={{
                        ...(isDragging && {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: 'rgba(41, 121, 255, 0.04)'
                        })
                      }}
                    >
                      <CloudUploadIcon fontSize="large" color="primary" sx={{ fontSize: 60, mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Klik atau Drag & Drop file Excel disini
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Format yang didukung: .xlsx, .xls
                      </Typography>
                      <VisuallyHiddenInput
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".xlsx,.xls"
                      />
                    </DropzoneBox>
                    
                    <Box textAlign="center" mt={1}>
                      <Button
                        startIcon={<DownloadIcon />}
                        color="primary"
                        size="small"
                        onClick={() => handleDownloadRequestTemplate('csv')}
                        sx={{ mr: 1 }}
                      >
                        CSV Template
                      </Button>
                      <Button
                        startIcon={<DownloadIcon />}
                        color="primary"
                        size="small"
                        onClick={() => handleDownloadRequestTemplate('xlsx')}
                      >
                        Excel Template
                      </Button>
                    </Box>
                    
                    {selectedFile && (
                      <Alert 
                        icon={<CheckCircleOutlineIcon fontSize="inherit" />}
                        severity="success" 
                        sx={{ 
                          mt: 2,
                          borderRadius: 1
                        }}
                      >
                        File terpilih: <strong>{selectedFile.name}</strong>
                      </Alert>
                    )}
                    
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth variant="outlined">
                          <InputLabel id="process-type-label">Tipe Proses</InputLabel>
                          <Select
                            labelId="process-type-label"
                            value={processType}
                            label="Tipe Proses"
                            onChange={(e) => setProcessType(e.target.value)}
                            disabled={isLoading}
                          >
                            <MenuItem value="Bundle">Bundle</MenuItem>
                            <MenuItem value="Supplementary">Supplementary</MenuItem>
                            <MenuItem value="Gift">Gift</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth variant="outlined">
                          <InputLabel id="output-format-label">Format Output</InputLabel>
                          <Select
                            labelId="output-format-label"
                            value={outputFormat}
                            label="Format Output"
                            onChange={(e) => setOutputFormat(e.target.value)}
                            disabled={isLoading}
                          >
                            <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                            <MenuItem value="csv">CSV (.csv)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Dibuat Oleh"
                          variant="outlined"
                          value={createdBy}
                          onChange={(e) => setCreatedBy(e.target.value)}
                          disabled={isLoading}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={combineSheets}
                              onChange={(e) => setCombineSheets(e.target.checked)}
                              disabled={isLoading}
                              color="primary"
                            />
                          }
                          label="Gabungkan semua sheet"
                        />
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                      <Button
                        variant="contained"
                        type="submit"
                        disabled={!selectedFile || isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} /> : null}
                        size="large"
                        sx={{ px: 4 }}
                      >
                        {isLoading ? 'Memproses...' : 'Proses File'}
                      </Button>
                      
                      {requestId && (
                        <Button
                          variant="outlined"
                          onClick={handleDownload}
                          startIcon={<DownloadIcon />}
                          color="secondary"
                          size="large"
                        >
                          Download Hasil
                        </Button>
                      )}
                    </Box>
                  </form>
                </CardContent>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <StyledCard elevation={3} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Log Proses
                    </Typography>
                  </Box>
                  
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 1, 
                      flexGrow: 1,
                      minHeight: 300,
                      maxHeight: 500,
                      overflow: 'auto', 
                      borderRadius: 1
                    }}
                  >
                    <List dense>
                      {logs.length > 0 ? (
                        logs.map((log, index) => (
                          <LogItem key={index} level={log.level}>
                            <ListItemText
                              primary={log.message}
                              secondary={log.time}
                              primaryTypographyProps={{
                                style: { 
                                  fontFamily: 'monospace', 
                                  fontSize: 14,
                                  color: log.level === 'error' ? theme.palette.error.main : 
                                         log.level === 'warning' ? theme.palette.warning.main : 
                                         'inherit'
                                }
                              }}
                            />
                          </LogItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText 
                            primary="Belum ada log..." 
                            primaryTypographyProps={{
                              color: 'text.secondary',
                              fontStyle: 'italic'
                            }}
                          />
                        </ListItem>
                      )}
                      <div ref={logsEndRef} />
                    </List>
                  </Paper>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        )}
        
        {/* Mappings Tab */}
        {activeTab === 'mappings' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <StyledCard elevation={3}>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Tambah Shop Mapping
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        label="Marketplace"
                        value={newMapping.marketplace}
                        onChange={(e) => setNewMapping({...newMapping, marketplace: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        label="Client"
                        value={newMapping.client}
                        onChange={(e) => setNewMapping({...newMapping, client: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        label="Shop ID"
                        value={newMapping.shop_id}
                        onChange={(e) => setNewMapping({...newMapping, shop_id: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        label="Client ID (Opsional)"
                        value={newMapping.client_id}
                        onChange={(e) => setNewMapping({...newMapping, client_id: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        fullWidth
                        onClick={handleAddMapping}
                      >
                        Tambah Mapping
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} md={7}>
              <StyledCard elevation={3}>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" mb={3} justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                      <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">
                        Data Shop Mapping
                      </Typography>
                    </Box>
                    <Chip 
                      label={`Total: ${shopMappings.length}`} 
                      color="primary" 
                      variant="outlined" 
                    />
                  </Box>
                  
                  <TableContainer 
                    component={Paper} 
                    variant="outlined" 
                    sx={{ 
                      maxHeight: 400, 
                      overflow: 'auto',
                      borderRadius: 1 
                    }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Marketplace</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Shop ID</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Client ID</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {shopMappings.length > 0 ? (
                          shopMappings.map((mapping) => (
                            <TableRow key={mapping.id} hover>
                              <TableCell>{mapping.marketplace}</TableCell>
                              <TableCell>{mapping.client}</TableCell>
                              <TableCell>{mapping.shop_id}</TableCell>
                              <TableCell>{mapping.client_id || '-'}</TableCell>
                              <TableCell align="center">
                                {hasRole('admin') && (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteMapping(mapping.id)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                              <Typography variant="body2" color="text.secondary">
                                Tidak ada data mapping
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        )}
      </Container>
      
      {/* Notification Snackbars */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => handleCloseAlert('success')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => handleCloseAlert('success')} 
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={8000}
        onClose={() => handleCloseAlert('error')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => handleCloseAlert('error')} 
          severity="error"
          variant="filled"
          icon={<ErrorOutlineIcon />}
          sx={{ 
            width: '100%',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <AlertTitle sx={{ fontWeight: 'bold' }}>Terjadi Kesalahan</AlertTitle>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SetupRequest; 