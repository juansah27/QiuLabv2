import { useState, useEffect, useRef } from 'react';
import { checkServerHealth } from '../utils/serverCheck';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

const NetworkStatusIndicator = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(Date.now());
  const isCheckingRef = useRef(false);
  const intervalRef = useRef(null);

  // Periksa status koneksi setiap 120 detik (lebih lama untuk mengurangi request)
  useEffect(() => {
    const checkConnection = async () => {
      // Gunakan ref untuk melacak status checking tanpa memicu re-render
      if (isCheckingRef.current) return;
      
      isCheckingRef.current = true;
      setChecking(true);
      
      try {
        const isAvailable = await checkServerHealth();
        setIsConnected(isAvailable);
        setLastCheck(Date.now());
      } catch (error) {
        console.error('Error checking connection:', error);
      } finally {
        setChecking(false);
        isCheckingRef.current = false;
      }
    };

    // Lakukan pemeriksaan awal
    checkConnection();

    // Atur interval pemeriksaan dengan interval yang lebih lama
    intervalRef.current = setInterval(checkConnection, 120000); // 2 menit

    // Cleanup interval saat komponen unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Tidak ada dependensi

  // Ketika browser online/offline
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Jika terkoneksi, tidak perlu menampilkan indikator
  if (isConnected) {
    return null;
  }

  return (
    <Card className={cn(
      "fixed bottom-5 right-5 z-50",
      "bg-destructive text-destructive-foreground",
      "flex items-center gap-2 p-3 text-sm"
    )}>
      <span className={cn(
        "inline-block w-2.5 h-2.5 rounded-full",
        checking ? "bg-warning animate-pulse" : "bg-destructive-foreground"
      )} />
      <span>
        {checking ? 'Mencoba terhubung kembali...' : 'Tidak ada koneksi ke server'}
      </span>
    </Card>
  );
};

export default NetworkStatusIndicator; 