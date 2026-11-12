import React, { useState } from 'react';
import { X, GraduationCap, Plus, Clock, Sparkles, Check, CheckSquare } from 'lucide-react';
import { calculateQuarterHours } from '../utils/schoolUtils';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClass: (
    name: string,
    subject: string,
    totalHours: number,
    isClean: boolean,
    template: 'gradebook' | 'empty'
  ) => void;
}

export const AddClassModal: React.FC<AddClassModalProps> = ({
  isOpen,
  onClose,
  onAddClass,
}) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedHours, setSelectedHours] = useState<number>(34);
  const [customHours, setCustomHours] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [isClean, setIsClean] = useState<boolean>(true); // Clean table by default!
  const [template, setTemplate] = useState<'gradebook' | 'empty'>('gradebook');

  if (!isOpen) return null;

  const currentTotalHours = isCustom
    ? parseInt(customHours, 10) || 34
    : selectedHours;

  const qHours = calculateQuarterHours(currentTotalHours);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddClass(
      name.trim(),
      subject.trim() || 'Основной предмет',
      currentTotalHours,
      isClean,
      template
    );
    setName('');
    setSubject('');
    setIsCustom(false);
    setCustomHours('');
    setSelectedHours(34);
    setIsClean(true);
    onClose();
  };

  const hourPresets = [
    { hours: 34, weekly: '1 ч/нед', label: '34 часа' },
    { hours: 68, weekly: '2 ч/нед', label: '68 часов' },
    { hours: 102, weekly: '3 ч/нед', label: '102 часа' },
    { hours: 106, weekly: '3+ ч/нед', label: '106 часов', featured: true },
    { hours: 136, weekly: '4 ч/нед', label: '136 часов' },
    { hours: 170, weekly: '5 ч/нед', label: '170 часов' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/75 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Добавить новый класс</h2>
              <p className="text-xs text-slate-500">Настройка программы по учебным часам учителя</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Class Name & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Название класса <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: 8-Б класс, 10-А..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Предмет
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Информатика, Алгебра..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Teacher Hours Section (Часы учителя) */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Нагрузка учителя (количество часов в год)</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Итого: {currentTotalHours} ч
              </span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-2">
              {hourPresets.map((preset) => {
                const isSelected = !isCustom && selectedHours === preset.hours;
                return (
                  <button
                    key={preset.hours}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedHours(preset.hours);
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{preset.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{preset.weekly}</span>
                    {preset.featured && (
                      <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold px-1 py-0.2 rounded-full">
                        хит
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Hours Input */}
            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="hoursChoice"
                  checked={isCustom}
                  onChange={() => setIsCustom(true)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium">Своё количество часов:</span>
                <input
                  type="number"
                  min="4"
                  max="350"
                  value={customHours}
                  onFocus={() => setIsCustom(true)}
                  onChange={(e) => {
                    setIsCustom(true);
                    setCustomHours(e.target.value);
                  }}
                  placeholder="Например: 106, 70, 140..."
                  className="w-28 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </label>
            </div>

            {/* Live Quarter Breakdown preview */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
              <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                Автоматическое распределение по четвертям:
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-sans">I четв.</span>
                  <strong className="text-emerald-700 text-xs">{qHours[1]} ч</strong>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-sans">II четв.</span>
                  <strong className="text-emerald-700 text-xs">{qHours[2]} ч</strong>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-sans">III четв.</span>
                  <strong className="text-emerald-700 text-xs">{qHours[3]} ч</strong>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-sans">IV четв.</span>
                  <strong className="text-emerald-700 text-xs">{qHours[4]} ч</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Clean table vs demo table */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800">
              Вид таблицы:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label
                className={`flex flex-col p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  isClean && template === 'gradebook'
                    ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tableCleanState"
                    checked={isClean && template === 'gradebook'}
                    onChange={() => {
                      setIsClean(true);
                      setTemplate('gradebook');
                    }}
                    className="text-emerald-600"
                  />
                  <span>Чистая таблица (готово к работе)</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 font-normal">
                  Пустые ячейки для оценок, готовые формулы ср. балла и оценки
                </span>
              </label>

              <label
                className={`flex flex-col p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  !isClean && template === 'gradebook'
                    ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tableCleanState"
                    checked={!isClean && template === 'gradebook'}
                    onChange={() => {
                      setIsClean(false);
                      setTemplate('gradebook');
                    }}
                    className="text-emerald-600"
                  />
                  <span>С демо-оценками</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 font-normal">
                  Заполнить образец оценок для тестирования
                </span>
              </label>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Создать класс ({currentTotalHours} ч)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
