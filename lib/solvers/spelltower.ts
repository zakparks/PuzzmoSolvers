import { isValidWordLocal } from '../dictionary';
import { isValidPrefix, isValidWordTrie, loadDictionaryTrie } from '../dictionaryTrie';

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

/**
 * Gets all adjacent cells (including diagonals)
 */
function getAdjacentCells(row: number, col: number): { row: number; col: number }[] {
  const adjacent: { row: number; col: number }[] = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
      adjacent.push({ row: newRow, col: newCol });
    }
  }

  return adjacent;
}

/**
 * Counts how many tiles will be cleared by playing a word
 */
function countTilesCleared(grid: Grid, wordPath: WordPath): number {
  const cellsToClear = new Set<string>();

  // Add word path cells
  for (const { row, col } of wordPath.path) {
    cellsToClear.add(`${row},${col}`);
  }

  // Handle red tile clearing (entire row)
  if (wordPath.hasRedTile) {
    for (const { row, col } of wordPath.path) {
      if (grid[row][col].type === 'red') {
        // Clear entire row
        for (let c = 0; c < COLS; c++) {
          if (grid[row][c].type !== 'blank' && grid[row][c].letter) {
            cellsToClear.add(`${row},${c}`);
          }
        }
      }
    }
  }

  // Handle adjacent tile clearing (for words > 4 letters)
  if (wordPath.word.length > 4) {
    for (const { row, col } of wordPath.path) {
      const adjacent = getAdjacentCells(row, col);
      for (const { row: adjRow, col: adjCol } of adjacent) {
        if (grid[adjRow][adjCol].type !== 'blank' && grid[adjRow][adjCol].letter) {
          cellsToClear.add(`${adjRow},${adjCol}`);
        }
      }
    }
  }

  return cellsToClear.size;
}

/**
 * Finds all valid words starting from a given position - MEMORY OPTIMIZED VERSION
 * Uses bit flags instead of Sets to track used cells
 */
async function findWordsFromPosition(
  grid: Grid,
  trie: Awaited<ReturnType<typeof loadDictionaryTrie>>,
  startRow: number,
  startCol: number,
  minLength: number = 3,
  maxLength: number = 15
): Promise<{ word: string; path: { row: number; col: number }[] }[]> {
  const validWords: { word: string; path: { row: number; col: number }[] }[] = [];
  const startCell = grid[startRow][startCol];

  if (startCell.type === 'blank' || !startCell.letter) {
    return validWords;
  }

  const visited = new Set<string>();
  const usedCells: boolean[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));

  function dfs(
    row: number,
    col: number,
    currentWord: string,
    path: { row: number; col: number }[]
  ): void {
    if (usedCells[row][col]) {
      return;
    }

    const cell = grid[row][col];
    if (cell.type === 'blank' || !cell.letter) {
      return;
    }

    const newWord = currentWord + cell.letter;

    // KEY OPTIMIZATION: Check if this prefix could lead to any valid words (synchronous!)
    if (!trie.hasPrefix(newWord)) {
      return;
    }

    usedCells[row][col] = true;
    path.push({ row, col });

    if (newWord.length >= minLength && newWord.length <= maxLength) {
      if (trie.isWord(newWord)) {
        const pathKey = path.map(p => `${p.row},${p.col}`).join('->');
        if (!visited.has(pathKey)) {
          visited.add(pathKey);
          validWords.push({
            word: newWord,
            path: [...path],
          });
        }
      }
    }

    if (newWord.length < maxLength) {
      const adjacent = getAdjacentCells(row, col);
      for (const { row: nextRow, col: nextCol } of adjacent) {
        dfs(nextRow, nextCol, newWord, path);
      }
    }

    path.pop();
    usedCells[row][col] = false;
  }

  dfs(startRow, startCol, '', []);

  return validWords;
}

/**
 * Finds all valid words on the grid using prefix-pruned DFS
 * Much more efficient than before - no need for candidate limits or post-validation
 */
async function findAllWords(grid: Grid): Promise<WordPath[]> {
  const allValidWords: { word: string; path: { row: number; col: number }[] }[] = [];
  const seenPaths = new Set<string>();

  // Load trie once for all searches
  const trie = await loadDictionaryTrie();

  // Search from all positions - prefix pruning makes this efficient
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // Find all valid words starting from this position
      const wordsFromHere = await findWordsFromPosition(grid, trie, row, col, 3, 15);

      console.log(`Found ${wordsFromHere.length} words from position (${row},${col})`);

      for (const wordPath of wordsFromHere) {
        const pathKey = wordPath.path.map(p => `${p.row},${p.col}`).join('->');
        if (!seenPaths.has(pathKey)) {
          seenPaths.add(pathKey);
          allValidWords.push(wordPath);
        }
      }
    }
  }

  console.log(`Total unique words found: ${allValidWords.length}`);

  // Create WordPath objects with scores
  const validWords: WordPath[] = [];

  for (const candidate of allValidWords) {
    const hasRedTile = candidate.path.some(p => grid[p.row][p.col].type === 'red');
    const hasStarredTile = candidate.path.some(p => grid[p.row][p.col].type === 'starred');

    let score = candidate.word.length * candidate.word.length;
    if (hasStarredTile) {
      score *= 2;
    }

    validWords.push({
      word: candidate.word,
      path: candidate.path,
      score,
      hasRedTile,
      hasStarredTile,
    });
  }

  // Sort by score descending
  validWords.sort((a, b) => b.score - a.score);

  return validWords;
}

/**
 * Creates a copy of the grid
 */
function copyGrid(grid: Grid): Grid {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

/**
 * Simulates clearing a word and applies gravity
 */
function clearWordAndApplyGravity(grid: Grid, wordPath: WordPath): Grid {
  const newGrid = copyGrid(grid);
  const cellsToClear = new Set<string>();

  // Add word path cells
  for (const { row, col } of wordPath.path) {
    cellsToClear.add(`${row},${col}`);
  }

  // Handle red tile clearing (entire row)
  if (wordPath.hasRedTile) {
    for (const { row, col } of wordPath.path) {
      if (newGrid[row][col].type === 'red') {
        // Clear entire row
        for (let c = 0; c < COLS; c++) {
          cellsToClear.add(`${row},${c}`);
        }
      }
    }
  }

  // Handle adjacent tile clearing (for words > 4 letters)
  if (wordPath.word.length > 4) {
    for (const { row, col } of wordPath.path) {
      const adjacent = getAdjacentCells(row, col);
      for (const { row: adjRow, col: adjCol } of adjacent) {
        cellsToClear.add(`${adjRow},${adjCol}`);
      }
    }
  } else {
    // For short words (≤ 4), still clear adjacent blank tiles
    for (const { row, col } of wordPath.path) {
      const adjacent = getAdjacentCells(row, col);
      for (const { row: adjRow, col: adjCol } of adjacent) {
        if (newGrid[adjRow][adjCol].type === 'blank') {
          cellsToClear.add(`${adjRow},${adjCol}`);
        }
      }
    }
  }

  // Clear all marked cells
  for (const cellKey of cellsToClear) {
    const [row, col] = cellKey.split(',').map(Number);
    newGrid[row][col] = { letter: '', type: 'blank' };
  }

  // Apply gravity (shift everything down)
  for (let col = 0; col < COLS; col++) {
    const column: Cell[] = [];

    // Collect non-blank cells from bottom to top
    for (let row = ROWS - 1; row >= 0; row--) {
      if (newGrid[row][col].type !== 'blank' && newGrid[row][col].letter) {
        column.push(newGrid[row][col]);
      }
    }

    // Rebuild column with blanks at top
    for (let row = ROWS - 1; row >= 0; row--) {
      const idx = ROWS - 1 - row;
      if (idx < column.length) {
        newGrid[row][col] = column[idx];
      } else {
        newGrid[row][col] = { letter: '', type: 'blank' };
      }
    }
  }

  return newGrid;
}

/**
 * Checks if the grid is empty (all cleared)
 */
function isGridEmpty(grid: Grid): boolean {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col].type !== 'blank' && grid[row][col].letter) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Counts remaining tiles on the grid
 */
function countRemainingTiles(grid: Grid): number {
  let count = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col].type !== 'blank' && grid[row][col].letter) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Solves a Spelltower puzzle with board-clearing strategy
 * Prioritizes clearing all tiles by looking ahead
 * @param initialGrid - The initial grid state
 * @returns Solution with word sequence and total score
 */
export async function solveSpelltower(initialGrid: Grid): Promise<SpelltowerSolution> {
  const sequence: WordPath[] = [];
  let currentGrid = copyGrid(initialGrid);
  let totalScore = 0;

  const MAX_ITERATIONS = 50; // Prevent infinite loops
  let iterations = 0;

  while (!isGridEmpty(currentGrid) && iterations < MAX_ITERATIONS) {
    iterations++;

    const availableWords = await findAllWords(currentGrid);

    if (availableWords.length === 0) {
      // No more words can be formed
      break;
    }

    // Strategy: Prioritize words that clear more tiles
    // and look ahead to see if they help clear the board
    let bestWord = availableWords[0];
    const remainingTiles = countRemainingTiles(currentGrid);

    // On early moves (board > 50% full), prioritize long words and tile clearing
    if (remainingTiles > 50) {
      // Find the word that clears the most tiles (considering length and adjacency)
      let maxCleared = 0;
      for (const word of availableWords.slice(0, Math.min(20, availableWords.length))) {
        const tilesCleared = countTilesCleared(currentGrid, word);

        // Bonus for longer words (they clear more adjacent tiles)
        const clearingPower = tilesCleared + (word.word.length > 7 ? 10 : 0);

        if (clearingPower > maxCleared) {
          maxCleared = clearingPower;
          bestWord = word;
        }
      }
    } else {
      // Late game (< 50 tiles): Look ahead to see which word leads to board clearing
      let bestClearingWord = availableWords[0];
      let bestRemainingAfter = remainingTiles;

      for (const word of availableWords.slice(0, Math.min(15, availableWords.length))) {
        const testGrid = clearWordAndApplyGravity(currentGrid, word);
        const tilesRemaining = countRemainingTiles(testGrid);

        // Prefer words that leave fewer tiles
        if (tilesRemaining < bestRemainingAfter) {
          bestRemainingAfter = tilesRemaining;
          bestClearingWord = word;
        } else if (tilesRemaining === bestRemainingAfter && word.score > bestClearingWord.score) {
          // Tie-breaker: higher score
          bestClearingWord = word;
        }
      }

      bestWord = bestClearingWord;
    }

    sequence.push(bestWord);
    totalScore += bestWord.score;

    // Apply the word and update the grid
    currentGrid = clearWordAndApplyGravity(currentGrid, bestWord);
  }

  // Bonus for clearing all tiles
  const clearedAll = isGridEmpty(currentGrid);
  if (clearedAll) {
    totalScore += 1000; // Large bonus for clearing the board
  }

  return {
    sequence,
    totalScore,
    clearedAll,
  };
}

/**
 * Creates an empty Spelltower grid
 */
export function createEmptyGrid(): Grid {
  return Array(ROWS).fill(null).map(() =>
    Array(COLS).fill(null).map(() => ({
      letter: '',
      type: 'blank' as CellType,
    }))
  );
}
