import React, { useState } from 'react';
import { X, Users, UserPlus, Trash2, ArrowDownToLine, ListPlus } from 'lucide-react';
import { Student } from '../utils/schoolUtils';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  students: Student[];
  onAddStudent: (name: string) => void;
  onBatchAddStudents: (names: string[]) => void;
  onRemoveStudent: (id: string) => void;
  onSyncToTable: () => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  classNameTitle,
  students,
  onAddStudent,
  onBatchAddStudents,
  onRemoveStudent,
  onSyncToTable,
}) => {
  const [singleName, setSingleName] = useState('');
  const [batchText, setBatchText] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);

  if (!isOpen) return null;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;
    onAddStudent(singleName.trim());
    setSingleName('');
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const names = batchText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (names.length > 0) {
      onBatchAddStudents(names);
      setBatchText('');
      setIsBatchMode(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800">
                  Ученики ({classNameTitle})
                </h2>
                <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  Всего: {students.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Добавляйте учеников и переносите их в строки таблицы 20×20
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Add Student Section */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                {isBatchMode ? 'Массовое добавление списком' : 'Добавить ученика'}
              </span>
              <button
                type="button"
                onClick={() => setIsBatchMode(!isBatchMode)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <ListPlus className="w-3 h-3" />
                <span>{isBatchMode ? 'Один ученик' : 'Списком (пакетно)'}</span>
              </button>
            </div>

            {!isBatchMode ? (
              <form onSubmit={handleSingleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="Фамилия Имя, например: Смирнов Алексей"
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!singleName.trim()}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-white shadow-xs transition-colors ${
                    singleName.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Добавить</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleBatchSubmit} className="space-y-2">
                <textarea
                  rows={4}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder="Вставьте список учеников (каждый с новой строки):&#10;Иванов Иван&#10;Петров Петр&#10;Сидорова Анна"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!batchText.trim()}
                    className={`inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-medium rounded-lg text-white shadow-xs transition-colors ${
                      batchText.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>Добавить всех</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Current Student Roster */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Список учеников ({students.length})
              </h3>
              {students.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onSyncToTable();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  title="Заполнить строки таблицы именами учеников"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Вставить в таблицу</span>
                </button>
              )}
            </div>

            {students.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                В этом классе пока нет учеников. Добавьте первого ученика выше!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                {students.map((st, idx) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between px-3 py-2 text-xs bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-mono text-slate-400 font-semibold">
                        {idx + 1}.
                      </span>
                      <span className="font-medium text-slate-800">{st.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveStudent(st.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                      title="Удалить из списка"
                      aria-label={`Удалить ${st.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <span className="text-[11px] text-slate-500">
            В сетку 20 строк помещается до 18 учеников
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Закрыть
            </button>
            {students.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onSyncToTable();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>Применить к таблице</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
