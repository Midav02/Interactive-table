import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultClasses,
  createClassGradebookGrid,
  calculateQuarterHours,
  getQuarterStartLesson,
  clearGradesInGrid,
  assignTopicToColumn,
  applyKtpToGrid,
  parseKtpText,
  INFORMATICS_8_FULL_KTP,
  getQuarterColumnsInfo,
  createYearlySummaryGrid,
  createKtpPlanningGrid,
  syncQuarterMarksToYearly,
  deleteClassFromList,
  syncStudentsAcrossAllQuarters,
  assignDateToColumn,
  normalizeDateToIso,
  formatLessonDate,
  formatFullRussianDate,
  addDaysToIsoDate,
} from './schoolUtils';
import { evaluateCell, TOTAL_ROWS, TOTAL_COLS } from './tableUtils';

test('calculateQuarterHours correctly distributes 34, 106 and other teacher hours', () => {
  const qh34 = calculateQuarterHours(34);
  assert.equal(qh34[1] + qh34[2] + qh34[3] + qh34[4], 34);
  assert.deepEqual(qh34, { 1: 8, 2: 8, 3: 10, 4: 8 });

  const qh106 = calculateQuarterHours(106);
  assert.equal(qh106[1] + qh106[2] + qh106[3] + qh106[4], 106);
  assert.deepEqual(qh106, { 1: 26, 2: 26, 3: 28, 4: 26 });

  const qh68 = calculateQuarterHours(68);
  assert.equal(qh68[1] + qh68[2] + qh68[3] + qh68[4], 68);

  // Cumulative starting lesson calculation
  assert.equal(getQuarterStartLesson(1, qh34), 1);
  assert.equal(getQuarterStartLesson(2, qh34), 9);
  assert.equal(getQuarterStartLesson(3, qh34), 17);
  assert.equal(getQuarterStartLesson(4, qh34), 27);

  assert.equal(getQuarterStartLesson(1, qh106), 1);
  assert.equal(getQuarterStartLesson(2, qh106), 27);
  assert.equal(getQuarterStartLesson(3, qh106), 53);
  assert.equal(getQuarterStartLesson(4, qh106), 81);
});

test('getQuarterColumnsInfo removes extra ghost columns and matches exact lesson hours', () => {
  // For 8 lesson hours: 2 (№, ФИО) + 8 (lessons) + 1 (ср. балл) + 1 (оценка за четв.) = 12 cols
  const info8 = getQuarterColumnsInfo(8);
  assert.equal(info8.totalCols, 12);
  assert.equal(info8.lastLessonCol, 9);
  assert.equal(info8.avgGradeCol, 10);
  assert.equal(info8.quarterGradeCol, 11);

  // For 10 lesson hours (Q3 in 34h): exactly 14 cols
  const info10 = getQuarterColumnsInfo(10);
  assert.equal(info10.totalCols, 14);

  // For 26 lesson hours (Q1 in 106h): exactly 30 cols
  const info26 = getQuarterColumnsInfo(26);
  assert.equal(info26.totalCols, 30);
});

test('createClassGradebookGrid creates a pure clean table with exact width (isClean: true)', () => {
  const students = ['Алексеев Максим', 'Борисов Артем'];
  // Clean table for Q1 of 34-hour course (8 lessons) -> exactly 12 columns
  const grid = createClassGradebookGrid('8-А класс', students, INFORMATICS_8_FULL_KTP, 8, 1, true);

  const { lastLessonCol, avgGradeCol, quarterGradeCol, totalCols } = getQuarterColumnsInfo(8);
  assert.equal(totalCols, 12);
  assert.equal(grid[0].length, 12); // No extra M..T padding columns!
  assert.equal(lastLessonCol, 9); // C to J (8 lessons)
  assert.equal(avgGradeCol, 10); // Col K
  assert.equal(quarterGradeCol, 11); // Col L

  // Check headers
  assert.equal(grid[0][0].raw, '№');
  assert.equal(grid[0][1].raw, 'Ученик (ФИО)');
  assert.ok(grid[0][2].raw.includes('системы счисления'));
  assert.equal(grid[0][avgGradeCol].raw, 'Ср. балл');
  assert.equal(grid[0][quarterGradeCol].raw, 'Оценка за четв.');

  // Clean table verification: student grades MUST BE EMPTY!
  for (let c = 2; c <= lastLessonCol; c++) {
    assert.equal(grid[1][c].raw, '', `Cell in row 1, col ${c} must be empty`);
    assert.equal(grid[2][c].raw, '', `Cell in row 2, col ${c} must be empty`);
  }

  // Without grades entered, average and quarter mark evaluate to empty string
  assert.equal(evaluateCell(grid, 1, avgGradeCol), '');
  assert.equal(evaluateCell(grid, 1, quarterGradeCol), '');

  // Now simulate teacher entering grades: 5 for lesson 1, 4 for lesson 2
  grid[1][2] = { raw: '5' };
  grid[1][3] = { raw: '4' };

  // Average should immediately calculate: (5 + 4) / 2 = 4.5
  assert.equal(evaluateCell(grid, 1, avgGradeCol), '4.5');
  // Quarter grade rounds to 5
  assert.equal(evaluateCell(grid, 1, quarterGradeCol), '5');
});

test('createYearlySummaryGrid generates 10-column Annual Summary with formulas', () => {
  const students = ['Иванов Иван', 'Петров Петр'];
  const yearlyGrid = createYearlySummaryGrid('8-А класс', students);

  assert.equal(yearlyGrid[0].length, 10);
  assert.equal(yearlyGrid[0][0].raw, '№');
  assert.equal(yearlyGrid[0][1].raw, 'Ученик (ФИО)');
  assert.equal(yearlyGrid[0][2].raw, 'I четв.');
  assert.equal(yearlyGrid[0][3].raw, 'II четв.');
  assert.equal(yearlyGrid[0][4].raw, 'III четв.');
  assert.equal(yearlyGrid[0][5].raw, 'IV четв.');
  assert.equal(yearlyGrid[0][6].raw, 'Ср. балл');
  assert.equal(yearlyGrid[0][7].raw, 'Экзамен');
  assert.equal(yearlyGrid[0][8].raw, 'Годовая');
  assert.equal(yearlyGrid[0][9].raw, 'Итоговая');

  // Verify formula in row 1
  assert.equal(yearlyGrid[1][6].raw, '=AVERAGE(C2:F2)');
  assert.equal(yearlyGrid[1][8].raw, '=ROUND(G2, 0)');
  assert.equal(yearlyGrid[1][9].raw, '=ROUND(I2, 0)');

  // Put marks: 5, 4, 5, 4 -> Average = 4.5 -> Round = 5
  yearlyGrid[1][2] = { raw: '5' };
  yearlyGrid[1][3] = { raw: '4' };
  yearlyGrid[1][4] = { raw: '5' };
  yearlyGrid[1][5] = { raw: '4' };

  assert.equal(evaluateCell(yearlyGrid, 1, 6), '4.5');
  assert.equal(evaluateCell(yearlyGrid, 1, 8), '5');
  assert.equal(evaluateCell(yearlyGrid, 1, 9), '5');
});

test('createKtpPlanningGrid creates lesson-by-lesson table matching total hours', () => {
  const ktpGrid = createKtpPlanningGrid(34, INFORMATICS_8_FULL_KTP);
  assert.equal(ktpGrid[0].length, 8); // 8 columns
  assert.equal(ktpGrid.length, 36); // header + 34 lessons + summary row

  assert.equal(ktpGrid[1][0].raw, '1');
  assert.equal(ktpGrid[1][1].raw, 'I четв.');
  assert.ok(ktpGrid[1][3].raw.includes('системы счисления'));

  assert.equal(ktpGrid[34][0].raw, '34');
  assert.equal(ktpGrid[34][1].raw, 'IV четв.');

  // Summary row
  assert.equal(ktpGrid[35][2].raw, '34 ч');
});

test('syncQuarterMarksToYearly synchronizes quarter marks into the yearly grid', () => {
  const students = [{ id: 's-1', name: 'Иванов Иван' }];
  const classes = createDefaultClasses();
  const cls = classes[0]; // 8-A class

  // Enter quarter mark in Q1
  const q1Info = getQuarterColumnsInfo(8);
  cls.quarters[1].grid[1][2] = { raw: '5' };
  cls.quarters[1].grid[1][3] = { raw: '5' };

  const yearly = createYearlySummaryGrid('8-А', ['Иванов Иван'], cls.quarters);
  const synced = syncQuarterMarksToYearly(yearly, cls.quarters, students);

  assert.equal(synced[1][2].raw, '5'); // Q1 mark pulled into Yearly summary
});

test('clearGradesInGrid resets all grades back to clean table', () => {
  const students = ['Петров Иван'];
  const grid = createClassGradebookGrid('8-А', students, [], 8, 1, false);
  grid[1][2] = { raw: '5' };
  grid[1][3] = { raw: '3' };

  const cleaned = clearGradesInGrid(grid, 8);
  assert.equal(cleaned[1][2].raw, '');
  assert.equal(cleaned[1][3].raw, '');
  assert.equal(cleaned[1][1].raw, 'Петров Иван');
});

test('default class features 34 hours clean table with 0 students and empty topics', () => {
  const classes = createDefaultClasses();
  assert.equal(classes.length, 1);

  // 1-й Класс is 34 hours, 0 mock students, clean KTP
  assert.equal(classes[0].totalHours, 34);
  assert.equal(classes[0].students.length, 0);
  assert.equal(classes[0].fullKtp.length, 0);
  assert.equal(classes[0].quarters[1].lessonHours, 8);
  assert.equal(classes[0].quarters[1].grid[0].length, 12); // Exactly 12 cols, no padding
  assert.equal(classes[0].quarters[1].grid[0][2].raw, 'Урок 1'); // Clean lesson header
  assert.ok(classes[0].yearlyGrid !== undefined);
  assert.ok(classes[0].ktpGrid !== undefined);
});

test('deleteClassFromList correctly deletes classes and updates next active class', () => {
  const c1 = { ...createDefaultClasses()[0], id: 'c-1', name: '7-А' };
  const c2 = { ...createDefaultClasses()[0], id: 'c-2', name: '8-Б' };
  const c3 = { ...createDefaultClasses()[0], id: 'c-3', name: '9-В' };

  const initialList = [c1, c2, c3];

  // 1. Deleting a non-active class
  const r1 = deleteClassFromList(initialList, 'c-2', 'c-1');
  assert.equal(r1.updatedClasses.length, 2);
  assert.equal(r1.nextActiveId, 'c-1');
  assert.deepEqual(r1.updatedClasses.map((c) => c.id), ['c-1', 'c-3']);

  // 2. Deleting the active class chooses adjacent class
  const r2 = deleteClassFromList(initialList, 'c-2', 'c-2');
  assert.equal(r2.updatedClasses.length, 2);
  assert.equal(r2.nextActiveId, 'c-3'); // selects adjacent

  // 3. Deleting last remaining class regenerates a fresh clean class
  const r3 = deleteClassFromList([c1], 'c-1', 'c-1');
  assert.equal(r3.updatedClasses.length, 1);
  assert.ok(r3.nextActiveId.length > 0);
  assert.equal(r3.updatedClasses[0].name, '1-й Класс');
});

test('syncStudentsAcrossAllQuarters ensures students exist in all 4 quarters and yearly grid', () => {
  const cls = createDefaultClasses()[0];
  const newStudents = [
    { id: 's-1', name: 'Алексеев Алексей' },
    { id: 's-2', name: 'Борисов Борис' },
    { id: 's-3', name: 'Васильев Василий' },
  ];

  const syncedCls = syncStudentsAcrossAllQuarters(cls, newStudents);

  assert.equal(syncedCls.students.length, 3);

  // Check every quarter 1 to 4 has all 3 students
  ([1, 2, 3, 4] as const).forEach((q) => {
    const grid = syncedCls.quarters[q].grid;
    assert.equal(grid[1][1].raw, 'Алексеев Алексей', `Q${q} student 1`);
    assert.equal(grid[2][1].raw, 'Борисов Борис', `Q${q} student 2`);
    assert.equal(grid[3][1].raw, 'Васильев Василий', `Q${q} student 3`);
  });

  // Check yearly grid has all 3 students
  assert.ok(syncedCls.yearlyGrid);
  assert.equal(syncedCls.yearlyGrid[1][1].raw, 'Алексеев Алексей');
  assert.equal(syncedCls.yearlyGrid[2][1].raw, 'Борисов Борис');
  assert.equal(syncedCls.yearlyGrid[3][1].raw, 'Васильев Василий');
});

test('normalizeDateToIso converts ISO, DD.MM.YYYY and DD.MM correctly', () => {
  assert.equal(normalizeDateToIso('2024-09-12'), '2024-09-12');
  assert.equal(normalizeDateToIso('12.09.2024'), '2024-09-12');
  assert.equal(normalizeDateToIso('05/11/2024'), '2024-11-05');
  assert.equal(normalizeDateToIso(''), '');
});

test('formatLessonDate formats compact and full dates', () => {
  assert.equal(formatLessonDate('2024-09-12'), '12.09');
  assert.equal(formatLessonDate('2024-09-12', true), '12.09.2024');
  assert.equal(formatLessonDate('12.09.2024'), '12.09');
  assert.equal(formatLessonDate(''), '');
});

test('formatFullRussianDate returns Russian weekday and month', () => {
  const formatted = formatFullRussianDate('2024-09-12');
  assert.ok(formatted.includes('12'));
  assert.ok(formatted.includes('сентября'));
  assert.ok(formatted.includes('2024'));
});

test('addDaysToIsoDate increments date correctly', () => {
  assert.equal(addDaysToIsoDate('2024-09-12', 7), '2024-09-19');
  assert.equal(addDaysToIsoDate('2024-09-28', 5), '2024-10-03');
});

test('assignTopicToColumn and assignDateToColumn set and preserve dates', () => {
  const cls = createDefaultClasses()[0];
  const grid = cls.quarters[1].grid;

  // 1. Assign topic with date
  const updated1 = assignTopicToColumn(
    grid,
    2,
    { number: 1, topic: 'Информация и информационные процессы' },
    1,
    '2024-09-02'
  );
  assert.equal(updated1[0][2].raw, '1. Информация и информационные процессы');
  assert.equal(updated1[0][2].date, '2024-09-02');

  // 2. Assign date only without changing topic
  const updated2 = assignDateToColumn(updated1, 2, '2024-09-09');
  assert.equal(updated2[0][2].raw, '1. Информация и информационные процессы');
  assert.equal(updated2[0][2].date, '2024-09-09');

  // 3. Clear date
  const updated3 = assignDateToColumn(updated2, 2, '');
  assert.equal(updated3[0][2].raw, '1. Информация и информационные процессы');
  assert.equal(updated3[0][2].date, undefined);
});


