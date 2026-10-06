import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

type Props = { visible: boolean; onClose: () => void; items?: { key: string; title: string; onPress?: () => void }[] };

export default function DrawerMenu({ visible, onClose, items = [] }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.container, styles.containerElevated, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {items.map(i => (
            <Pressable key={i.key} onPress={() => { i.onPress && i.onPress(); onClose(); }} style={styles.item}>
              <Text style={[styles.itemText, { color: colors.textPrimary }]}>{i.title}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={styles.close}>
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start' },
  container: { width: 260, padding: 12, paddingTop: 48 },
  containerElevated: { zIndex: 2000, elevation: 30 },
  item: { paddingVertical: 12 },
  itemText: {},
  close: { marginTop: 12 },
  closeText: {},
});
