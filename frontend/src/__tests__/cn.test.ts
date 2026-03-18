import { cn } from '../utils/cn';

describe('cn() — class name utility', () => {
  test('merges simple class strings', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  test('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-4', 'px-8')).toBe('px-8');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  test('handles conditional classes via clsx', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
    expect(cn('base', true && 'visible')).toBe('base visible');
  });

  test('handles undefined and null gracefully', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  test('handles empty arguments', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
  });

  test('handles object syntax from clsx', () => {
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500');
  });

  test('handles array syntax from clsx', () => {
    expect(cn(['px-4', 'py-2'])).toBe('px-4 py-2');
  });

  test('resolves complex Tailwind conflicts', () => {
    const result = cn(
      'rounded-md bg-primary text-white',
      'bg-secondary rounded-lg'
    );
    expect(result).toContain('bg-secondary');
    expect(result).not.toContain('bg-primary');
    expect(result).toContain('rounded-lg');
    expect(result).not.toContain('rounded-md');
    expect(result).toContain('text-white');
  });
});
