'use client';

import { useState } from 'react';
import { solveTypeshift, TypeshiftColumn } from '@/lib/solvers/typeshift';

export default function TypeshiftPage() {
  const [numColumns, setNumColumns] = useState<number>(5);
  const [columns, setColumns] = useState<TypeshiftColumn[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [solving, setSolving] = useState(false);
  const [solution, setSolution] = useState<{
    allWords: string[];
    coreWords: string[];
    usedLettersCount: number;
    totalLetters: number;
  } | null>(null);

  const handleConfigureColumns = () => {
    const newColumns: TypeshiftColumn[] = Array(numColumns).fill(null).map(() => ({
      letters: [''],
    }));
    setColumns(newColumns);
    setIsConfigured(true);
    setSolution(null);
  };

  const handleLetterChange = (colIndex: number, letterIndex: number, value: string) => {
    const newColumns = [...columns];
    const sanitized = value.toUpperCase().replace(/[^A-Z]/g, '');
    newColumns[colIndex].letters[letterIndex] = sanitized;
    setColumns(newColumns);
  };

  const handleAddLetter = (colIndex: number) => {
    const newColumns = [...columns];
    newColumns[colIndex].letters.push('');
    setColumns(newColumns);
  };

  const handleRemoveLetter = (colIndex: number, letterIndex: number) => {
    const newColumns = [...columns];
    if (newColumns[colIndex].letters.length > 1) {
      newColumns[colIndex].letters.splice(letterIndex, 1);
      setColumns(newColumns);
    }
  };

  const handleSolve = async () => {
    setSolving(true);
    setSolution(null);

    try {
      // Filter out empty columns and empty letters
      const validColumns = columns.map(col => ({
        letters: col.letters.filter(l => l.length > 0)
      })).filter(col => col.letters.length > 0);

      if (validColumns.length === 0) {
        alert('Please enter letters in at least one column');
        setSolving(false);
        return;
      }

      const result = await solveTypeshift(validColumns);
      setSolution(result);
    } catch (error) {
      console.error('Error solving:', error);
      alert('An error occurred while solving');
    } finally {
      setSolving(false);
    }
  };

  const handleReset = () => {
    setIsConfigured(false);
    setColumns([]);
    setSolution(null);
  };

  if (!isConfigured) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Typeshift Solver</h1>

        <div className="mb-6 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">How it works</h2>
          <p className="mb-2">
            Typeshift puzzles consist of columns of letters. You shift each column to form valid words
            by taking one letter from each column.
          </p>
          <p>
            This solver will find all possible valid words and calculate the minimal core solution set.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block mb-4">
            <span className="text-gray-700 font-semibold">Number of Columns:</span>
            <input
              type="number"
              min="2"
              max="10"
              value={numColumns}
              onChange={(e) => setNumColumns(parseInt(e.target.value) || 2)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />
          </label>

          <button
            onClick={handleConfigureColumns}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors font-semibold"
          >
            Configure Columns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Typeshift Solver</h1>
        <button
          onClick={handleReset}
          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Enter Letters (top to bottom)</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex-shrink-0">
              <div className="bg-white p-4 rounded-lg shadow border-2 border-gray-200">
                <div className="text-center font-semibold mb-2 text-gray-700">
                  Column {colIndex + 1}
                </div>
                <div className="space-y-2">
                  {column.letters.map((letter, letterIndex) => (
                    <div key={letterIndex} className="flex gap-1">
                      <input
                        type="text"
                        maxLength={1}
                        value={letter}
                        onChange={(e) => handleLetterChange(colIndex, letterIndex, e.target.value)}
                        className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none uppercase"
                      />
                      {column.letters.length > 1 && (
                        <button
                          onClick={() => handleRemoveLetter(colIndex, letterIndex)}
                          className="text-red-500 hover:text-red-700 px-2"
                          title="Remove letter"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleAddLetter(colIndex)}
                  className="mt-2 w-full bg-green-500 text-white py-1 rounded hover:bg-green-600 text-sm"
                >
                  + Add Letter
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={handleSolve}
          disabled={solving}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {solving ? 'Solving...' : 'Solve'}
        </button>
      </div>

      {solution && (
        <div className="space-y-6">
          <div className="bg-green-50 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-green-800">Core Solution</h2>
            <p className="mb-2 text-gray-700">
              Minimal core solution ({solution.coreWords.length} words):
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {solution.coreWords.map((word, idx) => (
                <div key={idx} className="bg-white p-2 rounded border-2 border-green-300 font-mono text-lg">
                  {word}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">
              All Valid Words ({solution.allWords.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 max-h-96 overflow-y-auto">
              {solution.allWords.map((word, idx) => (
                <div key={idx} className="bg-white p-2 rounded border border-blue-200 font-mono">
                  {word}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
