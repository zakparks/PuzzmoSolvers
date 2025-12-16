'use client';

import { useEffect } from 'react';
import { preloadDictionary } from '@/lib/dictionary';

/**
 * Client component that preloads the dictionary on mount
 * This ensures the dictionary is loaded and ready for the solvers
 */
export default function DictionaryPreloader() {
  useEffect(() => {
    // Preload dictionary when the app loads
    preloadDictionary().catch(error => {
      console.error('Failed to preload dictionary:', error);
    });
  }, []);

  return null; // This component renders nothing
}
