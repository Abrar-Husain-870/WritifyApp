/**
 * Utility to control logging throughout the application
 * Set to false in production to disable all debug logs
 */
export const DEBUG_MODE = process.env.NODE_ENV !== 'production';

/**
 * Controlled console logging that only outputs when DEBUG_MODE is true
 * @param message The message to log
 * @param data Optional data to log
 */
export const debugLog = (message: string, data?: any): void => {
  if (DEBUG_MODE) {
    if (data) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    } else {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }
  }
};

/**
 * Always logs errors regardless of DEBUG_MODE
 * @param message The error message
 * @param error The error object
 */
export const errorLog = (message: string, error?: any): void => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[ERROR] ${timestamp} - ${message}`, error);
    // Here you could also send the error to a logging service like Sentry or LogRocket
  } else {
    console.error(`[ERROR] ${timestamp} - ${message}`);
  }
};
