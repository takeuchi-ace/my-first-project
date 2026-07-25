/**
 * ピクセルアバター — エクスポート + キャラ別トレイト定義
 */

import { CharacterId } from '../../types';
import { ComposedAvatar, composeAvatar, PixelTraits } from './composer';
import { COMMON_FACE, PALETTE } from '../common';

export { composeAvatar };
export type { PixelTraits, ComposedAvatar } from './composer';

/* ================================================================
   カラーパレット定義
   ================================================================ */
const HAIR = {
  black: '#1c1410',
  blackShadow: '#0f0a08',
  blackHi: '#3a2a22',
  darkBrown: '#3a2618',
  darkBrownShadow: '#2b1b12',
  darkBrownHi: '#5C3A20',
  brown: '#5C3A20',
  brownShadow: '#3a2418',
  brownHi: '#825a30',
  chestnut: '#7a4a28',
  chestnutShadow: '#4d2e18',
  chestnutHi: '#a8703a',
  gray: '#6e6c68',
  grayShadow: '#48464a',
  grayHi: '#9a9894',
  silver: '#a8a6a2',
  silverShadow: '#75736e',
  silverHi: '#cfcdc8',
  ash: '#5a5a58',
  ashShadow: '#3a3a38',
  ashHi: '#7a7a78',
  blonde: '#cda14e',
  blondeShadow: '#8a6a30',
  blondeHi: '#e6c878',
  white: '#dadad6',
  whiteShadow: '#9a9894',
  whiteHi: '#f0f0ec',
};

const SKIN = {
  light: { S: '#F1D2A8', s: '#D4A878' },
  medium: { S: '#EDCBA0', s: '#D4A870' },
  tan: { S: '#D9A87A', s: '#A87850' },
  pale: { S: '#F6E0C2', s: '#D9B888' },
};

function hairPalette(base: string, shadow: string, hi: string) {
  return { H: base, h: shadow, L: hi };
}

/* ================================================================
   キャラ別トレイト
   ================================================================ */
const TRAITS: Partial<Record<CharacterId, PixelTraits>> = {
  // 3: 二代目オーナー・坊っちゃん（おっとり、若旦那）
  3: {
    hair: 'wavy',
    palette: { ...SKIN.pale, ...hairPalette(HAIR.brown, HAIR.brownShadow, HAIR.brownHi) },
    collar: 'tie',
    tieColor: '#cda12c',
  },

  // 4: 寡黙なプロ・黒田（実力主義、寡黙）
  4: {
    hair: 'crew',
    palette: { ...SKIN.tan, ...hairPalette(HAIR.black, HAIR.blackShadow, HAIR.blackHi) },
    facialHair: 'stubble',
    facialHairColor: HAIR.black,
  },

  // 5: 外資エリート・スミス（金髪、知的）
  5: {
    hair: 'slick',
    palette: { ...SKIN.light, ...hairPalette(HAIR.blonde, HAIR.blondeShadow, HAIR.blondeHi) },
    glasses: 'half',
    collar: 'tie',
    tieColor: '#2c5d8f',
  },

  // 6: 自己啓発社長・光山（ポジティブ全開）
  6: {
    hair: 'pomade',
    palette: { ...SKIN.medium, ...hairPalette(HAIR.black, HAIR.blackShadow, HAIR.blackHi) },
    collar: 'tie',
    tieColor: '#cda12c',
  },

  // 7: 昭和の重鎮・巌（白髪、威厳、口髭）
  7: {
    hair: 'slick',
    palette: { ...SKIN.tan, ...hairPalette(HAIR.silver, HAIR.silverShadow, HAIR.silverHi) },
    facialHair: 'mustache',
    facialHairColor: HAIR.gray,
    collar: 'kimono',
    kimonoColor: '#3a2418',
  },

  // 8: テック社長・中村（眼鏡、論理派）
  8: {
    hair: 'short',
    palette: { ...SKIN.medium, ...hairPalette(HAIR.darkBrown, HAIR.darkBrownShadow, HAIR.darkBrownHi) },
    glasses: 'square',
  },

  // 9: 試し屋・佐藤（鋭い目、観察者、無精髭）
  9: {
    hair: 'slick',
    palette: { ...SKIN.medium, ...hairPalette(HAIR.ash, HAIR.ashShadow, HAIR.ashHi) },
    facialHair: 'stubble',
    facialHairColor: HAIR.gray,
  },

  // 10: ナイス松本（褒め殺し、ノリ）
  10: {
    hair: 'pomade',
    palette: { ...SKIN.medium, ...hairPalette(HAIR.chestnut, HAIR.chestnutShadow, HAIR.chestnutHi) },
    collar: 'tie',
    tieColor: '#c0392b',
  },

  // 11: 政界フィクサー・大門（フィクサー、影のある男）
  11: {
    hair: 'slick',
    palette: { ...SKIN.tan, ...hairPalette(HAIR.gray, HAIR.grayShadow, HAIR.grayHi) },
    facialHair: 'mustache',
    facialHairColor: HAIR.gray,
    collar: 'tie',
    tieColor: '#2c5d8f',
  },

  // 12: 芸能プロデューサー・星野（テンポ、エンタメ、サングラス）
  12: {
    hair: 'pomade',
    palette: { ...SKIN.medium, ...hairPalette(HAIR.darkBrown, HAIR.darkBrownShadow, HAIR.darkBrownHi) },
    glasses: 'sun',
    collar: 'tie',
    tieColor: '#c0392b',
  },

  // 13: 不動産王・金城（関西、豪快、ヤギ髭）
  13: {
    hair: 'pomade',
    palette: { ...SKIN.tan, ...hairPalette(HAIR.black, HAIR.blackShadow, HAIR.blackHi) },
    facialHair: 'goatee',
    facialHairColor: HAIR.black,
    collar: 'tie',
    tieColor: '#a6541a',
  },

  // 14: 医療法人理事長・白石（知的、観察力、丸眼鏡）
  14: {
    hair: 'short',
    palette: { ...SKIN.light, ...hairPalette(HAIR.darkBrown, HAIR.darkBrownShadow, HAIR.darkBrownHi) },
    glasses: 'round',
  },

  // 15: 老舗料亭女将・千鶴（女将、結い髪、着物）
  15: {
    hair: 'bun',
    palette: { ...SKIN.pale, ...hairPalette(HAIR.black, HAIR.blackShadow, HAIR.blackHi) },
    collar: 'kimono',
    kimonoColor: '#5a2a3a',
    earring: true,
    earringColor: '#FFD700',
  },

  // 16: ACE 弁護士・銀座 ハジメ（エース）
  16: {
    hair: 'short',
    palette: { ...SKIN.medium, ...hairPalette(HAIR.darkBrown, HAIR.darkBrownShadow, HAIR.darkBrownHi) },
    collar: 'tie',
    tieColor: '#cda12c',
  },

  // 17: IT起業家・篠原（テンポ、合理）
  17: {
    hair: 'short',
    palette: { ...SKIN.medium, ...hairPalette(HAIR.darkBrown, HAIR.darkBrownShadow, HAIR.darkBrownHi) },
  },

  // 18: マーケター・桐生 麻衣（女性、鋭い、ロング）
  18: {
    hair: 'long',
    palette: { ...SKIN.light, ...hairPalette(HAIR.darkBrown, HAIR.darkBrownShadow, HAIR.darkBrownHi) },
    earring: true,
    earringColor: '#cccccc',
  },

  // 19: 重工会長・鷹宮（威厳、実力、ヤギ髭）
  19: {
    hair: 'slick',
    palette: { ...SKIN.tan, ...hairPalette(HAIR.gray, HAIR.grayShadow, HAIR.grayHi) },
    facialHair: 'goatee',
    facialHairColor: HAIR.gray,
    collar: 'tie',
    tieColor: '#2c5d8f',
  },

  // 20: 税理士・早瀬 玲奈（論理、ボブ、眼鏡）
  20: {
    hair: 'bob',
    palette: { ...SKIN.light, ...hairPalette(HAIR.black, HAIR.blackShadow, HAIR.blackHi) },
    glasses: 'square',
  },

  // 21: 美容クリニック経営・ミツキ（明るい、共感、栗ロング）
  21: {
    hair: 'long',
    palette: { ...SKIN.pale, ...hairPalette(HAIR.chestnut, HAIR.chestnutShadow, HAIR.chestnutHi) },
    earring: true,
    earringColor: '#FFD700',
  },
};

/** キャッシュ: 同じトレイトを毎回再計算しないよう */
const CACHE = new Map<CharacterId, ComposedAvatar>();

/** キャラ別の合成アバター取得（未定義は undefined） */
export function getPixelComposite(characterId: CharacterId): ComposedAvatar | undefined {
  if (CACHE.has(characterId)) return CACHE.get(characterId);
  const traits = TRAITS[characterId];
  if (!traits) return undefined;
  const composed = composeAvatar(traits);
  CACHE.set(characterId, composed);
  return composed;
}
