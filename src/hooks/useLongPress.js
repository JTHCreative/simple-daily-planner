import { useRef, useCallback } from 'react';

export function useLongPress(onLongPress, onTap, delay = 500) {
  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const start = useCallback((e) => {
    e.preventDefault();
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress?.();
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback((e) => {
    e.preventDefault();
    clearTimeout(timerRef.current);
    if (!isLongPressRef.current) {
      onTap?.();
    }
  }, [onTap]);

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: cancel,
  };
}
