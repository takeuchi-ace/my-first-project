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
import { RootStackParamList, GameState, GameEvent, Choice, Gauge, ReactionRank } from '../types';
import { characters } from '../data/characters';
import { getAceBalls, useAceBall } from '../data/globalState';
import { FaceSprite } from '../faces';
import {
  createInitialState,
  selectEvent,
  applyChoice,
  isChoiceAllowed,
  calcResult,
  evaluateReactionRank,
} from '../logic/engine';
import {
  createAceInitialState,
  selectAceEvent,
  applyAceChoice,
  calcAceResult,
  getSelectedAceConsult,
} from '../logic/aceEngine';
import {
  menuItems,
  characterLunchProfiles,
  SeatId,
  TableLayout,
  layoutSeats,
} from '../data/lunchMiniGame';
import { calcLunchResult, applyLunchBiasOnly } from '../logic/lunchMiniGame';
import { computeReactionPlan, findBestChoiceIndex, updateInsightStreak } from '../lib/insight';
import { speechLineTemplates } from '../data/speechLineTemplates';
import InsightOverlay from '../components/InsightOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

// ===== Mood Score =====
type MoodLevel = 1 | 2 | 3 | 4 | 5;

const calcMoodScore = (gauge: Gauge): number =>
  gauge.trust * 0.4 + gauge.fun * 0.3 + (100 - gauge.creep) * 0.3;

const getMoodLevel = (gauge: Gauge): MoodLevel => {
  if (gauge.creep >= 90) return 1;
  const score = calcMoodScore(gauge);
  if (score >= 70) return 5;
  if (score >= 55) return 4;
  if (score >= 40) return 3;
  if (score >= 25) return 2;
  return 1;
};

// ===== ReactionRank → MoodLevel =====
const RANK_MOOD: Record<ReactionRank, MoodLevel> = {
  good: 5,
  neutral: 3,
  bad: 2,
  worst: 1,
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const ACE_POPUP_LINES = [
  'それ、本音ですか？',
  '無理してますね。',
  'もう一度選べますよ。',
  '焦らなくて大丈夫ですよ。',
];

// ===== Main Screen =====
export default function GameScreen({ navigation, route }: Props) {
  const { characterId } = route.params;
  const character = useMemo(
    () => characters.find((c) => c.id === characterId)!,
    [characterId]
  );

  // ── エースラウンド判定（不変） ──
  const isAceRound = character.isAce;

  const [state, setState] = useState<GameState>(() =>
    isAceRound
      ? createAceInitialState(characterId)
      : createInitialState(characterId)
  );
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(() =>
    isAceRound
      ? selectAceEvent(createAceInitialState(characterId))
      : selectEvent(createInitialState(characterId))
  );
  const [reaction, setReaction] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);

  // ACE Ball state（エースラウンドでは使用しない）
  const [previousState, setPreviousState] = useState<GameState | null>(null);
  const [aceAvailable, setAceAvailable] = useState(false);
  const [showAceOverlay, setShowAceOverlay] = useState(false);

  // ACE popup modal state
  const [showAcePopup, setShowAcePopup] = useState(false);
  const acePopupAnim = useRef(new Animated.Value(0)).current;
  const aceBallCount = useRef(0); // track for header display

  // Lunch mini game state
  const [lunchStep, setLunchStep] = useState<'seat' | 'menu' | 'result' | null>(null);
  const [seatChoice, setSeatChoice] = useState<SeatId | null>(null);
  const [opponentMenu, setOpponentMenu] = useState<number>(0);
  const [lunchResultText, setLunchResultText] = useState('');
  const [tableLayout, setTableLayout] = useState<TableLayout | null>(null);
  const [opponentFirst, setOpponentFirst] = useState(false);
  const [opponentSeatId, setOpponentSeatId] = useState<SeatId | null>(null);

  // Reaction state
  const [isReacting, setIsReacting] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [moodOverride, setMoodOverride] = useState<MoodLevel | null>(null);
  const [showWorstVignette, setShowWorstVignette] = useState(false);
  const [selectedChoiceText, setSelectedChoiceText] = useState('');

  // Insight / gesture state
  const [insightStreak, setInsightStreak] = useState(0);
  const [gestureText, setGestureText] = useState<string | null>(null);
  const gestureOpacity = useRef(new Animated.Value(0)).current;
  const [showInsight, setShowInsight] = useState(false);
  const gestureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProceedRef = useRef<(() => void) | null>(null);
  const proceedAfterReactionRef = useRef<(text: string, canUseAce: boolean, newState: GameState) => void>(() => {});

  // Animated values
  const faceAnim = useRef(new Animated.Value(1)).current;
  const aceOverlayAnim = useRef(new Animated.Value(0)).current;
  const speechOpacity = useRef(new Animated.Value(0)).current;
  const speechScale = useRef(new Animated.Value(0.98)).current;
  const worstVignetteAnim = useRef(new Animated.Value(0)).current;
  const baseLayerOpacity = useRef(new Animated.Value(1)).current;

  // Back transition flash
  const backTransitionShown = useRef(false);
  const backFlashAnim = useRef(new Animated.Value(0)).current;
  const [showBackFlash, setShowBackFlash] = useState(false);

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

  // ===== ACE Ball animation（通常ラウンドのみ） =====
  const playAceAnimation = useCallback(() => {
    setShowAceOverlay(true);
    aceOverlayAnim.setValue(1);
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(aceOverlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAceOverlay(false);
    });
  }, [aceOverlayAnim]);

  // ===== Back transition flash =====
  useEffect(() => {
    if (state.phase === 'back' && !backTransitionShown.current) {
      backTransitionShown.current = true;
      setShowBackFlash(true);
      backFlashAnim.setValue(1);
      Animated.timing(backFlashAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setShowBackFlash(false);
      });
    }
  }, [state.phase, backFlashAnim]);

  // ===== ACE Popup handlers =====
  const openAcePopup = useCallback(() => {
    setShowAcePopup(true);
    acePopupAnim.setValue(0);
    Animated.timing(acePopupAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [acePopupAnim]);

  const closeAcePopup = useCallback(() => {
    Animated.timing(acePopupAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setShowAcePopup(false));
  }, [acePopupAnim]);

  // 「やり直す」
  const handleAceRetry = useCallback(() => {
    if (!previousState) return;
    useAceBall();
    aceBallCount.current = getAceBalls();

    closeAcePopup();

    setTimeout(() => {
      setState(previousState);
      setAceAvailable(false);
      setPreviousState(null);
      setReaction(null);
      setSelectedChoice(null);
    }, 200);
  }, [previousState, closeAcePopup]);

  // 「このまま進む」
  const handleAceContinue = useCallback(() => {
    closeAcePopup();
    // normal flow continues — reaction is already set
  }, [closeAcePopup]);

  // ===== Handle Choice =====
  const handleChoice = useCallback(
    (choiceIndex: number) => {
      if (!currentEvent || isReacting || reaction) return;
      const choice = currentEvent.choices[choiceIndex];

      if (isAceRound) {
        // ── エースラウンド ──
        const newState = applyAceChoice(state, currentEvent, choiceIndex);

        // 表情: isQuote consult or 最終ホール → 5, それ以外 → 4
        const consult = getSelectedAceConsult(choiceIndex);
        const isBest = consult?.isQuote === true || state.currentHole === 5;
        const aceMood: MoodLevel = isBest ? 5 : 4;

        // セリフ（常にgood）— speechLines.default → templates → fallback
        const aceSpeechEntry = character.speechLines?.good;
        const aceLines =
          (aceSpeechEntry?.default?.length ? aceSpeechEntry.default : null) ??
          speechLineTemplates[character.speechStyleId]?.good ??
          character.reactionLines.good;
        const text = pick(aceLines);

        setSelectedChoice(choice);
        setSelectedChoiceText(choice.text);
        setState(newState);
        animateFace();

        // Reaction開始
        setIsReacting(true);
        setSpeechText(text);
        setMoodOverride(aceMood);

        Animated.timing(baseLayerOpacity, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }).start();

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

        speechFadeTimer.current = setTimeout(() => {
          Animated.timing(speechOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }, 2000);

        speechCleanupTimer.current = setTimeout(() => {
          setIsReacting(false);
          setSpeechText('');
          setSelectedChoiceText('');
          setMoodOverride(null);

          Animated.timing(baseLayerOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();

          if (newState.finished) {
            setReaction(text);
          } else {
            const nextEvt = selectAceEvent(newState);
            setCurrentEvent(nextEvt);
            setReaction(null);
            setSelectedChoice(null);
          }
        }, 2300);
      } else {
        // ── 通常ラウンド ──
        if (!isChoiceAllowed(state, choice)) return;

        setPreviousState(state);

        const newState = applyChoice(state, currentEvent, choiceIndex);

        const appliedDelta: Gauge = {
          trust: newState.gauge.trust - state.gauge.trust,
          fun: newState.gauge.fun - state.gauge.fun,
          creep: newState.gauge.creep - state.gauge.creep,
          focus: newState.gauge.focus - state.gauge.focus,
        };
        const rank = evaluateReactionRank(appliedDelta);

        const plan = computeReactionPlan(rank, characterId, choice.speechOverride);
        const text = plan.speechText;
        const bestIdx = findBestChoiceIndex(state, currentEvent);

        setSelectedChoice(choice);
        setSelectedChoiceText(choice.text);
        setState(newState);
        animateFace();

        const canUseAce =
          (rank === 'bad' || rank === 'worst') && getAceBalls() > 0;
        setAceAvailable(canUseAce);

        setIsReacting(true);
        setSpeechText(text);
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

          const doProc = () => proceedAfterReactionRef.current(text, canUseAce, newState);
          pendingProceedRef.current = doProc;
          if (insightFired) {
            setMoodOverride(prev => prev ? Math.min(5, prev + 1) as MoodLevel : null);
            setShowInsight(true);
          } else {
            doProc();
          }
        }, 2500);
      }
    },
    [
      currentEvent,
      state,
      isReacting,
      reaction,
      character,
      characterId,
      isAceRound,
      animateFace,
      baseLayerOpacity,
      speechOpacity,
      speechScale,
      worstVignetteAnim,
      openAcePopup,
      gestureOpacity,
      insightStreak,
    ]
  );

  // ===== Handle Next =====
  const handleNext = useCallback(() => {
    if (state.finished) {
      if (isAceRound) {
        const result = calcAceResult();
        navigation.replace('Result', {
          result,
          characterId,
          finishReason: 'complete',
          lunchMood: 'good',
          isAceRound: true,
        });
      } else {
        const result = calcResult(state);
        navigation.replace('Result', {
          result,
          characterId,
          finishReason: state.finishReason!,
          lunchMood: state.lunchMood,
        });
      }
      return;
    }

    // Lunch mini game trigger: hole 5, lunch phase, normal round
    if (state.currentHole === 5 && state.phase === 'lunch' && !isAceRound) {
      const profile = characterLunchProfiles[state.characterId];
      if (profile) {
        setOpponentMenu(profile.menuChoice);
      }
      initLunchLayout();
      setLunchStep('seat');
      setReaction(null);
      setSelectedChoice(null);
      return;
    }

    const nextEvent = isAceRound ? selectAceEvent(state) : selectEvent(state);
    setCurrentEvent(nextEvent);
    setReaction(null);
    setSelectedChoice(null);
    setAceAvailable(false);
    setPreviousState(null);
  }, [state, navigation, characterId, isAceRound]);

  // ── Mood ──
  // エースラウンド: 常に 4 (good)。moodOverride で best(5) に上書き可。
  const mood: MoodLevel = isAceRound ? 4 : getMoodLevel(state.gauge);
  const displayMood = moodOverride ?? mood;
  const isLunch = state.phase === 'lunch';

  // ===== Lunch Mini Game Handlers =====
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
  const proceedAfterReaction = useCallback(
    (text: string, canUseAce: boolean, newState: GameState) => {
      setIsReacting(false);
      setSpeechText('');
      setSelectedChoiceText('');
      setMoodOverride(null);

      Animated.timing(baseLayerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      if (canUseAce) {
        setReaction(text);
        setTimeout(() => {
          aceBallCount.current = getAceBalls();
          openAcePopup();
        }, 150);
      } else if (newState.finished) {
        setReaction(text);
      } else if (
        newState.currentHole === 5 &&
        newState.phase === 'lunch' &&
        !isAceRound
      ) {
        const profile = characterLunchProfiles[newState.characterId];
        if (profile) {
          setOpponentMenu(profile.menuChoice);
        }
        initLunchLayout();
        setLunchStep('seat');
        setReaction(null);
        setSelectedChoice(null);
      } else {
        const nextEvt = selectEvent(newState);
        setCurrentEvent(nextEvt);
        setReaction(null);
        setSelectedChoice(null);
        setAceAvailable(false);
        setPreviousState(null);
      }
    },
    [baseLayerOpacity, isAceRound, openAcePopup, initLunchLayout]
  );
  proceedAfterReactionRef.current = proceedAfterReaction;

  const handleSeatSelect = useCallback((seatId: SeatId) => {
    setSeatChoice(seatId);
    if (!opponentFirst) {
      // プレイヤーが先 → 残り3席からランダムで相手を配置
      const remaining = ALL_SEATS.filter((s) => s !== seatId);
      const oppSeat = remaining[Math.floor(Math.random() * remaining.length)];
      setOpponentSeatId(oppSeat);
    }
    setLunchStep('menu');
  }, [opponentFirst]);

  // We need to track playerMenuId for the final apply
  const playerMenuRef = useRef<number>(0);

  const handleMenuSelectFull = useCallback(
    (menuId: number) => {
      if (!seatChoice || !tableLayout) return;
      playerMenuRef.current = menuId;
      const result = calcLunchResult(tableLayout, seatChoice, opponentSeatId, menuId, state.characterId);
      setLunchResultText(result.resultText);
      setLunchStep('result');
    },
    [seatChoice, tableLayout, opponentSeatId, state.characterId]
  );

  const handleLunchFinish = useCallback(() => {
    if (!seatChoice || !tableLayout) return;
    // ミニゲームのバイアスだけ適用（hole 5 / lunch phase のまま）
    const newState = applyLunchBiasOnly(state, tableLayout, seatChoice, opponentSeatId, playerMenuRef.current);
    setState(newState);
    setLunchStep(null);
    setSeatChoice(null);
    setTableLayout(null);
    setOpponentSeatId(null);
    // characterLunchEvent（従来の昼休憩質問イベント）を表示
    const lunchEvt = selectEvent(newState);
    setCurrentEvent(lunchEvt);
    setReaction(null);
    setSelectedChoice(null);
    setAceAvailable(false);
    setPreviousState(null);
  }, [seatChoice, tableLayout, opponentSeatId, state]);

  // ===== Seat button renderer =====
  const renderSeatButton = (sid: SeatId) => {
    const isOpponent = opponentSeatId === sid;
    const seatInfo = tableLayout ? layoutSeats[tableLayout].find((s) => s.id === sid) : null;
    const label = seatInfo?.label ?? sid;

    if (isOpponent) {
      return (
        <View style={lunchStyles.seatBtnOccupied}>
          <FaceSprite mood={3} scale={1.2} characterId={characterId} />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={lunchStyles.seatBtn}
        onPress={() => handleSeatSelect(sid)}
        activeOpacity={0.7}
      >
        <Text style={lunchStyles.seatBtnText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // ===== Lunch Mini Game UI =====
  if (lunchStep !== null && !isAceRound) {
    const opponentMenuItem = menuItems.find((m) => m.id === opponentMenu);
    const opponentMenuName = opponentMenuItem?.name ?? 'メニュー';

    return (
      <View style={{ flex: 1, backgroundColor: '#2d2418' }}>
        <ScrollView contentContainerStyle={lunchStyles.container}>
          {/* Header */}
          <View style={lunchStyles.header}>
            <Text style={lunchStyles.holeText}>Hole 5 / 9</Text>
            <View style={lunchStyles.lunchBadge}>
              <Text style={lunchStyles.lunchBadgeText}>昼休憩</Text>
            </View>
            <Text style={lunchStyles.partnerText}>{character.name}</Text>
          </View>

          {/* STEP 1: Seat selection (3 layouts) */}
          {lunchStep === 'seat' && tableLayout && (
            <View style={lunchStyles.stepContainer}>
              <Text style={lunchStyles.stepTitle}>席を選ぼう</Text>
              <Text style={lunchStyles.stepDesc}>
                {opponentFirst
                  ? `${character.name}さんはすでに座っている`
                  : '先に好きな席を選ぼう'}
              </Text>

              <View style={lunchStyles.restaurantLayout}>
                {/* Window label */}
                <View style={lunchStyles.windowLabel}>
                  <Text style={lunchStyles.windowLabelText}>≡≡≡ 窓 ≡≡≡</Text>
                </View>

                {/* Table layout diagram */}
                {tableLayout === 'square' && (
                  <View style={lunchStyles.squareLayout}>
                    {/* A: top (window side) */}
                    {renderSeatButton('A')}
                    <View style={lunchStyles.squareMiddleRow}>
                      {/* D: left */}
                      {renderSeatButton('D')}
                      <View style={lunchStyles.squareTable} />
                      {/* B: right */}
                      {renderSeatButton('B')}
                    </View>
                    {/* C: bottom (entrance side) */}
                    {renderSeatButton('C')}
                  </View>
                )}

                {tableLayout === 'parallel' && (
                  <View style={lunchStyles.parallelLayout}>
                    {/* A, B: window side row */}
                    <View style={lunchStyles.parallelRow}>
                      {renderSeatButton('A')}
                      {renderSeatButton('B')}
                    </View>
                    <View style={lunchStyles.parallelTable} />
                    {/* C, D: entrance side row */}
                    <View style={lunchStyles.parallelRow}>
                      {renderSeatButton('C')}
                      {renderSeatButton('D')}
                    </View>
                  </View>
                )}

                {tableLayout === 'perpendicular' && (
                  <View style={lunchStyles.perpLayout}>
                    <View style={lunchStyles.perpRow}>
                      {/* A: window-left */}
                      {renderSeatButton('A')}
                      <View style={lunchStyles.perpTable} />
                      {/* B: window-right */}
                      {renderSeatButton('B')}
                    </View>
                    <View style={lunchStyles.perpRow}>
                      {/* C: entrance-left */}
                      {renderSeatButton('C')}
                      <View style={{ width: 60 }} />
                      {/* D: entrance-right */}
                      {renderSeatButton('D')}
                    </View>
                  </View>
                )}

                {/* Entrance label */}
                <View style={lunchStyles.entranceLabel}>
                  <Text style={lunchStyles.entranceLabelText}>≡≡≡ 入口 ≡≡≡</Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: Menu selection */}
          {lunchStep === 'menu' && (
            <View style={lunchStyles.stepContainer}>
              <Text style={lunchStyles.stepTitle}>メニューを選ぼう</Text>

              {/* Opponent's order */}
              <View style={lunchStyles.opponentBubble}>
                <Text style={lunchStyles.opponentBubbleText}>
                  {character.name}さんは「{opponentMenuName}」を注文した
                </Text>
              </View>

              {/* Menu cards: 2 columns x 3 rows */}
              <View style={lunchStyles.menuGrid}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={lunchStyles.menuCard}
                    onPress={() => handleMenuSelectFull(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={lunchStyles.menuName}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 3: Result */}
          {lunchStep === 'result' && (
            <View style={lunchStyles.stepContainer}>
              <View style={lunchStyles.resultFace}>
                <FaceSprite mood={4} scale={2.5} characterId={characterId} />
              </View>

              <View style={lunchStyles.resultBox}>
                <Text style={lunchStyles.resultText}>{lunchResultText}</Text>
              </View>

              <TouchableOpacity
                style={lunchStyles.nextButton}
                onPress={handleLunchFinish}
                activeOpacity={0.7}
              >
                <Text style={lunchStyles.nextButtonText}>次へ</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (!currentEvent) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>イベントがありません</Text>
      </View>
    );
  }

  // ── 背景色 ──
  const bgColor = isAceRound
    ? '#1a3a2a'
    : isLunch
      ? '#2d2418'
      : '#1a472a';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>

      {/* ==============================
          (1) BaseLayer — 常時表示
          ============================== */}
      <ScrollView
        style={[
          styles.container,
          isLunch && !isAceRound && styles.lunchContainer,
          isAceRound && styles.aceContainer,
        ]}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: baseLayerOpacity }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.holeText}>Hole {state.currentHole} / 9</Text>
              {isLunch && !isAceRound && (
                <View style={styles.lunchBadge}>
                  <Text style={styles.lunchBadgeText}>昼休憩</Text>
                </View>
              )}
              {isLunch && isAceRound && (
                <View style={styles.aceLunchBadge}>
                  <Text style={styles.aceLunchBadgeText}>昼休憩</Text>
                </View>
              )}
            </View>
            <Text style={[styles.partnerText, isAceRound && styles.acePartnerText]}>
              {character.name}
            </Text>
          </View>

          {/* ACE Ball indicator（通常ラウンドのみ） */}
          {!isAceRound && getAceBalls() > 0 && !reaction && !isReacting && (
            <View style={styles.aceIndicator}>
              <Text style={styles.aceIndicatorText}>ACE ×{getAceBalls()}</Text>
            </View>
          )}

          {/* エースラウンド: サブテキスト */}
          {isAceRound && !isReacting && !reaction && (
            <Text style={styles.aceSubtext}>今日は最高のラウンドでした</Text>
          )}

          {/* Character Face */}
          <View style={styles.faceArea}>
            <FaceSprite mood={displayMood} scale={3} characterId={characterId} anim={faceAnim} />
          </View>

          {/* Event */}
          <View style={[
            styles.eventBox,
            isLunch && !isAceRound && styles.lunchEventBox,
            isAceRound && styles.aceEventBox,
          ]}>
            <Text style={styles.eventTitle}>{currentEvent.title}</Text>
            <Text style={styles.eventDesc}>{currentEvent.description}</Text>
          </View>

          {/* あなたの選択（isReacting中のみ表示） */}
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

          {/* Choices / Reaction panel */}
          {reaction ? (
            <View style={[
              styles.reactionBox,
              isLunch && !isAceRound && styles.lunchReactionBox,
              isAceRound && styles.aceReactionBox,
            ]}>
              <Text style={styles.reactionText}>{reaction}</Text>

              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {state.finished ? 'Result へ' : 'Next →'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.choicesBox}>
              {currentEvent.choices.map((choice, idx) => {
                const allowed = isAceRound || isChoiceAllowed(state, choice);
                const disabled = isReacting || !allowed;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.choiceButton,
                      isAceRound && styles.aceChoiceButton,
                      !allowed && styles.choiceDisabled,
                      isReacting && styles.choiceReacting,
                    ]}
                    onPress={() => handleChoice(idx)}
                    disabled={disabled}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        isAceRound && styles.aceChoiceText,
                        disabled && styles.choiceTextDisabled,
                      ]}
                    >
                      {choice.text}
                    </Text>
                    {!allowed && !isReacting && !isAceRound && (
                      <Text style={styles.disabledNote}>（これ以上は危険…）</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ==============================
          (2) OverlayLayer — 2秒だけ表示
          ============================== */}
      {isReacting && (
        <View style={styles.overlayContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.speechBubble,
              isAceRound && styles.aceSpeechBubble,
              {
                opacity: speechOpacity,
                transform: [{ scale: speechScale }],
              },
            ]}
          >
            <Text style={styles.speechBubbleText}>{`「${speechText}」`}</Text>
          </Animated.View>
        </View>
      )}

      {/* Gesture text overlay */}
      {isReacting && gestureText && (
        <View style={styles.gestureOverlayContainer} pointerEvents="none">
          <Animated.View style={[styles.gestureContainer, { opacity: gestureOpacity }]}>
            <Text style={styles.gestureText}>*{gestureText}*</Text>
          </Animated.View>
        </View>
      )}

      {/* Insight overlay */}
      <InsightOverlay isActive={showInsight} onDone={() => {
        setShowInsight(false);
        pendingProceedRef.current?.();
        pendingProceedRef.current = null;
      }} />

      {/* Worst vignette（通常ラウンドのみ） */}
      {!isAceRound && showWorstVignette && (
        <Animated.View
          style={[styles.worstVignette, { opacity: worstVignetteAnim }]}
          pointerEvents="none"
        />
      )}

      {/* ACE Ball overlay（通常ラウンドのみ） */}
      {!isAceRound && showAceOverlay && (
        <Animated.View
          style={[styles.aceOverlay, { opacity: aceOverlayAnim }]}
        >
          <Text style={styles.aceOverlayTitle}>ACE BALL</Text>
          <Text style={styles.aceOverlayText}>その一打、まだ間に合う</Text>
        </Animated.View>
      )}

      {/* Back transition flash */}
      {showBackFlash && (
        <Animated.View
          style={[
            styles.backFlashOverlay,
            {
              opacity: backFlashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, isAceRound ? 0.15 : state.lunchMood === 'bad' ? 0.5 : 0.3],
              }),
              backgroundColor: isAceRound ? '#FFD700' : state.lunchMood === 'bad' ? '#000' : '#FFD700',
            },
          ]}
        />
      )}

      {/* ACE Ball Popup Modal */}
      {showAcePopup && (
        <Animated.View
          style={[
            styles.acePopupOverlay,
            { opacity: acePopupAnim },
          ]}
        >
          <View style={styles.acePopupCard}>
            <View style={styles.acePopupFace}>
              <FaceSprite mood={4} scale={2.5} />
            </View>
            <View style={styles.acePopupSpeech}>
              <Text style={styles.acePopupSpeechText}>
                {pick(ACE_POPUP_LINES)}
              </Text>
            </View>
            <View style={styles.acePopupButtons}>
              <TouchableOpacity
                style={styles.acePopupRetryButton}
                onPress={handleAceRetry}
                activeOpacity={0.7}
              >
                <Text style={styles.acePopupRetryText}>やり直す</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acePopupContinueButton}
                onPress={handleAceContinue}
                activeOpacity={0.7}
              >
                <Text style={styles.acePopupContinueText}>このまま進む</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a472a' },
  lunchContainer: { backgroundColor: '#2d2418' },
  aceContainer: { backgroundColor: '#1a3a2a' },
  content: { padding: 16, paddingTop: 60, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  holeText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  partnerText: { fontSize: 16, color: '#a8d5a2' },
  acePartnerText: { color: '#FFD700' },

  // Lunch badge
  lunchBadge: {
    backgroundColor: 'rgba(255,183,77,0.25)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFB74D',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lunchBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFB74D',
  },
  aceLunchBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  aceLunchBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFD700',
  },

  // ACE indicator（通常ラウンド）
  aceIndicator: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 8,
  },
  aceIndicatorText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFD700',
  },

  // エースラウンド サブテキスト
  aceSubtext: {
    fontSize: 12,
    color: 'rgba(255,215,0,0.6)',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
    fontStyle: 'italic',
  },

  // Face
  faceArea: { alignItems: 'center', marginBottom: 12 },

  // Event
  eventBox: {
    backgroundColor: '#2d6a3f',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  lunchEventBox: {
    backgroundColor: '#3d3020',
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  aceEventBox: {
    backgroundColor: '#24503a',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  eventTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  eventDesc: { fontSize: 14, color: '#e0e0e0', lineHeight: 22 },

  // あなたの選択
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
  choiceButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  aceChoiceButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  choiceDisabled: { backgroundColor: '#666', opacity: 0.6 },
  choiceReacting: { opacity: 0.8 },
  choiceText: { fontSize: 15, color: '#1a472a', fontWeight: '600' },
  aceChoiceText: { color: '#1a3a2a' },
  choiceTextDisabled: { color: '#999' },
  disabledNote: { fontSize: 11, color: '#f44336', marginTop: 4 },

  // Reaction panel
  reactionBox: {
    backgroundColor: '#3a7d53',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  lunchReactionBox: {
    backgroundColor: '#4a3d28',
  },
  aceReactionBox: {
    backgroundColor: '#2a5a42',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  reactionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  nextButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  nextButtonText: { fontSize: 16, fontWeight: 'bold', color: '#1a472a' },

  // ===== OverlayLayer =====
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  speechBubble: {
    backgroundColor: 'rgba(30,80,50,0.95)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginHorizontal: 32,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    maxWidth: '85%',
  },
  aceSpeechBubble: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(30,60,45,0.95)',
  },
  speechBubbleText: {
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
  gestureText: {
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

  // ACE overlay
  aceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  aceOverlayTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  aceOverlayText: {
    fontSize: 16,
    color: '#fff',
  },

  // Back transition flash
  backFlashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },

  errorText: { fontSize: 18, color: '#fff', textAlign: 'center', marginTop: 100 },

  // ACE Popup Modal
  acePopupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  acePopupCard: {
    backgroundColor: '#1a3a2a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    padding: 24,
    marginHorizontal: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '85%',
  },
  acePopupFace: {
    marginBottom: 16,
  },
  acePopupSpeech: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    width: '100%',
  },
  acePopupSpeechText: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    lineHeight: 24,
  },
  acePopupButtons: {
    width: '100%',
    gap: 10,
  },
  acePopupRetryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acePopupRetryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3a2a',
  },
  acePopupContinueButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  acePopupContinueText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});

// ===== Lunch Mini Game Styles =====
const lunchStyles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  holeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  lunchBadge: {
    backgroundColor: 'rgba(255,183,77,0.25)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFB74D',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lunchBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFB74D',
  },
  partnerText: {
    fontSize: 16,
    color: '#a8d5a2',
    marginLeft: 'auto',
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFB74D',
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 20,
    textAlign: 'center',
  },

  // Restaurant layout
  restaurantLayout: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
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
  parallelLayout: {
    alignItems: 'center',
    gap: 8,
  },
  parallelRow: {
    flexDirection: 'row',
    gap: 12,
  },
  parallelTable: {
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

  // Opponent bubble
  opponentBubble: {
    backgroundColor: 'rgba(255,183,77,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    width: '100%',
  },
  opponentBubbleText: {
    fontSize: 14,
    color: '#FFB74D',
    textAlign: 'center',
  },

  // Menu grid
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  menuCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    width: '46%',
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d2418',
  },

  // Result
  resultFace: {
    marginBottom: 20,
  },
  resultBox: {
    backgroundColor: '#3d3020',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB74D',
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  resultText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  nextButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d2418',
  },
});
