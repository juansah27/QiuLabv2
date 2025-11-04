import { useState, useEffect } from 'react';
import { testBackendConnection, testAutoDiscovery } from '../../utils/testConnection.js';
import { getApiUrl, getConfig } from '../../config';
import { usePageTitle } from '../../utils/pageTitle';

const ConnectionTest = () => {
  // Set page title
  usePageTitle('Connection Test');
  
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [config, setConfig] = useState(null);
  
  useEffect(() => {
    // Ambil konfigurasi saat komponen dimuat
    setConfig(getConfig());
  }, []);
  
  const runConnectionTest = async () => {
    setLoading(true);
    try {
      const results = await testBackendConnection();
      setTestResults(results);
    } catch (error) {
      console.error("Error saat menjalankan tes koneksi:", error);
      setTestResults({ error: error.message, overallStatus: false });
    } finally {
      setLoading(false);
    }
  };
  
  const runAutoDiscoveryTest = async () => {
    setLoading(true);
    try {
      const results = await testAutoDiscovery();
      setTestResults({ discovery: results, overallStatus: results.success });
    } catch (error) {
      console.error("Error saat menjalankan auto-discovery:", error);
      setTestResults({ error: error.message, overallStatus: false });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pengujian Koneksi</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Konfigurasi Saat Ini</h2>
        {config ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <tbody>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 px-4 font-medium">API URL</td>
                  <td className="py-2 px-4">{getApiUrl()}</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 px-4 font-medium">Environment</td>
                  <td className="py-2 px-4">{config.environment}</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 px-4 font-medium">Debug</td>
                  <td className="py-2 px-4">{config.features?.debug ? "Aktif" : "Nonaktif"}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium">Cache Buster</td>
                  <td className="py-2 px-4">{config.cacheBuster || "Tidak Ada"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Memuat konfigurasi...</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Tes Koneksi</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Tes koneksi ke backend dengan memeriksa endpoint health dan config.
          </p>
          <button
            onClick={runConnectionTest}
            disabled={loading}
            className={`px-4 py-2 rounded-md ${
              loading 
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Menjalankan tes..." : "Jalankan Tes Koneksi"}
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Tes Auto-Discovery</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Tes kemampuan frontend untuk menemukan backend secara otomatis.
          </p>
          <button
            onClick={runAutoDiscoveryTest}
            disabled={loading}
            className={`px-4 py-2 rounded-md ${
              loading 
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {loading ? "Mencari backend..." : "Jalankan Auto-Discovery"}
          </button>
        </div>
      </div>
      
      {testResults && (
        <div className={`rounded-lg shadow p-6 mb-8 ${
          testResults.overallStatus 
            ? "bg-green-100 dark:bg-green-900" 
            : "bg-red-100 dark:bg-red-900"
        }`}>
          <h2 className="text-xl font-semibold mb-4">Hasil Pengujian</h2>
          
          <div className="mb-4">
            <div className={`text-lg font-medium ${
              testResults.overallStatus 
                ? "text-green-700 dark:text-green-300" 
                : "text-red-700 dark:text-red-300"
            }`}>
              Status: {testResults.overallStatus ? "Berhasil" : "Gagal"}
            </div>
          </div>
          
          {testResults.apiUrl && (
            <div className="mb-2">
              <span className="font-medium">API URL: </span>
              {testResults.apiUrl}
            </div>
          )}
          
          {testResults.error && (
            <div className="mb-4 p-3 bg-red-200 dark:bg-red-800 rounded">
              <span className="font-medium">Error: </span>
              {testResults.error}
            </div>
          )}
          
          {testResults.discovery && (
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Auto-Discovery:</h3>
              <div className="pl-4">
                <div className="mb-1">
                  <span className="font-medium">Status: </span>
                  {testResults.discovery.success ? "Berhasil" : "Gagal"}
                </div>
                {testResults.discovery.duration && (
                  <div className="mb-1">
                    <span className="font-medium">Durasi: </span>
                    {testResults.discovery.duration} ms
                  </div>
                )}
                {testResults.discovery.error && (
                  <div className="mb-1">
                    <span className="font-medium">Error: </span>
                    {testResults.discovery.error}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {testResults.endpoints && Object.keys(testResults.endpoints).length > 0 && (
            <div>
              <h3 className="font-medium text-lg mb-2">Endpoint Tests:</h3>
              {Object.entries(testResults.endpoints).map(([name, info]) => (
                <div 
                  key={name}
                  className={`mb-4 p-3 rounded ${
                    info.success 
                      ? "bg-green-200 dark:bg-green-800" 
                      : "bg-red-200 dark:bg-red-800"
                  }`}
                >
                  <h4 className="font-medium capitalize">{name}</h4>
                  <div className="pl-4 mt-2">
                    <div className="mb-1">
                      <span className="font-medium">URL: </span>
                      {info.url}
                    </div>
                    {info.status && (
                      <div className="mb-1">
                        <span className="font-medium">Status: </span>
                        {info.status}
                      </div>
                    )}
                    {info.error && (
                      <div className="mb-1">
                        <span className="font-medium">Error: </span>
                        {info.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {testResults.overallStatus ? (
            <div className="mt-4 p-3 bg-green-200 dark:bg-green-800 rounded">
              Koneksi ke backend berhasil! Aplikasi dapat berkomunikasi dengan API.
            </div>
          ) : (
            <div className="mt-4">
              <div className="p-3 bg-red-200 dark:bg-red-800 rounded mb-4">
                Koneksi ke backend gagal. Lihat detail di atas untuk informasi lebih lanjut.
              </div>
              
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded">
                <h3 className="font-medium text-lg mb-2">Saran Troubleshooting:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Pastikan backend berjalan dan dapat diakses</li>
                  <li>Periksa apakah ada firewall yang memblokir koneksi</li>
                  <li>Pastikan API URL yang digunakan benar</li>
                  <li>Coba akses endpoint API langsung di browser</li>
                  <li>Restart backend dan frontend</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionTest; 