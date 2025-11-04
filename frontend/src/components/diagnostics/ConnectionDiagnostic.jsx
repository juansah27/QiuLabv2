import React, { useState } from 'react';
import { testBackendConnection } from '../../utils/testConnection.js';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

/**
 * Komponen diagnostik untuk debugging koneksi backend
 * Menampilkan sebuah tombol kecil di pojok kanan bawah layar
 * Hanya muncul dalam mode development
 */
const ConnectionDiagnostic = () => {
  // State untuk menunjukkan apakah sedang menguji
  const [isTesting, setIsTesting] = useState(false);
  
  // Hanya tampilkan di mode development
  if (import.meta.env.PROD) return null;
  
  const runTests = async () => {
    // Hindari klik berulang
    if (isTesting) return;
    
    try {
      setIsTesting(true);
      // Gunakan verbose=true untuk menampilkan log hanya saat tombol diklik
      const results = await testBackendConnection(true);
      console.log('Hasil pengujian koneksi:', results);
      
      // Tampilkan notifikasi
      if (results.overallStatus) {
        alert('✅ Koneksi ke backend berhasil! Lihat console untuk detail.');
      } else {
        alert('❌ Koneksi ke backend gagal. Lihat console untuk detail troubleshooting.');
      }
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={runTests}
      disabled={isTesting}
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "text-xs font-mono",
        isTesting && "opacity-50 cursor-not-allowed"
      )}
    >
      {isTesting ? '⏳ Sedang Memproses...' : '🔍 Test Koneksi'}
    </Button>
  );
};

export default ConnectionDiagnostic; 