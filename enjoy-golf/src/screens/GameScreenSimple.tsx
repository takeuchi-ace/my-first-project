import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  GameEvent,
  GameState,
  Gauge,
  OwnShotResult,
  PuttAim,
  PuttPower,
  PuttResult,
  ReactionRank,
  RootStackParamList,
  SlopeType,
} from '../types';
import {
  getPuttSlopeVariant,
  getPuttReactionText,
  getAdvisedAim,
  getPuttAimReply,
} from '../data/puttingEvent';
import { characters } from '../data/characters';
import {
  createInitialState,
  applyChoice,
  applyMinigameResult,
  focusWindowScale,
  selectEvent,
  selectLunchTalkEvent,
  isChoiceAllowed,
  evaluateReactionRank,
  calcResult,
} from '../logic/engine';
import {
  initTanakaRound,
  updateTanakaState,
  getTrustMultiplier,
  checkJiwaNetsu,
  getTanakaClosing,
  snapshotTanakaState,
  restoreTanakaState,
} from '../logic/tanaka';
import {
  initOnizukaRound,
  updateOnizukaState,
  getOnizukaFunMultiplier,
  checkNetsuMore,
  getOnizukaClosing,
  snapshotOnizukaState,
  restoreOnizukaState,
} from '../logic/onizuka';
import {
  createAceInitialState,
  selectAceEvent,
  applyAceChoice,
  getSelectedAceConsult,
} from '../logic/aceEngine';
import {
  computeReactionPlan,
  findBestChoiceIndex,
  updateInsightStreak,
  resolveChoiceSpeech,
} from '../lib/insight';
import {
  calcWearDelta,
  calcRoundEndRecovery,
  rollInnerVoice,
  getWearHint,
  WEAR_ACE_ROUND,
} from '../logic/wear';
import { applyLunchBiasOnly, calcLunchResult } from '../logic/lunchMiniGame';
import {
  TableLayout,
  SeatId,
  layoutSeats,
  menuItems,
  characterLunchProfiles,
} from '../data/lunchMiniGame';
import InsightOverlay from '../components/InsightOverlay';
import { HoleMap } from '../components/HoleMap';
import { HoleMapModal } from '../components/HoleMapModal';
import { MorningShotView } from '../components/MorningShotView';
import { PuttGreenView } from '../components/PuttGreenView';
import { getHoleLayout } from '../data/holeLayouts';
import { useGameStore } from '../store/useGameStore';
import { FaceSprite, MoodLevel } from '../faces';
import { COLORS } from '../theme/colors';

// 名言の発動率。名言候補（isQuote）は5手中で平均2.4回選ばれるので、
// この率を掛けた回数が1ラウンドの発動回数になる。
// 0.25 では 0.63回/ラウンドまで落ち、約半分のラウンドで一度も出なかった。
// 「ラウンドに1回強」を狙って 0.5 にしてある（実測 1.23回・出ないラウンド24%）。
const QUOTE_RATE = 0.5;
const ACE_HOLE_COUNT = 5;

// ミニゲームの判定窓（中心 0.5 からの片側幅）。集中力で伸縮する
const OWN_SHOT_WINDOW = { perfect: 0.10, good: 0.20 };
const PUTT_WINDOW = { perfect: 0.05, good: 0.10 };

/**
 * 傾斜ごとに必要な「引きの強さ」（0〜1 のスワイプ距離）。
 *
 * 朝イチと同じ「バーを中央でタップ」だと、1ラウンドに同じ操作が2回出てきて単調になる。
 * パットは「どれだけ強く打つか」を決める場面なので、スワイプの長さで表す方が素直で、
 * かつ傾斜によって目標が変わるぶん状況を読む必要が出る。
 *
 * 上りは届かせるために強く、下りは転がるので弱く、曲がる傾斜は少し強めに。
 */
const PUTT_POWER_TARGET: Record<SlopeType, number> = {
  uphill: 0.74,
  flat: 0.50,
  left: 0.58,
  right: 0.58,
};

/** 引きの強さの目標帯を横ゲージの描画位置に変換する（判定と見た目を同じ数値から作る） */
const powerZoneStyle = (target: number, half: number) => ({
  left: `${Math.max(0, target - half) * 100}%` as `${number}%`,
  width: `${Math.min(1, target + half) * 100 - Math.max(0, target - half) * 100}%` as `${number}%`,
});

/** focus を反映した判定窓を返す */
const scaledWindow = (base: { perfect: number; good: number }, focus: number) => {
  const s = focusWindowScale(focus);
  return { perfect: base.perfect * s, good: base.good * s };
};

/** 判定窓を目標ゾーンの描画位置に変換する（判定と見た目を同じ数値から作る） */
const zoneStyle = (half: number) => ({
  left: `${(0.5 - half) * 100}%` as `${number}%`,
  width: `${half * 200}%` as `${number}%`,
});

const RANK_TO_MOOD: Record<ReactionRank, MoodLevel> = {
  good: 4,
  neutral: 3,
  bad: 2,
  worst: 1,
};

const MENU_GROUP_LABELS: Record<string, string> = {
  hearty: 'がっつり',
  japanese: '和食',
  light: '軽め',
};

type Props = NativeStackScreenProps<RootStackParamList, 'GameSimple'>;
type LunchSeatPhase = 'seat' | 'menu' | 'result';
type MorningPhase = 'own_shot_intro' | 'own_shot_swing' | 'own_shot_result' | null;
type PuttPhase = 'power_tap' | 'result' | null;

const PUTT_AIM_BY_INDEX: import('../types').PuttAim[] = ['left', 'center', 'right'];
const puttAimToValue = (idx: number): import('../types').PuttAim =>
  PUTT_AIM_BY_INDEX[idx] ?? 'center';

const getOwnShotResultText = (result: OwnShotResult, charId: number, charName: string): string => {
  if (result === 'perfect') {
    if (charId === 1) return `「...いい球でしたね」と${charName}が小さく頷いた。`;
    if (charId === 2) return `「おお！やるじゃねえか！」${charName}が声を上げた。`;
    return `${charName}が頷いた。「いい球ですね」`;
  }
  if (result === 'good') {
    if (charId === 1) return `${charName}が静かに見守っている。まずまずの一打だ。`;
    if (charId === 2) return `「フェアウェイキープ！悪くないぞ！」`;
    return `${charName}が頷いた。悪くない出だしだ。`;
  }
  if (charId === 1) return `${charName}が一瞬目を逸らした。`;
  if (charId === 2) return `「まあ、朝イチはあるよ！気にすんな！」`;
  return `${charName}は何も言わなかった。`;
};

export default function GameScreenSimple({ route, navigation }: Props) {
  const { characterId } = route.params;
  const character = useMemo(
    () => characters.find((c) => c.id === characterId)!,
    [characterId],
  );
  const store = useGameStore();
  const isAceRound = character.isAce;
  // 省スペース表示の判定に使う（小型端末で選択肢が画面外に出るのを防ぐ）
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  // ===== Game State (engine-driven) =====
  // 同一の初期stateからeventを選出（charEventSlotsの不一致を防ぐ）
  const [gameState, setGameState] = useState<GameState>(() => {
    const initial = isAceRound ? createAceInitialState(characterId) : createInitialState(characterId);
    if (characterId === 1 && !isAceRound) initTanakaRound();
    if (characterId === 2 && !isAceRound) initOnizukaRound();
    return initial;
  });
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(() =>
    isAceRound ? selectAceEvent(gameState) : selectEvent(gameState),
  );
  const [previousState, setPreviousState] = useState<GameState | null>(null);
  // ACEボールでの「やり直す」で戻すもの。engine の外にある状態は
  // GameState に入っていないため、選択の直前を別に控えておく必要がある
  const redoSnapshotRef = useRef<{
    tanaka: ReturnType<typeof snapshotTanakaState>;
    onizuka: ReturnType<typeof snapshotOnizukaState>;
    insightStreak: number;
    prevWasMismatch: boolean;
    wear: number;
    roundWear: number;
  } | null>(null);

  // ===== UI state =====
  const [choosing, setChoosing] = useState(true);
  const [speechText, setSpeechText] = useState('');
  const [gestureText, setGestureText] = useState<string | null>(null);
  // 仕草がキャラ別の地の文か（true なら完全な文なのでアスタリスクで囲まない）
  const [gestureIsNarration, setGestureIsNarration] = useState(false);
  const [showSpeech, setShowSpeech] = useState(false);
  const [showGesture, setShowGesture] = useState(false);
  const [mood, setMood] = useState<MoodLevel>(3);
  const [holeMapVisible, setHoleMapVisible] = useState(false);

  // ホールマップ用。相談ラウンドはコースを持たないので出さない
  // （通常ラウンドは21キャラ全員に9ホール分のレイアウトがある）
  const courseHole = useMemo(
    () => (isAceRound ? undefined : getHoleLayout(characterId, gameState.currentHole)),
    [isAceRound, characterId, gameState.currentHole],
  );

  // ===== Insight state =====
  const [insightStreak, setInsightStreak] = useState(0);
  const [showInsight, setShowInsight] = useState(false);
  /** 内なる声。迎合が通って摩耗が溜まったビートだけ出る（null = 出さない） */
  const [innerVoice, setInnerVoice] = useState<string | null>(null);
  /** 創業者の気づかいを1ラウンドに1回だけ出すための記録 */
  const wearHintShownRef = useRef(false);
  /** このラウンドで溜まった摩耗の合計。ラウンド終了時の回復量がこれで決まる */
  const roundWearRef = useRef(0);
  // 直前のターンで相手が本音を隠したか（見抜けたかは次の一手で判定する）
  const [prevWasMismatch, setPrevWasMismatch] = useState(false);
  // 表示中の仕草が「本音の手がかり」かどうか。強調表示に使う
  const [gestureIsTell, setGestureIsTell] = useState(false);

  // ===== Quote (名言) state =====
  const [quoteMode, setQuoteMode] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const quoteOpacity = useRef(new Animated.Value(0)).current;

  // ===== Character closing state (Tanaka / Onizuka) =====
  const [charClosingMode, setCharClosingMode] = useState(false);
  const [charClosingSpeech, setCharClosingSpeech] = useState('');
  const [charClosingGesture, setCharClosingGesture] = useState<string | null>(null);
  const charClosingOpacity = useRef(new Animated.Value(0)).current;

  // ===== Effect state =====
  const [creepVignetteOpacity, setCreepVignetteOpacity] = useState(0);
  const [showWorstFlash, setShowWorstFlash] = useState(false);

  // ===== ACE ball popup =====
  const [showAceBallPopup, setShowAceBallPopup] = useState(false);
  const [pendingNextState, setPendingNextState] = useState<GameState | null>(null);

  // ===== Morning shot mini-game state =====
  const [morningPhase, setMorningPhase] = useState<MorningPhase>(null);
  const [pendingMorningState, setPendingMorningState] = useState<GameState | null>(null);
  const [ownShotResultText, setOwnShotResultText] = useState('');
  const swingBarAnim = useRef(new Animated.Value(0)).current;
  const swingAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const swingPositionRef = useRef(0);
  const swingLockedRef = useRef(false);

  // ===== Final Putt mini-game state =====
  const [puttPhase, setPuttPhase] = useState<PuttPhase>(null);
  const [pendingPuttState, setPendingPuttState] = useState<GameState | null>(null);
  const [puttAimIndex, setPuttAimIndex] = useState<number>(-1);
  const [puttSlopeInfo, setPuttSlopeInfo] = useState<{
    slope: SlopeType; correctAim: PuttAim;
  } | null>(null);
  const [puttResultText, setPuttResultText] = useState('');

  // ミニゲームの判定窓に使う集中力。会話で focus を削ると自分のプレーが決まらなくなる
  const ownShotFocus = pendingMorningState?.gauge.focus ?? gameState.gauge.focus;
  const puttFocus = pendingPuttState?.gauge.focus ?? gameState.gauge.focus;
  const ownShotZone = useMemo(() => scaledWindow(OWN_SHOT_WINDOW, ownShotFocus), [ownShotFocus]);
  const puttZone = useMemo(() => scaledWindow(PUTT_WINDOW, puttFocus), [puttFocus]);
  /** 引いている量（0〜1）。指を離した時点の値で強さが決まる */
  const [puttPull, setPuttPull] = useState(0);
  const puttPullRef = useRef(0);
  /** スワイプの全長として扱う幅（px）。これを超えて引いても 1 で止まる */
  const PUTT_PULL_RANGE = 200;
  /** これ未満で離した場合は「引いていない」とみなして打たない（誤タップ対策） */
  const PUTT_PULL_MIN = 0.06;
  const [puttResultLabel, setPuttResultLabel] = useState('');

  // ===== Lunch mini-game state =====
  const [lunchSubPhase, setLunchSubPhase] = useState<'mini' | 'event' | null>(null);
  const [lunchSeatPhase, setLunchSeatPhase] = useState<LunchSeatPhase>('seat');
  const [lunchLayout] = useState<TableLayout>(() => {
    const layouts: TableLayout[] = ['square', 'parallel', 'perpendicular'];
    return layouts[Math.floor(Math.random() * 3)];
  });
  const ALL_SEATS: SeatId[] = ['A', 'B', 'C', 'D'];
  const [opponentFirst, setOpponentFirst] = useState(false);
  const [opponentSeatId, setOpponentSeatId] = useState<SeatId | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatId | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [lunchResultText, setLunchResultText] = useState('');
  // 相手のメニュー注文（コンペと同じ表示）
  const opponentMenuId = useMemo(() => {
    const profile = characterLunchProfiles[characterId];
    return profile?.menuChoice ?? 0;
  }, [characterId]);
  const opponentMenuName = useMemo(
    () => menuItems.find((m) => m.id === opponentMenuId)?.name ?? '',
    [opponentMenuId],
  );

  // ===== Animation refs =====
  const speechOpacity = useRef(new Animated.Value(0)).current;
  const speechScale = useRef(new Animated.Value(0.98)).current;
  const gestureOpacity = useRef(new Animated.Value(0)).current;
  /**
   * 内なる声の不透明度。仕草と共用にすると、仕草が出ないターン（3割）で
   * gestureOpacity が 0 のまま残り、声が表示されずに消える
   */
  const innerVoiceOpacity = useRef(new Animated.Value(0)).current;
  const worstFlashOpacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const innerVoiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===== Face animation (Competition style) =====
  const faceAnim = useRef(new Animated.Value(1)).current;
  const baseLayerOpacity = useRef(new Animated.Value(1)).current;
  const [moodOverride, setMoodOverride] = useState<MoodLevel | null>(null);
  const [selectedChoiceText, setSelectedChoiceText] = useState('');

  const animateFace = useCallback(() => {
    Animated.sequence([
      Animated.timing(faceAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(faceAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(faceAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [faceAnim]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
      if (innerVoiceTimerRef.current) clearTimeout(innerVoiceTimerRef.current);
    };
  }, []);

  // ===== Creep vignette effect =====
  useEffect(() => {
    if (gameState.gauge.creep >= 90) {
      setCreepVignetteOpacity(0.35);
    } else if (gameState.gauge.creep >= 70) {
      setCreepVignetteOpacity(0.15);
    } else {
      setCreepVignetteOpacity(0);
    }
  }, [gameState.gauge.creep]);

  // ===== パットの引きをリセット =====
  // パットは横バーのタップではなく縦のスワイプなので、バーのアニメーションは動かさない
  useEffect(() => {
    if (puttPhase !== 'power_tap') return;
    swingLockedRef.current = false;
    puttPullRef.current = 0;
    setPuttPull(0);
  }, [puttPhase]);

  // ===== Swing animation for morning mini-game =====
  useEffect(() => {
    if (morningPhase !== 'own_shot_swing') return;
    swingBarAnim.setValue(0);
    swingLockedRef.current = false;
    const listenerId = swingBarAnim.addListener(({ value }) => {
      swingPositionRef.current = value;
    });
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(swingBarAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(swingBarAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    );
    swingAnimRef.current = anim;
    anim.start();
    return () => {
      anim.stop();
      swingBarAnim.removeListener(listenerId);
    };
  }, [morningPhase, swingBarAnim]);

  // ===== Handle swing tap =====
  const handleSwingTap = useCallback(() => {
    if (swingLockedRef.current || morningPhase !== 'own_shot_swing') return;
    swingLockedRef.current = true;
    swingAnimRef.current?.stop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const pos = swingPositionRef.current;
    // 集中力が低いほど判定窓が狭くなる（目標ゾーンの表示も同じ数値から作っている）
    const w = scaledWindow(OWN_SHOT_WINDOW, ownShotFocus);
    const off = Math.abs(pos - 0.5);
    let result: OwnShotResult;
    if (off <= w.perfect) {
      result = 'perfect';
    } else if (off <= w.good) {
      result = 'good';
    } else {
      result = 'miss';
    }

    const resultText = getOwnShotResultText(result, characterId, character.name);
    setOwnShotResultText(resultText);

    const base = pendingMorningState;
    if (base) {
      let delta: Partial<Gauge>;
      if (result === 'perfect') delta = { trust: 3, fun: 2 };
      else if (result === 'good') delta = { trust: 1 };
      else delta = { fun: 2, creep: characterId === 1 ? 2 : 0 };

      // engine 経由で反映する（キャラの traitModifiers を効かせるため）
      setPendingMorningState({ ...applyMinigameResult(base, delta), ownShot: result });
    }

    setMorningPhase('own_shot_result');
  }, [morningPhase, pendingMorningState, characterId, character.name]);

  // Advance from own shot result to next hole
  useEffect(() => {
    if (morningPhase !== 'own_shot_result') return;
    const id = setTimeout(() => {
      setMorningPhase(null);
      if (pendingMorningState) {
        advanceToNext(pendingMorningState);
      }
    }, 2000);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morningPhase]);

  // Advance from putt result to game end
  useEffect(() => {
    if (puttPhase !== 'result') return;
    const id = setTimeout(() => {
      setPuttPhase(null);
      if (pendingPuttState) {
        advanceToNext(pendingPuttState);
      }
    }, 2500);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puttPhase]);

  // ===== Reset UI helper =====
  const resetUI = useCallback(() => {
    setSpeechText('');
    setGestureText(null);
    setGestureIsNarration(false);
    setGestureIsTell(false);
    setInnerVoice(null);
    setShowSpeech(false);
    setShowGesture(false);
    setQuoteMode(false);
    setQuoteText('');
    setCharClosingMode(false);
    setCharClosingSpeech('');
    setCharClosingGesture(null);
    setMoodOverride(null);
    setSelectedChoiceText('');
    speechOpacity.setValue(0);
    speechScale.setValue(0.98);
    gestureOpacity.setValue(0);
    innerVoiceOpacity.setValue(0);
    quoteOpacity.setValue(0);
    charClosingOpacity.setValue(0);
    baseLayerOpacity.setValue(1);
  }, [speechOpacity, speechScale, gestureOpacity, innerVoiceOpacity, quoteOpacity, charClosingOpacity, baseLayerOpacity]);

  // ===== Advance to next hole =====
  const advanceToNext = useCallback((newState: GameState) => {
    setLunchSubPhase(null);

    if (newState.finished) {
      // 摩耗の回復。相談ラウンドは創業者と本音で話す場なので大きく戻る。
      // 通常ラウンドは「そのラウンドで自分を殺した量」で回復量が変わり、
      // 迎合せずに終えたラウンドが摩耗を戻す手になる。
      // 契約成功では回復させない（迎合で勝った代償を勝利が打ち消してしまう）
      store.addWear(
        isAceRound ? WEAR_ACE_ROUND : calcRoundEndRecovery(roundWearRef.current)
      );

      // Character closing check (Tanaka / Onizuka) before navigating to result
      if (!isAceRound && newState.finishReason === 'complete') {
        let closing: { type: 'SS' | 'S' | 'none'; speech: string; gesture: string | null; pauseMs: number } | null = null;

        if (characterId === 1) {
          const isContracted = store.contractedCharacterIds.includes(1);
          store.setLastGameState(newState);
          const tempResult = calcResult(newState);
          closing = getTanakaClosing(tempResult.grade, isContracted);
        } else if (characterId === 2) {
          const isContracted = store.contractedCharacterIds.includes(2);
          store.setLastGameState(newState);
          const tempResult = calcResult(newState);
          closing = getOnizukaClosing(tempResult.grade, isContracted);
        }

        if (closing && closing.type !== 'none') {
          setCharClosingSpeech(closing.speech);
          setCharClosingGesture(closing.gesture);
          setCharClosingMode(true);
          setGameState(newState);

          charClosingOpacity.setValue(0);
          setTimeout(() => {
            Animated.timing(charClosingOpacity, {
              toValue: 1, duration: 800, useNativeDriver: true,
            }).start();
          }, closing.pauseMs);

          const totalDelay = closing.type === 'SS' ? 4000 : 3000;
          timerRef.current = setTimeout(() => {
            setCharClosingMode(false);
            navigation.replace('ResultSimple', { characterId, finishReason: 'complete', isAceRound });
          }, totalDelay);
          return;
        }
      }

      store.setLastGameState(newState);
      navigation.replace('ResultSimple', {
        characterId,
        finishReason: newState.finishReason as 'complete' | 'creep_explosion',
        isAceRound,
      });
      return;
    }

    setGameState(newState);

    // Entering lunch phase (non-ACE only)
    // フロー: 席+メニューミニゲーム → キャラランチイベント(3択) → 後半
    if (newState.phase === 'lunch' && !isAceRound) {
      // 相手が先に座るか（50%）
      const isOppFirst = Math.random() < 0.5;
      setOpponentFirst(isOppFirst);
      if (isOppFirst) {
        setOpponentSeatId(ALL_SEATS[Math.floor(Math.random() * ALL_SEATS.length)]);
      } else {
        setOpponentSeatId(null);
      }
      setLunchSubPhase('mini');
      setLunchSeatPhase('seat');
      setSelectedSeat(null);
      setSelectedMenuId(null);
      resetUI();
      return;
    }

    // Select next event
    const nextEvt = isAceRound ? selectAceEvent(newState) : selectEvent(newState);
    setCurrentEvent(nextEvt);
    setChoosing(true);
    resetUI();
  }, [characterId, isAceRound, navigation, store, resetUI]);

  // ===== Handle event choice =====
  const handleChoice = useCallback((choiceIndex: number) => {
    if (!choosing || !currentEvent) return;
    setChoosing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isMorningShotEvent = currentEvent.id.startsWith('morning_shot_');
    const choice = currentEvent.choices[choiceIndex];

    // Save previous state for ACE ball
    setPreviousState(gameState);
    redoSnapshotRef.current = {
      tanaka: snapshotTanakaState(),
      onizuka: snapshotOnizukaState(),
      insightStreak,
      prevWasMismatch,
      wear: store.getWear(),
      roundWear: roundWearRef.current,
    };

    // Apply choice via engine
    let newState = isAceRound
      ? applyAceChoice(gameState, currentEvent, choiceIndex)
      : applyChoice(gameState, currentEvent, choiceIndex);

    // ===== Tanaka: stack update + flatter penalty =====
    if (characterId === 1 && !isAceRound) {
      updateTanakaState(choice.tags as import('../types').Tag[], gameState.currentHole);
      const trustDelta = newState.gauge.trust - gameState.gauge.trust;
      if (trustDelta > 0 && getTrustMultiplier() < 1.0) {
        const penalized = gameState.gauge.trust + Math.round(trustDelta * getTrustMultiplier());
        newState = { ...newState, gauge: { ...newState.gauge, trust: penalized } };
      }
    }

    // ===== Onizuka: stack update + flatter penalty (fun decay) =====
    if (characterId === 2 && !isAceRound) {
      updateOnizukaState(choice.tags as import('../types').Tag[], gameState.currentHole);
      const funDelta = newState.gauge.fun - gameState.gauge.fun;
      if (funDelta > 0 && getOnizukaFunMultiplier() < 1.0) {
        const penalized = gameState.gauge.fun + Math.round(funDelta * getOnizukaFunMultiplier());
        newState = { ...newState, gauge: { ...newState.gauge, fun: penalized } };
      }
    }

    // ===== ACE round early return =====
    if (isAceRound) {
      const consult = getSelectedAceConsult(currentEvent, choiceIndex);
      const isQuoteMoment = consult?.isQuote === true && Math.random() < QUOTE_RATE;

      setMood(isQuoteMoment ? 5 : 4);

      if (isQuoteMoment && consult) {
        // 名言演出
        setQuoteText(consult.answer);
        setQuoteMode(true);
        store.saveQuoteIfNew(consult.answer);

        quoteOpacity.setValue(0);
        Animated.timing(quoteOpacity, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }).start();

        timerRef.current = setTimeout(() => {
          advanceToNext(newState);
        }, 3500);
      } else {
        // 通常吹き出し表示
        let speechContent = consult?.answer ?? choice.speechOverride ?? '';

        // 摩耗している相手にだけ、答える前に一言添える。
        // ラウンドで一度だけ（名言演出のターンには乗せないので、最初の通常回答に出る）
        if (!wearHintShownRef.current) {
          const hint = getWearHint(store.getWear());
          if (hint) {
            speechContent = `${hint}\n${speechContent}`;
            wearHintShownRef.current = true;
          }
        }

        setSpeechText(speechContent);
        setGestureText(null);
        setShowSpeech(true);

        speechOpacity.setValue(0);
        speechScale.setValue(0.98);
        Animated.parallel([
          Animated.timing(speechOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(speechScale, { toValue: 1.0, duration: 200, useNativeDriver: true }),
        ]).start();

        timerRef.current = setTimeout(() => {
          advanceToNext(newState);
        }, 2500);
      }
      return;
    }

    // ===== 通常モード（以下変更なし） =====

    // 反応ランクは engine が記録した「選択への反応そのもの」を使う。
    // ゲージの前後差から求めると trustDrift による目減りが混ざってランクが下振れする
    const appliedDelta: Gauge = newState.lastAppliedDelta;

    // Evaluate rank
    const rank: ReactionRank = evaluateReactionRank(appliedDelta);

    // ===== 摩耗: 相手に合わせて、それが通ったときだけ溜まる =====
    // 内なる声はここでしか出さない。溜まった瞬間に出すことで、
    // 隠しパラメータのまま「今の一手が自分を削った」と分かる
    const wearDelta = calcWearDelta(choice.tags ?? [], rank);
    let innerVoiceLine: string | null = null;
    if (wearDelta > 0) {
      roundWearRef.current += wearDelta;
      // getWear() は stateRef を読むため addWear の直後でも古い値を返す。
      // 声のしきい値判定には、加算後の値を自分で組み立てて渡す
      const wearAfter = Math.min(100, store.getWear() + wearDelta);
      store.addWear(wearDelta);
      innerVoiceLine = rollInnerVoice(wearAfter);
      setInnerVoice(innerVoiceLine);
    }

    // Compute reaction plan (single call for consistent randomness)
    const plan = computeReactionPlan(rank, characterId, choice.speechOverride);

    // Speech: 選択肢ごとの共通セリフを優先。ただし口調が正体になっているキャラでは
    // 使わず（resolveChoiceSpeech が null を返す）、キャラ専用テンプレートに戻す。
    // 本音を隠すターンでは正反対のランクのセリフが返る（表情と仕草は本音のまま）
    const curatedLine = resolveChoiceSpeech(choice, rank, characterId, plan.isMismatch);
    const resolvedSpeech = curatedLine ?? plan.speechText;

    // Update mood + face animation (Competition style)
    setMood(RANK_TO_MOOD[rank]);
    setMoodOverride(RANK_TO_MOOD[rank]);
    setSelectedChoiceText(choice.text);
    animateFace();

    Animated.timing(baseLayerOpacity, {
      toValue: 0.9, duration: 200, useNativeDriver: true,
    }).start();

    // Insight: 建前に流されなかったか。判定するのは「隠されたターンの次の一手」
    const bestIdx = findBestChoiceIndex(gameState, currentEvent);
    const { newStreak, insightFired } = updateInsightStreak(
      insightStreak, prevWasMismatch, choiceIndex, bestIdx,
    );
    setInsightStreak(newStreak);
    setPrevWasMismatch(plan.isMismatch);
    if (insightFired && store.gainAceBall()) {
      setShowInsight(true);
    }

    // Set speech & gesture
    // キャラ固有の演出が下で仕草を差し替えるため、表示予約の判定にはこのローカル値を使う。
    // plan.gestureText を直接見ると、差し替えで足された仕草が予約されず表示されない
    let gestureToShow: string | null = plan.gestureText;

    setSpeechText(resolvedSpeech);
    setGestureText(plan.gestureText);
    setGestureIsNarration(plan.gestureIsNarration);
    setGestureIsTell(plan.isMismatch);

    // ===== Tanaka: じわ熱 override =====
    if (characterId === 1 && !isAceRound) {
      const jiwa = checkJiwaNetsu(newState.phase);
      if (jiwa.fired) {
        setSpeechText(jiwa.line);
        // 差し替えの仕草は汎用の動作（文末が「。」でない）なので地の文扱いを外す
        gestureToShow = jiwa.isSuperRare ? '目が少し潤んでいるように見えた' : null;
        setGestureText(gestureToShow);
        setGestureIsNarration(false);
        setMood(4);
      }
    }

    // ===== Onizuka: 熱量漏れ override =====
    if (characterId === 2 && !isAceRound) {
      const netsu = checkNetsuMore(newState.phase);
      if (netsu.fired) {
        setSpeechText(netsu.line);
        gestureToShow = netsu.isSuperRare ? 'ふっと真顔になり、遠くを見つめた' : null;
        setGestureText(gestureToShow);
        setGestureIsNarration(false);
        setMood(5);
      }
    }

    // Worst vignette (Competition style — subtle dark overlay)
    if (rank === 'worst') {
      setShowWorstFlash(true);
      worstFlashOpacity.setValue(0);
      Animated.timing(worstFlashOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    // Animate speech with scale
    speechOpacity.setValue(0);
    speechScale.setValue(0.98);
    gestureOpacity.setValue(0);
    innerVoiceOpacity.setValue(0);
    setShowSpeech(true);
    setShowGesture(false);

    Animated.parallel([
      Animated.timing(speechOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(speechScale, { toValue: 1.0, duration: 200, useNativeDriver: true }),
    ]).start();

    if (gestureToShow) {
      gestureTimerRef.current = setTimeout(() => {
        setShowGesture(true);
        Animated.timing(gestureOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }, plan.gestureDelayMs || 600);
    }

    // 内なる声は仕草の有無に関わらず出す（仕草と同じ間で遅らせる）
    if (innerVoiceLine) {
      innerVoiceTimerRef.current = setTimeout(() => {
        Animated.timing(innerVoiceOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }, (plan.gestureDelayMs || 600) + 200);
    }

    // 朝イチのショット選択後 → 自分のショットミニゲームへ
    if (isMorningShotEvent && !isAceRound) {
      timerRef.current = setTimeout(() => {
        if (rank === 'worst') {
          Animated.timing(worstFlashOpacity, {
            toValue: 0, duration: 300, useNativeDriver: true,
          }).start(() => setShowWorstFlash(false));
        }
        Animated.timing(baseLayerOpacity, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }).start();
        setMoodOverride(null);
        setSelectedChoiceText('');
        setGameState(newState);
        setPendingMorningState(newState);
        setMorningPhase('own_shot_intro');
        resetUI();
        timerRef.current = setTimeout(() => {
          setMorningPhase('own_shot_swing');
        }, 1500);
      }, 2500);
      return;
    }

    // 最終パット選択後 → パワータップミニゲームへ
    const isPuttingEvent = currentEvent.id.startsWith('putting_event_') && !isAceRound;
    if (isPuttingEvent) {
      const parts = currentEvent.id.split('_');
      const slope = parts[2] as SlopeType;
      const variant = getPuttSlopeVariant(slope);
      setPuttAimIndex(choiceIndex);
      setPuttSlopeInfo({ slope, correctAim: variant.correctAim });

      // 反応ランクはそのまま使う（相手の読みに乗ったかで割れるようになった）。
      // セリフだけは汎用テンプレではなくこの場面用のものに差し替える
      const advisedAim = getAdvisedAim(slope, parts[3] === 'correct');
      const followedAdvice = PUTT_AIM_BY_INDEX[choiceIndex] === advisedAim;
      setSpeechText(getPuttAimReply(followedAdvice, rank));

      timerRef.current = setTimeout(() => {
        if (rank === 'worst') {
          Animated.timing(worstFlashOpacity, {
            toValue: 0, duration: 300, useNativeDriver: true,
          }).start(() => setShowWorstFlash(false));
        }
        Animated.timing(baseLayerOpacity, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }).start();
        setMoodOverride(null);
        setSelectedChoiceText('');
        setGameState(newState);
        setPendingPuttState(newState);
        setPuttPhase('power_tap');
        resetUI();
      }, 2500);
      return;
    }

    // ランチイベント選択後 → （ボーナスビートがあれば追加会話）→ 昼食総括画面を表示
    if (lunchSubPhase === 'event') {
      timerRef.current = setTimeout(() => {
        if (rank === 'worst') {
          Animated.timing(worstFlashOpacity, {
            toValue: 0, duration: 300, useNativeDriver: true,
          }).start(() => setShowWorstFlash(false));
        }
        setGameState(newState);

        // ボーナスビート「昼食の追加会話」が当たっているラウンドのみ、もう1問挟む
        const lunchTalk = isAceRound ? null : selectLunchTalkEvent(newState);
        if (lunchTalk) {
          setCurrentEvent(lunchTalk);
          setChoosing(true);
          resetUI();
          return;
        }

        setLunchSubPhase('mini');
        setLunchSeatPhase('result');
        setChoosing(false);
        resetUI();
      }, 2500);
      return;
    }

    // ACE ball check (non-ACE round, bad/worst, balls available)
    if ((rank === 'bad' || rank === 'worst') && store.aceBalls > 0) {
      setPendingNextState(newState);
      timerRef.current = setTimeout(() => {
        // Restore visuals before showing popup
        if (rank === 'worst') {
          Animated.timing(worstFlashOpacity, {
            toValue: 0, duration: 300, useNativeDriver: true,
          }).start(() => setShowWorstFlash(false));
        }
        Animated.timing(baseLayerOpacity, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }).start();
        setMoodOverride(null);
        setSelectedChoiceText('');
        setShowAceBallPopup(true);
      }, 2500);
      return;
    }

    // Advance after 2.5s
    timerRef.current = setTimeout(() => {
      // Fade out worst vignette before advancing
      if (rank === 'worst') {
        Animated.timing(worstFlashOpacity, {
          toValue: 0, duration: 300, useNativeDriver: true,
        }).start(() => setShowWorstFlash(false));
      }
      // 内なる声も仕草と同じように消す（瞬間的に消えると浮く）
      Animated.timing(innerVoiceOpacity, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }).start();
      // Restore base layer
      Animated.timing(baseLayerOpacity, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }).start();
      setMoodOverride(null);
      setSelectedChoiceText('');
      advanceToNext(newState);
    }, 2500);
  }, [choosing, currentEvent, gameState, characterId, isAceRound, insightStreak, store.aceBalls, store.saveQuoteIfNew, advanceToNext, speechOpacity, speechScale, gestureOpacity, worstFlashOpacity, quoteOpacity, lunchSubPhase, resetUI, animateFace, baseLayerOpacity]);

  // ===== ACE ball handlers =====
  const handleAceBallRedo = useCallback(() => {
    setShowAceBallPopup(false);
    store.useAceBall();
    if (previousState) {
      setGameState(previousState);
      // Keep the same currentEvent — player retries the same event
    }
    // GameState の外にある状態も戻す。ここを戻さないと、取り消した選択の
    // 媚びスタックや不正カウントが残り、不正を取り消しても S 条件が壊れたままになる
    const snap = redoSnapshotRef.current;
    if (snap) {
      restoreTanakaState(snap.tanaka);
      restoreOnizukaState(snap.onizuka);
      setInsightStreak(snap.insightStreak);
      setPrevWasMismatch(snap.prevWasMismatch);
      // 摩耗も戻す。取り消した迎合の分が残ると、選び直したのに
      // 自分を殺した記録だけが積まれてしまう
      store.addWear(snap.wear - store.getWear());
      roundWearRef.current = snap.roundWear;
    }
    setChoosing(true);
    resetUI();
  }, [previousState, store, resetUI]);

  const handleAceBallContinue = useCallback(() => {
    setShowAceBallPopup(false);
    if (pendingNextState) {
      advanceToNext(pendingNextState);
    }
  }, [pendingNextState, advanceToNext]);

  // ===== Final Putt helpers =====
  const calcPuttResult = (aimIndex: number, correctAim: PuttAim, power: PuttPower): PuttResult => {
    const aimMap: PuttAim[] = ['left', 'center', 'right'];
    const aimCorrect = aimMap[aimIndex] === correctAim;
    if (aimCorrect && power === 'perfect') return 'in';
    if (aimCorrect && power === 'good') return Math.random() < 0.6 ? 'in' : 'lip_out';
    if (!aimCorrect && power === 'perfect') return 'lip_out';
    return 'miss';
  };

  /**
   * 指を離した時点の引きの量で強さを決める。
   *
   * 目標は傾斜ごとに変わる（上りは強く、平らは中間）。
   * 判定窓は朝イチと同じく集中力で狭くなる。
   */
  const handlePuttRelease = useCallback(() => {
    if (swingLockedRef.current || puttPhase !== 'power_tap') return;
    swingLockedRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const pull = puttPullRef.current;
    const target = puttSlopeInfo ? PUTT_POWER_TARGET[puttSlopeInfo.slope] : 0.5;
    // 集中力が低いほど判定窓が狭くなる（目標ゾーンの表示も同じ数値から作っている）
    const w = scaledWindow(PUTT_WINDOW, puttFocus);
    const off = Math.abs(pull - target);
    let power: PuttPower;
    if (off <= w.perfect) {
      power = 'perfect';
    } else if (off <= w.good) {
      power = 'good';
    } else {
      power = 'miss';
    }

    const info = puttSlopeInfo;
    if (!info) return;

    const result = calcPuttResult(puttAimIndex, info.correctAim, power);
    const label = result === 'in' ? 'カップイン！' : result === 'lip_out' ? 'LIP-OUT...' : 'MISS...';
    setPuttResultLabel(label);
    setPuttResultText(getPuttReactionText(characterId, result));

    const base = pendingPuttState;
    if (base) {
      let delta: Partial<Gauge>;
      if (result === 'in') delta = { trust: 5, fun: 4 };
      else if (result === 'lip_out') delta = { trust: 2, fun: 3 };
      else delta = { fun: 1, creep: characterId === 1 ? 2 : 1 };

      // engine 経由で反映する（キャラの traitModifiers を効かせるため）
      setPendingPuttState({ ...applyMinigameResult(base, delta), puttResult: result });
    }

    setPuttPhase('result');
  }, [puttPhase, puttSlopeInfo, puttAimIndex, pendingPuttState, characterId, puttFocus]);

  /**
   * 縦方向のドラッグ量を 0〜1 に変換する。上に引くほど強い。
   *
   * 引かずに離しただけ（誤タップ）でも判定を走らせると引き量0で必ずミスになり、
   * ラウンドの山場が事故で終わる。最低量まで引いていなければ何もせず引き直させる。
   * Capture 版で応答を取るのは、この UI が ScrollView の中にあり、
   * 縦のドラッグをスクロールに奪われるのを防ぐため。
   */
  const puttPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderMove: (_e, g) => {
          if (swingLockedRef.current) return;
          const v = Math.max(0, Math.min(1, g.dx / PUTT_PULL_RANGE));
          puttPullRef.current = v;
          setPuttPull(v);
        },
        onPanResponderRelease: () => {
          if (puttPullRef.current < PUTT_PULL_MIN) {
            puttPullRef.current = 0;
            setPuttPull(0);
            return;
          }
          handlePuttRelease();
        },
        onPanResponderTerminate: () => {
          // 途中で奪われたら打たずに戻す
          puttPullRef.current = 0;
          setPuttPull(0);
        },
      }),
    [handlePuttRelease]
  );

  // ===== Lunch handlers =====
  const handleSeatSelect = useCallback((seat: SeatId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSeat(seat);
    // 相手が後座りの場合、残り席からランダム
    if (!opponentFirst) {
      const remaining = ALL_SEATS.filter((s) => s !== seat);
      setOpponentSeatId(remaining[Math.floor(Math.random() * remaining.length)]);
    }
    setLunchSeatPhase('menu');
  }, [opponentFirst]);

  const handleMenuSelect = useCallback((menuId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMenuId(menuId);

    // Calculate lunch result text (save for display after char event)
    const result = calcLunchResult(lunchLayout, selectedSeat!, opponentSeatId, menuId, characterId);

    const menuName = menuItems.find((m) => m.id === menuId)?.name ?? '';
    const seatLabel = layoutSeats[lunchLayout].find((s) => s.id === selectedSeat)?.label ?? '';
    setLunchResultText(result.resultText);

    // Apply lunch bias and show character lunch event
    const newState = applyLunchBiasOnly(
      gameState, lunchLayout, selectedSeat!, opponentSeatId, menuId,
    );
    const lunchEvt = selectEvent(newState);
    if (lunchEvt) {
      setGameState(newState);
      setCurrentEvent(lunchEvt);
      setLunchSubPhase('event');
      setChoosing(true);
      resetUI();
    } else {
      // No char lunch event → show result directly
      setLunchSeatPhase('result');
    }
  }, [lunchLayout, selectedSeat, opponentSeatId, characterId, gameState, resetUI]);

  const handleLunchDone = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // 昼食総括 → 後半へ
    const advancedState = { ...gameState, currentHole: 6, phase: 'back' as const };
    advanceToNext(advancedState);
  }, [gameState, advanceToNext]);

  // ===== 長い選択肢のための省スペース表示 =====
  // 選択肢が長いと3択目が画面外に出て見比べられなくなる。対策は2段構え:
  //  1. ヘッダーと重複しているフェーズタグを常に出さない（全イベントで68pt稼ぐ）
  //  2. それでも足りないときだけ顔を縮める（+26pt。顔は反応を見る表示なので最小限に）
  //
  // 判定は画面の実寸から計算する。固定値にすると小型端末で効かなかった。
  //  - 選択肢の上端までに使う高さ: 実測 385pt（375幅）／414pt（320幅）。狭いほど説明文が
  //    折り返して下がるので、余裕を見て 415 を使う
  //  - 1行に入る文字数も幅で変わる（実測: 320幅で20字、375幅で24字 → (幅-60)/13）
  //  - 選択肢1件の高さ: 上下パディング28pt ＋ 1行20pt ＋ 間隔8pt
  const CHOICES_TOP_OFFSET = 415;
  const charsPerLine = Math.max(12, Math.floor((windowWidth - 60) / 13));
  const choicesEstimatedHeight = useMemo(() => {
    if (!currentEvent) return 0;
    return currentEvent.choices.reduce(
      (sum, c) => sum + 28 + Math.ceil(c.text.length / charsPerLine) * 20 + 8,
      0
    );
  }, [currentEvent, charsPerLine]);
  const compactLayout = choicesEstimatedHeight > windowHeight - CHOICES_TOP_OFFSET;

  // 画面が高いとき、固定pxのまま上詰めで並べると下が空く（430×932 で下3割が空白だった）。
  // iPhone SE 相当の 667pt を基準に、余った高さの分だけ顔と余白を広げて埋める。
  // compactLayout（内容が入りきらない）のときは逆に詰めたいので効かせない。
  const roomyScale = compactLayout
    ? 1
    : Math.min(1.4, Math.max(1, windowHeight / 667));
  const faceScale = compactLayout ? 1.4 : 2.5 * roomyScale;
  const roomyGap = Math.round(16 * roomyScale);
  const roomyPad = Math.round(14 * roomyScale);

  // 320幅ではヘッダーの氏名がホールマップのカードを画面外へ押し出していた。
  // 「外資エリート・アレクサンダー・スミス」は18字あり、fontSize 18 では
  // 名前だけで幅を使い切る。
  //
  // 画面幅で切るのではなく「入るかどうか」で判定する。末尾を省略すると
  // 「外資エリート・アレクサン…」のように本人の名前が消えてしまうため、
  // 入らないときは役割を落として呼び名にする（役割はプロフィール画面で読める。
  // callName は最長5字）。
  const narrowLayout = windowWidth < 360;
  const nameFontSize = narrowLayout ? 16 : 18;
  const holeMapSize = narrowLayout
    ? { width: 46, height: 34 }
    : { width: 56, height: 42 };
  // ホールマップのカードの実測幅（狭い版 110pt / 通常 124pt）と左右の余白を引いた残り
  const nameRoom = windowWidth - 32 - (narrowLayout ? 110 : 124) - 8;
  const headerName =
    character.name.length * nameFontSize <= nameRoom
      ? character.name
      : character.callName;

  // ===== Display helpers =====
  const phaseLabel = isAceRound
    ? '相談ラウンド'
    : gameState.currentHole <= 4 ? '前半'
    : gameState.phase === 'lunch' ? '昼休憩'
    : '後半';

  const holeDisplay = isAceRound
    ? `${gameState.currentHole}/${ACE_HOLE_COUNT}`
    : gameState.currentHole <= 4
      ? `${gameState.currentHole}/4`
      : gameState.currentHole >= 6
        ? `${gameState.currentHole - 5}/4`
        : '';

  // Seat layout helpers
  const allSeats = useMemo(() => layoutSeats[lunchLayout], [lunchLayout]);
  const isSquare = lunchLayout === 'square';
  const isPerpendicular = lunchLayout === 'perpendicular';
  // For parallel only: 2+2 grid (window row + entrance row)
  const topRow = useMemo(() => {
    if (isSquare || isPerpendicular) return [];
    return allSeats.filter((s) => s.isWindowSide).slice(0, 2);
  }, [allSeats, isSquare, isPerpendicular]);
  const bottomRow = useMemo(() => {
    if (isSquare || isPerpendicular) return [];
    return allSeats.filter((s) => !s.isWindowSide).slice(0, 2);
  }, [allSeats, isSquare, isPerpendicular]);
  // Individual seats by ID (for square & perpendicular)
  const seatA = useMemo(() => allSeats.find((s) => s.id === 'A')!, [allSeats]);
  const seatB = useMemo(() => allSeats.find((s) => s.id === 'B')!, [allSeats]);
  const seatC = useMemo(() => allSeats.find((s) => s.id === 'C')!, [allSeats]);
  const seatD = useMemo(() => allSeats.find((s) => s.id === 'D')!, [allSeats]);

  // ===== Seat button renderer (competition style) =====
  const renderSeatBtn = useCallback((sid: SeatId) => {
    const isOpponent = opponentSeatId === sid;
    const seatInfo = allSeats.find((s) => s.id === sid);
    const label = seatInfo?.label ?? sid;

    if (isOpponent) {
      return (
        <View style={styles.compSeatOccupied}>
          <FaceSprite mood={3} scale={1.2} characterId={characterId} />
          <Text style={styles.compSeatOccupiedLabel}>{label}</Text>
        </View>
      );
    }

    return (
      <Pressable
        style={({ pressed }) => [styles.compSeatBtn, pressed && styles.compSeatBtnPressed]}
        onPress={() => handleSeatSelect(sid)}
      >
        <Text style={styles.compSeatChairIcon}>{'\uD83E\uDE91'}</Text>
        <Text style={styles.compSeatBtnText}>{label}</Text>
      </Pressable>
    );
  }, [opponentSeatId, allSeats, characterId, handleSeatSelect]);

  // ===== Result seat renderer (shows player/opponent/empty) =====
  const renderResultSeat = useCallback((sid: SeatId) => {
    const isPlayer = sid === selectedSeat;
    const isOpp = sid === opponentSeatId;
    const seatInfo = allSeats.find((s) => s.id === sid);
    const label = seatInfo?.label ?? sid;

    return (
      <View style={[
        styles.resultSeatBox,
        isPlayer && styles.resultSeatBoxPlayer,
        isOpp && styles.resultSeatBoxOpp,
      ]}>
        <Text style={styles.resultSeatBoxEmoji}>
          {isPlayer ? '\uD83D\uDC64' : isOpp ? '\uD83C\uDFCC' : '\uD83E\uDE91'}
        </Text>
        <Text style={[
          styles.resultSeatBoxName,
          isPlayer && styles.resultSeatBoxNamePlayer,
          isOpp && styles.resultSeatBoxNameOpp,
        ]}>
          {isPlayer ? 'あなた' : isOpp ? character.name.slice(0, 4) : label}
        </Text>
      </View>
    );
  }, [selectedSeat, opponentSeatId, allSeats, character.name]);

  // ===== Render: Morning shot mini-game =====
  if (morningPhase !== null) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {creepVignetteOpacity > 0 && (
          <View style={[styles.vignetteOverlay, { opacity: creepVignetteOpacity }]} pointerEvents="none" />
        )}

        <HoleMapModal
          visible={holeMapVisible}
          characterId={characterId}
          currentHole={gameState.currentHole}
          onClose={() => setHoleMapVisible(false)}
        />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.compHeader}>
            <View style={styles.compHeaderLeft}>
              <Text
                style={[styles.compHeaderName, narrowLayout && styles.compHeaderNameNarrow]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {headerName}
              </Text>
              {store.aceBalls > 0 && (
                <View style={styles.aceBallBadge}>
                  <Text style={styles.aceBallText}>ACE x{store.aceBalls}</Text>
                </View>
              )}
            </View>
            {courseHole ? (
              <Pressable
                style={({ pressed }) => [styles.holeMapBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setHoleMapVisible(true)}
              >
                <View style={styles.holeMapBtnMap}>
                  <HoleMap layout={courseHole} {...holeMapSize} />
                </View>
                <View style={styles.holeMapBtnInfo}>
                  <Text style={styles.holeMapBtnPhase}>前半 1/4</Text>
                  <Text style={styles.holeMapBtnPar}>P{courseHole.par} · {courseHole.yards}y</Text>
                </View>
              </Pressable>
            ) : (
              <Text style={styles.compHeaderPhase}>前半 1/4</Text>
            )}
          </View>

          {/* Phase tag */}
          <View style={styles.phaseTag}>
            <Text style={styles.phaseTagText}>前半 1/4</Text>
          </View>

          {/* Face */}
          <View style={[styles.faceCenter, { marginVertical: roomyGap }]}>
            <FaceSprite mood={mood} scale={faceScale} characterId={characterId} />
          </View>

          {/* Hole view (always visible during morning shot) */}
          {courseHole && (
            <View style={styles.morningHoleViewWrap}>
              <MorningShotView
                layout={courseHole}
                width={260}
                height={170}
                result={
                  morningPhase === 'own_shot_result'
                    ? (pendingMorningState?.ownShot ?? null)
                    : null
                }
              />
            </View>
          )}

          {/* Intro */}
          {morningPhase === 'own_shot_intro' && (
            <View style={styles.eventBox}>
              <View style={styles.morningBadge}>
                <Text style={styles.morningBadgeText}>朝イチのショット</Text>
              </View>
              <Text style={styles.eventBoxTitle}>さあ、自分の番だ</Text>
              <Text style={styles.eventBoxDesc}>
                ティーグラウンドに立つ。スイングのタイミングが大切だ——
              </Text>
            </View>
          )}

          {/* Swing mini-game */}
          {morningPhase === 'own_shot_swing' && (
            <View>
              <View style={styles.eventBox}>
                <View style={styles.morningBadge}>
                  <Text style={styles.morningBadgeText}>朝イチのショット</Text>
                </View>
                <Text style={styles.eventBoxTitle}>スイング！</Text>
                <Text style={styles.eventBoxDesc}>バーが中央に来たときにタップ</Text>
              </View>

              <Pressable style={styles.swingArea} onPress={handleSwingTap}>
                <View style={styles.swingZoneLabels}>
                  <Text style={styles.swingZoneMiss}>MISS</Text>
                  <Text style={styles.swingZoneGood}>GOOD</Text>
                  <Text style={styles.swingZonePerfect}>PERFECT</Text>
                  <Text style={styles.swingZoneGood}>GOOD</Text>
                  <Text style={styles.swingZoneMiss}>MISS</Text>
                </View>

                {/* ゾーン幅は判定に使う数値そのもの。集中力が低いと目に見えて狭くなる */}
                <View style={styles.swingTrack}>
                  <View style={[styles.swingZoneHighlight, styles.swingZoneHighlightGood, zoneStyle(ownShotZone.good)]} />
                  <View style={[styles.swingZoneHighlight, styles.swingZoneHighlightPerfect, zoneStyle(ownShotZone.perfect)]} />
                  <Animated.View
                    style={[
                      styles.swingIndicator,
                      {
                        left: swingBarAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['2%', '88%'],
                        }),
                      },
                    ]}
                  />
                </View>

                <Text style={styles.swingTapHint}>タップ！</Text>
              </Pressable>
            </View>
          )}

          {/* Own shot result */}
          {morningPhase === 'own_shot_result' && (
            <View style={styles.eventBox}>
              <Text style={styles.ownShotResultLabel}>
                {pendingMorningState?.ownShot === 'perfect'
                  ? 'PERFECT！'
                  : pendingMorningState?.ownShot === 'good'
                  ? 'GOOD'
                  : 'MISS...'}
              </Text>
              <Text style={styles.eventBoxDesc}>{ownShotResultText}</Text>
            </View>
          )}
        </ScrollView>

        {/* Progress dots */}
        <View style={styles.progressBar}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                (i + 1) <= gameState.currentHole ? styles.dotActive : styles.dotInactive,
                (i + 1) === 5 && styles.dotLunch,
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ===== Render: Final Putt mini-game =====
  if (puttPhase !== null) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {creepVignetteOpacity > 0 && (
          <View style={[styles.vignetteOverlay, { opacity: creepVignetteOpacity }]} pointerEvents="none" />
        )}

        <HoleMapModal
          visible={holeMapVisible}
          characterId={characterId}
          currentHole={gameState.currentHole}
          onClose={() => setHoleMapVisible(false)}
        />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.compHeader}>
            <View style={styles.compHeaderLeft}>
              <Text
                style={[styles.compHeaderName, narrowLayout && styles.compHeaderNameNarrow]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {headerName}
              </Text>
              {store.aceBalls > 0 && (
                <View style={styles.aceBallBadge}>
                  <Text style={styles.aceBallText}>ACE x{store.aceBalls}</Text>
                </View>
              )}
            </View>
            {courseHole ? (
              <Pressable
                style={({ pressed }) => [styles.holeMapBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setHoleMapVisible(true)}
              >
                <View style={styles.holeMapBtnMap}>
                  <HoleMap layout={courseHole} {...holeMapSize} />
                </View>
                <View style={styles.holeMapBtnInfo}>
                  <Text style={styles.holeMapBtnPhase}>後半 4/4</Text>
                  <Text style={styles.holeMapBtnPar}>P{courseHole.par} · {courseHole.yards}y</Text>
                </View>
              </Pressable>
            ) : (
              <Text style={styles.compHeaderPhase}>後半 9</Text>
            )}
          </View>

          {/* Phase tag */}
          <View style={styles.phaseTag}>
            <Text style={styles.phaseTagText}>後半 4/4</Text>
          </View>

          {/* Face */}
          <View style={[styles.faceCenter, { marginVertical: roomyGap }]}>
            <FaceSprite mood={4} scale={faceScale} characterId={characterId} />
          </View>

          {/* Green view (visible during both putt phases) */}
          {puttSlopeInfo && (
            <View style={styles.puttGreenViewWrap}>
              <PuttGreenView
                slope={puttSlopeInfo.slope}
                aim={puttAimToValue(puttAimIndex)}
                result={
                  puttPhase === 'result' ? (pendingPuttState?.puttResult ?? null) : null
                }
                width={260}
                height={200}
              />
            </View>
          )}

          {/* Power tap phase */}
          {puttPhase === 'power_tap' && (
            <View>
              <View style={styles.eventBox}>
                <View style={styles.puttBadge}>
                  <Text style={styles.puttBadgeText}>最終パット</Text>
                </View>
                <Text style={styles.eventBoxTitle}>強さを決める</Text>
                <Text style={styles.eventBoxDesc}>
                  {puttSlopeInfo?.slope === 'uphill'
                    ? '上りだ。しっかり引いて、離す'
                    : puttSlopeInfo?.slope === 'flat'
                      ? '平ら。引きすぎるとオーバーする'
                      : '曲がる。少し強めに引いて、離す'}
                </Text>
              </View>

              {/* 引いて離す。朝イチのタップと操作を分けるため、縦のスワイプ量で強さを決める */}
              <View style={styles.puttPullArea} {...puttPan.panHandlers}>
                {/* ヒントはゲージの上。下に置くと画面下端で切れる */}
                <Text style={styles.swingTapHint}>
                  {puttPull > 0.02 ? '離す！' : '右へ引く'}
                </Text>
                <View style={styles.puttPullGaugeWrap}>
                  <View style={styles.puttPullGauge}>
                    <View
                      style={[
                        styles.puttPullZone,
                        styles.puttPullZoneGood,
                        powerZoneStyle(
                          puttSlopeInfo ? PUTT_POWER_TARGET[puttSlopeInfo.slope] : 0.5,
                          puttZone.good
                        ),
                      ]}
                    />
                    <View
                      style={[
                        styles.puttPullZone,
                        styles.puttPullZonePerfect,
                        powerZoneStyle(
                          puttSlopeInfo ? PUTT_POWER_TARGET[puttSlopeInfo.slope] : 0.5,
                          puttZone.perfect
                        ),
                      ]}
                    />
                    <View style={[styles.puttPullFill, { width: `${puttPull * 100}%` }]} />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Result phase */}
          {puttPhase === 'result' && (
            <View style={styles.eventBox}>
              <Text style={styles.ownShotResultLabel}>{puttResultLabel}</Text>
              <Text style={styles.eventBoxDesc}>{puttResultText}</Text>
            </View>
          )}
        </ScrollView>

        {/* Progress dots */}
        <View style={styles.progressBar}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                (i + 1) <= gameState.currentHole ? styles.dotActive : styles.dotInactive,
                (i + 1) === 5 && styles.dotLunch,
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ===== Render: Lunch mini-game =====
  if (lunchSubPhase === 'mini') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Creep vignette */}
        {creepVignetteOpacity > 0 && (
          <View style={[styles.vignetteOverlay, { opacity: creepVignetteOpacity }]} pointerEvents="none" />
        )}

        {/* Face bar */}
        <View style={styles.faceBar}>
          <View style={styles.faceWrap}>
            <FaceSprite mood={mood} scale={2} characterId={characterId} />
          </View>
          <View style={styles.faceBarInfo}>
            <Text style={styles.faceBarName}>{character.name}</Text>
            <Text style={styles.faceBarPhase}>昼休憩</Text>
          </View>
          {store.aceBalls > 0 && (
            <View style={styles.aceBallBadge}>
              <Text style={styles.aceBallText}>ACE x{store.aceBalls}</Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {lunchSeatPhase !== 'result' && (
            <View style={styles.situationCard}>
              <Text style={styles.situationTitle}>昼休憩 - クラブハウス食堂</Text>
              <Text style={styles.situationDesc}>
                テーブルに案内された。{'\n'}
                {opponentFirst
                  ? `${character.name}さんはすでに座っている。`
                  : '先に好きな席を選ぼう。'}
              </Text>
            </View>
          )}

          {/* Seat selection (competition style) */}
          {lunchSeatPhase === 'seat' && (
            <View>
              <Text style={styles.lunchPrompt}>席を選んでください</Text>

              <View style={styles.restaurantLayout}>
                {/* Window label */}
                <View style={styles.compWindowLabel}>
                  <Text style={styles.compWindowLabelText}>≡≡≡ 窓 ≡≡≡</Text>
                </View>

                {isSquare ? (
                  <View style={styles.compSquareLayout}>
                    {renderSeatBtn('A')}
                    <View style={styles.compSquareMiddleRow}>
                      {renderSeatBtn('D')}
                      <View style={styles.compSquareTable} />
                      {renderSeatBtn('B')}
                    </View>
                    {renderSeatBtn('C')}
                  </View>
                ) : isPerpendicular ? (
                  <View style={styles.compPerpLayout}>
                    <View style={styles.compPerpCol}>
                      {renderSeatBtn('A')}
                      {renderSeatBtn('C')}
                    </View>
                    <View style={styles.compPerpTable} />
                    <View style={styles.compPerpCol}>
                      {renderSeatBtn('B')}
                      {renderSeatBtn('D')}
                    </View>
                  </View>
                ) : (
                  <View style={styles.compParallelLayout}>
                    <View style={styles.compParallelRow}>
                      {renderSeatBtn('A')}
                      {renderSeatBtn('B')}
                    </View>
                    <View style={styles.compParallelTable} />
                    <View style={styles.compParallelRow}>
                      {renderSeatBtn('C')}
                      {renderSeatBtn('D')}
                    </View>
                  </View>
                )}

                {/* Entrance label */}
                <View style={styles.compEntranceLabel}>
                  <Text style={styles.compEntranceLabelText}>≡≡≡ 入口 ≡≡≡</Text>
                </View>
              </View>

              <Text style={styles.seatHint}>
                ※ 残りの席には紹介者・同伴者が座ります
              </Text>
            </View>
          )}

          {/* Menu selection */}
          {lunchSeatPhase === 'menu' && (
            <View>
              {opponentMenuName !== '' && (
                <View style={styles.opponentOrderBubble}>
                  <Text style={styles.opponentOrderText}>
                    {character.name}さんは「{opponentMenuName}」を注文した
                  </Text>
                </View>
              )}
              <Text style={styles.lunchPrompt}>何を頼みますか？</Text>
              <View style={styles.choicesContainer}>
                {menuItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [styles.menuItem, pressed && styles.choicePressed]}
                    onPress={() => handleMenuSelect(item.id)}
                  >
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuMeta}>
                      {MENU_GROUP_LABELS[item.group] ?? item.group}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Lunch result */}
          {lunchSeatPhase === 'result' && (
            <View style={{ alignItems: 'center' }}>
              {/* Seat layout (same structure as selection) */}
              <View style={styles.resultSeatMap}>
                <Text style={styles.resultSeatMapTitle}>座席</Text>
                <View style={styles.restaurantLayout}>
                  <View style={styles.compWindowLabel}>
                    <Text style={styles.compWindowLabelText}>≡≡≡ 窓 ≡≡≡</Text>
                  </View>

                  {isSquare ? (
                    <View style={styles.compSquareLayout}>
                      {renderResultSeat('A')}
                      <View style={styles.compSquareMiddleRow}>
                        {renderResultSeat('D')}
                        <View style={styles.compSquareTable} />
                        {renderResultSeat('B')}
                      </View>
                      {renderResultSeat('C')}
                    </View>
                  ) : isPerpendicular ? (
                    <View style={styles.compPerpLayout}>
                      <View style={styles.compPerpCol}>
                        {renderResultSeat('A')}
                        {renderResultSeat('C')}
                      </View>
                      <View style={styles.compPerpTable} />
                      <View style={styles.compPerpCol}>
                        {renderResultSeat('B')}
                        {renderResultSeat('D')}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.compParallelLayout}>
                      <View style={styles.compParallelRow}>
                        {renderResultSeat('A')}
                        {renderResultSeat('B')}
                      </View>
                      <View style={styles.compParallelTable} />
                      <View style={styles.compParallelRow}>
                        {renderResultSeat('C')}
                        {renderResultSeat('D')}
                      </View>
                    </View>
                  )}

                  <View style={styles.compEntranceLabel}>
                    <Text style={styles.compEntranceLabelText}>≡≡≡ 入口 ≡≡≡</Text>
                  </View>
                </View>
              </View>

              {/* Menu info */}
              <View style={styles.resultMenuRow}>
                <View style={styles.resultMenuCard}>
                  <Text style={styles.resultMenuWho}>あなた</Text>
                  <Text style={styles.resultMenuName}>
                    {menuItems.find((m) => m.id === selectedMenuId)?.name ?? ''}
                  </Text>
                </View>
                <View style={styles.resultMenuCard}>
                  <Text style={styles.resultMenuWho}>{character.name}</Text>
                  <Text style={styles.resultMenuName}>{opponentMenuName}</Text>
                </View>
              </View>

              {/* Result text */}
              <View style={styles.compResultTextBox}>
                <Text style={styles.compResultText}>{lunchResultText}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.compNextBtn, pressed && { opacity: 0.7 }]}
                onPress={handleLunchDone}
              >
                <Text style={styles.compNextBtnText}>後半へ</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Progress dots */}
        <View style={styles.progressBar}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                (i + 1) <= gameState.currentHole ? styles.dotActive : styles.dotInactive,
                (i + 1) === 5 && styles.dotLunch,
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ===== Render: Normal event (includes lunch event when lunchSubPhase === 'event') =====
  if (!currentEvent) return null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Creep vignette overlay */}
      {creepVignetteOpacity > 0 && (
        <View style={[styles.vignetteOverlay, { opacity: creepVignetteOpacity }]} pointerEvents="none" />
      )}

      {/* Worst flash overlay */}
      {showWorstFlash && (
        <Animated.View style={[styles.worstFlashOverlay, { opacity: worstFlashOpacity }]} pointerEvents="none" />
      )}

      {/* Insight overlay */}
      <InsightOverlay isActive={showInsight} onDone={() => setShowInsight(false)} />

      {/* Hole map modal */}
      <HoleMapModal
        visible={holeMapVisible}
        characterId={characterId}
        currentHole={gameState.currentHole}
        onClose={() => setHoleMapVisible(false)}
      />

      {/* ACE ball popup */}
      {showAceBallPopup && (
        <View style={styles.aceBallOverlay}>
          <View style={styles.aceBallPopup}>
            <Text style={styles.aceBallPopupTitle}>ACEボール</Text>
            <Text style={styles.aceBallPopupDesc}>
              ACEボールを使ってやり直しますか？{'\n'}
              残り: {store.aceBalls}個
            </Text>
            <View style={styles.aceBallPopupButtons}>
              <Pressable
                style={({ pressed }) => [styles.aceBallBtn, styles.aceBallBtnRedo, pressed && { opacity: 0.7 }]}
                onPress={handleAceBallRedo}
              >
                <Text style={styles.aceBallBtnText}>やり直す</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.aceBallBtn, styles.aceBallBtnContinue, pressed && { opacity: 0.7 }]}
                onPress={handleAceBallContinue}
              >
                <Text style={styles.aceBallBtnText}>このまま</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: baseLayerOpacity, flex: 1 }}>
          {/* Header (Competition style) */}
          <View style={styles.compHeader}>
            <View style={styles.compHeaderLeft}>
              <Text
                style={[styles.compHeaderName, narrowLayout && styles.compHeaderNameNarrow]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {headerName}
              </Text>
              {store.aceBalls > 0 && (
                <View style={styles.aceBallBadge}>
                  <Text style={styles.aceBallText}>ACE x{store.aceBalls}</Text>
                </View>
              )}
            </View>
            {courseHole ? (
              <Pressable
                style={({ pressed }) => [styles.holeMapBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setHoleMapVisible(true)}
              >
                <View style={styles.holeMapBtnMap}>
                  <HoleMap layout={courseHole} {...holeMapSize} />
                </View>
                <View style={styles.holeMapBtnInfo}>
                  <Text style={styles.holeMapBtnPhase}>{phaseLabel} {holeDisplay}</Text>
                  <Text style={styles.holeMapBtnPar}>P{courseHole.par} · {courseHole.yards}y</Text>
                </View>
              </Pressable>
            ) : (
              <Text style={styles.compHeaderPhase}>{phaseLabel} {holeDisplay}</Text>
            )}
          </View>

          {/* フェーズ表示はヘッダー右上のカードと同じ内容なので、中央のタグは置かない
              （選択肢の表示領域を38pt空けるため。iPhone SE 相当では長文3択が収まらなかった） */}

          {/* Centered face (Competition style) */}
          <View
            style={[
              styles.faceCenter,
              compactLayout && styles.faceCenterCompact,
              !compactLayout && { marginVertical: roomyGap },
            ]}
          >
            <FaceSprite
              mood={moodOverride ?? mood}
              scale={faceScale}
              characterId={characterId}
              anim={faceAnim}
            />
          </View>

          {/* Event card */}
          <View style={[styles.eventBox, { padding: roomyGap, marginBottom: roomyGap }]}>
            {currentEvent.id.startsWith('morning_shot_') && (
              <View style={styles.morningBadge}>
                <Text style={styles.morningBadgeText}>朝イチのショット</Text>
              </View>
            )}
            {currentEvent.id.startsWith('putting_event_') && (
              <View style={styles.puttBadge}>
                <Text style={styles.puttBadgeText}>最終パット</Text>
              </View>
            )}
            <Text style={styles.eventBoxTitle}>{currentEvent.title}</Text>
            <Text style={styles.eventBoxDesc}>{currentEvent.description}</Text>
          </View>

          {/* Selected choice text (during reaction) */}
          {!choosing && selectedChoiceText !== '' && (
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

          {/* 余った高さは選択肢の上に集める。ボタンが下に寄って親指で届きやすくなり、
              内容が入りきらないときは flex:1 が 0 に潰れて従来どおり上詰めになる */}
          {!compactLayout && <View style={styles.slackSpacer} />}

          {/* Choices (visible but disabled during reaction, like Competition) */}
          <View style={styles.choicesContainer}>
            {currentEvent.choices.map((choice, i) => {
              const allowed = isChoiceAllowed(gameState, choice);
              const disabled = !choosing || !allowed;
              return (
                <Pressable
                  key={i}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.choiceButton,
                    { padding: roomyPad },
                    !allowed && styles.choiceDisabled,
                    !choosing && styles.choiceReacting,
                    pressed && allowed && choosing && styles.choicePressed,
                  ]}
                  onPress={() => handleChoice(i)}
                >
                  <Text style={[
                    styles.choiceText,
                    !allowed && styles.choiceDisabledText,
                    !choosing && styles.choiceReactingText,
                  ]}>
                    {choice.text}
                    {!allowed && choosing ? ' （これ以上は危険…）' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 余りの一部は選択肢の下にも残す。ボタンが画面の端に貼り付くのを避ける */}
          {!compactLayout && <View style={styles.slackSpacerBottom} />}
        </Animated.View>
      </ScrollView>

      {/* Speech overlay (Competition style) */}
      {showSpeech && speechText && (
        <View style={styles.reactionOverlayContainer} pointerEvents="none">
          <Animated.View style={[
            styles.reactionSpeechBubble,
            { opacity: speechOpacity, transform: [{ scale: speechScale }] },
          ]}>
            <Text style={styles.reactionSpeechText}>
              {'\u300C'}{speechText}{'\u300D'}
            </Text>
          </Animated.View>
        </View>
      )}

      {/* Gesture overlay (Competition style)
          相手が本音を隠したターンでは、この仕草だけが手がかりになる。
          言葉と食い違っていることに気づけるよう色を変えて目立たせる */}
      {showGesture && gestureText && (
        <View style={styles.gestureOverlayContainer} pointerEvents="none">
          <Animated.View style={[styles.gestureOverlayContent, { opacity: gestureOpacity }]}>
            <Text style={[styles.gestureOverlayText, gestureIsTell && styles.gestureOverlayTell]}>
              {gestureIsNarration ? gestureText : `*${gestureText}*`}
            </Text>
          </Animated.View>
        </View>
      )}

      {/* 内なる声 — 相手の言葉ではなく自分の声なので、鍵括弧も仕草の枠も使わない。
          迎合が通って摩耗が溜まったビートにだけ出る */}
      {showSpeech && innerVoice && (
        <View style={styles.innerVoiceContainer} pointerEvents="none">
          <Animated.View style={{ opacity: innerVoiceOpacity }}>
            <Text style={styles.innerVoiceText}>{innerVoice}</Text>
          </Animated.View>
        </View>
      )}

      {/* Quote overlay (名言演出) */}
      {quoteMode && (
        <Animated.View style={[styles.quoteOverlay, { opacity: quoteOpacity }]}>
          <Text style={styles.quoteText}>{'\u300C'}{quoteText}{'\u300D'}</Text>
          <Text style={styles.quoteSignature}>— ACE —</Text>
        </Animated.View>
      )}

      {/* Character closing overlay (Tanaka / Onizuka) */}
      {charClosingMode && (
        <Animated.View style={[styles.quoteOverlay, { opacity: charClosingOpacity }]}>
          <View style={styles.preRoundFaceWrap}>
            <FaceSprite mood={4} scale={2} characterId={characterId} />
          </View>
          <Text style={styles.charClosingText}>
            {'\u300C'}{charClosingSpeech}{'\u300D'}
          </Text>
          {charClosingGesture && (
            <Text style={styles.charClosingGesture}>
              *{charClosingGesture}*
            </Text>
          )}
        </Animated.View>
      )}

      {/* Progress dots */}
      <View style={styles.progressBar}>
        {Array.from({ length: isAceRound ? ACE_HOLE_COUNT : 9 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              (i + 1) <= gameState.currentHole ? styles.dotActive : styles.dotInactive,
              !isAceRound && (i + 1) === 5 && styles.dotLunch,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    // 固定pxの積み上げだけだと、画面が高いほど余りが下に溜まる
    // （430×932 で下3割が空白になっていた）。余った高さは上下に均等に配る。
    // 内容が画面より高いときは flexGrow で伸びた分がゼロになるので、
    // 従来どおり上端から並んでスクロールする。
    flexGrow: 1,
  },
  // ===== Overlays =====
  quoteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    zIndex: 150,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  quoteText: {
    color: '#F5E6C8',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 16,
  },
  quoteSignature: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
  worstFlashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 101,
  },
  // ===== Situation card =====
  situationCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  situationTitle: {
    color: COLORS.textCream,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  situationDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  // ===== Lunch =====
  lunchPrompt: {
    color: COLORS.textCream,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  seatRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  seat: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  seatOccupied: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  seatSelectable: {
    backgroundColor: 'rgba(93,58,26,0.5)',
    borderWidth: 1,
    borderColor: COLORS.woodLight,
  },
  seatPressed: {
    backgroundColor: 'rgba(93,58,26,0.8)',
  },
  seatName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  seatSub: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    marginTop: 2,
  },
  seatSelectText: {
    color: COLORS.textCream,
    fontSize: 13,
    fontWeight: '700',
  },
  seatSelectSub: {
    color: 'rgba(245,230,200,0.6)',
    fontSize: 10,
    marginTop: 2,
  },
  seatHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  tableBody: {
    backgroundColor: 'rgba(139,105,20,0.3)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139,105,20,0.5)',
    paddingVertical: 8,
    marginVertical: 4,
    alignItems: 'center',
  },
  tableText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 4,
  },
  // ===== Square layout (cross pattern) =====
  squareGrid: {
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  squareCenterRow: {
    alignItems: 'center',
  },
  squareMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  squareSeat: {
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    minHeight: 52,
  },
  squareTableBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(139,105,20,0.3)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139,105,20,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareTableText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '600',
  },
  // ===== Perpendicular layout (vertical table, seats left/right) =====
  perpGrid: {
    alignItems: 'center',
    gap: 0,
    marginVertical: 4,
  },
  perpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perpSeat: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  perpTableBox: {
    width: 60,
    height: 52,
    backgroundColor: 'rgba(139,105,20,0.3)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139,105,20,0.5)',
  },
  // ===== Choices =====
  slackSpacer: {
    flex: 1,
  },
  slackSpacerBottom: {
    flex: 0.45,
  },
  choicesContainer: {
    gap: 8,
    marginBottom: 16,
  },
  choiceButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  choicePressed: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  choiceDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  choiceText: {
    color: '#1a472a',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  choiceDisabledText: {
    color: '#999',
  },
  menuItem: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  menuName: {
    color: COLORS.textCream,
    fontSize: 14,
    fontWeight: '600',
  },
  menuMeta: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 2,
  },
  // ===== Opponent order bubble =====
  opponentOrderBubble: {
    backgroundColor: 'rgba(255,183,77,0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,183,77,0.4)',
    padding: 12,
    marginBottom: 12,
  },
  opponentOrderText: {
    color: '#FFB74D',
    fontSize: 13,
    textAlign: 'center',
  },
  // ===== Face bar =====
  faceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  faceWrap: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 4,
  },
  faceBarInfo: {
    flex: 1,
  },
  faceBarName: {
    color: COLORS.textCream,
    fontSize: 15,
    fontWeight: '700',
  },
  faceBarPhase: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  // ===== ACE ball badge =====
  aceBallBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
    // 残弾数なので潰させない（縮むのは氏名側）
    flexShrink: 0,
  },
  aceBallText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  // ===== ACE ball popup =====
  aceBallOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  aceBallPopup: {
    // 以前は COLORS.cardBg（8%の白）でほぼ透明だったため、
    // 後ろのセリフや仕草が透けて文字が読めなかった。不透明な板にする。
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
  aceBallPopupTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  aceBallPopupDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  aceBallPopupButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  aceBallBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  aceBallBtnRedo: {
    backgroundColor: 'rgba(255,215,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.6)',
  },
  aceBallBtnContinue: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  aceBallBtnText: {
    color: COLORS.textCream,
    fontSize: 14,
    fontWeight: '600',
  },
  // ===== Speech =====
  speechBubble: {
    backgroundColor: COLORS.speechBubble,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  speechText: {
    color: COLORS.textCream,
    fontSize: 15,
    lineHeight: 22,
  },
  gestureContainer: {
    backgroundColor: COLORS.gestureBg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  gestureText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  // ===== Competition-style header & layout =====
  compHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    // 氏名側だけが縮むようにする。minWidth を 0 にしないと
    // Text の内容が最小幅として効いて、右のカードを押し出してしまう
    flex: 1,
    minWidth: 0,
  },
  compHeaderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    flexShrink: 1,
  },
  compHeaderNameNarrow: {
    fontSize: 16,
  },
  compHeaderPhase: {
    fontSize: 14,
    color: '#a8d5a2',
  },
  holeMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // 情報表示なので縮ませない（縮むのは氏名側）
    flexShrink: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 200, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  holeMapBtnMap: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  holeMapBtnInfo: {
    alignItems: 'flex-end',
  },
  holeMapBtnPhase: {
    fontSize: 12,
    color: '#a8d5a2',
    fontWeight: '700',
  },
  holeMapBtnPar: {
    fontSize: 10,
    color: 'rgba(245, 230, 200, 0.7)',
  },
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
  phaseTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  eventBox: {
    backgroundColor: '#2d6a3f',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  eventBoxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  eventBoxDesc: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 22,
  },
  // ===== Competition-style face & reaction overlays =====
  faceCenter: {
    alignItems: 'center',
    marginVertical: 16,
  },
  faceCenterCompact: {
    marginVertical: 6,
  },
  selectedChoiceRow: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectedChoiceText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  choiceReacting: {
    opacity: 0.8,
  },
  choiceReactingText: {
    color: 'rgba(255,255,255,0.4)',
  },
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
  gestureOverlayContent: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  // 本音の手がかりになっている仕草。言葉と食い違っているサイン
  /**
   * パットの引き — 横ゲージ。
   * 朝イチも横バーだが、あちらは「動くバーを止める」、こちらは「引いて離す」で操作が違う。
   * 縦引きより横引きの方が持ち方に無理がない。
   */
  puttPullArea: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  puttPullGaugeWrap: {
    alignItems: 'center',
    width: '100%',
  },
  puttPullGauge: {
    width: '86%',
    height: 46,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  puttPullZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  puttPullZoneGood: {
    backgroundColor: 'rgba(80, 170, 220, 0.30)',
  },
  puttPullZonePerfect: {
    backgroundColor: 'rgba(220, 200, 90, 0.45)',
  },
  puttPullFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  gestureOverlayTell: {
    color: '#FFD700',
    fontWeight: '700',
  },
  /** 内なる声。相手の仕草より下・より暗く置いて、自分の内側の声だと分かるようにする */
  innerVoiceContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 96,
    zIndex: 51,
  },
  innerVoiceText: {
    fontSize: 12,
    color: 'rgba(200,210,200,0.55)',
    textAlign: 'center',
  },
  gestureOverlayText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // ===== Progress dots =====
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: COLORS.dotActive,
  },
  dotInactive: {
    backgroundColor: COLORS.dotInactive,
  },
  dotLunch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // ===== Competition-style restaurant layout =====
  restaurantLayout: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  compWindowLabel: {
    backgroundColor: 'rgba(135,206,250,0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(135,206,250,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  compWindowLabelText: {
    fontSize: 13,
    color: '#87CEFA',
    fontWeight: '700',
    letterSpacing: 2,
  },
  compEntranceLabel: {
    backgroundColor: 'rgba(255,183,77,0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,183,77,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  compEntranceLabelText: {
    fontSize: 13,
    color: '#FFB74D',
    fontWeight: '700',
    letterSpacing: 2,
  },
  compSeatBtn: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200,200,200,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  compSeatBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  compSeatChairIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  compSeatBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2d2418',
  },
  compSeatOccupied: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,183,77,0.15)',
    borderWidth: 1.5,
    borderColor: '#FFB74D',
  },
  compSeatOccupiedLabel: {
    fontSize: 9,
    color: '#FFB74D',
    fontWeight: '600',
    marginTop: 2,
  },
  compSquareLayout: {
    alignItems: 'center',
    gap: 6,
  },
  compSquareMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  compSquareTable: {
    width: 80,
    height: 80,
    backgroundColor: '#3d3020',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  compParallelLayout: {
    alignItems: 'center',
    gap: 4,
  },
  compParallelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  compParallelTable: {
    width: 168,
    height: 24,
    backgroundColor: '#3d3020',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  compPerpLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  compPerpTable: {
    width: 50,
    height: 172,
    backgroundColor: '#3d3020',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  compPerpCol: {
    justifyContent: 'center',
    gap: 6,
  },
  compResultTextBox: {
    backgroundColor: '#3d3020',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB74D',
    padding: 20,
    marginBottom: 20,
    width: '100%',
  },
  compResultText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  // ===== Lunch result seat map =====
  resultSeatMap: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultSeatMapTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultSeatBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  resultSeatBoxPlayer: {
    backgroundColor: 'rgba(76,175,80,0.2)',
    borderColor: '#4CAF50',
    borderWidth: 1.5,
  },
  resultSeatBoxOpp: {
    backgroundColor: 'rgba(255,183,77,0.15)',
    borderColor: '#FFB74D',
    borderWidth: 1.5,
  },
  resultSeatBoxEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  resultSeatBoxName: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
  },
  resultSeatBoxNamePlayer: {
    color: '#4CAF50',
  },
  resultSeatBoxNameOpp: {
    color: '#FFB74D',
  },
  // ===== Lunch result menu row =====
  resultMenuRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    width: '100%',
  },
  resultMenuCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultMenuWho: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    marginBottom: 2,
  },
  resultMenuName: {
    fontSize: 14,
    color: '#F5E6C8',
    fontWeight: '700',
  },
  compNextBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  compNextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a2a',
  },
  // ===== Pre-round face wrap =====
  preRoundFaceWrap: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 4,
  },
  // ===== Character closing =====
  charClosingText: {
    color: '#F5E6C8',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 32,
    marginTop: 16,
  },
  charClosingGesture: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
  // ===== Morning shot mini-game =====
  morningHoleViewWrap: {
    alignSelf: 'center',
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 200, 0.25)',
  },
  morningBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  morningBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // ===== Final Putt mini-game =====
  puttGreenViewWrap: {
    alignSelf: 'center',
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 200, 0.25)',
  },
  puttBadge: {
    backgroundColor: 'rgba(100,200,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(100,200,255,0.4)',
  },
  puttBadgeText: {
    color: '#64C8FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  swingArea: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
  },
  swingZoneLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  swingZoneMiss: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
  },
  swingZoneGood: {
    color: '#4FC3F7',
    fontSize: 10,
    fontWeight: '700',
  },
  swingZonePerfect: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  swingTrack: {
    width: '100%',
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  swingZoneHighlight: {
    position: 'absolute',
    height: '100%',
  },
  swingZoneHighlightGood: {
    left: '30%',
    width: '40%',
    backgroundColor: 'rgba(79,195,247,0.2)',
  },
  swingZoneHighlightPerfect: {
    left: '40%',
    width: '20%',
    backgroundColor: 'rgba(255,215,0,0.3)',
  },
  swingIndicator: {
    position: 'absolute',
    width: 28,
    height: 28,
    top: 8,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  swingTapHint: {
    color: COLORS.textCream,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  ownShotResultLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 12,
  },
});
