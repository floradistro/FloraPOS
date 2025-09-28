/**
 * Date and time utilities for consistent timezone handling across the application
 * All times are displayed in Eastern Time (EST/EDT)
 */

// Force EST/EDT timezone for all date operations
const SYSTEM_TIMEZONE = 'America/New_York';

/**
 * Format a date string or Date object for display with EST timezone
 * @param dateInput - Date string (ISO format) or Date object
 * @param options - Optional formatting options
 * @returns Formatted date string in EST timezone
 */
export function formatDateTime(
  dateInput: string | Date,
  options: {
    includeTimezone?: boolean;
    format?: 'short' | 'medium' | 'long';
    timeOnly?: boolean;
    dateOnly?: boolean;
  } = {}
): string {
  const {
    includeTimezone = false,  // Changed default to false
    format = 'medium',
    timeOnly = false,
    dateOnly = false
  } = options;

  try {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      // Clean up the date string - sometimes APIs return malformed timestamps
      let cleanDateString = dateInput.trim();
      
      // If it looks like a MySQL datetime (YYYY-MM-DD HH:MM:SS), ensure it's ISO format
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleanDateString)) {
        cleanDateString = cleanDateString.replace(' ', 'T') + 'Z'; // Assume UTC
      }
      
      date = new Date(cleanDateString);
    } else {
      date = dateInput;
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date input:', dateInput);
      return 'Invalid Date';
    }
    
    // TEMPORARY FIX: Check for future years (likely timezone conversion bug)
    const currentYear = new Date().getFullYear();
    if (date.getFullYear() > currentYear) {
      console.warn(`🚨 Future year detected: ${date.getFullYear()}, correcting to ${currentYear}`, {
        original: dateInput,
        parsed: date.toISOString(),
        correcting_to: currentYear
      });
      
      // Create a corrected date by setting the year to current year
      date = new Date(date.getTime());
      date.setFullYear(currentYear);
    }

    // Base formatting options - ALWAYS use EST
    const baseOptions: Intl.DateTimeFormatOptions = {
      timeZone: SYSTEM_TIMEZONE // Force EST/EDT
    };

    if (timeOnly) {
      // Time only
      return date.toLocaleString('en-US', {
        ...baseOptions,
        hour: '2-digit',
        minute: '2-digit',
        second: format === 'long' ? '2-digit' : undefined,
        timeZoneName: includeTimezone ? 'short' : undefined
      });
    }

    if (dateOnly) {
      // Date only
      return date.toLocaleString('en-US', {
        ...baseOptions,
        month: format === 'short' ? 'numeric' : 'short',
        day: 'numeric',
        year: format === 'long' ? 'numeric' : '2-digit'
      });
    }

    // Full date and time - custom format: M/D/YYYY, h:mma
    const dateStr = date.toLocaleDateString('en-US', {
      ...baseOptions,
      month: 'numeric',
      day: 'numeric', 
      year: 'numeric'
    });
    
    const timeStr = date.toLocaleTimeString('en-US', {
      ...baseOptions,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase(); // Convert AM/PM to am/pm
    
    return `${dateStr}, ${timeStr}`;

  } catch (error) {
    console.error('Error formatting date:', dateInput, error);
    return 'Error formatting date';
  }
}

/**
 * Get the current timestamp in ISO format (UTC)
 * This should be used when creating timestamps for storage
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get the current timestamp in EST timezone
 * This should be used for display purposes only
 */
export function getCurrentLocalTimestamp(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: SYSTEM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Check if a timestamp is in the future compared to now
 * @param timestamp - ISO timestamp string or Date object
 * @returns true if the timestamp is in the future
 */
export function isFutureTimestamp(timestamp: string | Date): boolean {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    return date.getTime() > now.getTime();
  } catch (error) {
    console.error('Error checking if timestamp is future:', timestamp, error);
    return false;
  }
}

/**
 * Get the EST timezone information
 */
export function getTimezoneInfo(): {
  timeZone: string;
  offset: number;
  offsetString: string;
} {
  const timeZone = SYSTEM_TIMEZONE;
  const now = new Date();
  
  // Get the EST offset (this will be -5 for EST, -4 for EDT)
  const estDate = new Date(now.toLocaleString('en-US', { timeZone: SYSTEM_TIMEZONE }));
  const utcDate = new Date(now.toUTCString());
  const offset = (estDate.getTime() - utcDate.getTime()) / (1000 * 60); // in minutes
  
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetString = `UTC${offset >= 0 ? '+' : '-'}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

  return {
    timeZone,
    offset,
    offsetString
  };
}

/**
 * Debug function to log timezone information
 * Useful for troubleshooting timezone issues
 */
export function debugTimezone() {
  const info = getTimezoneInfo();
  console.log('🌍 Timezone Debug Info:', {
    ...info,
    currentTime: getCurrentLocalTimestamp(),
    currentUTC: getCurrentTimestamp(),
    sampleFormatting: {
      short: formatDateTime(new Date(), { format: 'short' }),
      medium: formatDateTime(new Date(), { format: 'medium' }),
      long: formatDateTime(new Date(), { format: 'long' }),
      timeOnly: formatDateTime(new Date(), { timeOnly: true }),
      dateOnly: formatDateTime(new Date(), { dateOnly: true })
    }
  });
}
