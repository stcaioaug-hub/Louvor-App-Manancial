import { useEffect, useRef, useState } from 'react';

type PullToRefreshStatus = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'done';

interface UsePullToRefreshOptions {
  enabled: boolean;
  canRefresh: boolean;
  onRefresh: () => Promise<void> | void;
  onBlockedRefresh: () => void;
}

interface PullToRefreshState {
  distance: number;
  status: PullToRefreshStatus;
}

const PULL_THRESHOLD = 84;
const MAX_PULL_DISTANCE = 118;
const DONE_RESET_DELAY = 700;
const REFRESH_TIMEOUT = 12000;

function isMobileViewport() {
  return window.matchMedia('(max-width: 767px)').matches;
}

export function usePullToRefresh({
  enabled,
  canRefresh,
  onRefresh,
  onBlockedRefresh,
}: UsePullToRefreshOptions): PullToRefreshState {
  const [state, setState] = useState<PullToRefreshState>({
    distance: 0,
    status: 'idle',
  });

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const distanceRef = useRef(0);
  const isTrackingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const canRefreshRef = useRef(canRefresh);
  const onRefreshRef = useRef(onRefresh);
  const onBlockedRefreshRef = useRef(onBlockedRefresh);

  useEffect(() => {
    canRefreshRef.current = canRefresh;
  }, [canRefresh]);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    onBlockedRefreshRef.current = onBlockedRefresh;
  }, [onBlockedRefresh]);

  useEffect(() => {
    if (!enabled || !isMobileViewport()) {
      distanceRef.current = 0;
      isTrackingRef.current = false;
      isRefreshingRef.current = false;
      setState({ distance: 0, status: 'idle' });
      return;
    }

    let resetTimer: number | undefined;
    let isActive = true;

    const setPullState = (nextState: PullToRefreshState) => {
      if (isActive) {
        setState(nextState);
      }
    };

    const clearResetTimer = () => {
      if (resetTimer) {
        window.clearTimeout(resetTimer);
        resetTimer = undefined;
      }
    };

    const resetToIdle = () => {
      clearResetTimer();
      resetTimer = window.setTimeout(() => {
        distanceRef.current = 0;
        setPullState({ distance: 0, status: 'idle' });
      }, DONE_RESET_DELAY);
    };

    const runRefresh = () => {
      let refreshTimer: number | undefined;

      return Promise.race([
        Promise.resolve().then(() => onRefreshRef.current()),
        new Promise<void>((_, reject) => {
          refreshTimer = window.setTimeout(() => {
            reject(new Error('Tempo de atualização excedido.'));
          }, REFRESH_TIMEOUT);
        }),
      ]).finally(() => {
        if (refreshTimer) {
          window.clearTimeout(refreshTimer);
        }
      });
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (isRefreshingRef.current || window.scrollY > 0 || event.touches.length !== 1) {
        isTrackingRef.current = false;
        return;
      }

      clearResetTimer();
      const touch = event.touches[0];
      startYRef.current = touch.clientY;
      startXRef.current = touch.clientX;
      distanceRef.current = 0;
      isTrackingRef.current = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isTrackingRef.current || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      const deltaY = touch.clientY - startYRef.current;
      const deltaX = Math.abs(touch.clientX - startXRef.current);

      if (deltaY <= 0 || deltaX > deltaY) {
        return;
      }

      if (window.scrollY > 0) {
        isTrackingRef.current = false;
        distanceRef.current = 0;
        setPullState({ distance: 0, status: 'idle' });
        return;
      }

      event.preventDefault();

      const easedDistance = Math.min(Math.round(deltaY * 0.55), MAX_PULL_DISTANCE);
      distanceRef.current = easedDistance;
      setPullState({
        distance: easedDistance,
        status: easedDistance >= PULL_THRESHOLD ? 'ready' : 'pulling',
      });
    };

    const handleTouchEnd = () => {
      if (!isTrackingRef.current) {
        return;
      }

      isTrackingRef.current = false;

      if (distanceRef.current < PULL_THRESHOLD) {
        distanceRef.current = 0;
        setPullState({ distance: 0, status: 'idle' });
        return;
      }

      if (!canRefreshRef.current) {
        distanceRef.current = 0;
        onBlockedRefreshRef.current();
        setPullState({ distance: 0, status: 'idle' });
        return;
      }

      distanceRef.current = PULL_THRESHOLD;
      isRefreshingRef.current = true;
      setPullState({ distance: PULL_THRESHOLD, status: 'refreshing' });

      void runRefresh()
        .then(() => {
          setPullState({ distance: PULL_THRESHOLD, status: 'done' });
          resetToIdle();
        })
        .catch(() => {
          distanceRef.current = 0;
          setPullState({ distance: 0, status: 'idle' });
        })
        .finally(() => {
          isRefreshingRef.current = false;
        });
    };

    const handleTouchCancel = () => {
      isTrackingRef.current = false;
      if (!isRefreshingRef.current) {
        distanceRef.current = 0;
        setPullState({ distance: 0, status: 'idle' });
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      isActive = false;
      clearResetTimer();
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled]);

  return state;
}
