import React, { useRef } from 'react';
import { Pressable, PressableProps, Platform } from 'react-native';

type Props = PressableProps & {
  onLongPress?: () => void;
  onDoubleTap?: (e?: any) => void;
  delay?: number; // ms for long press
  doubleTapDelay?: number; // ms to detect double tap
};

// Small cross-platform wrapper to provide reliable long-press on web and native
export default function TouchableLongPress({ onLongPress, delay = 600, onPress, onPressIn, onPressOut, onDoubleTap, doubleTapDelay = 300, ...rest }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledRef = useRef(false);
  const contextHandlerRef = useRef<((e: Event) => void) | null>(null);
  const lastTapRef = useRef<number>(0);

  const webNoCallout: any = Platform.OS === 'web' ? { WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'manipulation' } : {};

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
        if (__DEV__) console.debug('TouchableLongPress: onLongPress fired');
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
    try {
      const now = Date.now();
      if (lastTapRef.current && now - lastTapRef.current <= (doubleTapDelay || 300)) {
        // double tap detected
        lastTapRef.current = 0;
        if (__DEV__) console.debug('TouchableLongPress: onDoubleTap fired');
        if (typeof onDoubleTap === 'function') onDoubleTap(e);
      } else {
        lastTapRef.current = now;
      }
    } catch (_) {}

    onPress?.(e);
  };

  return (
    <Pressable
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[webNoCallout, (rest as any)?.style]}
    />
  );
}
