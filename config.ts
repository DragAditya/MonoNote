export const APP_CONFIG = {
  // --- Branding Configuration ---
  APP_NAME: 'MonoNote',
  APP_TAGLINE: 'Ultra-fast, distraction-free code notebook',
  DOMAIN: 'mononote.com', // Displayed in the URL hint on the homepage
  
  // --- System Configuration ---
  STORAGE_KEY_PREFIX: 'mononote_nb_', // Key prefix for notebook content
  TOKEN_KEY_PREFIX: 'mononote_token_', // Key prefix for edit tokens
  ADMIN_PASSWORD_HASH: 'admin123', // Mock password (change for real production)
  
  RESERVED_SLUGS: ['admin', 'login', 'api', 'create', 'about', 'terms', 'privacy', '404', 's', 'share'],
  
  // Lightweight Highlight.js languages to support via CDN
  SUPPORTED_LANGUAGES: [
    { value: 'text', label: 'Plain Text', aliases: ['plaintext', 'txt'], comment: '' },
    { value: 'javascript', label: 'JavaScript', aliases: ['js', 'jsx'], comment: '//' },
    { value: 'typescript', label: 'TypeScript', aliases: ['ts', 'tsx'], comment: '//' },
    { value: 'python', label: 'Python', aliases: ['py'], comment: '#' },
    { value: 'java', label: 'Java', aliases: [], comment: '//' },
    { value: 'cpp', label: 'C++', aliases: ['c', 'h', 'hpp'], comment: '//' },
    { value: 'go', label: 'Go', aliases: ['golang'], comment: '//' },
    { value: 'rust', label: 'Rust', aliases: ['rs'], comment: '//' },
    { value: 'sql', label: 'SQL', aliases: [], comment: '--' },
    { value: 'json', label: 'JSON', aliases: [], comment: '' },
    { value: 'html', label: 'HTML/XML', aliases: ['xml'], comment: '<!--' }, 
    { value: 'css', label: 'CSS', aliases: [], comment: '/*' }, 
  ]
};