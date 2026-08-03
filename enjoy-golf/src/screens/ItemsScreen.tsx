/**
 * 道具箱 — もらいものの棚
 *
 * 相手ごとの道具はプロフィールにも出るが、集めたものは並べて見られないと
 * 集めている感じがしない。ここは一覧だけの画面。
 *
 * 未取得は「？？？」とヒントだけ出す。条件を隠したままだと
 * 運で集まるだけになり、狙う対象にならない。
 */

import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { characters } from '../data/characters';
import { GIFT_ITEM_TOTAL, giftItems } from '../data/items';
import { useGameStore } from '../store/useGameStore';
import { COLORS } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Items'>;

export default function ItemsScreen({ navigation }: Props) {
  const store = useGameStore();

  const rows = useMemo(() => {
    const owned = new Set(store.ownedItems);
    // 相手ごとに2つあるので、渡してくる相手で並べて隣に置く
    // （データの並びは「1つ目を21人ぶん → 2つ目を21人ぶん」なので、そのままだと離れる）
    return [...giftItems]
      .sort((a, b) => a.from - b.from)
      .map((item) => ({
        item,
        owned: owned.has(item.id),
        giver:
          characters.find((c) => c.id === item.from)?.name.split('・').pop() ??
          '',
        // まだ会っていない相手の道具は、誰からもらうものかも隠す
        met: store.unlockedCharacterIds.includes(item.from),
      }));
  }, [store.ownedItems, store.unlockedCharacterIds]);

  const count = rows.filter((r) => r.owned).length;

  const back = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerBar}>
        <Pressable onPress={back} style={styles.headerBack}>
          <Text style={styles.headerBackText}>{'< 戻る'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>道具箱</Text>
        <Text style={styles.headerRight}>
          {count}/{GIFT_ITEM_TOTAL}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {rows.map(({ item, owned, giver, met }) => (
          <View
            key={item.id}
            style={[styles.card, owned && styles.cardOwned]}
          >
            <Text style={styles.giver}>{met ? `${giver}さんから` : '？'}</Text>
            <Text style={owned ? styles.name : styles.nameLocked}>
              {owned ? item.name : '？？？'}
            </Text>
            <Text style={styles.desc}>
              {owned ? item.desc : met ? item.hint : 'まだ会っていない'}
            </Text>
            {owned && <Text style={styles.line}>「{item.line}」</Text>}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBack: {
    width: 70,
  },
  headerBackText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.textCream,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerRight: {
    width: 70,
    textAlign: 'right',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardOwned: {
    backgroundColor: 'rgba(255,215,0,0.09)',
    borderColor: 'rgba(255,215,0,0.4)',
  },
  giver: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginBottom: 3,
  },
  name: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  nameLocked: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  desc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 19,
  },
  line: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },
});
