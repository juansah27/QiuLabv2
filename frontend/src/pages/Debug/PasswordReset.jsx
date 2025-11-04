import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config';
import { usePageTitle } from '../../utils/pageTitle';

const PasswordReset = () => {
  // Set page title
  usePageTitle('Password Reset');
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetPasswords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = getApiUrl();
      const response = await axios.post(`${apiUrl}/auth/reset-passwords`, {});
      setResult(response.data);
      console.log('Password reset response:', response.data);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async (username, password) => {
    try {
      const apiUrl = getApiUrl();
      const response = await axios.post(`${apiUrl}/auth/login`, { username, password });
      return {
        success: true,
        data: response.data
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message
      };
    }
  };

  const handleTestLogins = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const testAccounts = [
        { username: 'admin', password: '@Admin123' },
        { username: 'ladyqiu', password: '@Wanipiro27' }
      ];
      
      const results = [];
      
      for (const account of testAccounts) {
        console.log(`Testing login for ${account.username}...`);
        const loginResult = await testLogin(account.username, account.password);
        results.push({
          username: account.username,
          success: loginResult.success,
          message: loginResult.success ? 'Login successful' : loginResult.error
        });
      }
      
      setResult({ testResults: results });
    } catch (err) {
      console.error('Test login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Password Reset Tool</h1>
      <div className="bg-yellow-100 p-4 rounded-lg mb-4">
        <p className="text-yellow-800 font-bold">⚠️ HANYA UNTUK DEVELOPMENT!</p>
        <p>Tool ini digunakan untuk mengatur ulang password akun test.</p>
      </div>
      
      <div className="flex gap-4 mb-8">
        <button
          onClick={resetPasswords}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Reset Semua Password'}
        </button>
        
        <button
          onClick={handleTestLogins}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Test Login'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 p-4 rounded-lg mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="bg-white p-4 rounded-lg border border-gray-300">
          <h2 className="text-lg font-bold mb-2">Hasil:</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-8 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Akun Test:</h2>
        <ul className="list-disc pl-5">
          <li><strong>Username:</strong> admin, <strong>Password:</strong> @Admin123</li>
          <li><strong>Username:</strong> ladyqiu, <strong>Password:</strong> @Wanipiro27</li>
        </ul>
      </div>
    </div>
  );
};

export default PasswordReset; 