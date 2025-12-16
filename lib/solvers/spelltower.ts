import { isValidWord } from '../wordnik';

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
 * Finds all valid words starting from a given position
 */
async function findWordsFromPosition(
  grid: Grid,
  startRow: number,
  startCol: number,
  minLength: number = 3
): Promise<WordPath[]> {
  const words: WordPath[] = [];
  const startCell = grid[startRow][startCol];

  if (startCell.type === 'blank' || !startCell.letter) {
    return words;
  }

  const visited = new Set<string>();

  async function dfs(
    row: number,
    col: number,
    currentWord: string,
    path: { row: number; col: number }[],
    usedCells: Set<string>
  ) {
    const cellKey = `${row},${col}`;

    if (usedCells.has(cellKey)) {
      return;
    }

    const cell = grid[row][col];
    if (cell.type === 'blank' || !cell.letter) {
      return;
    }

    const newWord = currentWord + cell.letter;
    const newPath = [...path, { row, col }];
    const newUsed = new Set(usedCells);
    newUsed.add(cellKey);

    // Check if this is a valid word
    if (newWord.length >= minLength) {
      const pathKey = newPath.map(p => `${p.row},${p.col}`).join('->');

      if (!visited.has(pathKey)) {
        visited.add(pathKey);

        // Check with Wordnik
        const valid = await isValidWord(newWord);
        if (valid) {
          const hasRedTile = newPath.some(p => grid[p.row][p.col].type === 'red');
          const hasStarredTile = newPath.some(p => grid[p.row][p.col].type === 'starred');

          let score = newWord.length * newWord.length; // Basic scoring: length squared
          if (hasStarredTile) {
            score *= 2; // Double for starred tiles
          }

          words.push({
            word: newWord,
            path: newPath,
            score,
            hasRedTile,
            hasStarredTile,
          });
        }
      }
    }

    // Continue searching
    if (newWord.length < 15) { // Reasonable max word length
      const adjacent = getAdjacentCells(row, col);
      for (const { row: nextRow, col: nextCol } of adjacent) {
        await dfs(nextRow, nextCol, newWord, newPath, newUsed);
      }
    }
  }

  await dfs(startRow, startCol, '', [], new Set());

  return words;
}

/**
 * Finds all valid words on the grid
 */
async function findAllWords(grid: Grid): Promise<WordPath[]> {
  const allWords: WordPath[] = [];
  const seenWords = new Set<string>();

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const wordsFromHere = await findWordsFromPosition(grid, row, col);

      for (const wordPath of wordsFromHere) {
        const pathKey = wordPath.path.map(p => `${p.row},${p.col}`).join('->');
        if (!seenWords.has(pathKey)) {
          seenWords.add(pathKey);
          allWords.push(wordPath);
        }
      }
    }
  }

  // Sort by score descending
  allWords.sort((a, b) => b.score - a.score);

  return allWords;
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
 * Solves a Spelltower puzzle using a greedy approach
 * @param initialGrid - The initial grid state
 * @returns Solution with word sequence and total score
 */
export async function solveSpelltower(initialGrid: Grid): Promise<SpelltowerSolution> {
  const sequence: WordPath[] = [];
  let currentGrid = copyGrid(initialGrid);
  let totalScore = 0;

  // Greedy approach: keep picking the highest-scoring word
  const MAX_ITERATIONS = 50; // Prevent infinite loops
  let iterations = 0;

  while (!isGridEmpty(currentGrid) && iterations < MAX_ITERATIONS) {
    iterations++;

    const availableWords = await findAllWords(currentGrid);

    if (availableWords.length === 0) {
      // No more words can be formed
      break;
    }

    // Pick the highest-scoring word
    const bestWord = availableWords[0];

    sequence.push(bestWord);
    totalScore += bestWord.score;

    // Apply the word and update the grid
    currentGrid = clearWordAndApplyGravity(currentGrid, bestWord);
  }

  return {
    sequence,
    totalScore,
    clearedAll: isGridEmpty(currentGrid),
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
