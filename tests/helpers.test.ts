/**
 * Tests for utility functions
 */

import {
  isValidPhoneNumber,
  formatPhoneNumber,
  isLink,
  getExtensionFromMimeType,
} from '../src/utils/helpers';

describe('isValidPhoneNumber', () => {
  it('should validate correct phone numbers', () => {
    expect(isValidPhoneNumber('1234567890')).toBe(true);
    expect(isValidPhoneNumber('+1 234 567 8900')).toBe(true);
    expect(isValidPhoneNumber('234-567-8900')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidPhoneNumber('123')).toBe(false);
    expect(isValidPhoneNumber('abc')).toBe(false);
    expect(isValidPhoneNumber('')).toBe(false);
  });
});

describe('formatPhoneNumber', () => {
  it('should remove non-digit characters', () => {
    expect(formatPhoneNumber('+1 234 567-8900')).toBe('12345678900');
    expect(formatPhoneNumber('(234) 567-8900')).toBe('2345678900');
  });
});

describe('isLink', () => {
  it('should identify links correctly', () => {
    expect(isLink('http://example.com')).toBe(true);
    expect(isLink('https://example.com')).toBe(true);
    expect(isLink('www.example.com')).toBe(true);
    expect(isLink('/local/path')).toBe(false);
    expect(isLink('example.com')).toBe(false);
  });
});

describe('getExtensionFromMimeType', () => {
  it('should return correct extension for known MIME types', () => {
    expect(getExtensionFromMimeType('image/jpeg')).toBe('.jpg');
    expect(getExtensionFromMimeType('image/png')).toBe('.png');
    expect(getExtensionFromMimeType('application/pdf')).toBe('.pdf');
    expect(getExtensionFromMimeType('audio/mpeg')).toBe('.mp3');
  });

  it('should return default extension for unknown MIME types', () => {
    expect(getExtensionFromMimeType('unknown/type')).toBe('.bin');
  });
});
