/**
 * Utility untuk clear localStorage remarks lama
 * Jalankan sekali untuk migrasi dari localStorage ke database
 */

export const clearOldLocalStorageRemarks = () => {
  try {
    const keysToRemove = ['table_remarks', 'tableRemarks'];
    let clearedCount = 0;
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`✅ Cleared: ${key}`);
      }
    });
    
    if (clearedCount > 0) {
      console.log(`✅ Successfully cleared ${clearedCount} old localStorage keys`);
      return { success: true, clearedCount };
    } else {
      console.log('ℹ️ No old localStorage keys found');
      return { success: true, clearedCount: 0 };
    }
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
    return { success: false, error: error.message };
  }
};

// Auto-run on import (optional)
if (typeof window !== 'undefined') {
  // Uncomment line below to auto-clear on page load
  // clearOldLocalStorageRemarks();
}

