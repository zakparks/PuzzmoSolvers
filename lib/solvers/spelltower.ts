import { isValidWordLocal } from '../dictionary';

export type CellType = 'letter' | 'blank' | 'red' | 'starred';

export interface Cell {
  letter: string; // Empty string for blank cells
  type: CellType;
}

export type Grid = Cell[][];

export interface WordPath {
  word: string;
  path: { row: number; col: number }[];
  score: number;
  hasRedTile: boolean;
  hasStarredTile: boolean;
}

export interface SpelltowerSolution {
  sequence: WordPath[];
  totalScore: number;
  clearedAll: boolean;
}

const ROWS = 13;
const COLS = 9;

// Global sorted dictionary for binary search
let sortedDictionary: string[] | null = null;

/**
 * Load and sort the dictionary for binary search (based on reference solver)
 */
async function loadSortedDictionary(): Promise<string[]> {
  if (sortedDictionary) {
    return sortedDictionary;
  }

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

    sortedDictionary = words.sort();
    console.log(`Dictionary loaded: ${sortedDictionary.length} words`);
    return sortedDictionary;
  } catch (error) {
    console.error('Error loading dictionary:', error);
    sortedDictionary = [];
    return sortedDictionary;
  }
}

/**
 * Check if a prefix exists in the dictionary using binary search
 * Based on the reference solver's isValidPrefix function
 */
function isValidPrefix(dictionary: string[], prefix: string): boolean {
  if (prefix.length === 0) return true;

  let begin = 0;
  let end = dictionary.length - 1;

  while (begin <= end) {
    const mid = Math.floor((begin + end) / 2);
    const word = dictionary[mid];

    if (word.startsWith(prefix)) {
      return true;
    }

    if (prefix < word) {
      end = mid - 1;
    } else {
      begin = mid + 1;
    }
  }

  return false;
}

/**
 * Check if a word exists in the dictionary using binary search
 * Based on the reference solver's isWord function
 */
function isWord(dictionary: string[], word: string): boolean {
  let begin = 0;
  let end = dictionary.length - 1;

  while (begin <= end) {
    const mid = Math.floor((begin + end) / 2);
    const dictWord = dictionary[mid];

    if (dictWord === word) {
      return true;
    }

    if (word < dictWord) {
      end = mid - 1;
    } else {
      begin = mid + 1;
    }
  }

  return false;
}

/**
 * Gets all adjacent cells (including diagonals)
 */
function getAdjacentCells(row: number, col: number): { row: number; col: number }[] {
  const adjacent: { row: number; col: number }[] = [];

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;

      const newRow = row + i;
      const newCol = col + j;

      if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
        adjacent.push({ row: newRow, col: newCol });
      }
    }
  }

  return adjacent;
}

/**
 * Letter point values based on Puzzmo SpellTower
 */
const LETTER_VALUES: { [key: string]: number } = {
  'Q': 12, 'Z': 11,
  'J': 9, 'X': 9,
  'K': 6,
  'F': 5, 'H': 5, 'V': 5, 'W': 5, 'Y': 5,
  'B': 4, 'C': 4, 'M': 4, 'P': 4,
  'D': 3, 'G': 3,
  'L': 2, 'N': 2, 'R': 2, 'T': 2,
  'A': 1, 'E': 1, 'I': 1, 'O': 1, 'U': 1, 'S': 1
};

/**
 * Calculate letter value
 */
function getLetterValue(letter: string): number {
  return LETTER_VALUES[letter.toUpperCase()] || 0;
}

/**
 * DFS traversal to find all words starting from a position
 * Directly based on the reference solver's traverse function
 */
function traverse(
  grid: Grid,
  dictionary: string[],
  visited: boolean[][],
  solutions: Map<string, { word: string; path: { row: number; col: number }[] }>,
  x: number,
  y: number,
  value: string,
  path: { row: number; col: number }[]
): void {
  // Bounds check
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) {
    return;
  }

  // Check if cell is blank or already visited
  if (grid[y][x].letter === '' || visited[y][x]) {
    return;
  }

  const newWord = (value + grid[y][x].letter).toLowerCase();

  // Check if prefix is valid
  if (!isValidPrefix(dictionary, newWord)) {
    return;
  }

  // Mark as visited and add to path
  path.push({ row: y, col: x });
  visited[y][x] = true;

  // If it's a valid word of length >= 3, save it
  if (newWord.length >= 3 && isWord(dictionary, newWord)) {
    const pathKey = path.map(p => `${p.row},${p.col}`).join('->');
    if (!solutions.has(pathKey)) {
      solutions.set(pathKey, {
        word: newWord,
        path: [...path]
      });
    }
  }

  // Explore all adjacent cells
  const adjacent = getAdjacentCells(y, x);
  for (const { row: nextY, col: nextX } of adjacent) {
    traverse(grid, dictionary, visited, solutions, nextX, nextY, newWord, path);
  }

  // Backtrack
  visited[y][x] = false;
  path.pop();
}

/**
 * Find all valid words on the grid
 * Based on the reference solver's solve function
 */
async function findAllWords(grid: Grid): Promise<WordPath[]> {
  const dictionary = await loadSortedDictionary();
  const solutions = new Map<string, { word: string; path: { row: number; col: number }[] }>();

  // Initialize visited array
  const visited: boolean[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));

  // Search from every non-empty cell
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col].letter !== '') {
        traverse(grid, dictionary, visited, solutions, col, row, '', []);
      }
    }
  }

  console.log(`Found ${solutions.size} total words`);

  // Convert to WordPath objects with scores
  const validWords: WordPath[] = [];

  for (const { word, path } of solutions.values()) {
    const hasRedTile = path.some(p => grid[p.row][p.col].type === 'red');
    const starCount = path.filter(p => grid[p.row][p.col].type === 'starred').length;
    const hasStarredTile = starCount > 0;

    // Calculate sum of word tile values
    let tileValueSum = 0;
    for (const { row, col } of path) {
      tileValueSum += getLetterValue(grid[row][col].letter);
    }

    // Puzzmo formula: (Sum of word tile values + sum of bonus tile values) x word length x (1+# star tiles)
    // For now we don't have bonus tiles (row clears, 5+ length bonus), so just use word tiles
    let score = tileValueSum * word.length * (1 + starCount);

    validWords.push({
      word,
      path,
      score,
      hasRedTile,
      hasStarredTile,
    });
  }

  // Sort by word length descending (like the reference solver)
  validWords.sort((a, b) => {
    if (a.word.length !== b.word.length) {
      return b.word.length - a.word.length;
    }
    return a.word.localeCompare(b.word);
  });

  return validWords;
}

/**
 * Creates an empty grid
 */
export function createEmptyGrid(): Grid {
  return Array(ROWS).fill(null).map(() =>
    Array(COLS).fill(null).map(() => ({
      letter: '',
      type: 'letter' as CellType,
    }))
  );
}

/**
 * Creates a copy of the grid
 */
function copyGrid(grid: Grid): Grid {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

/**
 * Applies gravity to the grid after removing tiles
 */
function applyGravity(grid: Grid): void {
  for (let col = 0; col < COLS; col++) {
    // Collect non-blank cells from bottom to top
    const nonBlankCells: Cell[] = [];
    for (let row = ROWS - 1; row >= 0; row--) {
      if (grid[row][col].type !== 'blank' && grid[row][col].letter !== '') {
        nonBlankCells.push({ ...grid[row][col] });
      }
    }

    // Fill column from bottom with non-blank cells
    for (let row = ROWS - 1; row >= 0; row--) {
      const cellIndex = ROWS - 1 - row;
      if (cellIndex < nonBlankCells.length) {
        grid[row][col] = nonBlankCells[cellIndex];
      } else {
        grid[row][col] = { letter: '', type: 'blank' };
      }
    }
  }
}

/**
 * Removes tiles from the grid based on a word path
 */
function removeTiles(grid: Grid, path: { row: number; col: number }[]): void {
  for (const { row, col } of path) {
    grid[row][col] = { letter: '', type: 'blank' };
  }
  applyGravity(grid);
}

/**
 * Checks if the grid is empty (all tiles cleared)
 */
function isGridEmpty(grid: Grid): boolean {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col].letter !== '' && grid[row][col].type !== 'blank') {
        return false;
      }
    }
  }
  return true;
}

/**
 * Main solver function - finds optimal sequence of words to clear the board
 */
export async function solveSpelltower(grid: Grid): Promise<SpelltowerSolution> {
  console.log('Starting solve with grid:', grid);

  const allWords = await findAllWords(grid);

  if (allWords.length === 0) {
    return {
      sequence: [],
      totalScore: 0,
      clearedAll: false,
    };
  }

  // For now, return all found words sorted by score
  // The user can choose which words to play
  return {
    sequence: allWords,
    totalScore: allWords.reduce((sum, word) => sum + word.score, 0),
    clearedAll: false,
  };
}
