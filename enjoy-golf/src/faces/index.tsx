/**
 * FaceSprite — 32×32 ドット絵をピクセル拡大表示するコンポーネント
 *
 * 設計:
 *   - characterId を渡すとキャラ別シートに差し替え可能（将来拡張）
 *   - 共通顔 (common) をデフォルト表示
 *   - scale で 2x/3x 拡大（pixelated 表現）
 *   - Animated.Value を受け取り、バウンスアニメーションに対応
 */

import React, { useMemo } from 'react';
import { View, Image, Animated, StyleSheet, Platform } from 'react-native';
import Svg, { Rect as SvgRect } from 'react-native-svg';
import { CharacterId } from '../types';
import { COMMON_FACE, PALETTE, Emotion, FaceSheet, FaceGrid, GRID_SIZE as BASE_GRID_SIZE } from './common';
import { getSpriteSheet, SpriteSheetDef } from './spriteSheets';
import { getPixelComposite } from './pixelAvatar';

/* ================================================================
   キャラ別シート登録（将来拡張用）
   ================================================================
   import { TANAKA_FACE } from './tanaka';
   CHAR_SHEETS.set(1, TANAKA_FACE);
   ================================================================ */
const CHAR_SHEETS = new Map<CharacterId, FaceSheet>();

/** キャラ別シートがあればそれを、なければ共通を返す */
const getSheet = (charId?: CharacterId): FaceSheet =>
  charId !== undefined && CHAR_SHEETS.has(charId)
    ? CHAR_SHEETS.get(charId)!
    : COMMON_FACE;

/* ================================================================
   MoodLevel → Emotion マッピング
   GameScreen の MoodLevel (1-5) を Emotion にマップ
   ================================================================ */
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

const MOOD_TO_EMOTION: Record<MoodLevel, Emotion> = {
  5: 'best',
  4: 'good',
  3: 'neutral',
  2: 'bad',
  1: 'worst',
};

export const moodToEmotion = (mood: MoodLevel): Emotion =>
  MOOD_TO_EMOTION[mood];

/* ================================================================
   Grid renderer（メモ化）
   ================================================================ */
const GRID_SIZE = BASE_GRID_SIZE;

interface PixelGridProps {
  grid: FaceGrid;
  px: number;
  palette?: typeof PALETTE;
}

/** 64×64 のドット絵を SVG で描画（runs に圧縮して Rect 数を削減） */
function PixelGrid({ grid, px, palette = PALETTE }: PixelGridProps) {
  const size = GRID_SIZE * px;
  // 同色の水平 run を 1 つの Rect にまとめてノード数を削減
  const rects = useMemo(() => {
    const out: { key: string; x: number; y: number; w: number; color: string }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = grid[y] ?? '';
      let runStart = 0;
      let runChar: string = row[0] ?? '_';
      for (let x = 1; x <= GRID_SIZE; x++) {
        const ch = x < GRID_SIZE ? (row[x] ?? '_') : '__END__';
        if (ch !== runChar) {
          if (runChar !== '_') {
            const color = palette[runChar] ?? 'transparent';
            if (color !== 'transparent') {
              out.push({
                key: `${y}-${runStart}`,
                x: runStart,
                y,
                w: x - runStart,
                color,
              });
            }
          }
          runStart = x;
          runChar = ch;
        }
      }
    }
    return out;
  }, [grid, palette]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}>
      {rects.map((r) => (
        <SvgRect key={r.key} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </Svg>
  );
}

const pixelStyles = StyleSheet.create({
  row: { flexDirection: 'row' },
});

/* ================================================================
   SpriteFrame — スプライトシートから1フレームを切り出して表示
   ================================================================ */
interface SpriteFrameProps {
  def: SpriteSheetDef;
  emotion: Emotion;
  displaySize: number;
  /** タイトル/一覧用: 普段着フレーム（最終フレーム）を強制表示 */
  titleMode?: boolean;
}

function SpriteFrame({ def, emotion, displaySize, titleMode }: SpriteFrameProps) {
  const frameCount = def.frameCenters.length;
  let idx: number;
  if (titleMode) {
    idx = def.titleFrameIndex ?? frameCount - 1;
  } else {
    const frameIndex = def.frameOrder.indexOf(emotion);
    idx = frameIndex === -1 ? 0 : frameIndex;
  }

  const cropW = def.cropW;
  const cropH = def.cropH;
  const scaleX = displaySize / cropW;
  const scaleY = displaySize / cropH;

  // 図形中心をクロップ中心に合わせるため、左端座標を算出
  const centerX = def.frameCenters[idx] ?? def.frameCenters[0];
  const cropLeft = centerX - cropW / 2;

  // 元画像を等倍で配置し、クロップ領域が表示窓に来るよう margin で平行移動
  const totalWidth = def.imageWidth * scaleX;
  const totalHeight = def.imageHeight * scaleY;
  const marginLeft = -cropLeft * scaleX;
  const marginTop = -def.cropY * scaleY;

  return (
    <View style={{ width: displaySize, height: displaySize, overflow: 'hidden' }}>
      <Image
        source={def.source}
        style={[
          {
            width: totalWidth,
            height: totalHeight,
            marginLeft,
            marginTop,
          },
          // ドット絵を滑らかに補間させない。RN の型に無いプロパティなので
          // Web のときだけ生の CSS として渡す
          Platform.OS === 'web' && ({ imageRendering: 'pixelated' } as object),
        ]}
        resizeMode="stretch"
      />
    </View>
  );
}

/* ================================================================
   FaceSprite（公開コンポーネント）
   ================================================================ */
interface FaceSpriteProps {
  /** ムードレベル 1-5 */
  mood: MoodLevel;
  /** ピクセルサイズ（1px あたりの実 dp）— デフォルト 3 */
  scale?: number;
  /** キャラID（省略で共通顔） */
  characterId?: CharacterId;
  /** バウンスアニメーション用 */
  anim?: Animated.Value;
  /** タイトル/一覧画面用: 普段着フレーム（最終フレーム）を表示 */
  titleMode?: boolean;
}

export function FaceSprite({
  mood,
  scale = 3,
  characterId,
  anim,
  titleMode,
}: FaceSpriteProps) {
  const emotion = moodToEmotion(mood);
  // GRID_SIZE が 64 になったので、呼び出し側の scale 解釈を維持するため px は scale/2
  // 結果: size = 64 * (scale/2) = 32 * scale（旧来と同じ）
  const px = scale / 2;
  const size = GRID_SIZE * px;
  const spriteDef = characterId !== undefined ? getSpriteSheet(characterId) : undefined;
  const pixelComposite = !spriteDef && characterId !== undefined ? getPixelComposite(characterId) : undefined;

  let inner: React.ReactNode;
  if (spriteDef) {
    inner = <SpriteFrame def={spriteDef} emotion={emotion} displaySize={size} titleMode={titleMode} />;
  } else if (pixelComposite) {
    inner = <PixelGrid grid={pixelComposite.sheet[emotion]} px={px} palette={pixelComposite.palette} />;
  } else {
    inner = <PixelGrid grid={getSheet(characterId)[emotion]} px={px} />;
  }

  const content = (
    <View style={[spriteStyles.wrap, { width: size + 12, height: size + 12 }]}>
      {inner}
    </View>
  );

  if (anim) {
    return (
      <Animated.View
        style={{ transform: [{ scale: anim }], opacity: anim }}
      >
        {content}
      </Animated.View>
    );
  }

  return content;
}

const spriteStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C4A34',
    borderWidth: 2,
    borderColor: '#C9A44C',
  },
});

/* Re-export for convenience */
export { Emotion, PALETTE, COMMON_FACE } from './common';
