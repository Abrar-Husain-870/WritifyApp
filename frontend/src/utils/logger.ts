/**
 * Secure logging utility for Writify
 * Prevents sensitive data from being logged in production environments
 */

// Check if we're in development mode
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

/**
 * Safely log messages without exposing sensitive data in production
 */
const log = (message: string, data?: any): void => {
  if (isDevelopment) {
    // In development, log everything
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  } else {
    // In production, only log the message without sensitive data
    console.log(message + (data ? ' [Data hidden in production]' : ''));
  }
};

/**
 * Log errors safely
 */
const error = (message: string, error?: any): void => {
  if (isDevelopment) {
    // In development, log full error details
    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  } else {
    // In production, only log that an error occurred without details
    console.error(message + (error ? ' [Error details hidden in production]' : ''));
  }
};

export default {
  log,
  error
};
