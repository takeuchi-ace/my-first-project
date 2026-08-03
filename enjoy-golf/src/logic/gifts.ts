/**
 * もらいものの判定
 *
 * 1ラウンド終わった時点の `GameState` と結果だけで判定する。
 * 追加の記録は持たない（`holeResults` に rank・tags・choiceText・eventId が
 * 全部残っているので、そこから読み直せる）。
 *
 * 契約成立を要件にするかは条件ごとに違う。
 *  - `score` は成否を問わない（スコアそのものが条件）
 *  - `choice` も問わない（その場面でその答えをしたことが条件）
 *  - `enrage` は**怒らせること**が条件なので、成立を求めない
 *  - それ以外は契約成立を求める
 */

import { GameState } from '../types';
import { characters } from '../data/characters';
import { GiftItem, ItemCondition, itemsByCharacter } from '../data/items';

/**
 * その条件が契約成立を要るか。`all` は中身のどれかが要るなら要る。
 *
 * `scoreMax` と `wear` は**弱っているときに気づかって渡される**ものなので、
 * 成立を求めない（振るわなかった日にしか出ない品に成立を求めたら矛盾する）。
 */
const NO_CONTRACT_KINDS = ['score', 'choice', 'enrage', 'scoreMax', 'wear'];

const needsContract = (c: ItemCondition): boolean => {
  if (c.kind === 'all') return c.of.some(needsContract);
  return !NO_CONTRACT_KINDS.includes(c.kind);
};

/** 判定に必要な、ラウンドの外にある情報 */
export interface GiftContext {
  /** 集めた名言の数 */
  quoteCount: number;
  /** ラウンドを終えた時点の摩耗 */
  wear: number;
  /** 相手がいつもの平均より何打よく回ったか（ゴルフの打数のほう） */
  improvement: number;
}

const meetsCondition = (
  c: ItemCondition,
  state: GameState,
  entertainScore: number,
  ctx: GiftContext
): boolean => {
  const character = characters.find((x) => x.id === state.characterId);

  switch (c.kind) {
    case 'score':
      return entertainScore >= c.min;

    case 'noHates': {
      if (!character) return false;
      return !state.holeResults.some((h) =>
        h.tags.some((t) => character.hatesTags.includes(t))
      );
    }

    case 'enrage':
      return (
        state.holeResults.filter((h) => h.rank === 'worst').length >= c.count
      );

    case 'choice':
      return state.holeResults.some(
        (h) => h.eventId === c.eventId && h.choiceText.includes(c.textIncludes)
      );

    case 'strategy':
      return state.strategy === c.strategyId;

    case 'mood':
      return state.roundMood === c.moodId;

    case 'puttIn':
      return state.puttResult === 'in';

    case 'perfectShot':
      return state.ownShot === 'perfect';

    case 'tagCount':
      return (
        state.holeResults.filter((h) => h.tags.includes(c.tag)).length >= c.count
      );

    case 'lowCreep':
      return state.gauge.creep <= c.max;

    case 'quotes':
      return ctx.quoteCount >= c.min;

    case 'improvement':
      return ctx.improvement >= c.min;

    case 'scoreMax':
      return entertainScore <= c.max;

    case 'wear':
      return ctx.wear >= c.min;

    case 'all':
      return c.of.every((x) => meetsCondition(x, state, entertainScore, ctx));
  }
};

/**
 * このラウンドでもらえる道具を返す（まだ持っていないものだけ）。
 *
 * @param owned すでに持っている道具の id
 */
export const evaluateGifts = (
  state: GameState,
  entertainScore: number,
  contractSuccess: boolean,
  owned: string[],
  ctx: GiftContext
): GiftItem[] => {
  const ownedSet = new Set(owned);
  return itemsByCharacter(state.characterId).filter((item) => {
    if (ownedSet.has(item.id)) return false;
    if (needsContract(item.condition) && !contractSuccess) return false;
    return meetsCondition(item.condition, state, entertainScore, ctx);
  });
};
