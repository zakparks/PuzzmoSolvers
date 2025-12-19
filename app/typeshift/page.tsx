'use client';

import { useState } from 'react';
import { solveTypeshift, TypeshiftColumn } from '@/lib/solvers/typeshift';
import buttonStyles from '@/styles/components/button.module.css';
import inputStyles from '@/styles/components/input.module.css';
import solverStyles from '@/styles/solver.module.css';

export default function TypeshiftPage() {
  const [columns, setColumns] = useState<TypeshiftColumn[]>(
    Array(5).fill(null).map(() => ({ letters: [''] }))
  );
  const [solving, setSolving] = useState(false);
  const [solution, setSolution] = useState<{
    allWords: string[];
    coreWords: string[];
    usedLettersCount: number;
    totalLetters: number;
  } | null>(null);

  const handleColumnTextChange = (colIndex: number, value: string) => {
    const newColumns = [...columns];
    // Convert text to uppercase, filter only letters, and split into array
    const sanitized = value.toUpperCase().replace(/[^A-Z]/g, '');
    const letters = sanitized.split('');
    newColumns[colIndex].letters = letters.length > 0 ? letters : [''];
    setColumns(newColumns);
  };

  const handleAddColumn = () => {
    setColumns([...columns, { letters: [''] }]);
  };

  const handleRemoveColumn = () => {
    if (columns.length > 1) {
      setColumns(columns.slice(0, -1));
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
    setColumns(Array(5).fill(null).map(() => ({ letters: [''] })));
    setSolution(null);
  };

  return (
    <div className={solverStyles.solverContainer}>
      <h1 className={`${solverStyles.solverTitle} ${solverStyles.mb2}`}>Typeshift Solver</h1>

      <div className={solverStyles.infoBox}>
        <h2>How it works</h2>
        <p>
          Typeshift puzzles consist of columns of letters. You shift each column to form valid words
          by taking one letter from each column.
        </p>
        <p>
          This solver will find all possible valid words and calculate the minimal core solution set.
        </p>
        <p>
          Enter values column by column. You can add and remove columns as needed with the + and - buttons.
        </p>
      </div>

      <div className={solverStyles.mb2}>
        <h2 className={solverStyles.sectionTitle}>Enter Letters (top to bottom)</h2>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '1rem' }}>
          <div className={solverStyles.columnGrid}>
          {columns.map((column, colIndex) => (
            <div key={colIndex} className={solverStyles.column}>
              <div className={solverStyles.columnHeader}>
                Column {colIndex + 1}
              </div>
              <textarea
                value={column.letters.join('\n')}
                onChange={(e) => handleColumnTextChange(colIndex, e.target.value)}
                rows={Math.max(3, column.letters.filter(l => l).length)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  border: '2px solid #d1d5db',
                  borderRadius: '0.75rem',
                  fontFamily: 'inherit',
                  resize: 'none',
                  lineHeight: '1.5',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  overflow: 'hidden',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={handleAddColumn}
              className={`${buttonStyles.button} ${buttonStyles.buttonSuccess}`}
              style={{ width: '3rem', height: '3rem', fontSize: '1.5rem', padding: '0' }}
              title="Add column"
            >
              +
            </button>
            <button
              onClick={handleRemoveColumn}
              disabled={columns.length <= 1}
              className={`${buttonStyles.button} ${buttonStyles.buttonDanger}`}
              style={{ width: '3rem', height: '3rem', fontSize: '1.5rem', padding: '0' }}
              title="Remove column"
            >
              −
            </button>
          </div>
        </div>
      </div>

      <div className={`${solverStyles.mb2} ${solverStyles.justifyCenter}`} style={{ display: 'flex' }}>
        <button
          onClick={handleSolve}
          disabled={solving}
          className={`${buttonStyles.button} ${buttonStyles.buttonPrimary} ${solverStyles['fontSize-lg']}`}
          style={{ width: '40%', padding: '1rem 1.5rem' }}
        >
          {solving ? 'Solving...' : 'Solve'}
        </button>
      </div>

      {solution && (
        <div>
          <div className={`${solverStyles.resultSection} ${solverStyles.coreResultSection}`}>
            <h2>Core Solution</h2>
            <p className={solverStyles.resultDescription}>
              Minimal core solution ({solution.coreWords.length} words):
            </p>
            <div className={solverStyles.wordGrid}>
              {solution.coreWords.map((word, idx) => (
                <div key={idx} className={`${solverStyles.wordCard} ${solverStyles.coreWordCard}`}>
                  {word}
                </div>
              ))}
            </div>
          </div>

          <div className={`${solverStyles.resultSection} ${solverStyles.allWordsSection}`}>
            <h2>
              All Valid Words ({solution.allWords.length})
            </h2>
            <div className={solverStyles.allWordsGrid}>
              {solution.allWords.map((word, idx) => (
                <div key={idx} className={`${solverStyles.wordCard} ${solverStyles.allWordCard}`}>
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
