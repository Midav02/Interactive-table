import React, { useState, useRef, useId } from 'react';
import {
  X,
  BookOpen,
  Upload,
  Check,
  FileSpreadsheet,
  FileText,
  Trash2,
  Download,
  Sparkles,
  Search,
  Layers,
  Settings2,
} from 'lucide-react';
import { KtpLesson, parseKtpText } from '../utils/schoolUtils';
import {
  parseExcelWorkbook,
  extractLessonsFromSheet,
  downloadKtpExcelTemplate,
  ParsedWorkbookData,
  ColumnMappingConfig,
} from '../utils/excelKtpUtils';

interface KtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  quarter: number;
  classNameTitle: string;
  onApplyKtp: (fullKtp: KtpLesson[], applyToQuarter: boolean) => void;
}

type TabType = 'excel' | 'text';

export const KtpModal: React.FC<KtpModalProps> = ({
  isOpen,
  onClose,
  quarter,
  classNameTitle,
  onApplyKtp,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('excel');
  const [customText, setCustomText] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [searchPreview, setSearchPreview] = useState<string>('');
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Excel state
  const [workbookData, setWorkbookData] = useState<ParsedWorkbookData | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [sheetConfig, setSheetConfig] = useState<ColumnMappingConfig>({
    startRow: 1,
    topicCol: 0,
  });

  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Active sheet in workbook
  const currentSheet = workbookData && selectedSheetName ? workbookData.sheets[selectedSheetName] : null;

  // Calculate recognized lessons depending on active tab
  let currentLessons: KtpLesson[] = [];
  if (activeTab === 'excel') {
    if (currentSheet) {
      currentLessons = extractLessonsFromSheet(currentSheet.rows, sheetConfig);
    } else if (customText) {
      // Fallback if user uploaded a text file in excel tab
      currentLessons = parseKtpText(customText);
    }
  } else {
    currentLessons = parseKtpText(customText);
  }

  // Handle Excel or CSV file read
  const handleProcessFile = async (file: File) => {
    const isExcel =
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.xlsm') ||
      file.type.includes('sheet') ||
      file.type.includes('excel');

    if (isExcel) {
      try {
        const buffer = await file.arrayBuffer();
        const parsedWb = parseExcelWorkbook(buffer, file.name);
        setWorkbookData(parsedWb);
        setSelectedSheetName(parsedWb.activeSheetName);

        const initialSheet = parsedWb.sheets[parsedWb.activeSheetName];
        if (initialSheet) {
          setSheetConfig(initialSheet.suggestedConfig);
        }
        setActiveTab('excel');
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        // Fallback to text parsing
        const text = await file.text();
        setCustomText(text);
        setActiveTab('text');
      }
    } else {
      // CSV or plain text
      const text = await file.text();
      setCustomText(text);
      // Also try parsing as workbook via XLSX for structured column mapping
      try {
        const buffer = await file.arrayBuffer();
        const parsedWb = parseExcelWorkbook(buffer, file.name);
        setWorkbookData(parsedWb);
        setSelectedSheetName(parsedWb.activeSheetName);
        const initialSheet = parsedWb.sheets[parsedWb.activeSheetName];
        if (initialSheet) {
          setSheetConfig(initialSheet.suggestedConfig);
        }
      } catch {
        // Simple text
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Switch sheet within multi-sheet Excel file
  const handleSheetChange = (sheetName: string) => {
    if (!workbookData) return;
    setSelectedSheetName(sheetName);
    const newSheet = workbookData.sheets[sheetName];
    if (newSheet) {
      setSheetConfig(newSheet.suggestedConfig);
    }
  };

  // Quick 1-click load of official attached 8th grade Excel curriculum
  const handleLoadSampleExcel = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}assets/sample-ktp-8.xlsx`);
      if (!response.ok) throw new Error(`Не удалось загрузить пример КТП: ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], 'КТП_Информатика_8_класс.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      await handleProcessFile(file);
    } catch (err) {
      console.error('Error loading sample Excel:', err);
    }
  };

  const handleSaveToBankOnly = () => {
    if (currentLessons.length === 0) return;
    onApplyKtp(currentLessons, false);
    onClose();
  };

  const handleSaveAndApplyToQuarter = () => {
    if (currentLessons.length === 0) return;
    onApplyKtp(currentLessons, true);
    onClose();
  };

  // Filter preview list
  const filteredLessons = currentLessons.filter((l) =>
    searchPreview.trim() === ''
      ? true
      : l.topic.toLowerCase().includes(searchPreview.toLowerCase()) ||
        l.number.toString().includes(searchPreview.trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Добавление КТП из Excel
                </h2>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {classNameTitle}
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-300">
                  {quarter}-я четверть
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Загрузите файл Excel (.xlsx, .xls), CSV или вставьте список тем
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Quick Actions Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 shrink-0 flex-wrap gap-2">
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('excel')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'excel'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Файл Excel (.xlsx, .xls, .csv)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Вставить текстом</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Template Button */}
            <button
              type="button"
              onClick={() => downloadKtpExcelTemplate(classNameTitle)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Скачать готовый чистый образец Excel файла КТП с колонками"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Скачать шаблон Excel (.xlsx)</span>
              <span className="sm:hidden">Шаблон .xlsx</span>
            </button>

            {/* Load Sample Demo Button */}
            <button
              type="button"
              onClick={handleLoadSampleExcel}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Загрузить пример файла КТП (34 урока) для тестирования"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Пример КТП (34 урока)</span>
              <span className="sm:hidden">Пример</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'excel' ? (
            <div className="space-y-4">
              {/* Drag & Drop File Upload Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                    : workbookData
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id={fileInputId}
                  accept=".xlsx,.xls,.xlsm,.csv,.txt,.tsv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <label
                  htmlFor={fileInputId}
                  className="flex flex-col items-center justify-center cursor-pointer gap-2"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
                      workbookData
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-800 hover:underline">
                      Выберите файл Excel (.xlsx, .xls) или CSV
                    </span>
                    <span className="text-xs text-slate-500"> или перетащите файл в это окно</span>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-md">
                    Поддерживаются файлы любой структуры. Приложение автоматически найдет темы уроков
                    и номера.
                  </p>
                </label>
              </div>

              {/* Uploaded Workbook Inspector */}
              {workbookData && currentSheet && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">{workbookData.fileName}</span>
                      <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                        {currentSheet.rows.length} строк
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowConfig(!showConfig)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer shadow-2xs"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>{showConfig ? 'Скрыть настройки колонок' : 'Настроить колонки'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setWorkbookData(null);
                          setCustomText('');
                        }}
                        className="text-xs text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer"
                        title="Удалить загруженный файл"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Multi-Sheet Selector (if workbook has > 1 sheets) */}
                  {workbookData.sheetNames.length > 1 && (
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-slate-500 font-medium inline-flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        Лист Excel:
                      </span>
                      {workbookData.sheetNames.map((sName) => (
                        <button
                          key={sName}
                          type="button"
                          onClick={() => handleSheetChange(sName)}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            selectedSheetName === sName
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                          }`}
                        >
                          {sName}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Column Mapping Config Box */}
                  {showConfig && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Колонка с темами уроков:
                        </label>
                        <select
                          value={sheetConfig.topicCol}
                          onChange={(e) =>
                            setSheetConfig({
                              ...sheetConfig,
                              topicCol: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-emerald-600"
                        >
                          {currentSheet.columnsList.map((col) => (
                            <option key={`topic-col-${col.index}`} value={col.index}>
                              {col.label} {col.headerText ? `— "${col.headerText}"` : ''}{' '}
                              {col.sample ? `(${col.sample})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Начальная строка с данными (пропуск заголовка):
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, currentSheet.rows.length)}
                          value={sheetConfig.startRow + 1}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                            setSheetConfig({
                              ...sheetConfig,
                              startRow: val - 1,
                            });
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-medium text-slate-800 focus:outline-emerald-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Plain Text / Copy-Paste Mode */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Вставьте список тем уроков (по одной строке на урок):
                </label>
                {customText.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCustomText('')}
                    className="text-xs text-slate-400 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Очистить</span>
                  </button>
                )}
              </div>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={`1. Введение в курс информатики. Инструктаж по ТБ
2. Понятие информации. Свойства информации
3. Двоичная система счисления
4. Практическая работа №1`}
                rows={9}
                className="w-full text-xs font-mono p-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs leading-relaxed"
              />
            </div>
          )}

          {/* Parsed Lessons Live Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Распознано тем: {currentLessons.length}
                </span>
                {currentLessons.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    <Check className="w-3 h-3" />
                    Готово к импорту
                  </span>
                )}
              </div>

              {currentLessons.length > 5 && (
                <div className="relative w-48 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchPreview}
                    onChange={(e) => setSearchPreview(e.target.value)}
                    placeholder="Поиск по урокам..."
                    className="w-full text-xs pl-8 pr-2 py-1 bg-white border border-slate-300 rounded-md focus:outline-emerald-600"
                  />
                </div>
              )}
            </div>

            {currentLessons.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50 text-slate-400 text-xs space-y-1">
                <p className="font-semibold text-slate-600">Темы еще не загружены</p>
                <p>Загрузите файл Excel (.xlsx) выше или нажмите кнопку «Пример КТП (34 урока)»</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
                {filteredLessons.map((l) => (
                  <div
                    key={`preview-lesson-${l.number}`}
                    className="flex items-center gap-3 px-3.5 py-2 text-xs hover:bg-slate-50/80 transition-colors"
                  >
                    <span className="w-8 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">
                      {l.number}
                    </span>
                    <span className="text-slate-800 font-medium truncate flex-1" title={l.topic}>
                      {l.topic}
                    </span>
                  </div>
                ))}
                {filteredLessons.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    По запросу «{searchPreview}» уроков не найдено
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50/80 shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Отмена
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentLessons.length === 0}
              onClick={handleSaveToBankOnly}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all border shadow-2xs ${
                currentLessons.length === 0
                  ? 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed'
                  : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 cursor-pointer'
              }`}
              title="Сохранить все темы в банк КТП класса (можно будет выбирать вручную для каждого урока)"
            >
              Сохранить в банк КТП ({currentLessons.length})
            </button>

            <button
              type="button"
              disabled={currentLessons.length === 0}
              onClick={handleSaveAndApplyToQuarter}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${
                currentLessons.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[0.98]'
              }`}
              title={`Сохранить в банк и сразу заполнить заголовки уроков в ${quarter}-й четверти`}
            >
              <Check className="w-4 h-4" />
              <span>Применить к {quarter}-й четверти</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
