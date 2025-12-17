'use client';

import { useState, useEffect } from 'react';
import { solveSpelltower, createEmptyGrid, Grid, Cell, CellType } from '@/lib/solvers/spelltower';
import buttonStyles from '@/styles/components/button.module.css';
import solverStyles from '@/styles/solver.module.css';
import gridStyles from '@/styles/grid-solver.module.css';

const ROWS = 13;
const COLS = 9;
const STORAGE_KEY = 'spelltower-grid';

interface GameState {
  grid: Grid;
  solution: {
    sequence: Array<{
      word: string;
      path: { row: number; col: number }[];
      score: number;
      hasRedTile: boolean;
      hasStarredTile: boolean;
    }>;
    totalScore: number;
    clearedAll: boolean;
  } | null;
  totalScore: number;
}

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
  const [selectedWord, setSelectedWord] = useState<{ word: string; path: { row: number; col: number }[]; score: number } | null>(null);
  const [hoveredWord, setHoveredWord] = useState<{ word: string; path: { row: number; col: number }[]; score: number } | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [history, setHistory] = useState<GameState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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
    setSelectedWord(null);

    try {
      console.log('Starting solve with grid:', grid);
      const result = await solveSpelltower(grid);
      console.log('Solver result:', result);

      // Set total score to 0 when first solving
      const initialSolution = { ...result, totalScore: 0 };
      setSolution(initialSolution);

      // Save initial state to history
      const initialState: GameState = {
        grid: grid.map(row => row.map(cell => ({ ...cell }))),
        solution: initialSolution,
        totalScore: 0
      };

      setHistory([initialState]);
      setHistoryIndex(0);
    } catch (error) {
      console.error('Error solving:', error);
      alert('An error occurred while solving');
    } finally {
      setSolving(false);
    }
  };

  const applyGravity = (gridToModify: Grid): void => {
    for (let col = 0; col < COLS; col++) {
      // Collect non-blank cells from bottom to top
      const nonBlankCells: Cell[] = [];
      for (let row = ROWS - 1; row >= 0; row--) {
        if (gridToModify[row][col].type !== 'blank' && gridToModify[row][col].letter !== '') {
          nonBlankCells.push({ ...gridToModify[row][col] });
        }
      }

      // Fill column from bottom with non-blank cells
      for (let row = ROWS - 1; row >= 0; row--) {
        const cellIndex = ROWS - 1 - row;
        if (cellIndex < nonBlankCells.length) {
          gridToModify[row][col] = nonBlankCells[cellIndex];
        } else {
          gridToModify[row][col] = { letter: '', type: 'blank' };
        }
      }
    }
  };

  const handleUseWord = async () => {
    if (!selectedWord || !solution) return;

    // Create new grid with tiles removed
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));

    // Remove word path tiles
    for (const { row, col } of selectedWord.path) {
      newGrid[row][col] = { letter: '', type: 'blank' };
    }

    // Remove all bonus clear cells (5+ letter adjacent cells, red tile rows)
    const clearCells = getAdjacentClearCells();
    for (const { row, col } of clearCells) {
      newGrid[row][col] = { letter: '', type: 'blank' };
    }

    // Apply gravity
    applyGravity(newGrid);

    // Update total score
    const newTotalScore = totalScore + selectedWord.score;

    // Re-solve with new grid
    setSolving(true);
    try {
      const result = await solveSpelltower(newGrid);

      // Create the new state that we're moving to
      const newState: GameState = {
        grid: newGrid.map(row => row.map(cell => ({ ...cell }))),
        solution: { ...result, totalScore: newTotalScore },
        totalScore: newTotalScore
      };

      // Trim any future history if we're not at the end (branching timeline)
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      // Update to new state
      setGrid(newGrid);
      setSolution({ ...result, totalScore: newTotalScore });
      setTotalScore(newTotalScore);
      setSelectedWord(null);
    } catch (error) {
      console.error('Error solving:', error);
      alert('An error occurred while solving');
    } finally {
      setSolving(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;

    const previousState = history[historyIndex - 1];
    setGrid(previousState.grid.map(row => row.map(cell => ({ ...cell }))));
    setSolution(previousState.solution);
    setTotalScore(previousState.totalScore);
    setSelectedWord(null);
    setHistoryIndex(historyIndex - 1);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;

    const nextState = history[historyIndex + 1];
    setGrid(nextState.grid.map(row => row.map(cell => ({ ...cell }))));
    setSolution(nextState.solution);
    setTotalScore(nextState.totalScore);
    setSelectedWord(null);
    setHistoryIndex(historyIndex + 1);
  };

  const handleClear = () => {
    setGrid(createEmptyGrid());
    setSolution(null);
    setSelectedWord(null);
    setTotalScore(0);
    setHistory([]);
    setHistoryIndex(-1);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Get the active word (hovered or selected)
  const getActiveWord = () => hoveredWord || selectedWord;

  // Check if a cell is in the active word's path
  const isCellInPath = (row: number, col: number): boolean => {
    const activeWord = getActiveWord();
    if (!activeWord) return false;
    return activeWord.path.some(p => p.row === row && p.col === col);
  };

  // Get cells that would be cleared (adjacent for 5+ letter words, red rows, etc)
  const getAdjacentClearCells = (): { row: number; col: number }[] => {
    const activeWord = getActiveWord();
    if (!activeWord) return [];

    const clearCells: { row: number; col: number }[] = [];
    const pathSet = new Set(activeWord.path.map(p => `${p.row},${p.col}`));

    // Add adjacent cells for 5+ letter words
    if (activeWord.word.length >= 5) {
      for (const { row, col } of activeWord.path) {
        // Check all 4 adjacent directions (not diagonals)
        const adjacent = [
          { row: row - 1, col },
          { row: row + 1, col },
          { row, col: col - 1 },
          { row, col: col + 1 }
        ];

        for (const adj of adjacent) {
          const key = `${adj.row},${adj.col}`;
          if (
            adj.row >= 0 && adj.row < ROWS &&
            adj.col >= 0 && adj.col < COLS &&
            !pathSet.has(key) &&
            !clearCells.some(c => c.row === adj.row && c.col === adj.col)
          ) {
            clearCells.push(adj);
          }
        }
      }
    }

    // Add entire rows for red tiles
    for (const { row, col } of activeWord.path) {
      if (grid[row][col].type === 'red') {
        // Add all cells in this row
        for (let c = 0; c < COLS; c++) {
          const key = `${row},${c}`;
          if (
            !pathSet.has(key) &&
            !clearCells.some(cell => cell.row === row && cell.col === c)
          ) {
            clearCells.push({ row, col: c });
          }
        }
      }
    }

    return clearCells;
  };

  const getCellClassName = (cell: Cell, row: number, col: number): string => {
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

    // Add highlight classes for selected word
    if (isCellInPath(row, col)) {
      classes.push(gridStyles.cellHighlightGreen);
    } else if (getAdjacentClearCells().some(c => c.row === row && c.col === col)) {
      classes.push(gridStyles.cellHighlightOrange);
    }

    return classes.join(' ');
  };

  return (
    <div className={solverStyles.solverContainer}>
      <h1 className={solverStyles.solverTitle} style={{ marginBottom: '2rem' }}>Spelltower Solver</h1>

      {!solution && (
        <div className={solverStyles.infoBox}>
          <h2>How to use</h2>
          <p>1. Enter letters in the grid (9 columns × 13 rows). Press space for blank cells. The cursor will automatically advance when you enter a valid letter or space.</p>
          <p>2. Select a cell type and click cells to mark them as red or starred</p>
          <p>3. Click Solve to find the optimal word sequence</p>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: solution ? '1fr 2fr' : '1fr',
        gap: '2rem',
        alignItems: 'start'
      }}>
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
              <div style={{ position: 'relative' }}>
                <div className={gridStyles.spelltowerGrid} style={{
                  transform: solution ? 'scale(0.85)' : 'scale(1)',
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease'
                }}>
                  {grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <input
                        key={`${rowIndex}-${colIndex}`}
                        type="text"
                        maxLength={1}
                        value={cell.letter}
                        onChange={(e) => handleCellLetterChange(rowIndex, colIndex, e.target.value)}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={getCellClassName(cell, rowIndex, colIndex)}
                        disabled={solving}
                        data-row={rowIndex}
                        data-col={colIndex}
                      />
                    ))
                  )}
                </div>
                {getActiveWord() && (
                  <svg
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 10,
                      transform: solution ? 'scale(0.85)' : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'transform 0.3s ease'
                    }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points={getActiveWord()!.path.map((p) => {
                        const cellWidth = 100 / COLS;
                        const cellHeight = 100 / ROWS;
                        const x = (p.col + 0.5) * cellWidth;
                        const y = (p.row + 0.5) * cellHeight;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="white"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity=".3"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className={buttonStyles.buttonGroup} style={{ justifyContent: 'center' }}>
              {selectedWord && (
                <button
                  onClick={handleUseWord}
                  disabled={solving}
                  className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}
                  style={{ fontSize: '1.125rem' }}
                >
                  Use Word
                </button>
              )}
              <button
                onClick={handleSolve}
                disabled={solving}
                className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}
                style={{ fontSize: '1.125rem' }}
              >
                {solving ? 'Solving...' : 'Solve'}
              </button>
              <button
                onClick={handleUndo}
                disabled={solving || historyIndex <= 0}
                className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
              >
                Undo
              </button>
              <button
                onClick={handleRedo}
                disabled={solving || historyIndex >= history.length - 1}
                className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
              >
                Redo
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 12rem)',
              position: 'sticky',
              top: '2rem'
            }}>
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '2px solid #34d399',
                marginBottom: '1.5rem',
                flexShrink: 0
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>
                  Total Score: {totalScore}
                </div>
              </div>

              <div style={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: 'white',
                borderRadius: '0.75rem',
                border: '2px solid #e5e7eb'
              }}>
                <h3 className={solverStyles.sectionTitle} style={{
                  margin: '1rem 1.5rem',
                  flexShrink: 0
                }}>Words Found:</h3>
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.375rem',
                  padding: '0 1.5rem 1.5rem 1.5rem',
                  backgroundColor: '#f9fafb',
                  alignContent: 'flex-start'
                }}>
                  {solution.sequence.map((wordPath, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedWord(wordPath)}
                      onMouseEnter={() => setHoveredWord(wordPath)}
                      onMouseLeave={() => setHoveredWord(null)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: selectedWord?.word === wordPath.word &&
                                         selectedWord?.path[0].row === wordPath.path[0].row &&
                                         selectedWord?.path[0].col === wordPath.path[0].col
                          ? '#dbeafe'
                          : hoveredWord?.word === wordPath.word &&
                            hoveredWord?.path[0].row === wordPath.path[0].row &&
                            hoveredWord?.path[0].col === wordPath.path[0].col
                          ? '#f3f4f6'
                          : '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        color: '#1f2937',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        height: 'fit-content'
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{wordPath.word}</span>
                      {wordPath.hasStarredTile && <span style={{ marginLeft: '0.25rem' }}>⭐</span>}
                      <span style={{ marginLeft: '0.375rem', color: '#059669', fontSize: '0.75rem' }}>
                        +{wordPath.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
