export type SudokuGrid = (number | null)[][];

export interface StarCell {
  row: number;
  col: number;
  color: 'gold' | 'purple' | 'green';
}

export interface MemokuSolution {
  solved: boolean;
  grid: SudokuGrid;
  error?: string;
}

/**
 * Validates if a number can be placed at a given position
 */
function isValidPlacement(grid: SudokuGrid, row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) {
      return false;
    }
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) {
      return false;
    }
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === num) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Finds the next empty cell in the grid
 */
function findEmptyCell(grid: SudokuGrid): [number, number] | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        return [row, col];
      }
    }
  }
  return null;
}

/**
 * Solves a Sudoku puzzle using backtracking
 */
function solveSudoku(grid: SudokuGrid): boolean {
  const emptyCell = findEmptyCell(grid);

  if (!emptyCell) {
    // No empty cells, puzzle is solved
    return true;
  }

  const [row, col] = emptyCell;

  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      grid[row][col] = num;

      if (solveSudoku(grid)) {
        return true;
      }

      // Backtrack
      grid[row][col] = null;
    }
  }

  return false;
}

/**
 * Creates a deep copy of the grid
 */
function copyGrid(grid: SudokuGrid): SudokuGrid {
  return grid.map(row => [...row]);
}

/**
 * Validates the initial grid setup
 */
function validateInitialGrid(grid: SudokuGrid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = grid[row][col];
      if (value !== null) {
        // Temporarily remove the value to check if placement is valid
        grid[row][col] = null;
        const valid = isValidPlacement(grid, row, col, value);
        grid[row][col] = value;

        if (!valid) {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Solves a Memoku (Sudoku) puzzle
 * @param grid - 9x9 grid with initial values (null for empty cells)
 * @returns Solution object with solved grid
 */
export function solveMemoku(grid: SudokuGrid): MemokuSolution {
  // Validate grid dimensions
  if (grid.length !== 9 || !grid.every(row => row.length === 9)) {
    return {
      solved: false,
      grid: grid,
      error: 'Invalid grid dimensions. Must be 9x9.',
    };
  }

  // Create a copy to avoid modifying the original
  const workingGrid = copyGrid(grid);

  // Validate initial setup
  if (!validateInitialGrid(workingGrid)) {
    return {
      solved: false,
      grid: grid,
      error: 'Invalid initial grid. Contains conflicting values.',
    };
  }

  // Attempt to solve
  const solved = solveSudoku(workingGrid);

  if (solved) {
    return {
      solved: true,
      grid: workingGrid,
    };
  } else {
    return {
      solved: false,
      grid: grid,
      error: 'No solution exists for this puzzle.',
    };
  }
}

/**
 * Creates an empty 9x9 Sudoku grid
 */
export function createEmptyGrid(): SudokuGrid {
  return Array(9).fill(null).map(() => Array(9).fill(null));
}
