import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config';
import { usePageTitle } from '../../utils/pageTitle';

// Import fungsi untuk membuat token test
const createTestToken = () => {
  // Fake payload untuk token test
  const payload = {
    sub: 'test-user',
    name: 'Test User',
    role: 'admin',
    is_admin: true,
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // Expires in 1 hour
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Base64 encode payload secara manual (ini BUKAN JWT valid, hanya untuk testing)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa('fake-signature-for-testing-only');
  
  // Gabungkan menjadi format JWT
  return `${header}.${encodedPayload}.${signature}`;
};

const TokenDebug = () => {
  // Set page title
  usePageTitle('Token Debug');
  
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [username, setUsername] = useState('admin');
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Tambahkan log untuk debugging
    console.log('TokenDebug component mounted');
    
    // Cek token di localStorage
    const storedToken = localStorage.getItem('token');
    setSavedToken(storedToken || 'Tidak ada token');
    
    // Tambahkan log untuk debugging
    console.log('Stored token:', storedToken ? storedToken.substring(0, 20) + '...' : 'Tidak ada');
  }, []);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [`[${timestamp}] ${message}`, ...prevLogs]);
  };

  const handleTestLogin = async () => {
    try {
      addLog(`Mencoba login dengan username: ${username}`);
      const apiUrl = getApiUrl();
      
      const response = await axios.post(`${apiUrl}/auth/test-login`, { username }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      addLog(`Login berhasil! Status: ${response.status}`);
      
      const { access_token } = response.data;
      if (!access_token) {
        addLog('ERROR: Token tidak ada dalam respons');
        return;
      }
      
      setToken(access_token);
      addLog(`Token didapatkan (${access_token.substring(0, 20)}...)`);
      
      // Simpan token
      try {
        localStorage.setItem('token', access_token);
        const checkToken = localStorage.getItem('token');
        setSavedToken(checkToken || 'Gagal menyimpan token');
        
        if (checkToken === access_token) {
          addLog('Token berhasil disimpan di localStorage');
        } else {
          addLog('ERROR: Token tidak tersimpan dengan benar');
        }
      } catch (err) {
        addLog(`ERROR menyimpan token: ${err.message}`);
      }
      
      setResult(response.data);
    } catch (error) {
      addLog(`ERROR login: ${error.message}`);
      if (error.response) {
        addLog(`Response status: ${error.response.status}`);
        addLog(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      setResult({ error: error.message });
    }
  };

  const handleValidateToken = async () => {
    try {
      const tokenToUse = token || savedToken;
      if (!tokenToUse || tokenToUse === 'Tidak ada token') {
        addLog('ERROR: Tidak ada token untuk divalidasi');
        return;
      }
      
      addLog(`Memvalidasi token: ${tokenToUse.substring(0, 20)}...`);
      
      // Set header Authorization
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
      addLog(`Header diatur: Authorization: Bearer ${tokenToUse.substring(0, 20)}...`);
      
      const response = await axios.get(`/api/auth/debug-token`);
      addLog(`Validasi token berhasil! Status: ${response.status}`);
      setResult(response.data);
    } catch (error) {
      addLog(`ERROR validasi token: ${error.message}`);
      if (error.response) {
        addLog(`Response status: ${error.response.status}`);
        addLog(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      setResult({ error: error.message });
    }
  };
  
  const handleMeEndpoint = async () => {
    try {
      const tokenToUse = token || savedToken;
      if (!tokenToUse || tokenToUse === 'Tidak ada token') {
        addLog('ERROR: Tidak ada token untuk request /me');
        return;
      }
      
      addLog(`Mengakses /me dengan token: ${tokenToUse.substring(0, 20)}...`);
      const apiUrl = getApiUrl();
      
      // Set header Authorization
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
      addLog(`Header diatur: Authorization: Bearer ${tokenToUse.substring(0, 20)}...`);
      
      const response = await axios.get(`${apiUrl}/auth/me`);
      addLog(`Request /me berhasil! Status: ${response.status}`);
      setResult(response.data);
    } catch (error) {
      addLog(`ERROR request /me: ${error.message}`);
      if (error.response) {
        addLog(`Response status: ${error.response.status}`);
        addLog(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      setResult({ error: error.message });
    }
  };
  
  const clearToken = () => {
    localStorage.removeItem('token');
    setSavedToken('Token dihapus');
    setToken('');
    addLog('Token dihapus dari localStorage');
    delete axios.defaults.headers.common['Authorization'];
    addLog('Header Authorization dihapus');
  };
  
  const testSimpleEndpoint = async () => {
    try {
      addLog('Menguji endpoint sederhana tanpa JWT');
      const apiUrl = getApiUrl();
      
      const response = await axios.get(`${apiUrl}/auth/simple-debug`);
      addLog(`Request berhasil! Status: ${response.status}`);
      setResult(response.data);
    } catch (error) {
      addLog(`ERROR: ${error.message}`);
      if (error.response) {
        addLog(`Response status: ${error.response.status}`);
        addLog(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      setResult({ error: error.message });
    }
  };

  // Fungsi untuk membuat test token lokal
  const handleCreateTestToken = () => {
    try {
      addLog('Membuat token test secara lokal...');
      const testToken = createTestToken();
      
      // Simpan token di state dan localStorage
      setToken(testToken);
      localStorage.setItem('token', testToken);
      setSavedToken(testToken);
      
      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${testToken}`;
      
      addLog(`Token test dibuat dan disimpan: ${testToken.substring(0, 20)}...`);
      setResult({
        message: 'Token test dibuat, tapi ini BUKAN token yang valid untuk backend!',
        token: testToken
      });
    } catch (error) {
      addLog(`ERROR membuat token test: ${error.message}`);
      setResult({ error: error.message });
    }
  };
  
  // Fungsi untuk mendapatkan token test valid dari backend
  const handleGetTestToken = async () => {
    try {
      addLog('Mengambil token test dari server...');
      const apiUrl = getApiUrl();
      
      const response = await axios.get(`${apiUrl}/auth/generate-test-token`);
      const { token } = response.data;
      
      // Simpan token di state dan localStorage
      setToken(token);
      localStorage.setItem('token', token);
      setSavedToken(token);
      
      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      addLog(`Token test valid dari server: ${token.substring(0, 20)}...`);
      setResult(response.data);
    } catch (error) {
      addLog(`ERROR mengambil token test: ${error.message}`);
      if (error.response) {
        addLog(`Response status: ${error.response.status}`);
        addLog(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      setResult({ error: error.message });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Token JWT</h1>
      
      {/* Cek Koneksi */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Cek Koneksi API:</h2>
        <button
          onClick={testSimpleEndpoint}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Test Koneksi Sederhana
        </button>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Klik tombol ini untuk menguji koneksi ke server tanpa memerlukan token
        </p>
      </div>
      
      {/* Token dari localStorage */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Token dari localStorage:</h2>
        <div className="p-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 mb-2 overflow-x-auto">
          <pre className="text-xs whitespace-pre-wrap break-all">{savedToken}</pre>
        </div>
        <button
          onClick={clearToken}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Hapus Token
        </button>
      </div>
      
      {/* Test Login Section */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Login:</h2>
        <div className="flex mb-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 p-2 rounded-l border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            placeholder="Username"
          />
          <button
            onClick={handleTestLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
          >
            Test Login
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateTestToken}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Buat Token Lokal
          </button>
          <button
            onClick={handleGetTestToken}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Dapatkan Token Valid
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Token lokal hanya untuk pengujian frontend, gunakan "Dapatkan Token Valid" untuk backend.
        </p>
      </div>
      
      {/* Validate Token Section */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Validasi Token:</h2>
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleValidateToken}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Debug Token
          </button>
          <button
            onClick={handleMeEndpoint}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Coba /me Endpoint
          </button>
          <button
            onClick={clearToken}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Hapus Token
          </button>
        </div>
      </div>
      
      {/* Result Section */}
      {result && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Hasil:</h2>
          <pre className="whitespace-pre-wrap bg-gray-200 dark:bg-gray-700 p-2 rounded text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Logs Section */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Log:</h2>
        <div className="bg-black text-green-400 p-2 rounded h-60 overflow-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenDebug; 