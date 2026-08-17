import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFormalPortrait } from '../assets/formalPortraits';

type Props = {
  visible: boolean;
  characterId: number;
  name: string;
  onClose: () => void;
};

/** 契約後、プロフィールのドット絵をタップして再鑑賞するモーダル。 */
export default function FormalPortraitModal({
  visible,
  characterId,
  name,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="幻想画を閉じる"
          >
            <Text style={styles.close}>閉じる</Text>
          </Pressable>
        </View>
        <Image
          source={getFormalPortrait(characterId)}
          resizeMode="contain"
          style={styles.image}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070807',
  },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  name: {
    color: '#f5ead0',
    fontSize: 15,
    fontWeight: '700',
  },
  close: {
    color: '#c9a85c',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 8,
  },
  image: {
    flex: 1,
    width: '100%',
  },
});
