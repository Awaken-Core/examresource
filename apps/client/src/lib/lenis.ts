import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export interface InitLenisOptions {
  headerOffset?: number;
}

/**
 * Initializes the Lenis smooth scroll instance.
 * Automatically handles RAF, anchor links, and motion preferences.
 */
export function initLenis(options: InitLenisOptions = {}): Lenis | null {
  if (typeof window === 'undefined') return null;

  // Respect user preference for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return null;
  }

  // If already active, return the existing instance
  if (lenisInstance) {
    return lenisInstance;
  }

  const { headerOffset = -70 } = options;

  lenisInstance = new Lenis({
    autoRaf: true,
    smoothWheel: true,
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    anchors: { offset: headerOffset },
    stopInertiaOnNavigate: true,
    respectReducedMotion: true,
    prevent: (node) => {
      if (!node || (node as any).nodeType !== 1) return false;
      let current: HTMLElement | null = node as HTMLElement;
      while (current && current !== document.body && current !== document.documentElement) {
        if (current.hasAttribute('data-lenis-prevent')) return true;
        const style = window.getComputedStyle(current);
        const canScrollY =
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          current.scrollHeight > current.clientHeight;
        const canScrollX =
          (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
          current.scrollWidth > current.clientWidth;
        if (canScrollY || canScrollX) {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    },
  });

  (window as any).lenis = lenisInstance;

  // Handle in-page hash on initial page entry if present
  if (window.location.hash) {
    const hashTarget = document.querySelector(window.location.hash);
    if (hashTarget) {
      setTimeout(() => {
        lenisInstance?.scrollTo(hashTarget as HTMLElement, { offset: headerOffset });
      }, 150);
    }
  }

  return lenisInstance;
}

/**
 * Destroys the Lenis smooth scroll instance to prevent leaks and scroll drift on view transitions.
 */
export function destroyLenis(): void {
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
    (window as any).lenis = null;
  }
}

/**
 * Returns the active Lenis instance or null if uninitialized.
 */
export function getLenis(): Lenis | null {
  return lenisInstance;
}

/**
 * Pause Lenis scrolling (e.g. when an overlay/modal is open)
 */
export function stopLenis(): void {
  lenisInstance?.stop();
}

/**
 * Resume Lenis scrolling
 */
export function startLenis(): void {
  lenisInstance?.start();
}
