/**
 * Input Validation and Sanitization Utilities
 * Helps prevent XSS, injection attacks, and data integrity issues
 */

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates a phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  // Allow 10-15 digits (international formats)
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Validates a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a date string (ISO format)
 */
export function isValidDate(date: string): boolean {
  const parsed = Date.parse(date);
  return !isNaN(parsed);
}

/**
 * Sanitizes HTML to prevent XSS attacks
 * Basic implementation - in production, use DOMPurify library
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Sanitizes a string for safe display
 * Removes/escapes potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 1000); // Limit length
}

/**
 * Validates and sanitizes user input for names
 */
export function validateName(name: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = name.trim();

  if (sanitized.length === 0) {
    return { valid: false, sanitized, error: 'Name cannot be empty' };
  }

  if (sanitized.length < 2) {
    return { valid: false, sanitized, error: 'Name must be at least 2 characters' };
  }

  if (sanitized.length > 100) {
    return { valid: false, sanitized, error: 'Name is too long (max 100 characters)' };
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) {
    return { valid: false, sanitized, error: 'Name contains invalid characters' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes email input
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = email.trim().toLowerCase();

  if (!isValidEmail(sanitized)) {
    return { valid: false, sanitized, error: 'Invalid email format' };
  }

  if (sanitized.length > 254) {
    return { valid: false, sanitized, error: 'Email is too long' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes phone number
 */
export function validatePhone(phone: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = phone.trim();

  if (!isValidPhone(sanitized)) {
    return { valid: false, sanitized, error: 'Invalid phone number format' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates CSV file
 */
export function validateCsvFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
    return { valid: false, error: 'File must be a CSV file' };
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  return { valid: true };
}

/**
 * Validates a text note/comment
 */
export function validateNote(note: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeString(note);

  if (sanitized.length === 0) {
    return { valid: false, sanitized, error: 'Note cannot be empty' };
  }

  if (sanitized.length > 5000) {
    return { valid: false, sanitized, error: 'Note is too long (max 5000 characters)' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates a password (if implementing real auth in the future)
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Rate limiting helper (client-side)
 * Prevents rapid form submissions
 */
export class RateLimiter {
  private lastActionTime: number = 0;
  private minInterval: number;

  constructor(minIntervalMs: number = 1000) {
    this.minInterval = minIntervalMs;
  }

  canProceed(): boolean {
    const now = Date.now();
    if (now - this.lastActionTime < this.minInterval) {
      return false;
    }
    this.lastActionTime = now;
    return true;
  }

  getRemainingTime(): number {
    const elapsed = Date.now() - this.lastActionTime;
    return Math.max(0, this.minInterval - elapsed);
  }
}
