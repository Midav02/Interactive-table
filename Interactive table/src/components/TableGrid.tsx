import React, { useRef, useEffect, useMemo } from 'react';
import {
  GridData,
  getColumnLabel,
  evaluateCell,
  TOTAL_ROWS,
  TOTAL_COLS,
  NavigationDirection,
  shouldNavigateOnHorizontalArrow,
} from '../utils/tableUtils';
import { FIRST_LESSON_COL, formatLessonDate, formatFullRussianDate } from '../utils/schoolUtils';
import { BookOpen, Calendar } from 'lucide-react';

export type MoveDirection = NavigationDirection | 'none';

interface TableGridProps {
  grid: GridData;
  selectedRow: number;
  selectedCol: number;
  onSelectCell: (row: number, col: number) => void;
  isEditing: boolean;
  editValue: string;
  onStartEditing: (initialVal?: string) => void;
  onChangeEditValue: (val: string) => void;
  onCommitEdit: (moveDir?: MoveDirection) => void;
  onCancelEdit: () => void;
  onClearActiveCell: () => void;
  searchTerm: string;
  onOpenTopicPicker?: (colIndex: number) => void;
}

export const TableGrid: React.FC<TableGridProps> = ({
  grid,
  selectedRow,
  selectedCol,
  onSelectCell,
  isEditing,
  editValue,
  onStartEditing,
  onChangeEditValue,
  onCommitEdit,
  onCancelEdit,
  onClearActiveCell,
  searchTerm,
  onOpenTopicPicker,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCommittingRef = useRef<boolean>(false);

  const numRows = grid.length || TOTAL_ROWS;
  const numCols = grid[0]?.length || TOTAL_COLS;

  // Dynamically find Average Grade and Quarter Grade columns from header row 0
  const { avgColIdx, quarterColIdx } = useMemo(() => {
    let avg = -1;
    let quarter = -1;
    const headerRow = grid[0];
    if (headerRow) {
      for (let c = 0; c < headerRow.length; c++) {
        const raw = headerRow[c]?.raw || '';
        if (raw === 'Ср. балл' && avg === -1) {
          avg = c;
        } else if (raw === 'Оценка за четв.' && quarter === -1) {
          quarter = c;
        }
      }
    }
    return { avgColIdx: avg, quarterColIdx: quarter };
  }, [grid]);

  // Focus input when editing starts or moves to a new cell
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, selectedRow, selectedCol]);

  // Handle keyboard navigation when grid is focused but not in cell edit mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        isCommittingRef.current = true;
        onCommitEdit(e.shiftKey ? 'up' : 'down');
        setTimeout(() => {
          isCommittingRef.current = false;
        }, 60);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        isCommittingRef.current = true;
        onCommitEdit(e.shiftKey ? 'left' : 'right');
        setTimeout(() => {
          isCommittingRef.current = false;
        }, 60);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancelEdit();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        isCommittingRef.current = true;
        onCommitEdit('up');
        setTimeout(() => {
          isCommittingRef.current = false;
        }, 60);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        isCommittingRef.current = true;
        onCommitEdit('down');
        setTimeout(() => {
          isCommittingRef.current = false;
        }, 60);
      } else if (e.key === 'ArrowLeft') {
        const canNavigate = shouldNavigateOnHorizontalArrow(
          'left',
          editValue,
          inputRef.current?.selectionStart ?? null,
          inputRef.current?.selectionEnd ?? null
        );
        if (canNavigate) {
          e.preventDefault();
          isCommittingRef.current = true;
          onCommitEdit('left');
          setTimeout(() => {
            isCommittingRef.current = false;
          }, 60);
        }
      } else if (e.key === 'ArrowRight') {
        const canNavigate = shouldNavigateOnHorizontalArrow(
          'right',
          editValue,
          inputRef.current?.selectionStart ?? null,
          inputRef.current?.selectionEnd ?? null
        );
        if (canNavigate) {
          e.preventDefault();
          isCommittingRef.current = true;
          onCommitEdit('right');
          setTimeout(() => {
            isCommittingRef.current = false;
          }, 60);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (selectedRow > 0) onSelectCell(selectedRow - 1, selectedCol);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (selectedRow < numRows - 1) onSelectCell(selectedRow + 1, selectedCol);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (selectedCol > 0) onSelectCell(selectedRow, selectedCol - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (selectedCol < numCols - 1) onSelectCell(selectedRow, selectedCol + 1);
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (selectedCol > 0) onSelectCell(selectedRow, selectedCol - 1);
        } else {
          if (selectedCol < numCols - 1) onSelectCell(selectedRow, selectedCol + 1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        onStartEditing();
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onClearActiveCell();
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          onStartEditing(e.key);
        }
        break;
    }
  };

  const cleanSearch = searchTerm.trim().toLowerCase();

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex-1 overflow-auto outline-none select-none bg-slate-100 relative"
      aria-label="Сетка таблицы по часам учителя"
      role="grid"
    >
      <table className="border-collapse table-fixed text-xs w-max min-w-full bg-white">
        <thead>
          <tr className="sticky top-0 z-20 bg-slate-100 border-b border-slate-300">
            {/* Corner Cell */}
            <th
              className="sticky left-0 z-30 w-10 min-w-10 bg-slate-200 border-r border-b border-slate-300 text-center font-semibold text-slate-500 py-1.5 cursor-pointer hover:bg-slate-300 transition-colors"
              onClick={() => onSelectCell(0, 0)}
              title="Выбрать ячейку A1"
            >
              ◰
            </th>

            {/* Column Headers A - ... */}
            {Array.from({ length: numCols }, (_, colIdx) => {
              const isColActive = selectedCol === colIdx;
              const isLessonCol =
                avgColIdx !== -1
                  ? colIdx >= FIRST_LESSON_COL && colIdx < avgColIdx
                  : colIdx >= FIRST_LESSON_COL && colIdx <= 17;
              const isAvgCol = colIdx === avgColIdx;
              const isQuarterCol = colIdx === quarterColIdx;
              const label = getColumnLabel(colIdx);

              const isStickyNameCol = colIdx === 1;

              return (
                <th
                  key={`col-header-${colIdx}`}
                  onClick={() => onSelectCell(selectedRow, colIdx)}
                  onDoubleClick={() => {
                    if (isLessonCol && onOpenTopicPicker) {
                      onOpenTopicPicker(colIdx);
                    }
                  }}
                  className={`py-1.5 px-1 border-r border-slate-300 font-semibold select-none cursor-pointer transition-colors relative group ${
                    isStickyNameCol
                      ? 'sticky left-10 z-25 w-44 min-w-44 border-r-2 border-slate-300'
                      : colIdx === 0
                      ? 'w-10 min-w-10'
                      : isAvgCol || isQuarterCol
                      ? 'w-24 min-w-24'
                      : 'w-28 min-w-28'
                  } ${
                    isColActive
                      ? 'bg-emerald-100 text-emerald-900 border-b-2 border-b-emerald-600'
                      : isQuarterCol
                      ? 'bg-amber-100/80 text-amber-900 hover:bg-amber-100'
                      : isAvgCol
                      ? 'bg-sky-100/80 text-sky-900 hover:bg-sky-100'
                      : isLessonCol
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={
                    isLessonCol
                      ? `Столбец ${label}: Урок — Нажмите дважды для выбора даты и темы урока`
                      : isQuarterCol
                      ? `Столбец ${label}: Оценка за четверть`
                      : isAvgCol
                      ? `Столбец ${label}: Средний балл`
                      : `Столбец ${label}`
                  }
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-mono text-xs">{label}</span>
                    {isLessonCol && onOpenTopicPicker && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTopicPicker(colIdx);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-emerald-700 bg-white/80 hover:bg-emerald-100 p-0.5 rounded transition-opacity cursor-pointer shadow-2xs"
                        title="Выбрать дату и тему урока"
                        aria-label={`Выбрать дату и тему для столбца ${label}`}
                      >
                        <Calendar className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: numRows }, (_, rowIdx) => {
            const isRowActive = selectedRow === rowIdx;
            const isHeaderRow = rowIdx === 0;
            const isSummaryRow = rowIdx === numRows - 1;

            return (
              <tr
                key={`row-${rowIdx}`}
                className={`${
                  isHeaderRow
                    ? 'h-11 bg-slate-50 font-semibold'
                    : isSummaryRow
                    ? 'h-8 bg-slate-100/90 font-bold border-t-2 border-slate-300'
                    : 'h-8 hover:bg-slate-50/50'
                } border-b border-slate-200`}
              >
                {/* Row Header 1 - N */}
                <th
                  onClick={() => onSelectCell(rowIdx, selectedCol)}
                  className={`sticky left-0 z-15 w-10 min-w-10 border-r border-slate-300 text-center font-semibold select-none cursor-pointer transition-colors ${
                    isRowActive
                      ? 'bg-emerald-100 text-emerald-900 border-r-2 border-r-emerald-600'
                      : isHeaderRow
                      ? 'bg-slate-200 text-slate-700'
                      : isSummaryRow
                      ? 'bg-slate-200 text-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {rowIdx + 1}
                </th>

                {/* Cells in this row */}
                {Array.from({ length: numCols }, (_, colIdx) => {
                  const cell = grid[rowIdx]?.[colIdx];
                  const isSelected = selectedRow === rowIdx && selectedCol === colIdx;
                  const displayValue = evaluateCell(grid, rowIdx, colIdx);
                  const isError = displayValue.startsWith('#');
                  const isLessonCol =
                    avgColIdx !== -1
                      ? colIdx >= FIRST_LESSON_COL && colIdx < avgColIdx
                      : colIdx >= FIRST_LESSON_COL && colIdx <= 17;
                  const isQuarterGradeCell = colIdx === quarterColIdx && !isHeaderRow;
                  const isAvgGradeCell = colIdx === avgColIdx && !isHeaderRow;
                  const isStickyNameCol = colIdx === 1;

                  // Search match check
                  const matchesSearch =
                    cleanSearch.length > 0 &&
                    (displayValue.toLowerCase().includes(cleanSearch) ||
                      (cell?.raw && cell.raw.toLowerCase().includes(cleanSearch)));

                  const style = cell?.style || {};
                  const textAlign = style.align || (isLessonCol || isQuarterGradeCell || isAvgGradeCell ? 'center' : 'left');

                  // Badge color for quarter mark
                  const isMark5 = displayValue === '5';
                  const isMark4 = displayValue === '4';
                  const isMark3 = displayValue === '3';
                  const isMark2 = displayValue === '2';

                  return (
                    <td
                      key={`cell-${rowIdx}-${colIdx}`}
                      onClick={() => onSelectCell(rowIdx, colIdx)}
                      onDoubleClick={() => {
                        if (isHeaderRow && isLessonCol && onOpenTopicPicker) {
                          onOpenTopicPicker(colIdx);
                        } else {
                          onStartEditing();
                        }
                      }}
                      className={`relative px-2 py-1 border-r border-slate-200 truncate font-sans text-xs transition-colors cursor-cell group/cell ${
                        isStickyNameCol
                          ? 'sticky left-10 z-10 w-44 min-w-44 bg-white border-r-2 border-slate-300 shadow-2xs'
                          : colIdx === 0
                          ? 'w-10 min-w-10'
                          : isAvgGradeCell || isQuarterGradeCell
                          ? 'w-24 min-w-24'
                          : isLessonCol
                          ? 'w-32 min-w-32'
                          : 'w-28 min-w-28'
                      } ${
                        isSelected
                          ? 'outline-2 outline-emerald-600 outline-offset-[-2px] z-20 bg-emerald-50/60'
                          : matchesSearch
                          ? 'bg-amber-100 font-semibold text-amber-900'
                          : ''
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? undefined
                          : matchesSearch
                          ? '#fef3c7'
                          : style.bgColor || undefined,
                        color: isError
                          ? '#dc2626'
                          : style.textColor || undefined,
                        fontWeight: style.bold || isHeaderRow || isSummaryRow ? 'bold' : 'normal',
                        fontStyle: style.italic ? 'italic' : 'normal',
                        textAlign: textAlign,
                      }}
                      title={`${getColumnLabel(colIdx)}${rowIdx + 1}${
                        cell?.raw ? `: ${cell.raw}` : ''
                      }`}
                    >
                      {isSelected && isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => onChangeEditValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              isCommittingRef.current = true;
                              onCommitEdit(e.shiftKey ? 'up' : 'down');
                              setTimeout(() => {
                                isCommittingRef.current = false;
                              }, 60);
                            } else if (e.key === 'Tab') {
                              e.preventDefault();
                              isCommittingRef.current = true;
                              onCommitEdit(e.shiftKey ? 'left' : 'right');
                              setTimeout(() => {
                                isCommittingRef.current = false;
                              }, 60);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              onCancelEdit();
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              isCommittingRef.current = true;
                              onCommitEdit('up');
                              setTimeout(() => {
                                isCommittingRef.current = false;
                              }, 60);
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              isCommittingRef.current = true;
                              onCommitEdit('down');
                              setTimeout(() => {
                                isCommittingRef.current = false;
                              }, 60);
                            } else if (e.key === 'ArrowLeft') {
                              const input = inputRef.current;
                              const canMove = input
                                ? shouldNavigateOnHorizontalArrow(
                                    'left',
                                    input.value,
                                    input.selectionStart,
                                    input.selectionEnd
                                  )
                                : true;
                              if (canMove || e.altKey) {
                                e.preventDefault();
                                isCommittingRef.current = true;
                                onCommitEdit('left');
                                setTimeout(() => {
                                  isCommittingRef.current = false;
                                }, 60);
                              }
                            } else if (e.key === 'ArrowRight') {
                              const input = inputRef.current;
                              const canMove = input
                                ? shouldNavigateOnHorizontalArrow(
                                    'right',
                                    input.value,
                                    input.selectionStart,
                                    input.selectionEnd
                                  )
                                : true;
                              if (canMove || e.altKey) {
                                e.preventDefault();
                                isCommittingRef.current = true;
                                onCommitEdit('right');
                                setTimeout(() => {
                                  isCommittingRef.current = false;
                                }, 60);
                              }
                            }
                          }}
                          onBlur={() => {
                            if (!isCommittingRef.current) {
                              onCommitEdit('none');
                            }
                          }}
                          className="absolute inset-0 w-full h-full px-2 py-1 text-xs bg-white text-slate-900 font-sans border-2 border-emerald-600 focus:outline-none z-30"
                        />
                      ) : isHeaderRow && isLessonCol ? (
                        // Header row for lesson columns: show date badge, lesson number, topic, and quick picker button
                        <div className="flex flex-col justify-center min-w-0 w-full py-0.5 leading-tight">
                          <div className="flex items-center justify-between gap-1 w-full">
                            <div className="flex items-center gap-1 min-w-0">
                              {cell?.date ? (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 shadow-2xs"
                                  title={`Дата проведения: ${formatFullRussianDate(cell.date)}`}
                                >
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>{formatLessonDate(cell.date)}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-0.5">
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>+ дата</span>
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-slate-400 truncate">
                                №{colIdx - 1}
                              </span>
                            </div>

                            {onOpenTopicPicker && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenTopicPicker(colIdx);
                                }}
                                className="text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 p-0.5 rounded cursor-pointer shrink-0 transition-colors"
                                title="Выбрать дату и тему урока"
                                aria-label={`Выбрать дату и тему для урока ${colIdx - 1}`}
                              >
                                <Calendar className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <span
                            className="truncate block text-[11px] font-medium text-slate-700 mt-0.5 text-left"
                            title={`${cell?.date ? `[${formatLessonDate(cell.date)}] ` : ''}${displayValue || `Урок ${colIdx - 1}`}`}
                          >
                            {displayValue || `Урок ${colIdx - 1}`}
                          </span>
                        </div>
                      ) : isQuarterGradeCell ? (
                        // Quarter Grade badge cell
                        <div className="flex items-center justify-center">
                          {isMark5 ? (
                            <span className="inline-flex items-center justify-center w-6 h-5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 shadow-2xs">
                              5
                            </span>
                          ) : isMark4 ? (
                            <span className="inline-flex items-center justify-center w-6 h-5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-300 shadow-2xs">
                              4
                            </span>
                          ) : isMark3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300 shadow-2xs">
                              3
                            </span>
                          ) : isMark2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-5 rounded bg-red-100 text-red-800 font-bold border border-red-300 shadow-2xs">
                              2
                            </span>
                          ) : displayValue ? (
                            <span className="font-bold text-slate-800">{displayValue}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </div>
                      ) : isAvgGradeCell ? (
                        // Average Grade cell
                        <span className="block text-center font-bold text-sky-800 font-mono">
                          {displayValue || '—'}
                        </span>
                      ) : (
                        <span className="block truncate">
                          {displayValue || ''}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
