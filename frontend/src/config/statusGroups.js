// Konfigurasi terpusat untuk grouping status
// Hanya edit file ini untuk menambah/mengubah grouping!

export const STATUS_GROUPS = {
  // Format: 'nama_grouping': {
  //   patterns: ['pattern1', 'pattern2'], // kata-kata yang akan di-match
  //   color: '#hexcolor', // warna untuk chart
  //   priority: 1 // urutan prioritas (1 = tertinggi)
  // }

  'Pending Verifikasi': {
    patterns: ['pending verifikasi', 'pending verfikasi'],
    color: '#0ea5e9',
    priority: 1
  },

  'Fulfilled by Shopee': {
    patterns: ['fulfilled by shopee', 'fullfiled By Shopee'],
    color: '#f472b6',
    priority: 5
  },
  
  'IN_Cancel': {
    patterns: ['in_cancel', 'in cancel','in cancelled','IN_Cancelled'],
    color: '#a78bfa',
    priority: 2
  },
  
  'Request Cancel By Client': {
    patterns: ['request cancel'],
    color: '#f472b6',
    priority: 4
  },
  
  'Cancelled': {
    patterns: ['canceled', 'cancellations', 'cncled', 'cancel'],
    color: '#8b5cf6', 
    priority: 3
  },
  
  'Transporter Blank': {
    patterns: ['transporter blank','tansporter blank'],
    color: '#8b5cf6', 
    priority: 6
  },

  // TAMBAHKAN GROUPING BARU DI SINI SAJA!
  // Contoh:
  // 'Processing': {
  //   patterns: ['processing', 'proses', 'sedang diproses'],
  //   color: '#10b981',
  //   priority: 5
  // },
  
  // 'Failed': {
  //   patterns: ['failed', 'gagal', 'error'],
  //   color: '#ef4444', 
  //   priority: 6
  // }
};

// Fungsi normalisasi yang menggunakan konfigurasi dengan prioritas pattern
export const normalizeStatusName = (status) => {
  if (!status) return 'NULL';
  
  const normalized = status.toLowerCase().trim();
  
  // Sort groups by priority (lower number = higher priority)
  const sortedGroups = Object.entries(STATUS_GROUPS)
    .sort((a, b) => a[1].priority - b[1].priority);
  
  // Cek setiap group berdasarkan patterns, dimulai dari prioritas tertinggi
  for (const [groupName, config] of sortedGroups) {
    for (const pattern of config.patterns) {
      if (normalized.includes(pattern)) {
        return groupName;
      }
    }
  }
  
  // Jika tidak match dengan group manapun, return original
  return status;
};

// Helper functions
export const getStatusGroups = () => Object.keys(STATUS_GROUPS);

export const getStatusColors = () => {
  const colors = {};
  Object.entries(STATUS_GROUPS).forEach(([groupName, config]) => {
    colors[groupName] = config.color;
  });
  return colors;
};

export const getStatusPriorities = () => {
  return Object.entries(STATUS_GROUPS)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([groupName]) => groupName);
};

// Untuk backward compatibility
export const getDefaultRemarkOptions = () => {
  const options = {};
  Object.entries(STATUS_GROUPS).forEach(([groupName, config]) => {
    options[groupName] = {
      value: groupName,
      color: `bg-${config.color.replace('#', '')}-100 text-${config.color.replace('#', '')}-800 border border-${config.color.replace('#', '')}-300`
    };
  });
  return options;
};
