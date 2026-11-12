import React from 'react';
import { SchoolClass } from '../utils/schoolUtils';
import { GridData, getCellId, evaluateCell } from '../utils/tableUtils';
import { Plus, Users, GraduationCap, X } from 'lucide-react';

interface BottomClassBarProps {
  classes: SchoolClass[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  onOpenAddClass: () => void;
  onOpenStudentModal: () => void;
  onOpenManageClasses?: () => void;
  onDeleteClass: (cls: SchoolClass) => void;
  grid: GridData;
  selectedRow: number;
  selectedCol: number;
}

export const BottomClassBar: React.FC<BottomClassBarProps> = ({
  classes,
  activeClassId,
  onSelectClass,
  onOpenAddClass,
  onOpenStudentModal,
  onOpenManageClasses,
  onDeleteClass,
  grid,
  selectedRow,
  selectedCol,
}) => {
  const activeClass = classes.find((c) => c.id === activeClassId) || classes[0];
  const activeCellId = getCellId(selectedRow, selectedCol);
  const activeCell = grid[selectedRow]?.[selectedCol];
  const evalValue = evaluateCell(grid, selectedRow, selectedCol);

  // Compute stats across non-empty cells
  let filledCount = 0;
  let totalNumericSum = 0;
  let numericCount = 0;

  const numRows = grid.length;
  const numCols = grid[0]?.length || 0;

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const cell = grid[r]?.[c];
      if (cell && cell.raw.trim().length > 0) {
        filledCount++;
        const val = evaluateCell(grid, r, c);
        const num = parseFloat(val);
        if (!isNaN(num) && !val.startsWith('#')) {
          totalNumericSum += num;
          numericCount++;
        }
      }
    }
  }

  const avgNumeric = numericCount > 0 ? (totalNumericSum / numericCount).toFixed(2) : '0';

  return (
    <div className="bg-slate-200 border-t border-slate-300 px-2 py-1 flex flex-wrap items-center justify-between gap-2 shadow-inner select-none">
      {/* Left side: Excel-style Sheet Tabs for Classes */}
      <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 scrollbar-thin">
        <button
          type="button"
          onClick={onOpenManageClasses}
          className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-emerald-800 px-1.5 py-1 rounded hover:bg-slate-300/60 transition-colors cursor-pointer select-none"
          title="Открыть окно управления классами (просмотр и удаление)"
        >
          <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden sm:inline">Классы:</span>
        </button>

        {classes.map((cls) => {
          const isActive = cls.id === activeClassId;
          return (
            <div
              key={cls.id}
              className={`group flex items-center h-7 px-2.5 rounded-t-md text-xs font-medium transition-all cursor-pointer border-t-2 ${
                isActive
                  ? 'bg-white text-emerald-800 border-t-emerald-600 shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 border-t-transparent hover:bg-slate-50 hover:text-slate-900'
              }`}
              onClick={() => onSelectClass(cls.id)}
            >
              <span className="truncate max-w-[120px]">{cls.name}</span>
              <span
                className={`ml-1.5 text-[10px] px-1 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
                title={`Учеников: ${cls.students.length}`}
              >
                {cls.students.length}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClass(cls);
                }}
                className="ml-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 p-0.5 rounded cursor-pointer transition-colors"
                title={`Удалить класс «${cls.name}»`}
                aria-label={`Удалить класс ${cls.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Add Class button right next to tabs */}
        <button
          type="button"
          onClick={onOpenAddClass}
          className="flex items-center justify-center w-7 h-7 rounded-t-md bg-slate-100 hover:bg-white text-emerald-700 hover:text-emerald-800 border-t-2 border-t-transparent hover:border-t-emerald-500 shadow-2xs transition-all cursor-pointer"
          title="Добавить новый класс (лист)"
          aria-label="Добавить новый класс"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Student Roster Button for active class */}
        {activeClass && (
          <button
            type="button"
            onClick={onOpenStudentModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md shadow-2xs transition-colors cursor-pointer"
            title="Управление списком учеников выбранного класса"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Ученики ({activeClass.students.length})</span>
          </button>
        )}
      </div>

      {/* Right side: Status and calculation metrics */}
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-slate-700">Ячейка:</span>
          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold text-slate-900 text-[11px]">
            {activeCellId}
          </span>
          {activeCell?.raw && (
            <span className="hidden xl:inline text-slate-500 font-mono text-[11px] truncate max-w-[100px]">
              = {evalValue}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-500">Заполнено:</span>
          <span className="font-semibold text-slate-800">
            {filledCount} / {numRows * numCols}
          </span>
        </div>

        {numericCount > 0 && (
          <>
            <div className="h-3 w-px bg-slate-300" />
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Сумма:</span>
              <span className="font-semibold text-slate-800">
                {Number.isInteger(totalNumericSum)
                  ? totalNumericSum
                  : totalNumericSum.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Ср.:</span>
              <span className="font-semibold text-slate-800">{avgNumeric}</span>
            </div>
          </>
        )}

        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 border-l border-slate-300 pl-2">
          <span>←↑→↓: навигация</span>
          <span>•</span>
          <span>Enter: ввод</span>
        </div>
      </div>
    </div>
  );
};
