import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage, useSessionStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {});
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('returns stored value from localStorage', () => {
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue('"stored-value"');
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('returns initial value for invalid JSON', () => {
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue('invalid-json');
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('updates value and localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('test-key', '"new-value"');
  });

  it('handles function updater', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));
    
    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('test-key', '1');
  });

  it('handles objects', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', { count: 0 }));
    
    act(() => {
      result.current[1]({ count: 5 });
    });

    expect(result.current[0]).toEqual({ count: 5 });
    expect(window.localStorage.setItem).toHaveBeenCalledWith('test-key', '{"count":5}');
  });

  it('handles localStorage errors gracefully', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    expect(() => {
      act(() => {
        result.current[1]('new-value');
      });
    }).not.toThrow();
  });

  it('returns initial value on server', () => {
    vi.stubGlobal('window', undefined);
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
    vi.unstubAllGlobals();
  });
});

describe('useSessionStorage', () => {
  beforeEach(() => {
    vi.spyOn(window.sessionStorage, 'getItem').mockReturnValue(null);
    vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial value when sessionStorage is empty', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('returns stored value from sessionStorage', () => {
    vi.spyOn(window.sessionStorage, 'getItem').mockReturnValue('"stored-value"');
    const { result } = renderHook(() => useSessionStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('updates value and sessionStorage', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'default'));
    
    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith('test-key', '"new-value"');
  });
});