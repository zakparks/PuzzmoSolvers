'use client';

import { useState } from 'react';
import { solveWordbind } from '@/lib/solvers/wordbind';

export default function WordbindPage() {
  const [sourceText, setSourceText] = useState('');
  const [solving, setSolving] = useState(false);
  const [solution, setSolution] = useState<{ words: string[]; totalWords: number } | null>(null);
  const [error, setError] = useState('');

  const handleSolve = async () => {
    setError('');
    setSolution(null);

    if (!sourceText.trim()) {
      setError('Please enter source words');
      return;
    }

    const wordCount = sourceText.trim().split(/\s+/).length;
    if (wordCount < 2 || wordCount > 3) {
      setError('Please enter 2-3 words');
      return;
    }

    setSolving(true);

    try {
      const result = await solveWordbind(sourceText);
      setSolution(result);
    } catch (err) {
      console.error('Error solving:', err);
      setError('An error occurred while solving');
    } finally {
      setSolving(false);
    }
  };

  const handleClear = () => {
    setSourceText('');
    setSolution(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Wordbind Solver</h1>

      <div className="mb-6 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">How it works</h2>
        <p className="mb-2">
          Enter 2-3 source words. The solver will find all possible words that can be formed by:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Using letters from the source in the order they appear (left-to-right)</li>
          <li>Optionally using a letter twice to create a double letter</li>
          <li>Not including the exact source words in the output</li>
        </ul>
        <p className="mt-3 text-sm text-gray-600">
          Example: From "SAMPLE CARD", you can make "SAMPLER", "APPLE", "CLAD", etc.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <label className="block mb-4">
          <span className="text-gray-700 font-semibold">Source Words (2-3 words):</span>
          <input
            type="text"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="e.g., SAMPLE CARD"
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border text-lg"
            disabled={solving}
          />
        </label>

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

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
          {error}
        </div>
      )}

      {solving && (
        <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded mb-6">
          Searching for valid words... This may take a moment.
        </div>
      )}

      {solution && (
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4 text-green-800">
            Found {solution.totalWords} valid words
          </h2>

          {solution.totalWords === 0 ? (
            <p className="text-gray-600">No valid words found for this input.</p>
          ) : (
            <div className="space-y-4">
              {/* Group by word length */}
              {Array.from(new Set(solution.words.map(w => w.length)))
                .sort((a, b) => b - a)
                .map(length => {
                  const wordsOfLength = solution.words.filter(w => w.length === length);
                  return (
                    <div key={length}>
                      <h3 className="font-semibold text-gray-700 mb-2">
                        {length}-letter words ({wordsOfLength.length}):
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {wordsOfLength.map((word, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-2 rounded border border-green-300 font-mono text-sm"
                          >
                            {word}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
