export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  bgColor?: string;
  textColor?: string;
}

export interface CellData {
  raw: string; // The formula or typed string e.g. "=SUM(A1:A5)" or "150"
  style?: CellStyle;
  date?: string; // Optional lesson date e.g. "2024-09-12" or "12.09"
}

export type GridData = CellData[][];

export const TOTAL_ROWS = 20;
export const TOTAL_COLS = 20;

/**
 * Converts zero-based column index to Excel-style column label (0 -> A, 19 -> T, 25 -> Z, 26 -> AA)
 */
export function getColumnLabel(index: number): string {
  let label = '';
  let num = index;
  while (num >= 0) {
    label = String.fromCharCode((num % 26) + 65) + label;
    num = Math.floor(num / 26) - 1;
  }
  return label;
}

/**
 * Converts Excel-style column label to zero-based index ("A" -> 0, "T" -> 19)
 */
export function parseColumnLabel(label: string): number {
  let result = 0;
  const upper = label.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    result = result * 26 + (upper.charCodeAt(i) - 64);
  }
  return result - 1;
}

/**
 * Returns cell ID like "A1" from row 0, col 0
 */
export function getCellId(row: number, col: number): string {
  return `${getColumnLabel(col)}${row + 1}`;
}

/**
 * Parses "A1" into { row: 0, col: 0 } or null if invalid
 */
export function parseCellId(cellId: string): { row: number; col: number } | null {
  const match = cellId.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const col = parseColumnLabel(match[1]);
  const row = parseInt(match[2], 10) - 1;
  if (isNaN(row) || isNaN(col) || row < 0 || col < 0) return null;
  return { row, col };
}

/**
 * Parses a range like "A1:A5" into an array of cell coordinates
 */
export function parseRange(rangeStr: string): { row: number; col: number }[] {
  const parts = rangeStr.split(':').map((s) => s.trim().toUpperCase());
  if (parts.length === 1) {
    const coord = parseCellId(parts[0]);
    return coord ? [coord] : [];
  }
  if (parts.length === 2) {
    const start = parseCellId(parts[0]);
    const end = parseCellId(parts[1]);
    if (!start || !end) return [];

    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    const cells: { row: number; col: number }[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        cells.push({ row: r, col: c });
      }
    }
    return cells;
  }
  return [];
}

/**
 * Creates an empty 20x20 grid
 */
export function createEmptyGrid(rows = TOTAL_ROWS, cols = TOTAL_COLS): GridData {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      raw: '',
      style: { align: 'left' },
    }))
  );
}

export type NavigationDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Calculates the next cell coordinates when navigating with arrow keys or Enter/Tab.
 * Clamps coordinates within [0, maxRows - 1] and [0, maxCols - 1].
 */
export function calculateNextCell(
  currentRow: number,
  currentCol: number,
  direction: NavigationDirection,
  maxRows: number,
  maxCols: number
): { row: number; col: number } {
  let row = currentRow;
  let col = currentCol;

  switch (direction) {
    case 'up':
      row = Math.max(0, currentRow - 1);
      break;
    case 'down':
      row = Math.min(maxRows - 1, currentRow + 1);
      break;
    case 'left':
      col = Math.max(0, currentCol - 1);
      break;
    case 'right':
      col = Math.min(maxCols - 1, currentCol + 1);
      break;
  }

  return { row, col };
}

/**
 * Determines whether an ArrowLeft or ArrowRight keydown in a text input should navigate cells.
 * Navigates if text is empty, text is fully selected, or cursor is at the respective boundary.
 */
export function shouldNavigateOnHorizontalArrow(
  direction: 'left' | 'right',
  value: string,
  selectionStart: number | null,
  selectionEnd: number | null
): boolean {
  if (!value || value.length === 0) return true;
  if (selectionStart === null || selectionEnd === null) return true;

  // If all text is selected (common when clicking a cell)
  if (selectionStart === 0 && selectionEnd === value.length) return true;

  if (direction === 'left') {
    // At the very beginning of the input
    return selectionStart === 0 && selectionEnd === 0;
  } else {
    // At the very end of the input
    return selectionStart === value.length && selectionEnd === value.length;
  }
}


/**
 * Extracts a numeric value from a cell, returning null if empty or non-numeric
 */
function getCellNumericOrNull(
  grid: GridData,
  row: number,
  col: number,
  visited: Set<string> = new Set()
): number | null {
  if (row < 0 || row >= grid.length || col < 0 || col >= (grid[0]?.length || 0)) {
    return null;
  }
  const evalResult = evaluateCell(grid, row, col, visited);
  if (!evalResult || evalResult.trim() === '') {
    return null;
  }
  const num = parseFloat(evalResult);
  return isNaN(num) ? null : num;
}

/**
 * Extracts a numeric value from a cell, returning 0 if empty or non-numeric
 */
function getCellNumericValue(
  grid: GridData,
  row: number,
  col: number,
  visited: Set<string> = new Set()
): number {
  const val = getCellNumericOrNull(grid, row, col, visited);
  return val === null ? 0 : val;
}

/**
 * Safely evaluates simple math expressions: +, -, *, /, parenthesis, and numbers
 */
function safeEvalMath(expression: string): number {
  // Allow only digits, decimal points, spaces, and math operators + - * / ( )
  const sanitized = expression.replace(/\s+/g, '');
  if (!/^[-+*/()0-9.]+$/.test(sanitized)) {
    throw new Error('Invalid math expression');
  }

  // Use Function constructor in a closed scope for arithmetic evaluation only
  // Since sanitized only contains safe arithmetic tokens, this is safe and fast
  const result = new Function(`"use strict"; return (${sanitized});`)();
  if (typeof result !== 'number' || !isFinite(result)) {
    throw new Error('Math error');
  }
  return result;
}

/**
 * Evaluates a cell's raw content. If it's a formula (starts with '='), computes the result.
 */
export function evaluateCell(
  grid: GridData,
  row: number,
  col: number,
  visited: Set<string> = new Set(),
  explicitRaw?: string
): string {
  const raw =
    explicitRaw !== undefined
      ? explicitRaw
      : row >= 0 && row < grid.length && col >= 0 && col < (grid[0]?.length || 0)
      ? grid[row][col]?.raw ?? ''
      : '';

  if (!raw.startsWith('=')) {
    return raw;
  }

  const cellKey = `${row},${col}`;
  if (row >= 0 && visited.has(cellKey)) {
    return '#CIRCULAR!';
  }

  const nextVisited = new Set(visited);
  if (row >= 0) {
    nextVisited.add(cellKey);
  }

  const formula = raw.slice(1).trim().toUpperCase();

  try {
    // Check for standard functions: SUM, AVERAGE, COUNT, MIN, MAX, ROUND
    const fnMatch = formula.match(/^(SUM|AVERAGE|COUNT|MIN|MAX|ROUND)\((.+)\)$/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      const argsStr = fnMatch[2];

      if (fnName === 'ROUND') {
        const lastComma = argsStr.lastIndexOf(',');
        let targetExpr = argsStr;
        let decimals = 0;
        if (lastComma !== -1) {
          targetExpr = argsStr.slice(0, lastComma).trim();
          decimals = parseInt(argsStr.slice(lastComma + 1).trim(), 10) || 0;
        }

        let numVal: number | null = null;
        if (/^[A-Z]+\d+$/.test(targetExpr)) {
          const c = parseCellId(targetExpr);
          numVal = c ? getCellNumericOrNull(grid, c.row, c.col, nextVisited) : null;
        } else {
          const evalExpr = targetExpr.startsWith('=')
            ? evaluateCell(grid, -1, -1, nextVisited, targetExpr)
            : targetExpr;
          const parsed = parseFloat(evalExpr);
          numVal = isNaN(parsed) ? null : parsed;
        }

        if (numVal === null) return '';
        const factor = Math.pow(10, decimals);
        const rounded = Math.round(numVal * factor) / factor;
        return decimals === 0 ? rounded.toString() : rounded.toFixed(decimals);
      }

      const rangeParts = argsStr.split(',').map((s) => s.trim());
      const numbers: number[] = [];

      for (const part of rangeParts) {
        if (part.includes(':')) {
          const cells = parseRange(part);
          for (const cell of cells) {
            const val = getCellNumericOrNull(grid, cell.row, cell.col, nextVisited);
            if (val !== null) numbers.push(val);
          }
        } else if (/^[A-Z]+\d+$/.test(part)) {
          const cell = parseCellId(part);
          if (cell) {
            const val = getCellNumericOrNull(grid, cell.row, cell.col, nextVisited);
            if (val !== null) numbers.push(val);
          }
        } else {
          const val = parseFloat(part);
          if (!isNaN(val)) numbers.push(val);
        }
      }

      if (fnName === 'SUM') {
        if (numbers.length === 0) return '0';
        const sum = numbers.reduce((acc, n) => acc + n, 0);
        return Number.isInteger(sum) ? sum.toString() : sum.toFixed(2).replace(/\.?0+$/, '');
      }
      if (fnName === 'COUNT') {
        return numbers.length.toString();
      }
      if (fnName === 'AVERAGE') {
        if (numbers.length === 0) return '';
        const avg = numbers.reduce((acc, n) => acc + n, 0) / numbers.length;
        return Number.isInteger(avg) ? avg.toString() : avg.toFixed(2).replace(/\.?0+$/, '');
      }
      if (fnName === 'MIN') {
        if (numbers.length === 0) return '';
        return Math.min(...numbers).toString();
      }
      if (fnName === 'MAX') {
        if (numbers.length === 0) return '';
        return Math.max(...numbers).toString();
      }
    }

    // Direct arithmetic or cell reference formulas e.g. "=A1+B1", "=A1*2"
    let expr = formula;
    let foundError: string | null = null;

    // Replace cell identifiers with values
    expr = expr.replace(/[A-Z]+\d+/g, (match) => {
      const cell = parseCellId(match);
      if (!cell) return '0';
      const cellVal = evaluateCell(grid, cell.row, cell.col, nextVisited);
      if (cellVal === '#CIRCULAR!' || cellVal.startsWith('#')) {
        foundError = cellVal;
        return '0';
      }
      const num = parseFloat(cellVal);
      return isNaN(num) ? '0' : num.toString();
    });

    if (foundError) {
      return foundError;
    }

    const calculated = safeEvalMath(expr);
    return Number.isInteger(calculated)
      ? calculated.toString()
      : calculated.toFixed(2).replace(/\.?0+$/, '');
  } catch {
    return '#ERROR!';
  }
}

/**
 * Exports current grid to CSV format
 */
export function exportGridToCSV(grid: GridData): string {
  return grid
    .map((row) =>
      row
        .map((cell) => {
          let text = cell.raw || '';
          if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            text = `"${text.replace(/"/g, '""')}"`;
          }
          return text;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Parses CSV text into a 2D array of strings
 */
export function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim() && rows.length > 0) continue;
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(cur);
        cur = '';
      } else {
        cur += char;
      }
    }
    cells.push(cur);
    rows.push(cells);
  }

  return rows;
}

/**
 * Creates populated sample data (e.g. simple sales/product report) to showcase capabilities
 */
export function createSampleGrid(): GridData {
  const grid = createEmptyGrid();

  // Header row
  const headers = ['Товар', 'Январь', 'Февраль', 'Март', 'Итого', 'Ср. продажа'];
  headers.forEach((h, col) => {
    grid[0][col] = {
      raw: h,
      style: { bold: true, align: 'center', bgColor: '#f1f5f9' },
    };
  });

  const sampleProducts = [
    { name: 'Ноутбук Pro 16', jan: 12, feb: 15, mar: 18 },
    { name: 'Смартфон Alpha', jan: 25, feb: 30, mar: 28 },
    { name: 'Монитор 27" 4K', jan: 8, feb: 10, mar: 12 },
    { name: 'Наушники Wireless', jan: 45, feb: 52, mar: 60 },
    { name: 'Клавиатура RGB', jan: 18, feb: 22, mar: 25 },
    { name: 'Мышь Ergonomic', jan: 30, feb: 35, mar: 40 },
  ];

  sampleProducts.forEach((item, idx) => {
    const row = idx + 1;
    const excelRow = row + 1; // 1-based row number in Excel
    grid[row][0] = { raw: item.name, style: { bold: false, align: 'left' } };
    grid[row][1] = { raw: item.jan.toString(), style: { align: 'right' } };
    grid[row][2] = { raw: item.feb.toString(), style: { align: 'right' } };
    grid[row][3] = { raw: item.mar.toString(), style: { align: 'right' } };
    // Formula for Total and Average
    grid[row][4] = {
      raw: `=SUM(B${excelRow}:D${excelRow})`,
      style: { bold: true, align: 'right', bgColor: '#ecfdf5' },
    };
    grid[row][5] = {
      raw: `=AVERAGE(B${excelRow}:D${excelRow})`,
      style: { align: 'right' },
    };
  });

  // Summary Row
  const totalRow = sampleProducts.length + 1;
  grid[totalRow][0] = {
    raw: 'ИТОГО',
    style: { bold: true, align: 'left', bgColor: '#f8fafc' },
  };
  grid[totalRow][1] = {
    raw: `=SUM(B2:B${totalRow})`,
    style: { bold: true, align: 'right', bgColor: '#f8fafc' },
  };
  grid[totalRow][2] = {
    raw: `=SUM(C2:C${totalRow})`,
    style: { bold: true, align: 'right', bgColor: '#f8fafc' },
  };
  grid[totalRow][3] = {
    raw: `=SUM(D2:D${totalRow})`,
    style: { bold: true, align: 'right', bgColor: '#f8fafc' },
  };
  grid[totalRow][4] = {
    raw: `=SUM(E2:E${totalRow})`,
    style: { bold: true, align: 'right', bgColor: '#e0f2fe' },
  };

  return grid;
}
