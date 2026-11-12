import { GridData, createEmptyGrid, getColumnLabel, evaluateCell, TOTAL_ROWS, TOTAL_COLS } from './tableUtils';

export interface Student {
  id: string;
  name: string;
  notes?: string;
}

export interface KtpLesson {
  number: number;
  topic: string;
  date?: string;
}

export type Quarter = 1 | 2 | 3 | 4;

export type TableViewType = 'quarter' | 'yearly' | 'ktp' | 'custom';

export interface ExtraTable {
  id: string;
  name: string;
  type: TableViewType;
  grid: GridData;
  description?: string;
  createdAt?: number;
}

export interface QuarterData {
  grid: GridData;
  ktp: KtpLesson[];
  lessonHours: number; // Number of lesson hours in this quarter
  startLessonNumber: number; // Cumulative starting lesson number (e.g. 1 in Q1, 9 in Q2 for 34h)
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "8-А класс"
  subject: string; // e.g. "Информатика"
  totalHours: number; // Annual teacher workload hours (e.g. 34, 68, 106, 136, 170)
  quarterHours: Record<Quarter, number>; // Distribution per quarter
  students: Student[];
  currentQuarter: Quarter;
  activeTableId?: string; // 'q-1' | 'q-2' | 'q-3' | 'q-4' | 'yearly' | 'ktp' | custom id
  fullKtp: KtpLesson[]; // Full curriculum (e.g. 34, 68, or 106 lessons)
  quarters: Record<Quarter, QuarterData>;
  yearlyGrid?: GridData; // Сводная годовая таблица
  ktpGrid?: GridData; // Поурочный план КТП
  extraTables?: ExtraTable[]; // Дополнительные пользовательские таблицы
}

export const STORAGE_KEY = 'school_classes_data_v8';

/**
 * Calculates academic quarter hours distribution for a given total annual hours
 * Standard pedagogical norms:
 * - 34 hours (1 hr/week): Q1: 8, Q2: 8, Q3: 10, Q4: 8 (sum = 34)
 * - 68 hours (2 hrs/week): Q1: 16, Q2: 16, Q3: 20, Q4: 16 (sum = 68)
 * - 102 hours (3 hrs/week): Q1: 24, Q2: 24, Q3: 30, Q4: 24 (sum = 102)
 * - 106 hours (3+ hrs/week): Q1: 26, Q2: 26, Q3: 28, Q4: 26 (sum = 106)
 * - 136 hours (4 hrs/week): Q1: 32, Q2: 32, Q3: 40, Q4: 32 (sum = 136)
 * - 170 hours (5 hrs/week): Q1: 40, Q2: 40, Q3: 50, Q4: 40 (sum = 170)
 */
export function calculateQuarterHours(totalHours: number): Record<Quarter, number> {
  if (totalHours === 34) {
    return { 1: 8, 2: 8, 3: 10, 4: 8 };
  }
  if (totalHours === 68) {
    return { 1: 16, 2: 16, 3: 20, 4: 16 };
  }
  if (totalHours === 102) {
    return { 1: 24, 2: 24, 3: 30, 4: 24 };
  }
  if (totalHours === 106) {
    return { 1: 26, 2: 26, 3: 28, 4: 26 };
  }
  if (totalHours === 136) {
    return { 1: 32, 2: 32, 3: 40, 4: 32 };
  }
  if (totalHours === 170) {
    return { 1: 40, 2: 40, 3: 50, 4: 40 };
  }

  // Custom hours distribution according to standard quarter durations (~24%, ~24%, ~28%, ~24%)
  const safeTotal = Math.max(4, totalHours);
  const q1 = Math.max(1, Math.round(safeTotal * 0.24));
  const q2 = Math.max(1, Math.round(safeTotal * 0.24));
  const q3 = Math.max(1, Math.round(safeTotal * 0.28));
  const q4 = Math.max(1, safeTotal - (q1 + q2 + q3));
  return { 1: q1, 2: q2, 3: q3, 4: q4 };
}

/**
 * Returns cumulative starting lesson number for a quarter based on quarter hours or total hours
 */
export function getQuarterStartLesson(
  quarter: Quarter,
  quarterHoursOrTotal: Record<Quarter, number> | number = 34
): number {
  const qh =
    typeof quarterHoursOrTotal === 'number'
      ? calculateQuarterHours(quarterHoursOrTotal)
      : quarterHoursOrTotal;
  let start = 1;
  for (let q = 1; q < quarter; q++) {
    start += qh[q as Quarter] || 0;
  }
  return start;
}

/**
 * Official 34-lesson Informatics curriculum for 8th Grade (from attached file "КТП 8 класс.csv")
 */
export const INFORMATICS_8_FULL_KTP: KtpLesson[] = [
  { number: 1, topic: 'Непозиционные и позиционные системы счисления' },
  { number: 2, topic: 'Развернутая форма записи числа' },
  { number: 3, topic: 'Двоичная система счисления. Арифметические операции в двоичной системе счисления' },
  { number: 4, topic: 'Восьмеричная система счисления' },
  { number: 5, topic: 'Шестнадцатеричная система счисления' },
  { number: 6, topic: 'Обобщение и систематизация знаний по теме «Системы счисления»' },
  { number: 7, topic: 'Логические высказывания' },
  { number: 8, topic: 'Логические операции «и», «или», «не»' },
  { number: 9, topic: 'Определение истинности составного высказывания' },
  { number: 10, topic: 'Таблицы истинности' },
  { number: 11, topic: 'Логические элементы' },
  { number: 12, topic: 'Контрольная работа по теме «Элементы математической логики»' },
  { number: 13, topic: 'Понятие алгоритма. Исполнители алгоритмов' },
  { number: 14, topic: 'Свойства алгоритма. Способы записи алгоритма' },
  { number: 15, topic: 'Алгоритмическая конструкция «следование». Линейный алгоритм' },
  { number: 16, topic: 'Алгоритмическая конструкция «ветвление»: полная и неполная формы' },
  { number: 17, topic: 'Алгоритмическая конструкция «повторение»' },
  { number: 18, topic: 'Формальное исполнение алгоритма' },
  { number: 19, topic: 'Разработка несложных алгоритмов с использованием циклов для управления формальными исполнителями' },
  { number: 20, topic: 'Разработка несложных алгоритмов с использованием циклов и ветвлений для управления формальными исполнителями' },
  { number: 21, topic: 'Выполнение алгоритмов' },
  { number: 22, topic: 'Обобщение и систематизация знаний по теме «Исполнители и алгоритмы. Алгоритмические конструкции»' },
  { number: 23, topic: 'Язык программирования. Система программирования' },
  { number: 24, topic: 'Переменные. Оператор присваивания' },
  { number: 25, topic: 'Программирование линейных алгоритмов' },
  { number: 26, topic: 'Разработка программ, содержащих оператор ветвления' },
  { number: 27, topic: 'Диалоговая отладка программ' },
  { number: 28, topic: 'Цикл с условием' },
  { number: 29, topic: 'Цикл с переменной' },
  { number: 30, topic: 'Обработка символьных данных' },
  { number: 31, topic: 'Обобщение и систематизация знаний по теме «Язык программирования» Проверочная работа / Всероссийская проверочная работа' },
  { number: 32, topic: 'Резервный урок. Обобщение и систематизация знаний и умений по курсу информатики 8 класса / Всероссийская проверочная работа' },
  { number: 33, topic: 'Анализ алгоритмов. Определение возможных результатов работы алгоритма при заданном множестве входных данных' },
  { number: 34, topic: 'Анализ алгоритмов. Определение возможных входных данных, приводящих к данному результату' },
];

/**
 * 106-lesson Advanced Informatics course (for 10-11th grade or in-depth profile)
 */
export const INFORMATICS_106_FULL_KTP: KtpLesson[] = Array.from({ length: 106 }, (_, i) => {
  const num = i + 1;
  if (num <= 34) {
    return INFORMATICS_8_FULL_KTP[i];
  }
  if (num <= 50) {
    return { number: num, topic: `Структуры данных и алгоритмы поиска. Часть ${num - 34}` };
  }
  if (num <= 70) {
    return { number: num, topic: `Объектно-ориентированное программирование (Python). Урок ${num - 50}` };
  }
  if (num <= 90) {
    return { number: num, topic: `Базы данных, SQL и реляционные модели. Тема ${num - 70}` };
  }
  return { number: num, topic: `Веб-технологии, информационная безопасность и проектный практикум ${num - 90}` };
});

export const SAMPLE_KTPS: Record<string, KtpLesson[]> = {
  informatics_34: INFORMATICS_8_FULL_KTP,
  informatics_106: INFORMATICS_106_FULL_KTP,
  algebra_68: Array.from({ length: 68 }, (_, i) => ({
    number: i + 1,
    topic: `Алгебра. Урок ${i + 1}`,
  })),
};

export const FIRST_LESSON_COL = 2; // Column C

/**
 * Returns column positions for a gradebook with a given number of lesson hours
 */
export function getQuarterColumnsInfo(lessonCount: number) {
  const firstLessonCol = FIRST_LESSON_COL; // 2 (Col C)
  const lastLessonCol = FIRST_LESSON_COL + Math.max(1, lessonCount) - 1;
  const avgGradeCol = lastLessonCol + 1;
  const quarterGradeCol = lastLessonCol + 2;
  const totalCols = quarterGradeCol + 1; // Exact columns required: № + Ученик + уроки + Ср.балл + Оценка (без пустых колонок!)

  return {
    firstLessonCol,
    lastLessonCol,
    avgGradeCol,
    quarterGradeCol,
    totalCols,
  };
}

/**
 * Creates standard gradebook grid tailored to teacher hours
 * Supports clean tables (isClean: true) without dummy mock grades!
 *
 * Layout:
 * Col 0 (A): №
 * Col 1 (B): Ученик (ФИО)
 * Cols 2 .. (2 + lessonCount - 1): Lessons with cumulative numbering and KTP topics
 * Next Col: Ср. балл (=AVERAGE(C{row}:{lastLessonCol}{row}))
 * Next Col: Оценка за четв. (=ROUND({avgColLetter}{row}, 0))
 * Padded to at least 20 columns and 20 rows
 */
export function createClassGradebookGrid(
  _className: string,
  studentNames: string[] = [],
  ktpLessons: KtpLesson[] = [],
  lessonCount: number = 8,
  startLessonNum: number = 1,
  isClean: boolean = true // CLEAN TABLE BY DEFAULT!
): GridData {
  const { lastLessonCol, avgGradeCol, quarterGradeCol, totalCols } = getQuarterColumnsInfo(lessonCount);
  const grid = createEmptyGrid(TOTAL_ROWS, totalCols);

  // Row 0: Column headers
  grid[0][0] = { raw: '№', style: { bold: true, align: 'center', bgColor: '#f1f5f9' } };
  grid[0][1] = { raw: 'Ученик (ФИО)', style: { bold: true, align: 'left', bgColor: '#f1f5f9' } };

  // Lessons columns
  for (let c = FIRST_LESSON_COL; c <= lastLessonCol; c++) {
    const lessonOffset = c - FIRST_LESSON_COL;
    const cumulativeNum = startLessonNum + lessonOffset;
    // Find topic matching cumulative lesson number, or by index
    const ktpItem =
      ktpLessons.find((k) => k.number === cumulativeNum) ||
      ktpLessons[lessonOffset];

    const headerTitle = ktpItem
      ? `${ktpItem.number}. ${ktpItem.topic}`
      : `Урок ${cumulativeNum}`;

    grid[0][c] = {
      raw: headerTitle,
      date: ktpItem?.date,
      style: {
        bold: true,
        align: 'center',
        bgColor: ktpItem ? '#f0fdf4' : '#f8fafc',
        textColor: ktpItem ? '#065f46' : '#334155',
      },
    };
  }

  // Average grade header
  grid[0][avgGradeCol] = {
    raw: 'Ср. балл',
    style: { bold: true, align: 'center', bgColor: '#e0f2fe', textColor: '#0369a1' },
  };

  // Quarter grade header
  grid[0][quarterGradeCol] = {
    raw: 'Оценка за четв.',
    style: { bold: true, align: 'center', bgColor: '#fef3c7', textColor: '#92400e' },
  };

  // Optional remaining padding columns (if any)
  for (let c = quarterGradeCol + 1; c < totalCols; c++) {
    grid[0][c] = {
      raw: '',
      style: { align: 'center', bgColor: '#fafafa' },
    };
  }

  // Pre-fill row numbers 1 to 18 and formulas (waiting for clean real input)
  const firstColLetter = getColumnLabel(FIRST_LESSON_COL);
  const lastColLetter = getColumnLabel(lastLessonCol);
  const avgColLetter = getColumnLabel(avgGradeCol);

  const sampleGrades = [5, 4, 5, 4, 5, 3, 4, 5, 4, 5];

  for (let r = 1; r < TOTAL_ROWS - 1; r++) {
    const row = r;
    const excelRow = row + 1;
    const studentName = studentNames[r - 1] || '';

    grid[row][0] = { raw: r.toString(), style: { align: 'center', textColor: '#64748b' } };
    grid[row][1] = { raw: studentName, style: { bold: false, align: 'left' } };

    // If isClean is true: grades are EMPTY, waiting for real input!
    // If !isClean: sample grades for demo (only if studentName exists)
    if (!isClean && studentName) {
      const demoLessonLimit = Math.min(6, lessonCount);
      for (let c = FIRST_LESSON_COL; c < FIRST_LESSON_COL + demoLessonLimit; c++) {
        const g = sampleGrades[(r + c) % sampleGrades.length];
        grid[row][c] = { raw: g.toString(), style: { align: 'center' } };
      }
    }

    // Average formula across lesson columns
    grid[row][avgGradeCol] = {
      raw: `=AVERAGE(${firstColLetter}${excelRow}:${lastColLetter}${excelRow})`,
      style: { bold: true, align: 'center', bgColor: '#f0f9ff', textColor: '#0284c7' },
    };

    // Quarter Grade formula (=ROUND({avgColLetter}{excelRow}, 0))
    grid[row][quarterGradeCol] = {
      raw: `=ROUND(${avgColLetter}${excelRow}, 0)`,
      style: { bold: true, align: 'center', bgColor: '#fffbeb', textColor: '#b45309' },
    };
  }

  // Summary Row (Row 20 in Excel)
  const summaryRow = TOTAL_ROWS - 1;
  grid[summaryRow][0] = { raw: '∑', style: { bold: true, align: 'center', bgColor: '#f1f5f9' } };
  grid[summaryRow][1] = {
    raw: 'Средний балл по классу',
    style: { bold: true, align: 'left', bgColor: '#f1f5f9' },
  };

  for (let c = FIRST_LESSON_COL; c <= lastLessonCol; c++) {
    const colLetter = getColumnLabel(c);
    grid[summaryRow][c] = {
      raw: `=AVERAGE(${colLetter}2:${colLetter}${summaryRow})`,
      style: { bold: true, align: 'center', bgColor: '#f8fafc' },
    };
  }

  grid[summaryRow][avgGradeCol] = {
    raw: `=AVERAGE(${avgColLetter}2:${avgColLetter}${summaryRow})`,
    style: { bold: true, align: 'center', bgColor: '#e0f2fe' },
  };

  grid[summaryRow][quarterGradeCol] = {
    raw: `=ROUND(${avgColLetter}${summaryRow + 1}, 0)`,
    style: { bold: true, align: 'center', bgColor: '#fef3c7' },
  };

  return grid;
}

/**
 * Clears all marks in the gradebook, returning a clean table with formulas preserved
 */
export function clearGradesInGrid(grid: GridData, lessonCount: number): GridData {
  const { lastLessonCol } = getQuarterColumnsInfo(lessonCount);
  const newGrid = grid.map((r) => [...r]);

  for (let r = 1; r < TOTAL_ROWS - 1; r++) {
    for (let c = FIRST_LESSON_COL; c <= lastLessonCol; c++) {
      newGrid[r][c] = { raw: '', style: { align: 'center' } };
    }
  }

  return newGrid;
}

/**
 * Assigns a single topic and optional date to a specific lesson column
 */
export function assignTopicToColumn(
  grid: GridData,
  colIndex: number,
  topic: KtpLesson | null,
  cumulativeLessonNum?: number,
  lessonDate?: string | null
): GridData {
  const newGrid = grid.map((r) => [...r]);
  const num = cumulativeLessonNum || (colIndex - FIRST_LESSON_COL + 1);
  const existingCell = newGrid[0]?.[colIndex];

  let resolvedDate: string | undefined = undefined;
  if (lessonDate !== undefined) {
    resolvedDate = lessonDate === null || lessonDate.trim() === '' ? undefined : lessonDate.trim();
  } else if (topic?.date) {
    resolvedDate = topic.date;
  } else if (existingCell?.date) {
    resolvedDate = existingCell.date;
  }

  if (topic) {
    newGrid[0][colIndex] = {
      raw: `${topic.number}. ${topic.topic}`,
      date: resolvedDate,
      style: {
        bold: true,
        align: 'center',
        bgColor: '#ecfdf5',
        textColor: '#065f46',
      },
    };
  } else {
    newGrid[0][colIndex] = {
      raw: `Урок ${num}`,
      date: resolvedDate,
      style: {
        bold: true,
        align: 'center',
        bgColor: '#f8fafc',
        textColor: '#334155',
      },
    };
  }

  return newGrid;
}

/**
 * Assigns or clears date for a specific lesson column without changing the topic
 */
export function assignDateToColumn(
  grid: GridData,
  colIndex: number,
  lessonDate?: string | null
): GridData {
  const newGrid = grid.map((r) => [...r]);
  const existingCell = newGrid[0]?.[colIndex];
  if (existingCell) {
    const cleanDate = lessonDate && lessonDate.trim() ? lessonDate.trim() : undefined;
    newGrid[0][colIndex] = {
      ...existingCell,
      date: cleanDate,
    };
  }
  return newGrid;
}

/**
 * Applies a list of KTP lesson topics sequentially to table columns
 */
export function applyKtpToGrid(
  grid: GridData,
  ktp: KtpLesson[],
  lessonCount: number,
  startLessonNum = 1
): GridData {
  const { lastLessonCol } = getQuarterColumnsInfo(lessonCount);
  const newGrid = grid.map((r) => [...r]);

  for (let c = FIRST_LESSON_COL; c <= lastLessonCol; c++) {
    const offset = c - FIRST_LESSON_COL;
    const lessonNum = startLessonNum + offset;
    const ktpItem = ktp.find((k) => k.number === lessonNum) || ktp[offset];

    if (ktpItem) {
      newGrid[0][c] = {
        raw: `${ktpItem.number}. ${ktpItem.topic}`,
        date: ktpItem.date || newGrid[0][c]?.date,
        style: {
          bold: true,
          align: 'center',
          bgColor: '#ecfdf5',
          textColor: '#065f46',
        },
      };
    } else {
      newGrid[0][c] = {
        raw: `Урок ${lessonNum}`,
        date: newGrid[0][c]?.date,
        style: {
          bold: true,
          align: 'center',
          bgColor: '#f8fafc',
          textColor: '#334155',
        },
      };
    }
  }

  return newGrid;
}

/**
 * Synchronizes students array into table grid rows 1 to N with formulas for Average and Quarter Grade
 */
export function syncStudentsToGrid(
  currentGrid: GridData,
  students: Student[],
  lessonCount: number
): GridData {
  const { lastLessonCol, avgGradeCol, quarterGradeCol } = getQuarterColumnsInfo(lessonCount);
  const newGrid = currentGrid.map((row) => [...row]);

  const firstColLetter = getColumnLabel(FIRST_LESSON_COL);
  const lastColLetter = getColumnLabel(lastLessonCol);
  const avgColLetter = getColumnLabel(avgGradeCol);

  students.slice(0, TOTAL_ROWS - 2).forEach((student, idx) => {
    const row = idx + 1;
    const excelRow = row + 1;
    newGrid[row][0] = { raw: (idx + 1).toString(), style: { align: 'center' } };
    newGrid[row][1] = { raw: student.name, style: { bold: false, align: 'left' } };

    newGrid[row][avgGradeCol] = {
      raw: `=AVERAGE(${firstColLetter}${excelRow}:${lastColLetter}${excelRow})`,
      style: { bold: true, align: 'center', bgColor: '#f0f9ff', textColor: '#0284c7' },
    };
    newGrid[row][quarterGradeCol] = {
      raw: `=ROUND(${avgColLetter}${excelRow}, 0)`,
      style: { bold: true, align: 'center', bgColor: '#fffbeb', textColor: '#b45309' },
    };
  });

  // Clear rows beyond students.length so removed students don't linger
  for (let r = students.length + 1; r < TOTAL_ROWS - 1; r++) {
    newGrid[r][0] = { raw: r.toString(), style: { align: 'center', textColor: '#64748b' } };
    newGrid[r][1] = { raw: '', style: { bold: false, align: 'left' } };
  }

  return newGrid;
}

/**
 * Synchronizes student list across all 4 quarters and Yearly summary for a SchoolClass
 * Ensures students NEVER disappear when switching between I, II, III, IV quarters!
 */
export function syncStudentsAcrossAllQuarters(
  cls: SchoolClass,
  students: Student[]
): SchoolClass {
  const updatedQuarters = { ...cls.quarters };

  ([1, 2, 3, 4] as Quarter[]).forEach((q) => {
    const qData = cls.quarters[q];
    if (qData) {
      const qHours = cls.quarterHours?.[q] || qData.lessonHours || 8;
      const syncedGrid = syncStudentsToGrid(qData.grid, students, qHours);
      updatedQuarters[q] = {
        ...qData,
        grid: syncedGrid,
      };
    }
  });

  // Also sync to yearlyGrid
  const studentNames = students.map((s) => s.name);
  let updatedYearlyGrid = cls.yearlyGrid;
  if (updatedYearlyGrid) {
    updatedYearlyGrid = syncQuarterMarksToYearly(
      updatedYearlyGrid,
      updatedQuarters,
      students
    );
  } else {
    updatedYearlyGrid = createYearlySummaryGrid(
      cls.name,
      studentNames,
      updatedQuarters
    );
  }

  return {
    ...cls,
    students,
    quarters: updatedQuarters,
    yearlyGrid: updatedYearlyGrid,
  };
}

/**
 * Parses raw text or CSV or TSV into KtpLesson array
 */
export function parseKtpText(text: string): KtpLesson[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const lessons: KtpLesson[] = [];

  for (const line of lines) {
    if (/^(класс|номер|№|урок|тема)/i.test(line) && /тема/i.test(line)) {
      continue;
    }

    let cleanLine = line;
    if (line.includes(';') || line.includes('\t') || line.includes(',')) {
      const parts = line.split(/[;\t,]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      const textParts = parts.filter((p) => p.length > 0);
      if (textParts.length >= 2) {
        const potentialNum = parseInt(textParts[0], 10);
        if (!isNaN(potentialNum)) {
          lessons.push({
            number: potentialNum,
            topic: textParts.slice(1).join(' ').trim(),
          });
          continue;
        } else {
          cleanLine = textParts.slice(1).join(' ').trim();
        }
      } else if (textParts.length === 1) {
        cleanLine = textParts[0];
      }
    }

    const match = cleanLine.match(/^(\d+)[.\s;:,\t-]+\s*(.+)$/);
    if (match) {
      lessons.push({
        number: parseInt(match[1], 10),
        topic: match[2].trim(),
      });
    } else if (cleanLine.length > 0) {
      lessons.push({
        number: lessons.length + 1,
        topic: cleanLine,
      });
    }
  }

  return lessons;
}

/**
 * Creates Annual Summary Gradebook (Сводная годовая ведомость оценок)
 * Columns:
 * Col 0 (A): №
 * Col 1 (B): Ученик (ФИО)
 * Col 2 (C): I четв.
 * Col 3 (D): II четв.
 * Col 4 (E): III четв.
 * Col 5 (F): IV четв.
 * Col 6 (G): Ср. балл (=AVERAGE(C{r}:F{r}))
 * Col 7 (H): Экзамен / Годовая КР
 * Col 8 (I): Годовая (=ROUND(G{r}, 0))
 * Col 9 (J): Итоговая (=ROUND(I{r}, 0))
 */
export function createYearlySummaryGrid(
  _className: string,
  studentNames: string[] = [],
  quartersData?: Record<Quarter, QuarterData>
): GridData {
  const totalCols = 10;
  const grid = createEmptyGrid(TOTAL_ROWS, totalCols);

  // Headers
  grid[0][0] = { raw: '№', style: { bold: true, align: 'center', bgColor: '#f1f5f9' } };
  grid[0][1] = { raw: 'Ученик (ФИО)', style: { bold: true, align: 'left', bgColor: '#f1f5f9' } };
  grid[0][2] = { raw: 'I четв.', style: { bold: true, align: 'center', bgColor: '#f8fafc' } };
  grid[0][3] = { raw: 'II четв.', style: { bold: true, align: 'center', bgColor: '#f8fafc' } };
  grid[0][4] = { raw: 'III четв.', style: { bold: true, align: 'center', bgColor: '#f8fafc' } };
  grid[0][5] = { raw: 'IV четв.', style: { bold: true, align: 'center', bgColor: '#f8fafc' } };
  grid[0][6] = { raw: 'Ср. балл', style: { bold: true, align: 'center', bgColor: '#e0f2fe', textColor: '#0369a1' } };
  grid[0][7] = { raw: 'Экзамен', style: { bold: true, align: 'center', bgColor: '#f3e8ff', textColor: '#6b21a8' } };
  grid[0][8] = { raw: 'Годовая', style: { bold: true, align: 'center', bgColor: '#fef3c7', textColor: '#92400e' } };
  grid[0][9] = { raw: 'Итоговая', style: { bold: true, align: 'center', bgColor: '#dcfce7', textColor: '#166534' } };

  for (let r = 1; r < TOTAL_ROWS - 1; r++) {
    const row = r;
    const excelRow = row + 1;
    const studentName = studentNames[r - 1] || '';
    grid[row][0] = { raw: r.toString(), style: { align: 'center', textColor: '#64748b' } };
    grid[row][1] = { raw: studentName, style: { bold: false, align: 'left' } };

    // Pull quarter marks if quartersData is available
    let q1Mark = '';
    let q2Mark = '';
    let q3Mark = '';
    let q4Mark = '';
    if (quartersData) {
      const getMark = (q: Quarter) => {
        const qGrid = quartersData[q]?.grid;
        if (!qGrid || !qGrid[row]) return '';
        const qColInfo = getQuarterColumnsInfo(quartersData[q]?.lessonHours || 8);
        return qGrid[row][qColInfo.quarterGradeCol]?.raw || '';
      };
      q1Mark = getMark(1);
      q2Mark = getMark(2);
      q3Mark = getMark(3);
      q4Mark = getMark(4);
    }

    grid[row][2] = { raw: q1Mark, style: { align: 'center' } };
    grid[row][3] = { raw: q2Mark, style: { align: 'center' } };
    grid[row][4] = { raw: q3Mark, style: { align: 'center' } };
    grid[row][5] = { raw: q4Mark, style: { align: 'center' } };

    // Average formula C:F
    grid[row][6] = {
      raw: `=AVERAGE(C${excelRow}:F${excelRow})`,
      style: { bold: true, align: 'center', bgColor: '#f0f9ff', textColor: '#0284c7' },
    };
    // Exam / Annual control
    grid[row][7] = { raw: '', style: { align: 'center', bgColor: '#faf5ff' } };
    // Годовая оценка
    grid[row][8] = {
      raw: `=ROUND(G${excelRow}, 0)`,
      style: { bold: true, align: 'center', bgColor: '#fffbeb', textColor: '#b45309' },
    };
    // Итоговая оценка
    grid[row][9] = {
      raw: `=ROUND(I${excelRow}, 0)`,
      style: { bold: true, align: 'center', bgColor: '#f0fdf4', textColor: '#15803d' },
    };
  }

  // Summary Row
  const summaryRow = TOTAL_ROWS - 1;
  grid[summaryRow][0] = { raw: '∑', style: { bold: true, align: 'center', bgColor: '#f1f5f9' } };
  grid[summaryRow][1] = { raw: 'Средний балл по классу', style: { bold: true, align: 'left', bgColor: '#f1f5f9' } };
  grid[summaryRow][2] = { raw: `=AVERAGE(C2:C${summaryRow})`, style: { bold: true, align: 'center', bgColor: '#f8fafc' } };
  grid[summaryRow][3] = { raw: `=AVERAGE(D2:D${summaryRow})`, style: { bold: true, align: 'center', bgColor: '#f8fafc' } };
  grid[summaryRow][4] = { raw: `=AVERAGE(E2:E${summaryRow})`, style: { bold: true, align: 'center', bgColor: '#f8fafc' } };
  grid[summaryRow][5] = { raw: `=AVERAGE(F2:F${summaryRow})`, style: { bold: true, align: 'center', bgColor: '#f8fafc' } };
  grid[summaryRow][6] = { raw: `=AVERAGE(G2:G${summaryRow})`, style: { bold: true, align: 'center', bgColor: '#e0f2fe' } };
  grid[summaryRow][7] = { raw: `=AVERAGE(H2:H${summaryRow})`, style: { bold: true, align: 'center', bgColor: '#f3e8ff' } };
  grid[summaryRow][8] = { raw: `=ROUND(G${summaryRow + 1}, 0)`, style: { bold: true, align: 'center', bgColor: '#fef3c7' } };
  grid[summaryRow][9] = { raw: `=ROUND(I${summaryRow + 1}, 0)`, style: { bold: true, align: 'center', bgColor: '#dcfce7' } };

  return grid;
}

/**
 * Synchronizes student final grades from all 4 quarters into the Yearly Summary Grid
 */
export function syncQuarterMarksToYearly(
  yearlyGrid: GridData,
  quarters: Record<Quarter, QuarterData>,
  students: Student[]
): GridData {
  const newGrid = yearlyGrid.map((r) => [...r]);
  students.slice(0, TOTAL_ROWS - 2).forEach((student, idx) => {
    const row = idx + 1;
    newGrid[row][0] = { raw: (idx + 1).toString(), style: { align: 'center' } };
    newGrid[row][1] = { raw: student.name, style: { align: 'left' } };

    // Get final quarter mark from each quarter
    ([1, 2, 3, 4] as Quarter[]).forEach((q) => {
      const qData = quarters[q];
      if (qData && qData.grid && qData.grid[row]) {
        const qColInfo = getQuarterColumnsInfo(qData.lessonHours || 8);
        const markCell = qData.grid[row][qColInfo.quarterGradeCol];
        const evaluated = evaluateCell(qData.grid, row, qColInfo.quarterGradeCol);
        if (evaluated && evaluated !== '—' && !evaluated.startsWith('#')) {
          newGrid[row][1 + q] = { raw: evaluated, style: { align: 'center', bold: true } };
        } else if (markCell?.raw && !markCell.raw.startsWith('=')) {
          newGrid[row][1 + q] = { raw: markCell.raw, style: { align: 'center', bold: true } };
        }
      }
    });
  });

  return newGrid;
}

/**
 * Creates Lesson-by-Lesson KTP Planning Table matching total teacher hours
 * Columns:
 * Col 0 (A): №
 * Col 1 (B): Четверть
 * Col 2 (C): Часы
 * Col 3 (D): Тема урока по КТП
 * Col 4 (E): Дата план
 * Col 5 (F): Дата факт
 * Col 6 (G): Домашнее задание
 * Col 7 (H): Статус
 */
export function createKtpPlanningGrid(
  totalHours: number,
  ktpLessons: KtpLesson[] = []
): GridData {
  const totalCols = 8;
  const numLessons = Math.max(1, totalHours);
  const totalRows = numLessons + 2; // header + lessons + summary
  const grid = createEmptyGrid(totalRows, totalCols);
  const qh = calculateQuarterHours(totalHours);

  // Headers
  grid[0][0] = { raw: '№', style: { bold: true, align: 'center', bgColor: '#f1f5f9' } };
  grid[0][1] = { raw: 'Четверть', style: { bold: true, align: 'center', bgColor: '#f1f5f9' } };
  grid[0][2] = { raw: 'Часы', style: { bold: true, align: 'center', bgColor: '#f1f5f9' } };
  grid[0][3] = { raw: 'Тема урока (по программе КТП)', style: { bold: true, align: 'left', bgColor: '#f1f5f9' } };
  grid[0][4] = { raw: 'Дата план', style: { bold: true, align: 'center', bgColor: '#f8fafc' } };
  grid[0][5] = { raw: 'Дата факт', style: { bold: true, align: 'center', bgColor: '#f8fafc' } };
  grid[0][6] = { raw: 'Домашнее задание', style: { bold: true, align: 'left', bgColor: '#f8fafc' } };
  grid[0][7] = { raw: 'Статус', style: { bold: true, align: 'center', bgColor: '#f8fafc' } };

  for (let i = 0; i < numLessons; i++) {
    const row = i + 1;
    const lessonNum = i + 1;
    let qStr = 'I';
    if (lessonNum > qh[1] + qh[2] + qh[3]) {
      qStr = 'IV';
    } else if (lessonNum > qh[1] + qh[2]) {
      qStr = 'III';
    } else if (lessonNum > qh[1]) {
      qStr = 'II';
    }

    const ktpItem = ktpLessons.find((k) => k.number === lessonNum) || ktpLessons[i];
    const topicText = ktpItem ? ktpItem.topic : `Урок ${lessonNum}`;

    grid[row][0] = { raw: lessonNum.toString(), style: { align: 'center' } };
    grid[row][1] = { raw: `${qStr} четв.`, style: { align: 'center', textColor: '#475569' } };
    grid[row][2] = { raw: '1 ч', style: { align: 'center' } };
    grid[row][3] = { raw: topicText, style: { align: 'left', bold: !!ktpItem } };
    grid[row][4] = { raw: '', style: { align: 'center' } };
    grid[row][5] = { raw: '', style: { align: 'center' } };
    grid[row][6] = { raw: '', style: { align: 'left' } };
    grid[row][7] = { raw: 'Запланировано', style: { align: 'center', textColor: '#64748b' } };
  }

  // Summary Row
  const summaryRow = totalRows - 1;
  grid[summaryRow][0] = { raw: '∑', style: { bold: true, align: 'center', bgColor: '#f1f5f9' } };
  grid[summaryRow][1] = { raw: 'Всего', style: { bold: true, align: 'center', bgColor: '#f1f5f9' } };
  grid[summaryRow][2] = { raw: `${numLessons} ч`, style: { bold: true, align: 'center', bgColor: '#e0f2fe', textColor: '#0369a1' } };
  grid[summaryRow][3] = { raw: `Всего уроков по программе: ${numLessons}`, style: { bold: true, align: 'left', bgColor: '#f1f5f9' } };
  grid[summaryRow][4] = { raw: '', style: { align: 'center', bgColor: '#f1f5f9' } };
  grid[summaryRow][5] = { raw: '', style: { align: 'center', bgColor: '#f1f5f9' } };
  grid[summaryRow][6] = { raw: '', style: { align: 'left', bgColor: '#f1f5f9' } };
  grid[summaryRow][7] = { raw: '100% плана', style: { bold: true, align: 'center', bgColor: '#ecfdf5', textColor: '#047857' } };

  return grid;
}

/**
 * Creates custom user table with given dimensions and optional student names
 */
export function createCustomTableGrid(
  title: string,
  rows: number = 20,
  cols: number = 10,
  studentNames: string[] = []
): GridData {
  const safeRows = Math.max(5, Math.min(100, rows));
  const safeCols = Math.max(3, Math.min(40, cols));
  const grid = createEmptyGrid(safeRows, safeCols);

  grid[0][0] = { raw: '№', style: { bold: true, align: 'center', bgColor: '#f1f5f9' } };
  grid[0][1] = { raw: 'Ученик (ФИО)', style: { bold: true, align: 'left', bgColor: '#f1f5f9' } };

  for (let c = 2; c < safeCols; c++) {
    grid[0][c] = { raw: `Колонка ${c - 1}`, style: { bold: true, align: 'center', bgColor: '#f8fafc' } };
  }

  const maxStudents = Math.min(studentNames.length, safeRows - 2);
  for (let i = 0; i < maxStudents; i++) {
    const row = i + 1;
    grid[row][0] = { raw: (i + 1).toString(), style: { align: 'center' } };
    grid[row][1] = { raw: studentNames[i], style: { align: 'left' } };
  }

  return grid;
}

/**
 * Creates default initial classes with pure clean tables (isClean: true)
 * 1. 8-А класс (34 часа, 1 ч/неделю: 8, 8, 10, 8 ч)
 * 2. 10-А класс (106 часов, 3+ ч/неделю: 26, 26, 28, 26 ч)
 */
export function createDefaultClasses(): SchoolClass[] {
  const qh34 = calculateQuarterHours(34); // { 1: 8, 2: 8, 3: 10, 4: 8 }
  const quarters34 = {
    1: {
      grid: createClassGradebookGrid('1-й Класс', [], [], qh34[1], 1, true),
      ktp: [],
      lessonHours: qh34[1],
      startLessonNumber: 1,
    },
    2: {
      grid: createClassGradebookGrid('1-й Класс', [], [], qh34[2], 9, true),
      ktp: [],
      lessonHours: qh34[2],
      startLessonNumber: 9,
    },
    3: {
      grid: createClassGradebookGrid('1-й Класс', [], [], qh34[3], 17, true),
      ktp: [],
      lessonHours: qh34[3],
      startLessonNumber: 17,
    },
    4: {
      grid: createClassGradebookGrid('1-й Класс', [], [], qh34[4], 27, true),
      ktp: [],
      lessonHours: qh34[4],
      startLessonNumber: 27,
    },
  };

  const cleanClass: SchoolClass = {
    id: 'class-1',
    name: '1-й Класс',
    subject: '',
    totalHours: 34,
    quarterHours: qh34,
    students: [],
    currentQuarter: 1,
    activeTableId: 'q-1',
    fullKtp: [],
    quarters: quarters34,
    yearlyGrid: createYearlySummaryGrid('1-й Класс', [], quarters34),
    ktpGrid: createKtpPlanningGrid(34, []),
    extraTables: [],
  };

  return [cleanClass];
}

/**
 * Removes a class by ID and computes the next active class ID.
 * If all classes are removed, automatically returns a fresh clean default class.
 */
export function deleteClassFromList(
  classes: SchoolClass[],
  idToDelete: string,
  currentActiveId?: string
): { updatedClasses: SchoolClass[]; nextActiveId: string } {
  const remaining = classes.filter((c) => c.id !== idToDelete);
  if (remaining.length === 0) {
    const defaultClasses = createDefaultClasses();
    return {
      updatedClasses: defaultClasses,
      nextActiveId: defaultClasses[0].id,
    };
  }

  let nextActiveId = currentActiveId || remaining[0].id;
  if (currentActiveId === idToDelete) {
    const deletedIndex = classes.findIndex((c) => c.id === idToDelete);
    const fallbackIndex = Math.min(deletedIndex, remaining.length - 1);
    nextActiveId = remaining[Math.max(0, fallbackIndex)].id;
  }

  return {
    updatedClasses: remaining,
    nextActiveId,
  };
}

/**
 * Normalizes various date inputs (ISO "YYYY-MM-DD", Russian "DD.MM.YYYY", "DD.MM") to ISO "YYYY-MM-DD"
 */
export function normalizeDateToIso(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const ddmmyyyy = clean.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  const ddmm = clean.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (ddmm) {
    const day = ddmm[1].padStart(2, '0');
    const monthNum = parseInt(ddmm[2], 10);
    const month = ddmm[2].padStart(2, '0');
    const now = new Date();
    const currentYear = now.getFullYear();
    const year = monthNum >= 8 ? currentYear : currentYear + 1;
    return `${year}-${month}-${day}`;
  }

  return clean;
}

/**
 * Formats a date into compact Russian school journal format (e.g. "12.09" or "12.09.2024")
 */
export function formatLessonDate(dateStr?: string, includeYear: boolean = false): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (!clean) return '';

  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2];
    const day = isoMatch[3];
    return includeYear ? `${day}.${month}.${year}` : `${day}.${month}`;
  }

  const ruMatch = clean.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{4}))?$/);
  if (ruMatch) {
    const day = ruMatch[1].padStart(2, '0');
    const month = ruMatch[2].padStart(2, '0');
    const year = ruMatch[3];
    if (includeYear && year) {
      return `${day}.${month}.${year}`;
    }
    return `${day}.${month}`;
  }

  return clean;
}

/**
 * Formats date into friendly full Russian string (e.g. "Четверг, 12 сентября 2024 г.")
 */
export function formatFullRussianDate(dateStr?: string): string {
  if (!dateStr) return '';
  const iso = normalizeDateToIso(dateStr);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return dateStr;

  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return dateStr;

  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  const weekdays = [
    'Воскресенье',
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
  ];

  const weekday = weekdays[dateObj.getDay()];
  const monthName = months[m - 1];

  return `${weekday}, ${d} ${monthName} ${y} г.`;
}

/**
 * Gets today's date in local ISO "YYYY-MM-DD"
 */
export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds N days to an ISO date string
 */
export function addDaysToIsoDate(dateStr: string, days: number): string {
  const iso = normalizeDateToIso(dateStr) || getTodayIsoDate();
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  const dateObj = new Date(y, m - 1, d);
  dateObj.setDate(dateObj.getDate() + days);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
