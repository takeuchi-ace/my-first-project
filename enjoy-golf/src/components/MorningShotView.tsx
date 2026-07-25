/**
 * MorningShotView — 朝イチショット用のホール俯瞰図＋ボール弾道アニメ
 *
 * - HoleMap で Hole 1 の俯瞰図を描画
 * - ボールはティーから着弾点へ放物線軌道でアニメーション
 *   - perfect: グリーン手前（フェアウェイの 85% 地点、オフセットなし）
 *   - good:    フェアウェイ中ほど（70% 地点、わずかにオフセット）
 *   - miss:    ラフ／ハザード（50% 地点、大きく横にオフセット）
 * - result プロップが null→値 に変化したタイミングでアニメ起動
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { HoleLayout } from '../data/holeLayouts';
import { HoleMap } from './HoleMap';

export type ShotResult = 'perfect' | 'good' | 'miss';

interface Props {
  layout: HoleLayout;
  width: number;
  height: number;
  /** null = ボールはティーで待機。値が入るとアニメ開始 */
  result: ShotResult | null;
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

/** 結果別の着弾点を 0-100 空間で計算 */
function computeLanding(layout: HoleLayout, result: ShotResult): [number, number] {
  const path = layout.path;
  switch (result) {
    case 'perfect': {
      // グリーンに近いフェアウェイ中央
      return pointOnPath(path, 0.85);
    }
    case 'good': {
      // フェアウェイ中ほど、わずかに右にオフセット
      const center = pointOnPath(path, 0.7);
      const n = normalAt(path, 0.7);
      return [center[0] + n[0] * 4, center[1] + n[1] * 4];
    }
    case 'miss': {
      // ラフ/ハザード、大きく左に外す
      const center = pointOnPath(path, 0.5);
      const n = normalAt(path, 0.5);
      return [center[0] - n[0] * 18, center[1] - n[1] * 18];
    }
  }
}

export function MorningShotView({ layout, width, height, result, onAnimationDone }: Props) {
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
    if (!result) return null;
    const [lx, ly] = computeLanding(layout, result);
    return [offsetX + lx * scale, offsetY + ly * scale];
  }, [result, layout, offsetX, offsetY, scale]);

  // 0 → 1 の進行 t
  const flightT = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!result) {
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
  }, [result, flightT, onAnimationDone]);

  // ボールの位置 (px)
  const ballX = flightT.interpolate({
    inputRange: [0, 1],
    outputRange: [teePx[0], landingPx ? landingPx[0] : teePx[0]],
  });
  const ballY = flightT.interpolate({
    inputRange: [0, 1],
    outputRange: [teePx[1], landingPx ? landingPx[1] : teePx[1]],
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

      {/* 飛行中の地表シャドウ（淡い円。ボールの下層に置きたいので先に配置） */}
      {result && (
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
  shadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
