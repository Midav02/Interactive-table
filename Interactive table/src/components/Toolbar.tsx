import React, { useState } from 'react';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Search,
  Sigma,
  X,
  Type,
  Calendar,
} from 'lucide-react';
import { CellStyle, getCellId } from '../utils/tableUtils';
import { formatLessonDate } from '../utils/schoolUtils';

interface ToolbarProps {
  selectedRow: number;
  selectedCol: number;
  activeRawValue: string;
  onRawValueChange: (val: string) => void;
  onCommitFormula: () => void;
  currentStyle?: CellStyle;
  onUpdateStyle: (styleUpdate: Partial<CellStyle>) => void;
  onInsertFormula: (formulaTemplate: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  lessonInfo?: { lessonNumber: number; date?: string; topic?: string; colIndex: number } | null;
  onOpenTopicPicker?: (colIndex: number) => void;
}

const BG_COLORS = [
  { name: 'Стандартный', value: '' },
  { name: 'Серый', value: '#f1f5f9' },
  { name: 'Зеленый', value: '#ecfdf5' },
  { name: 'Синий', value: '#e0f2fe' },
  { name: 'Желтый', value: '#fef9c3' },
  { name: 'Красный', value: '#fee2e2' },
  { name: 'Фиолетовый', value: '#f3e8ff' },
];

const TEXT_COLORS = [
  { name: 'Темный', value: '' },
  { name: 'Синий', value: '#1e40af' },
  { name: 'Зеленый', value: '#065f46' },
  { name: 'Красный', value: '#991b1b' },
  { name: 'Серый', value: '#64748b' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedRow,
  selectedCol,
  activeRawValue,
  onRawValueChange,
  onCommitFormula,
  currentStyle = {},
  onUpdateStyle,
  onInsertFormula,
  searchTerm,
  onSearchChange,
  lessonInfo,
  onOpenTopicPicker,
}) => {
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showFormulaMenu, setShowFormulaMenu] = useState(false);

  const activeCellId = getCellId(selectedRow, selectedCol);

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-col gap-2">
      {/* Top row: Formatting & Search */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Active Cell Coord Badge */}
          <div className="px-2.5 py-1 bg-white border border-slate-300 rounded font-mono text-xs font-semibold text-slate-800 shadow-2xs min-w-[50px] text-center">
            {activeCellId}
          </div>

          {/* Quick Lesson & Date Button in Toolbar if a lesson column is selected */}
          {lessonInfo && onOpenTopicPicker && (
            <button
              type="button"
              onClick={() => onOpenTopicPicker(lessonInfo.colIndex)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-300 rounded text-xs font-medium shadow-2xs transition-colors cursor-pointer"
              title="Выбрать дату и тему этого урока"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Урок №{lessonInfo.lessonNumber}</span>
              {lessonInfo.date ? (
                <span className="font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded text-[11px] border border-emerald-200">
                  {formatLessonDate(lessonInfo.date)}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-normal">
                  + дата
                </span>
              )}
            </button>
          )}

          <div className="h-5 w-px bg-slate-300 mx-1" />

          {/* Bold Toggle */}
          <button
            type="button"
            onClick={() => onUpdateStyle({ bold: !currentStyle.bold })}
            className={`p-1.5 rounded transition-colors cursor-pointer border ${
              currentStyle.bold
                ? 'bg-slate-200 border-slate-400 text-slate-900 font-bold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Жирный шрифт"
            aria-label="Жирный шрифт"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic Toggle */}
          <button
            type="button"
            onClick={() => onUpdateStyle({ italic: !currentStyle.italic })}
            className={`p-1.5 rounded transition-colors cursor-pointer border ${
              currentStyle.italic
                ? 'bg-slate-200 border-slate-400 text-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Курсив"
            aria-label="Курсив"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <div className="h-5 w-px bg-slate-300 mx-1" />

          {/* Alignment */}
          <div className="inline-flex rounded-md bg-white border border-slate-200 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onUpdateStyle({ align: 'left' })}
              className={`p-1 rounded cursor-pointer ${
                currentStyle.align === 'left' || !currentStyle.align
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="По левому краю"
              aria-label="По левому краю"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateStyle({ align: 'center' })}
              className={`p-1 rounded cursor-pointer ${
                currentStyle.align === 'center'
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="По центру"
              aria-label="По центру"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateStyle({ align: 'right' })}
              className={`p-1 rounded cursor-pointer ${
                currentStyle.align === 'right'
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="По правому краю"
              aria-label="По правому краю"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-300 mx-1" />

          {/* Background Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowBgMenu(!showBgMenu);
                setShowColorMenu(false);
                setShowFormulaMenu(false);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-100 shadow-2xs cursor-pointer"
              title="Цвет заливки ячейки"
            >
              <Palette className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Заливка</span>
              <span
                className="w-3 h-3 rounded-full border border-slate-400"
                style={{ backgroundColor: currentStyle.bgColor || '#ffffff' }}
              />
            </button>
            {showBgMenu && (
              <div className="absolute z-20 left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex gap-1.5">
                {BG_COLORS.map((bg) => (
                  <button
                    key={bg.name}
                    type="button"
                    onClick={() => {
                      onUpdateStyle({ bgColor: bg.value });
                      setShowBgMenu(false);
                    }}
                    className="w-6 h-6 rounded-md border border-slate-300 hover:scale-110 transition-transform cursor-pointer relative"
                    style={{ backgroundColor: bg.value || '#ffffff' }}
                    title={bg.name}
                  >
                    {!bg.value && <span className="text-[10px] text-slate-400 leading-none">✕</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorMenu(!showColorMenu);
                setShowBgMenu(false);
                setShowFormulaMenu(false);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-100 shadow-2xs cursor-pointer"
              title="Цвет текста"
            >
              <Type className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Текст</span>
              <span
                className="w-3 h-3 rounded-full border border-slate-400"
                style={{ backgroundColor: currentStyle.textColor || '#0f172a' }}
              />
            </button>
            {showColorMenu && (
              <div className="absolute z-20 left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex gap-1.5">
                {TEXT_COLORS.map((tc) => (
                  <button
                    key={tc.name}
                    type="button"
                    onClick={() => {
                      onUpdateStyle({ textColor: tc.value });
                      setShowColorMenu(false);
                    }}
                    className="w-6 h-6 rounded-md border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: tc.value || '#0f172a' }}
                    title={tc.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Formula Helper Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowFormulaMenu(!showFormulaMenu);
                setShowBgMenu(false);
                setShowColorMenu(false);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-xs font-medium hover:bg-emerald-100 shadow-2xs cursor-pointer"
              title="Вставить формулу"
            >
              <Sigma className="w-3.5 h-3.5 text-emerald-700" />
              <span>Формулы</span>
            </button>
            {showFormulaMenu && (
              <div className="absolute z-20 left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-44">
                {[
                  { label: 'СУММ (SUM)', code: '=SUM(A1:A5)', desc: 'Сумма чисел' },
                  { label: 'СРЗНАЧ (AVERAGE)', code: '=AVERAGE(A1:A5)', desc: 'Среднее значение' },
                  { label: 'СЧЁТ (COUNT)', code: '=COUNT(A1:A5)', desc: 'Количество ячеек' },
                  { label: 'МИНИМУМ (MIN)', code: '=MIN(A1:A5)', desc: 'Минимальное число' },
                  { label: 'МАКСИМУМ (MAX)', code: '=MAX(A1:A5)', desc: 'Максимальное число' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      onInsertFormula(item.code);
                      setShowFormulaMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 flex flex-col cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{item.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по ячейкам..."
            className="pl-7 pr-6 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-40 sm:w-48"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-1.5 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Очистить поиск"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Formula Bar (fx) */}
      <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-2.5 py-1 shadow-2xs">
        <span className="font-serif italic font-bold text-xs text-emerald-700 select-none">
          fx
        </span>
        <div className="h-4 w-px bg-slate-200" />
        <input
          type="text"
          value={activeRawValue}
          onChange={(e) => onRawValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onCommitFormula();
            }
          }}
          placeholder="Введите значение или формулу, например: 100 или =SUM(A1:A5)"
          className="flex-1 text-xs text-slate-800 font-mono focus:outline-none placeholder-slate-400"
          aria-label="Строка формул"
        />
      </div>
    </div>
  );
};
