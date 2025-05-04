/**
 * Production environment configuration
 * These settings will be used when running the application in production mode
 */
export const environment = {
  // Environment type
  production: true,
  
  // API configuration
  apiUrl: '/api',
  
  // Feature flags
  features: {
    enableAnalytics: true,
    enableMockData: false
  }
};