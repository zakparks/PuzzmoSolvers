import { isValidWord } from '../wordnik';

export interface WordbindSolution {
  words: string[];
  totalWords: number;
}

/**
 * Normalizes the source text by removing spaces and converting to uppercase
 */
function normalizeSource(text: string): string {
  return text.replace(/\s+/g, '').toUpperCase();
}

/**
 * Checks if a word can be formed from the source text following the ordered-letter rule
 * Rules:
 * 1. Letters must appear in left-to-right order from source
 * 2. Any letter from the source can be doubled (used twice in a row) once
 * @param word - The word to check
 * @param source - The source text
 * @param allowDouble - Whether to allow using a letter twice as a double letter
 */
function canFormWord(word: string, source: string, allowDouble: boolean = true): boolean {
  const wordUpper = word.toUpperCase();
  let sourceIndex = 0;

  for (let i = 0; i < wordUpper.length; i++) {
    const char = wordUpper[i];

    // Check if this is a double letter (same as previous character)
    if (i > 0 && char === wordUpper[i - 1] && allowDouble) {
      // This is a doubled letter - we don't need to find it again in source
      // The previous iteration already found it, and we're allowed to use it twice
      continue;
    }

    // Find this letter in the source starting from current position
    let found = false;
    for (let j = sourceIndex; j < source.length; j++) {
      if (source[j] === char) {
        sourceIndex = j + 1;
        found = true;
        break;
      }
    }

    if (!found) {
      return false;
    }
  }

  return true;
}

/**
 * Generates all possible subsequences from the source text
 * @param source - The source text
 * @param minLength - Minimum word length
 * @param maxLength - Maximum word length
 */
function generateSubsequences(source: string, minLength: number = 3, maxLength: number = 15): Set<string> {
  const subsequences = new Set<string>();

  function backtrack(index: number, current: string) {
    if (current.length >= minLength && current.length <= maxLength) {
      subsequences.add(current);
    }

    if (current.length >= maxLength || index >= source.length) {
      return;
    }

    // Include current character
    backtrack(index + 1, current + source[index]);

    // Skip current character
    backtrack(index + 1, current);
  }

  backtrack(0, '');

  return subsequences;
}

/**
 * Generates candidates including double-letter variants
 * Uses a recursive approach to build all possible words with optional letter doubling
 */
function generateCandidatesWithDoubles(source: string, minLength: number = 3): Set<string> {
  const candidates = new Set<string>();
  const normalized = normalizeSource(source);
  const maxLength = Math.min(20, normalized.length + 5); // Allow for doubled letters

  function buildWords(index: number, current: string, lastChar: string) {
    // Add current word if it meets length requirements
    if (current.length >= minLength && current.length <= maxLength) {
      candidates.add(current);
    }

    // Stop if we've reached max length or end of source
    if (current.length >= maxLength || index >= normalized.length) {
      return;
    }

    // Option 1: Skip current character
    buildWords(index + 1, current, lastChar);

    // Option 2: Take current character
    const char = normalized[index];
    buildWords(index + 1, current + char, char);

    // Option 3: If we just added a character, we can double it (use same letter again)
    if (lastChar && current.length > 0 && current.length < maxLength) {
      buildWords(index, current + lastChar, ''); // Use lastChar again, but don't allow triple
    }
  }

  buildWords(0, '', '');

  return candidates;
}

/**
 * Solves a Wordbind puzzle
 * @param sourceText - The source words (2-3 words)
 * @returns Solution with all valid words found
 */
export async function solveWordbind(sourceText: string): Promise<WordbindSolution> {
  const normalized = normalizeSource(sourceText);

  // Split into source words to exclude them
  const sourceWords = sourceText
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Generate all candidate words (minimum 5 letters)
  const candidates = generateCandidatesWithDoubles(normalized, 5);

  // Filter out exact source words
  const filteredCandidates = Array.from(candidates).filter(
    word => !sourceWords.includes(word)
  );

  console.log(`Generated ${filteredCandidates.length} candidates`);

  // Validate words with Wordnik in batches
  const validWords: string[] = [];
  const BATCH_SIZE = 50;

  for (let i = 0; i < filteredCandidates.length; i += BATCH_SIZE) {
    const batch = filteredCandidates.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (word) => {
        // Double-check that the word can be formed
        if (!canFormWord(word, normalized, true)) {
          return { word, isValid: false };
        }

        const isValid = await isValidWord(word);
        return { word, isValid };
      })
    );

    results.forEach(({ word, isValid }) => {
      if (isValid) {
        validWords.push(word);
      }
    });
  }

  // Sort by length (descending) then alphabetically
  validWords.sort((a, b) => {
    if (a.length !== b.length) {
      return b.length - a.length;
    }
    return a.localeCompare(b);
  });

  return {
    words: validWords,
    totalWords: validWords.length,
  };
}
