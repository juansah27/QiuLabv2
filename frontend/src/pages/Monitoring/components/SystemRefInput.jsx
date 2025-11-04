import React, { useState, useRef, useEffect } from 'react';
import { cleanInput } from '../hooks/useMonitoring';

const SystemRefInput = ({ value, onChange, onSubmit, isLoading }) => {
  const textareaRef = useRef(null);
  const [hasPasted, setHasPasted] = useState(false);
  const [focusState, setFocusState] = useState(false);
  const [itemCount, setItemCount] = useState(0);
  const [showExamples, setShowExamples] = useState(false);
  
  // Menghitung jumlah SystemRefId yang valid
  useEffect(() => {
    if (!value.trim()) {
      setItemCount(0);
      return;
    }
    
    // Pisahkan input menjadi array dan bersihkan whitespace
    const items = value
      .split(/[\n,]/) // Split by newlines or commas
      .map(item => item.trim())
      .filter(item => item.length > 0); // Filter empty items
    
    setItemCount(items.length);
  }, [value]);
  
  // Auto-resize textarea berdasarkan content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 300) + 'px';
    }
  }, [value]);
  
  // Handle paste event untuk membersihkan input dari whitespace yang tidak diinginkan
  const handlePaste = (event) => {
    // Mencegah default paste behavior
    event.preventDefault();
    
    // Mendapatkan teks dari clipboard
    const pastedText = event.clipboardData.getData('text');
    
    // Membersihkan input dan memformat ulang
    const cleanedText = cleanInput(pastedText);
    
    // Mengganti selected text atau menambahkan ke posisi kursor
    const textareaElem = textareaRef.current;
    const start = textareaElem.selectionStart;
    const end = textareaElem.selectionEnd;
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);
    
    // Update state dengan teks yang sudah dibersihkan
    const newValue = textBefore + cleanedText + textAfter;
    onChange(newValue);
    
    // Set flag bahwa kita baru saja melakukan paste
    setHasPasted(true);
  };
  
  // Effect untuk memposisikan kursor setelah paste
  useEffect(() => {
    if (hasPasted && textareaRef.current) {
      const textarea = textareaRef.current;
      const newPosition = textarea.value.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
      setHasPasted(false);
    }
  }, [hasPasted, value]);
  
  // Contoh SystemRefId untuk demo
  const insertExample = () => {
    const exampleIds = [
      '123456789012345',
      '987654321098765',
      '456789012345678'
    ].join('\n');
    
    onChange(exampleIds);
    setShowExamples(false);
  };
  
  // Clear semua input
  const clearAll = () => {
    onChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 p-6 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Masukkan SystemRefId
        </h3>
        <div className="flex items-center">
          {itemCount > 0 && (
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full mr-2">
              {itemCount} ID{itemCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      
      <div className="relative mb-4">
        <div className={`relative border ${focusState ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-gray-300 dark:border-gray-600'} rounded-md transition-all duration-200 ${isLoading ? 'opacity-70' : ''}`}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            onFocus={() => setFocusState(true)}
            onBlur={() => setFocusState(false)}
            placeholder="Paste SystemRefId disini (satu per baris, atau dipisahkan dengan koma)"
            className="w-full px-4 py-3 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none font-mono text-sm resize-none min-h-[120px]"
            style={{ maxHeight: '300px' }}
            disabled={isLoading}
          />
          
          {/* Clear button inside textarea */}
          {value && (
            <button 
              type="button"
              onClick={clearAll}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-700 rounded-full p-1"
              aria-label="Clear input"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="mt-2 flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Satu ID per baris atau dipisahkan koma</span>
          </div>
          <button 
            onClick={() => setShowExamples(!showExamples)} 
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Lihat contoh
          </button>
        </div>
        
        {/* Contoh SystemRefId */}
        {showExamples && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 text-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-200">Contoh Format</span>
              <button 
                onClick={insertExample} 
                className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
              >
                Gunakan contoh
              </button>
            </div>
            <div className="font-mono text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
              <div>123456789012345</div>
              <div>987654321098765</div>
              <div>456789012345678</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // Bersihkan input saat ini (jika ada whitespace yang tidak diinginkan)
              const cleanedValue = cleanInput(value);
              onChange(cleanedValue);
            }}
            disabled={isLoading || !value.trim()}
            className={`px-4 py-2 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 flex items-center
              ${isLoading || !value.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            Format
          </button>
        </div>
        
        <button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className={`px-5 py-2.5 rounded-md text-white font-medium flex items-center
            ${isLoading || !value.trim() 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memproses...
            </span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Proses {itemCount > 0 ? `(${itemCount})` : ''}
            </>
          )}
        </button>
      </div>
      
      {/* Tips tambahan */}
      {focusState && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-xs text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="mb-1"><strong>Tips:</strong> Copy-paste langsung dari Excel atau spreadsheet lain akan otomatis diformat.</p>
              <p>Gunakan tombol <strong>Format</strong> untuk membersihkan spasi yang tidak perlu.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemRefInput; 