import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Check,
  Sparkles,
  BookOpen,
  Trash2,
  ArrowRightCircle,
  FileSpreadsheet,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import {
  KtpLesson,
  SchoolClass,
  getColumnLabel,
  normalizeDateToIso,
  formatLessonDate,
  formatFullRussianDate,
  getTodayIsoDate,
  addDaysToIsoDate,
} from '../utils';

interface TopicPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  colIndex: number; // 2..17 (Column C to R)
  activeClass: SchoolClass;
  currentQuarter: number;
  currentTopicRaw: string;
  currentDate?: string;
  onAssignTopic: (colIndex: number, topic: KtpLesson | null, date?: string) => void;
  onAssignDate?: (colIndex: number, date?: string) => void;
  onAssignSequential: (startLessonNum: number, startDateIso?: string) => void;
  onOpenKtpModal: () => void;
}

export const TopicPickerModal: React.FC<TopicPickerModalProps> = ({
  isOpen,
  onClose,
  colIndex,
  activeClass,
  currentQuarter,
  currentTopicRaw,
  currentDate,
  onAssignTopic,
  onAssignDate,
  onAssignSequential,
  onOpenKtpModal,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    normalizeDateToIso(currentDate || '')
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Keep selected date synced whenever modal opens or currentDate changes
  useEffect(() => {
    setSelectedDate(normalizeDateToIso(currentDate || ''));
  }, [currentDate, isOpen]);

  if (!isOpen) return null;

  const lessonNumber = colIndex - 1; // Col 2 -> Lesson 1
  const colLetter = getColumnLabel(colIndex);
  const fullKtp = activeClass.fullKtp || [];

  // Determine which topics are already assigned across the current quarter
  const assignedInQuarter = useMemo(() => {
    const map = new Map<number, number>(); // topic.number -> lessonNumber
    const qGrid = activeClass.quarters[currentQuarter as 1 | 2 | 3 | 4]?.grid;
    if (qGrid && qGrid[0]) {
      const qCols = qGrid[0].length;
      for (let c = 2; c < qCols; c++) {
        const raw = qGrid[0]?.[c]?.raw || '';
        if (raw === 'Ср. балл' || raw === 'Оценка за четв.') continue;
        const match = raw.match(/^(\d+)\.\s*(.+)$/);
        if (match) {
          map.set(parseInt(match[1], 10), c - 1);
        }
      }
    }
    return map;
  }, [activeClass, currentQuarter]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    const clean = searchTerm.trim().toLowerCase();
    if (!clean) return fullKtp;
    return fullKtp.filter(
      (item) =>
        item.topic.toLowerCase().includes(clean) ||
        item.number.toString().includes(clean)
    );
  }, [fullKtp, searchTerm]);

  // Find next unused topic
  const nextAvailableTopic = useMemo(() => {
    return fullKtp.find((item) => !assignedInQuarter.has(item.number));
  }, [fullKtp, assignedInQuarter]);

  const handleSelect = (topic: KtpLesson) => {
    // If user hasn't explicitly picked a date but topic has a date in KTP, use it
    const dateToApply =
      selectedDate || (topic.date ? normalizeDateToIso(topic.date) : undefined);
    onAssignTopic(colIndex, topic, dateToApply);
    onClose();
  };

  const handleClearTopic = () => {
    onAssignTopic(colIndex, null, selectedDate || undefined);
    onClose();
  };

  const handleSaveDateOnly = () => {
    if (onAssignDate) {
      onAssignDate(colIndex, selectedDate || undefined);
    } else {
      // Re-apply existing raw title with updated date
      const match = currentTopicRaw.match(/^(\d+)\.\s*(.+)$/);
      const existingKtp: KtpLesson | null = match
        ? { number: parseInt(match[1], 10), topic: match[2] }
        : null;
      onAssignTopic(colIndex, existingKtp, selectedDate || undefined);
    }
    onClose();
  };

  const handlePickNextAvailable = () => {
    if (nextAvailableTopic) {
      handleSelect(nextAvailableTopic);
    }
  };

  const handleSequentialFromHere = () => {
    onAssignSequential(lessonNumber, selectedDate || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/75 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800">
                  Выбор даты и темы: Урок №{lessonNumber} (Столбец {colLetter})
                </h2>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  {currentQuarter}-я четверть • {activeClass.name}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Установите дату проведения и выберите тему из рабочей программы (КТП)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            aria-label="Закрыть окно"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Selection Section (Выбор даты урока) */}
        <div className="px-5 py-3 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 border-b border-emerald-100/80 flex flex-col gap-2 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <label htmlFor="lesson-date-input" className="text-xs font-bold text-slate-800 cursor-pointer">
                Дата проведения урока:
              </label>
              <span className="text-xs font-medium text-emerald-800 bg-white/90 border border-emerald-200 px-2 py-0.5 rounded shadow-2xs">
                {selectedDate
                  ? formatFullRussianDate(selectedDate)
                  : 'Дата не выбрана'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveDateOnly}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Сохранить дату проведения для этого урока"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Сохранить дату</span>
            </button>
          </div>

          {/* Date Input & Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[170px] max-w-xs">
              <input
                id="lesson-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans shadow-2xs font-semibold text-slate-800"
              />
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayIsoDate())}
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 border border-slate-200 rounded-lg font-medium transition-colors cursor-pointer shadow-2xs"
                title="Установить сегодняшнюю дату"
              >
                Сегодня
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(addDaysToIsoDate(getTodayIsoDate(), 1))}
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 border border-slate-200 rounded-lg font-medium transition-colors cursor-pointer shadow-2xs"
                title="Установить завтрашнюю дату"
              >
                Завтра
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedDate(addDaysToIsoDate(selectedDate || getTodayIsoDate(), 7))
                }
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 border border-slate-200 rounded-lg font-medium transition-colors cursor-pointer shadow-2xs"
                title="Прибавить 1 неделю (+7 дней)"
              >
                +1 неделя
              </button>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors cursor-pointer"
                  title="Очистить дату"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Сбросить</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Current Topic Banner */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-500 shrink-0 font-medium">Сейчас в уроке:</span>
            <span className="font-semibold text-slate-800 truncate" title={currentTopicRaw}>
              {currentTopicRaw || `Урок ${lessonNumber} (тема не назначена)`}
            </span>
            {currentDate && (
              <span className="shrink-0 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200">
                {formatLessonDate(currentDate)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {currentTopicRaw && !currentTopicRaw.startsWith(`Урок ${lessonNumber}`) && (
              <button
                type="button"
                onClick={handleClearTopic}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                title="Очистить тему этого урока"
              >
                <Trash2 className="w-3 h-3" />
                <span>Очистить тему</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="px-5 py-2 bg-white border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs shrink-0">
          {nextAvailableTopic && (
            <button
              type="button"
              onClick={handlePickNextAvailable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Следующая свободная: №{nextAvailableTopic.number}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSequentialFromHere}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
            title="Заполнить последующие уроки текущей четверти темами по порядку (с еженедельным шагом дат, если выбрана дата)"
          >
            <ArrowRightCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Заполнить по порядку {selectedDate ? '(с шагом +7 дней)' : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenKtpModal();
            }}
            className="ml-auto text-emerald-700 hover:text-emerald-800 text-[11px] font-medium underline underline-offset-2 cursor-pointer"
          >
            Загрузить другой КТП...
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск темы по названию или номеру (например, 'алгоритм', 'системы счисления')..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-sans"
            />
          </div>
        </div>

        {/* Topics List */}
        <div className="p-5 pt-1 overflow-y-auto flex-1 space-y-1.5">
          {fullKtp.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">КТП для этого класса еще не загружен</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                Загрузите файл Excel (.xlsx, .xls) или список тем для автоматического заполнения
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenKtpModal();
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Загрузить КТП из Excel (.xlsx)</span>
              </button>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              По запросу «{searchTerm}» ничего не найдено.
            </div>
          ) : (
            filteredTopics.map((item) => {
              const assignedLesson = assignedInQuarter.get(item.number);
              const isCurrentThisLesson = assignedLesson === lessonNumber;

              return (
                <div
                  key={item.number}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all text-xs ${
                    isCurrentThisLesson
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                      : assignedLesson !== undefined
                      ? 'border-slate-200 bg-slate-50/60 opacity-80'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span
                      className={`w-8 h-7 flex items-center justify-center font-mono font-bold rounded text-xs shrink-0 ${
                        isCurrentThisLesson
                          ? 'bg-emerald-600 text-white'
                          : assignedLesson !== undefined
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      №{item.number}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate" title={item.topic}>
                        {item.topic}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.date && (
                          <span className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{item.date}</span>
                          </span>
                        )}
                        {isCurrentThisLesson ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                            Назначена в этом уроке
                          </span>
                        ) : assignedLesson !== undefined ? (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            Использована в Уроке №{assignedLesson}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            Свободная тема
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isCurrentThisLesson
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700'
                    }`}
                  >
                    {isCurrentThisLesson && <Check className="w-3.5 h-3.5" />}
                    <span>{isCurrentThisLesson ? 'Выбрана' : 'Выбрать'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/75 shrink-0 text-xs">
          <span className="text-slate-500">
            Всего тем в КТП: <strong>{fullKtp.length}</strong> • Назначено в четверти:{' '}
            <strong>{assignedInQuarter.size}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDateOnly}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Применить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-700 hover:bg-slate-200/80 rounded-lg border border-slate-300 font-medium transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
