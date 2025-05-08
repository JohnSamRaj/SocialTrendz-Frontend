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

  //Facebook/Instagram App Configuration
  facebook: {
    FB_APP_ID: '597911106620373',
    FB_APP_SECRET: '7e7410243f170bee7e8f1d434b67fedf'
  },

  instagram: {
    INSTAGRAM_BUSINESS_ID: '17841427113359484',
    INSTAGRAM_APP_ID: '1035405055317684',
    INSTAGRAM_APP_SECRET: '342235069b5075bebdba930db62ebca2'
  }
  
};