'use client';

import { useState } from 'react';
import { solveTypeshift, TypeshiftColumn } from '@/lib/solvers/typeshift';
import buttonStyles from '@/styles/components/button.module.css';
import inputStyles from '@/styles/components/input.module.css';
import solverStyles from '@/styles/solver.module.css';

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
      <div className={solverStyles.setupContainer}>
        <h1 className={solverStyles.solverTitle} style={{ marginBottom: '2rem' }}>Typeshift Solver</h1>

        <div className={solverStyles.infoBox}>
          <h2>How it works</h2>
          <p>
            Typeshift puzzles consist of columns of letters. You shift each column to form valid words
            by taking one letter from each column.
          </p>
          <p>
            This solver will find all possible valid words and calculate the minimal core solution set.
          </p>
        </div>

        <div className={solverStyles.setupCard}>
          <div className={inputStyles.inputGroup}>
            <label className={inputStyles.inputLabel}>Number of Columns:</label>
            <input
              type="number"
              min="2"
              max="10"
              value={numColumns}
              onChange={(e) => setNumColumns(parseInt(e.target.value) || 2)}
              className={inputStyles.input}
            />
          </div>

          <button
            onClick={handleConfigureColumns}
            className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}
            style={{ width: '100%' }}
          >
            Configure Columns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={solverStyles.solverContainer}>
      <div className={solverStyles.solverHeader}>
        <h1 className={solverStyles.solverTitle}>Typeshift Solver</h1>
        <button
          onClick={handleReset}
          className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
        >
          Reset
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 className={solverStyles.sectionTitle}>Enter Letters (top to bottom)</h2>
        <div className={solverStyles.columnGrid}>
          {columns.map((column, colIndex) => (
            <div key={colIndex} className={solverStyles.column}>
              <div className={solverStyles.columnHeader}>
                Column {colIndex + 1}
              </div>
              <div className={solverStyles.letterInputs}>
                {column.letters.map((letter, letterIndex) => (
                  <div key={letterIndex} className={solverStyles.letterRow}>
                    <input
                      type="text"
                      maxLength={1}
                      value={letter}
                      onChange={(e) => handleLetterChange(colIndex, letterIndex, e.target.value)}
                      className={solverStyles.letterInput}
                    />
                    {column.letters.length > 1 && (
                      <button
                        onClick={() => handleRemoveLetter(colIndex, letterIndex)}
                        className={solverStyles.removeButton}
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
                className={`${buttonStyles.button} ${buttonStyles.buttonSuccess} ${buttonStyles.buttonSmall}`}
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                + Add Letter
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={handleSolve}
          disabled={solving}
          className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}
          style={{ width: '100%', fontSize: '1.125rem', padding: '1rem 1.5rem' }}
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
