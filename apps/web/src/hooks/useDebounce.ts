import { useEffect, useRef } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const ref    = useRef<T>(value);

  useEffect(() => {
    timer.current = setTimeout(() => {
      ref.current = value;
    }, delay);
    return () => clearTimeout(timer.current);
  }, [value, delay]);

  return ref.current;
}

// Debounced callback version
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay = 300
): T {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  return ((...args: Parameters<T>) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }) as T;
}
