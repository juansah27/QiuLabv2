import { useEffect, useMemo, useRef, useState } from 'react';
import { getApiUrl } from '../../config';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Check, X, Loader2, Play, Square, Download, FileText, Eye, Trash2, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { usePageTitle } from '../../utils/pageTitle';

function GetOrder() {
  // Set page title
  usePageTitle('Otomasi Get Order');
  
  const [ordersText, setOrdersText] = useState('');
  const [preview, setPreview] = useState(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState('');
  const [destyStatus, setDestyStatus] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [platformStatus, setPlatformStatus] = useState({}); // name -> running|ok|fail
  const [completedCount, setCompletedCount] = useState(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDestyChecking, setIsDestyChecking] = useState(false);
  const eventSourceRef = useRef(null);
  const platformsSetRef = useRef(new Set());
  const logRef = useRef(null);

  const allowedPlatforms = useMemo(() => new Set(['Desty','Ginee','Lazada','Shopee','Tiktok','Jubelio']), []);

  const baseApi = useMemo(() => {
    try {
      const url = new URL(getApiUrl());
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      return window.location.origin;
    }
  }, []);

  const otomasiBase = useMemo(() => `${getApiUrl()}/otomasi`, []);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  // Debug: Track state changes
  useEffect(() => {
    console.log('[DEBUG] State updated:', { 
      platforms, 
      platformStatus: JSON.stringify(platformStatus), 
      completedCount,
      platformsLength: platforms.length,
      displayValue: `${Math.min(completedCount, platforms.length)}/${platforms.length}`
    });
  }, [platforms, platformStatus, completedCount]);

  const checkDestyDB = async () => {
    setIsDestyChecking(true);
    setDestyStatus('Checking...');
    try {
      const res = await fetch(`${otomasiBase}/check_desty_db`);
      const data = await res.json();
      if (data.status === 'success') {
        const dbIcon = data.database_ok ? '✅' : '❌';
        const lookupIcon = data.entity_lookup_ok ? '✅' : '❌';
        setDestyStatus(`${dbIcon} DB ${lookupIcon} EntityId`);
      } else {
        setDestyStatus('❌ Error');
      }
    } catch (e) {
      setDestyStatus('❌ Network Error');
    } finally {
      setIsDestyChecking(false);
    }
  };

  const previewJobs = async () => {
    if (!ordersText.trim()) {
      setPreview({ selected_names: [], input_info: 'Tidak ada data untuk dipreview' });
      return;
    }
    
    setIsPreviewLoading(true);
    try {
      const form = new FormData();
      form.append('orders_text', ordersText);
      const res = await fetch(`${otomasiBase}/check`, { method: 'POST', body: form });
      const data = await res.json();
      setPreview(data);
    } catch (error) {
      setPreview({ selected_names: [], input_info: 'Error saat preview: ' + error.message });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const runLive = async () => {
    if (!ordersText.trim()) {
      setLog('❌ Tidak ada data order untuk diproses\n');
      return;
    }

    setRunning(true);
    setLog('🚀 Memulai eksekusi...\n');
    setPreview(null);
    setPlatforms([]);
    setPlatformStatus({});
    setCompletedCount(0);
    platformsSetRef.current = new Set();
    try {
      const form = new FormData();
      form.append('orders_text', ordersText);
      const res = await fetch(`${otomasiBase}/run_live`, { method: 'POST', body: form });
      const data = await res.json();
      const sessionId = data.session_id;
      if (!sessionId) {
        setLog((l) => l + '\n❌ Gagal memulai sesi');
        setRunning(false);
        return;
      }
      const streamUrl = `${baseApi}/api/otomasi/stream/${sessionId}`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      const initProgress = (names) => {
        const filtered = names.filter((n) => allowedPlatforms.has(n));
        setPlatforms(filtered);
        platformsSetRef.current = new Set(filtered.map((n) => String(n).toLowerCase()));
        const st = {};
        filtered.forEach((n) => (st[n] = 'running'));
        setPlatformStatus(st);
        setCompletedCount(0);
      };

      const markPlatform = (name, ok) => {
        const normalized = String(name || '').toLowerCase().trim();
        console.log('[DEBUG] markPlatform called:', { name, normalized, ok, platforms: Array.from(platformsSetRef.current) });
        
        if (!platformsSetRef.current.has(normalized)) {
          console.log('[DEBUG] Platform not found in set:', normalized);
          return;
        }
        
        setPlatformStatus((prev) => {
          if (!name) return prev;
          
          // Find the original platform name (case-insensitive)
          const originalName = platforms.find(p => p.toLowerCase() === normalized) || name;
          
          const next = { ...prev };
          if (!next[originalName] || next[originalName] === 'running') {
            next[originalName] = ok ? 'ok' : 'fail';
            console.log('[DEBUG] Updated status:', { originalName, status: next[originalName] });
          }
          
          const done = Object.keys(next)
            .filter((k) => platformsSetRef.current.has(String(k).toLowerCase()))
            .map((k) => next[k])
            .filter((s) => s === 'ok' || s === 'fail').length;
          
          console.log('[DEBUG] Completed count calculation:', {
            allKeys: Object.keys(next),
            statuses: Object.values(next),
            filteredKeys: Object.keys(next).filter((k) => platformsSetRef.current.has(String(k).toLowerCase())),
            completedCount: done
          });
          
          setCompletedCount(done);
          return next;
        });
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'output') {
            setLog((l) => l + payload.content);
            const text = payload.content || '';
            if (text.includes('📋 Job yang akan dijalankan:')) {
              const idx = text.indexOf(':');
              if (idx !== -1) {
                const list = text.substring(idx + 1);
                const firstLine = list.split('\n')[0];
                const names = firstLine
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s && allowedPlatforms.has(s));
                if (names.length) initProgress(names);
              }
            }
            // Pattern matching for success/failure detection
            // Pattern 1: ✅ {name} selesai dengan sukses (most specific)
            let m1 = text.match(/✅\s+(\w+)\s+selesai\s+dengan\s+sukses/mi);
            if (m1) console.log('[DEBUG] Pattern 1 matched:', m1[1]);
            
            // Pattern 2: ✅ {name} sukses
            let m2 = text.match(/✅\s+(\w+)\s+sukses/mi);
            if (m2) console.log('[DEBUG] Pattern 2 matched:', m2[1]);
            
            const okName = (m1 && m1[1]) || (m2 && m2[1]);
            if (okName) {
              console.log('[DEBUG] Success detected for:', okName.trim());
              markPlatform(okName.trim(), true);
            }
            
            // Error patterns
            let me1 = text.match(/❌\s*(.+?)\s*selesai/mi);
            const errName = me1 && me1[1];
            if (errName) {
              console.log('[DEBUG] Error detected for:', errName.trim());
              markPlatform(errName.trim(), false);
            }
            
            // Bracket patterns: [name] ✅ or [name] ❌
            let bOk = text.match(/\[([^\]]+)\]\s+✅/mi);
            if (bOk && bOk[1]) {
              console.log('[DEBUG] Bracket success matched:', bOk[1]);
              markPlatform(bOk[1].trim(), true);
            }
            
            let bErr = text.match(/\[([^\]]+)\]\s+❌/mi);
            if (bErr && bErr[1]) {
              console.log('[DEBUG] Bracket error matched:', bErr[1]);
              markPlatform(bErr[1].trim(), false);
            }
            
            // Additional pattern: [OK] {name}: Selesai dengan sukses
            let okPattern = text.match(/\[OK\]\s+(.+?):\s+Selesai\s+dengan\s+sukses/mi);
            if (okPattern && okPattern[1]) {
              console.log('[DEBUG] [OK] pattern matched:', okPattern[1]);
              markPlatform(okPattern[1].trim(), true);
            }
          } else if (payload.type === 'complete') {
            setLog((l) => l + '\n✅ Get Order selesai!');
            setRunning(false);
            es.close();
            eventSourceRef.current = null;
          }
        } catch (e) {
          // ignore
        }
      };
      es.onerror = () => {
        setLog((l) => l + '\n❌ Koneksi terputus atau error');
        setRunning(false);
        es.close();
        eventSourceRef.current = null;
      };
    } catch (e) {
      setLog((l) => l + `\n❌ Error: ${e}`);
      setRunning(false);
    }
  };

  const stop = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setRunning(false);
    setLog((l) => l + '\n⏹️ Aplikasi dihentikan');
  };

  const clearOrders = () => {
    setOrdersText('');
    setPreview(null);
  };

  const downloadExcelTemplate = () => {
    const xmlHeader = '<?xml version="1.0"?>\n';
    const workbookOpen = '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
    const styles = '<Styles><Style ss:ID="hdr"><Font ss:Bold="1"/></Style></Styles>';
    const rows = [
      ['Brand', 'Order'],
      ['EBLO-CETAPHIL-TTS', 'TTS579939438562411909'],
      ['ELSHESKIN', 'SHOPEE25080889KQXCCH'],
      ['SAFFNCO', 'SP-25080889MEUGFW'],
      ['NACIFIC', 'LZ2647258382727321-275'],
      ['SOMBONG MENS CARE', 'DST-2508186F50VB7D'],
      ['AMAN MAJU NUSANTARA', 'GN-25080889M77RT9'],
    ];
    const rowXml = rows
      .map((r, idx) =>
        `<Row>` +
        r
          .map((c) => `<Cell${idx === 0 ? ' ss:StyleID="hdr"' : ''}><Data ss:Type="String">${String(c).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`)
          .join('') +
        `</Row>`
      )
      .join('');
    const worksheet = `<Worksheet ss:Name="OrderTemplate"><Table>${rowXml}</Table></Worksheet>`;
    const workbookClose = '</Workbook>';
    const xml = xmlHeader + workbookOpen + styles + worksheet + workbookClose;
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'order_template.xls';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPlatformIcon = (platformName) => {
    const icons = {
      'Desty': '🔍',
      'Ginee': '🟢',
      'Lazada': '🔵',
      'Shopee': '🟠',
      'Tiktok': '⚫',
      'Jubelio': '🟣'
    };
    return icons[platformName] || '📦';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'fail': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'running': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4" />;
      case 'fail': return <X className="h-4 w-4" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ok': return 'Selesai';
      case 'fail': return 'Gagal';
      case 'running': return 'Memproses...';
      default: return 'Menunggu';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Otomasi Get Order</h1>
              <p className="text-gray-600 dark:text-gray-400">Proses order dari berbagai marketplace secara otomatis</p>
            </div>
          </div>
        </div>

        {/* Steps Overview */}
        <div className="mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">1. Input Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Masukkan daftar order dari Excel</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">2. Preview</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lihat marketplace yang akan diproses</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">3. Execute</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Jalankan proses otomasi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Input & Controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* Input Section */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Input Data Order</CardTitle>
                    <CardDescription>Tempelkan data dari Excel (Brand dan Order dipisah TAB)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Format: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">BRAND TAB ORDER_ID</span>
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={downloadExcelTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Template Excel
                  </Button>
                </div>
                
                <Textarea
                  className="min-h-[200px] resize-none border-2 focus:border-blue-500 dark:focus:border-blue-400"
                  placeholder={`Contoh format:
Tiktok	TTS579939438562411909
Shopee	SHOPEE25080889KQXCCH
Lazada	LZ2647258382727321-275`}
                  value={ordersText}
                  onChange={(e) => setOrdersText(e.target.value)}
                />

                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    💡 Tips & Contoh Data
                  </summary>
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                    <div className="font-mono text-sm bg-white dark:bg-gray-800 p-3 rounded border">
                      <div className="text-green-600">Tiktok	TTS579939438562411909</div>
                      <div className="text-blue-600">Shopee	SHOPEE25080889KQXCCH</div>
                      <div className="text-purple-600">Jubelio	SP-25080889MEUGFW</div>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Gunakan TAB untuk memisahkan Brand dan Order (copy-paste dari Excel)</li>
                      <li>• Baris kosong akan diabaikan secara otomatis</li>
                      <li>• Huruf besar/kecil tidak mempengaruhi proses</li>
                      <li>• Sistem akan mendeteksi marketplace secara otomatis</li>
                    </ul>
                  </div>
                </details>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={previewJobs} 
                  disabled={running || isPreviewLoading}
                  className="flex items-center gap-2"
                >
                  {isPreviewLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {isPreviewLoading ? 'Loading...' : 'Preview'}
                </Button>
                
                <Button 
                  onClick={runLive} 
                  disabled={running || !ordersText.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Play className="h-4 w-4" />
                  Mulai Proses
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={clearOrders} 
                  disabled={running}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Bersihkan
                </Button>

                {running && (
                  <Button 
                    variant="destructive" 
                    onClick={stop}
                    className="flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                )}

                <div className="ml-auto">
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                      ⚙️ Opsi Lanjutan
                    </summary>
                    <div className="flex items-center gap-3 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={checkDestyDB} 
                        disabled={isDestyChecking}
                        className="flex items-center gap-2"
                      >
                        {isDestyChecking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        Cek Desty
                      </Button>
                      <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {destyStatus || 'Belum dicek'}
                      </span>
                    </div>
                  </details>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column - Progress & Logs */}
          <div className="lg:col-span-5 space-y-6">
            {/* Progress Section */}
            {(platforms.length > 0 || running) && (
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Progress Platform</CardTitle>
                        <CardDescription>Status real-time per marketplace</CardDescription>
                      </div>
                    </div>
                    {platforms.length > 0 && (
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="secondary" className="text-sm" key={`progress-${completedCount}-${platforms.length}`}>
                          {completedCount}/{platforms.length}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          [c={completedCount} p={platforms.length}]
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {platforms.map((name) => {
                    const st = platformStatus[name] || 'running';
                    const isOk = st === 'ok';
                    const isFail = st === 'fail';
                    const isRunning = st === 'running';
                    
                    return (
                      <div key={name} className="relative overflow-hidden rounded-lg border bg-gray-50/50 dark:bg-gray-700/50 p-4 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getPlatformIcon(name)}</span>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(st)}
                              <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(st)} border-current`}
                          >
                            {getStatusText(st)}
                          </Badge>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ease-out ${
                              isRunning
                                ? 'bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse'
                                : isOk
                                ? 'bg-gradient-to-r from-green-400 to-green-600'
                                : 'bg-gradient-to-r from-red-400 to-red-600'
                            } ${isRunning ? 'w-full' : 'w-full'}`}
                          />
                        </div>
                        
                        {/* Status Details */}
                        {isRunning && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                            Memproses order...
                          </div>
                        )}
                        {isOk && (
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                            ✅ Berhasil diproses
                          </div>
                        )}
                        {isFail && (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                            ❌ Gagal diproses
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {platforms.length === 0 && running && (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Menunggu daftar platform...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Preview Section */}
            {preview && (
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Hasil Deteksi</CardTitle>
                      <CardDescription>Marketplace yang akan diproses</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {preview.selected_names && preview.selected_names.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {preview.selected_names.map((n) => (
                          <Badge 
                            key={n} 
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1"
                          >
                            <span>{getPlatformIcon(n)}</span>
                            {n}
                            {n === 'Desty' && <span className="text-xs">🔍</span>}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        {preview.input_info}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">{preview.input_info}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Log Section */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Log Output</CardTitle>
                    <CardDescription>Detail proses eksekusi</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre 
                    ref={logRef} 
                    className="rounded-lg border bg-gray-50 dark:bg-gray-900 p-4 whitespace-pre-wrap text-sm font-mono h-64 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                  >
                    {log || 'Log akan muncul di sini saat proses berjalan...'}
                  </pre>
                  {log && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLog('')}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GetOrder;


