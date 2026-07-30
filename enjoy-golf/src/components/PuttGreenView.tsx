/**
 * PuttGreenView — 最終パット用のグリーン俯瞰図＋ボール転がりアニメ
 *
 * フェーズ:
 *   - aim/power_tap: グリーン、傾斜矢印、エイムライン3本（選択済みは強調）、ボールはスタート位置で停止
 *   - result: ボールが選択エイム＋傾斜＋結果に沿った曲線で転がる
 *     - in:      ボールがカップへ吸い込まれて消える
 *     - lip_out: カップ付近で曲がって停止
 *     - miss:    エイム方向＋傾斜のままラインを外して停止
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, View, StyleSheet, Text } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Rect, Ellipse, G } from 'react-native-svg';
import { PuttAim, PuttResult, SlopeType } from '../types';

interface Props {
  slope: SlopeType;
  /** 'left' | 'center' | 'right' — power_tap では選択済みの想定 */
  aim: PuttAim;
  /** null = アイドル。値が入ると転がりアニメ起動 */
  result: PuttResult | null;
  width: number;
  height: number;
  onAnimationDone?: () => void;
}

const COLORS_GREEN = {
  rough: '#1c4a30',
  green: '#9ad77a',
  greenEdge: '#5d9b48',
  greenShadow: 'rgba(0, 0, 0, 0.18)',
  cup: '#0c0c0c',
  cupRim: '#5d4014',
  flagPole: '#f1f1f1',
  flag: '#e63946',
  ball: '#FFFFFF',
  ballEdge: '#cccccc',
  aimDim: 'rgba(245, 230, 200, 0.25)',
  aimSelected: '#FFD700',
  arrow: 'rgba(255, 255, 255, 0.55)',
  arrowAccent: '#FFD16A',
};

// 0-100 正規化空間でのレイアウト
const BALL_START: [number, number] = [50, 88];
const CUP: [number, number] = [50, 22];
const GREEN_CX = 50;
const GREEN_CY = 50;
const GREEN_RX = 38;
const GREEN_RY = 32;

/** エイム方向に応じた目標点（傾斜なしの場合の終点目安） */
function aimTarget(aim: PuttAim): [number, number] {
  switch (aim) {
    case 'left':
      return [32, 24];
    case 'right':
      return [68, 24];
    case 'center':
      return [50, 22];
  }
}

/** 二次ベジェ評価 */
function bezier2(p0: [number, number], c: [number, number], p1: [number, number], t: number): [number, number] {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
    u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
  ];
}

/** 結果別のエンドポイント・コントロールポイントを算出 */
function computePuttPath(
  aim: PuttAim,
  slope: SlopeType,
  result: PuttResult,
): { start: [number, number]; control: [number, number]; end: [number, number]; sink: boolean } {
  const start = BALL_START;
  const baseTarget = aimTarget(aim);

  // 傾斜による横方向ドリフト（中盤で曲がる量）
  const drift = slope === 'left' ? -12 : slope === 'right' ? 12 : 0;
  // uphill は到達しにくさを表現（やや手前で減速）
  const reach = slope === 'uphill' ? 0.85 : 1.0;

  // 結果に応じた終点
  let end: [number, number];
  let sink = false;
  if (result === 'in') {
    end = CUP;
    sink = true;
  } else if (result === 'lip_out') {
    // カップ近くまで来てから外れる
    end = [CUP[0] + (drift > 0 ? 6 : drift < 0 ? -6 : 4), CUP[1] + 4];
  } else {
    // miss: 狙ったライン＋傾斜のまま外す
    end = [baseTarget[0] + drift, baseTarget[1] - (1 - reach) * 8];
  }

  // 制御点: スタート→終点の中間、傾斜の影響を反映
  const mid: [number, number] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
  const control: [number, number] = [mid[0] + drift * 0.6, mid[1]];

  return { start, control, end, sink };
}

/** スロープ矢印群（グリーン上に重ねる） */
function SlopeArrows({ slope }: { slope: SlopeType }) {
  if (slope === 'flat') return null;

  // 矢印の向き（dx, dy）と表示位置（複数）
  let dx = 0;
  let dy = 0;
  if (slope === 'left') dx = -1;
  else if (slope === 'right') dx = 1;
  else if (slope === 'uphill') dy = -1;

  const positions: [number, number][] = [
    [38, 38],
    [62, 38],
    [38, 60],
    [62, 60],
    [50, 50],
  ];
  const len = 6;

  return (
    <G>
      {positions.map(([cx, cy], i) => {
        const x1 = cx - dx * len * 0.5;
        const y1 = cy - dy * len * 0.5;
        const x2 = cx + dx * len * 0.5;
        const y2 = cy + dy * len * 0.5;
        // 矢印の先端
        const headLen = 1.6;
        const px = x2 - dx * headLen;
        const py = y2 - dy * headLen;
        // 法線方向
        const nx = -dy;
        const ny = dx;
        return (
          <G key={i} opacity={0.85}>
            <Path
              d={`M ${x1} ${y1} L ${x2} ${y2}`}
              stroke={COLORS_GREEN.arrow}
              strokeWidth={0.6}
              strokeLinecap="round"
            />
            <Path
              d={`M ${x2} ${y2} L ${px + nx * 1.2} ${py + ny * 1.2} L ${px - nx * 1.2} ${py - ny * 1.2} Z`}
              fill={COLORS_GREEN.arrow}
            />
          </G>
        );
      })}
    </G>
  );
}

export function PuttGreenView({ slope, aim, result, width, height, onAnimationDone }: Props) {
  const scale = Math.min(width / 100, height / 100);
  const offsetX = (width - 100 * scale) / 2;
  const offsetY = (height - 100 * scale) / 2;

  // 0-100 → ピクセル変換
  const toPx = (p: [number, number]): [number, number] => [
    offsetX + p[0] * scale,
    offsetY + p[1] * scale,
  ];

  // 各エイムガイドの 100 空間制御点
  const aims: PuttAim[] = ['left', 'center', 'right'];
  const aimPaths = aims.map((a) => {
    const target = aimTarget(a);
    const drift = slope === 'left' ? -8 : slope === 'right' ? 8 : 0;
    const start = BALL_START;
    const mid: [number, number] = [(start[0] + target[0]) / 2 + drift * 0.5, (start[1] + target[1]) / 2];
    return { aim: a, start, mid, target };
  });

  // 結果用のパス
  const puttPath = useMemo(() => {
    if (!result) return null;
    return computePuttPath(aim, slope, result);
  }, [aim, slope, result]);

  // ボール位置
  const flightT = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!result) {
      flightT.setValue(0);
      return;
    }
    flightT.setValue(0);
    Animated.timing(flightT, {
      toValue: 1,
      duration: 1300,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && onAnimationDone) onAnimationDone();
    });
  }, [result, flightT, onAnimationDone]);

  // ボール位置を path に沿って補間
  const SAMPLE_COUNT = 24;
  const ballSamples = useMemo(() => {
    if (!puttPath) return null;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i <= SAMPLE_COUNT; i++) {
      const t = i / SAMPLE_COUNT;
      const [x, y] = bezier2(puttPath.start, puttPath.control, puttPath.end, t);
      xs.push(x);
      ys.push(y);
    }
    return { xs, ys };
  }, [puttPath]);

  const ballStartPx = toPx(BALL_START);
  const ballEndPx = puttPath ? toPx(puttPath.end) : ballStartPx;

  const ballX = result && ballSamples
    ? flightT.interpolate({
        inputRange: ballSamples.xs.map((_, i) => i / SAMPLE_COUNT),
        outputRange: ballSamples.xs.map((x) => offsetX + x * scale),
      })
    : ballStartPx[0];

  const ballY = result && ballSamples
    ? flightT.interpolate({
        inputRange: ballSamples.ys.map((_, i) => i / SAMPLE_COUNT),
        outputRange: ballSamples.ys.map((y) => offsetY + y * scale),
      })
    : ballStartPx[1];

  // sink: 結果が in のとき、終盤でボールを縮める
  const ballScale = puttPath?.sink
    ? flightT.interpolate({
        inputRange: [0, 0.85, 1],
        outputRange: [1, 1, 0],
      })
    : 1;

  const BALL_PX = 6;

  return (
    <View style={{ width, height, position: 'relative' }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="puttRough" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#22663a" />
            <Stop offset="100%" stopColor="#143a22" />
          </LinearGradient>
          <LinearGradient id="puttGreen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#a8e289" />
            <Stop offset="100%" stopColor="#7bbe5e" />
          </LinearGradient>
        </Defs>

        {/* ラフ背景 */}
        <Rect x={0} y={0} width={width} height={height} fill="url(#puttRough)" />

        {/* x/y/scale ではなく標準の transform で指定する。react-native-svg 15 は
            web で scale を transform-origin という無効な DOM 属性に変換し、
            React が毎描画で警告を出していた */}
        <G transform={`translate(${offsetX},${offsetY}) scale(${scale})`}>
          {/* グリーン本体 */}
          <Ellipse
            cx={GREEN_CX}
            cy={GREEN_CY}
            rx={GREEN_RX}
            ry={GREEN_RY}
            fill="url(#puttGreen)"
            stroke={COLORS_GREEN.greenEdge}
            strokeWidth={0.8}
          />

          {/* スロープ矢印 */}
          <SlopeArrows slope={slope} />

          {/* エイムライン3本（未選択は淡く） */}
          {aimPaths.map(({ aim: a, start, mid, target }) => {
            const isSelected = a === aim;
            return (
              <Path
                key={a}
                d={`M ${start[0]} ${start[1]} Q ${mid[0]} ${mid[1]} ${target[0]} ${target[1]}`}
                stroke={isSelected ? COLORS_GREEN.aimSelected : COLORS_GREEN.aimDim}
                strokeWidth={isSelected ? 0.9 : 0.5}
                strokeDasharray={isSelected ? '2,1.2' : '1.5,1.5'}
                fill="none"
                opacity={result ? (isSelected ? 0.5 : 0.15) : 1}
              />
            );
          })}

          {/* カップ */}
          <Circle cx={CUP[0]} cy={CUP[1]} r={2.2} fill={COLORS_GREEN.cupRim} />
          <Circle cx={CUP[0]} cy={CUP[1]} r={1.6} fill={COLORS_GREEN.cup} />

          {/* ピン（旗） */}
          <Rect x={CUP[0] - 0.2} y={CUP[1] - 12} width={0.4} height={12} fill={COLORS_GREEN.flagPole} />
          <Path
            d={`M ${CUP[0]} ${CUP[1] - 12} L ${CUP[0] + 5} ${CUP[1] - 10.5} L ${CUP[0]} ${CUP[1] - 9} Z`}
            fill={COLORS_GREEN.flag}
          />
        </G>
      </Svg>

      {/* スロープ表示テキスト */}
      <View style={styles.slopeBadge} pointerEvents="none">
        <Text style={styles.slopeBadgeText}>{slopeLabel(slope)}</Text>
      </View>

      {/* ボール */}
      <Animated.View
        style={[
          styles.ball,
          {
            left: ballX,
            top: ballY,
            width: BALL_PX,
            height: BALL_PX,
            borderRadius: BALL_PX / 2,
            marginLeft: -BALL_PX / 2,
            marginTop: -BALL_PX / 2,
            transform: [{ scale: ballScale }],
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

function slopeLabel(slope: SlopeType): string {
  switch (slope) {
    case 'left':
      return '◀ 左に傾斜';
    case 'right':
      return '右に傾斜 ▶';
    case 'flat':
      return '・ 平坦 ・';
    case 'uphill':
      return '▲ 上り';
  }
}

const styles = StyleSheet.create({
  slopeBadge: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  slopeBadgeText: {
    color: '#F5E6C8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ball: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#cccccc',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 1.2,
    shadowOffset: { width: 0, height: 1 },
  },
});
