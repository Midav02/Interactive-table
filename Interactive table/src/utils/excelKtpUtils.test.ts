import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  autoDetectSheetConfig,
  extractLessonsFromSheet,
  parseExcelWorkbook,
} from './excelKtpUtils';

test('autoDetectSheetConfig detects topic column by header keyword "Тема урока"', () => {
  const sampleRows = [
    ['Класс', 'Тема урока', 'Кол-во часов'],
    ['8-А', 'Непозиционные и позиционные системы счисления', 1],
    ['8-А', 'Развернутая форма записи числа', 1],
  ];

  const config = autoDetectSheetConfig(sampleRows);
  assert.equal(config.startRow, 1);
  assert.equal(config.topicCol, 1);
});

test('autoDetectSheetConfig detects lesson number, topic, hours and homework columns', () => {
  const sampleRows = [
    ['№ урока', 'Тема занятия', 'Часы', 'Дата', 'Домашнее задание'],
    [1, 'Введение в программирование', 1, '01.09', 'Параграф 1'],
    [2, 'Типы данных и переменные', 1, '08.09', 'Задачи 1-5'],
  ];

  const config = autoDetectSheetConfig(sampleRows);
  assert.equal(config.startRow, 1);
  assert.equal(config.topicCol, 1);
  assert.equal(config.numberCol, 0);
  assert.equal(config.hoursCol, 2);
  assert.equal(config.dateCol, 3);
  assert.equal(config.homeworkCol, 4);
});

test('extractLessonsFromSheet parses all rows into clean KtpLesson array', () => {
  const sampleRows = [
    ['Класс', 'Тема урока'],
    ['', '1. Системы счисления'],
    ['', '2. Арифметика двоичной системы'],
    ['', 'Итого за четверть: 2 ч'], // Should be filtered out
  ];

  const lessons = extractLessonsFromSheet(sampleRows, {
    startRow: 1,
    topicCol: 1,
  });

  assert.equal(lessons.length, 2);
  assert.equal(lessons[0].number, 1);
  assert.equal(lessons[0].topic, 'Системы счисления');
  assert.equal(lessons[1].number, 2);
  assert.equal(lessons[1].topic, 'Арифметика двоичной системы');
});

test('parseExcelWorkbook accurately parses real uploaded Excel file (34 lessons)', () => {
  const filePath = 'public/assets/sample-ktp-8.xlsx';
  if (!fs.existsSync(filePath)) {
    return;
  }

  const buffer = fs.readFileSync(filePath);
  const parsed = parseExcelWorkbook(buffer.buffer, 'КТП 8 класс.xlsx');

  assert.equal(parsed.sheetNames.length, 1);
  assert.equal(parsed.activeSheetName, 'Лист1');

  const sheet = parsed.sheets['Лист1'];
  assert.ok(sheet);
  assert.equal(sheet.rows.length, 35);
  assert.equal(sheet.suggestedConfig.topicCol, 1); // Column B is "Тема урока"

  const lessons = extractLessonsFromSheet(sheet.rows, sheet.suggestedConfig);
  assert.equal(lessons.length, 34);
  assert.equal(lessons[0].number, 1);
  assert.equal(lessons[0].topic, 'Непозиционные и позиционные системы счисления');
  assert.equal(lessons[33].number, 34);
});
