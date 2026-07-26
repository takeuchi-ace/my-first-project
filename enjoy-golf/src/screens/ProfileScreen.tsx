import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { characters } from '../data/characters';
import { useGameStore } from '../store/useGameStore';
import { FaceSprite } from '../faces';
import { COLORS } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const PRE_ROUND_AUTO_MS = 1000;
const PRE_ROUND_FADE_MS = 300;

export default function ProfileScreen({ route, navigation }: Props) {
  const { characterId } = route.params;
  const store = useGameStore();
  const character = useMemo(
    () => characters.find((c) => c.id === characterId)!,
    [characterId],
  );

  const isContracted = store.contractedCharacterIds.includes(characterId);
  const totalCharCount = characters.length;

  // ===== Pre-round line modal state =====
  const [showPreRound, setShowPreRound] = useState(false);
  const preRoundOpacity = useRef(new Animated.Value(0)).current;
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  const startRound = useCallback(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    setShowPreRound(false);
    navigation.replace('GameSimple', { characterId });
  }, [characterId, navigation]);

  const handleRoundPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (character.preRoundLine) {
      // Show pre-round line modal
      setShowPreRound(true);
      preRoundOpacity.setValue(0);

      Animated.timing(preRoundOpacity, {
        toValue: 1,
        duration: PRE_ROUND_FADE_MS,
        useNativeDriver: true,
      }).start();

      // Auto advance
      autoTimerRef.current = setTimeout(() => {
        startRound();
      }, PRE_ROUND_AUTO_MS);
    } else {
      // No line → go directly
      navigation.replace('GameSimple', { characterId });
    }
  }, [character, characterId, navigation, preRoundOpacity, startRound]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={handleBack} style={styles.headerBack}>
          <Text style={styles.headerBackText}>{'< 戻る'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <Text style={styles.headerRight}>
          契約 {store.contractedCharacterIds.length}/{totalCharCount}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarFrame}>
            <FaceSprite mood={3} scale={3} characterId={characterId} titleMode />
          </View>
        </View>

        {/* Name */}
        <Text style={styles.charName}>{character.name}</Text>
        {character.title ? (
          <Text style={styles.charTitle}>{character.title}</Text>
        ) : null}
        {character.fullName !== character.name ? (
          <Text style={styles.charFullName}>{character.fullName}</Text>
        ) : null}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItemNarrow}>
            <Text style={styles.statLabel}>Avg</Text>
            <Text style={styles.statValue}>{character.avgScore18}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ショット</Text>
            <Text style={styles.statValueShot}>{character.shotShape}</Text>
          </View>
        </View>

        {/* Motto */}
        <View style={styles.mottoCard}>
          <Text style={styles.mottoLabel}>座右の銘</Text>
          <Text style={styles.mottoText}>{character.motto}</Text>
        </View>

        {/* Hint */}
        {character.hint && (
          <Text style={styles.hintText}>{character.hint}</Text>
        )}

        {/* Status */}
        <View style={isContracted ? styles.statusContracted : styles.statusUncontracted}>
          <Text style={isContracted ? styles.statusContractedText : styles.statusUncontractedText}>
            {isContracted ? (character.isAce ? '顧問契約済' : '契約済') : '未契約'}
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ height: 24 }} />

        {/* Round button */}
        <Pressable
          style={({ pressed }) => [
            styles.roundButton,
            pressed && styles.roundButtonPressed,
          ]}
          onPress={handleRoundPress}
        >
          <Text style={styles.roundButtonText}>ラウンドする</Text>
        </Pressable>

        {/* Back button */}
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.6 },
          ]}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>戻る</Text>
        </Pressable>
      </ScrollView>

      {/* ===== Pre-round line modal overlay ===== */}
      {showPreRound && (
        <Pressable style={styles.preRoundOverlay} onPress={startRound}>
          <Animated.View style={[styles.preRoundContent, { opacity: preRoundOpacity }]}>
            <View style={styles.preRoundFaceWrap}>
              <FaceSprite mood={4} scale={2} characterId={characterId} />
            </View>
            <View style={styles.preRoundBubble}>
              <Text style={styles.preRoundText}>
                {'\u300C'}{character.preRoundLine}{'\u300D'}
              </Text>
            </View>
            <Text style={styles.preRoundSkip}>TAPでスキップ</Text>
          </Animated.View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // ===== Header =====
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBack: {
    paddingRight: 12,
  },
  headerBackText: {
    color: COLORS.textCream,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    color: COLORS.textCream,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
  },
  headerRight: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 12,
  },
  // ===== Content =====
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    flexGrow: 1,
  },
  // ===== Avatar =====
  avatarContainer: {
    marginBottom: 16,
  },
  avatarFrame: {
    width: 108,
    height: 108,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,105,20,0.35)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // ===== Name =====
  charName: {
    color: COLORS.textCream,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  charFullName: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  charTitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  // ===== Stats =====
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    // 中央寄せの親の中では内容幅に縮んでしまい、球筋が折り返していたので横幅を伸ばす
    alignSelf: 'stretch',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  // Avg は2桁なので幅を取らせず、余った幅を球筋側に回す
  statItemNarrow: {
    width: 56,
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.textCream,
    fontSize: 15,
    fontWeight: '700',
  },
  // 球筋は最長16字（「パワーフェードという名のスライス」）まであるので少し詰める
  statValueShot: {
    color: COLORS.textCream,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 16,
  },
  // ===== Motto =====
  mottoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  mottoLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 2,
  },
  mottoText: {
    color: COLORS.textCream,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  // ===== Hint =====
  hintText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  // ===== Status =====
  statusContracted: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.3)',
  },
  statusContractedText: {
    color: '#88DD88',
    fontSize: 12,
    fontWeight: '600',
  },
  statusUncontracted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusUncontractedText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontWeight: '600',
  },
  // ===== Buttons =====
  roundButton: {
    backgroundColor: COLORS.woodDark,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderWidth: 1,
    borderColor: COLORS.woodLight,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  roundButtonPressed: {
    opacity: 0.7,
  },
  roundButtonText: {
    color: COLORS.textCream,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  backButton: {
    paddingVertical: 10,
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  // ===== Pre-round overlay =====
  preRoundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  preRoundContent: {
    alignItems: 'center',
  },
  preRoundFaceWrap: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 4,
  },
  preRoundBubble: {
    backgroundColor: '#1e5035',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 28,
    marginBottom: 20,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  preRoundText: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
  preRoundSkip: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
  },
});
