import { useEffect } from 'react';

type ShortcutMap = {
  [key: string]: () => void;
};

export const useKeyboardShortcuts = (shortcuts: ShortcutMap) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();
      const shortcut = shortcuts[key];

      if (shortcut && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        shortcut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};