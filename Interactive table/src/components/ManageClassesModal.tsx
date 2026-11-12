import React from 'react';
import { SchoolClass } from '../utils/schoolUtils';
import {
  X,
  GraduationCap,
  Plus,
  Trash2,
  Users,
  Clock,
  BookOpen,
  Check,
  ChevronRight,
} from 'lucide-react';

interface ManageClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  onOpenAddClass: () => void;
  onRequestDeleteClass: (cls: SchoolClass) => void;
}

export const ManageClassesModal: React.FC<ManageClassesModalProps> = ({
  isOpen,
  onClose,
  classes,
  activeClassId,
  onSelectClass,
  onOpenAddClass,
  onRequestDeleteClass,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Управление классами
              </h2>
              <p className="text-xs text-slate-500">
                Всего классов: {classes.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Classes List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
          {classes.map((cls) => {
            const isActive = cls.id === activeClassId;
            const studentCount = cls.students?.length || 0;
            const ktpCount = cls.fullKtp?.length || 0;
            const totalHours = cls.totalHours || 34;

            return (
              <div
                key={cls.id}
                className={`pt-2.5 first:pt-0 flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200'
                }`}
              >
                <div
                  className="flex-1 cursor-pointer min-w-0 pr-3"
                  onClick={() => {
                    onSelectClass(cls.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-800 truncate">
                      {cls.name}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                        <Check className="w-2.5 h-2.5" /> Активный
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>{totalHours} ч</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-600" />
                      <span>{studentCount} учеников</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-amber-600" />
                      <span>{ktpCount > 0 ? `${ktpCount} тем КТП` : 'КТП не задан'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectClass(cls.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg transition-colors cursor-pointer"
                      title="Выбрать этот класс"
                    >
                      <span>Выбрать</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDeleteClass(cls);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title={`Удалить класс «${cls.name}»`}
                    aria-label={`Удалить класс ${cls.name}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAddClass();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить новый класс</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
