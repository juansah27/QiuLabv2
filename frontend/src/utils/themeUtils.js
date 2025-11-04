/**
 * Utilitas untuk menjaga konsistensi dark mode di seluruh aplikasi
 */

// Warna standar untuk referensi komponen
export const THEME_COLORS = {
  // Warna latar
  background: {
    light: 'bg-white',
    dark: 'dark:bg-gray-900',
  },
  card: {
    light: 'bg-white',
    dark: 'dark:bg-gray-800',
  },
  hover: {
    light: 'hover:bg-gray-100',
    dark: 'dark:hover:bg-gray-700',
  },
  
  // Warna teks
  text: {
    primary: {
      light: 'text-gray-800',
      dark: 'dark:text-white',
    },
    secondary: {
      light: 'text-gray-600',
      dark: 'dark:text-gray-300',
    },
    muted: {
      light: 'text-gray-500',
      dark: 'dark:text-gray-400',
    },
  },
  
  // Warna border
  border: {
    light: 'border-gray-200',
    dark: 'dark:border-gray-700',
  },
  inputBorder: {
    light: 'border-gray-300',
    dark: 'dark:border-gray-600',
  },
  
  // Warna aksen
  primary: {
    bg: {
      light: 'bg-primary-600',
      dark: 'dark:bg-primary-500',
    },
    text: {
      light: 'text-primary-600',
      dark: 'dark:text-primary-400',
    },
    hover: {
      light: 'hover:bg-primary-700',
      dark: 'dark:hover:bg-primary-600',
    },
  },
};

// Helper untuk mendapatkan kelas warna lengkap
export const getColorClasses = (type, variant = 'primary') => {
  switch (type) {
    case 'bg':
      return `${THEME_COLORS.background.light} ${THEME_COLORS.background.dark}`;
    case 'card':
      return `${THEME_COLORS.card.light} ${THEME_COLORS.card.dark}`;
    case 'text':
      return `${THEME_COLORS.text[variant].light} ${THEME_COLORS.text[variant].dark}`;
    case 'border':
      return `${THEME_COLORS.border.light} ${THEME_COLORS.border.dark}`;
    case 'input-border':
      return `${THEME_COLORS.inputBorder.light} ${THEME_COLORS.inputBorder.dark}`;
    case 'primary-bg':
      return `${THEME_COLORS.primary.bg.light} ${THEME_COLORS.primary.bg.dark}`;
    case 'primary-text':
      return `${THEME_COLORS.primary.text.light} ${THEME_COLORS.primary.text.dark}`;
    default:
      return '';
  }
};

// Kelas transisi standar untuk tema
export const THEME_TRANSITIONS = {
  default: 'transition-colors duration-300',
  fast: 'transition-colors duration-150',
  slow: 'transition-colors duration-500',
};

// Kelas komponen umum dengan dark mode
export const COMPONENT_CLASSES = {
  card: `bg-white dark:bg-gray-800 rounded-lg shadow-md ${THEME_TRANSITIONS.default}`,
  input: `w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${THEME_TRANSITIONS.default}`,
  button: {
    primary: `bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white ${THEME_TRANSITIONS.default}`,
    secondary: `bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 ${THEME_TRANSITIONS.default}`,
  },
  table: {
    header: `bg-gray-50 dark:bg-gray-700 ${THEME_TRANSITIONS.default}`,
    row: `hover:bg-gray-50 dark:hover:bg-gray-700 ${THEME_TRANSITIONS.default}`,
    cell: `px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 ${THEME_TRANSITIONS.default}`,
  },
}; 