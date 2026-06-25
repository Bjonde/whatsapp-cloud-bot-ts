/**
 * Tests for the deprecated UserContext shell.
 *
 * The in-memory global store has been removed; these tests document the
 * remaining backwards-compatible behavior (a non-persistent, instance-local
 * bag) and verify the global helpers are inert no-ops.
 */

import {
  UserContext,
  clearAllContexts,
  getAllContextUsers,
} from '../src/UserContext';

describe('UserContext (deprecated shell)', () => {
  it('stores and retrieves values on the instance', () => {
    const context = new UserContext('1234567890');
    context.set('name', 'John');
    expect(context.get('name')).toBe('John');
  });

  it('returns the default value for missing keys', () => {
    const context = new UserContext('1234567890');
    expect(context.get('missing', 'fallback')).toBe('fallback');
    expect(context.get('missing')).toBeUndefined();
  });

  it('supports has / delete / keys / size / clear', () => {
    const context = new UserContext('1234567890');
    context.set('a', 1);
    context.set('b', 2);

    expect(context.has('a')).toBe(true);
    expect(context.size()).toBe(2);

    context.delete('a');
    expect(context.has('a')).toBe(false);
    expect(context.keys()).toEqual(['b']);

    context.clear();
    expect(context.size()).toBe(0);
  });

  it('does NOT share state across instances (global store removed)', () => {
    const first = new UserContext('1234567890');
    first.set('name', 'John');

    const second = new UserContext('1234567890'); // same number
    expect(second.get('name')).toBeUndefined();
  });

  it('exposes inert global helpers for backwards compatibility', () => {
    new UserContext('1234567890');
    expect(getAllContextUsers()).toEqual([]);
    expect(() => clearAllContexts()).not.toThrow();
  });
});
