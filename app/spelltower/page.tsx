'use client';

import { useState, useEffect } from 'react';
import { solveSpelltower, createEmptyGrid, Grid, Cell, CellType } from '@/lib/solvers/spelltower';
import buttonStyles from '@/styles/components/button.module.css';
import solverStyles from '@/styles/solver.module.css';
import gridStyles from '@/styles/grid-solver.module.css';

const ROWS = 13;
const COLS = 9;
const STORAGE_KEY = 'spelltower-grid';

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

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGrid(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved grid:', e);
      }
    }
  }, []);

  // Save grid to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grid));
  }, [grid]);

  const handleCellLetterChange = (row: number, col: number, value: string) => {
    const newGrid = grid.map(r => r.map(c => ({ ...c })));

    // Allow space to clear a cell
    if (value === ' ') {
      newGrid[row][col].letter = '';
      newGrid[row][col].type = 'blank';
      setGrid(newGrid);
      setSolution(null);
      // Auto-tab to next cell
      focusNextCell(row, col);
      return;
    }

    const sanitized = value.toUpperCase().replace(/[^A-Z]/g, '');

    if (sanitized) {
      newGrid[row][col].letter = sanitized.charAt(0);
      if (newGrid[row][col].type === 'blank') {
        newGrid[row][col].type = 'letter';
      }
      setGrid(newGrid);
      setSolution(null);
      // Auto-tab to next cell
      focusNextCell(row, col);
    } else {
      newGrid[row][col].letter = '';
      newGrid[row][col].type = 'blank';
      setGrid(newGrid);
      setSolution(null);
    }
  };

  const focusNextCell = (row: number, col: number) => {
    let nextRow = row;
    let nextCol = col + 1;

    // Move to next row if at end of current row
    if (nextCol >= COLS) {
      nextCol = 0;
      nextRow = row + 1;
    }

    // If we're at the last cell, don't focus anything
    if (nextRow >= ROWS) {
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

  const handleCellClick = (row: number, col: number) => {
    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    const cell = newGrid[row][col];

    if (selectedCellType === 'blank') {
      cell.letter = '';
      cell.type = 'blank';
    } else if (cell.letter) {
      cell.type = selectedCellType;
    }

    setGrid(newGrid);
    setSolution(null);
  };

  const handleSolve = async () => {
    setSolving(true);
    setSolution(null);

    try {
      console.log('Starting solve with grid:', grid);
      const result = await solveSpelltower(grid);
      console.log('Solver result:', result);
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
    localStorage.removeItem(STORAGE_KEY);
  };

  const getCellClassName = (cell: Cell): string => {
    const classes = [gridStyles.spelltowerCell];

    if (cell.type === 'blank' || !cell.letter) {
      classes.push(gridStyles.cellTypeBlank);
    } else {
      switch (cell.type) {
        case 'red':
          classes.push(gridStyles.cellTypeRed);
          break;
        case 'starred':
          classes.push(gridStyles.cellTypeStarred);
          break;
        default:
          classes.push(gridStyles.cellTypeNormal);
      }
    }

    return classes.join(' ');
  };

  return (
    <div className={solverStyles.solverContainer}>
      <h1 className={solverStyles.solverTitle} style={{ marginBottom: '2rem' }}>Spelltower Solver</h1>

      <div className={solverStyles.infoBox}>
        <h2>How to use</h2>
        <p>1. Enter letters in the grid (9 columns × 13 rows). Press space for blank cells. The cursor will automatically advance when you enter a valid letter or space.</p>
        <p>2. Select a cell type and click cells to mark them as red or starred</p>
        <p>3. Click Solve to find the optimal word sequence</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="lg:grid-cols-2">
        <div>
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h3 className={solverStyles.sectionTitle}>Cell Type</h3>
            <div className={gridStyles.cellTypeButtons} style={{ justifyContent: 'center' }}>
              <button
                onClick={() => setSelectedCellType('letter')}
                className={`${gridStyles.cellTypeButton} ${gridStyles.cellTypeButtonNormal} ${
                  selectedCellType === 'letter' ? 'active' : ''
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setSelectedCellType('red')}
                className={`${gridStyles.cellTypeButton} ${gridStyles.cellTypeButtonRed} ${
                  selectedCellType === 'red' ? 'active' : ''
                }`}
              >
                Red
              </button>
              <button
                onClick={() => setSelectedCellType('starred')}
                className={`${gridStyles.cellTypeButton} ${gridStyles.cellTypeButtonStarred} ${
                  selectedCellType === 'starred' ? 'active' : ''
                }`}
              >
                ⭐ Starred
              </button>
              <button
                onClick={() => setSelectedCellType('blank')}
                className={`${gridStyles.cellTypeButton} ${gridStyles.cellTypeButtonBlank} ${
                  selectedCellType === 'blank' ? 'active' : ''
                }`}
              >
                Blank
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div className={gridStyles.gridContainer}>
              <div className={gridStyles.spelltowerGrid}>
                {grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <input
                      key={`${rowIndex}-${colIndex}`}
                      type="text"
                      maxLength={1}
                      value={cell.letter}
                      onChange={(e) => handleCellLetterChange(rowIndex, colIndex, e.target.value)}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      className={getCellClassName(cell)}
                      disabled={solving}
                      data-row={rowIndex}
                      data-col={colIndex}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className={buttonStyles.buttonGroup} style={{ justifyContent: 'center' }}>
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
        </div>

        <div>
          {solving && (
            <div className={solverStyles.resultSection} style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
              border: '2px solid rgba(59, 130, 246, 0.3)'
            }}>
              <p style={{ color: '#1e40af', fontWeight: 600, margin: 0 }}>
                Searching for optimal word sequence... This may take a moment.
              </p>
            </div>
          )}

          {solution && (
            <div className={`${solverStyles.resultSection} ${solverStyles.coreResultSection}`}>
              <h2>Solution Found!</h2>

              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '2px solid #34d399',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Total Score: {solution.totalScore}
                </div>
                <div style={{ fontSize: '0.9375rem', color: '#059669', marginBottom: '0.25rem' }}>
                  {solution.clearedAll ? '✓ All tiles cleared!' : 'Some tiles remaining'}
                </div>
                <div style={{ fontSize: '0.9375rem', color: '#4b5563' }}>
                  Word sequence: {solution.sequence.length} words
                </div>
              </div>

              <h3 className={solverStyles.sectionTitle}>Word Sequence:</h3>
              <div className={gridStyles.solutionSequence}>
                {solution.sequence.map((wordPath, idx) => (
                  <div key={idx} className={gridStyles.sequenceItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                          {idx + 1}. {wordPath.word}
                        </span>
                        {wordPath.hasStarredTile && <span style={{ marginLeft: '0.5rem', color: '#ca8a04' }}>⭐</span>}
                        {wordPath.hasRedTile && (
                          <span style={{ marginLeft: '0.5rem', color: '#dc2626', fontSize: '0.875rem' }}>
                            (red tile)
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#059669', fontWeight: 700 }}>
                        +{wordPath.score}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
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
