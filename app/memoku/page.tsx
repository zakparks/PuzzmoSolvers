'use client';

import { useState } from 'react';
import { solveMemoku, createEmptyGrid, SudokuGrid, StarCell } from '@/lib/solvers/memoku';

export default function MemokuPage() {
  const [grid, setGrid] = useState<SudokuGrid>(createEmptyGrid());
  const [solvedGrid, setSolvedGrid] = useState<SudokuGrid | null>(null);
  const [error, setError] = useState<string>('');
  const [stars, setStars] = useState<StarCell[]>([]);
  const [selectedStarColor, setSelectedStarColor] = useState<'gold' | 'purple' | 'green' | null>(null);

  const handleCellChange = (row: number, col: number, value: string) => {
    const newGrid = grid.map(r => [...r]);
    const num = parseInt(value);

    if (value === '' || value === '0') {
      newGrid[row][col] = null;
    } else if (num >= 1 && num <= 9) {
      newGrid[row][col] = num;
    }

    setGrid(newGrid);
    setSolvedGrid(null);
    setError('');
  };

  const handleCellClick = (row: number, col: number) => {
    if (!selectedStarColor) return;

    // Check if this cell already has this star color
    const existingStarIndex = stars.findIndex(
      s => s.row === row && s.col === col && s.color === selectedStarColor
    );

    if (existingStarIndex !== -1) {
      // Remove the star
      const newStars = stars.filter((_, idx) => idx !== existingStarIndex);
      setStars(newStars);
      return;
    }

    // Check if this color is already used
    const colorUsed = stars.some(s => s.color === selectedStarColor);
    if (colorUsed) {
      // Replace the existing star of this color
      const newStars = stars.filter(s => s.color !== selectedStarColor);
      newStars.push({ row, col, color: selectedStarColor });
      setStars(newStars);
    } else {
      // Add new star if we haven't reached the limit
      if (stars.length < 3) {
        setStars([...stars, { row, col, color: selectedStarColor }]);
      }
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
  };

  const getStarForCell = (row: number, col: number): StarCell | undefined => {
    return stars.find(s => s.row === row && s.col === col);
  };

  const getCellColor = (row: number, col: number): string => {
    const star = getStarForCell(row, col);
    if (!star) return '';

    const displayGrid = solvedGrid || grid;
    const hasValue = displayGrid[row][col] !== null;

    if (!hasValue) {
      // Light background for empty cells
      switch (star.color) {
        case 'gold': return 'bg-yellow-100';
        case 'purple': return 'bg-purple-100';
        case 'green': return 'bg-green-100';
      }
    }

    return '';
  };

  const getCellTextColor = (row: number, col: number): string => {
    if (!solvedGrid) return 'text-gray-900';

    const star = getStarForCell(row, col);
    const wasEmpty = grid[row][col] === null;

    if (star && wasEmpty) {
      // This cell was solved and is starred
      switch (star.color) {
        case 'gold': return 'text-yellow-600 font-bold';
        case 'purple': return 'text-purple-600 font-bold';
        case 'green': return 'text-green-600 font-bold';
      }
    }

    if (wasEmpty) {
      return 'text-blue-600';
    }

    return 'text-gray-900';
  };

  const displayGrid = solvedGrid || grid;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Memoku (Sudoku) Solver</h1>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">How to use</h2>
        <p className="mb-2">
          1. Enter the given numbers in the grid (1-9)
        </p>
        <p className="mb-2">
          2. Optionally, mark up to 3 cells with stars (click a color, then click cells)
        </p>
        <p>
          3. Click Solve to find the solution
        </p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Star Marking</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedStarColor(selectedStarColor === 'gold' ? null : 'gold')}
            className={`px-4 py-2 rounded ${
              selectedStarColor === 'gold'
                ? 'bg-yellow-400 text-white'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            } border-2 border-yellow-400`}
          >
            ⭐ Gold
          </button>
          <button
            onClick={() => setSelectedStarColor(selectedStarColor === 'purple' ? null : 'purple')}
            className={`px-4 py-2 rounded ${
              selectedStarColor === 'purple'
                ? 'bg-purple-400 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            } border-2 border-purple-400`}
          >
            ⭐ Purple
          </button>
          <button
            onClick={() => setSelectedStarColor(selectedStarColor === 'green' ? null : 'green')}
            className={`px-4 py-2 rounded ${
              selectedStarColor === 'green'
                ? 'bg-green-400 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } border-2 border-green-400`}
          >
            ⭐ Green
          </button>
          {selectedStarColor && (
            <button
              onClick={() => setSelectedStarColor(null)}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 inline-block">
        <div className="grid grid-cols-9 gap-0 border-4 border-gray-800 bg-gray-800">
          {displayGrid.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const isThickRightBorder = (colIndex + 1) % 3 === 0 && colIndex !== 8;
              const isThickBottomBorder = (rowIndex + 1) % 3 === 0 && rowIndex !== 8;
              const star = getStarForCell(rowIndex, colIndex);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    relative
                    ${isThickRightBorder ? 'border-r-2' : 'border-r'}
                    ${isThickBottomBorder ? 'border-b-2' : 'border-b'}
                    border-gray-400
                  `}
                >
                  {star && (
                    <div className="absolute top-0 right-0 text-xs p-0.5">
                      ⭐
                    </div>
                  )}
                  <input
                    type="text"
                    maxLength={1}
                    value={cell === null ? '' : cell}
                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={!!solvedGrid}
                    className={`
                      w-12 h-12 text-center text-xl font-semibold
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${getCellColor(rowIndex, colIndex)}
                      ${getCellTextColor(rowIndex, colIndex)}
                      ${solvedGrid ? 'cursor-default' : 'cursor-pointer'}
                      ${selectedStarColor ? 'cursor-crosshair' : ''}
                    `}
                  />
                </div>
              );
            })
          ))}
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleSolve}
          disabled={!!solvedGrid}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          Solve
        </button>
        <button
          onClick={handleClear}
          className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600 transition-colors font-semibold"
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {solvedGrid && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Puzzle solved successfully!
        </div>
      )}
    </div>
  );
}
