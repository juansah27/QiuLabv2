import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../../../components/ui/input';
import { THEME_COLORS, THEME_TRANSITIONS } from '../../../utils/themeUtils';

const RemarkInput = ({ 
  value, 
  onSave, 
  onCancel, 
  isDarkMode, 
  rowIndex, 
  colIndex, 
  onKeyDown 
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef(null);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(inputValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (onKeyDown) {
      onKeyDown(e, rowIndex, colIndex);
    }
  };

  const handleBlur = () => {
    onSave(inputValue);
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`w-full px-2 py-1 text-sm rounded-md border ${
          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
        } ${THEME_COLORS.text.primary.light} ${THEME_COLORS.text.primary.dark} ${THEME_TRANSITIONS.default}`}
        placeholder="Enter remark..."
      />
    </div>
  );
};

export default RemarkInput; 