/**
 * 連戦の結果
 *
 * 21人と契約したあとに何も残らなかったので足したモード。
 * 「続けて何人と契約できたか」を出すだけの画面。
 *
 * 到達人数と合計スコアは `endRun()` が返した値をそのまま受け取る。
 * この画面でストアを触らない（`endRun` の時点で摩耗の巻き戻しと
 * 自己ベストの更新まで終わっている）ので、二重実行の心配がない。
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useGameStore } from '../store/useGameStore';
import { COLORS } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RunResult'>;

/** 到達人数に添える一言。数字だけだと手応えが残らない */
const comment = (reached: number): string => {
  if (reached === 0) return '一人目で終わってしまった。';
  if (reached <= 2) return 'まだ肩が温まっていない。';
  if (reached <= 4) return '悪くない流れだった。';
  if (reached <= 6) return 'よく続いた。ここから先は体力の勝負だ。';
  return 'ここまで続けられる人はそういない。';
};

export default function RunResultScreen({ navigation, route }: Props) {
  const { reached, totalScore, isBest } = route.params;
  const store = useGameStore();
  const best = store.bestRun;

  const restart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const order = store.startRun();
    if (order.length === 0) {
      navigation.popToTop();
      return;
    }
    navigation.replace('Profile', { characterId: order[0], autoStart: true });
  };

  const back = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>連戦おわり</Text>

        <Text style={styles.reachedLabel}>続けて契約できた人数</Text>
        <Text style={styles.reached}>{reached}</Text>
        <Text style={styles.comment}>{comment(reached)}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>接待スコアの合計</Text>
            <Text style={styles.rowValue}>{totalScore}</Text>
          </View>
          {best && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>自己ベスト</Text>
              <Text style={styles.rowValue}>
                {best.reached}人（{best.totalScore}）
              </Text>
            </View>
          )}
        </View>

        {isBest && <Text style={styles.bestUpdate}>自己ベスト更新</Text>}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.7 }]}
          onPress={restart}
        >
          <Text style={styles.primaryBtnText}>もう一度</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.6 }]}
          onPress={back}
        >
          <Text style={styles.secondaryBtnText}>戻る</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 28,
    alignItems: 'center',
    paddingTop: 48,
  },
  title: {
    color: COLORS.textCream,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 28,
  },
  reachedLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  reached: {
    color: COLORS.gradeS,
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 74,
  },
  comment: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  rowValue: {
    color: '#f0e6c8',
    fontSize: 14,
    fontWeight: '700',
  },
  bestUpdate: {
    color: COLORS.gradeS,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 20,
  },
  primaryBtn: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.55)',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
});
