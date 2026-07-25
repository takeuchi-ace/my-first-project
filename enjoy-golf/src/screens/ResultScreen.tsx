import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, CharacterId } from '../types';
import { characters } from '../data/characters';
import {
  addContract,
  isContracted,
  refillAceBalls,
  incrementAceRoundsCompleted,
  getAceRoundsCompleted,
  incrementRoundCounter,
} from '../data/globalState';
import { FaceSprite } from '../faces';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

const getImprovementMessage = (improvement: number): string => {
  if (improvement > 0) {
    return `あなたの接待の姿勢により、相手スコアが ${Math.abs(improvement)}打 良くなりました`;
  }
  if (improvement < 0) {
    return `あなたの接待の姿勢により、相手スコアが ${Math.abs(improvement)}打 悪くなりました`;
  }
  return 'あなたの接待の姿勢によるスコア変化はありませんでした';
};

const getImprovementColor = (improvement: number): string => {
  if (improvement > 0) return '#4CAF50';
  if (improvement < 0) return '#f44336';
  return '#fff';
};

const GRADE_COLORS: Record<string, string> = {
  S: '#FFD700',
  A: '#4CAF50',
  B: '#2196F3',
  C: '#FF9800',
  D: '#f44336',
};

export default function ResultScreen({ navigation, route }: Props) {
  const { result, characterId, finishReason, lunchMood } = route.params;
  const character = characters.find((c) => c.id === characterId);
  const processed = useRef(false);
  const isAceRound = result.isAceRound === true;

  // 契約判定
  const wasAlreadyContracted = useRef(isContracted(characterId)).current;
  const isNewContract = result.contractSuccess && !wasAlreadyContracted;
  const isAceContract = isNewContract && (character?.isAce ?? false);

  const [newlyUnlockedIds, setNewlyUnlockedIds] = useState<CharacterId[]>([]);
  const [aceRounds, setAceRounds] = useState(0);

  // ===== Ace フェードアニメーション =====
  const fadeScore = useRef(new Animated.Value(0)).current;
  const fadeDialogue = useRef(new Animated.Value(0)).current;
  const fadeContract = useRef(new Animated.Value(0)).current;
  const fadeButton = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    // 通常ラウンド完了 → コンペカウンター進める
    if (!isAceRound) {
      incrementRoundCounter();
    }

    if (isNewContract) {
      const unlocked = addContract(characterId);
      const directUnlocks = unlocked.filter((uid) => {
        const c = characters.find((ch) => ch.id === uid);
        return (
          c?.unlockBy.type === 'contractWith' &&
          c.unlockBy.id === characterId
        );
      });
      setNewlyUnlockedIds(directUnlocks);
    }

    // エースラウンド: ボール補充 + ラウンド回数インクリメント
    if (isAceRound) {
      incrementAceRoundsCompleted();
      refillAceBalls();
      setAceRounds(getAceRoundsCompleted());
    }
  }, [isNewContract, characterId, isAceRound]);

  // Ace: 段階的フェードイン
  useEffect(() => {
    if (!isAceRound) return;
    Animated.sequence([
      Animated.timing(fadeScore, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeDialogue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeContract, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeButton, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isAceRound, fadeScore, fadeDialogue, fadeContract, fadeButton]);

  // ===== Navigation =====
  const handleNext = () => {
    if (isAceContract || newlyUnlockedIds.length > 0) {
      navigation.replace('Intro', {
        contractedCharId: characterId,
        newlyUnlockedIds,
        isAceContract,
        lunchMood,
      });
    } else {
      navigation.popToTop();
    }
  };

  const handleRetry = () => {
    navigation.popToTop();
  };

  // ========================================
  // Ace Round Result
  // ========================================
  if (isAceRound) {
    return (
      <View style={aceStyles.container}>
        {/* スコア＆評価 */}
        <Animated.View style={[aceStyles.scoreSection, { opacity: fadeScore }]}>
          <Text style={aceStyles.title}>RESULT</Text>

          <View style={aceStyles.faceWrap}>
            <FaceSprite mood={5} scale={2.5} />
          </View>

          <View style={aceStyles.gradeBox}>
            <Text style={aceStyles.gradeLabel}>評価</Text>
            <Text style={aceStyles.gradeValue}>S</Text>
          </View>

          <View style={aceStyles.scoreRow}>
            <Text style={aceStyles.scoreLabel}>相手グロススコア</Text>
            <Text style={aceStyles.scoreValue}>{result.opponentGross18}</Text>
          </View>
        </Animated.View>

        {/* 対話演出 */}
        <Animated.View
          style={[aceStyles.dialogueSection, { opacity: fadeDialogue }]}
        >
          <View style={aceStyles.speechBubble}>
            <Text style={aceStyles.speakerLabel}>あなた</Text>
            <Text style={aceStyles.speechText}>
              {aceRounds >= 2
                ? '顧問契約、本当に頼りになります。'
                : 'ぜひ顧問契約、お願いします。'}
            </Text>
          </View>

          <View style={[aceStyles.speechBubble, aceStyles.aceBubble]}>
            <Text style={aceStyles.speakerLabel}>
              {character?.name ?? 'エース'}
            </Text>
            <Text style={aceStyles.speechText}>
              {aceRounds >= 2
                ? `孫の代まで、${'\n'}末永くよろしくお願いします。`
                : `来年も、再来年も、${'\n'}末永くよろしくお願いします。`}
            </Text>
          </View>
        </Animated.View>

        {/* 顧問契約成立 */}
        <Animated.View
          style={[aceStyles.contractSection, { opacity: fadeContract }]}
        >
          <View style={aceStyles.contractLine} />
          <Text style={aceStyles.contractText}>顧問契約成立</Text>
          <View style={aceStyles.contractLine} />
        </Animated.View>

        {/* エースボール獲得表示 */}
        <Animated.View style={{ opacity: fadeContract }}>
          <Text style={aceStyles.aceBallRewardText}>エースボール ×2 獲得</Text>
        </Animated.View>

        {/* ボタン */}
        <Animated.View style={[aceStyles.buttonWrap, { opacity: fadeButton }]}>
          <TouchableOpacity
            style={aceStyles.nextButton}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={aceStyles.nextText}>次へ</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ========================================
  // Normal Result
  // ========================================
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RESULT</Text>

      {/* Creep explosion */}
      {finishReason === 'creep_explosion' && (
        <View style={styles.explosionBox}>
          <Text style={styles.explosionText}>
            {character?.name ?? '相手'}に完全に見透かされた…{'\n'}
            「もう結構です。お引き取りを。」
          </Text>
        </View>
      )}

      {/* Grade */}
      <View style={styles.gradeBox}>
        <Text style={styles.gradeLabel}>接待グレード</Text>
        <Text
          style={[
            styles.gradeValue,
            { color: GRADE_COLORS[result.grade] ?? '#fff' },
          ]}
        >
          {result.grade}
        </Text>
        <Text style={styles.gradeScore}>{result.entertainScore} pt</Text>
      </View>

      {/* Scores */}
      <View style={styles.scoreBox}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>相手グロス（18H）</Text>
          <Text style={styles.scoreValue}>{result.opponentGross18}</Text>
        </View>

        <View style={styles.improvementBox}>
          <Text
            style={[
              styles.improvementText,
              { color: getImprovementColor(result.improvement) },
            ]}
          >
            {getImprovementMessage(result.improvement)}
          </Text>
        </View>

        <Text style={styles.baselineNote}>
          接待ゼロ想定: {result.baseline18}（18H）
        </Text>
      </View>

      {/* Play Type Diagnosis */}
      <View style={styles.playTypeBox}>
        <Text style={styles.playTypeHeader}>あなたのプレイタイプ</Text>
        <Text style={styles.playTypeLabel}>{result.playTypeLabel}</Text>
        <Text style={styles.playTypeComment}>{result.playTypeComment}</Text>
      </View>

      {/* Buttons */}
      {isNewContract ? (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.7}
        >
          <Text style={styles.nextText}>次へ</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryText}>もう一度プレーする</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ========================================
// Ace Result Styles
// ========================================
const aceStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  // Score section
  scoreSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c9b458',
    letterSpacing: 4,
    marginBottom: 16,
  },
  faceWrap: {
    marginBottom: 12,
  },
  gradeBox: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gradeLabel: {
    fontSize: 12,
    color: '#8a8a9a',
    marginBottom: 2,
  },
  gradeValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#8a8a9a',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e0e0e0',
  },

  // Dialogue section
  dialogueSection: {
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  speechBubble: {
    backgroundColor: '#2a2a40',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#5a7a9a',
  },
  aceBubble: {
    borderLeftColor: '#c9b458',
  },
  speakerLabel: {
    fontSize: 11,
    color: '#8a8a9a',
    marginBottom: 4,
  },
  speechText: {
    fontSize: 16,
    color: '#e0e0e0',
    lineHeight: 24,
  },

  // Contract section
  contractSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
  },
  contractLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#c9b458',
    opacity: 0.4,
  },
  contractText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#c9b458',
    letterSpacing: 2,
  },
  aceBallRewardText: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },

  // Button
  buttonWrap: {
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#c9b458',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  nextText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
});

// ========================================
// Normal Result Styles
// ========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a472a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 16 },

  explosionBox: {
    backgroundColor: '#c0392b',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  explosionText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Grade
  gradeBox: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    backgroundColor: '#234f34',
    borderRadius: 10,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  gradeLabel: {
    fontSize: 12,
    color: '#a8d5a2',
    marginBottom: 4,
  },
  gradeValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  gradeScore: {
    fontSize: 14,
    color: '#a8d5a2',
    marginTop: 4,
  },

  // Score
  scoreBox: {
    backgroundColor: '#2d6a3f',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreLabel: { fontSize: 18, color: '#a8d5a2' },
  scoreValue: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  improvementBox: {
    backgroundColor: '#1a472a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  improvementText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  baselineNote: {
    fontSize: 11,
    color: '#7aab76',
    textAlign: 'right',
    marginTop: 4,
  },

  // Play type
  playTypeBox: {
    backgroundColor: '#234f34',
    borderRadius: 10,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  playTypeHeader: {
    fontSize: 12,
    color: '#a8d5a2',
    marginBottom: 6,
  },
  playTypeLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  playTypeComment: {
    fontSize: 13,
    color: '#c8e6c4',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Buttons
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  nextText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  retryButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  retryText: { fontSize: 18, fontWeight: 'bold', color: '#1a472a' },
});
