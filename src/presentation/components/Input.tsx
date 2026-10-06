import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import MdiIcon from './MdiIcon';

type InputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  secure?: boolean;
  /** MDI icon name for the left prepend (e.g. 'email-outline', 'lock-outline') */
  prependIcon?: string;
  /** MDI icon name for the right append (e.g. 'eye', 'eye-off') */
  appendIcon?: string;
  onAppendPress?: () => void;
  onChangeText?: (text: string) => void;
  testID?: string;
};

const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, secure = false, prependIcon, appendIcon, onAppendPress, style, testID, ...rest }: InputProps, ref) => {
    const { colors, radii } = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    const a11yLabel = (rest as any)?.accessibilityLabel ?? label;

    const isPassword = secure;
    const isPasswordVisible = showPassword;

    const handleAppendPress = onAppendPress || (isPassword ? () => setShowPassword(v => !v) : undefined);
    const currentAppendIcon = isPassword ? (isPasswordVisible ? 'eye' : 'eye-off') : appendIcon;

    return (
      <View style={styles.container}>
        {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
        <View
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.card, borderRadius: radii.md },
          ]}
        >
          {prependIcon ? (
            <View style={styles.prepend}>
              <MdiIcon name={prependIcon} size={18} color={colors.textMuted} />
            </View>
          ) : null}
          <TextInput
            {...(rest as any)}
            ref={ref}
            secureTextEntry={isPassword && !isPasswordVisible}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.textPrimary }, prependIcon ? styles.inputWithPrepend : null, style as any]}
            accessibilityLabel={a11yLabel}
            testID={testID}
          />
          {currentAppendIcon ? (
            <Pressable
              onPress={handleAppendPress}
              accessibilityRole="button"
              accessibilityLabel={isPassword ? (isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña') : undefined}
              style={styles.append}
            >
              <MdiIcon name={currentAppendIcon} size={20} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      </View>
    );
  }
);

export default Input;

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 448 },
  label: { marginBottom: 6, fontSize: 15 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  prepend: {
    paddingLeft: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    outlineStyle: 'none',
  },
  inputWithPrepend: {
    paddingLeft: 8,
  },
  append: {
    paddingRight: 12,
    paddingVertical: 10,
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: { marginTop: 6 },
});
