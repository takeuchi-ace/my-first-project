/**
 * HoleMap — ホールの俯瞰図を SVG で描画
 *
 * 0–100 正規化空間で定義された HoleLayout を、指定された幅・高さに収めて描く。
 * - フェアウェイは 4 点制御の三次ベジェ曲線
 * - グリーン: 円
 * - ティー: 小さい四角
 * - ハザード: バンカー(黄)、池(青)、OB(赤の縦帯)、樹木(濃緑円)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Rect, Ellipse, G } from 'react-native-svg';
import { HoleLayout, Hazard } from '../data/holeLayouts';

const COLORS_MAP = {
  rough: '#1f5631',
  fairway: '#5fa86c',
  fairwayEdge: '#3a7a48',
  green: '#9ad77a',
  greenEdge: '#5d9b48',
  bunker: '#e8d27a',
  bunkerEdge: '#b89c4d',
  water: '#4d9ed6',
  waterEdge: '#2e7aa8',
  ob: 'rgba(220, 60, 60, 0.4)',
  obEdge: '#c34040',
  tree: '#1a3d22',
  treeEdge: '#0d2614',
  flag: '#e63946',
  flagPole: '#f1f1f1',
  tee: '#f5e6c8',
  teeEdge: '#a08552',
  pathLine: 'rgba(245, 230, 200, 0.45)',
};

interface Props {
  layout: HoleLayout;
  width: number;
  height: number;
  /** 距離・パー表示を入れるか */
  showInfo?: boolean;
  /** ハザードラベルを入れる（large 表示用） */
  showLabels?: boolean;
}

const FAIRWAY_WIDTH = 14; // 0-100 正規化空間でのフェアウェイ幅

/** 4 点制御の中央線から、両側にオフセットしたフェアウェイ帯を path d で生成 */
function buildFairwayPath(path: [number, number][]): string {
  if (path.length < 4) return '';
  const [p0, p1, p2, p3] = path;

  // 各セグメントの法線方向にオフセット
  const offset = (
    [x, y]: [number, number],
    [tx, ty]: [number, number],
    side: 1 | -1,
  ): [number, number] => {
    const dx = tx - x;
    const dy = ty - y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return [x + nx * FAIRWAY_WIDTH * side, y + ny * FAIRWAY_WIDTH * side];
  };

  const right0 = offset(p0, p1, 1);
  const right1 = offset(p1, p2, 1);
  const right2 = offset(p2, p3, 1);
  const right3 = offset(p3, p2, -1);

  const left0 = offset(p0, p1, -1);
  const left1 = offset(p1, p2, -1);
  const left2 = offset(p2, p3, -1);
  const left3 = offset(p3, p2, 1);

  // 右側: tee → green を進む / 左側: green → tee で戻る
  return [
    `M ${right0[0]} ${right0[1]}`,
    `C ${right1[0]} ${right1[1]}, ${right2[0]} ${right2[1]}, ${right3[0]} ${right3[1]}`,
    `L ${left3[0]} ${left3[1]}`,
    `C ${left2[0]} ${left2[1]}, ${left1[0]} ${left1[1]}, ${left0[0]} ${left0[1]}`,
    'Z',
  ].join(' ');
}

function HazardShape({ hazard, scale }: { hazard: Hazard; scale: number }) {
  const cx = hazard.cx * scale;
  const cy = hazard.cy * scale;
  const rx = hazard.rx * scale;
  const ry = hazard.ry * scale;

  switch (hazard.type) {
    case 'bunker':
      return (
        <Ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={COLORS_MAP.bunker}
          stroke={COLORS_MAP.bunkerEdge}
          strokeWidth={0.6 * scale * 0.06}
        />
      );
    case 'water':
      return (
        <Ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={COLORS_MAP.water}
          stroke={COLORS_MAP.waterEdge}
          strokeWidth={0.6 * scale * 0.06}
        />
      );
    case 'ob':
      return (
        <Rect
          x={cx - rx}
          y={cy - ry}
          width={rx * 2}
          height={ry * 2}
          fill={COLORS_MAP.ob}
          stroke={COLORS_MAP.obEdge}
          strokeWidth={0.4 * scale * 0.06}
          strokeDasharray={`${0.6 * scale * 0.06},${0.4 * scale * 0.06}`}
        />
      );
    case 'tree':
      return (
        <Ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={COLORS_MAP.tree}
          stroke={COLORS_MAP.treeEdge}
          strokeWidth={0.4 * scale * 0.06}
        />
      );
  }
}

export function HoleMap({ layout, width, height, showInfo = false }: Props) {
  // 0-100 → ビューポート空間
  const sx = width / 100;
  const sy = height / 100;
  // 等方スケールで描く（縦横比が崩れないよう、小さい方に合わせる）
  const scale = Math.min(sx, sy);
  const offsetX = (width - 100 * scale) / 2;
  const offsetY = (height - 100 * scale) / 2;

  const fairwayPath = buildFairwayPath(layout.path);
  const tee = layout.path[0];
  const green = layout.path[3];

  return (
    <View style={{ width, height, position: 'relative' }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="rough" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#22663a" />
            <Stop offset="100%" stopColor="#173f24" />
          </LinearGradient>
          <LinearGradient id="fairwayGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#74c084" />
            <Stop offset="100%" stopColor="#4f9259" />
          </LinearGradient>
        </Defs>

        {/* ラフ（背景全面） */}
        <Rect x={0} y={0} width={width} height={height} fill="url(#rough)" />

        {/* x/y/scale ではなく標準の transform で指定する。react-native-svg 15 は
            web で scale を transform-origin という無効な DOM 属性に変換し、
            React が毎描画で警告を出していた */}
        <G transform={`translate(${offsetX},${offsetY}) scale(${scale})`}>
          {/* OB を真っ先に描く（フェアウェイの下に来るよう） */}
          {layout.hazards
            .filter((h) => h.type === 'ob')
            .map((h, i) => (
              <HazardShape key={`ob-${i}`} hazard={h} scale={1} />
            ))}

          {/* フェアウェイ */}
          <Path
            d={fairwayPath}
            fill="url(#fairwayGrad)"
            stroke={COLORS_MAP.fairwayEdge}
            strokeWidth={0.6}
            strokeLinejoin="round"
          />

          {/* バンカー・池・木（フェアウェイ上） */}
          {layout.hazards
            .filter((h) => h.type !== 'ob')
            .map((h, i) => (
              <HazardShape key={`hz-${i}`} hazard={h} scale={1} />
            ))}

          {/* グリーン */}
          <Circle
            cx={green[0]}
            cy={green[1]}
            r={layout.greenR}
            fill={COLORS_MAP.green}
            stroke={COLORS_MAP.greenEdge}
            strokeWidth={0.7}
          />

          {/* ピン（旗） */}
          <Rect
            x={green[0] - 0.3}
            y={green[1] - layout.greenR * 0.7}
            width={0.6}
            height={layout.greenR * 0.85}
            fill={COLORS_MAP.flagPole}
          />
          <Path
            d={`M ${green[0]} ${green[1] - layout.greenR * 0.7} L ${green[0] + 4} ${green[1] - layout.greenR * 0.55} L ${green[0]} ${green[1] - layout.greenR * 0.4} Z`}
            fill={COLORS_MAP.flag}
          />

          {/* ティー */}
          <Rect
            x={tee[0] - 2}
            y={tee[1] - 1.5}
            width={4}
            height={3}
            fill={COLORS_MAP.tee}
            stroke={COLORS_MAP.teeEdge}
            strokeWidth={0.4}
            rx={0.5}
          />
        </G>
      </Svg>

      {showInfo && (
        <View style={styles.info} pointerEvents="none">
          <Text style={styles.infoHole}>H{layout.hole}</Text>
          <Text style={styles.infoPar}>P{layout.par}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  info: {
    position: 'absolute',
    top: 2,
    left: 4,
    flexDirection: 'row',
    gap: 4,
  },
  infoHole: {
    color: '#F5E6C8',
    fontSize: 9,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  infoPar: {
    color: '#F5E6C8',
    fontSize: 9,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
