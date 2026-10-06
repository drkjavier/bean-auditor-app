import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import MdiIcon from './MdiIcon';

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
  const { colors, typography, radii, spacing } = useTheme();
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
    const dynamicWebInputStyle: React.CSSProperties = {
      width: '100%',
      minHeight: 40,
      border: `1px solid ${colors.border}`,
      borderRadius: radii.md,
      padding: `${spacing.xs}px ${spacing.sm}px`,
      fontSize: typography.body.fontSize,
      color: colors.textPrimary,
      backgroundColor: colors.card,
      outline: 'none',
      boxSizing: 'border-box',
    };

    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.textPrimary, ...typography.caption }]}>{label}</Text>
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
          style={dynamicWebInputStyle}
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
        <Text style={[styles.label, { color: colors.textPrimary, ...typography.caption }]}>{label}</Text>
        <Pressable
          style={[styles.trigger, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={handleOpen}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint="Abre el selector de fecha"
        >
          <Text style={[styles.triggerText, { color: colors.textPrimary }, !selectedDate && { color: colors.muted }]}>{selectedLabel}</Text>
          <MdiIcon name="calendar-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={handleCancel}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={handleCancel} accessibilityRole="button" accessibilityLabel="Cerrar selector" />
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                },
              ]}
              accessibilityViewIsModal
            >
            <Text style={[styles.modalTitle, { color: colors.textPrimary, ...typography.subtitle }]}>{label}</Text>

            <View style={styles.monthHeader}>
              <Pressable
                onPress={() => setVisibleMonth(getPreviousMonth(visibleMonth.year, visibleMonth.month))}
                style={[styles.monthButton, { backgroundColor: colors.actionSecondaryBg }]}
                accessibilityRole="button"
                accessibilityLabel="Mes anterior"
              >
                <Text style={[styles.monthButtonText, { color: colors.onActionSecondary }]}>‹</Text>
              </Pressable>

              <Text style={[styles.monthTitle, { color: colors.textPrimary, ...typography.body }]}>{formatMonthTitle(visibleMonth.year, visibleMonth.month)}</Text>

              <Pressable
                onPress={() => setVisibleMonth(getNextMonth(visibleMonth.year, visibleMonth.month))}
                style={[styles.monthButton, { backgroundColor: colors.actionSecondaryBg }]}
                accessibilityRole="button"
                accessibilityLabel="Mes siguiente"
              >
                <Text style={[styles.monthButtonText, { color: colors.onActionSecondary }]}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekHeader}>
              {WEEK_DAYS.map(day => (
                <Text key={day} style={[styles.weekDayLabel, { color: colors.muted, ...typography.caption }]}>
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
                    style={[styles.dayCell, styles.dayButton, isSelected && [styles.dayButtonSelected, { backgroundColor: colors.primary }]]}
                    onPress={() => setDraftDate(day)}
                    accessibilityRole="button"
                    accessibilityLabel={`Seleccionar ${formatCalendarDate(day)}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.dayText, { color: colors.textPrimary, ...typography.body }, isSelected && [styles.dayTextSelected, { color: colors.textButton }]]}>{day.day}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={handleCancel}
                style={[styles.actionButton, styles.secondaryButton, { backgroundColor: colors.actionSecondaryBg }]}
                accessibilityRole="button"
                accessibilityLabel="Cancelar selección"
              >
                <Text style={[styles.actionText, styles.secondaryButtonText, { color: colors.onActionSecondary }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleAccept}
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: !draftDate ? colors.disabledBg : colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Aceptar selección"
                disabled={!draftDate}
              >
                <Text style={[styles.actionText, styles.primaryButtonText, { color: !draftDate ? colors.disabledText : colors.textButton }]}>Aceptar</Text>
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
    // Use local getters: DatePickerInput builds its ISO strings in local time
    // (see buildIsoString) so the displayed day always matches the selected day.
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
      day: parsed.getDate(),
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

  // Build the boundary in LOCAL time (not UTC): in negative-offset timezones
  // (e.g. UTC-6) a UTC-midnight ISO string displayed with toLocaleDateString()
  // shifts back one day, showing the wrong "Desde/Hasta" to the user.
  return new Date(date.year, date.month - 1, date.day, hours, minutes, seconds, 0).toISOString();
}

function getTodayCalendarDate(): CalendarDate {
  const now = new Date();

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
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

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 12,
    // allow the container to shrink in tight layouts
    width: '100%',
    minWidth: 0,
  },
  label: {
    marginBottom: 6,
  },
  trigger: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    flex: 1,
  },
  placeholderText: {},
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
    borderRadius: 16,
    padding: 16,
    elevation: 4,
  },
  modalTitle: {
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
  },
  monthButtonText: {
    fontSize: 20,
  },
  monthTitle: {
    textTransform: 'capitalize',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
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
  dayButtonSelected: {},
  dayText: {},
  dayTextSelected: {
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
  secondaryButton: {},
  secondaryButtonText: {},
  primaryButton: {},
  primaryButtonText: {},
});
