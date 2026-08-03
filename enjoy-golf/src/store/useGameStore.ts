import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { setSfxEnabled as applySfxEnabled } from '../lib/sound';
import { GameState, CharacterId, Character, CompetitionId, EntertainGrade, Tag } from '../types';
import { characters } from '../data/characters';
import { competitionOrder, competitionMap } from '../data/competitionData';
import { RUN_ALLOWED_MISSES, RUN_START_WEAR } from '../logic/wear';

/** 自己ベストの比較用。SS が最上位 */
const GRADE_RANK: Record<EntertainGrade, number> = {
  SS: 5,
  S: 4,
  A: 3,
  B: 2,
  C: 1,
  D: 0,
};

// ===== Types =====
/** 連戦の最終集計 */
export interface RunTally {
  reached: number;
  totalScore: number;
  isBest: boolean;
}

interface GameStoreState {
  unlockedCharacterIds: number[];
  contractedCharacterIds: number[];
  settings: { bgmEnabled: boolean; sfxEnabled: boolean };
  totalContracts: number;
  aceBalls: number;
  /** ACEボールの説明を一度でも出したか。初回だけ出すために持つ */
  aceBallExplained: boolean;
  competitionCleared: Record<string, boolean>;
  roundsSinceLastCompetition: number;
  aceQuotes: string[];
  cooldowns: Record<number, number>;
  wear: number;
  /**
   * 相手ごとに「一緒に回って分かったこと」。
   * 刺さった手のタグと、怒らせた手のタグを溜めていく。
   * 周回するほど読む材料が増え、次に会うときプロフィールで読み返せる。
   */
  discovered: Record<number, { liked: Tag[]; hated: Tag[] }>;
  /**
   * 相手ごとの自己ベスト。
   * グレードは SS（田中・鬼塚の特別条件）を含み score から導けないので別に持つ。
   */
  personalBest: Record<number, { score: number; grade: EntertainGrade }>;
  /** 相手ごとに回った回数。契約の成否は問わない */
  roundsPlayed: Record<number, number>;
  /**
   * 連戦の自己ベスト。到達人数が同じなら合計スコアで比べる。
   * 進行中の `run` は保存しない（途中で閉じた状態を復元しても整合が取れない）。
   */
  bestRun: { reached: number; totalScore: number } | null;
  /** もらった道具の id。相手ごとの条件を満たすと増える */
  ownedItems: string[];
  /**
   * 進行中の連戦。保存しない。
   * 途中で閉じた状態を復元しても「どのラウンドの途中だったか」が分からず整合が取れない。
   */
  run: {
    order: CharacterId[];
    /** 何ラウンド目か（並びの位置） */
    index: number;
    /** 契約できた人数。これが連戦のスコア */
    reached: number;
    /** 落とした回数。RUN_ALLOWED_MISSES を超えたら終了 */
    misses: number;
    totalScore: number;
    /** 連戦前の摩耗。終わったらここへ戻す */
    wearBefore: number;
  } | null;
}

interface GameStoreActions {
  unlockCharacter: (id: number) => void;
  addContract: () => void;
  addContractForCharacter: (id: CharacterId) => CharacterId[];
  useAceBall: () => void;
  /** ACEボールの説明を出し終えたことを記録する */
  markAceBallExplained: () => void;
  /** 本音を見抜いたご褒美に1個増やす（上限は ACE_BALL_MAX） */
  gainAceBall: () => boolean;
  refillAceBalls: () => void;
  setLastGameState: (state: GameState | null) => void;
  getLastGameState: () => GameState | null;
  // ACE quotes
  saveQuoteIfNew: (quote: string) => void;
  // Competition
  markCompetitionCleared: (id: CompetitionId) => void;
  incrementRoundCounter: () => void;
  onCompetitionStart: () => void;
  isCompetitionCleared: (id: CompetitionId) => boolean;
  isCompetitionAvailable: () => boolean;
  getNextCompetition: () => CompetitionId | null;
  getClearedCompetitions: () => CompetitionId[];
  // Cooldown
  handleRoundComplete: (characterId: CharacterId) => void;
  getCooldown: (characterId: CharacterId) => number;
  // Wear
  getWear: () => number;
  addWear: (delta: number) => void;
  recordDiscoveries: (charId: CharacterId, liked: Tag[], hated: Tag[]) => void;
  /** 効果音のオン・オフ。保存され、次に開いたときも引き継がれる */
  setSfxEnabled: (v: boolean) => void;
  getDiscovered: (charId: CharacterId) => { liked: Tag[]; hated: Tag[] };
  // ===== 成績 =====
  /** ラウンド1回分の成績を記録する。自己ベストの更新判定は呼び出し前に getPersonalBest で行う */
  recordRoundResult: (charId: CharacterId, score: number, grade: EntertainGrade) => void;
  getPersonalBest: (charId: CharacterId) => { score: number; grade: EntertainGrade } | null;
  getRoundsPlayed: (charId: CharacterId) => number;
  /** 道具をもらう。すでに持っているものは無視する */
  grantItems: (ids: string[]) => void;
  // ===== 連戦 =====
  /** 連戦をはじめる。契約済みから並びを引き、摩耗を初期値に置く */
  startRun: () => CharacterId[];
  /**
   * 連戦の1ラウンドを締める。続くなら次の相手、終わりなら最終集計を返す。
   *
   * 「進める」と「終える」を1本にしているのは、分けると
   * setState が非同期なせいで終了時に最後の1件を取りこぼすため
   * （`advanceRun` の直後に `endRun` を呼ぶと、後者が更新前の集計を読む）。
   *
   * @param exhausted 摩耗が限界に達したか。契約できていても打ち切る
   */
  finishRunRound: (
    score: number,
    contracted: boolean,
    exhausted: boolean
  ) => { next: CharacterId } | { ended: RunTally };
  /** 連戦を途中で放棄する。摩耗だけ元に戻し、記録は残さない */
  abandonRun: () => void;
  getRun: () => GameStoreState['run'];
  // Reset
  resetAll: () => void;
}

interface GameStoreContextValue extends GameStoreState, GameStoreActions {
  hydrated: boolean;
}

export const ACE_BALL_MAX = 2;
const COMPETITION_COOLDOWN = 5;

const INITIAL_STATE: GameStoreState = {
  unlockedCharacterIds: [1, 2, 3],
  contractedCharacterIds: [],
  settings: { bgmEnabled: true, sfxEnabled: true },
  totalContracts: 0,
  aceBalls: 0,
  aceBallExplained: false,
  competitionCleared: {},
  roundsSinceLastCompetition: 0,
  aceQuotes: [],
  cooldowns: {},
  wear: 10,
  discovered: {},
  personalBest: {},
  roundsPlayed: {},
  bestRun: null,
  ownedItems: [],
  run: null,
};

const STORAGE_KEY = 'enjoy-golf-store';

// ===== Unlock check (from globalState.ts canUnlock) =====
function canUnlockCheck(
  char: Character,
  contractedIds: number[],
  competitionCleared: Record<string, boolean>,
): boolean {
  const cond = char.unlockBy;
  switch (cond.type) {
    case 'starter':
      return true;
    case 'contractWith':
      return contractedIds.includes(cond.id);
    case 'contractWithAny':
      return cond.ids.some((id) => contractedIds.includes(id));
    case 'totalContractsAtLeast':
      return contractedIds.length >= cond.count;
    case 'competitionClear':
      return !!competitionCleared[cond.competitionId];
  }
}

// ===== Platform storage =====
async function loadState(): Promise<GameStoreState | null> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = localStorage.getItem(STORAGE_KEY);
    } else {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      raw = await AsyncStorage.getItem(STORAGE_KEY);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_STATE,
      ...parsed,
      contractedCharacterIds: parsed.contractedCharacterIds ?? [],
      aceBalls: parsed.aceBalls ?? 0,
      aceBallExplained: parsed.aceBallExplained ?? false,
      competitionCleared: parsed.competitionCleared ?? {},
      roundsSinceLastCompetition: parsed.roundsSinceLastCompetition ?? 0,
      aceQuotes: parsed.aceQuotes ?? [],
      cooldowns: parsed.cooldowns ?? {},
      // 保存データが壊れていても範囲外の摩耗を持ち込ませない
      wear: Math.max(0, Math.min(100, parsed.wear ?? 10)),
      discovered: parsed.discovered ?? {},
      personalBest: parsed.personalBest ?? {},
      roundsPlayed: parsed.roundsPlayed ?? {},
      bestRun: parsed.bestRun ?? null,
      ownedItems: parsed.ownedItems ?? [],
      run: null,
    };
  } catch {
    return null;
  }
}

async function saveState(state: GameStoreState): Promise<void> {
  try {
    // 進行中の連戦は保存しない（復元しても整合が取れないので、読む側でも捨てている）
    const { run: _run, ...persisted } = state;
    const raw = JSON.stringify(persisted);
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEY, raw);
    } else {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(STORAGE_KEY, raw);
    }
  } catch {
    // silent
  }
}

// ===== Context =====
const GameStoreContext = createContext<GameStoreContextValue | null>(null);

export function GameStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameStoreState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const lastGameStateRef = useRef<GameState | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    loadState().then((saved) => {
      if (saved) setState(saved);
      // 保存されている設定を鳴らす側にも伝える。ここを忘れると
      // 「オフにして閉じたのに次に開くと鳴る」ことになる
      applySfxEnabled(saved?.settings?.sfxEnabled ?? true);
      setHydrated(true);
    });
  }, []);

  // Save on change (skip initial)
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const unlockCharacter = useCallback((id: number) => {
    setState((prev) => {
      if (prev.unlockedCharacterIds.includes(id)) return prev;
      return { ...prev, unlockedCharacterIds: [...prev.unlockedCharacterIds, id] };
    });
  }, []);

  const addContract = useCallback(() => {
    setState((prev) => ({ ...prev, totalContracts: prev.totalContracts + 1 }));
  }, []);

  const addContractForCharacter = useCallback((id: CharacterId): CharacterId[] => {
    const snapshot = stateRef.current;
    if (snapshot.contractedCharacterIds.includes(id)) return [];

    // 戻り値（解放演出に渡すリスト）は呼び出し時点の値から求める
    const beforeUnlocked = new Set(
      characters
        .filter((c) => canUnlockCheck(c, snapshot.contractedCharacterIds, snapshot.competitionCleared))
        .map((c) => c.id)
    );
    const revealedForCaller = characters
      .filter(
        (c) =>
          canUnlockCheck(c, [...snapshot.contractedCharacterIds, id], snapshot.competitionCleared) &&
          !beforeUnlocked.has(c.id)
      )
      .map((c) => c.id);

    // 実際の更新は必ず関数形で行う。
    // stateRef.current のスナップショットで全体を置き換えると、同じ tick で
    // 先に積まれた更新が消える。実際に markCompetitionCleared → この関数の順で
    // 呼ばれる結果画面で competitionCleared が巻き戻り、コンペをクリアしても
    // 対象キャラが解放されない不具合が出ていた（ResultScreenSimple でも
    // incrementRoundCounter と handleRoundComplete が同様に消えていた）。
    setState((prev) => {
      if (prev.contractedCharacterIds.includes(id)) return prev;

      const newContractedIds = [...prev.contractedCharacterIds, id];
      const before = new Set(
        characters
          .filter((c) => canUnlockCheck(c, prev.contractedCharacterIds, prev.competitionCleared))
          .map((c) => c.id)
      );
      const newlyRevealed = characters
        .filter(
          (c) => canUnlockCheck(c, newContractedIds, prev.competitionCleared) && !before.has(c.id)
        )
        .map((c) => c.id);

      // ACE contract → refill balls
      const aceChar = characters.find((c) => c.isAce);
      const isAceContract = aceChar?.id === id;

      return {
        ...prev,
        contractedCharacterIds: newContractedIds,
        totalContracts: prev.totalContracts + 1,
        unlockedCharacterIds: [
          ...new Set([...prev.unlockedCharacterIds, ...newlyRevealed]),
        ],
        aceBalls: isAceContract ? ACE_BALL_MAX : prev.aceBalls,
      };
    });

    return revealedForCaller;
  }, []);

  const useAceBallFn = useCallback(() => {
    setState((prev) => {
      if (prev.aceBalls <= 0) return prev;
      return { ...prev, aceBalls: prev.aceBalls - 1 };
    });
  }, []);

  // 相手の本音を見抜いたときの報酬。すでに上限なら false を返す（演出も出さない）
  //
  // 以前は setState の更新関数の中で ref を立て、その直後に ref を読んで
  // 戻り値にしていた。React は更新関数を必ず同期実行するわけではないので
  // （同じ tick に他の更新が積まれていると遅延する）、ボールは増えたのに
  // false が返り、獲得の演出が出ないことがあった。
  // 判定は同期的に読める stateRef から行う。
  const gainAceBallFn = useCallback(() => {
    if (stateRef.current.aceBalls >= ACE_BALL_MAX) return false;
    setState((prev) =>
      prev.aceBalls >= ACE_BALL_MAX
        ? prev
        : { ...prev, aceBalls: prev.aceBalls + 1 }
    );
    return true;
  }, []);

  const markAceBallExplainedFn = useCallback(() => {
    setState((prev) =>
      prev.aceBallExplained ? prev : { ...prev, aceBallExplained: true }
    );
  }, []);

  const refillAceBallsFn = useCallback(() => {
    setState((prev) => ({ ...prev, aceBalls: ACE_BALL_MAX }));
  }, []);

  const setLastGameState = useCallback((s: GameState | null) => {
    lastGameStateRef.current = s;
  }, []);

  const getLastGameState = useCallback((): GameState | null => {
    return lastGameStateRef.current;
  }, []);

  // ===== ACE quotes =====
  const saveQuoteIfNewFn = useCallback((quote: string) => {
    setState((prev) => {
      if (prev.aceQuotes.includes(quote)) return prev;
      return { ...prev, aceQuotes: [...prev.aceQuotes, quote] };
    });
  }, []);

  // ===== Competition actions =====
  const markCompetitionClearedFn = useCallback((id: CompetitionId) => {
    setState((prev) => {
      if (prev.competitionCleared[id]) return prev;
      const newCleared = { ...prev.competitionCleared, [id]: true };
      // Check if competition clear unlocks any new characters
      const beforeUnlocked = new Set(
        characters.filter((c) => canUnlockCheck(c, prev.contractedCharacterIds, prev.competitionCleared)).map((c) => c.id)
      );
      const newlyRevealed = characters
        .filter((c) => canUnlockCheck(c, prev.contractedCharacterIds, newCleared) && !beforeUnlocked.has(c.id))
        .map((c) => c.id);
      return {
        ...prev,
        competitionCleared: newCleared,
        unlockedCharacterIds: [
          ...new Set([...prev.unlockedCharacterIds, ...newlyRevealed]),
        ],
      };
    });
  }, []);

  const incrementRoundCounterFn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      roundsSinceLastCompetition: prev.roundsSinceLastCompetition + 1,
    }));
  }, []);

  const onCompetitionStartFn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      roundsSinceLastCompetition: 0,
    }));
  }, []);

  const isCompetitionClearedFn = useCallback((id: CompetitionId): boolean => {
    return !!stateRef.current.competitionCleared[id];
  }, []);

  const isCompetitionAvailableFn = useCallback((): boolean => {
    return stateRef.current.roundsSinceLastCompetition >= COMPETITION_COOLDOWN;
  }, []);

  const getNextCompetitionFn = useCallback((): CompetitionId | null => {
    const cur = stateRef.current;
    for (const id of competitionOrder) {
      if (!cur.competitionCleared[id]) {
        const comp = competitionMap.get(id);
        if (comp && cur.contractedCharacterIds.includes(comp.referrerId)) {
          return id;
        }
      }
    }
    return null;
  }, []);

  const getClearedCompetitionsFn = useCallback((): CompetitionId[] => {
    const cur = stateRef.current;
    return competitionOrder.filter((id) => !!cur.competitionCleared[id]);
  }, []);

  // ===== Cooldown actions =====
  const handleRoundCompleteFn = useCallback((charId: CharacterId) => {
    setState((prev) => {
      const newCooldowns: Record<number, number> = {};
      // 既存クールダウンを1減らす（0以下は削除）
      for (const [id, val] of Object.entries(prev.cooldowns)) {
        const newVal = val - 1;
        if (newVal > 0) {
          newCooldowns[Number(id)] = newVal;
        }
      }
      // プレイしたキャラにクールダウン2をセット
      newCooldowns[charId] = 2;
      return { ...prev, cooldowns: newCooldowns };
    });
  }, []);

  const getCooldownFn = useCallback((charId: CharacterId): number => {
    return stateRef.current.cooldowns[charId] ?? 0;
  }, []);

  // ===== Wear =====
  const getWearFn = useCallback((): number => {
    return stateRef.current.wear;
  }, []);

  const addWearFn = useCallback((delta: number) => {
    setState((prev) => ({
      ...prev,
      wear: Math.max(0, Math.min(100, prev.wear + delta)),
    }));
  }, []);

  /**
   * 効果音のオン・オフ。
   * 保存するだけでなく、鳴らす側（`lib/sound`）にも即座に伝える。
   * 保存フィールドはもともとあったが、読む経路も書く経路も無かった。
   */
  const setSfxEnabledFn = useCallback((v: boolean) => {
    applySfxEnabled(v);
    setState((prev) => ({ ...prev, settings: { ...prev.settings, sfxEnabled: v } }));
  }, []);

  /**
   * そのラウンドで分かったことを足す。
   * 同じタグを何度も溜めても意味がないので重複は除く。
   */
  const recordDiscoveriesFn = useCallback(
    (charId: CharacterId, liked: Tag[], hated: Tag[]) => {
      if (!liked.length && !hated.length) return;
      setState((prev) => {
        const cur = prev.discovered[charId] ?? { liked: [], hated: [] };
        return {
          ...prev,
          discovered: {
            ...prev.discovered,
            [charId]: {
              liked: [...new Set([...cur.liked, ...liked])],
              hated: [...new Set([...cur.hated, ...hated])],
            },
          },
        };
      });
    },
    []
  );

  const getDiscoveredFn = useCallback(
    (charId: CharacterId) =>
      stateRef.current.discovered[charId] ?? { liked: [], hated: [] },
    []
  );

  /**
   * ラウンド1回分の成績を記録する。
   *
   * これまで `calcResult` がグレードと接待スコアを毎回計算していたのに、
   * 保存も表示もせず捨てていた。狙う数字が無いので、契約済みの相手を
   * 再訪して得られるものが文字通りゼロだった。
   *
   * 自己ベストを更新したかは呼び出し側で表示したいので、
   * 記録の**前**に `getPersonalBest` を読ませる（ここでは返さない）。
   */
  const recordRoundResultFn = useCallback(
    (charId: CharacterId, score: number, grade: EntertainGrade) => {
      setState((prev) => {
        const prevBest = prev.personalBest[charId];
        // グレードを先に見る。SS は「S かつ特別条件かつ7%」なので
        // スコアだけで比べると、85でSSを取ったあと92でSを取った瞬間に
        // SS が記録から消える
        const better =
          !prevBest ||
          GRADE_RANK[grade] > GRADE_RANK[prevBest.grade] ||
          (GRADE_RANK[grade] === GRADE_RANK[prevBest.grade] &&
            score > prevBest.score);
        const nextBest = better ? { score, grade } : prevBest;
        return {
          ...prev,
          personalBest: { ...prev.personalBest, [charId]: nextBest },
          roundsPlayed: {
            ...prev.roundsPlayed,
            [charId]: (prev.roundsPlayed[charId] ?? 0) + 1,
          },
        };
      });
    },
    []
  );

  const getPersonalBestFn = useCallback(
    (charId: CharacterId) => stateRef.current.personalBest[charId] ?? null,
    []
  );

  const getRoundsPlayedFn = useCallback(
    (charId: CharacterId) => stateRef.current.roundsPlayed[charId] ?? 0,
    []
  );

  const grantItemsFn = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setState((prev) => ({
      ...prev,
      ownedItems: [...new Set([...prev.ownedItems, ...ids])],
    }));
  }, []);

  // ===== 連戦 =====
  //
  // 21人と契約したあとに何も残らないのを埋めるモード。
  // ラウンドそのものは通常と同一なので、進行は結果画面の分岐で繋ぐ。

  /**
   * 契約済みから重複なしの並びを引く。
   *
   * 銀座（`isAce`）は除く。相談ラウンドは5ホールで必ず成立扱いなので、
   * 連戦に混ざると「落とせない相手」が並びに入って判定が成立しない
   * （実機で銀座が1人目に来て相談ラウンドが始まり、連戦が宙に浮いた）。
   */
  const drawRunOrder = (contracted: CharacterId[]): CharacterId[] => {
    const aceIds = new Set(characters.filter((c) => c.isAce).map((c) => c.id));
    const pool = contracted.filter((id) => !aceIds.has(id));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  };

  const startRunFn = useCallback((): CharacterId[] => {
    const cur = stateRef.current;
    const order = drawRunOrder(cur.contractedCharacterIds);
    setState((prev) => ({
      ...prev,
      // 通常プレイの摩耗を持ち込むと「疲れているから連戦できない」になって窮屈。
      // 初期値から始め、終わったら元に戻す
      wear: RUN_START_WEAR,
      run: {
        order,
        index: 0,
        reached: 0,
        misses: 0,
        totalScore: 0,
        // すでに連戦中なら、そのときの `wearBefore` を引き継ぐ。
        // `prev.wear` を入れると連戦中の摩耗（10＋蓄積）が
        // 「連戦前の値」として記録され、本来の摩耗が永久に失われる。
        // ブラウザの戻るなどで `abandonRun` を通らずに抜けると起きる
        wearBefore: prev.run ? prev.run.wearBefore : prev.wear,
      },
    }));
    return order;
  }, []);

  const finishRunRoundFn = useCallback(
    (
      score: number,
      contracted: boolean,
      exhausted: boolean
    ): { next: CharacterId } | { ended: RunTally } => {
      const cur = stateRef.current;
      const run = cur.run;
      if (!run) return { ended: { reached: 0, totalScore: 0, isBest: false } };

      const misses = run.misses + (contracted ? 0 : 1);
      const reached = run.reached + (contracted ? 1 : 0);
      const totalScore = run.totalScore + score;
      const over = misses > RUN_ALLOWED_MISSES || exhausted;

      if (over) {
        const prevBest = cur.bestRun;
        const isBest =
          !prevBest ||
          reached > prevBest.reached ||
          (reached === prevBest.reached && totalScore > prevBest.totalScore);
        setState((prev) => ({
          ...prev,
          wear: prev.run ? prev.run.wearBefore : prev.wear,
          bestRun: isBest ? { reached, totalScore } : prev.bestRun,
          run: null,
        }));
        return { ended: { reached, totalScore, isBest } };
      }

      // 並びを使い切ったら引き直す。連戦は人数ではなく「どこまで続くか」を競う
      const nextIndex = run.index + 1;
      const wrapped = nextIndex >= run.order.length;
      const order = wrapped
        ? drawRunOrder(cur.contractedCharacterIds)
        : run.order;
      const index = wrapped ? 0 : nextIndex;

      setState((prev) =>
        prev.run
          ? {
              ...prev,
              run: { ...prev.run, order, index, reached, misses, totalScore },
            }
          : prev
      );
      return { next: order[index] };
    },
    []
  );

  /** 途中で抜けたとき。摩耗だけ戻し、記録は残さない */
  const abandonRunFn = useCallback(() => {
    setState((prev) =>
      prev.run ? { ...prev, wear: prev.run.wearBefore, run: null } : prev
    );
  }, []);

  const getRunFn = useCallback(() => stateRef.current.run, []);

  // ===== Reset =====
  const resetAllFn = useCallback(() => {
    setState({ ...INITIAL_STATE });
    lastGameStateRef.current = null;
  }, []);

  const value = useMemo<GameStoreContextValue>(
    () => ({
      ...state,
      hydrated,
      unlockCharacter,
      addContract,
      addContractForCharacter,
      useAceBall: useAceBallFn,
      gainAceBall: gainAceBallFn,
      markAceBallExplained: markAceBallExplainedFn,
      refillAceBalls: refillAceBallsFn,
      setLastGameState,
      getLastGameState,
      saveQuoteIfNew: saveQuoteIfNewFn,
      markCompetitionCleared: markCompetitionClearedFn,
      incrementRoundCounter: incrementRoundCounterFn,
      onCompetitionStart: onCompetitionStartFn,
      isCompetitionCleared: isCompetitionClearedFn,
      isCompetitionAvailable: isCompetitionAvailableFn,
      getNextCompetition: getNextCompetitionFn,
      getClearedCompetitions: getClearedCompetitionsFn,
      handleRoundComplete: handleRoundCompleteFn,
      getCooldown: getCooldownFn,
      getWear: getWearFn,
      addWear: addWearFn,
      recordDiscoveries: recordDiscoveriesFn,
      setSfxEnabled: setSfxEnabledFn,
      getDiscovered: getDiscoveredFn,
      recordRoundResult: recordRoundResultFn,
      getPersonalBest: getPersonalBestFn,
      getRoundsPlayed: getRoundsPlayedFn,
      grantItems: grantItemsFn,
      startRun: startRunFn,
      finishRunRound: finishRunRoundFn,
      abandonRun: abandonRunFn,
      getRun: getRunFn,
      resetAll: resetAllFn,
    }),
    [state, hydrated, unlockCharacter, addContract, addContractForCharacter, useAceBallFn, refillAceBallsFn, setLastGameState, getLastGameState, saveQuoteIfNewFn, markCompetitionClearedFn, incrementRoundCounterFn, onCompetitionStartFn, isCompetitionClearedFn, isCompetitionAvailableFn, getNextCompetitionFn, getClearedCompetitionsFn, handleRoundCompleteFn, getCooldownFn, getWearFn, addWearFn, recordDiscoveriesFn, getDiscoveredFn, recordRoundResultFn, getPersonalBestFn, getRoundsPlayedFn, grantItemsFn, startRunFn, finishRunRoundFn, abandonRunFn, getRunFn, setSfxEnabledFn, markAceBallExplainedFn, resetAllFn],
  );

  return React.createElement(GameStoreContext.Provider, { value }, children);
}

export function useGameStore(): GameStoreContextValue {
  const ctx = useContext(GameStoreContext);
  if (!ctx) throw new Error('useGameStore must be used within GameStoreProvider');
  return ctx;
}
