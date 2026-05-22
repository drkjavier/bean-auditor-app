import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type DatePickerMode = 'from' | 'to';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  mode: DatePickerMode;
};

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

export default function DatePickerInput({ value, onChange, label, mode }: Props) {
  const selectedDate = useMemo(() => parseIsoToCalendarDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<CalendarDate | null>(selectedDate);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const base = selectedDate ?? getTodayCalendarDate();

    return {
      year: base.year,
      month: base.month,
    };
  });

  useEffect(() => {
    if (!open) {
      setDraftDate(selectedDate);
      const base = selectedDate ?? getTodayCalendarDate();
      setVisibleMonth({ year: base.year, month: base.month });
    }
  }, [open, selectedDate]);

  const selectedLabel = selectedDate ? formatCalendarDate(selectedDate) : 'Seleccionar fecha';

  if (Platform.OS === 'web') {
    const webValue = selectedDate ? toDateInputValue(selectedDate) : '';

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        {/* @ts-ignore web-only input element */}
        <input
          type="date"
          value={webValue}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const nextValue = event.target.value;

            if (!isDateInputValue(nextValue)) {
              return;
            }

            const nextDate = parseDateInputValue(nextValue);
            onChange(buildIsoString(nextDate, mode));
          }}
          aria-label={label}
          style={webInputStyle}
        />
      </View>
    );
  }

  const calendarDays = getCalendarDays(visibleMonth.year, visibleMonth.month);

  const handleOpen = () => {
    const base = selectedDate ?? getTodayCalendarDate();
    setDraftDate(selectedDate ?? base);
    setVisibleMonth({ year: base.year, month: base.month });
    setOpen(true);
  };

  const handleCancel = () => {
    setDraftDate(selectedDate);
    setOpen(false);
  };

  const handleAccept = () => {
    if (draftDate) {
      onChange(buildIsoString(draftDate, mode));
    }

    setOpen(false);
  };

  return (
    <>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          style={styles.trigger}
          onPress={handleOpen}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint="Abre el selector de fecha"
        >
          <Text style={[styles.triggerText, !selectedDate && styles.placeholderText]}>{selectedLabel}</Text>
          <Text style={styles.triggerIcon}>📅</Text>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={handleCancel}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={handleCancel} accessibilityRole="button" accessibilityLabel="Cerrar selector" />
            <View style={[styles.modalCard, Platform.OS === 'web' ? styles.modalCardWeb : undefined]} accessibilityViewIsModal>
            <Text style={styles.modalTitle}>{label}</Text>

            <View style={styles.monthHeader}>
              <Pressable
                onPress={() => setVisibleMonth(getPreviousMonth(visibleMonth.year, visibleMonth.month))}
                style={styles.monthButton}
                accessibilityRole="button"
                accessibilityLabel="Mes anterior"
              >
                <Text style={styles.monthButtonText}>‹</Text>
              </Pressable>

              <Text style={styles.monthTitle}>{formatMonthTitle(visibleMonth.year, visibleMonth.month)}</Text>

              <Pressable
                onPress={() => setVisibleMonth(getNextMonth(visibleMonth.year, visibleMonth.month))}
                style={styles.monthButton}
                accessibilityRole="button"
                accessibilityLabel="Mes siguiente"
              >
                <Text style={styles.monthButtonText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekHeader}>
              {WEEK_DAYS.map(day => (
                <Text key={day} style={styles.weekDayLabel}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const isSelected = isSameCalendarDate(day, draftDate);

                return (
                  <Pressable
                    key={`${day.year}-${day.month}-${day.day}`}
                    style={[styles.dayCell, styles.dayButton, isSelected && styles.dayButtonSelected]}
                    onPress={() => setDraftDate(day)}
                    accessibilityRole="button"
                    accessibilityLabel={`Seleccionar ${formatCalendarDate(day)}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day.day}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={handleCancel}
                style={[styles.actionButton, styles.secondaryButton]}
                accessibilityRole="button"
                accessibilityLabel="Cancelar selección"
              >
                <Text style={[styles.actionText, styles.secondaryButtonText]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleAccept}
                style={[styles.actionButton, styles.primaryButton, !draftDate && styles.disabledButton]}
                accessibilityRole="button"
                accessibilityLabel="Aceptar selección"
                disabled={!draftDate}
              >
                <Text style={[styles.actionText, styles.primaryButtonText]}>Aceptar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function parseIsoToCalendarDate(value: string): CalendarDate | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return {
      year: parsed.getUTCFullYear(),
      month: parsed.getUTCMonth() + 1,
      day: parsed.getUTCDate(),
    };
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function buildIsoString(date: CalendarDate, mode: DatePickerMode) {
  const hours = mode === 'from' ? 0 : 23;
  const minutes = mode === 'from' ? 0 : 59;
  const seconds = mode === 'from' ? 0 : 59;

  return new Date(Date.UTC(date.year, date.month - 1, date.day, hours, minutes, seconds, 0)).toISOString();
}

function getTodayCalendarDate(): CalendarDate {
  const now = new Date();

  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  };
}

function formatCalendarDate(date: CalendarDate) {
  return `${String(date.day).padStart(2, '0')}/${String(date.month).padStart(2, '0')}/${date.year}`;
}

function formatMonthTitle(year: number, month: number) {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function toDateInputValue(date: CalendarDate) {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

function isDateInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseDateInputValue(value: string): CalendarDate {
  const [year, month, day] = value.split('-').map(Number);

  return { year, month, day };
}

function getPreviousMonth(year: number, month: number) {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
}

function getNextMonth(year: number, month: number) {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }

  return { year, month: month + 1 };
}

function getCalendarDays(year: number, month: number) {
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDayOfWeek = normalizeWeekDay(new Date(Date.UTC(year, month - 1, 1)).getUTCDay());
  const days: Array<CalendarDate | null> = [];

  for (let index = 0; index < firstDayOfWeek; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push({ year, month, day });
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function normalizeWeekDay(day: number) {
  return day === 0 ? 6 : day - 1;
}

function isSameCalendarDate(left: CalendarDate | null, right: CalendarDate | null) {
  if (!left || !right) {
    return false;
  }

  return left.year === right.year && left.month === right.month && left.day === right.day;
}

const webInputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 40,
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  color: '#0f172a',
  backgroundColor: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 12,
    // allow the container to shrink in tight layouts
    width: '100%',
    minWidth: 0,
  },
  label: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  trigger: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
  },
  placeholderText: {
    color: '#64748b',
  },
  triggerIcon: {
    marginLeft: 12,
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    // keep native shadow props for iOS/Android — react-native-web will ignore these
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  // Web-specific card shadow to avoid deprecated shadow* warnings on react-native-web
  modalCardWeb: {
    // React Native web expects CSS properties in a camelCase object.
    boxShadow: '0 8px 24px rgba(2,6,23,0.08)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  monthButtonText: {
    fontSize: 20,
    color: '#0f172a',
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.2857%',
    padding: 2,
  },
  dayButton: {
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#2563eb',
  },
  dayText: {
    color: '#0f172a',
    fontSize: 14,
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    minHeight: 40,
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#0f172a',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
