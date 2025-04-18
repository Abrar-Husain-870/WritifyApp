/**
 * Utility to control logging throughout the application
 * Set to false in production to disable all debug logs
 */
export const DEBUG_MODE = false;

/**
 * Controlled console logging that only outputs when DEBUG_MODE is true
 * @param message The message to log
 * @param data Optional data to log
 */
export const debugLog = (message: string, data?: any): void => {
  if (DEBUG_MODE) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

/**
 * Always logs errors regardless of DEBUG_MODE
 * @param message The error message
 * @param error The error object
 */
export const errorLog = (message: string, error?: any): void => {
  if (error) {
    console.error(message, error);
  } else {
    console.error(message);
  }
};
