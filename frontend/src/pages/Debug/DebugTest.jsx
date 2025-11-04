import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../../config';
import { usePageTitle } from '../../utils/pageTitle';

const DebugTest = () => {
  // Set page title
  usePageTitle('Debug Test');
  
  const [portInfo, setPortInfo] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  
  useEffect(() => {
    // Ekstrak informasi port dari URL saat ini
    const currentPort = window.location.port;
    setPortInfo(`Browser saat ini berjalan di port: ${currentPort || 'default (80/443)'}`);
    
    // Set API URL
    setApiUrl(getApiUrl());
  }, []);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Halaman Debug Test</h1>
      <p className="mb-4">Jika Anda dapat melihat halaman ini, routing bekerja dengan baik.</p>
      
      <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">Informasi Server:</h2>
        <p><strong>API URL:</strong> {apiUrl}</p>
        <p><strong>Port Info:</strong> {portInfo}</p>
        <p><strong>Rute TokenDebug:</strong> <a href="/debug-token" className="text-blue-600 hover:underline">/debug-token</a></p>
      </div>
      
      <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Troubleshooting:</h2>
        <ul className="list-disc pl-5">
          <li>Pastikan server frontend berjalan (npm run dev)</li>
          <li>Pastikan server backend berjalan (python app.py)</li>
          <li>Pastikan Anda mengakses port yang benar (biasanya 3000 untuk Vite)</li>
          <li>Pastikan rute "/debug-token" sudah didaftarkan di App.jsx</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugTest; 