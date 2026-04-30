import { useEffect } from 'react';

let activeLocks = 0;
let previousBodyOverflow = '';
let previousHtmlOverflow = '';

export function useModalViewportLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;

    if (activeLocks === 0) {
      previousBodyOverflow = document.body.style.overflow;
      previousHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.classList.add('mobile-nav-hidden');
    }

    activeLocks += 1;

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);

      if (activeLocks === 0) {
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousHtmlOverflow;
        document.documentElement.classList.remove('mobile-nav-hidden');
      }
    };
  }, [active]);
}
