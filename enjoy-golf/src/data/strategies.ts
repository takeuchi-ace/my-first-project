/**
 * 今日の作戦 — ラウンド開始前に宣言する賭け
 *
 * 「一緒に回って分かったこと」は溜まるだけで使い道が無かった。
 * 知識を**賭ける**場を作ることで、周回して得たものが初めて意味を持つ。
 *
 * 効果は宣言した路線に沿って打ったときだけ乗る（`strategyMultiplier`）。
 * 外した作戦を宣言したら、路線を捨てて上振れを諦めるか、
 * 罰を飲んで押し通すかの二択になる。これが賭けの代償。
 *
 * ## タグの割り方
 *
 * 当初は4つ（まっすぐ言う／持ち上げる／盛り上げる／引いて合わせる）にしたが、
 * 「まっすぐ言う」が21人中14人に当たってしまい、
 * 直前のリバランスで壊したはずの「正直の一強」が作戦の層で復活した。
 * 誠実系を「正直に言う」と「筋を通す」に割って6つにすると最大 48% まで下がる。
 *
 * 実測（21人）: 正直7 / 筋10 / 持ち上げ2 / 笑わせ8 / 攻め3 / 引き3
 * 当たりが1つも無いキャラは0人。
 */

import { CharacterId, StrategyId, Tag } from '../types';
import { characters } from './characters';

export interface Strategy {
  id: StrategyId;
  /** 宣言のときに出す文言 */
  label: string;
  /** 宣言した直後に出る一人称の意気込み */
  vow: string;
  tags: Tag[];
}

export const STRATEGIES: Strategy[] = [
  {
    id: 'honest',
    label: '正直に言う',
    vow: '取り繕わずに、思ったことを言おう。',
    tags: ['honesty', 'self_reflect'],
  },
  {
    id: 'principle',
    label: '筋を通す',
    vow: '筋の通らないことはしない。それで嫌われるならしかたない。',
    tags: ['ethics', 'logic', 'serious', 'fair_compete'],
  },
  {
    id: 'praise',
    label: '持ち上げる',
    vow: 'とにかく立てる。気持ちよく帰ってもらおう。',
    tags: ['flattery', 'over_praise', 'over_support', 'analysis_praise'],
  },
  {
    id: 'laugh',
    label: '笑わせる',
    vow: '固くならずに、まず楽しんでもらおう。',
    tags: ['humor', 'hype', 'bro', 'team', 'ride_the_mood'],
  },
  {
    id: 'attack',
    label: '攻める',
    vow: '守りに入らない。踏み込んでこそ見えるものがある。',
    tags: ['bold', 'kiai', 'risk', 'challenge', 'adversity', 'alcohol'],
  },
  {
    id: 'adapt',
    label: '引いて合わせる',
    vow: '出しゃばらない。相手の呼吸に合わせよう。',
    tags: ['etiquette', 'safe', 'safe_play', 'avoid_risk', 'silence', 'distance', 'neutral'],
  },
];

export const getStrategy = (id: StrategyId): Strategy | null =>
  STRATEGIES.find((s) => s.id === id) ?? null;

export type StrategyFit = 'fit' | 'miss' | 'neutral';

/**
 * その作戦がその相手に合っているか。
 *
 * 好みと地雷の両方に触れる場合は好みを優先する。
 * 21人 × 6作戦で両方に触れる組み合わせは実測 0 件なので、
 * この優先は現状どこにも効かないが、今後タグを足したときの保険として置く。
 */
export const strategyFit = (
  id: StrategyId,
  characterId: CharacterId
): StrategyFit => {
  const s = getStrategy(id);
  const c = characters.find((x) => x.id === characterId);
  if (!s || !c) return 'neutral';
  if (s.tags.some((t) => c.likesTags.includes(t))) return 'fit';
  if (s.tags.some((t) => c.hatesTags.includes(t))) return 'miss';
  return 'neutral';
};

/** その選択が宣言した路線に沿っているか */
export const isOnStrategy = (id: StrategyId | null, tags: Tag[]): boolean => {
  if (!id) return false;
  const s = getStrategy(id);
  if (!s) return false;
  return tags.some((t) => s.tags.includes(t));
};

/**
 * 宣言の3択を引く。
 *
 * 6つ全部を毎回出すと「持ち上げる」（当たり2人・裏目12人）のように
 * ほぼ常に罠の札を覚えられて、実質4択に痩せる。
 * 当たり1・裏目1・残り1を引くことで、毎回どれかが正解で
 * どれかが罠という緊張を保ちつつ、出る顔ぶれが変わる。
 *
 * 地雷を持たない相手（銀座ハジメ）は裏目の札が無いので、
 * その枠は残りからランダムに埋める。
 */
export const drawStrategyOptions = (
  characterId: CharacterId,
  rand: () => number = Math.random
): Strategy[] => {
  const pick = <T,>(arr: T[]): T | null =>
    arr.length ? arr[Math.floor(rand() * arr.length)] : null;

  const fits = STRATEGIES.filter((s) => strategyFit(s.id, characterId) === 'fit');
  const misses = STRATEGIES.filter((s) => strategyFit(s.id, characterId) === 'miss');

  const chosen: Strategy[] = [];
  const fit = pick(fits);
  if (fit) chosen.push(fit);
  const miss = pick(misses.filter((s) => !chosen.includes(s)));
  if (miss) chosen.push(miss);

  const rest = STRATEGIES.filter((s) => !chosen.includes(s));
  while (chosen.length < 3 && rest.length) {
    const i = Math.floor(rand() * rest.length);
    chosen.push(rest[i]);
    rest.splice(i, 1);
  }

  // 並び順で正解が読まれないようにシャッフルする
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return chosen;
};

// ===== 効果 =====

/**
 * 係数は「知らずに適当に選んでも難易度が下がらない」ことを条件に決めた。
 *
 * 実測（技能0.5／0.65／0.8 の平均、各1470ラウンド）:
 *
 * | fit / miss / creep | 適当に選ぶ | 当たりと裏目の差 |
 * |---|---|---|
 * | 1.5 / 0.6 / 2  | **+2.0pt** | 12.7pt |
 * | 1.4 / 0.5 / 3  | ±0.0pt | 9.6pt |
 * | 1.45 / 0.45 / 3| +0.7pt | 10.5pt |
 * | **1.35 / 0.45 / 4** | **-0.4pt** | **11.7pt** |
 *
 * 当初の 1.5/0.6/2 は当たり裏目の差こそ最大だが、3択から適当に引くだけで
 * 契約率が 2pt 上がる＝宣言するだけで易しくなってしまう。
 * 裏目の罰を creep 側に寄せると、適当が中立のまま差だけ残る。
 */
/** 当たりの作戦に沿って打ったときの信頼の伸び */
export const STRATEGY_FIT_MULTIPLIER = 1.35;
/** 裏目の作戦に沿って打ったときの信頼の伸び */
export const STRATEGY_MISS_MULTIPLIER = 0.45;
/** 裏目の作戦に沿って打つと、そのたびに距離を詰めすぎる */
export const STRATEGY_MISS_CREEP = 4;

/**
 * 宣言した路線に沿った選択にだけ乗る係数。
 *
 * 路線から外れた手には乗らない。だから外した作戦を引いたときは
 * 「路線を捨てて上振れを失う」か「罰を飲んで押し通す」かを選ぶことになる。
 */
export const strategyMultiplier = (
  id: StrategyId | null,
  characterId: CharacterId,
  tags: Tag[]
): number => {
  if (!id || !isOnStrategy(id, tags)) return 1;
  const fit = strategyFit(id, characterId);
  if (fit === 'fit') return STRATEGY_FIT_MULTIPLIER;
  if (fit === 'miss') return STRATEGY_MISS_MULTIPLIER;
  return 1;
};

/** 裏目の路線に沿って打ったときに乗る creep */
export const strategyCreep = (
  id: StrategyId | null,
  characterId: CharacterId,
  tags: Tag[]
): number => {
  if (!id || !isOnStrategy(id, tags)) return 0;
  return strategyFit(id, characterId) === 'miss' ? STRATEGY_MISS_CREEP : 0;
};
