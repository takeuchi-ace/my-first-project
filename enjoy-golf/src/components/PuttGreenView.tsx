/**
 * PuttGreenView — 最終パットのグリーン。引いて打つ入力と、転がりの再生を受け持つ
 *
 * - 入力: **パット画面のどこからでも**指を置いて**後ろへ引き、離して打つ**。
 *   引いた向きの反対へ打ち出し、引いた長さが強さ（`strokeFromDrag`）。
 *   ボールに正確に触れなくてよいのは、小さな球を指で隠してしまうと引く向きが見えないため。
 *   入力そのものは `usePuttDrag` が持ち、親（パット画面）が画面全体に `panHandlers` を付ける。
 *   このビューは受け取った `drag`・`wobble` を描くだけ。グリーンの外から引いても、線とゲージはここに出る。
 * - 引いている間は、打ち出し方向の線（破線の矢印）だけを出す。曲がりは見せない（読むのはプレイヤー）。
 *   集中力が低いと線が揺れ、離した瞬間の揺れがそのまま向きに乗る。
 * - 実機では指がボールの近く（グリーンの下のほう）に乗るので、ボールのそばの表示は指と手で隠れる。
 *   そこで向きの線はカップの手前まで長く伸ばし、強さはグリーンの**上端**（指からいちばん遠い所）の
 *   横長のゲージで見せる。線の太さと色の暖かさにも強さを乗せて、上を見なくても分かるようにする。
 * - 再生: 親が `playback`（`simulatePutt` の軌跡）を渡すと転がす。長さはおおむね実時間
 *   （点の数 × `PATH_POINT_MS`）だが、0.6〜3.5秒に収める。ごく短い転がりは見えないうちに
 *   終わり、長すぎると結果を待たされるため。
 *   判定は持たない。結果は親が `simulatePutt` から受け取っている。
 *   `playback` は同じ打球なら同じオブジェクトを渡すこと（変わるたびに頭から再生し直す）。
 *
 * PanResponder は Capture 版で取る。親は ScrollView なので、取らないとドラッグを
 * スクロールに奪われる（親側でもこの画面の間はスクロールを止めている）。
 * ただし取るのは**指が動いてから**（`DRAG_CLAIM_PX`）。触れた瞬間に取ると、画面全体を覆うため
 * ヘッダーの地図のボタンなどのタップまで奪ってしまう。
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
  PUTT_GUIDE_ANGLE,
  Vec,
  focusJitter,
  strokeFromDrag,
} from '../logic/puttPhysics';

interface Props {
  slope: SlopeType;
  /** 会話の3択で選んだ線。淡いガイドとして出すだけで、打つ向きは縛らない */
  guideAim: PuttAim;
  width: number;
  height: number;
  /** false の間は打てない（転がり中・結果表示中）。強さのゲージを出すかどうかにだけ使う */
  interactive: boolean;
  /** 引いている量（`usePuttDrag` の `drag`）。null の間は線を出さない */
  drag: PuttDrag | null;
  /** 方向線の揺れ（`usePuttDrag` の `wobble`）。描く揺れと打つときに乗る揺れは同じ値 */
  wobble: number;
  /** 再生する軌跡。null の間はボールはスタート位置 */
  playback: { path: Vec[]; sink: boolean } | null;
  onPlaybackDone?: () => void;
}

/** これ未満の引きは誤タップとみなして打たない */
const MIN_POWER = 0.06;

/**
 * ガイド線の長さ（ボール→カップの距離に対する割合）。
 * 地点まで引くと「ここへ打て」に見えるが、示したいのは向きだけ。
 * 傾斜で曲がる分を含めた向きなので、カップまで届かせず短く止める
 */
const GUIDE_LEN_RATIO = 0.6;

/**
 * 引いている間の向きの線の長さ（ボール→カップの距離に対する割合）。強さによらず一定。
 * 短いと指に隠れる。カップまで届かせると「ここへ打てば入る」に見えるので手前で止める
 */
const AIM_LEN_RATIO = 0.7;

/** 強さ 0 → 1 の色。黄から朱へ。強く引くほど暖かくなる */
const powerColor = (power: number): string => {
  const p = Math.max(0, Math.min(1, power));
  const g = Math.round(215 + (77 - 215) * p);
  const b = Math.round(0 + (46 - 0) * p);
  return `rgb(255, ${g}, ${b})`;
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

export type PuttDrag = { dx: number; dy: number };

/**
 * 指をこれだけ引けば強さ 1。グリーンの半分弱。
 * 入力（`usePuttDrag`）と描画（`PuttGreenView`）の両方がこれで計算する。
 * 画面のどこから引いても、手応えはグリーンの大きさに合わせたまま変えないため
 */
export const puttMaxDragPx = (width: number, height: number): number =>
  100 * Math.min(width / 100, height / 100) * 0.45;

/**
 * これだけ指が動いたら引き始めとみなして入力を取る。
 * 触れた瞬間には取らない（画面全体を覆うので、取るとボタンのタップまで奪う）。
 * 小さすぎるとタップの指のぶれで取ってしまい、大きすぎると引き始めが鈍く感じる
 */
const DRAG_CLAIM_PX = 5;

/**
 * web で、引き終えた直後のクリックを1回だけ捨てる。
 * RN-web の Pressable は onPress を responder ではなくブラウザの click で出すため、
 * 地図のボタンの上で押して少し引き、ボタンの上で離すと、打った上に地図まで開いてしまう。
 * click は mouseup / touchend の直後に来るので、短い間だけ捕まえて止める
 */
const swallowNextClick = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const stop = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    cleanup();
  };
  const cleanup = () => {
    window.removeEventListener('click', stop, true);
    clearTimeout(timer);
  };
  window.addEventListener('click', stop, true);
  const timer = setTimeout(cleanup, 400);
};

/**
 * 最終パットの「引いて、離して打つ」入力。パット画面の一番外側に `panHandlers` を付けると、
 * 画面のどこから引いても打てる。`drag`・`wobble` は `PuttGreenView` に渡して線とゲージを描く。
 *
 * - 引いた量は**指を置いた所から**の差。取るのは `DRAG_CLAIM_PX` 動いてからだが、
 *   PanResponder は取った時点で dx/dy を 0 に戻すので、取るまでに動いた分を足し戻す。
 * - 方向線の揺れはここで進める。描いた揺れ（`wobble`）と離した瞬間に乗る揺れ（`wobbleRef`）は同じ値。
 * - PanResponder は一度だけ作り、変わる値（interactive・maxDragPx・onStroke）は ref で読む。
 *   作り直すと引いている途中の gestureState が失われ、古い onStroke を呼ぶおそれもある。
 */
export function usePuttDrag({
  interactive,
  maxDragPx,
  focus,
  onStroke,
}: {
  interactive: boolean;
  maxDragPx: number;
  focus: number;
  /** 離して打ったとき。強さのブレは親が乗せる */
  onStroke: (stroke: { angle: number; power: number }) => void;
}) {
  const [drag, setDrag] = useState<PuttDrag | null>(null);
  const dragRef = useRef<PuttDrag | null>(null);
  /** 取るまでに動いた分（指を置いた所から、取った所まで） */
  const claimOffsetRef = useRef<PuttDrag>({ dx: 0, dy: 0 });
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const maxDragRef = useRef(maxDragPx);
  maxDragRef.current = maxDragPx;
  const onStrokeRef = useRef(onStroke);
  onStrokeRef.current = onStroke;

  // 打てなくなったら（転がり始め・地図を開いた等）引いている途中の線を消す
  useEffect(() => {
    if (!interactive) {
      dragRef.current = null;
      setDrag(null);
    }
  }, [interactive]);

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

  const pan = useMemo(() => {
    const shouldClaim = (g: { dx: number; dy: number }) => {
      if (!interactiveRef.current) return false;
      if (Math.hypot(g.dx, g.dy) < DRAG_CLAIM_PX) return false;
      claimOffsetRef.current = { dx: g.dx, dy: g.dy };
      return true;
    };
    return PanResponder.create({
      // 触れただけでは取らない。タップはその下のボタンへ届ける
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // 動いたら取る。Capture 版なので、指がボタンの上で下りていてもこちらが先に取り、
      // ボタン（Pressable）は取られることを認めて押下を取り消す（onPress は出ない）
      onMoveShouldSetPanResponder: (_e, g) => shouldClaim(g),
      onMoveShouldSetPanResponderCapture: (_e, g) => shouldClaim(g),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        const d = { ...claimOffsetRef.current };
        dragRef.current = d;
        setDrag(d);
      },
      onPanResponderMove: (_e, g) => {
        const base = claimOffsetRef.current;
        const d = { dx: base.dx + g.dx, dy: base.dy + g.dy };
        dragRef.current = d;
        setDrag(d);
      },
      onPanResponderRelease: () => {
        const d = dragRef.current;
        dragRef.current = null;
        setDrag(null);
        swallowNextClick();
        if (!d || !interactiveRef.current) return;
        const s = strokeFromDrag(d.dx, d.dy, maxDragRef.current);
        if (!s || s.power < MIN_POWER) return;
        onStrokeRef.current({ angle: s.angle + wobbleRef.current, power: s.power });
      },
      onPanResponderTerminate: () => {
        dragRef.current = null;
        setDrag(null);
        swallowNextClick();
      },
    });
  }, []);

  return { panHandlers: pan.panHandlers, drag, wobble };
}

export function PuttGreenView({
  slope,
  guideAim,
  width,
  height,
  interactive,
  drag,
  wobble,
  playback,
  onPlaybackDone,
}: Props) {
  const scale = Math.min(width / 100, height / 100);
  const offsetX = (width - 100 * scale) / 2;
  const offsetY = (height - 100 * scale) / 2;
  const maxDragPx = puttMaxDragPx(width, height);

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

  // 方向線（打ち出し方向のみ。長さは一定で、強さは太さと色に出す）
  const [bx, by] = PUTT_BALL_START;
  let aimLine: string | null = null;
  let aimHead: string | null = null;
  let pullLine: string | null = null;
  const guideA = PUTT_GUIDE_ANGLE[guideAim];
  const guideLen = (by - PUTT_CUP[1]) / Math.cos(guideA) * GUIDE_LEN_RATIO;
  const aimLen = Math.hypot(PUTT_CUP[0] - bx, PUTT_CUP[1] - by) * AIM_LEN_RATIO;
  const aimColor = powerColor(preview?.power ?? 0);
  const aimWidth = 0.7 + (preview?.power ?? 0) * 0.9;
  if (preview && drag) {
    const a = preview.angle + wobble;
    const ux = Math.sin(a);
    const uy = -Math.cos(a);
    const tx = bx + ux * aimLen;
    const ty = by + uy * aimLen;
    aimLine = `M ${bx} ${by} L ${tx} ${ty}`;
    // 矢じり。線の先から少し先へ尖らせ、左右に開く
    const nx = -uy;
    const ny = ux;
    aimHead = `M ${tx + ux * 2.6} ${ty + uy * 2.6} L ${tx + nx * 1.7} ${ty + ny * 1.7} L ${tx - nx * 1.7} ${ty - ny * 1.7} Z`;
    pullLine = `M ${bx} ${by} L ${bx + drag.dx / scale} ${by + drag.dy / scale}`;
  }

  return (
    // 入力は親（パット画面全体）が持つ。web のブラウザ既定の動き（スクロール・文字選択）も親で止めている
    <View style={{ width, height }}>
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
            d={`M ${bx} ${by} L ${bx + Math.sin(guideA) * guideLen} ${by - Math.cos(guideA) * guideLen}`}
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
          {aimLine && (
            <Path
              d={aimLine}
              stroke={aimColor}
              strokeWidth={aimWidth}
              strokeDasharray="2.4,1.6"
              strokeLinecap="round"
            />
          )}
          {aimHead && <Path d={aimHead} fill={aimColor} />}
        </G>
      </Svg>

      {/* 強さのゲージ。指から最も遠い上端に置く（下に置くと指と手で隠れる）。
          打てる間は空でも出しておく。引き始めに枠が現れると、目がそちらへ跳ぶ */}
      {interactive && (
        <View style={styles.gauge} pointerEvents="none">
          <Text style={styles.gaugeLabel}>強さ</Text>
          <View style={styles.gaugeTrack}>
            <View
              style={[
                styles.gaugeFill,
                {
                  width: `${Math.round((preview?.power ?? 0) * 100)}%`,
                  backgroundColor: aimColor,
                },
              ]}
            />
          </View>
          <Text style={styles.gaugeValue}>{preview ? Math.round(preview.power * 100) : ''}</Text>
        </View>
      )}

      {/* 傾斜はゲージの下・左上。上端中央はゲージと重なる */}
      <View style={[styles.slopeBadge, interactive ? styles.slopeBadgeBelowGauge : null]} pointerEvents="none">
        <Text style={styles.slopeBadgeText}>{slopeLabel(slope)}</Text>
      </View>

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
  slopeBadge: { position: 'absolute', top: 6, left: 8 },
  slopeBadgeBelowGauge: { top: 30 },
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
  gauge: {
    position: 'absolute',
    top: 6,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  gaugeLabel: { color: '#F5E6C8', fontSize: 11, fontWeight: '700', marginRight: 6 },
  gaugeTrack: {
    flex: 1,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 200, 0.6)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
  },
  gaugeFill: { height: '100%' },
  gaugeValue: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    width: 26,
    textAlign: 'right',
    marginLeft: 4,
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
