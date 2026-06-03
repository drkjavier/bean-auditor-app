import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';

type Props = { visible: boolean; onClose: () => void; items?: { key: string; title: string; onPress?: () => void }[] };

export default function DrawerMenu({ visible, onClose, items = [] }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {items.map(i => (
            <Pressable key={i.key} onPress={() => { i.onPress && i.onPress(); onClose(); }} style={styles.item}>
              <Text>{i.title}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={styles.close}>
            <Text>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start' },
  container: { width: 260, backgroundColor: '#fff', padding: 12, paddingTop: 48 },
  item: { paddingVertical: 12 },
  close: { marginTop: 12 }
});
