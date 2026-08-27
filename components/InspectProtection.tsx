'use client';

import { useEffect } from 'react';

export const InspectProtection = () => {
  useEffect(() => {
    // 1. Disable Right Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Disable DevTools Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I (Inspect) or Cmd+Option+I
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+J (Console) or Cmd+Option+J
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+C (Inspect element) or Cmd+Option+C
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (View Source) or Cmd+Option+U
      if (isCmdOrCtrl && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S (Save Page)
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. Clear console periodically and display warning
    const clearTimer = setInterval(() => {
      if (process.env.NODE_ENV === 'production') {
        // Optional console protection in production
      }
    }, 2000);

    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      clearInterval(clearTimer);
    };
  }, []);

  return null;
};
