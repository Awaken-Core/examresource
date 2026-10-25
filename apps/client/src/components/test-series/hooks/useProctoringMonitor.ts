import { useEffect, useRef } from 'react';

/**
 * Reminds the candidate to stay with the paper. Leaving the window does not submit it.
 */
export function useProctoringMonitor(active: boolean, onWarning: (reason: string) => void) {
  const onWarningRef = useRef(onWarning);
  onWarningRef.current = onWarning;

  useEffect(() => {
    if (!active) return;

    let blurArmed = false;
    let quietUntil = 0;
    const armTimer = setTimeout(() => {
      blurArmed = true;
    }, 400);

    const fullscreenQuiet = () =>
      Date.now() <
      ((window as Window & { __cbtFullscreenUntil?: number }).__cbtFullscreenUntil ?? 0);

    const warn = (reason: string, fromKey = false) => {
      if (Date.now() < quietUntil || fullscreenQuiet()) return;
      if (!fromKey && !blurArmed) return;
      quietUntil = Date.now() + 1500;
      onWarningRef.current(reason);
    };

    const onFullscreen = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
        msFullscreenElement?: Element | null;
      };
      if (
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      ) {
        (window as Window & { __cbtFullscreenUntil?: number }).__cbtFullscreenUntil = Date.now() + 1500;
        return;
      }
      warn('The examination left full screen.', true);
    };

    let blurTimer: ReturnType<typeof setTimeout> | null = null;

    const onVisibility = () => {
      if (document.hidden) warn('The examination window was hidden or switched.');
    };

    const onBlur = () => {
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!document.hasFocus() || document.hidden) {
          warn('The examination window lost focus.');
        }
      }, 200);
    };

    const onFocus = () => {
      if (blurTimer) clearTimeout(blurTimer);
    };

    const blockMenu = (event: Event) => {
      event.preventDefault();
    };

    const blockClipboard = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-allow-copy]')) return;
      event.preventDefault();
    };

    const onKey = (event: KeyboardEvent) => {
      const key = event.key;
      const lower = key.toLowerCase();
      if (key === 'F11' || lower === 'f11' || event.code === 'F11') {
        (window as Window & { __cbtFullscreenUntil?: number }).__cbtFullscreenUntil = Date.now() + 1500;
        return;
      }
      if (fullscreenQuiet()) return;
      if (key === 'Escape') return;
      const shortcut =
        key === 'Tab' ||
        key === 'Meta' ||
        key === 'OS' ||
        event.metaKey ||
        event.altKey ||
        key === 'PrintScreen' ||
        lower === 'f12' ||
        ((event.ctrlKey || event.metaKey) &&
          (lower === 't' || lower === 'n' || lower === 'w' || lower === 'r' || key === 'Tab'));
      if (!shortcut) return;
      event.preventDefault();
      warn('A restricted key was used.', true);
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('webkitfullscreenchange', onFullscreen);
    document.addEventListener('mozfullscreenchange', onFullscreen);
    document.addEventListener('MSFullscreenChange', onFullscreen);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('contextmenu', blockMenu);
    document.addEventListener('copy', blockClipboard);
    document.addEventListener('cut', blockClipboard);
    document.addEventListener('paste', blockClipboard);
    document.addEventListener('dragstart', blockMenu);
    document.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(armTimer);
      if (blurTimer) clearTimeout(blurTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('webkitfullscreenchange', onFullscreen);
      document.removeEventListener('mozfullscreenchange', onFullscreen);
      document.removeEventListener('MSFullscreenChange', onFullscreen);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('contextmenu', blockMenu);
      document.removeEventListener('copy', blockClipboard);
      document.removeEventListener('cut', blockClipboard);
      document.removeEventListener('paste', blockClipboard);
      document.removeEventListener('dragstart', blockMenu);
      document.removeEventListener('keydown', onKey);
    };
  }, [active]);
}
