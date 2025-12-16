'use client';

import { useState } from 'react';
import { solveMemoku, createEmptyGrid, SudokuGrid, StarCell } from '@/lib/solvers/memoku';
import buttonStyles from '@/styles/components/button.module.css';
import solverStyles from '@/styles/solver.module.css';
import gridStyles from '@/styles/grid-solver.module.css';

export default function MemokuPage() {
  const [grid, setGrid] = useState<SudokuGrid>(createEmptyGrid());
  const [solvedGrid, setSolvedGrid] = useState<SudokuGrid | null>(null);
  const [error, setError] = useState<string>('');
  const [stars, setStars] = useState<StarCell[]>([]);
  const [selectedStarColor, setSelectedStarColor] = useState<'gold' | 'purple' | 'green' | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

  const handleCellChange = (row: number, col: number, value: string) => {
    const newGrid = grid.map(r => [...r]);

    // Handle keyboard shortcuts for stars
    const upperValue = value.toUpperCase();
    if (upperValue === 'Y') {
      handleStarButtonClick('gold');
      focusNextCell(row, col);
      return;
    } else if (upperValue === 'P') {
      handleStarButtonClick('purple');
      focusNextCell(row, col);
      return;
    } else if (upperValue === 'G') {
      handleStarButtonClick('green');
      focusNextCell(row, col);
      return;
    }

    // Handle space to clear cell and auto-tab
    if (value === ' ') {
      newGrid[row][col] = null;
      setGrid(newGrid);
      setSolvedGrid(null);
      setError('');
      focusNextCell(row, col);
      return;
    }

    const num = parseInt(value);

    if (value === '' || value === '0') {
      newGrid[row][col] = null;
    } else if (num >= 1 && num <= 9) {
      newGrid[row][col] = num;
      setGrid(newGrid);
      setSolvedGrid(null);
      setError('');
      // Auto-tab to next cell
      focusNextCell(row, col);
      return;
    }

    setGrid(newGrid);
    setSolvedGrid(null);
    setError('');
  };

  const focusNextCell = (row: number, col: number) => {
    let nextRow = row;
    let nextCol = col + 1;

    // Move to next row if at end of current row
    if (nextCol >= 9) {
      nextCol = 0;
      nextRow = row + 1;
    }

    // If we're at the last cell, don't focus anything
    if (nextRow >= 9) {
      return;
    }

    // Focus the next cell
    const nextInput = document.querySelector(
      `input[data-row="${nextRow}"][data-col="${nextCol}"]`
    ) as HTMLInputElement;
    if (nextInput) {
      nextInput.focus();
    }
  };

  const handleCellFocus = (row: number, col: number) => {
    setFocusedCell({ row, col });
  };

  const handleStarButtonClick = (color: 'gold' | 'purple' | 'green') => {
    // If there's a focused cell, apply star to it
    if (focusedCell) {
      const { row, col } = focusedCell;

      // Check if this cell already has this star color
      const existingStarIndex = stars.findIndex(
        s => s.row === row && s.col === col && s.color === color
      );

      if (existingStarIndex !== -1) {
        // Remove the star
        const newStars = stars.filter((_, idx) => idx !== existingStarIndex);
        setStars(newStars);
        setSelectedStarColor(null);
        return;
      }

      // Check if this color is already used
      const colorUsed = stars.some(s => s.color === color);
      if (colorUsed) {
        // Replace the existing star of this color
        const newStars = stars.filter(s => s.color !== color);
        newStars.push({ row, col, color });
        setStars(newStars);
      } else {
        // Add new star if we haven't reached the limit
        if (stars.length < 3) {
          setStars([...stars, { row, col, color }]);
        }
      }
      setSelectedStarColor(null);
    } else {
      // No focused cell, just toggle selection
      setSelectedStarColor(selectedStarColor === color ? null : color);
    }
  };

  const handleSolve = () => {
    setError('');
    const solution = solveMemoku(grid);

    if (solution.solved) {
      setSolvedGrid(solution.grid);
    } else {
      setError(solution.error || 'Failed to solve puzzle');
      setSolvedGrid(null);
    }
  };

  const handleClear = () => {
    setGrid(createEmptyGrid());
    setSolvedGrid(null);
    setError('');
    setStars([]);
    setSelectedStarColor(null);
    setFocusedCell(null);
  };

  const getStarForCell = (row: number, col: number): StarCell | undefined => {
    return stars.find(s => s.row === row && s.col === col);
  };

  const getCellClassName = (row: number, col: number): string => {
    const star = getStarForCell(row, col);
    const displayGrid = solvedGrid || grid;
    const hasValue = displayGrid[row][col] !== null;
    const wasEmpty = grid[row][col] === null;

    let classes = [gridStyles.sudokuCell];

    if (solvedGrid && wasEmpty) {
      classes.push(gridStyles.sudokuCellSolved);
    }

    if (star && !hasValue) {
      switch (star.color) {
        case 'gold':
          classes.push(gridStyles.cellYellow);
          break;
        case 'purple':
          classes.push(gridStyles.cellPurple);
          break;
        case 'green':
          classes.push(gridStyles.cellGreen);
          break;
      }
    }

    if ((col + 1) % 3 === 0 && col !== 8) {
      classes.push(gridStyles.rightBorder);
    }

    if ((row + 1) % 3 === 0 && row !== 8) {
      classes.push(gridStyles.bottomBorder);
    }

    return classes.join(' ');
  };

  const getCellStyle = (row: number, col: number): React.CSSProperties => {
    const star = getStarForCell(row, col);

    if (star) {
      // If cell has a star, hide the number input
      return { color: 'transparent', caretColor: 'transparent' };
    }

    if (!solvedGrid) return {};

    const wasEmpty = grid[row][col] === null;

    if (wasEmpty) {
      return { color: '#2563eb', fontWeight: 'bold' };
    }

    return {};
  };

  const displayGrid = solvedGrid || grid;

  return (
    <div className={solverStyles.solverContainer}>
      <h1 className={solverStyles.solverTitle} style={{ marginBottom: '2rem' }}>Memoku (Sudoku) Solver</h1>

      <div className={solverStyles.infoBox}>
        <h2>How to use</h2>
        <p>1. Enter the given numbers in the grid (1-9). Press space to leave a cell blank. The cursor will automatically advance.</p>
        <p>2. To mark stars (up to 3): click a cell and click a star button, or press Y (Yellow), P (Purple), or G (Green)</p>
        <p>3. Click Solve to find the solution</p>
      </div>

      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h3 className={solverStyles.sectionTitle}>Star Marking</h3>
        <div className={gridStyles.starButtons} style={{ justifyContent: 'center' }}>
          <button
            onClick={() => handleStarButtonClick('gold')}
            className={`${gridStyles.starButton} ${gridStyles.starButtonYellow} ${
              selectedStarColor === 'gold' ? 'active' : ''
            }`}
          >
            <span>⭐</span>Yellow
          </button>
          <button
            onClick={() => handleStarButtonClick('purple')}
            className={`${gridStyles.starButton} ${gridStyles.starButtonPurple} ${
              selectedStarColor === 'purple' ? 'active' : ''
            }`}
          >
            <span>⭐</span>Purple
          </button>
          <button
            onClick={() => handleStarButtonClick('green')}
            className={`${gridStyles.starButton} ${gridStyles.starButtonGreen} ${
              selectedStarColor === 'green' ? 'active' : ''
            }`}
          >
            <span>⭐</span>Green
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div className={gridStyles.gridContainer}>
          <div className={gridStyles.sudokuGrid}>
            {displayGrid.map((row, rowIndex) => (
              row.map((cell, colIndex) => {
                const star = getStarForCell(rowIndex, colIndex);

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={getCellClassName(rowIndex, colIndex)}
                  >
                    {star ? (
                      <div className={gridStyles.sudokuCellStar} style={{
                        color: star.color === 'gold' ? '#ca8a04' : star.color === 'purple' ? '#7e22ce' : '#16a34a'
                      }}>
                        ★
                      </div>
                    ) : null}
                    <input
                      type="text"
                      maxLength={1}
                      value={cell === null ? '' : cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      onFocus={() => handleCellFocus(rowIndex, colIndex)}
                      disabled={!!solvedGrid}
                      style={getCellStyle(rowIndex, colIndex)}
                      data-row={rowIndex}
                      data-col={colIndex}
                    />
                  </div>
                );
              })
            ))}
          </div>
        </div>
      </div>

      <div className={buttonStyles.buttonGroup} style={{ marginBottom: '1.5rem', justifyContent: 'center' }}>
        <button
          onClick={handleSolve}
          disabled={!!solvedGrid}
          className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}
        >
          Solve
        </button>
        <button
          onClick={handleClear}
          className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
        >
          Clear
        </button>
      </div>

      {error && (
        <div className={solverStyles.resultSection} style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
          border: '2px solid rgba(239, 68, 68, 0.3)'
        }}>
          <p style={{ color: '#991b1b', fontWeight: 600, margin: 0 }}>{error}</p>
        </div>
      )}

      {solvedGrid && (
        <div className={`${solverStyles.resultSection} ${solverStyles.coreResultSection}`}>
          <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
            Puzzle solved successfully! 🎉
          </p>
        </div>
      )}
    </div>
  );
}
