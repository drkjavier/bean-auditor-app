import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, TextInputProps } from 'react-native';
import theme from '../themes/theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  secure?: boolean;
  onChangeText?: (text: string) => void;
  testID?: string;
};

const Input = forwardRef<TextInput, InputProps>(({ label, error, secure = false, style, testID, ...rest }: InputProps, ref) => {
  const [visible, setVisible] = useState(!secure);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <TextInput
          {...(rest as any)}
          ref={ref}
          secureTextEntry={!visible}
          style={[styles.input, style as any]}
          accessibilityLabel={label}
          testID={testID}
        />
        {secure ? (
          <Pressable onPress={() => setVisible(v => !v)} accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={styles.toggle}>
            <Text style={styles.toggleText}>{visible ? '🙈' : '👁️'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

export default Input;

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 360 },
  label: { marginBottom: 6, color: theme.colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
  },
  toggle: { paddingHorizontal: 8 },
  toggleText: { fontSize: 16 },
  error: { marginTop: 6, color: theme.colors.error },
});
