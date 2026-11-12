import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { TableGrid } from './components/TableGrid';
import { BottomClassBar } from './components/BottomClassBar';
import { AddClassModal } from './components/AddClassModal';
import { AddTableModal } from './components/AddTableModal';
import { StudentModal } from './components/StudentModal';
import { KtpModal } from './components/KtpModal';
import { TopicPickerModal } from './components/TopicPickerModal';
import { DeleteClassModal } from './components/DeleteClassModal';
import { ManageClassesModal } from './components/ManageClassesModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  GridData,
  CellStyle,
  createEmptyGrid,
  exportGridToCSV,
  parseCSV,
  calculateNextCell,
  TOTAL_ROWS,
  TOTAL_COLS,
} from './utils/tableUtils';
import {
  SchoolClass,
  Quarter,
  KtpLesson,
  TableViewType,
  ExtraTable,
  createDefaultClasses,
  createClassGradebookGrid,
  createYearlySummaryGrid,
  syncQuarterMarksToYearly,
  createKtpPlanningGrid,
  createCustomTableGrid,
  syncStudentsToGrid,
  applyKtpToGrid,
  assignTopicToColumn,
  assignDateToColumn,
  normalizeDateToIso,
  addDaysToIsoDate,
  clearGradesInGrid,
  calculateQuarterHours,
  getQuarterStartLesson,
  getQuarterColumnsInfo,
  INFORMATICS_8_FULL_KTP,
  FIRST_LESSON_COL,
  STORAGE_KEY,
  deleteClassFromList,
  syncStudentsAcrossAllQuarters,
} from './utils/schoolUtils';

export default function App() {
  // Initialize classes from localStorage or default classes
  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return createDefaultClasses();
  });

  const [activeClassId, setActiveClassId] = useState<string>(() => {
    return classes[0]?.id || 'class-1';
  });

  // Active table view: 'q-1' | 'q-2' | 'q-3' | 'q-4' | 'yearly' | 'ktp' | extra table ID
  const [activeTableId, setActiveTableId] = useState<string>('q-1');

  // Modals state
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isKtpModalOpen, setIsKtpModalOpen] = useState(false);
  const [topicPickerCol, setTopicPickerCol] = useState<number | null>(null);
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);
  const [isManageClassesOpen, setIsManageClassesOpen] = useState(false);

  // Active class and current quarter
  const activeClass = classes.find((c) => c.id === activeClassId) || classes[0];
  const currentQuarter: Quarter = activeClass?.currentQuarter || 1;
  const currentQuarterData = activeClass?.quarters?.[currentQuarter];
  const currentQuarterHours =
    activeClass?.quarterHours?.[currentQuarter] ||
    currentQuarterData?.lessonHours ||
    8;

  // Resolve current active grid based on activeTableId
  let grid: GridData;
  if (activeTableId === 'yearly') {
    grid =
      activeClass?.yearlyGrid ||
      createYearlySummaryGrid(
        activeClass?.name || 'Класс',
        activeClass?.students.map((s) => s.name) || [],
        activeClass?.quarters
      );
  } else if (activeTableId === 'ktp') {
    grid =
      activeClass?.ktpGrid ||
      createKtpPlanningGrid(activeClass?.totalHours || 34, activeClass?.fullKtp || []);
  } else if (activeClass?.extraTables?.some((t) => t.id === activeTableId)) {
    const extra = activeClass.extraTables.find((t) => t.id === activeTableId);
    grid = extra?.grid || createEmptyGrid();
  } else {
    // Quarter grid: q-1, q-2, q-3, q-4
    const qNum = (parseInt(activeTableId.replace('q-', '')) || currentQuarter) as Quarter;
    const qData = activeClass?.quarters?.[qNum];
    const baseGrid = qData?.grid || createEmptyGrid();
    if (activeClass?.students && activeClass.students.length > 0) {
      const needsSync = activeClass.students.some(
        (s, i) => (baseGrid[i + 1]?.[1]?.raw || '') !== s.name
      );
      if (needsSync) {
        const qH = activeClass?.quarterHours?.[qNum] || qData?.lessonHours || 8;
        grid = syncStudentsToGrid(baseGrid, activeClass.students, qH);
      } else {
        grid = baseGrid;
      }
    } else {
      grid = baseGrid;
    }
  }

  // Grid selection & editing state
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [selectedCol, setSelectedCol] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Persist classes to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
    } catch {
      // Ignore quota errors
    }
  }, [classes]);

  // Helper to update active class's currently viewed grid
  const updateActiveGrid = useCallback(
    (updater: (prevGrid: GridData) => GridData) => {
      setClasses((prevClasses) =>
        prevClasses.map((cls) => {
          if (cls.id === activeClassId) {
            // 1. Yearly Summary
            if (activeTableId === 'yearly') {
              const prev =
                cls.yearlyGrid ||
                createYearlySummaryGrid(
                  cls.name,
                  cls.students.map((s) => s.name),
                  cls.quarters
                );
              const updatedYearly = updater(prev);
              const names: string[] = [];
              const maxR = updatedYearly.length - 1;
              for (let r = 1; r < maxR; r++) {
                const n = (updatedYearly[r]?.[1]?.raw || '').trim();
                if (n && n !== '∑' && !n.startsWith('=')) {
                  names.push(n);
                }
              }
              const updatedStudents = names.map((name, i) => ({
                id: cls.students[i]?.id || `s-${i + 1}`,
                name,
              }));
              const syncedCls = syncStudentsAcrossAllQuarters(cls, updatedStudents);
              return {
                ...syncedCls,
                yearlyGrid: updatedYearly,
              };
            }

            // 2. KTP Planning Table
            if (activeTableId === 'ktp') {
              const prev =
                cls.ktpGrid ||
                createKtpPlanningGrid(cls.totalHours || 34, cls.fullKtp || []);
              return {
                ...cls,
                ktpGrid: updater(prev),
              };
            }

            // 3. User Added Extra Table
            if (cls.extraTables?.some((t) => t.id === activeTableId)) {
              return {
                ...cls,
                extraTables: cls.extraTables.map((t) =>
                  t.id === activeTableId ? { ...t, grid: updater(t.grid) } : t
                ),
              };
            }

            // 4. Quarterly Gradebook
            const q = (parseInt(activeTableId.replace('q-', '')) ||
              cls.currentQuarter ||
              1) as Quarter;
            const prevQData = cls.quarters[q] || {
              grid: createEmptyGrid(),
              ktp: [],
              lessonHours: 8,
              startLessonNumber: 1,
            };
            const updatedQuarterGrid = updater(prevQData.grid);

            // Extract student names from column 1 (B)
            const names: string[] = [];
            const maxR = updatedQuarterGrid.length - 1;
            for (let r = 1; r < maxR; r++) {
              const n = (updatedQuarterGrid[r]?.[1]?.raw || '').trim();
              if (n && n !== '∑' && !n.startsWith('=')) {
                names.push(n);
              }
            }

            const updatedStudents = names.map((name, i) => ({
              id: cls.students[i]?.id || `s-${i + 1}`,
              name,
            }));

            // Atomically synchronize all quarters and yearly summary
            const syncedCls = syncStudentsAcrossAllQuarters(cls, updatedStudents);

            return {
              ...syncedCls,
              quarters: {
                ...syncedCls.quarters,
                [q]: {
                  ...prevQData,
                  grid: updatedQuarterGrid,
                },
              },
            };
          }
          return cls;
        })
      );
    },
    [activeClassId, activeTableId]
  );

  // Active cell raw value (formula or text)
  const activeCell = grid[selectedRow]?.[selectedCol];
  const activeRawValue = isEditing ? editValue : activeCell?.raw || '';

  // Handle cell selection & instant 1-click editing
  const handleSelectCell = useCallback(
    (row: number, col: number) => {
      if (row === selectedRow && col === selectedCol && isEditing) {
        return;
      }

      // If we were already editing another cell, commit its value first
      if (isEditing) {
        updateActiveGrid((currentGrid) => {
          const next = currentGrid.map((r) => [...r]);
          if (next[selectedRow] && next[selectedRow][selectedCol]) {
            next[selectedRow][selectedCol] = {
              ...next[selectedRow][selectedCol],
              raw: editValue,
            };
          }
          return next;
        });
      }

      // Activate 1-click editing immediately on the selected cell
      setSelectedRow(row);
      setSelectedCol(col);
      const nextCellVal = grid[row]?.[col]?.raw || '';
      setEditValue(nextCellVal);
      setIsEditing(true);
    },
    [isEditing, editValue, selectedRow, selectedCol, grid, updateActiveGrid]
  );

  // Start in-cell editing
  const handleStartEditing = useCallback(
    (initialChar?: string) => {
      const curRaw = grid[selectedRow]?.[selectedCol]?.raw || '';
      setIsEditing(true);
      setEditValue(initialChar !== undefined ? initialChar : curRaw);
    },
    [grid, selectedRow, selectedCol]
  );

  // Commit editing (Enter advances down, Shift+Enter up, Tab right, Shift+Tab left, arrow keys)
  const handleCommitEdit = useCallback(
    (moveDir?: 'down' | 'right' | 'up' | 'left' | 'none') => {
      updateActiveGrid((currentGrid) => {
        const next = currentGrid.map((r) => [...r]);
        if (next[selectedRow] && next[selectedRow][selectedCol]) {
          next[selectedRow][selectedCol] = {
            ...next[selectedRow][selectedCol],
            raw: editValue,
          };
        }
        return next;
      });

      const numRows = grid.length || TOTAL_ROWS;
      const numCols = grid[0]?.length || TOTAL_COLS;

      if (moveDir && moveDir !== 'none') {
        const { row: nextRow, col: nextCol } = calculateNextCell(
          selectedRow,
          selectedCol,
          moveDir,
          numRows,
          numCols
        );
        setSelectedRow(nextRow);
        setSelectedCol(nextCol);
        const nextVal = grid[nextRow]?.[nextCol]?.raw || '';
        setEditValue(nextVal);
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    },
    [editValue, selectedRow, selectedCol, grid, updateActiveGrid]
  );

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  // Toolbar Formula bar commit
  const handleCommitFormula = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Toolbar input change
  const handleRawValueChange = useCallback(
    (val: string) => {
      if (isEditing) {
        setEditValue(val);
      } else {
        updateActiveGrid((currentGrid) => {
          const next = currentGrid.map((r) => [...r]);
          if (next[selectedRow] && next[selectedRow][selectedCol]) {
            next[selectedRow][selectedCol] = {
              ...next[selectedRow][selectedCol],
              raw: val,
            };
          }
          return next;
        });
      }
    },
    [isEditing, selectedRow, selectedCol, updateActiveGrid]
  );

  // Cell style update (Bold, Italic, Align, Colors)
  const handleUpdateStyle = useCallback(
    (styleUpdate: Partial<CellStyle>) => {
      updateActiveGrid((currentGrid) => {
        const next = currentGrid.map((r) => [...r]);
        const curCell = next[selectedRow]?.[selectedCol];
        if (curCell) {
          next[selectedRow][selectedCol] = {
            ...curCell,
            style: {
              ...curCell.style,
              ...styleUpdate,
            },
          };
        }
        return next;
      });
    },
    [selectedRow, selectedCol, updateActiveGrid]
  );

  // Quick formula insertion
  const handleInsertFormula = useCallback(
    (formulaTemplate: string) => {
      updateActiveGrid((currentGrid) => {
        const next = currentGrid.map((r) => [...r]);
        if (next[selectedRow] && next[selectedRow][selectedCol]) {
          next[selectedRow][selectedCol] = {
            ...next[selectedRow][selectedCol],
            raw: formulaTemplate,
          };
        }
        return next;
      });
      setIsEditing(false);
    },
    [selectedRow, selectedCol, updateActiveGrid]
  );

  // Clear single cell
  const handleClearActiveCell = useCallback(() => {
    updateActiveGrid((currentGrid) => {
      const next = currentGrid.map((r) => [...r]);
      if (next[selectedRow] && next[selectedRow][selectedCol]) {
        next[selectedRow][selectedCol] = {
          ...next[selectedRow][selectedCol],
          raw: '',
        };
      }
      return next;
    });
    setIsEditing(false);
  }, [selectedRow, selectedCol, updateActiveGrid]);

  // Switch Quarter
  const handleChangeQuarter = useCallback(
    (quarter: Quarter) => {
      if (isEditing) setIsEditing(false);
      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id === activeClassId) {
            const synced = syncStudentsAcrossAllQuarters(cls, cls.students);
            return {
              ...synced,
              currentQuarter: quarter,
              activeTableId: `q-${quarter}`,
            };
          }
          return cls;
        })
      );
      setActiveTableId(`q-${quarter}`);
      setSelectedRow(0);
      setSelectedCol(0);
    },
    [isEditing, activeClassId]
  );

  // Switch Active Table view
  const handleSelectTable = useCallback(
    (tableId: string) => {
      if (isEditing) setIsEditing(false);
      setActiveTableId(tableId);
      if (tableId.startsWith('q-')) {
        const qNum = parseInt(tableId.replace('q-', '')) as Quarter;
        if (qNum >= 1 && qNum <= 4) {
          setClasses((prev) =>
            prev.map((cls) => {
              if (cls.id === activeClassId) {
                const synced = syncStudentsAcrossAllQuarters(cls, cls.students);
                return { ...synced, currentQuarter: qNum, activeTableId: tableId };
              }
              return cls;
            })
          );
        }
      } else {
        setClasses((prev) =>
          prev.map((cls) =>
            cls.id === activeClassId ? { ...cls, activeTableId: tableId } : cls
          )
        );
      }
      setSelectedRow(0);
      setSelectedCol(0);
    },
    [isEditing, activeClassId]
  );

  // Apply or save KTP
  const handleApplyKtp = useCallback(
    (lessons: KtpLesson[], applyToQuarter: boolean) => {
      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id === activeClassId) {
            const q = cls.currentQuarter || 1;
            const currentQ = cls.quarters[q];
            const qHours = cls.quarterHours?.[q] || currentQ?.lessonHours || 8;
            const startLesson =
              currentQ?.startLessonNumber ||
              getQuarterStartLesson(q as Quarter, cls.totalHours || 34);
            const updatedGrid = applyToQuarter
              ? applyKtpToGrid(currentQ.grid, lessons, qHours, startLesson)
              : currentQ.grid;
            return {
              ...cls,
              fullKtp: lessons,
              ktpGrid: createKtpPlanningGrid(cls.totalHours || 34, lessons),
              quarters: {
                ...cls.quarters,
                [q]: {
                  ...currentQ,
                  grid: updatedGrid,
                  ktp: applyToQuarter ? lessons.slice(0, qHours) : currentQ.ktp,
                },
              },
            };
          }
          return cls;
        })
      );
    },
    [activeClassId]
  );

  // Open topic picker modal for a specific lesson column
  const handleOpenTopicPicker = useCallback((colIndex: number) => {
    setTopicPickerCol(colIndex);
  }, []);

  // Assign specific topic and optional date to a single column
  const handleAssignTopic = useCallback(
    (colIndex: number, topic: KtpLesson | null, date?: string) => {
      updateActiveGrid((currentGrid) =>
        assignTopicToColumn(currentGrid, colIndex, topic, undefined, date)
      );
    },
    [updateActiveGrid]
  );

  // Assign or clear date for a specific column
  const handleAssignDate = useCallback(
    (colIndex: number, date?: string) => {
      updateActiveGrid((currentGrid) => assignDateToColumn(currentGrid, colIndex, date));
    },
    [updateActiveGrid]
  );

  // Sequentially assign topics and optional weekly dates starting from a specific lesson
  const handleAssignSequential = useCallback(
    (startLessonNum: number, startDateIso?: string) => {
      if (!activeClass) return;
      const fullKtp = activeClass.fullKtp || [];
      if (fullKtp.length === 0) return;
      const q = activeClass.currentQuarter || 1;
      const qHours =
        activeClass.quarterHours?.[q] || activeClass.quarters[q]?.lessonHours || 8;
      const lastLessonCol = FIRST_LESSON_COL + qHours - 1;

      updateActiveGrid((currentGrid) => {
        let nextGrid = currentGrid;
        const startCol = FIRST_LESSON_COL + (startLessonNum - 1);
        let ktpIdx = startLessonNum - 1;
        let currentDateStep = startDateIso ? normalizeDateToIso(startDateIso) : undefined;

        for (let c = startCol; c <= lastLessonCol; c++) {
          const item = fullKtp[ktpIdx];
          if (item) {
            const dateToApply = currentDateStep || item.date;
            nextGrid = assignTopicToColumn(nextGrid, c, item, undefined, dateToApply);
            if (currentDateStep) {
              currentDateStep = addDaysToIsoDate(currentDateStep, 7);
            }
          }
          ktpIdx++;
        }
        return nextGrid;
      });
    },
    [activeClass, updateActiveGrid]
  );

  // Switch class (from bottom sheet tabs)
  const handleSelectClass = useCallback(
    (id: string) => {
      if (isEditing) setIsEditing(false);
      setActiveClassId(id);
      const targetClass = classes.find((c) => c.id === id);
      if (targetClass) {
        setActiveTableId(targetClass.activeTableId || 'q-1');
      }
      setSelectedRow(0);
      setSelectedCol(0);
    },
    [classes, isEditing]
  );

  // Add new class (from bottom + button) with exact hour-based columns (clean table, user's own topics and students)
  const handleAddClass = useCallback(
    (
      name: string,
      subject: string,
      totalHours: number,
      isClean: boolean,
      template: 'gradebook' | 'empty'
    ) => {
      const newId = `class-${Date.now()}`;
      const studentNames: string[] = [];
      const qHours = calculateQuarterHours(totalHours);
      const chosenKtp: KtpLesson[] = [];

      const makeQuarterGrid = (q: Quarter) => {
        if (template === 'empty') return createEmptyGrid();
        const startLesson = getQuarterStartLesson(q, totalHours);
        return createClassGradebookGrid(
          name,
          studentNames,
          chosenKtp,
          qHours[q],
          startLesson,
          isClean
        );
      };

      const quartersData = {
        1: {
          grid: makeQuarterGrid(1),
          ktp: [],
          lessonHours: qHours[1],
          startLessonNumber: getQuarterStartLesson(1, totalHours),
        },
        2: {
          grid: makeQuarterGrid(2),
          ktp: [],
          lessonHours: qHours[2],
          startLessonNumber: getQuarterStartLesson(2, totalHours),
        },
        3: {
          grid: makeQuarterGrid(3),
          ktp: [],
          lessonHours: qHours[3],
          startLessonNumber: getQuarterStartLesson(3, totalHours),
        },
        4: {
          grid: makeQuarterGrid(4),
          ktp: [],
          lessonHours: qHours[4],
          startLessonNumber: getQuarterStartLesson(4, totalHours),
        },
      };

      const newSchoolClass: SchoolClass = {
        id: newId,
        name,
        subject,
        totalHours,
        quarterHours: qHours,
        students: [],
        currentQuarter: 1,
        activeTableId: 'q-1',
        fullKtp: [],
        quarters: quartersData,
        yearlyGrid: createYearlySummaryGrid(name, studentNames, quartersData),
        ktpGrid: createKtpPlanningGrid(totalHours, []),
        extraTables: [],
      };

      setClasses((prev) => [...prev, newSchoolClass]);
      setActiveClassId(newId);
      setActiveTableId('q-1');
      setSelectedRow(0);
      setSelectedCol(0);
      setIsEditing(false);
    },
    []
  );

  // Add a new companion or custom table to the active class
  const handleAddTable = useCallback(
    (
      title: string,
      type: TableViewType,
      rows: number,
      cols: number,
      includeStudents: boolean
    ) => {
      if (!activeClass) return;
      const studentNames = activeClass.students.map((s) => s.name);
      let newGrid: GridData;

      if (type === 'yearly') {
        newGrid = createYearlySummaryGrid(activeClass.name, studentNames, activeClass.quarters);
      } else if (type === 'ktp') {
        newGrid = createKtpPlanningGrid(activeClass.totalHours || 34, activeClass.fullKtp || []);
      } else {
        // Custom table
        newGrid = createCustomTableGrid(
          title,
          rows,
          cols,
          includeStudents ? studentNames : []
        );
      }

      const newTableId = `table-${Date.now()}`;
      const newExtraTable: ExtraTable = {
        id: newTableId,
        name: title,
        type,
        grid: newGrid,
        createdAt: Date.now(),
      };

      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id === activeClassId) {
            return {
              ...cls,
              activeTableId: newTableId,
              extraTables: [...(cls.extraTables || []), newExtraTable],
            };
          }
          return cls;
        })
      );

      setActiveTableId(newTableId);
      setSelectedRow(0);
      setSelectedCol(0);
    },
    [activeClass, activeClassId]
  );

  // Delete an extra table
  const handleDeleteExtraTable = useCallback(
    (tableId: string) => {
      if (!activeClass) return;
      const tbl = activeClass.extraTables?.find((t) => t.id === tableId);
      const name = tbl?.name || 'таблицу';
      if (window.confirm(`Вы уверены, что хотите удалить ${name}?`)) {
        setClasses((prev) =>
          prev.map((cls) => {
            if (cls.id === activeClassId) {
              const updatedExtras = (cls.extraTables || []).filter((t) => t.id !== tableId);
              return {
                ...cls,
                extraTables: updatedExtras,
                activeTableId: cls.activeTableId === tableId ? 'q-1' : cls.activeTableId,
              };
            }
            return cls;
          })
        );
        if (activeTableId === tableId) {
          setActiveTableId('q-1');
        }
      }
    },
    [activeClass, activeClassId, activeTableId]
  );

  // Synchronize quarterly marks into the Yearly summary grid
  const handleSyncYearlyMarks = useCallback(() => {
    if (!activeClass) return;
    const baseGrid =
      activeClass.yearlyGrid ||
      createYearlySummaryGrid(
        activeClass.name,
        activeClass.students.map((s) => s.name),
        activeClass.quarters
      );
    const syncedGrid = syncQuarterMarksToYearly(
      baseGrid,
      activeClass.quarters,
      activeClass.students
    );

    setClasses((prev) =>
      prev.map((cls) =>
        cls.id === activeClassId ? { ...cls, yearlyGrid: syncedGrid } : cls
      )
    );
  }, [activeClass, activeClassId]);

  // Delete class handlers (safe in-app modal confirmation without window.confirm)
  const handleDeleteClass = useCallback((cls: SchoolClass) => {
    setClassToDelete(cls);
  }, []);

  const handleConfirmDeleteClass = useCallback(
    (id: string) => {
      const { updatedClasses, nextActiveId } = deleteClassFromList(classes, id, activeClassId);
      setClasses(updatedClasses);
      setActiveClassId(nextActiveId);
      setActiveTableId('q-1');
      setClassToDelete(null);
      setIsEditing(false);
      setEditValue('');
    },
    [classes, activeClassId]
  );

  // Student management for active class
  const handleAddStudent = useCallback(
    (name: string) => {
      const newStudent = { id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, name };
      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id === activeClassId) {
            const updatedStudents = [...cls.students, newStudent];
            return syncStudentsAcrossAllQuarters(cls, updatedStudents);
          }
          return cls;
        })
      );
    },
    [activeClassId]
  );

  const handleBatchAddStudents = useCallback(
    (names: string[]) => {
      const newStudents = names.map((name) => ({
        id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
      }));
      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id === activeClassId) {
            const updatedStudents = [...cls.students, ...newStudents];
            return syncStudentsAcrossAllQuarters(cls, updatedStudents);
          }
          return cls;
        })
      );
    },
    [activeClassId]
  );

  const handleRemoveStudent = useCallback(
    (studentId: string) => {
      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id === activeClassId) {
            const updatedStudents = cls.students.filter((s) => s.id !== studentId);
            return syncStudentsAcrossAllQuarters(cls, updatedStudents);
          }
          return cls;
        })
      );
    },
    [activeClassId]
  );

  const handleSyncToTable = useCallback(() => {
    if (!activeClass) return;
    const q = activeClass.currentQuarter || 1;
    const qHours =
      activeClass.quarterHours?.[q] || activeClass.quarters[q]?.lessonHours || 8;
    updateActiveGrid((currentGrid) => syncStudentsToGrid(currentGrid, activeClass.students, qHours));
  }, [activeClass, updateActiveGrid]);

  // Clean table: reset grades or values back to empty cells while preserving students & formulas
  const handleClearGrades = useCallback(() => {
    if (!activeClass) return;

    if (activeTableId.startsWith('q-')) {
      const qHours = currentQuarterHours;
      updateActiveGrid((currentGrid) => clearGradesInGrid(currentGrid, qHours));
    } else if (activeTableId === 'yearly') {
      // Clear quarter marks and exam in yearly grid, leave formulas and students
      updateActiveGrid((currentGrid) => {
        const next = currentGrid.map((r) => [...r]);
        for (let r = 1; r < next.length - 1; r++) {
          if (next[r][1]?.raw) {
            next[r][2] = { ...next[r][2], raw: '' }; // Q1
            next[r][3] = { ...next[r][3], raw: '' }; // Q2
            next[r][4] = { ...next[r][4], raw: '' }; // Q3
            next[r][5] = { ...next[r][5], raw: '' }; // Q4
            next[r][7] = { ...next[r][7], raw: '' }; // Exam
          }
        }
        return next;
      });
    } else {
      // Custom table: clear data cells (preserve headers and row 0, col 0, 1)
      updateActiveGrid((currentGrid) => {
        const next = currentGrid.map((r) => [...r]);
        for (let r = 1; r < next.length; r++) {
          for (let c = 2; c < next[r].length; c++) {
            if (next[r][c] && !next[r][c].raw.startsWith('=')) {
              next[r][c] = { ...next[r][c], raw: '' };
            }
          }
        }
        return next;
      });
    }

    setSelectedRow(0);
    setSelectedCol(0);
    setIsEditing(false);
  }, [activeClass, activeTableId, currentQuarterHours, updateActiveGrid]);

  // Fill demo grades to test calculations
  const handleLoadSample = useCallback(() => {
    if (!activeClass) return;

    if (activeTableId.startsWith('q-')) {
      const qHours = currentQuarterHours;
      const startLesson =
        currentQuarterData?.startLessonNumber ||
        getQuarterStartLesson(currentQuarter, activeClass.totalHours || 34);
      const studentNames =
        activeClass.students.length > 0
          ? activeClass.students.map((s) => s.name)
          : [
              'Алексеев Максим',
              'Борисов Артем',
              'Васильева Анна',
              'Григорьев Даниил',
              'Дмитриева Елена',
              'Егоров Кирилл',
              'Жукова Полина',
              'Иванов Иван',
              'Ковалева Мария',
              'Морозов Никита',
            ];

      updateActiveGrid(() =>
        createClassGradebookGrid(
          activeClass.name,
          studentNames,
          activeClass.fullKtp || INFORMATICS_8_FULL_KTP,
          qHours,
          startLesson,
          false // with demo grades!
        )
      );
    } else if (activeTableId === 'yearly') {
      // Fill demo quarter marks in yearly summary
      updateActiveGrid((cur) => {
        const next = cur.map((r) => [...r]);
        const demoMarks = [
          ['5', '5', '5', '5', '5'],
          ['4', '5', '4', '4', '4'],
          ['5', '4', '5', '5', '5'],
          ['3', '4', '4', '3', '4'],
          ['5', '5', '5', '5', '5'],
          ['4', '4', '4', '4', '4'],
          ['5', '5', '4', '5', '5'],
          ['3', '3', '4', '4', '3'],
        ];
        demoMarks.forEach((m, idx) => {
          const r = idx + 1;
          if (next[r] && next[r][1]?.raw) {
            next[r][2] = { ...next[r][2], raw: m[0], style: { align: 'center', bold: true } };
            next[r][3] = { ...next[r][3], raw: m[1], style: { align: 'center', bold: true } };
            next[r][4] = { ...next[r][4], raw: m[2], style: { align: 'center', bold: true } };
            next[r][5] = { ...next[r][5], raw: m[3], style: { align: 'center', bold: true } };
            next[r][7] = { ...next[r][7], raw: m[4], style: { align: 'center', bold: true } };
          }
        });
        return next;
      });
    }

    setSelectedRow(0);
    setSelectedCol(0);
    setIsEditing(false);
  }, [activeClass, activeTableId, currentQuarter, currentQuarterData, currentQuarterHours, updateActiveGrid]);

  // Clear current table completely (empty grid)
  const handleClearTable = useCallback(() => {
    if (window.confirm('Полностью очистить все ячейки текущей таблицы?')) {
      updateActiveGrid(() => createEmptyGrid());
      setSelectedRow(0);
      setSelectedCol(0);
      setIsEditing(false);
    }
  }, [updateActiveGrid]);

  // Export CSV of currently active table
  const handleExportCSV = useCallback(() => {
    const csvContent = exportGridToCSV(grid);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const viewSuffix =
      activeTableId === 'yearly'
        ? 'svodnaya_god'
        : activeTableId === 'ktp'
        ? 'plan_ktp'
        : activeTableId.startsWith('q-')
        ? `${activeTableId}_chetvert`
        : activeTableId;
    const safeName = `${activeClass?.name || 'klass'}_${viewSuffix}`.replace(
      /[^a-zA-Z0-9а-яА-ЯёЁ_-]/g,
      '_'
    );
    link.setAttribute('download', `${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [grid, activeClass, activeTableId]);

  // Import CSV into active table
  const handleImportCSV = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;
        const parsedRows = parseCSV(text);
        const newGrid = createEmptyGrid();

        parsedRows.forEach((row, rIdx) => {
          if (rIdx < TOTAL_ROWS) {
            row.forEach((cellVal, cIdx) => {
              if (cIdx < TOTAL_COLS) {
                newGrid[rIdx][cIdx] = {
                  raw: cellVal,
                  style: { align: 'left' },
                };
              }
            });
          }
        });

        updateActiveGrid(() => newGrid);
        setSelectedRow(0);
        setSelectedCol(0);
        setIsEditing(false);
      };
      reader.readAsText(file);
    },
    [updateActiveGrid]
  );

  // Count non-empty cells
  const nonEmptyCount = grid.reduce(
    (total, row) => total + row.filter((c) => c.raw.trim().length > 0).length,
    0
  );

  const currentTopicRaw =
    topicPickerCol !== null ? grid[0]?.[topicPickerCol]?.raw || '' : '';
  const currentLessonDate =
    topicPickerCol !== null ? grid[0]?.[topicPickerCol]?.date : undefined;

  const isLessonColumnSelected =
    currentQuarterHours > 0 &&
    selectedCol >= FIRST_LESSON_COL &&
    selectedCol < FIRST_LESSON_COL + currentQuarterHours;

  const lessonInfo = isLessonColumnSelected
    ? {
        colIndex: selectedCol,
        lessonNumber: selectedCol - FIRST_LESSON_COL + 1,
        date: grid[0]?.[selectedCol]?.date,
        topic: grid[0]?.[selectedCol]?.raw,
      }
    : null;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      {/* Top Application Header: Quarter Selector, Table Switcher & + Table */}
      <Header
        currentQuarter={currentQuarter}
        activeTableId={activeTableId}
        onChangeQuarter={handleChangeQuarter}
        onSelectTable={handleSelectTable}
        onOpenAddTableModal={() => setIsAddTableOpen(true)}
        onOpenKtpModal={() => setIsKtpModalOpen(true)}
        onLoadSample={handleLoadSample}
        onClearGrades={handleClearGrades}
        onClearTable={handleClearTable}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        nonEmptyCount={nonEmptyCount}
        activeClassName={activeClass?.name || 'Класс'}
        fullKtpCount={activeClass?.fullKtp?.length || 0}
        totalHours={activeClass?.totalHours || 34}
        quarterHours={currentQuarterHours}
        extraTables={activeClass?.extraTables || []}
        onSyncYearlyMarks={handleSyncYearlyMarks}
        onDeleteExtraTable={handleDeleteExtraTable}
        onOpenManageClasses={() => setIsManageClassesOpen(true)}
        onDeleteCurrentClass={() => activeClass && setClassToDelete(activeClass)}
      />

      {/* Editing & Formatting Toolbar */}
      <Toolbar
        selectedRow={selectedRow}
        selectedCol={selectedCol}
        activeRawValue={activeRawValue}
        onRawValueChange={handleRawValueChange}
        onCommitFormula={handleCommitFormula}
        currentStyle={activeCell?.style}
        onUpdateStyle={handleUpdateStyle}
        onInsertFormula={handleInsertFormula}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        lessonInfo={lessonInfo}
        onOpenTopicPicker={handleOpenTopicPicker}
      />

      {/* Main Dynamic Grid: sized to exact hours/cols */}
      <TableGrid
        grid={grid}
        selectedRow={selectedRow}
        selectedCol={selectedCol}
        onSelectCell={handleSelectCell}
        isEditing={isEditing}
        editValue={editValue}
        onStartEditing={handleStartEditing}
        onChangeEditValue={setEditValue}
        onCommitEdit={handleCommitEdit}
        onCancelEdit={handleCancelEdit}
        onClearActiveCell={handleClearActiveCell}
        searchTerm={searchTerm}
        onOpenTopicPicker={handleOpenTopicPicker}
      />

      {/* Bottom Class Sheet Bar: Classes & Add Class at Bottom! */}
      <BottomClassBar
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={handleSelectClass}
        onOpenAddClass={() => setIsAddClassOpen(true)}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        onOpenManageClasses={() => setIsManageClassesOpen(true)}
        onDeleteClass={handleDeleteClass}
        grid={grid}
        selectedRow={selectedRow}
        selectedCol={selectedCol}
      />

      {/* Add Class Modal (Hours & Clean table options) */}
      <AddClassModal
        isOpen={isAddClassOpen}
        onClose={() => setIsAddClassOpen(false)}
        onAddClass={handleAddClass}
      />

      {/* Add Table Modal (Companion tables & Clean custom grids) */}
      <AddTableModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        onAddTable={handleAddTable}
        activeClassName={activeClass?.name || 'Класс'}
        totalHours={activeClass?.totalHours || 34}
      />

      {/* Student List Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        classNameTitle={activeClass?.name || 'Класс'}
        students={activeClass?.students || []}
        onAddStudent={handleAddStudent}
        onBatchAddStudents={handleBatchAddStudents}
        onRemoveStudent={handleRemoveStudent}
        onSyncToTable={handleSyncToTable}
      />

      {/* KTP Import & Bank Modal */}
      <KtpModal
        isOpen={isKtpModalOpen}
        onClose={() => setIsKtpModalOpen(false)}
        quarter={currentQuarter}
        classNameTitle={activeClass?.name || 'Класс'}
        onApplyKtp={handleApplyKtp}
      />

      {/* Topic & Date Picker for Individual Lesson Column */}
      {topicPickerCol !== null && activeClass && (
        <TopicPickerModal
          isOpen={topicPickerCol !== null}
          onClose={() => setTopicPickerCol(null)}
          colIndex={topicPickerCol}
          activeClass={activeClass}
          currentQuarter={currentQuarter}
          currentTopicRaw={currentTopicRaw}
          currentDate={currentLessonDate}
          onAssignTopic={handleAssignTopic}
          onAssignDate={handleAssignDate}
          onAssignSequential={handleAssignSequential}
          onOpenKtpModal={() => setIsKtpModalOpen(true)}
        />
      )}

      {/* Delete Class Confirmation Modal (Zero window.confirm, safe in-app dialog) */}
      <DeleteClassModal
        isOpen={classToDelete !== null}
        onClose={() => setClassToDelete(null)}
        targetClass={classToDelete}
        totalClassesCount={classes.length}
        onConfirmDelete={handleConfirmDeleteClass}
      />

      {/* Manage All Classes Modal */}
      <ManageClassesModal
        isOpen={isManageClassesOpen}
        onClose={() => setIsManageClassesOpen(false)}
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={handleSelectClass}
        onOpenAddClass={() => {
          setIsManageClassesOpen(false);
          setIsAddClassOpen(true);
        }}
        onRequestDeleteClass={(cls) => setClassToDelete(cls)}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
