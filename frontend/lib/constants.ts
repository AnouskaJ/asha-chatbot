// Constants used throughout the application

// API URL for backend
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Supported languages
export const AVAILABLE_LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Hindi', code: 'hi' }
];

// Default settings
export const DEFAULT_LANGUAGE = 'en';
export const MAX_HISTORY_LENGTH = 20; // Maximum number of messages to keep in history

// Chat UI settings
export const DEFAULT_BOT_NAME = 'Asha AI';
export const INITIAL_MESSAGE = 'Hello! I am Asha, your AI assistant specialized in women\'s career development. How can I help you today?'; 