'use client';

import { useState } from 'react';
import { solveSpelltower, createEmptyGrid, Grid, Cell, CellType } from '@/lib/solvers/spelltower';

const ROWS = 13;
const COLS = 9;

export default function SpelltowerPage() {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid());
  const [solving, setSolving] = useState(false);
  const [solution, setSolution] = useState<{
    sequence: Array<{
      word: string;
      path: { row: number; col: number }[];
      score: number;
      hasRedTile: boolean;
      hasStarredTile: boolean;
    }>;
    totalScore: number;
    clearedAll: boolean;
  } | null>(null);
  const [selectedCellType, setSelectedCellType] = useState<CellType>('letter');

  const handleCellLetterChange = (row: number, col: number, value: string) => {
    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    const sanitized = value.toUpperCase().replace(/[^A-Z]/g, '');

    if (sanitized) {
      newGrid[row][col].letter = sanitized.charAt(0);
      if (newGrid[row][col].type === 'blank') {
        newGrid[row][col].type = 'letter';
      }
    } else {
      newGrid[row][col].letter = '';
      newGrid[row][col].type = 'blank';
    }

    setGrid(newGrid);
    setSolution(null);
  };

  const handleCellClick = (row: number, col: number) => {
    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    const cell = newGrid[row][col];

    if (selectedCellType === 'blank') {
      cell.letter = '';
      cell.type = 'blank';
    } else if (cell.letter) {
      // Only change type if there's a letter
      cell.type = selectedCellType;
    }

    setGrid(newGrid);
    setSolution(null);
  };

  const handleSolve = async () => {
    setSolving(true);
    setSolution(null);

    try {
      const result = await solveSpelltower(grid);
      setSolution(result);
    } catch (error) {
      console.error('Error solving:', error);
      alert('An error occurred while solving');
    } finally {
      setSolving(false);
    }
  };

  const handleClear = () => {
    setGrid(createEmptyGrid());
    setSolution(null);
  };

  const getCellStyle = (cell: Cell): string => {
    if (cell.type === 'blank' || !cell.letter) {
      return 'bg-gray-100 text-gray-400';
    }

    switch (cell.type) {
      case 'red':
        return 'bg-red-200 text-red-900 font-bold';
      case 'starred':
        return 'bg-yellow-100 text-yellow-900 font-bold';
      default:
        return 'bg-white text-gray-900';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Spelltower Solver</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">How to use</h2>
            <p className="text-sm mb-2">
              1. Enter letters in the grid (9 columns × 13 rows)
            </p>
            <p className="text-sm mb-2">
              2. Select a cell type and click cells to mark them as red or starred
            </p>
            <p className="text-sm">
              3. Click Solve to find the optimal word sequence
            </p>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Cell Type</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCellType('letter')}
                className={`px-4 py-2 rounded border-2 ${
                  selectedCellType === 'letter'
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Normal Letter
              </button>
              <button
                onClick={() => setSelectedCellType('red')}
                className={`px-4 py-2 rounded border-2 ${
                  selectedCellType === 'red'
                    ? 'bg-red-500 text-white border-red-600'
                    : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
                }`}
              >
                Red (clears row)
              </button>
              <button
                onClick={() => setSelectedCellType('starred')}
                className={`px-4 py-2 rounded border-2 ${
                  selectedCellType === 'starred'
                    ? 'bg-yellow-500 text-white border-yellow-600'
                    : 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200'
                }`}
              >
                ⭐ Starred (2x score)
              </button>
              <button
                onClick={() => setSelectedCellType('blank')}
                className={`px-4 py-2 rounded border-2 ${
                  selectedCellType === 'blank'
                    ? 'bg-gray-500 text-white border-gray-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                Blank
              </button>
            </div>
          </div>

          <div className="mb-4 overflow-x-auto">
            <div className="inline-block border-4 border-gray-800">
              <div className="grid gap-0">
                {grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((cell, colIndex) => (
                      <input
                        key={`${rowIndex}-${colIndex}`}
                        type="text"
                        maxLength={1}
                        value={cell.letter}
                        onChange={(e) => handleCellLetterChange(rowIndex, colIndex, e.target.value)}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`
                          w-10 h-10 text-center text-lg font-semibold border border-gray-300
                          focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase
                          ${getCellStyle(cell)}
                        `}
                        disabled={solving}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSolve}
              disabled={solving}
              className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {solving ? 'Solving...' : 'Solve'}
            </button>
            <button
              onClick={handleClear}
              disabled={solving}
              className="bg-gray-500 text-white py-3 px-6 rounded hover:bg-gray-600 transition-colors disabled:bg-gray-400 font-semibold"
            >
              Clear
            </button>
          </div>
        </div>

        <div>
          {solving && (
            <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              Searching for optimal word sequence... This may take a moment.
            </div>
          )}

          {solution && (
            <div className="bg-green-50 p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4 text-green-800">
                Solution Found!
              </h2>

              <div className="mb-4 p-4 bg-white rounded border-2 border-green-300">
                <div className="text-lg font-semibold">
                  Total Score: {solution.totalScore}
                </div>
                <div className="text-sm text-gray-600">
                  {solution.clearedAll ? 'All tiles cleared!' : 'Some tiles remaining'}
                </div>
                <div className="text-sm text-gray-600">
                  Word sequence: {solution.sequence.length} words
                </div>
              </div>

              <h3 className="font-semibold mb-2">Word Sequence:</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {solution.sequence.map((wordPath, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border border-green-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-mono text-lg font-bold">{idx + 1}. {wordPath.word}</span>
                        {wordPath.hasStarredTile && <span className="ml-2 text-yellow-600">⭐</span>}
                        {wordPath.hasRedTile && (
                          <span className="ml-2 text-red-600 text-sm">(red tile)</span>
                        )}
                      </div>
                      <div className="text-green-700 font-semibold">
                        +{wordPath.score}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {wordPath.word.length} letters
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
