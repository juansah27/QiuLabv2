import { useState, useEffect, useCallback } from 'react';

/**
 * Hook untuk menghitung posisi dropdown relatif terhadap elemen pemicu (trigger)
 * Akan menyesuaikan posisi (atas/bawah) berdasarkan ruang yang tersedia di viewport
 */
export const useDropdownPosition = () => {
  const [position, setPosition] = useState({ 
    top: 0, 
    left: 0, 
    isAbove: false,
    initialized: false 
  });
  const [triggerElement, setTriggerElement] = useState(null);

  /**
   * Perbarui posisi dropdown berdasarkan elemen referensi
   * @param {HTMLElement} element - Elemen yang memicu dropdown
   * @param {number} dropdownWidth - Lebar dropdown dalam pixel
   * @param {number} dropdownHeight - Tinggi dropdown dalam pixel
   * @param {number} gapSize - Jarak antara trigger dan dropdown dalam pixel
   */
  const updatePosition = useCallback((element, dropdownWidth = 260, dropdownHeight = 320, gapSize = 5) => {
    if (!element) {
      console.error('Tidak ada elemen trigger yang diberikan');
      return;
    }
    
    console.log('Update Position dipanggil dengan element:', element);
    setTriggerElement(element);
    
    try {
      // Dapatkan posisi elemen trigger
      const rect = element.getBoundingClientRect();
      console.log('Rect trigger:', rect);
      
      // Dapatkan informasi tentang ruang di viewport
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // Posisikan dropdown tepat di bawah icon
      // Gunakan posisi absolut dari icon sebagai referensi
      let leftPosition = rect.left;
      
      // Sesuaikan posisi horizontal untuk dropdown agar sejajar dengan icon
      leftPosition = Math.max(10, leftPosition);
      
      // Pastikan dropdown tidak melebihi batas kanan viewport
      if (leftPosition + dropdownWidth > window.innerWidth - 10) {
        leftPosition = window.innerWidth - dropdownWidth - 10;
      }
      
      // Cek apakah cukup ruang di bawah
      const shouldShowAbove = spaceBelow < (dropdownHeight + gapSize);
      
      // Log posisi yang dihitung
      console.log('Calculated dropdown position:', {
        leftPosition,
        topPosition: shouldShowAbove 
          ? rect.top - dropdownHeight - gapSize 
          : rect.bottom + gapSize,
        shouldShowAbove
      });
      
      // Set posisi final
      setPosition({
        top: shouldShowAbove 
          ? rect.top - dropdownHeight - gapSize 
          : rect.bottom + gapSize,
        left: leftPosition,
        isAbove: shouldShowAbove,
        initialized: true
      });
      
    } catch (error) {
      console.error('Error saat menghitung posisi dropdown:', error, element);
      setPosition({
        top: 0,
        left: 0,
        isAbove: false,
        initialized: true
      });
    }
  }, []);

  // Perbarui posisi saat window di-resize atau di-scroll
  useEffect(() => {
    if (!triggerElement) return;

    const handleResize = () => {
      updatePosition(triggerElement);
    };

    const handleScroll = () => {
      updatePosition(triggerElement);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [triggerElement, updatePosition]);
  
  return {
    position,
    updatePosition
  };
};

export default useDropdownPosition; 