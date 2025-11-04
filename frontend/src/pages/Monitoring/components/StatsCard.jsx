import React from 'react';

const StatsCard = ({ title, value, icon, color, onClick, identifier, description }) => {
  // Menambahkan description sebagai parameter baru untuk menampilkan deskripsi tambahan
  
  return (
    <div 
      className={`flex flex-col p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 ${color}`}
      onClick={() => onClick && onClick(identifier)} // Memanggil onClick dengan identifier
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{description}</p>
          )}
        </div>
        {icon}
      </div>
    </div>
  );
};

export default StatsCard; 