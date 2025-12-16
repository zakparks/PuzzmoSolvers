// Wordnik API integration with caching

// In-memory cache for word validation results
const wordCache = new Map<string, boolean>();

// Get API key from environment variable
const WORDNIK_API_KEY = process.env.NEXT_PUBLIC_WORDNIK_API_KEY || '';

/**
 * Validates if a word exists in the Wordnik dictionary
 * @param word - The word to validate
 * @returns Promise<boolean> - true if word exists, false otherwise
 */
export async function isValidWord(word: string): Promise<boolean> {
  // Normalize the word (lowercase)
  const normalizedWord = word.toLowerCase();

  // Check cache first
  if (wordCache.has(normalizedWord)) {
    return wordCache.get(normalizedWord)!;
  }

  // If no API key, warn and return false
  if (!WORDNIK_API_KEY) {
    console.warn('Wordnik API key not configured. Set NEXT_PUBLIC_WORDNIK_API_KEY environment variable.');
    // For development, we can use a basic word list or mock validation
    // For now, return true to allow testing without API key
    return true;
  }

  try {
    // Call Wordnik API to check if word exists
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
 * Validates multiple words in batch
 * @param words - Array of words to validate
 * @returns Promise<Map<string, boolean>> - Map of word to validity
 */
export async function validateWords(words: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  // Process words in parallel but with rate limiting
  const BATCH_SIZE = 10;
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (word) => {
        const isValid = await isValidWord(word);
        return { word, isValid };
      })
    );

    batchResults.forEach(({ word, isValid }) => {
      results.set(word.toLowerCase(), isValid);
    });

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < words.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

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
