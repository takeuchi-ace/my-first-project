/**
 * MorningShotView — 朝イチショット用のホール俯瞰図＋ボール弾道アニメ
 *
 * - HoleMap で Hole 1 の俯瞰図を描画
 * - 着地点は飛距離（0〜1）と曲がり（-1〜1）から出す。
 *   飛距離はコースの中心線に沿った位置、曲がりは中心線からの横ずれ
 * - 相手の球（あれば）を先に灰色で置いておく。どちらが前かが一目で分かる
 * - 弾道は二次ベジェ。曲がりの向きへ膨らませて、フック・スライスに見せる
 * - shot プロップが null→値 に変化したタイミングでアニメ起動
 *   （shot の同一性が変わるたびに飛び直すので、親は同じオブジェクトを渡し続けること）
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { HoleLayout } from '../data/holeLayouts';
import { HoleMap } from './HoleMap';

export interface TeeShotView {
  distance: number;
  curve: number;
}

interface Props {
  layout: HoleLayout;
  width: number;
  height: number;
  /** null = ボールはティーで待機。値が入るとアニメ開始 */
  shot: TeeShotView | null;
  /** 相手の球の到達点（0〜1）。null なら置かない */
  opponentDistance: number | null;
  onAnimationDone?: () => void;
}

/** 三次ベジェの t 位置 (0-1) を 0-100 座標に変換 */
function pointOnPath(path: [number, number][], t: number): [number, number] {
  const [p0, p1, p2, p3] = path;
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  return [x, y];
}

/** path 上の t 地点での接線の法線方向（垂直の単位ベクトル） */
function normalAt(path: [number, number][], t: number): [number, number] {
  const eps = 0.001;
  const a = pointOnPath(path, Math.max(0, t - eps));
  const b = pointOnPath(path, Math.min(1, t + eps));
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [-dy / len, dx / len];
}

/** 飛距離 0〜1 を中心線上の位置に。0 でもティーより少し前（空振りでも転がる） */
const distanceToT = (d: number) => 0.2 + 0.72 * Math.max(0, Math.min(1, d));

/** 着地点（0-100 空間）。曲がりは中心線の法線方向に最大 12 ずらす */
function landingPoint(layout: HoleLayout, shot: TeeShotView): [number, number] {
  const t = distanceToT(shot.distance);
  const c = pointOnPath(layout.path, t);
  const n = normalAt(layout.path, t);
  return [c[0] + n[0] * shot.curve * 12, c[1] + n[1] * shot.curve * 12];
}

export function MorningShotView({ layout, width, height, shot, opponentDistance, onAnimationDone }: Props) {
  // 0-100 → ピクセル変換用スケール（HoleMap と同じロジック）
  const scale = Math.min(width / 100, height / 100);
  const offsetX = (width - 100 * scale) / 2;
  const offsetY = (height - 100 * scale) / 2;

  const teePoint: [number, number] = useMemo(() => layout.path[0], [layout.path]);
  const teePx = useMemo<[number, number]>(
    () => [offsetX + teePoint[0] * scale, offsetY + teePoint[1] * scale],
    [offsetX, offsetY, scale, teePoint],
  );

  const landingPx = useMemo<[number, number] | null>(() => {
    if (!shot) return null;
    const [lx, ly] = landingPoint(layout, shot);
    return [offsetX + lx * scale, offsetY + ly * scale];
  }, [shot, layout, offsetX, offsetY, scale]);

  const oppPx = useMemo<[number, number] | null>(() => {
    if (opponentDistance === null) return null;
    const [x, y] = pointOnPath(layout.path, distanceToT(opponentDistance));
    return [offsetX + x * scale, offsetY + y * scale];
  }, [opponentDistance, layout, offsetX, offsetY, scale]);

  // 0 → 1 の進行 t
  const flightT = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shot) {
      flightT.setValue(0);
      return;
    }
    flightT.setValue(0);
    Animated.timing(flightT, {
      toValue: 1,
      duration: 1100,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && onAnimationDone) onAnimationDone();
    });
  }, [shot, flightT, onAnimationDone]);

  // 弾道の制御点: ティーと着地点の中点から、曲がりと逆向きに少し膨らませる
  // （曲がる球は打ち出しが逆へ出てから戻ってくるように見える）
  const flightSamples = useMemo(() => {
    if (!landingPx || !shot) return null;
    const mx = (teePx[0] + landingPx[0]) / 2;
    const my = (teePx[1] + landingPx[1]) / 2;
    const dx = landingPx[0] - teePx[0];
    const dy = landingPx[1] - teePx[1];
    const len = Math.hypot(dx, dy) || 1;
    const bulge = -shot.curve * len * 0.18;
    const cx = mx + (-dy / len) * bulge;
    const cy = my + (dx / len) * bulge;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const u = 1 - t;
      xs.push(u * u * teePx[0] + 2 * u * t * cx + t * t * landingPx[0]);
      ys.push(u * u * teePx[1] + 2 * u * t * cy + t * t * landingPx[1]);
    }
    return { xs, ys };
  }, [landingPx, teePx, shot]);

  const inputRange = Array.from({ length: 17 }, (_, i) => i / 16);
  // 待機中もティーに止めた補間にしておく。素の数値 → 補間に差し替えると、
  // Web では途中のフレームが描かれず、球が着地点へ飛び移るだけになった
  const ballX = flightT.interpolate({
    inputRange,
    outputRange: flightSamples ? flightSamples.xs : inputRange.map(() => teePx[0]),
  });
  const ballY = flightT.interpolate({
    inputRange,
    outputRange: flightSamples ? flightSamples.ys : inputRange.map(() => teePx[1]),
  });

  // 飛行中の見た目（高さによる擬似的な「飛んでる感」）：
  //   - スケール: 1 → 1.6 (頂点) → 1
  //   - 影: ぼけた円が地表に追従、ピーク時は薄く
  const ballScale = flightT.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.6, 1],
  });
  const ballGlow = flightT.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.9, 0.4],
  });

  const BALL_SIZE = 8;
  const SHADOW_SIZE = 7;

  return (
    <View style={{ width, height }}>
      <HoleMap layout={layout} width={width} height={height} />

      {/* ティーの目印（白い小円） */}
      <View
        style={[
          styles.teeMark,
          {
            left: teePx[0] - 2,
            top: teePx[1] - 2,
          },
        ]}
        pointerEvents="none"
      />

      {/* 相手の球。灰色で先に置いておく */}
      {oppPx && (
        <View
          style={[styles.oppBall, { left: oppPx[0] - 3, top: oppPx[1] - 3 }]}
          pointerEvents="none"
        />
      )}

      {/* 飛行中の地表シャドウ（淡い円。ボールの下層に置きたいので先に配置） */}
      {shot && (
        <Animated.View
          style={[
            styles.shadow,
            {
              left: ballX,
              top: ballY,
              width: SHADOW_SIZE,
              height: SHADOW_SIZE / 2,
              borderRadius: SHADOW_SIZE / 2,
              marginLeft: -SHADOW_SIZE / 2,
              marginTop: -SHADOW_SIZE / 4,
              opacity: flightT.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.5, 0.15, 0.55],
              }),
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* ボール（飛行中はやや大きく＆光る） */}
      <Animated.View
        style={[
          styles.ball,
          {
            left: ballX,
            top: ballY,
            width: BALL_SIZE,
            height: BALL_SIZE,
            borderRadius: BALL_SIZE / 2,
            marginLeft: -BALL_SIZE / 2,
            marginTop: -BALL_SIZE / 2,
            transform: [{ scale: ballScale }],
            shadowOpacity: ballGlow,
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  teeMark: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F5E6C8',
    borderWidth: 0.5,
    borderColor: '#7a5a30',
  },
  ball: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#cccccc',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    elevation: 4,
  },
  oppBall: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#b8b8b8',
    borderWidth: 1,
    borderColor: '#7a7a7a',
  },
  shadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
