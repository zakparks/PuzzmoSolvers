import { isValidWord } from '../wordnik';

export interface TypeshiftColumn {
  letters: string[];
}

export interface TypeshiftSolution {
  allWords: string[];
  coreWords: string[];
  usedLettersCount: number;
  totalLetters: number;
}

/**
 * Generates all possible words from Typeshift columns
 * @param columns - Array of columns, each containing letters
 * @returns Array of all valid words
 */
export async function findAllWords(columns: TypeshiftColumn[]): Promise<string[]> {
  if (columns.length === 0) return [];

  const candidateWords: string[] = [];

  // Generate all possible combinations
  function generateCombinations(columnIndex: number, currentWord: string) {
    if (columnIndex === columns.length) {
      candidateWords.push(currentWord);
      return;
    }

    const column = columns[columnIndex];
    for (const letter of column.letters) {
      generateCombinations(columnIndex + 1, currentWord + letter);
    }
  }

  generateCombinations(0, '');

  // Validate all candidate words with Wordnik
  const validWords: string[] = [];

  // Process in batches to show progress
  const BATCH_SIZE = 50;
  for (let i = 0; i < candidateWords.length; i += BATCH_SIZE) {
    const batch = candidateWords.slice(i, i + BATCH_SIZE);
    const validationResults = await Promise.all(
      batch.map(async (word) => {
        const isValid = await isValidWord(word);
        return { word, isValid };
      })
    );

    validationResults.forEach(({ word, isValid }) => {
      if (isValid) {
        validWords.push(word);
      }
    });
  }

  return validWords.sort();
}

function getTotalLetterCount(columns: TypeshiftColumn[]): number {
  return columns.reduce((sum, col) => sum + col.letters.length, 0);
}

/**
 * Calculate a "commonness" score for a word (lower is better/more common)
 * Uses multiple heuristics to estimate word frequency
 */
function getWordCommonScore(word: string): number {
  // Shorter words are generally more common
  const lengthPenalty = word.length * 10;

  // Words with common letters are generally more common
  const commonLetters = 'etaoinshrdlu';
  let uncommonLetterCount = 0;
  for (const char of word.toLowerCase()) {
    if (!commonLetters.includes(char)) {
      uncommonLetterCount++;
    }
  }

  // Penalize words with less common letters
  const letterPenalty = uncommonLetterCount * 5;

  // Penalize words with repeated letters (less common in general)
  const uniqueLetters = new Set(word.toLowerCase()).size;
  const repetitionPenalty = (word.length - uniqueLetters) * 3;

  return lengthPenalty + letterPenalty + repetitionPenalty;
}

/**
 * Finds the minimal core solution set using backtracking
 * Ensures we use exactly maxHeight words (one per row)
 * @param columns - Array of columns
 * @param allWords - All valid words that can be formed
 * @returns Core solution words
 */
export function findCoreWords(
  columns: TypeshiftColumn[],
  allWords: string[]
): string[] {
  const maxHeight = Math.max(...columns.map(col => col.letters.length));
  const totalLetters = getTotalLetterCount(columns);

  // Sort words by "commonness" (shorter, more common letters first)
  const sortedWords = [...allWords].sort((a, b) => {
    return getWordCommonScore(a) - getWordCommonScore(b);
  });

  // Try to find a solution with exactly maxHeight words
  let bestSolution: string[] = [];
  let bestCoverage = 0;

  // Backtracking function to find minimal word set
  function backtrack(
    wordIndex: number,
    currentWords: string[],
    usedLetters: Set<string>
  ): boolean {
    // If we have maxHeight words, check if we covered all letters
    if (currentWords.length === maxHeight) {
      if (usedLetters.size === totalLetters) {
        // Found perfect solution!
        bestSolution = [...currentWords];
        return true;
      }
      // Track best partial solution
      if (usedLetters.size > bestCoverage) {
        bestCoverage = usedLetters.size;
        bestSolution = [...currentWords];
      }
      return false;
    }

    // If we've exhausted all words, return
    if (wordIndex >= sortedWords.length) {
      return false;
    }

    // Pruning: if we can't possibly reach maxHeight words, return
    const remainingWords = maxHeight - currentWords.length;
    const remainingCandidates = sortedWords.length - wordIndex;
    if (remainingCandidates < remainingWords) {
      return false;
    }

    // Try including the current word
    const word = sortedWords[wordIndex];
    const newLetters = new Set<string>();
    let validWord = true;

    for (let colIndex = 0; colIndex < word.length; colIndex++) {
      const letter = word[colIndex].toLowerCase();
      const column = columns[colIndex];
      const letterIdx = column.letters.findIndex(l => l.toLowerCase() === letter);

      if (letterIdx === -1) {
        validWord = false;
        break;
      }

      const posKey = `${colIndex}-${letterIdx}`;
      if (!usedLetters.has(posKey)) {
        newLetters.add(posKey);
      }
    }

    // Only include this word if it adds new letter coverage
    if (validWord && newLetters.size > 0) {
      currentWords.push(word);
      newLetters.forEach(letter => usedLetters.add(letter));

      if (backtrack(wordIndex + 1, currentWords, usedLetters)) {
        return true; // Found perfect solution
      }

      // Backtrack
      currentWords.pop();
      newLetters.forEach(letter => usedLetters.delete(letter));
    }

    // Try skipping the current word
    return backtrack(wordIndex + 1, currentWords, usedLetters);
  }

  backtrack(0, [], new Set());

  return bestSolution;
}

/**
 * Solves a Typeshift puzzle
 * @param columns - Array of columns
 * @returns Solution containing all words and core words
 */
export async function solveTypeshift(columns: TypeshiftColumn[]): Promise<TypeshiftSolution> {
  const allWords = await findAllWords(columns);
  const coreWords = findCoreWords(columns, allWords);
  const totalLetters = getTotalLetterCount(columns);

  return {
    allWords,
    coreWords,
    usedLettersCount: coreWords.length * columns.length,
    totalLetters,
  };
}
