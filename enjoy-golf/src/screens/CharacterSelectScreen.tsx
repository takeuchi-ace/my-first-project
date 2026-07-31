import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Character, CompetitionId, RootStackParamList } from '../types';
import { characters } from '../data/characters';
import { competitionMap } from '../data/competitionData';
import { useGameStore } from '../store/useGameStore';
import { FaceSprite } from '../faces';
import { COLORS } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'CharacterSelect'>;

type CharacterStatus = 'locked' | 'unlocked' | 'contracted';

interface CharacterListItem {
  character: Character;
  status: CharacterStatus;
  cooldown: number;
}

// ===== 次の解放までの残数計算 =====
function calcRemainingToNextUnlock(
  contractedIds: number[],
  unlockedIds: number[],
  competitionCleared: Record<string, boolean>,
): number | null {
  for (const c of characters) {
    if (unlockedIds.includes(c.id)) continue; // 既に解放済み
    const cond = c.unlockBy;
    switch (cond.type) {
      case 'starter':
        continue;
      case 'contractWith':
        if (!contractedIds.includes(cond.id)) return 1;
        continue;
      case 'contractWithAny': {
        const has = cond.ids.some((id) => contractedIds.includes(id));
        if (!has) return 1;
        continue;
      }
      case 'totalContractsAtLeast': {
        const remaining = cond.count - contractedIds.length;
        if (remaining > 0) return remaining;
        continue;
      }
      case 'competitionClear':
        if (!competitionCleared[cond.competitionId]) return 1;
        continue;
    }
  }
  return null; // 全員解放済み
}

// ===== Pressable カードコンポーネント =====
function CharacterCard({
  item,
  remainingForLocked,
  onPress,
}: {
  item: CharacterListItem;
  remainingForLocked: number | null;
  onPress: () => void;
}) {
  const { character: char, status, cooldown } = item;
  const isLocked = status === 'locked';
  const isCoolingDown = cooldown > 0;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  if (isLocked) {
    // ===== ロックカード =====
    return (
      <View style={[styles.card, styles.cardLocked]}>
        {/* 斜線オーバーレイ */}
        <View style={styles.stripeOverlay} />
        <View style={styles.lockAvatarWrap}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.lockName}>？？？</Text>
          <Text style={styles.lockHint}>紹介を受けるとラウンド可能</Text>
        </View>
      </View>
    );
  }

  // ===== クールダウン中カード =====
  if (isCoolingDown) {
    return (
      <View style={[styles.card, styles.cardCooldown]}>
        <View style={[styles.avatarWrap, { opacity: 0.4 }]}>
          <FaceSprite mood={2} scale={1.5} characterId={char.id} titleMode />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { opacity: 0.5 }]} numberOfLines={2}>
            {char.name}
          </Text>
          <Text style={styles.cooldownText}>
            次に会えるまで：あと{cooldown}ラウンド
          </Text>
        </View>
      </View>
    );
  }

  // ===== 解放済みカード =====
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.card}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {/* 左: Avatar */}
        <View style={styles.avatarWrap}>
          <FaceSprite mood={3} scale={1.5} characterId={char.id} titleMode />
        </View>

        {/* 中央: 情報 */}
        <View style={styles.cardInfo}>
          {/* 表記が「肩書き・名前」なので、1行に収めると右から切れて
              肝心の名前が消える（「外資エリート・アレクサンダー…」）。
              375px幅でも収まらない名前があるため2行まで許す */}
          <Text style={styles.cardName} numberOfLines={2}>
            {char.name}
          </Text>
          {char.title ? (
            <Text style={styles.cardTitle} numberOfLines={1}>
              {char.title}
            </Text>
          ) : null}
          <Text style={styles.cardDetail}>
            {char.shotShape} / Avg {char.avgScore18}
          </Text>
          <Text style={styles.cardMotto} numberOfLines={1}>
            {char.motto}
          </Text>
        </View>

        {/* 右: バッジ */}
        {status === 'contracted' ? (
          <View style={styles.badgeContracted}>
            <Text style={styles.badgeContractedText}>
              {char.isAce ? '顧問契約済' : '契約済'}
            </Text>
          </View>
        ) : (
          <View style={styles.badgeUncontracted}>
            <Text style={styles.badgeUncontractedText}>未契約</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ===== メイン画面 =====
export default function CharacterSelectScreen({ navigation }: Props) {
  const store = useGameStore();
  const {
    unlockedCharacterIds,
    contractedCharacterIds,
    competitionCleared,
    cooldowns,
  } = store;

  // Competition state
  const compAvailable = store.isCompetitionAvailable();
  const nextCompId = store.getNextCompetition();
  const clearedComps = store.getClearedCompetitions();

  const totalCharCount = characters.length;

  const characterList: CharacterListItem[] = useMemo(() => {
    return characters
      .filter((c) => {
        if (c.unlockBy.type === 'competitionClear' && !unlockedCharacterIds.includes(c.id)) {
          return false;
        }
        return true;
      })
      .map((c) => {
        let status: CharacterStatus = 'locked';
        if (unlockedCharacterIds.includes(c.id)) {
          status = contractedCharacterIds.includes(c.id) ? 'contracted' : 'unlocked';
        }
        return { character: c, status, cooldown: cooldowns[c.id] ?? 0 };
      });
  }, [unlockedCharacterIds, contractedCharacterIds, cooldowns]);

  const remaining = useMemo(
    () => calcRemainingToNextUnlock(contractedCharacterIds, unlockedCharacterIds, competitionCleared),
    [contractedCharacterIds, unlockedCharacterIds, competitionCleared],
  );

  const renderItem = useCallback(
    ({ item }: { item: CharacterListItem }) => {
      // ロックカード用の残数
      const lockRemaining = item.status === 'locked' ? remaining : null;

      return (
        <CharacterCard
          item={item}
          remainingForLocked={lockRemaining}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Profile', { characterId: item.character.id });
          }}
        />
      );
    },
    [navigation, remaining],
  );

  const handleReset = useCallback(() => {
    const doReset = () => {
      store.resetAll();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };
    if (Platform.OS === 'web') {
      if (confirm('すべてのデータを削除して最初からプレイしますか？')) {
        doReset();
      }
    } else {
      Alert.alert(
        '最初からプレイ',
        'すべてのデータを削除して最初からプレイしますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'リセット', style: 'destructive', onPress: doReset },
        ],
      );
    }
  }, [store]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={characterList}
        keyExtractor={(item) => String(item.character.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* 進捗サブバー */}
            <View style={styles.progressSubBar}>
              <Text style={styles.progressText}>
                契約 {contractedCharacterIds.length}/{totalCharCount}
              </Text>
              {remaining != null && (
                <Text style={styles.progressHint}>
                  次の解放まであと {remaining}
                </Text>
              )}
            </View>

            {/* New competition banner */}
            {compAvailable && nextCompId && (() => {
              const comp = competitionMap.get(nextCompId);
              if (!comp) return null;
              const referrer = characters.find((c) => c.id === comp.referrerId);
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.compBanner,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    store.onCompetitionStart();
                    navigation.navigate('Competition', { competitionId: nextCompId });
                  }}
                >
                  <Text style={styles.compBannerTitle}>{comp.name}</Text>
                  <Text style={styles.compBannerComment}>
                    {referrer?.name ?? ''}「{comp.referrerComment}」
                  </Text>
                  <Text style={styles.compBannerAction}>参加する</Text>
                </Pressable>
              );
            })()}

            {/* Cleared competitions (replayable) */}
            {clearedComps.map((cid: CompetitionId) => {
              const comp = competitionMap.get(cid);
              if (!comp) return null;
              return (
                <Pressable
                  key={cid}
                  style={({ pressed }) => [
                    styles.compClearedBanner,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Competition', { competitionId: cid });
                  }}
                >
                  <Text style={styles.compClearedTitle}>{comp.name}</Text>
                  <Text style={styles.compClearedLabel}>クリア済</Text>
                </Pressable>
              );
            })}
          </>
        }
        renderItem={renderItem}
      />

      {/* 右下固定リセットボタン */}
      <Pressable
        style={({ pressed }) => [
          styles.resetButton,
          pressed && { opacity: 0.6 },
        ]}
        onPress={handleReset}
      >
        <Text style={styles.resetButtonText}>最初からプレイ</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  // ===== Progress sub-bar =====
  progressSubBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  progressText: {
    color: COLORS.textCream,
    fontSize: 13,
    fontWeight: '700',
  },
  progressHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  // ===== Card =====
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLocked: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  cardCooldown: {
    opacity: 0.6,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cooldownText: {
    color: 'rgba(255,200,100,0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  // ===== Stripe overlay for locked =====
  stripeOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundColor: 'transparent',
    borderWidth: 0,
    // Diagonal stripe effect via border hack isn't great in RN,
    // so we just keep the darkened card + lock icon approach
  },
  // ===== Avatar =====
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,105,20,0.35)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lockAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lockIcon: {
    fontSize: 18,
  },
  // ===== Card info =====
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  cardName: {
    color: COLORS.textCream,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginBottom: 2,
  },
  cardDetail: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginBottom: 2,
  },
  cardMotto: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontStyle: 'italic',
  },
  // ===== Locked card info =====
  lockName: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  lockHint: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    marginBottom: 2,
  },
  lockRemaining: {
    color: 'rgba(255,215,0,0.35)',
    fontSize: 10,
    fontStyle: 'italic',
  },
  // ===== Badges =====
  badgeContracted: {
    backgroundColor: 'rgba(76,175,80,0.18)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.35)',
  },
  badgeContractedText: {
    color: '#88DD88',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeUncontracted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  badgeUncontractedText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '600',
  },
  // ===== Competition banners =====
  compBanner: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD700',
    marginBottom: 12,
    alignItems: 'center',
  },
  compBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 4,
  },
  compBannerComment: {
    fontSize: 12,
    color: COLORS.textCream,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  compBannerAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD700',
  },
  compClearedBanner: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compClearedTitle: {
    fontSize: 13,
    color: 'rgba(255,215,0,0.6)',
  },
  compClearedLabel: {
    fontSize: 10,
    color: 'rgba(255,215,0,0.4)',
  },
  // ===== Reset button (右下固定) =====
  resetButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  resetButtonText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
});
