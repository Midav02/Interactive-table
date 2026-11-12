import React from 'react';
import { SchoolClass } from '../utils/schoolUtils';
import { AlertTriangle, Trash2, X, Users, BookOpen, Clock, Layers } from 'lucide-react';

interface DeleteClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClass: SchoolClass | null;
  totalClassesCount: number;
  onConfirmDelete: (id: string) => void;
}

export const DeleteClassModal: React.FC<DeleteClassModalProps> = ({
  isOpen,
  onClose,
  targetClass,
  totalClassesCount,
  onConfirmDelete,
}) => {
  if (!isOpen || !targetClass) return null;

  const isLastClass = totalClassesCount <= 1;
  const studentCount = targetClass.students?.length || 0;
  const ktpCount = targetClass.fullKtp?.length || 0;
  const extraTablesCount = targetClass.extraTables?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3 bg-red-50/60 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Удалить класс?
              </h3>
              <p className="text-xs text-red-700 font-medium">
                «{targetClass.name}» ({targetClass.totalHours || 34} ч)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm text-slate-600">
          <p>
            Вы действительно хотите удалить класс <strong className="text-slate-900">«{targetClass.name}»</strong>?
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Будет безвозвратно удалено:</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>Учеников: <strong>{studentCount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>Тем в КТП: <strong>{ktpCount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Оценки за 4 четверти</span>
              </div>
              {extraTablesCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Таблиц: <strong>{extraTablesCount}</strong></span>
                </div>
              )}
            </div>
          </div>

          {isLastClass && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              <span className="font-semibold">Обратите внимание:</span> Это единственный класс в журнале. После удаления будет автоматически создан новый чистый класс.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(targetClass.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Удалить класс</span>
          </button>
        </div>
      </div>
    </div>
  );
};
