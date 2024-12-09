import { useCallback, useRef } from 'react';
import debounce from 'lodash.debounce';

interface AutosaveOptions {
  onSave: (data: any) => Promise<void>;
  debounceMs?: number;
}

export const useAutosave = ({ onSave, debounceMs = 1000 }: AutosaveOptions) => {
  const debouncedSave = useRef(
    debounce(async (data: any) => {
      try {
        await onSave(data);
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }, debounceMs)
  ).current;

  const save = useCallback(
    (data: any) => {
      debouncedSave(data);
    },
    [debouncedSave]
  );

  return { save };
};