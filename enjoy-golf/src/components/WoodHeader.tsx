import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

/**
 * 木目のヘッダー。
 *
 * react-navigation の既定ヘッダーを丸ごと置き換えているので、
 * **ステータスバーの逃げは自分で取る**。56pt 固定のままだと、
 * ノッチ／Dynamic Island のある端末で「CLUBHOUSE」が時計や
 * バッテリーの下に潜る（Web と旧端末では出ない差分）。
 */
export default function WoodHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { height: 56 + insets.top, paddingTop: insets.top }]}>
      <Text style={styles.title}>CLUBHOUSE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.woodDark,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.woodLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: COLORS.textCream,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 6,
  },
});
