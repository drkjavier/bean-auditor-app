import React, { useRef } from 'react';
import { Pressable, PressableProps, Platform } from 'react-native';

type Props = PressableProps & {
  onLongPress?: () => void;
  delay?: number; // ms
};

// Small cross-platform wrapper to provide reliable long-press on web and native
export default function TouchableLongPress({ onLongPress, delay = 600, onPress, onPressIn, onPressOut, ...rest }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledRef = useRef(false);
  const contextHandlerRef = useRef<((e: Event) => void) | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      try {
        if (contextHandlerRef.current && typeof document !== 'undefined') {
          document.removeEventListener('contextmenu', contextHandlerRef.current as any);
          contextHandlerRef.current = null;
        }
      } catch (_) {}
    };
  }, []);

  const handlePressIn: PressableProps['onPressIn'] = e => {
    handledRef.current = false;
    // start timer only if an onLongPress handler is provided
    if (onLongPress) {
      // prevent the browser context menu while we're detecting a long-press
      try {
        if (typeof document !== 'undefined') {
          contextHandlerRef.current = (ev: Event) => {
            try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
          };
          document.addEventListener('contextmenu', contextHandlerRef.current as any, { passive: false });
        }
      } catch (_) {}

      timerRef.current = setTimeout(() => {
        handledRef.current = true;
        console.log('TouchableLongPress: onLongPress fired');
        onLongPress();
      }, delay);
    }
    onPressIn?.(e);
  };

  const handlePressOut: PressableProps['onPressOut'] = e => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // remove temporary contextmenu prevention
    try {
      if (contextHandlerRef.current && typeof document !== 'undefined') {
        document.removeEventListener('contextmenu', contextHandlerRef.current as any);
        contextHandlerRef.current = null;
      }
    } catch (_) {}
    onPressOut?.(e);
  };

  const handlePress: PressableProps['onPress'] = e => {
    // if long-press already triggered, don't trigger regular press
    if (handledRef.current) return;
    onPress?.(e);
  };

  return (
    <Pressable
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    />
  );
}
