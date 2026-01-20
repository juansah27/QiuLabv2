import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  IconButton,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const BulkRemarkUpdate = ({ open, onClose, onUpdate, data = [] }) => {
  const [inputText, setInputText] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [updateCount, setUpdateCount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset state ketika modal dibuka/ditutup
  useEffect(() => {
    if (open) {
      setInputText('');
      setPreviewData([]);
      setUpdateCount(0);
      setError('');
      setSuccess('');
    }
  }, [open]);

  // Fungsi untuk memproses input text menjadi data yang dapat diproses
  const processInputText = () => {
    if (!inputText.trim()) {
      setError('Input tidak boleh kosong');
      return;
    }

    try {
      // Split input berdasarkan baris baru
      const lines = inputText.trim().split('\n');
      const parsedData = [];

      // Proses setiap baris
      lines.forEach((line, index) => {
        // Coba deteksi ID dan remark
        // Format yang didukung:
        // 1. ID<tab>Remark
        // 2. ID<spasi>Remark
        // 3. ID,Remark

        let id, remark;

        if (line.includes('\t')) {
          // Format tab-separated
          [id, remark] = line.split('\t', 2);
        } else if (line.includes(',')) {
          // Format CSV
          [id, remark] = line.split(',', 2);
        } else {
          // Coba format spasi
          const parts = line.trim().split(/\s+/);
          if (parts.length < 2) {
            throw new Error(`Baris ${index + 1} tidak memiliki format yang benar`);
          }

          id = parts[0];
          remark = parts.slice(1).join(' ');
        }

        // Bersihkan whitespace
        id = id.trim();
        remark = (remark || '').trim();

        // Normalisasi format remark untuk konsistensi
        if (remark.toLowerCase().includes('cancel')) {
          // Format konsisten untuk nilai Cancel
          remark = normalizeRemarkValue(remark);
        }

        if (!id) {
          throw new Error(`Baris ${index + 1} tidak memiliki ID`);
        }

        if (!remark) {
          throw new Error(`Baris ${index + 1} tidak memiliki Remark`);
        }

        // Validasi apakah ID ada di data
        const idExists = data.some(item => (item['Order Number'] || item.SystemRefId) === id);

        parsedData.push({
          id,
          remark,
          exists: idExists,
          lineNumber: index + 1
        });
      });

      setPreviewData(parsedData);
      setUpdateCount(parsedData.filter(item => item.exists).length);
      setError('');
    } catch (err) {
      setError(err.message || 'Format input tidak valid');
      setPreviewData([]);
      setUpdateCount(0);
    }
  };

  // Fungsi untuk normalisasi format remark
  const normalizeRemarkValue = (value) => {
    const lowerValue = value.toLowerCase().trim();

    // Konversi beberapa variasi 'cancel' ke format standar
    if (lowerValue === 'cancel' || lowerValue === 'cancelled' || lowerValue === 'canceled') {
      return 'Cancel';
    }

    if (lowerValue === 'in_cancel' || lowerValue.includes('in cancel')) {
      return 'IN_Cancel';
    }

    // Konversi beberapa variasi 'pending verifikasi' ke format standar
    if (lowerValue.includes('pending') && lowerValue.includes('verifikasi')) {
      return 'Pending Verifikasi';
    }

    // Jika tidak ada format khusus, kembalikan nilai asli
    return value;
  };

  // Fungsi untuk memproses update data
  const handleProcessUpdate = () => {
    if (previewData.length === 0) {
      setError('Tidak ada data untuk diupdate');
      return;
    }

    try {
      // Filter hanya yang ID-nya ada di data
      const updatesData = previewData
        .filter(item => item.exists)
        .map(item => ({
          id: item.id,
          remark: item.remark
        }));

      if (updatesData.length === 0) {
        setError('Tidak ada ID yang cocok dengan data');
        return;
      }

      // Panggil callback untuk update data
      onUpdate(updatesData);

      // Tampilkan pesan sukses
      setSuccess(`Berhasil memperbarui ${updatesData.length} data`);

      // Reset preview data
      setPreviewData([]);
      setInputText('');
    } catch (err) {
      setError(err.message || 'Gagal memproses update');
    }
  };

  // Fungsi untuk load dari clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);

      // Proses langsung setelah paste
      setTimeout(() => {
        processInputText();
      }, 100);
    } catch (err) {
      setError('Gagal mengambil data dari clipboard. Pastikan Anda mengizinkan akses clipboard.');
    }
  };

  // Fungsi untuk format template
  const getTemplateText = () => {
    return `SHOPEE250421U4D5T36N\tPending Verifikasi
SHOPEE250422URDN9VYD\tPending Verifikasi
SHOPEE250422URSNHUPS\tPending Verifikasi`;
  };

  // Fungsi untuk menyalin template
  const copyTemplate = () => {
    try {
      // Cek apakah Clipboard API tersedia
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(getTemplateText())
          .then(() => {
            setSuccess('Template berhasil disalin ke clipboard');
          })
          .catch(error => {
            setError('Gagal menyalin template: ' + error.message);
          });
      } else {
        // Fallback menggunakan document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = getTemplateText();

        // Menyembunyikan textarea
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        if (successful) {
          setSuccess('Template berhasil disalin ke clipboard');
        } else {
          setError('Gagal menyalin template');
        }

        document.body.removeChild(textArea);
      }
    } catch (error) {
      setError('Gagal menyalin template: ' + error.message);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          px: 3,
          py: 2
        }}
      >
        <Typography variant="h6" component="div">
          Update Remark Massal
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Petunjuk Penggunaan:
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            1. Masukkan daftar ID dan Remark dalam format: [ID] [Remark]
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            2. Setiap baris mewakili satu data (ID dan Remark)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            3. Klik "Proses" untuk melihat pratinjau
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            4. Klik "Update" untuk menerapkan perubahan
          </Typography>

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<ContentPasteIcon />}
              onClick={handlePasteFromClipboard}
              variant="outlined"
            >
              Tempel dari Clipboard
            </Button>
            <Button
              size="small"
              onClick={copyTemplate}
              variant="outlined"
            >
              Salin Template
            </Button>
          </Box>
        </Box>

        <TextField
          label="Masukkan daftar ID dan Remark"
          multiline
          rows={8}
          fullWidth
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={getTemplateText()}
          variant="outlined"
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={processInputText}
          disabled={!inputText.trim()}
          sx={{ mb: 3 }}
        >
          Proses Data
        </Button>

        {previewData.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pratinjau Data
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {updateCount} data dapat diupdate dari {previewData.length} entri
            </Typography>

            <Box
              sx={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 2
              }}
            >
              {previewData.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 0.5,
                    borderBottom: index < previewData.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  <Box
                    sx={{
                      width: '24px',
                      mr: 1,
                      display: 'flex',
                      alignItems: 'center',
                      color: item.exists ? 'success.main' : 'error.main'
                    }}
                  >
                    {item.exists ? (
                      <CheckCircleOutlineIcon fontSize="small" />
                    ) : (
                      <CloseIcon fontSize="small" />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        fontWeight: 'medium',
                        color: item.exists ? 'text.primary' : 'text.disabled'
                      }}
                    >
                      {item.id}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        mx: 1,
                        color: item.exists ? 'text.primary' : 'text.disabled'
                      }}
                    >
                      →
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        color: item.exists ? 'text.primary' : 'text.disabled'
                      }}
                    >
                      {item.remark}
                    </Typography>
                  </Box>
                  <Box>
                    {!item.exists && (
                      <Typography variant="caption" color="error">
                        ID tidak ditemukan
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined">
          Tutup
        </Button>
        <Button
          onClick={handleProcessUpdate}
          variant="contained"
          color="primary"
          disabled={updateCount === 0}
          startIcon={<UploadFileIcon />}
        >
          Update {updateCount > 0 ? `(${updateCount})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkRemarkUpdate; 