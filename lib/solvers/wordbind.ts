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
 * @param word - The word to check
 * @param source - The source text
 * @param allowDouble - Whether to allow using a letter twice as a double letter
 */
function canFormWord(word: string, source: string, allowDouble: boolean = true): boolean {
  const wordUpper = word.toUpperCase();
  let sourceIndex = 0;

  for (let i = 0; i < wordUpper.length; i++) {
    const char = wordUpper[i];

    // Check for double letter
    if (i > 0 && char === wordUpper[i - 1] && allowDouble) {
      // This is a double letter, we can use the same source position
      // Find the position where we got the previous letter
      const prevSourceIndex = sourceIndex;

      // Try to find this letter again after the previous position
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
    } else {
      // Regular letter, find it in source
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
 */
function generateCandidatesWithDoubles(source: string, minLength: number = 3): Set<string> {
  const candidates = new Set<string>();
  const normalized = normalizeSource(source);

  // Generate basic subsequences
  const subsequences = generateSubsequences(normalized, minLength, Math.min(20, normalized.length));

  for (const subseq of subsequences) {
    candidates.add(subseq);

    // Try adding double letters
    for (let i = 0; i < subseq.length - 1; i++) {
      // Insert a double of the current letter
      const withDouble = subseq.slice(0, i + 1) + subseq[i] + subseq.slice(i + 1);
      if (withDouble.length <= 20) {
        candidates.add(withDouble);
      }
    }
  }

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

  // Generate all candidate words
  const candidates = generateCandidatesWithDoubles(normalized, 3);

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
