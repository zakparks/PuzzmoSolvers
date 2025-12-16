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

/**
 * Finds the minimal core solution set
 * @param columns - Array of columns
 * @param allWords - All valid words that can be formed
 * @returns Core solution words
 */
export function findCoreWords(
  columns: TypeshiftColumn[],
  allWords: string[]
): string[] {
  const maxHeight = Math.max(...columns.map(col => col.letters.length));

  // Track which letters have been used (by column and index)
  const usedLetters = new Set<string>();

  // Create letter position map
  const letterPositions = new Map<string, { col: number; idx: number }[]>();
  columns.forEach((column, colIndex) => {
    column.letters.forEach((letter, letterIndex) => {
      const key = `${colIndex}-${letter.toLowerCase()}`;
      if (!letterPositions.has(key)) {
        letterPositions.set(key, []);
      }
      letterPositions.get(key)!.push({ col: colIndex, idx: letterIndex });
    });
  });

  // Greedy algorithm: pick words that cover the most unused letters
  const coreWords: string[] = [];

  while (usedLetters.size < getTotalLetterCount(columns) && coreWords.length < maxHeight * 2) {
    let bestWord = '';
    let bestNewLetters = new Set<string>();

    for (const word of allWords) {
      if (coreWords.includes(word)) continue;

      const newLetters = new Set<string>();
      let validWord = true;

      // Check if this word introduces new letter usage
      for (let colIndex = 0; colIndex < word.length; colIndex++) {
        const letter = word[colIndex].toLowerCase();
        const column = columns[colIndex];

        // Find which position in the column this letter is at
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

      if (validWord && newLetters.size > bestNewLetters.size) {
        bestWord = word;
        bestNewLetters = newLetters;
      }
    }

    if (!bestWord) break;

    coreWords.push(bestWord);
    bestNewLetters.forEach(letter => usedLetters.add(letter));
  }

  return coreWords;
}

function getTotalLetterCount(columns: TypeshiftColumn[]): number {
  return columns.reduce((sum, col) => sum + col.letters.length, 0);
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
