import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { GameState, CharacterId, Character, CompetitionId } from '../types';
import { characters } from '../data/characters';
import { competitionOrder, competitionMap } from '../data/competitionData';

// ===== Types =====
interface GameStoreState {
  unlockedCharacterIds: number[];
  contractedCharacterIds: number[];
  settings: { bgmEnabled: boolean; sfxEnabled: boolean };
  totalContracts: number;
  aceBalls: number;
  competitionCleared: Record<string, boolean>;
  roundsSinceLastCompetition: number;
  aceQuotes: string[];
  cooldowns: Record<number, number>;
  wear: number;
}

interface GameStoreActions {
  unlockCharacter: (id: number) => void;
  addContract: () => void;
  addContractForCharacter: (id: CharacterId) => CharacterId[];
  useAceBall: () => void;
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
  // Reset
  resetAll: () => void;
}

interface GameStoreContextValue extends GameStoreState, GameStoreActions {
  hydrated: boolean;
}

const ACE_BALL_MAX = 2;
const COMPETITION_COOLDOWN = 5;

const INITIAL_STATE: GameStoreState = {
  unlockedCharacterIds: [1, 2, 3],
  contractedCharacterIds: [],
  settings: { bgmEnabled: true, sfxEnabled: true },
  totalContracts: 0,
  aceBalls: 0,
  competitionCleared: {},
  roundsSinceLastCompetition: 0,
  aceQuotes: [],
  cooldowns: {},
  wear: 10,
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
      competitionCleared: parsed.competitionCleared ?? {},
      roundsSinceLastCompetition: parsed.roundsSinceLastCompetition ?? 0,
      aceQuotes: parsed.aceQuotes ?? [],
      cooldowns: parsed.cooldowns ?? {},
      wear: parsed.wear ?? 10,
    };
  } catch {
    return null;
  }
}

async function saveState(state: GameStoreState): Promise<void> {
  try {
    const raw = JSON.stringify(state);
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
      resetAll: resetAllFn,
    }),
    [state, hydrated, unlockCharacter, addContract, addContractForCharacter, useAceBallFn, refillAceBallsFn, setLastGameState, getLastGameState, saveQuoteIfNewFn, markCompetitionClearedFn, incrementRoundCounterFn, onCompetitionStartFn, isCompetitionClearedFn, isCompetitionAvailableFn, getNextCompetitionFn, getClearedCompetitionsFn, handleRoundCompleteFn, getCooldownFn, getWearFn, addWearFn, resetAllFn],
  );

  return React.createElement(GameStoreContext.Provider, { value }, children);
}

export function useGameStore(): GameStoreContextValue {
  const ctx = useContext(GameStoreContext);
  if (!ctx) throw new Error('useGameStore must be used within GameStoreProvider');
  return ctx;
}
