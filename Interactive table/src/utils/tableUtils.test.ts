import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getColumnLabel,
  parseColumnLabel,
  getCellId,
  parseCellId,
  parseRange,
  createEmptyGrid,
  evaluateCell,
  exportGridToCSV,
  parseCSV,
  TOTAL_ROWS,
  TOTAL_COLS,
  GridData,
  calculateNextCell,
  shouldNavigateOnHorizontalArrow,
} from './tableUtils';

test('column labels convert correctly for 20 columns (0 to 19)', () => {
  assert.equal(getColumnLabel(0), 'A');
  assert.equal(getColumnLabel(1), 'B');
  assert.equal(getColumnLabel(19), 'T'); // 20th column is T
  assert.equal(parseColumnLabel('A'), 0);
  assert.equal(parseColumnLabel('B'), 1);
  assert.equal(parseColumnLabel('T'), 19);
});

test('cell IDs parse and format accurately', () => {
  assert.equal(getCellId(0, 0), 'A1');
  assert.equal(getCellId(19, 19), 'T20');

  assert.deepEqual(parseCellId('A1'), { row: 0, col: 0 });
  assert.deepEqual(parseCellId('T20'), { row: 19, col: 19 });
  assert.equal(parseCellId('INVALID'), null);
});

test('range parsing parses single cell and rectangles correctly', () => {
  const single = parseRange('A1');
  assert.equal(single.length, 1);
  assert.deepEqual(single[0], { row: 0, col: 0 });

  const rangeA = parseRange('A1:A3');
  assert.equal(rangeA.length, 3);
  assert.deepEqual(rangeA[0], { row: 0, col: 0 });
  assert.deepEqual(rangeA[1], { row: 1, col: 0 });
  assert.deepEqual(rangeA[2], { row: 2, col: 0 });

  const rect = parseRange('A1:B2');
  assert.equal(rect.length, 4);
});

test('grid creation creates exactly 20x20 cells', () => {
  const grid = createEmptyGrid();
  assert.equal(grid.length, TOTAL_ROWS);
  assert.equal(grid[0].length, TOTAL_COLS);
  assert.equal(grid[19].length, TOTAL_COLS);
});

test('evaluates formulas including SUM, AVERAGE, and arithmetic', () => {
  const grid: GridData = createEmptyGrid();
  grid[0][0] = { raw: '10' }; // A1
  grid[1][0] = { raw: '25' }; // A2
  grid[2][0] = { raw: '15' }; // A3

  // =SUM(A1:A3) -> 10 + 25 + 15 = 50
  grid[3][0] = { raw: '=SUM(A1:A3)' }; // A4
  assert.equal(evaluateCell(grid, 3, 0), '50');

  // =AVERAGE(A1:A3) -> 50 / 3 = 16.67
  grid[4][0] = { raw: '=AVERAGE(A1:A3)' }; // A5
  assert.equal(evaluateCell(grid, 4, 0), '16.67');

  // Direct arithmetic =A1+A2*2 -> 10 + 25*2 = 60
  grid[0][1] = { raw: '=A1+A2*2' }; // B1
  assert.equal(evaluateCell(grid, 0, 1), '60');

  // ROUND function tests (including quarter grade rounding)
  grid[5][0] = { raw: '=ROUND(A5, 0)' }; // A6 -> ROUND(16.67, 0) = 17
  assert.equal(evaluateCell(grid, 5, 0), '17');

  // School grade test: student with grades 5, 4, 4 -> AVERAGE 4.33 -> ROUND 4
  grid[6][0] = { raw: '5' }; // A7
  grid[6][1] = { raw: '4' }; // B7
  grid[6][2] = { raw: '4' }; // C7
  grid[6][3] = { raw: '=AVERAGE(A7:C7)' }; // D7
  assert.equal(evaluateCell(grid, 6, 3), '4.33');
  grid[6][4] = { raw: '=ROUND(D7, 0)' }; // E7 -> quarter mark
  assert.equal(evaluateCell(grid, 6, 4), '4');

  // School grade test: student with grades 5, 5, 4 -> AVERAGE 4.67 -> ROUND 5
  grid[7][0] = { raw: '5' }; // A8
  grid[7][1] = { raw: '5' }; // B8
  grid[7][2] = { raw: '4' }; // C8
  grid[7][3] = { raw: '=AVERAGE(A8:C8)' }; // D8
  assert.equal(evaluateCell(grid, 7, 3), '4.67');
  grid[7][4] = { raw: '=ROUND(D8, 0)' }; // E8 -> quarter mark
  assert.equal(evaluateCell(grid, 7, 4), '5');

  // Circular dependency detection
  grid[1][1] = { raw: '=B3' }; // B2
  grid[2][1] = { raw: '=B2' }; // B3
  assert.equal(evaluateCell(grid, 1, 1), '#CIRCULAR!');
});

test('CSV export and import preserves data', () => {
  const grid: GridData = createEmptyGrid(2, 2);
  grid[0][0] = { raw: 'Hello' };
  grid[0][1] = { raw: 'World' };
  grid[1][0] = { raw: '100' };
  grid[1][1] = { raw: '=A1' };

  const csv = exportGridToCSV(grid);
  const parsed = parseCSV(csv);
  assert.equal(parsed[0][0], 'Hello');
  assert.equal(parsed[0][1], 'World');
  assert.equal(parsed[1][0], '100');
  assert.equal(parsed[1][1], '=A1');
});

test('calculateNextCell navigates in all 4 directions and respects bounds', () => {
  // From (2, 2)
  assert.deepEqual(calculateNextCell(2, 2, 'up', 10, 10), { row: 1, col: 2 });
  assert.deepEqual(calculateNextCell(2, 2, 'down', 10, 10), { row: 3, col: 2 });
  assert.deepEqual(calculateNextCell(2, 2, 'left', 10, 10), { row: 2, col: 1 });
  assert.deepEqual(calculateNextCell(2, 2, 'right', 10, 10), { row: 2, col: 3 });

  // Bounds checks: at top-left (0, 0)
  assert.deepEqual(calculateNextCell(0, 0, 'up', 10, 10), { row: 0, col: 0 });
  assert.deepEqual(calculateNextCell(0, 0, 'left', 10, 10), { row: 0, col: 0 });

  // Bounds checks: at bottom-right (9, 9)
  assert.deepEqual(calculateNextCell(9, 9, 'down', 10, 10), { row: 9, col: 9 });
  assert.deepEqual(calculateNextCell(9, 9, 'right', 10, 10), { row: 9, col: 9 });
});

test('shouldNavigateOnHorizontalArrow determines boundary navigation correctly', () => {
  // Empty value always navigates
  assert.equal(shouldNavigateOnHorizontalArrow('left', '', 0, 0), true);
  assert.equal(shouldNavigateOnHorizontalArrow('right', '', 0, 0), true);

  // Entire text selected (e.g. initial click on cell "5")
  assert.equal(shouldNavigateOnHorizontalArrow('left', '5', 0, 1), true);
  assert.equal(shouldNavigateOnHorizontalArrow('right', '5', 0, 1), true);

  // Cursor at beginning (0, 0)
  assert.equal(shouldNavigateOnHorizontalArrow('left', 'Иванов', 0, 0), true);
  assert.equal(shouldNavigateOnHorizontalArrow('right', 'Иванов', 0, 0), false);

  // Cursor at end (6, 6)
  assert.equal(shouldNavigateOnHorizontalArrow('left', 'Иванов', 6, 6), false);
  assert.equal(shouldNavigateOnHorizontalArrow('right', 'Иванов', 6, 6), true);

  // Cursor in middle (2, 2)
  assert.equal(shouldNavigateOnHorizontalArrow('left', 'Иванов', 2, 2), false);
  assert.equal(shouldNavigateOnHorizontalArrow('right', 'Иванов', 2, 2), false);
});

