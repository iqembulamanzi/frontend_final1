export const API_CONFIG = {
  baseURL: 'http://100.88.173.46:2000/api',
  timeout: 30000, // 30 seconds timeout
  retries: 3,
  retryDelay: 1000, // 1 second
  headers: {
    'Content-Type': 'application/json'
  }
};