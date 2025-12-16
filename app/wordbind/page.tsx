'use client';

import { useState } from 'react';
import { solveWordbind } from '@/lib/solvers/wordbind';
import buttonStyles from '@/styles/components/button.module.css';
import inputStyles from '@/styles/components/input.module.css';
import solverStyles from '@/styles/solver.module.css';

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
    <div className={solverStyles.solverContainer}>
      <h1 className={solverStyles.solverTitle} style={{ marginBottom: '2rem' }}>Wordbind Solver</h1>

      <div className={solverStyles.infoBox}>
        <h2>How it works</h2>
        <p>
          Enter 2-3 source words. The solver will find all possible words that can be formed by:
        </p>
        <ul style={{ listStyleType: 'disc', marginLeft: '2rem', marginTop: '0.5rem' }}>
          <li>Using letters from the source in the order they appear (left-to-right)</li>
          <li>Optionally using a letter twice to create a double letter</li>
          <li>Not including the exact source words in the output</li>
        </ul>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Example: From "SAMPLE CARD", you can make "SAMPLER", "APPLE", "CLAD", etc.
        </p>
      </div>

      <div className={solverStyles.setupCard} style={{ marginBottom: '2rem' }}>
        <div className={inputStyles.inputGroup}>
          <label className={inputStyles.inputLabel}>Source Words (2-3 words):</label>
          <input
            type="text"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="e.g., SAMPLE CARD"
            className={inputStyles.input}
            disabled={solving}
            style={{ fontSize: '1.125rem' }}
          />
        </div>

        <div className={buttonStyles.buttonGroup}>
          <button
            onClick={handleSolve}
            disabled={solving}
            className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}
            style={{ fontSize: '1.125rem' }}
          >
            {solving ? 'Solving...' : 'Solve'}
          </button>
          <button
            onClick={handleClear}
            disabled={solving}
            className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className={`${solverStyles.resultSection}`} style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          marginBottom: '1.5rem'
        }}>
          <p style={{ color: '#991b1b', fontWeight: 600, margin: 0 }}>{error}</p>
        </div>
      )}

      {solving && (
        <div className={`${solverStyles.resultSection}`} style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          marginBottom: '1.5rem'
        }}>
          <p style={{ color: '#1e40af', fontWeight: 600, margin: 0 }}>
            Searching for valid words... This may take a moment.
          </p>
        </div>
      )}

      {solution && (
        <div className={`${solverStyles.resultSection} ${solverStyles.coreResultSection}`}>
          <h2>
            Found {solution.totalWords} valid words
          </h2>

          {solution.totalWords === 0 ? (
            <p className={solverStyles.resultDescription}>No valid words found for this input.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {Array.from(new Set(solution.words.map(w => w.length)))
                .sort((a, b) => b - a)
                .filter(length => length >= 5)
                .map(length => {
                  const wordsOfLength = solution.words.filter(w => w.length === length);
                  return (
                    <div key={length}>
                      <h3 style={{
                        fontWeight: 600,
                        color: '#065f46',
                        marginBottom: '0.75rem',
                        fontSize: '1.125rem'
                      }}>
                        {length}-letter words ({wordsOfLength.length}):
                      </h3>
                      <div className={solverStyles.wordGrid}>
                        {wordsOfLength.map((word, idx) => (
                          <div
                            key={idx}
                            className={`${solverStyles.wordCard} ${solverStyles.coreWordCard}`}
                            style={{ fontSize: '0.9375rem' }}
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
