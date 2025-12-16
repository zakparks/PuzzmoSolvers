// Local dictionary for fast word validation
// Uses a large English word list loaded from a static file

let wordSet: Set<string> | null = null;
let loadingPromise: Promise<Set<string>> | null = null;

/**
 * Loads the dictionary from the static file
 * @returns Promise<Set<string>> - Set of all valid words
 */
async function loadDictionary(): Promise<Set<string>> {
  if (wordSet) {
    return wordSet;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const response = await fetch('/words.txt');
      if (!response.ok) {
        throw new Error('Failed to load dictionary');
      }

      const text = await response.text();
      const words = text
        .split('\n')
        .map(word => word.trim().toLowerCase())
        .filter(word => word.length > 0);

      wordSet = new Set(words);
      console.log(`Dictionary loaded: ${wordSet.size} words`);
      return wordSet;
    } catch (error) {
      console.error('Error loading dictionary:', error);
      // Return empty set on error
      wordSet = new Set();
      return wordSet;
    }
  })();

  return loadingPromise;
}

/**
 * Checks if a word exists in the local dictionary
 * @param word - The word to check
 * @returns Promise<boolean> - true if word exists locally
 */
export async function isValidWordLocal(word: string): Promise<boolean> {
  const dictionary = await loadDictionary();
  return dictionary.has(word.toLowerCase());
}

/**
 * Validates multiple words against the local dictionary
 * @param words - Array of words to validate
 * @returns Promise<Set<string>> - Set of valid words (lowercase)
 */
export async function filterValidWords(words: string[]): Promise<Set<string>> {
  const dictionary = await loadDictionary();
  const validWords = new Set<string>();

  for (const word of words) {
    const normalized = word.toLowerCase();
    if (dictionary.has(normalized)) {
      validWords.add(normalized);
    }
  }

  return validWords;
}

/**
 * Preloads the dictionary (call this on app initialization)
 */
export async function preloadDictionary(): Promise<void> {
  await loadDictionary();
}

/**
 * Gets the dictionary size (for debugging)
 */
export async function getDictionarySize(): Promise<number> {
  const dictionary = await loadDictionary();
  return dictionary.size;
}
