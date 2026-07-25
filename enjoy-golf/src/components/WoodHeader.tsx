import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function WoodHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CLUBHOUSE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
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
