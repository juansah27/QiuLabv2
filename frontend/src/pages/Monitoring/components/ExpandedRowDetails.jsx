import React from 'react';

// Pengelompokan kategori data untuk tampilan yang lebih terorganisir
const DATA_CATEGORIES = {
  transaction: ['SystemRefId', 'SystemId', 'MerchantName', 'OrderStatus', 'Remark', 'Awb'],
  status: ['Status Interfaced', 'Status SC', 'Status_Durasi', 'FulfilledByFlexo'],
  dates: ['OrderDate', 'DtmCrt', 'AddDate'],
  other: ['Origin', 'importlog', 'DeliveryMode', 'ItemIds']
};

// Format nilai tanggal dengan benar
const formatDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    
    // Cek apakah tanggal valid
    if (isNaN(date.getTime())) return dateString;
    
    // Format tanggal: DD/MM/YYYY hh:mm:ss
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    return dateString;
  }
};

// Format nilai berdasarkan tipe data atau pola tertentu
const formatValue = (key, value) => {
  if (value === null || value === undefined || value === '') {
    return <i className="text-gray-400 dark:text-gray-500 text-opacity-70">NULL</i>;
  }
  
  // Format tanggal
  if (key.includes('Date') || key.includes('Dtm')) {
    const formattedDate = formatDate(value);
    return formattedDate || String(value);
  }
  
  // Format status dengan chip/badge
  if (key === 'Status Interfaced' || key === 'Status_Interfaced') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        value === 'Yes' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      }`}>
        {value}
      </span>
    );
  }
  
  // Format Remark dengan badge
  if (key === 'Remark') {
    if (value === 'Pending Verifikasi') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          {value}
        </span>
      );
    } else if (value === 'Cancel' || value === 'IN_Cancel') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {value}
        </span>
      );
    }
  }
  
  // Format SystemRefId sebagai font mono
  if (key === 'SystemRefId') {
    return <span className="font-mono text-blue-700 dark:text-blue-400">{value}</span>;
  }
  
  // Nilai default
  return String(value);
};

// Petakan kunci ke kategori, atau gunakan "other" sebagai default
const getCategoryForKey = (key) => {
  for (const [category, keys] of Object.entries(DATA_CATEGORIES)) {
    if (keys.some(k => key.includes(k))) {
      return category;
    }
  }
  return 'other';
};

// Kelompokkan data menurut kategori
const groupDataByCategory = (rowData) => {
  const grouped = {
    transaction: {},
    status: {},
    dates: {},
    other: {}
  };
  
  Object.entries(rowData).forEach(([key, value]) => {
    const category = getCategoryForKey(key);
    grouped[category][key] = value;
  });
  
  return grouped;
};

const ExpandedRowDetails = ({ row }) => {
  const groupedData = groupDataByCategory(row);
  
  // Label untuk kategori data
  const categoryLabels = {
    transaction: 'Informasi Transaksi',
    status: 'Status',
    dates: 'Waktu',
    other: 'Informasi Tambahan'
  };
  
  return (
    <div className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-800/30 rounded-b-lg shadow-inner">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {Object.entries(groupedData).map(([category, data]) => {
          // Skip kategori yang kosong
          if (Object.keys(data).length === 0) return null;
          
          return (
            <div key={category} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-blue-100 dark:border-blue-800/50">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2 pb-1 border-b border-blue-100 dark:border-blue-800/50">
                {categoryLabels[category]}
              </h4>
              <div className="space-y-2">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{key}</span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {formatValue(key, value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tombol aksi khusus untuk baris */}
      <div className="mt-3 text-right">
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors focus:outline-none">
          Lihat Detail Lengkap
        </button>
      </div>
    </div>
  );
};

export default ExpandedRowDetails; 