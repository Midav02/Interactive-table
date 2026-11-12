import React, { useRef } from 'react';
import {
  Table,
  Download,
  Upload,
  Trash2,
  BookOpen,
  Calendar,
  Clock,
  RotateCcw,
  BarChart3,
  Plus,
  RefreshCw,
  X,
  FileSpreadsheet,
  GraduationCap,
} from 'lucide-react';
import { Quarter, ExtraTable } from '../utils/schoolUtils';

interface HeaderProps {
  currentQuarter: Quarter;
  activeTableId: string;
  onChangeQuarter: (quarter: Quarter) => void;
  onSelectTable: (tableId: string) => void;
  onOpenAddTableModal: () => void;
  onOpenKtpModal: () => void;
  onLoadSample: () => void;
  onClearGrades: () => void;
  onClearTable: () => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
  nonEmptyCount: number;
  activeClassName: string;
  fullKtpCount: number;
  totalHours?: number;
  quarterHours?: number;
  extraTables?: ExtraTable[];
  onSyncYearlyMarks?: () => void;
  onDeleteExtraTable?: (tableId: string) => void;
  onOpenManageClasses?: () => void;
  onDeleteCurrentClass?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentQuarter,
  activeTableId,
  onChangeQuarter,
  onSelectTable,
  onOpenAddTableModal,
  onOpenKtpModal,
  onLoadSample,
  onClearGrades,
  onClearTable,
  onExportCSV,
  onImportCSV,
  nonEmptyCount,
  activeClassName,
  fullKtpCount,
  totalHours = 34,
  quarterHours = 8,
  extraTables = [],
  onSyncYearlyMarks,
  onDeleteExtraTable,
  onOpenManageClasses,
  onDeleteCurrentClass,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSV(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const quarters: { id: Quarter; tableId: string; label: string; short: string }[] = [
    { id: 1, tableId: 'q-1', label: 'I четверть', short: 'I четв.' },
    { id: 2, tableId: 'q-2', label: 'II четверть', short: 'II четв.' },
    { id: 3, tableId: 'q-3', label: 'III четверть', short: 'III четв.' },
    { id: 4, tableId: 'q-4', label: 'IV четверть', short: 'IV четв.' },
  ];

  const isQuarterActive = activeTableId.startsWith('q-');
  const isYearlyActive = activeTableId === 'yearly';
  const isKtpActive = activeTableId === 'ktp';
  const activeExtraTable = extraTables.find((t) => t.id === activeTableId);

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2.5 sm:px-6 shadow-2xs">
      {/* Top row: Branding, Class info & Global utilities */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-2.5 border-b border-slate-100">
        {/* Title, Branding & Active Class indicator */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Интерактивная таблица
              </h1>

              {/* Active class badge with quick management and deletion */}
              <div className="inline-flex items-center bg-emerald-50 border border-emerald-200 rounded-full pl-2 pr-1 py-0.5 shadow-2xs gap-1">
                <button
                  type="button"
                  onClick={onOpenManageClasses}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
                  title="Открыть управление классами (смена, добавление, удаление)"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeClassName}</span>
                </button>

                {onDeleteCurrentClass && (
                  <button
                    type="button"
                    onClick={onDeleteCurrentClass}
                    className="p-0.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-100/60 transition-colors cursor-pointer"
                    title={`Удалить класс «${activeClassName}»`}
                    aria-label={`Удалить класс ${activeClassName}`}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </div>

              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs"
                title={`Годовая нагрузка: ${totalHours} ч. В ${currentQuarter}-й четверти: ${quarterHours} ч. Лишние столбцы убраны.`}
              >
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>{totalHours} ч ({quarterHours} ч в {currentQuarter}-й четв.)</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isQuarterActive && `Журнал ${currentQuarter}-й четверти: ровно ${quarterHours} уроков, средний балл и оценка (лишние столбцы убраны)`}
              {isYearlyActive && 'Сводная годовая ведомость: оценки I-IV четвертей, экзамен, средний балл и годовая'}
              {isKtpActive && `Поурочный план КТП: все ${totalHours} уроков курса с датами, ДЗ и статусом`}
              {activeExtraTable && `Таблица «${activeExtraTable.name}»`}
            </p>
          </div>
        </div>

        {/* Right Action Controls: Clean Table, CSV operations */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Yearly Sync button if yearly table is active */}
          {isYearlyActive && onSyncYearlyMarks && (
            <button
              type="button"
              onClick={onSyncYearlyMarks}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors border border-sky-300 shadow-2xs cursor-pointer"
              title="Перенести оценки из I-IV четвертей в сводную таблицу"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
              <span>Обновить из четвертей</span>
            </button>
          )}

          {/* Clean table button */}
          <button
            type="button"
            onClick={onClearGrades}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-300 shadow-2xs cursor-pointer"
            title="Очистить оценки / значения (структура таблицы, ученики и темы сохраняются)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Чистая таблица</span>
          </button>

          {/* Import CSV */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 shadow-2xs cursor-pointer"
            title="Загрузить CSV файл"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Импорт</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-300 shadow-2xs cursor-pointer"
            title="Скачать текущую активную таблицу как CSV файл"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Экспорт</span>
          </button>

          {/* Clear Table completely */}
          <button
            type="button"
            onClick={onClearTable}
            disabled={nonEmptyCount === 0}
            className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors border shadow-2xs ${
              nonEmptyCount === 0
                ? 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed'
                : 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200 cursor-pointer'
            }`}
            title="Полностью очистить все ячейки (пустая сетка)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom row: Table Navigation (Quarters, Annual summary, KTP plan, Custom tables, + Table) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quarter Switcher group */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 shadow-2xs">
            <div className="flex items-center px-2 py-1 text-xs font-semibold text-slate-500 gap-1 select-none">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Четверть:</span>
            </div>
            {quarters.map((q) => {
              const isSelected = activeTableId === q.tableId;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    onChangeQuarter(q.id);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                  title={`${q.label} (${quarterHours} уроков по нагрузке учителя)`}
                >
                  <span className="hidden sm:inline">{q.label}</span>
                  <span className="sm:hidden">{q.short}</span>
                </button>
              );
            })}
          </div>

          {/* Separator */}
          <div className="h-5 w-px bg-slate-300 hidden sm:block" />

          {/* Companion tables: Yearly summary */}
          <button
            type="button"
            onClick={() => onSelectTable('yearly')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-2xs transition-all cursor-pointer ${
              isYearlyActive
                ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-300'
            }`}
            title="Годовая ведомость оценок (I-IV четверти, средний балл, экзамен, итоговая)"
          >
            <BarChart3 className={`w-3.5 h-3.5 ${isYearlyActive ? 'text-white' : 'text-sky-600'}`} />
            <span>Сводная за год</span>
          </button>

          {/* Companion tables: KTP Plan */}
          <button
            type="button"
            onClick={() => onSelectTable('ktp')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-2xs transition-all cursor-pointer ${
              isKtpActive
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-300'
            }`}
            title={`Поурочный план КТП на все ${totalHours} уроков`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${isKtpActive ? 'text-white' : 'text-emerald-600'}`} />
            <span>План КТП ({totalHours} ч)</span>
          </button>

          {/* User added extra tables */}
          {extraTables.map((tbl) => {
            const isSelected = activeTableId === tbl.id;
            return (
              <div
                key={tbl.id}
                className={`inline-flex items-center rounded-lg border shadow-2xs text-xs font-semibold overflow-hidden transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectTable(tbl.id)}
                  className="px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>{tbl.name}</span>
                </button>
                {onDeleteExtraTable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteExtraTable(tbl.id);
                    }}
                    className={`px-1.5 py-1.5 transition-colors cursor-pointer ${
                      isSelected ? 'hover:bg-emerald-700 text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-red-600'
                    }`}
                    title="Удалить эту таблицу"
                    aria-label={`Удалить таблицу ${tbl.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* + Add Table button */}
          <button
            type="button"
            onClick={onOpenAddTableModal}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Добавить дополнительную таблицу к этому классу"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Таблица</span>
          </button>
        </div>

        {/* User's custom KTP button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenKtpModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition-colors border cursor-pointer ${
              fullKtpCount > 0
                ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 border-emerald-300'
            }`}
            title="Загрузить файл КТП из Excel (.xlsx, .xls) или ввести темы уроков"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{fullKtpCount > 0 ? `Мой КТП (${fullKtpCount} тем)` : '+ КТП из Excel'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
