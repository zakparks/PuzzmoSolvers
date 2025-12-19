/**
 * Shared grid focus utilities
 * Used across solver pages for auto-advancing to next cell
 */

/**
 * Focuses the next cell in a grid after input
 * Moves right, then wraps to next row
 * @param row - Current row index
 * @param col - Current column index
 * @param maxRows - Total number of rows
 * @param maxCols - Total number of columns
 */
export function focusNextCell(
  row: number,
  col: number,
  maxRows: number,
  maxCols: number
): void {
  let nextRow = row;
  let nextCol = col + 1;

  // Move to next row if at end of current row
  if (nextCol >= maxCols) {
    nextCol = 0;
    nextRow = row + 1;
  }

  // Don't focus if we're at the last cell
  if (nextRow >= maxRows) {
    return;
  }

  // Find and focus the next input element
  const nextInput = document.querySelector(
    `input[data-row="${nextRow}"][data-col="${nextCol}"]`
  ) as HTMLInputElement;

  if (nextInput) {
    nextInput.focus();
  }
}

/**
 * Focuses a specific cell in the grid
 * @param row - Row index to focus
 * @param col - Column index to focus
 */
export function focusCell(row: number, col: number): void {
  const input = document.querySelector(
    `input[data-row="${row}"][data-col="${col}"]`
  ) as HTMLInputElement;

  if (input) {
    input.focus();
  }
}
