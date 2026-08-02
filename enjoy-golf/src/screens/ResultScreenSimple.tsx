import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EntertainGrade, GameResult, RootStackParamList } from '../types';
import { characters } from '../data/characters';
import {
  calcResult,
  diagnoseCreepCause,
  diagnoseContractMiss,
} from '../logic/engine';
import { calcAceResult, getAceRoundConsults } from '../logic/aceEngine';
import { wasSSAchieved as wasTanakaSSAchieved } from '../logic/tanaka';
import { wasOnizukaSSAchieved } from '../logic/onizuka';
import { useGameStore } from '../store/useGameStore';
import { getStrategy, strategyFit } from '../data/strategies';
import { COLORS } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ResultSimple'>;

/**
 * 途中終了の文面。creep は「引かれた度合い」を1本で表しているが、
 * 引かれ方には種類がある。何をやりすぎたのかを言い分ける。
 */
const CREEP_EXPLOSION_TEXT: Record<ReturnType<typeof diagnoseCreepCause>, string> = {
  cheat: 'ごまかしを見透かされてしまった...',
  tooClose: '距離を詰めすぎて引かれてしまった...',
  tooDistant: '壁を作られたまま終わってしまった...',
};

const GRADE_COLORS: Record<EntertainGrade, string> = {
  SS: COLORS.gradeSS,
  S: COLORS.gradeS,
  A: COLORS.gradeA,
  B: COLORS.gradeB,
  C: COLORS.gradeC,
  D: COLORS.gradeD,
};

export default function ResultScreenSimple({ route, navigation }: Props) {
  const { characterId, finishReason, isAceRound } = route.params;
  const store = useGameStore();
  const character = useMemo(
    () => characters.find((c) => c.id === characterId)!,
    [characterId],
  );

  const lastGameState = store.getLastGameState();

  // 何をやりすぎて引かれたのかで文面を分ける
  const creepExplosionText = useMemo(
    () =>
      CREEP_EXPLOSION_TEXT[
        lastGameState ? diagnoseCreepCause(lastGameState) : 'tooClose'
      ],
    [lastGameState],
  );

  // ACE: 初回 vs 2回目以降の判定
  const wasAlreadyContracted = useRef(
    store.contractedCharacterIds.includes(characterId)
  ).current;
  const isFirstAceRound = isAceRound === true && !wasAlreadyContracted;

  const result: GameResult = useMemo(() => {
    if (isAceRound) return calcAceResult();
    if (!lastGameState) {
      // Fallback: shouldn't happen
      return {
        opponentGross18: character.avgScore18,
        baseline18: character.avgScore18,
        improvement: 0,
        entertainScore: 50,
        grade: 'C' as EntertainGrade,
        contractSuccess: false,
        playType: 'balanced',
        playTypeLabel: '八方美人型',
        playTypeComment: 'どのスタイルもバランスよく使いこなす万能タイプ。',
      };
    }
    const baseResult = calcResult(lastGameState);
    if (characterId === 1 && wasTanakaSSAchieved()) {
      return { ...baseResult, grade: 'SS' as EntertainGrade };
    }
    if (characterId === 2 && wasOnizukaSSAchieved()) {
      return { ...baseResult, grade: 'SS' as EntertainGrade };
    }
    return baseResult;
  }, [isAceRound, lastGameState, character, characterId]);

  // Contract processing + round counter (run once as side effect)
  const [contractResult, setContractResult] = useState<{ newlyUnlocked: number[] } | null>(null);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    if (!isAceRound) {
      store.incrementRoundCounter();
      store.handleRoundComplete(characterId);
    }
    if (result.contractSuccess) {
      const newlyUnlocked = store.addContractForCharacter(characterId);
      setContractResult({ newlyUnlocked });
    }

    // 一緒に回って分かったこと。刺さった手／怒らせた手のタグを溜める。
    // 契約の成否に関わらず、回った経験は残る
    //
    // そのキャラの likesTags / hatesTags と重なったタグだけを残す。
    // 反応ランクは基礎デルタでほぼ決まるので、good になった選択肢のタグを
    // そのまま溜めると「このキャラの好み」ではない一般論まで混ざり、
    // 実測で的中率が2割まで落ちた（10周で24行・うち正しいのは4〜5行）。
    // 交差を取ると的中率100%・10周で5行前後に収まる。
    if (!isAceRound && lastGameState && character) {
      const likesTags = character.likesTags ?? [];
      const hatesTags = character.hatesTags ?? [];
      const liked = lastGameState.holeResults
        .filter((h) => h.rank === 'good' || h.rank === 'neutral')
        .flatMap((h) => h.tags)
        .filter((t) => likesTags.includes(t));
      const hated = lastGameState.holeResults
        .filter((h) => h.rank === 'bad' || h.rank === 'worst')
        .flatMap((h) => h.tags)
        .filter((t) => hatesTags.includes(t));
      store.recordDiscoveries(characterId, liked, hated);
    }
  }, [result.contractSuccess, characterId, isAceRound]);

  /**
   * 今日の分かれ目。
   *
   * 全ビートの反応ランクは `holeResults` に記録済みなので、再計算せずに並べ直せる。
   * 信頼の動いた量で並べて、上から数件だけ見せる。全部出すと読まれない。
   */
  const turningPoints = useMemo(() => {
    if (isAceRound || !lastGameState) return { hits: [], misses: [] };
    const withText = lastGameState.holeResults.filter((h) => !!h.choiceText);

    const hits = withText
      .filter((h) => h.rank === 'good')
      .sort((a, b) => b.trustDelta - a.trustDelta)
      .slice(0, 3);
    const misses = withText
      .filter((h) => h.rank === 'worst' || h.rank === 'bad')
      .sort((a, b) => a.trustDelta - b.trustDelta)
      .slice(0, 3);
    return { hits, misses };
  }, [isAceRound, lastGameState, characterId]);

  /**
   * 今日の作戦の答え合わせ。
   *
   * 賭けたまま結果が返らないと、次に活かすものが残らない。
   * 当たり／裏目そのものを言い切るのは、ここが唯一の答え合わせの場だから。
   * 「沿って打った回数」も出す。宣言だけして路線を捨てたラウンドは
   * 効果がほぼ乗っていないので、それが分かるようにする。
   */
  const strategyReview = useMemo(() => {
    if (isAceRound || !lastGameState?.strategy) return null;
    const s = getStrategy(lastGameState.strategy);
    if (!s) return null;
    const fit = strategyFit(s.id, characterId);
    const count = lastGameState.onStrategyCount;
    const name = character?.name.split('・').pop() ?? '相手';
    // 「効いた」と書くと、惨敗したラウンドでも成果があったように読める。
    // ここで言えるのは作戦と相手の相性であって、その日の結果ではない。
    const verdict =
      fit === 'fit'
        ? `${name}さんとは相性がよかった`
        : fit === 'miss'
          ? `${name}さんには裏目だった`
          : `${name}さんには響きも障りもしなかった`;
    return { label: s.label, verdict, count, fit };
  }, [isAceRound, lastGameState, characterId, character]);

  /** 契約に届かなかった理由（成立時・相談ラウンドは null） */
  const contractMiss = useMemo(() => {
    if (isAceRound || !lastGameState || result.contractSuccess) return null;
    return diagnoseContractMiss(lastGameState);
  }, [isAceRound, lastGameState, result.contractSuccess]);

  // 相談ラウンドで受けた助言（通常ラウンドでは空）
  const aceConsults = useMemo(
    () => (isAceRound && lastGameState ? getAceRoundConsults(lastGameState) : []),
    [isAceRound, lastGameState],
  );

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (contractResult) {
      // Navigate to Intro screen for contract reveal
      navigation.replace('Intro', {
        contractedCharId: characterId,
        newlyUnlockedIds: contractResult.newlyUnlocked,
        isAceContract: isAceRound ?? false,
        isRepeatAce: isAceRound === true && wasAlreadyContracted,
        lunchMood: lastGameState?.lunchMood ?? 'neutral',
      });
    } else {
      navigation.popToTop();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Creep explosion banner */}
        {finishReason === 'creep_explosion' && (
          <View style={styles.explosionBanner}>
            <Text style={styles.explosionText}>{creepExplosionText}</Text>
          </View>
        )}

        {/* Opponent score */}
        <Text style={styles.label}>{character.fullName} さん</Text>
        <Text style={styles.grossScore}>18H: {result.opponentGross18}</Text>

        {/* Baseline reference */}
        <Text style={styles.baselineText}>
          ベースライン: {result.baseline18}
        </Text>

        {/* Improvement / deterioration */}
        {result.improvement > 0 ? (
          <Text style={styles.improvement}>
            あなたの接待で {result.improvement}打 改善しました
          </Text>
        ) : result.improvement < 0 ? (
          <Text style={styles.deterioration}>
            接待の影響で {Math.abs(result.improvement)}打 悪化しました
          </Text>
        ) : null}

        {/* Grade */}
        <Text style={styles.gradeLabel}>接待グレード</Text>
        <Text style={[styles.grade, { color: GRADE_COLORS[result.grade] }]}>
          {result.grade}
        </Text>
        <Text style={styles.scoreDetail}>
          スコア: {result.entertainScore}
        </Text>

        {/* Play type */}
        <View style={styles.playTypeCard}>
          <Text style={styles.playTypeLabel}>{result.playTypeLabel}</Text>
          <Text style={styles.playTypeComment}>{result.playTypeComment}</Text>
        </View>

        {/* 契約に届かなかった理由。何が足りなかったか分からないと次に活かせない */}
        {contractMiss && (
          <View style={styles.missCard}>
            <Text style={styles.missTitle}>
              {contractMiss.kind === 'trust' && contractMiss.short <= 10
                ? 'あと一歩だった'
                : '届かなかった'}
            </Text>
            <Text style={styles.missReason}>
              {contractMiss.kind === 'trust'
                ? `信頼が足りなかった（あと ${contractMiss.short}）`
                : contractMiss.kind === 'creep'
                  ? '距離を詰めすぎて引かれていた'
                  : 'スコアを伸ばしてあげられなかった'}
            </Text>
          </View>
        )}

        {/* 今日の作戦 — 賭けの答え合わせ。分かれ目より先に出す */}
        {strategyReview && (
          <View style={styles.stratCard}>
            <Text style={styles.stratTitle}>今日の作戦</Text>
            <Text style={styles.stratLabel}>{strategyReview.label}</Text>
            <Text
              style={[
                styles.stratVerdict,
                strategyReview.fit === 'fit' && styles.stratVerdictFit,
                strategyReview.fit === 'miss' && styles.stratVerdictMiss,
              ]}
            >
              {strategyReview.verdict}
            </Text>
            <Text style={styles.stratCount}>
              {strategyReview.count === 0
                ? 'この路線では一度も打たなかった'
                : `この路線で打ったのは ${strategyReview.count} 回`}
            </Text>
          </View>
        )}

        {/* 今日の分かれ目 — 選んだ手のどれが刺さって、どれが外したか */}
        {(turningPoints.hits.length > 0 || turningPoints.misses.length > 0) && (
          <View style={styles.turnCard}>
            <Text style={styles.turnTitle}>今日の分かれ目</Text>
            {turningPoints.hits.length > 0 && (
              <>
                <Text style={styles.turnHeadHit}>刺さった</Text>
                {turningPoints.hits.map((h, i) => (
                  <Text key={`hit${i}`} style={styles.turnLine}>
                    {h.choiceText}
                  </Text>
                ))}
              </>
            )}
            {turningPoints.misses.length > 0 && (
              <>
                <Text style={styles.turnHeadMiss}>外した</Text>
                {turningPoints.misses.map((h, i) => (
                  <Text key={`miss${i}`} style={styles.turnLine}>
                    {h.choiceText}
                  </Text>
                ))}
              </>
            )}
          </View>
        )}

        {/* 相談ラウンドで受けた助言。holeResults の複合IDと選んだ index から
            復元できるので追加の状態は持たない */}
        {isAceRound && aceConsults.length > 0 && (
          <>
            <View style={styles.aceDivider}>
              <View style={styles.aceDividerLine} />
              <Text style={styles.aceDividerText}>今日いただいた言葉</Text>
              <View style={styles.aceDividerLine} />
            </View>
            {aceConsults.map((c, i) => (
              <View
                key={`${c.id}-${i}`}
                style={[styles.aceConsultCard, c.isQuote && styles.aceConsultCardQuote]}
              >
                <Text style={styles.aceConsultQuestion}>{c.text}</Text>
                <Text
                  style={[styles.aceConsultAnswer, c.isQuote && styles.aceConsultAnswerQuote]}
                >
                  {'\u300C'}{c.answer}{'\u300D'}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* ACE専用メッセージ */}
        {isAceRound && (
          <View style={styles.aceMessageCard}>
            {isFirstAceRound ? (
              <>
                <Text style={styles.aceMessageText}>
                  {'\u300C'}ぜひ顧問契約お願いします{'\u300D'}
                </Text>
                <Text style={styles.aceReplyText}>
                  {'\u300C'}来年も再来年も、末永くよろしく{'\u300D'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.aceMessageText}>
                  {'\u300C'}顧問契約、本当に頼りになります{'\u300D'}
                </Text>
                <Text style={styles.aceReplyText}>
                  {'\u300C'}孫の代まで末永くよろしく{'\u300D'}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Action button */}
        <Pressable
          style={({ pressed }) => [
            result.contractSuccess ? styles.actionButtonSuccess : styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={handleNext}
        >
          <Text style={result.contractSuccess ? styles.actionButtonSuccessText : styles.actionButtonText}>
            {result.contractSuccess ? '次へ' : 'もう一度プレーする'}
          </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    flexGrow: 1,
  },
  explosionBanner: {
    backgroundColor: 'rgba(220, 50, 50, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 24,
  },
  explosionText: {
    color: '#FF8888',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  grossScore: {
    color: COLORS.textCream,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  baselineText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 12,
  },
  improvement: {
    color: '#88DD88',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  deterioration: {
    color: '#FF8888',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  gradeLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 4,
  },
  grade: {
    fontSize: 72,
    fontWeight: '900',
    marginBottom: 4,
  },
  scoreDetail: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 20,
  },
  // ===== Play type =====
  /** 契約に届かなかった理由 */
  missCard: {
    width: '100%',
    backgroundColor: 'rgba(200,120,60,0.14)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220,150,80,0.35)',
    padding: 14,
    marginBottom: 12,
  },
  missTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F0C08A',
    marginBottom: 4,
  },
  missReason: {
    fontSize: 14,
    color: '#e8e8e8',
  },
  /** 今日の分かれ目 — 刺さった手／外した手 */
  turnCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  turnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textCream,
    marginBottom: 10,
  },
  turnHeadHit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8FD48F',
    marginTop: 4,
    marginBottom: 4,
  },
  turnHeadMiss: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E39A9A',
    marginTop: 12,
    marginBottom: 4,
  },
  turnLine: {
    fontSize: 13,
    color: '#dcdcdc',
    lineHeight: 20,
    marginBottom: 2,
  },
  // ===== 今日の作戦の答え合わせ =====
  stratCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  stratTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textCream,
    marginBottom: 8,
  },
  stratLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f5f5f5',
    marginBottom: 4,
  },
  stratVerdict: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dcdcdc',
    marginBottom: 6,
  },
  stratVerdictFit: {
    color: '#8FD48F',
  },
  stratVerdictMiss: {
    color: '#E39A9A',
  },
  stratCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  playTypeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 24,
    width: '100%',
  },
  playTypeLabel: {
    color: COLORS.textCream,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  playTypeComment: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  // ===== 相談ラウンド専用 =====
  aceDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 26,
    marginBottom: 16,
  },
  aceDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,215,0,0.3)',
  },
  aceDividerText: {
    color: '#FFD700',
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '600',
  },
  aceConsultCard: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  // 名言として提示された助言は枠と文字で立てる
  aceConsultCardQuote: {
    backgroundColor: 'rgba(255,215,0,0.07)',
    borderColor: 'rgba(255,215,0,0.35)',
  },
  aceConsultQuestion: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 8,
  },
  aceConsultAnswer: {
    color: COLORS.textCream,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  aceConsultAnswerQuote: {
    color: '#FFD700',
  },
  // ===== ACE message =====
  aceMessageCard: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    marginBottom: 24,
    width: '100%',
  },
  aceMessageText: {
    color: COLORS.textCream,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  aceReplyText: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  // ===== Buttons =====
  actionButton: {
    backgroundColor: COLORS.woodDark,
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.woodLight,
  },
  actionButtonSuccess: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: COLORS.textCream,
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonSuccessText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
