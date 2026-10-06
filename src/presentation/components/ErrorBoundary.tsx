import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

interface Props {
  children: ReactNode;
  /** Optional fallback UI to render when an error occurs */
  fallback?: ReactNode;
  /** Callback invoked when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors during rendering,
 * in lifecycle methods, and in constructors of the tree below it.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * Note: Error boundaries do NOT catch errors in:
 * - Event handlers
 * - Asynchronous code (setTimeout, requestAnimationFrame)
 * - Server-side rendering
 * - Errors in the error boundary itself
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error.message);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ThemedErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Full-screen error UI — a function component so it can consume theme
 * tokens via `useTheme()` (class components cannot use hooks).
 */
function ThemedErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Algo salió mal</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
      </Text>
      {process.env.NODE_ENV !== 'production' && error && (
        <Text style={[styles.errorDetail, { color: colors.textMuted, backgroundColor: colors.card }]}>
          {error.message}
        </Text>
      )}
      <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onReset}>
        <Text style={[styles.buttonText, { color: colors.textButton }]}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  errorDetail: {
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
