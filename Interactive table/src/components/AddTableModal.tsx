import React, { useState } from 'react';
import { X, Plus, Table, BookOpen, BarChart3, CheckSquare, Grid } from 'lucide-react';
import { TableViewType } from '../utils/schoolUtils';

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTable: (
    title: string,
    type: TableViewType,
    rows: number,
    cols: number,
    includeStudents: boolean
  ) => void;
  activeClassName: string;
  totalHours: number;
}

export const AddTableModal: React.FC<AddTableModalProps> = ({
  isOpen,
  onClose,
  onAddTable,
  activeClassName,
  totalHours,
}) => {
  const [selectedType, setSelectedType] = useState<TableViewType>('custom');
  const [title, setTitle] = useState('Контрольные работы');
  const [rows, setRows] = useState(25);
  const [cols, setCols] = useState(10);
  const [includeStudents, setIncludeStudents] = useState(true);

  if (!isOpen) return null;

  const handleSelectTemplate = (type: TableViewType, defaultTitle: string, defaultCols: number) => {
    setSelectedType(type);
    setTitle(defaultTitle);
    setCols(defaultCols);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTable(title.trim(), selectedType, rows, cols, includeStudents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Добавить таблицу к классу</h2>
              <p className="text-xs text-slate-500">
                Класс: <span className="font-semibold text-slate-700">{activeClassName}</span> ({totalHours} ч)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Preset templates */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Тип новой таблицы
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Yearly Summary */}
              <button
                type="button"
                onClick={() => handleSelectTemplate('yearly', 'Сводная за год', 10)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedType === 'yearly'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className={`w-5 h-5 shrink-0 mt-0.5 ${selectedType === 'yearly' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Сводная ведомость</div>
                  <div className="text-xs text-slate-500">I-IV четверти, экзамен, средний балл и годовая</div>
                </div>
              </button>

              {/* KTP Plan */}
              <button
                type="button"
                onClick={() => handleSelectTemplate('ktp', `План КТП (${totalHours} ч)`, 8)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedType === 'ktp'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <BookOpen className={`w-5 h-5 shrink-0 mt-0.5 ${selectedType === 'ktp' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Поурочный план КТП</div>
                  <div className="text-xs text-slate-500">Все уроки курса по часам, даты, ДЗ и статус</div>
                </div>
              </button>

              {/* Tests and controls */}
              <button
                type="button"
                onClick={() => handleSelectTemplate('custom', 'Контрольные работы', 9)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedType === 'custom' && title.includes('Контрольные')
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckSquare className={`w-5 h-5 shrink-0 mt-0.5 ${selectedType === 'custom' && title.includes('Контрольные') ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Контрольные и срезы</div>
                  <div className="text-xs text-slate-500">Входной срез, контрольные, практические, итог</div>
                </div>
              </button>

              {/* Pure custom */}
              <button
                type="button"
                onClick={() => handleSelectTemplate('custom', 'Новая таблица', 12)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedType === 'custom' && !title.includes('Контрольные')
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Grid className={`w-5 h-5 shrink-0 mt-0.5 ${selectedType === 'custom' && !title.includes('Контрольные') ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Чистая таблица</div>
                  <div className="text-xs text-slate-500">Свободная сетка с нужным числом колонок</div>
                </div>
              </button>
            </div>
          </div>

          {/* Table Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Название таблицы
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Сводная за год, Контрольные работы..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
            />
          </div>

          {/* Dimension options for custom table */}
          {selectedType === 'custom' && (
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Кол-во столбцов
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="40"
                    value={cols}
                    onChange={(e) => setCols(Math.max(3, parseInt(e.target.value) || 3))}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Точно под ваши задачи</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Кол-во строк
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={rows}
                    onChange={(e) => setRows(Math.max(5, parseInt(e.target.value) || 5))}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Строки для записей</p>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeStudents}
                  onChange={(e) => setIncludeStudents(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Включить список учеников класса в таблицу (колонка 1 и 2)</span>
              </label>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Создать таблицу</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
