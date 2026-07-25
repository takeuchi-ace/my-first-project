/**
 * ピクセルアバター コンポーザー
 *
 * COMMON_FACE をベースに、髪型・アクセサリ・パレットを差し替えて
 * キャラ専用の FaceSheet と PALETTE を生成する。
 */

import { buildFaceWithoutHair, FaceGrid, FaceSheet, PALETTE } from '../common';
import {
  HAIR_FRAGMENTS,
  HairStyleId,
  ACC_GLASSES_SQUARE,
  ACC_GLASSES_ROUND,
  ACC_GLASSES_HALF,
  ACC_GLASSES_SUN,
  ACC_MUSTACHE,
  ACC_GOATEE,
  ACC_STUBBLE,
  ACC_BEARD_FULL,
  ACC_COLLAR_TIE,
  ACC_COLLAR_BOWTIE,
  ACC_COLLAR_KIMONO,
  ACC_EARRING,
  AccessoryOverlay,
} from './fragments';
import { applyHairGrid, applyOverlayGrid } from './draw';

export type GlassesId = 'square' | 'round' | 'half' | 'sun';
export type FacialHairId = 'mustache' | 'goatee' | 'stubble' | 'beard-full';
export type CollarId = 'tie' | 'bowtie' | 'kimono';

export interface PixelTraits {
  /** 髪型（指定なければ short） */
  hair?: HairStyleId;
  /** パレット上書き。デフォルト COMMON_FACE のパレットを継承 */
  palette?: Partial<Record<string, string>>;
  /** メガネ／サングラス */
  glasses?: GlassesId;
  /** 髭 */
  facialHair?: FacialHairId;
  /** 髭の色（指定なければ髪色） */
  facialHairColor?: string;
  /** 襟・ネクタイ */
  collar?: CollarId;
  /** ネクタイ色 */
  tieColor?: string;
  /** 着物色 */
  kimonoColor?: string;
  /** ピアス */
  earring?: boolean;
  /** ピアス色 */
  earringColor?: string;
}

const ACC_GLASSES: Record<GlassesId, AccessoryOverlay> = {
  square: ACC_GLASSES_SQUARE,
  round: ACC_GLASSES_ROUND,
  half: ACC_GLASSES_HALF,
  sun: ACC_GLASSES_SUN,
};

const ACC_FACIAL: Record<FacialHairId, AccessoryOverlay> = {
  mustache: ACC_MUSTACHE,
  goatee: ACC_GOATEE,
  stubble: ACC_STUBBLE,
  'beard-full': ACC_BEARD_FULL,
};

const ACC_COLLARS: Record<CollarId, AccessoryOverlay> = {
  tie: ACC_COLLAR_TIE,
  bowtie: ACC_COLLAR_BOWTIE,
  kimono: ACC_COLLAR_KIMONO,
};

export interface ComposedAvatar {
  sheet: FaceSheet;
  palette: typeof PALETTE;
}

/** トレイトから FaceSheet と PALETTE を生成（emotion ごとに合成済み） */
export function composeAvatar(traits: PixelTraits): ComposedAvatar {
  const hairId: HairStyleId = traits.hair ?? 'short';
  const hair = HAIR_FRAGMENTS[hairId];

  // パレットの拡張: M（髭色）, T（タイ色）, K（着物色）, G（ピアス）を追加
  const palette: typeof PALETTE = {
    ...PALETTE,
    ...(traits.palette ?? {}),
    M: traits.facialHairColor ?? traits.palette?.H ?? PALETTE.H,
    T: traits.tieColor ?? '#c0392b',
    K: traits.kimonoColor ?? '#7a2538',
    k: shade(traits.kimonoColor ?? '#7a2538', -0.18),
    G: traits.earringColor ?? '#FFD700',
  };

  const emotions = ['best', 'good', 'neutral', 'bad', 'worst'] as const;
  const sheet = {} as FaceSheet;

  for (const e of emotions) {
    // ベースは「髪なしの顔」から始める。これに髪型フラグメントを乗せる。
    let grid: FaceGrid = buildFaceWithoutHair(e);
    grid = applyHairGrid(grid, hair);

    if (traits.collar) {
      grid = applyOverlayGrid(grid, ACC_COLLARS[traits.collar]);
    }
    if (traits.facialHair) {
      grid = applyOverlayGrid(grid, ACC_FACIAL[traits.facialHair]);
    }
    if (traits.glasses) {
      grid = applyOverlayGrid(grid, ACC_GLASSES[traits.glasses]);
    }
    if (traits.earring) {
      grid = applyOverlayGrid(grid, ACC_EARRING);
    }

    sheet[e] = grid;
  }

  return { sheet, palette };
}

function shade(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const r = clamp(parseInt(c.slice(0, 2), 16) + Math.floor(255 * amount));
  const g = clamp(parseInt(c.slice(2, 4), 16) + Math.floor(255 * amount));
  const b = clamp(parseInt(c.slice(4, 6), 16) + Math.floor(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const clamp = (v: number) => Math.max(0, Math.min(255, v));
