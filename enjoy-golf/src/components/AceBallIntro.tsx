/**
 * ACEボールの説明 — 初めて手にしたときだけ出す
 *
 * これまでどこにも説明が無かった。
 * 手に入る場面は「本心読破！ ACEボール +1」という 1.5 秒のトーストだけで、
 * 使う場面のポップアップも「使ってやり直しますか？」としか言わない。
 * 何個まで持てるのか、どうすれば増えるのかが分からないまま消費することになる。
 *
 * 初回だけ止めて説明する。2回目以降は出さない（`aceBallExplained` に記録）。
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  visible: boolean;
  /** 持てる上限。ストアの ACE_BALL_MAX を渡す */
  max: number;
  onClose: () => void;
}

export default function AceBallIntro({ visible, max, onClose }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.popup}>
        <Text style={styles.title}>ACEボール</Text>

        <Text style={styles.lead}>
          銀座から預かった、打ち直しの一球です。
        </Text>

        <View style={styles.rules}>
          <Text style={styles.rule}>
            ・相手の機嫌を損ねた直後だけ、その一手を選び直せます
          </Text>
          <Text style={styles.rule}>・使うと1つ減ります</Text>
          <Text style={styles.rule}>
            ・相手の本心を読み切ると1つ増えます（{max}つまで）
          </Text>
        </View>

        <Text style={styles.note}>
          持っていても、使うかどうかはその場で選べます。
        </Text>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
          onPress={onClose}
        >
          <Text style={styles.btnText}>わかりました</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    // 使用のポップアップ（200）より上に出す。獲得の説明が先に読まれるべき
    zIndex: 210,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  popup: {
    backgroundColor: '#14301f',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.45)',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  title: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  lead: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  rules: {
    marginBottom: 16,
  },
  rule: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 2,
  },
  note: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 18,
  },
  btn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.6)',
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
