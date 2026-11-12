import * as XLSX from 'xlsx';
import { KtpLesson } from './schoolUtils';

export interface ColumnMappingConfig {
  startRow: number;
  topicCol: number;
  numberCol?: number;
  hoursCol?: number;
  dateCol?: number;
  homeworkCol?: number;
}

export interface SheetInfo {
  name: string;
  rows: any[][];
  suggestedConfig: ColumnMappingConfig;
  columnsList: { index: number; label: string; headerText: string; sample: string }[];
}

export interface ParsedWorkbookData {
  fileName: string;
  sheetNames: string[];
  activeSheetName: string;
  sheets: Record<string, SheetInfo>;
}

/**
 * Keywords for detecting topic column
 */
const TOPIC_KEYWORDS = [
  'тема урока',
  'тема занятия',
  'тема',
  'наименование темы',
  'наименование',
  'содержание урока',
  'содержание',
  'раздел',
  'программа',
];

/**
 * Keywords for detecting lesson number column
 */
const NUMBER_KEYWORDS = ['№', 'номер', '№ урока', '№ п/п', 'п/п', 'код'];

/**
 * Keywords for detecting hours column
 */
const HOURS_KEYWORDS = ['час', 'часы', 'кол-во часов', 'количество часов', 'ч.'];

/**
 * Keywords for detecting date column
 */
const DATE_KEYWORDS = ['дата', 'дата план', 'дата факт', 'срок'];

/**
 * Keywords for detecting homework column
 */
const HOMEWORK_KEYWORDS = ['дз', 'домашнее задание', 'домашнее', 'задание', 'примечание'];

/**
 * Auto-detects the best column mapping for a given 2D sheet array
 */
export function autoDetectSheetConfig(rows: any[][]): ColumnMappingConfig {
  let headerRowIndex = 0;
  let topicCol = -1;
  let numberCol = -1;
  let hoursCol = -1;
  let dateCol = -1;
  let homeworkCol = -1;

  // 1. Search the first 10 rows for a recognizable header row
  const maxSearchRows = Math.min(10, rows.length);
  for (let r = 0; r < maxSearchRows; r++) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').trim().toLowerCase();
      if (!val) continue;

      // Check number column first so "№ урока" doesn't get picked as topic
      if (numberCol === -1 && (val.includes('№') || val.includes('номер') || val.includes('п/п'))) {
        numberCol = c;
        headerRowIndex = r;
      } else if (topicCol === -1 && TOPIC_KEYWORDS.some((kw) => val.includes(kw))) {
        headerRowIndex = r;
        topicCol = c;
      }
    }
    if (topicCol !== -1) break;
  }

  const startRow = headerRowIndex + 1;
  const headerRow = rows[headerRowIndex] || [];

  // Check other headers in that header row
  for (let c = 0; c < headerRow.length; c++) {
    const val = String(headerRow[c] || '').trim().toLowerCase();
    if (!val) continue;

    if (numberCol === -1 && NUMBER_KEYWORDS.some((kw) => val === kw || val.includes(kw))) {
      numberCol = c;
    } else if (hoursCol === -1 && HOURS_KEYWORDS.some((kw) => val.includes(kw))) {
      hoursCol = c;
    } else if (dateCol === -1 && DATE_KEYWORDS.some((kw) => val.includes(kw))) {
      dateCol = c;
    } else if (homeworkCol === -1 && HOMEWORK_KEYWORDS.some((kw) => val.includes(kw))) {
      homeworkCol = c;
    }
  }

  // 2. If topic column was not found via header, detect by content characteristics
  if (topicCol === -1) {
    let maxAvgLength = 0;
    const colCount = Math.max(...rows.slice(0, 15).map((r) => r.length), 0);

    for (let c = 0; c < colCount; c++) {
      let totalLen = 0;
      let count = 0;
      for (let r = 0; r < Math.min(30, rows.length); r++) {
        const val = String(rows[r]?.[c] || '').trim();
        if (val.length > 0) {
          totalLen += val.length;
          count++;
        }
      }
      const avgLen = count > 0 ? totalLen / count : 0;
      if (avgLen > maxAvgLength) {
        maxAvgLength = avgLen;
        topicCol = c;
      }
    }

    if (topicCol === -1) topicCol = 0;
  }

  return {
    startRow,
    topicCol: Math.max(0, topicCol),
    numberCol: numberCol !== -1 ? numberCol : undefined,
    hoursCol: hoursCol !== -1 ? hoursCol : undefined,
    dateCol: dateCol !== -1 ? dateCol : undefined,
    homeworkCol: homeworkCol !== -1 ? homeworkCol : undefined,
  };
}

/**
 * Extracts column descriptors for UI dropdowns
 */
export function buildColumnsList(rows: any[][], headerRowIndex: number = 0) {
  const colCount = Math.max(...rows.slice(0, 20).map((r) => r.length), 0);
  const headerRow = rows[headerRowIndex] || [];

  return Array.from({ length: colCount }, (_, colIdx) => {
    const letter = getExcelColumnLabel(colIdx);
    const headerText = String(headerRow[colIdx] || '').trim();

    // Find first non-empty sample cell below header
    let sample = '';
    for (let r = headerRowIndex + 1; r < Math.min(rows.length, headerRowIndex + 6); r++) {
      const s = String(rows[r]?.[colIdx] || '').trim();
      if (s) {
        sample = s.length > 28 ? s.substring(0, 28) + '...' : s;
        break;
      }
    }

    return {
      index: colIdx,
      label: `Столбец ${letter}`,
      headerText,
      sample,
    };
  });
}

function getExcelColumnLabel(colIndex: number): string {
  let label = '';
  let n = colIndex;
  while (n >= 0) {
    label = String.fromCharCode((n % 26) + 65) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

/**
 * Reads an Excel ArrayBuffer and returns structured metadata
 */
export function parseExcelWorkbook(buffer: ArrayBuffer, fileName: string): ParsedWorkbookData {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheetNames = wb.SheetNames;
  const sheets: Record<string, SheetInfo> = {};

  sheetNames.forEach((sName) => {
    const ws = wb.Sheets[sName];
    const rows = ws
      ? (XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][])
      : [];
    const suggestedConfig = autoDetectSheetConfig(rows);
    const columnsList = buildColumnsList(
      rows,
      Math.max(0, suggestedConfig.startRow - 1)
    );

    sheets[sName] = {
      name: sName,
      rows,
      suggestedConfig,
      columnsList,
    };
  });

  return {
    fileName,
    sheetNames,
    activeSheetName: sheetNames[0] || '',
    sheets,
  };
}

/**
 * Extracts clean KtpLesson array from sheet rows using configured mapping
 */
export function extractLessonsFromSheet(
  rows: any[][],
  config: ColumnMappingConfig
): KtpLesson[] {
  const lessons: KtpLesson[] = [];
  const { startRow, topicCol, numberCol, dateCol } = config;

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const rawTopic = String(row[topicCol] || '').trim();
    if (!rawTopic) continue;

    // Filter out total/summary rows (e.g. "Итого: 34", "Всего за четверть", etc.)
    if (
      /^(итого|всего)(\s*[:\d]|\s*(за|по|часов))/i.test(rawTopic) ||
      rawTopic.toLowerCase() === 'итого' ||
      rawTopic.toLowerCase() === 'всего'
    ) {
      continue;
    }

    let lessonNum: number | null = null;
    if (numberCol !== undefined && row[numberCol] !== undefined) {
      const parsedNum = parseInt(String(row[numberCol]), 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        lessonNum = parsedNum;
      }
    }

    // If topic string itself begins with "1. " or "1) ", extract number and clean title
    const match = rawTopic.match(/^(\d+)[.\s;:)-]+\s*(.+)$/);
    let finalTopic = rawTopic;

    if (match) {
      if (lessonNum === null) {
        lessonNum = parseInt(match[1], 10);
      }
      finalTopic = match[2].trim();
    }

    const assignedNumber = lessonNum !== null ? lessonNum : lessons.length + 1;

    let dateVal: string | undefined = undefined;
    if (dateCol !== undefined && row[dateCol] !== undefined) {
      const rawD = String(row[dateCol]).trim();
      if (rawD) {
        dateVal = rawD;
      }
    }

    lessons.push({
      number: assignedNumber,
      topic: finalTopic,
      date: dateVal,
    });
  }

  // Ensure consecutive sequential numbers if duplicates or missing
  return lessons.map((l, idx) => ({
    number: idx + 1,
    topic: l.topic,
    date: l.date,
  }));
}

/**
 * Generates and downloads a clean starter Excel KTP template (.xlsx)
 */
export function downloadKtpExcelTemplate(subjectName: string = 'Информатика') {
  const headers = [
    '№ урока',
    'Тема урока (согласно рабочей программе)',
    'Кол-во часов',
    'Дата план',
    'Дата факт',
    'Домашнее задание',
    'Примечание',
  ];

  const sampleRows = [
    [1, 'Введение в курс. Инструктаж по технике безопасности', 1, '02.09.2024', '', '§1, конспект в тетради', 'Вводный урок'],
    [2, 'Понятие информации. Свойства и виды информации', 1, '09.09.2024', '', '§2, вопросы 1–5 на стр. 14', ''],
    [3, 'Единицы измерения информации. Алфавитный подход', 1, '16.09.2024', '', '§3, решить задачи №1-3', ''],
    [4, 'Практическая работа №1 «Вычисление информационного объема»', 1, '23.09.2024', '', 'Повторить §§ 1–3 к опросу', 'Практикум'],
    [5, 'Кодирование текстовой информации', 1, '30.09.2024', '', '§4, таблица кодировок', ''],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 10 }, // №
    { wch: 55 }, // Тема
    { wch: 14 }, // Часы
    { wch: 14 }, // Дата план
    { wch: 14 }, // Дата факт
    { wch: 35 }, // ДЗ
    { wch: 20 }, // Примечание
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'КТП');

  const fileData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([fileData], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Шаблон_КТП_${subjectName.replace(/\s+/g, '_')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
