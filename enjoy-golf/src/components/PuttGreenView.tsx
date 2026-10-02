/**
 * PuttGreenView — 最終パットのグリーン。引いて打つ入力と、転がりの再生を受け持つ
 *
 * - 入力: グリーンのどこからでも指を置いて**後ろへ引き、離して打つ**。
 *   引いた向きの反対へ打ち出し、引いた長さが強さ（`strokeFromDrag`）。
 *   ボールに正確に触れなくてよいのは、小さな球を指で隠してしまうと引く向きが見えないため。
 * - 引いている間は、打ち出し方向の短い線だけを出す。曲がりは見せない（読むのはプレイヤー）。
 *   集中力が低いと線が揺れ、離した瞬間の揺れがそのまま向きに乗る。
 * - 再生: 親が `playback`（`simulatePutt` の軌跡）を渡すと転がす。長さはおおむね実時間
 *   （点の数 × `PATH_POINT_MS`）だが、0.6〜3.5秒に収める。ごく短い転がりは見えないうちに
 *   終わり、長すぎると結果を待たされるため。
 *   判定は持たない。結果は親が `simulatePutt` から受け取っている。
 *   `playback` は同じ打球なら同じオブジェクトを渡すこと（変わるたびに頭から再生し直す）。
 *
 * PanResponder は Capture 版で取る。親は ScrollView なので、取らないとドラッグを
 * スクロールに奪われる（親側でもこの画面の間はスクロールを止めている）。
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { PuttAim, SlopeType } from '../types';
import {
  CUP_R,
  GREEN,
  PATH_POINT_MS,
  PUTT_BALL_START,
  PUTT_CUP,
  Vec,
  focusJitter,
  strokeFromDrag,
} from '../logic/puttPhysics';

interface Props {
  slope: SlopeType;
  /** 会話の3択で選んだ線。淡いガイドとして出すだけで、打つ向きは縛らない */
  guideAim: PuttAim;
  focus: number;
  width: number;
  height: number;
  /** false の間は触れない（転がり中・結果表示中） */
  interactive: boolean;
  /** 離して打ったとき。強さのブレは親が乗せる */
  onStroke: (stroke: { angle: number; power: number }) => void;
  /** 再生する軌跡。null の間はボールはスタート位置 */
  playback: { path: Vec[]; sink: boolean } | null;
  onPlaybackDone?: () => void;
}

/** これ未満の引きは誤タップとみなして打たない */
const MIN_POWER = 0.06;

const GUIDE_TARGET: Record<PuttAim, Vec> = {
  left: [36, 24],
  center: [50, 22],
  right: [64, 24],
};

/** 傾斜の向きだけを示す矢印。量は示さない */
function SlopeArrows({ slope }: { slope: SlopeType }) {
  if (slope === 'flat') return null;
  const dx = slope === 'left' ? -1 : slope === 'right' ? 1 : 0;
  const dy = slope === 'uphill' ? 1 : 0;
  const positions: Vec[] = [
    [32, 50],
    [68, 50],
    [50, 66],
  ];
  return (
    <G opacity={0.45}>
      {positions.map(([cx, cy], i) => {
        const x2 = cx + dx * 3;
        const y2 = cy + dy * 3;
        const nx = -dy;
        const ny = dx;
        return (
          <G key={i}>
            <Path
              d={`M ${cx - dx * 3} ${cy - dy * 3} L ${x2} ${y2}`}
              stroke="#ffffff"
              strokeWidth={0.6}
              strokeLinecap="round"
            />
            <Path
              d={`M ${x2 + dx * 1.4} ${y2 + dy * 1.4} L ${x2 + nx * 1.2} ${y2 + ny * 1.2} L ${x2 - nx * 1.2} ${y2 - ny * 1.2} Z`}
              fill="#ffffff"
            />
          </G>
        );
      })}
    </G>
  );
}

export function PuttGreenView({
  slope,
  guideAim,
  focus,
  width,
  height,
  interactive,
  onStroke,
  playback,
  onPlaybackDone,
}: Props) {
  const scale = Math.min(width / 100, height / 100);
  const offsetX = (width - 100 * scale) / 2;
  const offsetY = (height - 100 * scale) / 2;
  /** 指をこれだけ引けば強さ 1。グリーンの半分弱 */
  const maxDragPx = 100 * scale * 0.45;

  // ===== 入力 =====
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const onStrokeRef = useRef(onStroke);
  onStrokeRef.current = onStroke;

  // 方向線の揺れ。引いている間だけ進める
  const jitterAmp = focusJitter(focus).angle;
  const [wobbleT, setWobbleT] = useState(0);
  const wobbleRef = useRef(0);
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging || jitterAmp === 0) return;
    const id = setInterval(() => setWobbleT((t) => t + 0.05), 50);
    return () => clearInterval(id);
  }, [dragging, jitterAmp]);
  const wobble = jitterAmp * Math.sin(wobbleT * 5);
  wobbleRef.current = wobble;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactiveRef.current,
        onStartShouldSetPanResponderCapture: () => interactiveRef.current,
        onMoveShouldSetPanResponder: () => interactiveRef.current,
        onMoveShouldSetPanResponderCapture: () => interactiveRef.current,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragRef.current = { dx: 0, dy: 0 };
          setDrag({ dx: 0, dy: 0 });
        },
        onPanResponderMove: (_e, g) => {
          dragRef.current = { dx: g.dx, dy: g.dy };
          setDrag({ dx: g.dx, dy: g.dy });
        },
        onPanResponderRelease: () => {
          const d = dragRef.current;
          dragRef.current = null;
          setDrag(null);
          if (!d || !interactiveRef.current) return;
          const s = strokeFromDrag(d.dx, d.dy, maxDragPx);
          if (!s || s.power < MIN_POWER) return;
          onStrokeRef.current({ angle: s.angle + wobbleRef.current, power: s.power });
        },
        onPanResponderTerminate: () => {
          dragRef.current = null;
          setDrag(null);
        },
      }),
    [maxDragPx]
  );

  const preview = drag ? strokeFromDrag(drag.dx, drag.dy, maxDragPx) : null;

  // ===== 再生 =====
  const t = useRef(new Animated.Value(0)).current;
  const onDoneRef = useRef(onPlaybackDone);
  onDoneRef.current = onPlaybackDone;

  /** 再生用に間引いた点（多すぎると interpolate が重い） */
  const samples = useMemo(() => {
    if (!playback) return null;
    const p = playback.path;
    const step = Math.max(1, Math.ceil(p.length / 60));
    const out: Vec[] = [];
    for (let i = 0; i < p.length; i += step) out.push(p[i]);
    if (out[out.length - 1] !== p[p.length - 1]) out.push(p[p.length - 1]);
    return out;
  }, [playback]);

  useEffect(() => {
    t.setValue(0);
    if (!playback) return;
    const duration = Math.max(600, Math.min(3500, playback.path.length * PATH_POINT_MS));
    const anim = Animated.timing(t, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) onDoneRef.current?.();
    });
    return () => anim.stop();
  }, [playback, t]);

  const toPxX = (x: number) => offsetX + x * scale;
  const toPxY = (y: number) => offsetY + y * scale;

  const inputRange = samples ? samples.map((_, i) => i / Math.max(1, samples.length - 1)) : [0, 1];
  const ballX = samples
    ? t.interpolate({ inputRange, outputRange: samples.map((p) => toPxX(p[0])) })
    : toPxX(PUTT_BALL_START[0]);
  const ballY = samples
    ? t.interpolate({ inputRange, outputRange: samples.map((p) => toPxY(p[1])) })
    : toPxY(PUTT_BALL_START[1]);
  const ballScale = playback?.sink
    ? t.interpolate({ inputRange: [0, 0.94, 1], outputRange: [1, 1, 0] })
    : 1;

  const BALL_PX = Math.max(7, scale * 2.2);

  // 方向線（打ち出し方向のみ。長さは強さに比例）
  const [bx, by] = PUTT_BALL_START;
  let aimLine: string | null = null;
  let pullLine: string | null = null;
  if (preview && drag) {
    const a = preview.angle + wobble;
    const len = 6 + preview.power * 16;
    aimLine = `M ${bx} ${by} L ${bx + Math.sin(a) * len} ${by - Math.cos(a) * len}`;
    pullLine = `M ${bx} ${by} L ${bx + drag.dx / scale} ${by + drag.dy / scale}`;
  }

  return (
    <View
      style={[
        { width, height },
        // web のタッチ端末では、指を動かすとページのスクロールや引っぱって更新に取られ、
        // 引いている途中で打てなくなる。グリーンの上ではブラウザの既定の動きを止める。
        // 長押しで文字が選択されるのも止める
        Platform.OS === 'web' && ({ touchAction: 'none', userSelect: 'none' } as object),
      ]}
      {...pan.panHandlers}
    >
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
        <Rect x={0} y={0} width={width} height={height} fill="url(#puttRough)" />
        {/* x/y/scale ではなく標準の transform で指定する。react-native-svg 15 は
            web で scale を transform-origin という無効な DOM 属性に変換し、
            React が毎描画で警告を出していた */}
        <G transform={`translate(${offsetX},${offsetY}) scale(${scale})`}>
          <Ellipse
            cx={GREEN.cx}
            cy={GREEN.cy}
            rx={GREEN.rx}
            ry={GREEN.ry}
            fill="url(#puttGreen)"
            stroke="#5d9b48"
            strokeWidth={0.8}
          />
          <SlopeArrows slope={slope} />
          {/* 会話で口にした線。打つ向きは縛らない */}
          <Path
            d={`M ${bx} ${by} L ${GUIDE_TARGET[guideAim][0]} ${GUIDE_TARGET[guideAim][1]}`}
            stroke="rgba(255, 215, 0, 0.35)"
            strokeWidth={0.5}
            strokeDasharray="1.5,1.5"
          />
          <Circle cx={PUTT_CUP[0]} cy={PUTT_CUP[1]} r={CUP_R} fill="#5d4014" />
          <Circle cx={PUTT_CUP[0]} cy={PUTT_CUP[1]} r={CUP_R * 0.73} fill="#0c0c0c" />
          <Rect x={PUTT_CUP[0] - 0.2} y={PUTT_CUP[1] - 12} width={0.4} height={12} fill="#f1f1f1" />
          <Path
            d={`M ${PUTT_CUP[0]} ${PUTT_CUP[1] - 12} L ${PUTT_CUP[0] + 5} ${PUTT_CUP[1] - 10.5} L ${PUTT_CUP[0]} ${PUTT_CUP[1] - 9} Z`}
            fill="#e63946"
          />
          {pullLine && (
            <Path d={pullLine} stroke="rgba(255,255,255,0.35)" strokeWidth={0.6} strokeDasharray="1,1" />
          )}
          {aimLine && <Path d={aimLine} stroke="#FFD700" strokeWidth={0.9} strokeLinecap="round" />}
        </G>
      </Svg>

      <View style={styles.slopeBadge} pointerEvents="none">
        <Text style={styles.slopeBadgeText}>{slopeLabel(slope)}</Text>
      </View>

      {preview && (
        <View style={styles.powerBadge} pointerEvents="none">
          <Text style={styles.powerBadgeText}>強さ {Math.round(preview.power * 100)}</Text>
        </View>
      )}

      <Animated.View
        pointerEvents="none"
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
  slopeBadge: { position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center' },
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
  powerBadge: { position: 'absolute', bottom: 6, right: 8 },
  powerBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 6,
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
