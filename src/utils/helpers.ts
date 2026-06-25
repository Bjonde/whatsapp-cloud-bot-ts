/**
 * Utility functions for error handling and data validation
 */

/**
 * Determine whether a webhook event is older than a given age.
 *
 * Webhook `messages[].timestamp` and `statuses[].timestamp` are Unix timestamps
 * in **seconds**, expressed as strings (the WEBHOOK_TRIGGER_TIMESTAMP). This
 * compares that moment against now.
 *
 * @param timestampSeconds - Unix timestamp in seconds (string or number)
 * @param minutes - Maximum allowed age, in minutes
 * @returns true if the event is older than `minutes`. Returns false when the
 *          timestamp is missing or unparseable, so events are never dropped on
 *          a bad/absent timestamp.
 */
export function isOlderThanMinutes(
  timestampSeconds: string | number | undefined,
  minutes: number
): boolean {
  const ts = Number(timestampSeconds);
  if (!Number.isFinite(ts) || ts <= 0) {
    return false;
  }
  const ageMs = Date.now() - ts * 1000;
  return ageMs > minutes * 60 * 1000;
}

/**
 * Validate phone number format
 * @param phoneNumber - Phone number to validate
 * @returns true if valid
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  // Should be at least 10 digits
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Format phone number to WhatsApp format (remove + and spaces)
 * @param phoneNumber - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

/**
 * Check if string starts with http:// or https:// or www.
 * @param str - String to check
 * @returns true if string is a link
 */
export function isLink(str: string): boolean {
  return /^((http[s]?:\/\/)|(www\.))/.test(str);
}

/**
 * File extension to MIME type mapping for WhatsApp supported media types
 */
const KNOWN_MIME_TYPES: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  // Video
  '.mp4': 'video/mp4',
  '.3gp': 'video/3gpp',
  // Audio
  '.aac': 'audio/aac',
  '.mp3': 'audio/mpeg',
  '.mpeg': 'audio/mpeg',
  '.amr': 'audio/amr',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
};

/**
 * Get file extension from MIME type
 * @param mimeType - MIME type
 * @returns File extension or '.bin' as fallback
 */
export function getExtensionFromMimeType(mimeType: string): string {
  // Preferred extensions for common MIME types
  const preferredExtensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'audio/mpeg': '.mp3',
    'audio/ogg': '.ogg',
  };

  // Check preferred extensions first
  if (preferredExtensions[mimeType]) {
    return preferredExtensions[mimeType];
  }

  // Fallback to searching the mapping
  const entry = Object.entries(KNOWN_MIME_TYPES).find(
    ([, mime]) => mime === mimeType
  );
  return entry ? entry[0] : '.bin';
}
