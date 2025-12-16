// Wordnik API integration with caching and local dictionary fallback

import { isValidWordLocal } from './dictionary';

// In-memory cache for word validation results
const wordCache = new Map<string, boolean>();

// Get API key from environment variable
const WORDNIK_API_KEY = process.env.NEXT_PUBLIC_WORDNIK_API_KEY || '';

/**
 * Validates if a word exists using local dictionary first, then Wordnik API as fallback
 * @param word - The word to validate
 * @param useWordnik - Whether to use Wordnik API for validation (default: false)
 * @returns Promise<boolean> - true if word exists, false otherwise
 */
export async function isValidWord(word: string, useWordnik: boolean = false): Promise<boolean> {
  // Normalize the word (lowercase)
  const normalizedWord = word.toLowerCase();

  // Check cache first
  if (wordCache.has(normalizedWord)) {
    return wordCache.get(normalizedWord)!;
  }

  // First, check local dictionary (fast)
  const isLocalValid = await isValidWordLocal(normalizedWord);

  if (isLocalValid) {
    // Word found in local dictionary, cache and return
    wordCache.set(normalizedWord, true);
    return true;
  }

  // If not using Wordnik, return false
  if (!useWordnik) {
    wordCache.set(normalizedWord, false);
    return false;
  }

  // If no API key, return the local dictionary result
  if (!WORDNIK_API_KEY) {
    console.warn('Wordnik API key not configured. Using local dictionary only.');
    wordCache.set(normalizedWord, false);
    return false;
  }

  try {
    // Call Wordnik API to check if word exists (for words not in local dictionary)
    const response = await fetch(
      `https://api.wordnik.com/v4/word.json/${normalizedWord}/definitions?limit=1&api_key=${WORDNIK_API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    // If we get definitions, the word exists
    const isValid = response.ok && response.status === 200;

    if (isValid) {
      const data = await response.json();
      // Check if we actually got definitions back
      const hasDefinitions = Array.isArray(data) && data.length > 0;
      wordCache.set(normalizedWord, hasDefinitions);
      return hasDefinitions;
    } else {
      // Word not found
      wordCache.set(normalizedWord, false);
      return false;
    }
  } catch (error) {
    console.error(`Error validating word "${word}":`, error);
    // On error, don't cache and return false
    return false;
  }
}

/**
 * Validates multiple words in batch using local dictionary
 * @param words - Array of words to validate
 * @param useWordnik - Whether to use Wordnik API for words not in local dictionary
 * @returns Promise<Map<string, boolean>> - Map of word to validity
 */
export async function validateWords(words: string[], useWordnik: boolean = false): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  // Use local dictionary for all words first (fast and parallel)
  const validationPromises = words.map(async (word) => {
    const isValid = await isValidWord(word, useWordnik);
    return { word, isValid };
  });

  const allResults = await Promise.all(validationPromises);

  allResults.forEach(({ word, isValid }) => {
    results.set(word.toLowerCase(), isValid);
  });

  return results;
}

/**
 * Clears the word validation cache
 */
export function clearCache(): void {
  wordCache.clear();
}

/**
 * Gets the current cache size
 */
export function getCacheSize(): number {
  return wordCache.size;
}
