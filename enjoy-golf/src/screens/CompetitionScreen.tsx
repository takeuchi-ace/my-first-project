import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, CharacterSpecificEvent, LunchMood, Gauge, ReactionRank } from '../types';
import { characters } from '../data/characters';
import { competitionMap, competitionEvents } from '../data/competitionData';
import {
  menuItems,
  characterLunchProfiles,
  SeatId,
  TableLayout,
  layoutSeats,
} from '../data/lunchMiniGame';
import { calcLunchResult } from '../logic/lunchMiniGame';
import { evaluateReactionRank, shuffleChoiceList } from '../logic/engine';
import { FaceSprite } from '../faces';
import {
  createCompetitionState,
  applyCompetitionChoice,
  applyCompetitionLunch,
  calcCompetitionResult,
  CompetitionGameState,
} from '../logic/competitionEngine';
import { computeReactionPlan, findBestCompChoiceIndex, updateInsightStreak } from '../lib/insight';
import InsightOverlay from '../components/InsightOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'Competition'>;

type MoodLevel = 1 | 2 | 3 | 4 | 5;

const RANK_MOOD: Record<ReactionRank, MoodLevel> = {
  good: 5,
  neutral: 3,
  bad: 2,
  worst: 1,
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

type CompStep =
  | 'reception'
  | 'pairing'
  | 'greeting'
  | 'event'     // front/back events
  | 'lunch_seat'
  | 'lunch_menu'
  | 'lunch_result'
  | 'awards';

export default function CompetitionScreen({ navigation, route }: Props) {
  const { competitionId } = route.params;
  const comp = useMemo(() => competitionMap.get(competitionId)!, [competitionId]);
  const targetChar = useMemo(
    () => characters.find((c) => c.id === comp.targetCharacterId)!,
    [comp]
  );
  const events = useMemo(() => competitionEvents[competitionId], [competitionId]);

  const [step, setStep] = useState<CompStep>('reception');
  const [gameState, setGameState] = useState<CompetitionGameState>(() =>
    createCompetitionState(competitionId)
  );

  // Lunch mini game state
  const [seatChoice, setSeatChoice] = useState<SeatId | null>(null);
  const [opponentMenu, setOpponentMenu] = useState(0);
  const [lunchResultText, setLunchResultText] = useState('');
  const playerMenuRef = useRef(0);
  const [tableLayout, setTableLayout] = useState<TableLayout | null>(null);
  const [opponentFirst, setOpponentFirst] = useState(false);
  const [opponentSeatId, setOpponentSeatId] = useState<SeatId | null>(null);

  // Reaction state
  const [isReacting, setIsReacting] = useState(false);
  const [reactionSpeechText, setReactionSpeechText] = useState('');
  const [moodOverride, setMoodOverride] = useState<MoodLevel | null>(null);
  const [showWorstVignette, setShowWorstVignette] = useState(false);
  const [selectedChoiceText, setSelectedChoiceText] = useState('');

  // Insight / gesture state
  const [insightStreak, setInsightStreak] = useState(0);
  const [gestureText, setGestureText] = useState<string | null>(null);
  /** 仕草がキャラ別の地の文か。地の文は完結した文なのでアスタリスクで囲まない */
  const [gestureIsNarration, setGestureIsNarration] = useState(false);
  const gestureOpacity = useRef(new Animated.Value(0)).current;
  const [showInsight, setShowInsight] = useState(false);
  const gestureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProceedRef = useRef<(() => void) | null>(null);
  const proceedAfterCompReactionRef = useRef<(newState: CompetitionGameState) => void>(() => {});

  // Animated values
  const faceAnim = useRef(new Animated.Value(1)).current;
  const speechOpacity = useRef(new Animated.Value(0)).current;
  const speechScale = useRef(new Animated.Value(0.98)).current;
  const worstVignetteAnim = useRef(new Animated.Value(0)).current;
  const baseLayerOpacity = useRef(new Animated.Value(1)).current;

  // Timer refs
  const speechFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechCleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (speechFadeTimer.current) clearTimeout(speechFadeTimer.current);
      if (speechCleanupTimer.current) clearTimeout(speechCleanupTimer.current);
      if (gestureTimer.current) clearTimeout(gestureTimer.current);
      if (gestureFadeTimer.current) clearTimeout(gestureFadeTimer.current);
    };
  }, []);

  // Fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [step, fadeAnim]);

  // Current event
  // 監査 D-1: 正解の選択肢が1番目に固定されていたため、イベント切り替え時に並べ替える
  const currentEvent: CharacterSpecificEvent | null = useMemo(() => {
    if (step !== 'event') return null;
    const evt = events[gameState.eventIndex];
    if (!evt) return null;
    return { ...evt, choices: shuffleChoiceList(evt.choices) };
  }, [step, gameState.eventIndex, events]);

  // ===== animateFace =====
  const animateFace = useCallback(() => {
    Animated.sequence([
      Animated.timing(faceAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(faceAnim, {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(faceAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [faceAnim]);

  // ===== Step transitions =====
  const handleReceptionNext = useCallback(() => setStep('pairing'), []);
  const handlePairingNext = useCallback(() => setStep('greeting'), []);
  const handleGreetingNext = useCallback(() => setStep('event'), []);

  const handleEventChoice = useCallback(
    (choiceIndex: number) => {
      if (!currentEvent || isReacting) return;
      const choice = currentEvent.choices[choiceIndex];
      const prevGauge = gameState.gauge;
      const newState = applyCompetitionChoice(gameState, currentEvent, choiceIndex);

      // Calculate delta for reaction rank
      const appliedDelta: Gauge = {
        trust: newState.gauge.trust - prevGauge.trust,
        fun: newState.gauge.fun - prevGauge.fun,
        creep: newState.gauge.creep - prevGauge.creep,
        focus: newState.gauge.focus - prevGauge.focus,
      };
      const rank = evaluateReactionRank(appliedDelta);

      const plan = computeReactionPlan(rank, targetChar.id, choice.speechOverride);
      const text = plan.speechText;
      const bestIdx = findBestCompChoiceIndex(gameState, currentEvent);

      setSelectedChoiceText(choice.text);
      setGameState(newState);
      animateFace();

      // Start reaction
      setIsReacting(true);
      setReactionSpeechText(text);
      setMoodOverride(RANK_MOOD[rank]);

      Animated.timing(baseLayerOpacity, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }).start();

      const isWorst = rank === 'worst';
      if (isWorst) {
        setShowWorstVignette(true);
        worstVignetteAnim.setValue(0);
        Animated.timing(worstVignetteAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }

      speechOpacity.setValue(0);
      speechScale.setValue(0.98);
      Animated.parallel([
        Animated.timing(speechOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(speechScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Gesture fade in after delay
      if (plan.gestureText) {
        gestureTimer.current = setTimeout(() => {
          setGestureText(plan.gestureText);
          setGestureIsNarration(plan.gestureIsNarration);
          gestureOpacity.setValue(0);
          Animated.timing(gestureOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }, plan.gestureDelayMs);
      }

      speechFadeTimer.current = setTimeout(() => {
        Animated.timing(speechOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        if (isWorst) {
          Animated.timing(worstVignetteAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowWorstVignette(false);
          });
        }
        // Gesture fade out 200ms after speech fade starts
        if (plan.gestureText) {
          gestureFadeTimer.current = setTimeout(() => {
            Animated.timing(gestureOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }, 200);
        }
      }, 2000);

      speechCleanupTimer.current = setTimeout(() => {
        const { newStreak, insightFired } = updateInsightStreak(
          insightStreak, plan.isMismatch, choiceIndex, bestIdx
        );
        setInsightStreak(newStreak);
        setGestureText(null);

        const doProc = () => proceedAfterCompReactionRef.current(newState);
        pendingProceedRef.current = doProc;
        if (insightFired) {
          setMoodOverride(prev => prev ? Math.min(5, prev + 1) as MoodLevel : null);
          setShowInsight(true);
        } else {
          doProc();
        }
      }, 2500);
    },
    [currentEvent, gameState, isReacting, targetChar, animateFace, baseLayerOpacity, speechOpacity, speechScale, worstVignetteAnim, gestureOpacity, insightStreak]
  );

  // Lunch helpers
  const ALL_SEATS: SeatId[] = ['A', 'B', 'C', 'D'];

  const initLunchLayout = useCallback(() => {
    const layouts: TableLayout[] = ['square', 'parallel', 'perpendicular'];
    const layout = layouts[Math.floor(Math.random() * layouts.length)];
    setTableLayout(layout);

    const isOpponentFirst = Math.random() < 0.5;
    setOpponentFirst(isOpponentFirst);

    if (isOpponentFirst) {
      const oppSeat = ALL_SEATS[Math.floor(Math.random() * ALL_SEATS.length)];
      setOpponentSeatId(oppSeat);
    } else {
      setOpponentSeatId(null);
    }
  }, []);

  // ===== proceedAfterReaction helper =====
  const proceedAfterCompReaction = useCallback(
    (newState: CompetitionGameState) => {
      setIsReacting(false);
      setReactionSpeechText('');
      setSelectedChoiceText('');
      setMoodOverride(null);

      Animated.timing(baseLayerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      if (newState.eventIndex === 2) {
        const profile = characterLunchProfiles[newState.targetCharacterId];
        if (profile) {
          setOpponentMenu(profile.menuChoice);
        }
        initLunchLayout();
        setStep('lunch_seat');
      } else if (newState.eventIndex >= 4) {
        setStep('awards');
      }
    },
    [baseLayerOpacity, initLunchLayout]
  );
  proceedAfterCompReactionRef.current = proceedAfterCompReaction;

  const handleSeatSelect = useCallback((seatId: SeatId) => {
    setSeatChoice(seatId);
    if (!opponentFirst) {
      const remaining = ALL_SEATS.filter((s) => s !== seatId);
      const oppSeat = remaining[Math.floor(Math.random() * remaining.length)];
      setOpponentSeatId(oppSeat);
    }
    setStep('lunch_menu');
  }, [opponentFirst]);

  const handleMenuSelect = useCallback(
    (menuId: number) => {
      if (!seatChoice || !tableLayout) return;
      playerMenuRef.current = menuId;
      const result = calcLunchResult(tableLayout, seatChoice, opponentSeatId, menuId, gameState.targetCharacterId);
      setLunchResultText(result.resultText);
      setStep('lunch_result');
    },
    [seatChoice, tableLayout, opponentSeatId, gameState.targetCharacterId]
  );

  const handleLunchFinish = useCallback(() => {
    if (!seatChoice || !tableLayout) return;
    const result = calcLunchResult(tableLayout, seatChoice, opponentSeatId, playerMenuRef.current, gameState.targetCharacterId);
    const newState = applyCompetitionLunch(
      gameState,
      result.lunchMood,
      result.bias.afternoonTrustBias,
      result.bias.afternoonFocusBias
    );
    setGameState(newState);
    setTableLayout(null);
    setOpponentSeatId(null);
    setStep('event');
  }, [seatChoice, tableLayout, opponentSeatId, gameState]);

  // Awards → navigate to CompetitionResult
  const handleAwardsNext = useCallback(() => {
    const result = calcCompetitionResult(gameState);
    navigation.replace('CompetitionResult', {
      result,
      competitionId,
    });
  }, [gameState, competitionId, navigation]);

  const opponentMenuItem = menuItems.find((m) => m.id === opponentMenu);
  const opponentMenuName = opponentMenuItem?.name ?? 'メニュー';

  // ===== Seat button renderer =====
  const renderSeatButton = (sid: SeatId) => {
    const isOpponent = opponentSeatId === sid;
    const seatInfo = tableLayout ? layoutSeats[tableLayout].find((s) => s.id === sid) : null;
    const label = seatInfo?.label ?? sid;

    if (isOpponent) {
      return (
        <View style={styles.seatBtnOccupied}>
          <FaceSprite mood={3} scale={1.2} characterId={targetChar.id} />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.seatBtn}
        onPress={() => handleSeatSelect(sid)}
        activeOpacity={0.7}
      >
        <Text style={styles.seatBtnText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // ===== RENDER =====
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.compName}>{comp.name}</Text>
            <Text style={styles.partnerName}>{targetChar.name}</Text>
          </View>

          {/* ===== RECEPTION ===== */}
          {step === 'reception' && (
            <View style={styles.storyBox}>
              <Text style={styles.storyText}>{comp.receptionText}</Text>
              <TouchableOpacity style={styles.nextBtn} onPress={handleReceptionNext}>
                <Text style={styles.nextBtnText}>次へ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===== PAIRING ===== */}
          {step === 'pairing' && (
            <View style={styles.storyBox}>
              <Text style={styles.storyText}>{comp.pairingText}</Text>
              <View style={styles.faceCenter}>
                <FaceSprite mood={3} scale={2.5} characterId={targetChar.id} />
              </View>
              <TouchableOpacity style={styles.nextBtn} onPress={handlePairingNext}>
                <Text style={styles.nextBtnText}>次へ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===== GREETING ===== */}
          {step === 'greeting' && (
            <View style={styles.storyBox}>
              <View style={styles.faceCenter}>
                <FaceSprite mood={3} scale={2.5} characterId={targetChar.id} />
              </View>
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>{comp.greetingText}</Text>
              </View>
              <TouchableOpacity style={styles.nextBtn} onPress={handleGreetingNext}>
                <Text style={styles.nextBtnText}>スタート</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===== EVENT (front/back) ===== */}
          {step === 'event' && currentEvent && (
            <Animated.View style={{ opacity: baseLayerOpacity }}>
              <View style={styles.phaseTag}>
                <Text style={styles.phaseTagText}>
                  {gameState.phase === 'front' ? '前半' : '後半'} {' '}
                  イベント {gameState.phase === 'front' ? gameState.eventIndex + 1 : gameState.eventIndex - 1} / 2
                </Text>
              </View>

              <View style={styles.faceCenter}>
                <FaceSprite mood={moodOverride ?? 3} scale={2.5} characterId={targetChar.id} anim={faceAnim} />
              </View>

              <View style={styles.eventBox}>
                <Text style={styles.eventTitle}>{currentEvent.title}</Text>
                <Text style={styles.eventDesc}>{currentEvent.situation}</Text>
              </View>

              {/* Selected choice text (during reaction) */}
              {isReacting && selectedChoiceText !== '' && (
                <View style={styles.selectedChoiceRow}>
                  <Text
                    style={styles.selectedChoiceText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    あなたの選択：{selectedChoiceText}
                  </Text>
                </View>
              )}

              <View style={styles.choicesBox}>
                {currentEvent.choices.map((choice, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.choiceBtn,
                      isReacting && styles.choiceBtnReacting,
                    ]}
                    onPress={() => handleEventChoice(idx)}
                    disabled={isReacting}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.choiceBtnText,
                      isReacting && styles.choiceBtnTextDisabled,
                    ]}>{choice.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ===== LUNCH: SEAT (3 layouts) ===== */}
          {step === 'lunch_seat' && tableLayout && (
            <View>
              <View style={styles.lunchBadge}>
                <Text style={styles.lunchBadgeText}>昼休憩</Text>
              </View>
              <Text style={styles.lunchTitle}>席を選ぼう</Text>
              <Text style={styles.lunchDesc}>
                {opponentFirst
                  ? `${targetChar.name}さんはすでに座っている`
                  : '先に好きな席を選ぼう'}
              </Text>

              <View style={styles.restaurantLayout}>
                {/* Window label */}
                <View style={styles.windowLabel}>
                  <Text style={styles.windowLabelText}>≡≡≡ 窓 ≡≡≡</Text>
                </View>

                {/* Table layout diagram */}
                {tableLayout === 'square' && (
                  <View style={styles.squareLayout}>
                    {renderSeatButton('A')}
                    <View style={styles.squareMiddleRow}>
                      {renderSeatButton('D')}
                      <View style={styles.squareTable} />
                      {renderSeatButton('B')}
                    </View>
                    {renderSeatButton('C')}
                  </View>
                )}

                {tableLayout === 'parallel' && (
                  <View style={styles.parallelLayoutNew}>
                    <View style={styles.parallelRowNew}>
                      {renderSeatButton('A')}
                      {renderSeatButton('B')}
                    </View>
                    <View style={styles.parallelTableNew} />
                    <View style={styles.parallelRowNew}>
                      {renderSeatButton('C')}
                      {renderSeatButton('D')}
                    </View>
                  </View>
                )}

                {tableLayout === 'perpendicular' && (
                  <View style={styles.perpLayout}>
                    <View style={styles.perpRow}>
                      {renderSeatButton('A')}
                      <View style={styles.perpTable} />
                      {renderSeatButton('B')}
                    </View>
                    <View style={styles.perpRow}>
                      {renderSeatButton('C')}
                      <View style={{ width: 60 }} />
                      {renderSeatButton('D')}
                    </View>
                  </View>
                )}

                {/* Entrance label */}
                <View style={styles.entranceLabel}>
                  <Text style={styles.entranceLabelText}>≡≡≡ 入口 ≡≡≡</Text>
                </View>
              </View>
            </View>
          )}

          {/* ===== LUNCH: MENU ===== */}
          {step === 'lunch_menu' && (
            <View>
              <View style={styles.lunchBadge}>
                <Text style={styles.lunchBadgeText}>昼休憩</Text>
              </View>
              <Text style={styles.lunchTitle}>メニューを選ぼう</Text>
              <View style={styles.opponentBubble}>
                <Text style={styles.opponentBubbleText}>
                  {targetChar.name}さんは「{opponentMenuName}」を注文した
                </Text>
              </View>
              <View style={styles.menuGrid}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuCard}
                    onPress={() => handleMenuSelect(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.menuName}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ===== LUNCH: RESULT ===== */}
          {step === 'lunch_result' && (
            <View style={styles.storyBox}>
              <View style={styles.faceCenter}>
                <FaceSprite mood={4} scale={2.5} characterId={targetChar.id} />
              </View>
              <View style={styles.resultTextBox}>
                <Text style={styles.resultText}>{lunchResultText}</Text>
              </View>
              <TouchableOpacity style={styles.nextBtn} onPress={handleLunchFinish}>
                <Text style={styles.nextBtnText}>後半へ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===== AWARDS ===== */}
          {step === 'awards' && (
            <View style={styles.storyBox}>
              <Text style={styles.awardsTitle}>表彰式</Text>
              <View style={styles.faceCenter}>
                <FaceSprite mood={4} scale={2.5} characterId={targetChar.id} />
              </View>
              <Text style={styles.storyText}>
                コンペが終了した。{'\n'}結果を確認しよう。
              </Text>
              <TouchableOpacity style={styles.nextBtn} onPress={handleAwardsNext}>
                <Text style={styles.nextBtnText}>結果を見る</Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* Speech bubble overlay (during reaction) */}
      {isReacting && (
        <View style={styles.reactionOverlayContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.reactionSpeechBubble,
              {
                opacity: speechOpacity,
                transform: [{ scale: speechScale }],
              },
            ]}
          >
            <Text style={styles.reactionSpeechText}>{`「${reactionSpeechText}」`}</Text>
          </Animated.View>
        </View>
      )}

      {/* Gesture text overlay */}
      {isReacting && gestureText && (
        <View style={styles.gestureOverlayContainer} pointerEvents="none">
          <Animated.View style={[styles.gestureContainer, { opacity: gestureOpacity }]}>
            <Text style={styles.gestureTextStyle}>
              {gestureIsNarration ? gestureText : `*${gestureText}*`}
            </Text>
          </Animated.View>
        </View>
      )}

      {/* Insight overlay */}
      <InsightOverlay isActive={showInsight} onDone={() => {
        setShowInsight(false);
        pendingProceedRef.current?.();
        pendingProceedRef.current = null;
      }} />

      {/* Worst vignette */}
      {showWorstVignette && (
        <Animated.View
          style={[styles.worstVignette, { opacity: worstVignetteAnim }]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a3a2a' },
  content: { padding: 16, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  compName: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  partnerName: { fontSize: 14, color: '#a8d5a2' },

  // Story box
  storyBox: { alignItems: 'center' },
  storyText: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },

  // Face
  faceCenter: { alignItems: 'center', marginVertical: 16 },

  // Speech bubble
  speechBubble: {
    backgroundColor: '#2d6a3f',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  speechText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Next button
  nextBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  nextBtnText: { fontSize: 16, fontWeight: 'bold', color: '#1a3a2a' },

  // Phase tag
  phaseTag: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  phaseTagText: { fontSize: 12, fontWeight: 'bold', color: '#FFD700' },

  // Event
  eventBox: {
    backgroundColor: '#2d6a3f',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  eventTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  eventDesc: { fontSize: 14, color: '#e0e0e0', lineHeight: 22 },

  // Selected choice
  selectedChoiceRow: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectedChoiceText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },

  // Choices
  choicesBox: { gap: 8 },
  choiceBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  choiceBtnReacting: { opacity: 0.8 },
  choiceBtnText: { fontSize: 15, color: '#1a3a2a', fontWeight: '600' },
  choiceBtnTextDisabled: { color: '#999' },

  // Reaction overlay
  reactionOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  reactionSpeechBubble: {
    backgroundColor: 'rgba(30,80,50,0.95)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginHorizontal: 32,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    maxWidth: '85%',
  },
  reactionSpeechText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Gesture overlay
  gestureOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 120,
    zIndex: 51,
  },
  gestureContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  gestureTextStyle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Worst vignette
  worstVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 48,
  },

  // Lunch
  lunchBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,183,77,0.25)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFB74D',
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 12,
  },
  lunchBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#FFB74D' },
  lunchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFB74D',
    textAlign: 'center',
    marginBottom: 8,
  },
  lunchDesc: {
    fontSize: 14,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Restaurant layout
  restaurantLayout: { alignItems: 'center', gap: 12, width: '100%' },
  windowLabel: {
    backgroundColor: 'rgba(135,206,250,0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(135,206,250,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  windowLabelText: {
    fontSize: 13,
    color: '#87CEFA',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  entranceLabel: {
    backgroundColor: 'rgba(255,183,77,0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,183,77,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  entranceLabelText: {
    fontSize: 13,
    color: '#FFB74D',
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  // Seat buttons
  seatBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  seatBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2d2418',
  },
  seatBtnOccupied: {
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    backgroundColor: 'rgba(255,183,77,0.15)',
    borderWidth: 1,
    borderColor: '#FFB74D',
  },

  // Square layout
  squareLayout: {
    alignItems: 'center',
    gap: 8,
  },
  squareMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  squareTable: {
    width: 60,
    height: 60,
    backgroundColor: '#3d3020',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },

  // Parallel layout
  parallelLayoutNew: {
    alignItems: 'center',
    gap: 8,
  },
  parallelRowNew: {
    flexDirection: 'row',
    gap: 12,
  },
  parallelTableNew: {
    width: 160,
    height: 30,
    backgroundColor: '#3d3020',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },

  // Perpendicular layout
  perpLayout: {
    alignItems: 'center',
    gap: 8,
  },
  perpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perpTable: {
    width: 60,
    height: 60,
    backgroundColor: '#3d3020',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },

  // Menu
  opponentBubble: {
    backgroundColor: 'rgba(255,183,77,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
    padding: 12,
    marginBottom: 16,
  },
  opponentBubbleText: { fontSize: 14, color: '#FFB74D', textAlign: 'center' },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  menuCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    width: '46%',
  },
  menuName: { fontSize: 15, fontWeight: 'bold', color: '#2d2418' },

  // Result text
  resultTextBox: {
    backgroundColor: '#3d3020',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB74D',
    padding: 20,
    marginBottom: 20,
    width: '100%',
  },
  resultText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Awards
  awardsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
});
