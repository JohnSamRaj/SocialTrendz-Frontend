/**
 * Development environment configuration
 * These settings will be used when running the application in development mode
 */
export const environment = {
  // Environment type
  production: false,
  
  // API configuration
  apiUrl: 'http://localhost:3000/api',
  
  // Feature flags
  features: {
    enableAnalytics: true,
    enableMockData: true
  },
  
};