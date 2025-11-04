import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';
import { usePageTitle } from '../utils/pageTitle';
import { useAuth } from '../hooks/useAuth';

// Helper icons can be imported from heroicons or other compatible icon libraries
// Contoh implementasi sederhana untuk saat ini
const CloudUploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const AssignmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const CheckCircleOutlineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// Main component
const SetupRequestTailwind = () => {
  // Menambahkan judul halaman
  usePageTitle('Setup Request');

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
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isBulkDragging, setIsBulkDragging] = useState(false);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  
  const fileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);
  const logsEndRef = useRef(null);

  // Set initial state
  const [formData, setFormData] = useState({
    marketplace: '',
    client: '',
    shop_id: '',
    client_id: ''
  });

  const { user, hasRole } = useAuth();

  // Memeriksa apakah user memiliki akses untuk mengedit field createdBy
  const canEditCreatedBy = () => {
    return hasRole('admin') || (user && user.username === 'ladyqiu');
  };

  // Fetch shop mappings on component mount
  useEffect(() => {
    const isMounted = { current: true };
    fetchShopMappings(isMounted);
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Mengisi nilai createdBy dengan username dari user yang sedang login
  useEffect(() => {
    if (user && user.username) {
      setCreatedBy(user.username);
    }
  }, [user]);

  // Auto scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);
  
  // Fetch shop mappings from API
  const fetchShopMappings = async (isMounted) => {
    try {
      setIsLoadingMappings(true);
      
      // Hanya log jika dalam mode development
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
        console.log('Mengambil data shop mappings dari API...');
        
        // Mendapatkan token dari localStorage
        const token = localStorage.getItem('token');
        console.log('Token tersedia:', !!token);
        
        // Debug informasi token (hanya menampilkan bagian awal untuk keamanan)
        if (token && token.length > 20) {
          console.log('Token prefix:', token.substring(0, 15) + '...');
        }
        
        console.log('Mencoba mengambil data dari:', `/setup-request/mappings`);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token tidak ditemukan di localStorage');
        if (isMounted && isMounted.current) {
          setErrorMessage('Anda belum login atau sesi telah habis. Silakan login kembali.');
          setIsLoadingMappings(false);
        }
        return;
      }
      
      const response = await axios.get(`/setup-request/mappings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Periksa jika komponen masih terpasang sebelum update state
      if (!isMounted || !isMounted.current) {
        return;
      }
      
      // Hanya log jika dalam mode development
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
        console.log('Response status:', response.status);
        console.log('Response dari API (partial):', 
          JSON.stringify(response.data).substring(0, 200) + 
          (JSON.stringify(response.data).length > 200 ? '...' : '')
        );
      }
      
      if (response.data && response.data.status === 'success') {
        if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
          console.log('Berhasil mendapatkan data, jumlah item:', 
            response.data.mappings ? response.data.mappings.length : 0
          );
        }
        setShopMappings(response.data.mappings);
      } else {
        console.error('API mengembalikan status error atau format tidak sesuai:', response.data);
        setErrorMessage(`Gagal memuat data mapping: ${response.data.message || 'Format respons tidak sesuai'}`);
        
        // Jika API tidak mengembalikan array kosong, kita set empty array
        if (!response.data.mappings) {
          setShopMappings([]);
        }
      }
    } catch (error) {
      // Periksa jika komponen masih terpasang sebelum update state
      if (!isMounted || !isMounted.current) {
        return;
      }
      
      console.error('Error fetching shop mappings:', error);
      const errorMsg = error.response?.data?.message || error.message;
      setErrorMessage(`❌ GAGAL MEMUAT DATA MAPPING\n\n${errorMsg}\n\n💡 SOLUSI:\n• Periksa koneksi internet Anda\n• Refresh halaman dan coba lagi\n• Hubungi administrator jika masalah berlanjut`);
      setShopMappings([]); // Set empty array ketika terjadi error
    } finally {
      // Periksa jika komponen masih terpasang sebelum update state
      if (isMounted && isMounted.current) {
        setIsLoadingMappings(false);
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validasi file
      if (file.size === 0) {
        setErrorMessage('❌ FILE KOSONG\n\n• File yang dipilih kosong atau rusak\n• Pilih file yang berisi data');
        return;
      }
      
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls'].includes(fileExtension)) {
        setErrorMessage('❌ FORMAT FILE TIDAK DIDUKUNG\n\n• Gunakan file Excel (.xlsx atau .xls)\n• Download template Excel dari halaman ini');
        return;
      }
      
      setSelectedFile(file);
      setErrorMessage(''); // Clear any previous errors
      setLogs([{ 
        level: 'info', 
        message: `✅ File dipilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 
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
      // Validasi file
      if (file.size === 0) {
        setErrorMessage('❌ FILE KOSONG\n\n• File yang dipilih kosong atau rusak\n• Pilih file yang berisi data');
        return;
      }
      
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls'].includes(fileExtension)) {
        setErrorMessage('❌ FORMAT FILE TIDAK DIDUKUNG\n\n• Gunakan file Excel (.xlsx atau .xls)\n• Download template Excel dari halaman ini');
        return;
      }
      
      setSelectedFile(file);
      setErrorMessage(''); // Clear any previous errors
      setLogs([{ 
        level: 'info', 
        message: `✅ File dipilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 
        time: new Date().toLocaleTimeString() 
      }]);
    }
  };
  
  // Fungsi utilitas untuk membantu diagnosis error umum
  const getDiagnosticMessage = (error) => {
    // Error Bad Request 400
    if (error.response && error.response.status === 400) {
      const responseText = error.response.data && 
        (typeof error.response.data === 'string' ? 
          error.response.data : JSON.stringify(error.response.data));
      
      // Cek jika error terkait dengan file
      if (responseText.includes('Data form atau file tidak diterima')) {
        return 'File tidak terkirim dengan benar. Pastikan Anda telah memilih file yang valid.';
      }
      if (responseText.includes('File dengan kunci "file" tidak ditemukan')) {
        return 'Sistem tidak dapat menemukan file dalam request. Coba refresh halaman dan pilih file lagi.';
      }
      if (responseText.includes('Format file tidak didukung')) {
        return 'Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls).';
      }
      if (responseText.includes('Nama file kosong')) {
        return 'Nama file kosong. Pilih file dengan nama yang valid.';
      }
    }
    
    // Error 401 Unauthorized
    if (error.response && error.response.status === 401) {
      return 'Sesi login Anda telah habis. Silakan login kembali.';
    }

    // Error 404 Not Found
    if (error.response && error.response.status === 404) {
      return 'Endpoint API tidak ditemukan. Harap hubungi admin sistem.';
    }

    // Default error message
    return error.response && error.response.data && error.response.data.message 
      ? error.response.data.message 
      : error.message;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi form fields
    const validationErrors = [];
    
    if (!selectedFile) {
      validationErrors.push('❌ FILE BELUM DIPILIH\n• Pilih file Excel terlebih dahulu');
    } else {
      if (selectedFile.size === 0) {
        validationErrors.push('❌ FILE KOSONG\n• File yang dipilih kosong atau rusak');
      }
      
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls'].includes(fileExtension)) {
        validationErrors.push('❌ FORMAT FILE TIDAK DIDUKUNG\n• Gunakan file Excel (.xlsx atau .xls)');
      }
    }
    
    if (!createdBy || createdBy.trim() === '') {
      validationErrors.push('❌ FIELD "DIBUAT OLEH" KOSONG\n• Isi nama pembuat request');
    }
    
    if (validationErrors.length > 0) {
      const errorMessage = '📋 VALIDASI FORM GAGAL\n\n' + validationErrors.join('\n\n');
      setErrorMessage(errorMessage);
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
      
      // Debug: Periksa file yang akan diupload
      console.log('Selected file:', selectedFile);
      console.log('File name:', selectedFile.name);
      console.log('File size:', selectedFile.size, 'bytes');
      console.log('File type:', selectedFile.type);
      
      // Tambahkan file ke FormData dengan nama field yang benar
      formData.append('file', selectedFile);
      formData.append('process_type', processType);
      formData.append('created_by', createdBy || 'System'); // Default ke 'System' jika kosong
      formData.append('combine_sheets', combineSheets.toString()); // Konversi boolean ke string
      formData.append('output_format', outputFormat || 'xlsx'); // Default ke 'xlsx' jika kosong
      
      // Debug: Periksa FormData
      console.log('FormData entries:');
      formData.forEach((value, key) => {
        if (value instanceof File) {
          console.log(`${key}: File (${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      });

      // Gunakan fetch API yang lebih sederhana untuk upload file
      const token = localStorage.getItem('token');
      
      // Log detail request yang akan dikirim
      console.log('Sending request to:', `/api/setup-request/process`);
      console.log('Authorization token exists:', !!token);
      console.log('FormData contains file:', formData.has('file'));
      
      try {
        // Kembali menggunakan fetch API yang lebih sederhana
        const response = await fetch(`/api/setup-request/process`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // JANGAN tambahkan Content-Type saat menggunakan FormData
          },
          body: formData,
          credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        console.log('Response status text:', response.statusText);
        
        // Cek jika response tidak OK (status di luar range 200-299)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        setSuccessMessage('File berhasil diproses!');
        setRequestId(data.request_id);
        // Update logs with server logs
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      } catch (fetchError) {
        console.error('Fetch error details:', fetchError);
        
        const errorMsg = fetchError.message;
        
        // Check if it's a specific error about empty columns, shop mapping, date output, or date format
        if (errorMsg.includes('DATA KOLOM KOSONG') || 
            errorMsg.includes("'float' object has no attribute 'lower'") ||
            errorMsg.includes('MARKETPLACE TIDAK DITEMUKAN DI DATABASE') ||
            errorMsg.includes('DATA KOLOM TANGGAL KOSONG DI HASIL OUTPUT') ||
            errorMsg.includes('FORMAT TANGGAL TIDAK VALID')) {
          setErrorMessage(errorMsg);
        } else {
          setErrorMessage(`❌ KESALAHAN UPLOAD FILE\n\n${errorMsg}\n\n💡 SOLUSI:\n• Periksa koneksi internet Anda\n• Pastikan file tidak terlalu besar (maksimal 10MB)\n• Coba upload file yang berbeda`);
        }
        
        setLogs(prev => [...prev, { 
          level: 'error', 
          message: `❌ Error: ${errorMsg}`, 
          time: new Date().toLocaleTimeString() 
        }]);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMsg = error.message;
      
      // Check if it's a specific error about empty columns, shop mapping, date output, or date format
      if (errorMsg.includes('DATA KOLOM KOSONG') || 
          errorMsg.includes("'float' object has no attribute 'lower'") ||
          errorMsg.includes('MARKETPLACE TIDAK DITEMUKAN DI DATABASE') ||
          errorMsg.includes('DATA KOLOM TANGGAL KOSONG DI HASIL OUTPUT') ||
          errorMsg.includes('FORMAT TANGGAL TIDAK VALID')) {
        setErrorMessage(errorMsg);
      } else {
        setErrorMessage(`❌ KESALAHAN PEMROSESAN FILE\n\n${errorMsg}\n\n💡 SOLUSI:\n• Periksa format file sesuai template\n• Pastikan semua data terisi dengan benar\n• Coba upload file yang berbeda`);
      }
      
      // Add error to logs
      setLogs(prev => [...prev, { 
        level: 'error', 
        message: `❌ Error: ${errorMsg}`, 
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
      const token = localStorage.getItem('token');
      console.log('Downloading file for request ID:', requestId);
      
      // Gunakan axios untuk konsistensi dengan konfigurasi baseURL
      const response = await axios.get(`/setup-request/download/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      // Debug: Log header yang penting
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Content-Disposition:', response.headers['content-disposition']);
      
      // Get the blob from response
      const blob = response.data;
      
      // Variabel untuk menyimpan URL objek
      let objectUrl = null;
      
      try {
        // Create blob link to download
        objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        
        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        console.log('Content-Disposition header:', contentDisposition);
        
        // Default filename (akan diganti jika header bisa diparsing)
        let filename = `SETUP_${processType.toUpperCase()}_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.${outputFormat}`;
        
        if (contentDisposition) {
          try {
            // Cobalah beberapa pattern regex yang berbeda untuk mengekstrak nama file
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(contentDisposition);
            
            if (matches != null && matches[1]) { 
              // Bersihkan nama file dari karakter yang tidak dibutuhkan
              filename = matches[1].replace(/['"]/g, '').trim();
              console.log('Successfully extracted filename from header:', filename);
            } else {
              // Coba regex alternatif untuk ekstraksi nama file
              const altRegex = /filename=([^;]*)/i;
              const altMatches = altRegex.exec(contentDisposition);
              
              if (altMatches && altMatches[1]) {
                filename = altMatches[1].replace(/['"]/g, '').trim();
                console.log('Extracted filename using alternative regex:', filename);
              } else {
                console.warn('Failed to extract filename from Content-Disposition header');
              }
            }
          } catch (error) {
            console.error('Error parsing Content-Disposition header:', error);
          }
        } else {
          console.warn('Content-Disposition header not found, using default filename');
        }
        
        console.log('Final filename for download:', filename);
        link.setAttribute('download', filename);
        
        // Gunakan pendekatan yang lebih aman - sematkan ke dokumen hanya saat dibutuhkan
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          // Selalu revoke object URL untuk mencegah memory leak
          if (objectUrl) {
            window.URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }
        }, 100);
        
        setSuccessMessage('File berhasil diunduh!');
      } catch (error) {
        console.error('Error creating blob URL:', error);
        setErrorMessage(`❌ GAGAL MEMBUAT DOWNLOAD LINK\n\n${error.message}\n\n💡 SOLUSI:\n• Coba download lagi\n• Refresh halaman dan coba lagi\n• Hubungi administrator jika masalah berlanjut`);
        
        // Clean up jika ada error
        if (objectUrl) {
          window.URL.revokeObjectURL(objectUrl);
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      const errorMsg = error.message;
      setErrorMessage(`❌ GAGAL MENGUNDUH FILE\n\n${errorMsg}\n\n💡 SOLUSI:\n• Periksa koneksi internet Anda\n• Coba download lagi\n• Hubungi administrator jika masalah berlanjut`);
    }
  };

  // Handle new mapping submission
  const handleAddMapping = async () => {
    try {
      // Validasi form mapping
      const validationErrors = [];
      
      if (!newMapping.marketplace || newMapping.marketplace.trim() === '') {
        validationErrors.push('❌ MARKETPLACE KOSONG\n• Isi nama marketplace (contoh: Tokopedia, Shopee)');
      }
      
      if (!newMapping.client || newMapping.client.trim() === '') {
        validationErrors.push('❌ CLIENT KOSONG\n• Isi nama client');
      }
      
      if (!newMapping.shop_id || newMapping.shop_id.trim() === '') {
        validationErrors.push('❌ SHOP ID KOSONG\n• Isi ID toko di marketplace');
      }
      
      if (!newMapping.client_id || newMapping.client_id.trim() === '') {
        validationErrors.push('❌ CLIENT ID KOSONG\n• Isi ID client');
      }
      
      if (validationErrors.length > 0) {
        const errorMessage = '📋 VALIDASI MAPPING GAGAL\n\n' + validationErrors.join('\n\n');
        setErrorMessage(errorMessage);
        return;
      }
      
      const response = await axios.post(`/setup-request/mappings`, newMapping, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.status === 'success') {
        setSuccessMessage('Mapping berhasil ditambahkan');
        // Reset form and refresh data
        setNewMapping({
          marketplace: '',
          client: '',
          shop_id: '',
          client_id: ''
        });
        const isMounted = { current: true };
        fetchShopMappings(isMounted);
      }
    } catch (error) {
      console.error('Error adding mapping:', error);
      const errorMsg = error.response?.data?.message || error.message;
      setErrorMessage(`❌ GAGAL MENAMBAHKAN MAPPING\n\n${errorMsg}\n\n💡 SOLUSI:\n• Periksa apakah semua field terisi dengan benar\n• Pastikan data tidak duplikat\n• Hubungi administrator jika masalah berlanjut`);
    }
  };

  // Handle mapping deletion
  const handleDeleteMapping = async (id) => {
    try {
      const response = await axios.delete(`/setup-request/mappings/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.status === 'success') {
        setSuccessMessage('Mapping berhasil dihapus');
        const isMounted = { current: true };
        fetchShopMappings(isMounted);
      }
    } catch (error) {
      console.error('Error deleting mapping:', error);
      const errorMsg = error.response?.data?.message || error.message;
      setErrorMessage(`❌ GAGAL MENGHAPUS MAPPING\n\n${errorMsg}\n\n💡 SOLUSI:\n• Pastikan Anda memiliki izin untuk menghapus mapping\n• Hubungi administrator jika masalah berlanjut`);
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

  // Filtered mappings data
  const filteredMappings = shopMappings ? shopMappings.filter(mapping => 
    searchQuery === '' ||
    (mapping.marketplace && mapping.marketplace.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (mapping.client && mapping.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (mapping.shop_id && mapping.shop_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (mapping.client_id && mapping.client_id.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  // Handle bulk file upload
  const handleBulkFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validasi file
      if (file.size === 0) {
        setErrorMessage('❌ FILE KOSONG\n\n• File yang dipilih kosong atau rusak\n• Pilih file yang berisi data');
        return;
      }
      
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        setErrorMessage('❌ FORMAT FILE TIDAK DIDUKUNG\n\n• Gunakan file Excel (.xlsx, .xls) atau CSV (.csv)\n• Download template yang benar dari halaman ini');
        return;
      }
      
      setBulkFile(file);
      setErrorMessage(''); // Clear any previous errors
    }
  };

  // Process bulk upload
  const handleBulkUpload = async () => {
    // Validasi bulk upload
    if (!bulkFile) {
      setErrorMessage('❌ FILE BELUM DIPILIH\n\n• Pilih file Excel (.xlsx, .xls) atau CSV (.csv) terlebih dahulu');
      return;
    }
    
    // Validasi ukuran file
    if (bulkFile.size === 0) {
      setErrorMessage('❌ FILE KOSONG\n\n• File yang dipilih kosong atau rusak');
      return;
    }
    
    // Validasi format file
    const fileExtension = bulkFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setErrorMessage('❌ FORMAT FILE TIDAK DIDUKUNG\n\n• Gunakan file Excel (.xlsx, .xls) atau CSV (.csv)\n• Download template yang benar dari halaman ini');
      return;
    }

    try {
      setIsBulkUploading(true);
      
      const formData = new FormData();
      formData.append('file', bulkFile);

      const response = await axios.post(`/setup-request/bulk-mappings`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.status === 'success') {
        setSuccessMessage(`Berhasil menambahkan ${response.data.count || 'beberapa'} mapping`);
        setBulkFile(null);
        const isMounted = { current: true };
        fetchShopMappings(isMounted);
        
        // Reset file input
        if (bulkFileInputRef.current) {
          bulkFileInputRef.current.value = '';
        }
      } else {
        setErrorMessage('❌ GAGAL MEMPROSES FILE\n\n• Terjadi kesalahan saat memproses file bulk upload\n• Periksa format file sesuai template');
      }
    } catch (error) {
      console.error('Error processing bulk upload:', error);
      const errorMsg = error.response?.data?.message || error.message;
      setErrorMessage(`❌ KESALAHAN BULK UPLOAD\n\n${errorMsg}\n\n💡 SOLUSI:\n• Periksa format file sesuai template\n• Pastikan semua kolom wajib terisi\n• Download template yang benar`);
    } finally {
      setIsBulkUploading(false);
    }
  };

  // Handle setup request template download
  const handleDownloadRequestTemplate = (format = 'csv') => {
    // Mendapatkan path file template sesuai dengan tipe proses dan format
    const fileExtension = format === 'xlsx' ? 'xlsx' : 'csv';
    const templateFile = `/templates/${processType.toLowerCase()}_template.${fileExtension}`;
    
    // Mengunduh file template fisik
    fetch(templateFile)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Membuat blob dan download link
        let objectUrl = null;
        try {
          objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', objectUrl);
          link.setAttribute('download', `${processType.toLowerCase()}_template.${fileExtension}`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          
          // Clean up setelah download
          setTimeout(() => {
            document.body.removeChild(link);
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
              objectUrl = null;
            }
          }, 100);
          
          setSuccessMessage(`Template ${processType} (${fileExtension.toUpperCase()}) berhasil diunduh`);
        } catch (error) {
          console.error('Error creating download link:', error);
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          throw error;
        }
      })
      .catch(error => {
        console.error('Error downloading template:', error);
        const errorMsg = error.message;
        setErrorMessage(`❌ GAGAL MENGUNDUH TEMPLATE MAPPING\n\n${errorMsg}\n\n💡 SOLUSI:\n• Periksa koneksi internet Anda\n• Coba download lagi\n• Hubungi administrator jika template tidak tersedia`);
      });
  };

  // Handle bulk file download template
  const handleDownloadTemplate = (format = 'csv') => {
    // Mendapatkan path file template untuk shop mapping
    const fileExtension = format === 'xlsx' ? 'xlsx' : 'csv';
    const templateFile = `/templates/shop_mapping_template.${fileExtension}`;
    
    // Mengunduh file template fisik
    fetch(templateFile)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Membuat blob dan download link
        let objectUrl = null;
        try {
          objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', objectUrl);
          link.setAttribute('download', `shop_mapping_template.${fileExtension}`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          
          // Clean up setelah download
          setTimeout(() => {
            document.body.removeChild(link);
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
              objectUrl = null;
            }
          }, 100);
          
          setSuccessMessage(`Template shop mapping (${fileExtension.toUpperCase()}) berhasil diunduh`);
        } catch (error) {
          console.error('Error creating download link:', error);
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          throw error;
        }
      })
      .catch(error => {
        console.error('Error downloading template:', error);
        const errorMsg = error.message;
        setErrorMessage(`❌ GAGAL MENGUNDUH TEMPLATE\n\n${errorMsg}\n\n💡 SOLUSI:\n• Periksa koneksi internet Anda\n• Coba download lagi\n• Hubungi administrator jika template tidak tersedia`);
      });
  };

  // Handle bulk file drag events
  const handleBulkDragOver = (e) => {
    e.preventDefault();
    setIsBulkDragging(true);
  };

  const handleBulkDragLeave = (e) => {
    e.preventDefault();
    setIsBulkDragging(false);
  };

  const handleBulkDrop = (e) => {
    e.preventDefault();
    setIsBulkDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      // Validasi file
      if (file.size === 0) {
        setErrorMessage('❌ FILE KOSONG\n\n• File yang dipilih kosong atau rusak\n• Pilih file yang berisi data');
        return;
      }
      
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        setErrorMessage('❌ FORMAT FILE TIDAK DIDUKUNG\n\n• Gunakan file Excel (.xlsx, .xls) atau CSV (.csv)\n• Download template yang benar dari halaman ini');
        return;
      }
      
      setBulkFile(file);
      setErrorMessage(''); // Clear any previous errors
    }
  };

  // Add sample data for testing (only for development)
  const addSampleData = () => {
    const sampleData = [
      {
        id: 'sample-1',
        marketplace: 'Tokopedia',
        client: 'Client A',
        shop_id: 'tokopedia-123',
        client_id: 'client-a-001'
      },
      {
        id: 'sample-2',
        marketplace: 'Shopee',
        client: 'Client B',
        shop_id: 'shopee-456',
        client_id: 'client-b-002'
      },
      {
        id: 'sample-3',
        marketplace: 'Lazada',
        client: 'Client C',
        shop_id: 'lazada-789',
        client_id: 'client-c-003'
      }
    ];
    
    setShopMappings(sampleData);
    setSuccessMessage('Data contoh berhasil ditambahkan! Ini hanya untuk pengujian dan tidak disimpan ke server.');
  };



  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Setup Request
        </h1>
        
        {/* Tabs */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg flex overflow-hidden mb-6">
          <button 
            className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'upload' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            onClick={() => setActiveTab('upload')}
          >
            <CloudUploadIcon />
            <span className="ml-2">Upload & Proses</span>
          </button>
          <button 
            className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'mappings' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            onClick={() => setActiveTab('mappings')}
          >
            <AssignmentIcon />
            <span className="ml-2">Shop Mappings</span>
          </button>

        </div>
        
        {/* Upload & Process Tab */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-primary-600 dark:text-primary-400">
                      <CloudUploadIcon />
                    </span>
                    <h2 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">
                      Upload File
                    </h2>
                  </div>
                  
                  <form onSubmit={handleSubmit}>
                    <div 
                      onClick={() => fileInputRef.current.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                        isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="text-primary-600 dark:text-primary-400 text-6xl mb-4 mx-auto">
                        <CloudUploadIcon />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                        Klik atau Drag & Drop file Excel disini
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Format yang didukung: .xlsx, .xls
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".xlsx,.xls"
                      />
                    </div>
                    
                    <div className="mt-2 text-xs text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => handleDownloadRequestTemplate('csv')}
                          type="button"
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 underline inline-flex items-center"
                        >
                          <DownloadIcon />
                          <span className="ml-1">CSV Template</span>
                        </button>
                        <button 
                          onClick={() => handleDownloadRequestTemplate('xlsx')}
                          type="button"
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 underline inline-flex items-center"
                        >
                          <DownloadIcon />
                          <span className="ml-1">Excel Template</span>
                        </button>
                      </div>
                    </div>
                    
                    {selectedFile && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-4 flex items-center text-green-800 dark:text-green-300">
                        <CheckCircleOutlineIcon />
                        <span className="ml-2">
                          File terpilih: <strong>{selectedFile.name}</strong>
                        </span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="label">Tipe Proses</label>
                        <select 
                          className="input bg-white dark:bg-gray-800"
                          value={processType}
                          onChange={(e) => setProcessType(e.target.value)}
                          disabled={isLoading}
                        >
                          <option value="Bundle">Bundle</option>
                          <option value="Supplementary">Supplementary</option>
                          <option value="Gift">Gift</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="label">Format Output</label>
                        <select 
                          className="input bg-white dark:bg-gray-800"
                          value={outputFormat}
                          onChange={(e) => setOutputFormat(e.target.value)}
                          disabled={isLoading}
                        >
                          <option value="xlsx">Excel (.xlsx)</option>
                          <option value="csv">CSV (.csv)</option>
                        </select>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="label">Dibuat Oleh</label>
                        <input
                          type="text"
                          className="input"
                          value={createdBy}
                          onChange={(e) => setCreatedBy(e.target.value)}
                          disabled={isLoading || !canEditCreatedBy()}
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 dark:text-primary-500 focus:ring-primary-500"
                            checked={combineSheets}
                            onChange={(e) => setCombineSheets(e.target.checked)}
                            disabled={isLoading}
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">Gabungkan semua sheet</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <button
                        type="submit"
                        className="btn btn-primary px-6 py-2"
                        disabled={!selectedFile || isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memproses...
                          </span>
                        ) : 'Proses File'}
                      </button>
                      
                      {requestId && (
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="btn btn-outline text-secondary-600 border-secondary-500 hover:bg-secondary-50 flex items-center"
                        >
                          <DownloadIcon />
                          <span className="ml-1">Download Hasil</span>
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-5">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col border border-gray-200 dark:border-gray-700">
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <span className="text-primary-600 dark:text-primary-400">
                      <AssignmentIcon />
                    </span>
                    <h2 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">
                      Log Proses
                    </h2>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 overflow-auto flex-grow min-h-[300px] max-h-[500px]">
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {logs.length > 0 ? (
                        logs.map((log, index) => (
                          <div 
                            key={index} 
                            className={`py-2 pl-3 border-l-4 ${
                              log.level === 'error' 
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
                                : log.level === 'warning'
                                ? 'border-yellow-500' 
                                : 'border-blue-500'
                            } rounded-r mb-1`}
                          >
                            <div 
                              className={`font-mono text-sm whitespace-pre-wrap ${
                                log.level === 'error' 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : log.level === 'warning'
                                  ? 'text-yellow-600 dark:text-yellow-400' 
                                  : 'text-gray-800 dark:text-gray-200'
                              }`}
                              dangerouslySetInnerHTML={{ 
                                __html: log.message
                                  .replace(/\n/g, '<br/>')
                                  .replace(/❌/g, '<span class="font-bold text-red-500">❌</span>')
                                  .replace(/📋/g, '<span class="font-bold text-yellow-500">📋</span>')
                                  .replace(/💡/g, '<span class="font-bold text-blue-500">💡</span>')
                              }}
                            />
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {log.time}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 px-3 text-gray-500 dark:text-gray-400 italic">
                          Belum ada log...
                        </div>
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Mappings Tab */}
        {activeTab === 'mappings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <span className="text-primary-600 dark:text-primary-400">
                  <SettingsIcon />
                </span>
                <h2 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">
                  Shop Mappings
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 h-full">
                    <div className="p-6 h-full flex flex-col">
                      <div className="flex items-center mb-6">
                        <span className="text-primary-600 dark:text-primary-400">
                          <AssignmentIcon />
                        </span>
                        <h2 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">
                          Tambah Shop Mapping
                        </h2>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">
                            Marketplace <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={newMapping.marketplace}
                            onChange={(e) => setNewMapping({...newMapping, marketplace: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <label className="label">
                            Client <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={newMapping.client}
                            onChange={(e) => setNewMapping({...newMapping, client: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <label className="label">
                            Shop ID <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={newMapping.shop_id}
                            onChange={(e) => setNewMapping({...newMapping, shop_id: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <label className="label">
                            Client ID <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={newMapping.client_id}
                            onChange={(e) => setNewMapping({...newMapping, client_id: e.target.value})}
                            required
                          />
                        </div>
                        <div className="sm:col-span-2 mt-2">
                          <button
                            className="w-full btn btn-secondary"
                            onClick={handleAddMapping}
                          >
                            Tambah Mapping
                          </button>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex-grow">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                          Bulk Upload
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Upload banyak mapping sekaligus melalui file Excel (.xlsx) atau CSV (.csv)
                        </p>
                        
                        <div 
                          onClick={() => bulkFileInputRef.current.click()}
                          onDragOver={handleBulkDragOver}
                          onDragLeave={handleBulkDragLeave}
                          onDrop={handleBulkDrop}
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all mb-3 ${
                            isBulkDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <div className="text-primary-600 dark:text-primary-400 mb-2">
                            <CloudUploadIcon />
                          </div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            Klik atau Drag & Drop file disini
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Format yang didukung: .xlsx, .xls, .csv
                          </p>
                          <input
                            type="file"
                            className="hidden"
                            ref={bulkFileInputRef}
                            onChange={handleBulkFileSelect}
                            accept=".xlsx,.xls,.csv"
                          />
                        </div>
                        
                        {bulkFile && (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 mb-3 flex items-center text-green-800 dark:text-green-300 text-sm">
                            <CheckCircleOutlineIcon />
                            <span className="ml-2">
                              File terpilih: <strong>{bulkFile.name}</strong>
                            </span>
                          </div>
                        )}
                        
                        <button
                          className="w-full btn px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center justify-center"
                          onClick={handleBulkUpload}
                          disabled={!bulkFile || isBulkUploading}
                        >
                          {isBulkUploading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sedang Memproses...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <CloudUploadIcon />
                              <span className="ml-2">Upload Mapping</span>
                            </span>
                          )}
                        </button>
                        
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          <p>Format file harus berisi kolom:</p>
                          <p className="mb-1 text-red-600 dark:text-red-400 font-medium">* Semua kolom wajib diisi</p>
                          <ul className="list-disc pl-5 mt-1 mb-2 space-y-1">
                            <li><strong>marketplace</strong> - Nama marketplace (contoh: Tokopedia, Shopee)</li>
                            <li><strong>client</strong> - Nama klien</li>
                            <li><strong>shop_id</strong> - ID toko di marketplace</li>
                            <li><strong>client_id</strong> - ID klien</li>
                          </ul>
                          <button 
                            onClick={() => handleDownloadTemplate('csv')}
                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mt-1 underline inline-flex items-center mr-2"
                          >
                            <DownloadIcon />
                            <span className="ml-1">Download CSV Template</span>
                          </button>
                          <button 
                            onClick={() => handleDownloadTemplate('xlsx')}
                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mt-1 underline inline-flex items-center"
                          >
                            <DownloadIcon />
                            <span className="ml-1">Download Excel Template</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-7">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 h-full">
                    <div className="p-6 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-primary-600 dark:text-primary-400">
                            <AssignmentIcon />
                          </span>
                          <h2 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">
                            Data Shop Mapping
                          </h2>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300 border border-primary-200 dark:border-primary-700">
                          {searchQuery ? 
                            `Ditampilkan: ${filteredMappings ? filteredMappings.length : 0} dari ${shopMappings ? shopMappings.length : 0}` : 
                            `Total: ${shopMappings ? shopMappings.length : 0}`
                          }
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="relative">
                          <input
                            type="text"
                            className="input pl-10"
                            placeholder="Cari mapping berdasarkan marketplace, client, atau shop ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          {searchQuery && (
                            <button 
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                              onClick={() => setSearchQuery('')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-grow border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto max-h-[500px]">
                          {isLoadingMappings ? (
                            <div className="flex justify-center items-center py-20">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                              <p className="ml-3 text-primary-600 dark:text-primary-400">Memuat data...</p>
                            </div>
                          ) : (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marketplace <span className="text-red-600">*</span></th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client <span className="text-red-600">*</span></th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shop ID <span className="text-red-600">*</span></th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client ID <span className="text-red-600">*</span></th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {shopMappings && shopMappings.length > 0 ? (
                                  filteredMappings.map((mapping) => (
                                    <tr key={mapping.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{mapping.marketplace}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{mapping.client}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{mapping.shop_id}</td>
                                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{mapping.client_id || '-'}</td>
                                      <td className="px-4 py-2 text-sm text-center">
                                        {hasRole('admin') && (
                                          <button
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            onClick={() => handleDeleteMapping(mapping.id)}
                                          >
                                            <DeleteIcon />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                      Tidak ada data mapping
                                      <div className="mt-2">
                                        <button 
                                          onClick={() => {
                                            const isMounted = { current: true };
                                            fetchShopMappings(isMounted);
                                          }}
                                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 underline"
                                        >
                                          Muat ulang data
                                        </button>
                                        <p className="mt-1 text-xs">
                                          Pastikan Anda sudah login dan memiliki akses ke fitur ini.
                                        </p>
                                        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                          <p className="text-xs mb-2">Jika Anda sedang dalam mode pengembangan, Anda dapat menambahkan data contoh:</p>
                                          <button
                                            onClick={addSampleData}
                                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                          >
                                            Tambahkan Data Contoh
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                                {shopMappings && shopMappings.length > 0 && filteredMappings.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                      Tidak ada hasil yang cocok dengan pencarian "{searchQuery}"
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Notification Toasts */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50">
          <CheckCircleOutlineIcon />
          <span className="ml-2">{successMessage}</span>
          <button 
            className="ml-4 text-white/80 hover:text-white"
            onClick={() => handleCloseAlert('success')}
          >
            &times;
          </button>
        </div>
      )}
      
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-md z-50">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3 flex-1">
              <div 
                className="text-sm whitespace-pre-line"
                dangerouslySetInnerHTML={{ 
                  __html: errorMessage
                    .replace(/\n/g, '<br/>')
                    .replace(/❌/g, '<span class="font-bold text-red-200">❌</span>')
                    .replace(/📋/g, '<span class="font-bold text-yellow-200">📋</span>')
                    .replace(/💡/g, '<span class="font-bold text-blue-200">💡</span>')
                }}
              />
            </div>
            <button 
              className="ml-4 text-white/80 hover:text-white flex-shrink-0"
              onClick={() => handleCloseAlert('error')}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupRequestTailwind; 