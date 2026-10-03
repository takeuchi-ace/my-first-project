/**
 * TeeShotMeter — 朝イチの3タップ（スイング開始 → パワー → インパクト）
 *
 * 判定は持たない。押した位置（パワー・インパクト）を親に渡すだけで、
 * 結果は親が `judgeTeeShot` で決める。
 *
 * バーの上には、判定に使う数値そのものから描いた印を置く:
 *  - インパクトの窓（集中力とパワーで伸縮。パワーが決まるまでは強さ1の最も狭い幅）
 *  - 刻みの境（`LAYBACK_POWER`。これより手前で止めると PERFECT は出ない）
 *  - 相手の球を越えるのに要るパワー（`powerToOutdrive`。OB のときは出さない）
 *
 * 見た目（2026-10-03、実機で「安っぽい」と言われて作り直した。速さと判定は変えていない）:
 *  - 木目の枠（WoodHeader と同じ色）に入れた高さ 44 のバー
 *  - 位置は白い三角＋縦線の印。細い白棒では動いているバーの上で見失う
 *  - 振り上げ中は印の後ろを暖色の帯で塗り、パワーが決まったらそこまでの帯を残す
 *  - インパクトのタップでメーターが一瞬光って膨らむ（親は結果への切り替えを少し待つ）
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import { IMPACT_POS, LAYBACK_POWER, powerToOutdrive, teeShotWindow } from '../logic/teeShot';
import { playSfx, preloadSfx } from '../lib/sound';

interface Props {
  focus: number;
  /** 相手の到達点（0〜1）。null なら印を出さない */
  opponentDrive: number | null;
  opponentName: string;
  /** 会話で答え済みなら PERFECT は出ない（判定側の仕様）。窓を薄く描いて狙わせない */
  talkAnswered: boolean;
  onDone: (shot: { power: number; impact: number | null }) => void;
}

type Phase = 'ready' | 'up' | 'down' | 'done';

/** 0 → 1 に伸びきるまで */
const UP_MS = 1000;
/** 戻りの速さ（バー 1 ぶん戻るのにかかる時間）。伸びより速く、インパクトを難しくする */
const DOWN_MS_PER_UNIT = 700;
/** バーはここまで戻って止まる（印を通り過ぎた＝押し損ね） */
const BAR_END = -0.03;
/**
 * 振り始めからこれより早いパワーのタップは無視する（バーは伸び続ける）。
 * 素早い二度押しがそのままパワーになると、ほぼ 0 の空振りが確定してしまう
 */
const POWER_TAP_GUARD_MS = 120;

/**
 * インパクトの光りの長さ。親（GameScreenSimple）は当てたとき、これだけ待ってから結果の画面へ移る。
 * 移るとメーターが消えて光りが見えないため。onDone 自体は待たせない（判定はタップの瞬間に決まる）
 */
export const IMPACT_FLASH_HOLD_MS = 220;

const pct = (v: number) => `${v * 100}%` as `${number}%`;

/**
 * 文字の拡大（iOS の「文字サイズ」）の上限。3タップの間は親がスクロールを止めているので、
 * 文字が際限なく大きくなるとメーターが画面の外へ押し出されて押せなくなる。
 * 親（GameScreenSimple）は朝イチ・パットの説明の文字にも同じ上限を掛け、
 * 俯瞰図の下の段の高さの見積もり（MORNING_BELOW_HOLE_*）もこの上限までで計算する
 */
export const MINI_GAME_MAX_FONT_SCALE = 1.3;

export function TeeShotMeter({ focus, opponentDrive, opponentName, talkAnswered, onDone }: Props) {
  const pos = useRef(new Animated.Value(0)).current;
  const posRef = useRef(0);
  const phaseRef = useRef<Phase>('ready');
  const [phase, setPhase] = useState<Phase>('ready');
  const [power, setPower] = useState<number | null>(null);
  const powerRef = useRef(1);
  const startedAtRef = useRef(0);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  /** インパクトの光り（1 → 0）。transform と opacity だけなのでネイティブで回せる */
  const flash = useRef(new Animated.Value(0)).current;

  // 打球音を先に読み込む。初回のインパクトで読み込みを待つと音が遅れる
  useEffect(() => {
    preloadSfx();
  }, []);

  useEffect(() => {
    const id = pos.addListener(({ value }) => {
      posRef.current = value;
    });
    return () => {
      pos.removeListener(id);
      animRef.current?.stop();
    };
  }, [pos]);

  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const finish = (impact: number | null) => {
    go('done');
    onDoneRef.current({ power: powerRef.current, impact });
  };

  const startDown = () => {
    go('down');
    const from = powerRef.current;
    const anim = Animated.timing(pos, {
      toValue: BAR_END,
      duration: Math.max(1, (from - BAR_END) * DOWN_MS_PER_UNIT),
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animRef.current = anim;
    // stop() でも呼ばれる（finished=false）。段が変わっていれば何もしない
    anim.start(({ finished }) => {
      if (finished && phaseRef.current === 'down') finish(null);
    });
  };

  const handleTap = () => {
    const p = phaseRef.current;
    if (p === 'ready') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playSfx('tap');
      go('up');
      startedAtRef.current = Date.now();
      pos.setValue(0);
      const anim = Animated.timing(pos, {
        toValue: 1,
        duration: UP_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      });
      animRef.current = anim;
      // 押さずに伸びきったら全力で確定して折り返す
      anim.start(({ finished }) => {
        if (finished && phaseRef.current === 'up') {
          powerRef.current = 1;
          setPower(1);
          startDown();
        }
      });
      return;
    }
    if (p === 'up') {
      if (Date.now() - startedAtRef.current < POWER_TAP_GUARD_MS) return;
      animRef.current?.stop();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      powerRef.current = posRef.current;
      setPower(posRef.current);
      startDown();
      return;
    }
    if (p === 'down') {
      // 音を最初に鳴らす。止める・振動・親への通知より前に出して、指と音のずれを減らす
      playSfx('impact');
      animRef.current?.stop();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      finish(posRef.current);
      // 光りは親への通知のあとに始める（通知を一切遅らせない）
      flash.setValue(1);
      Animated.timing(flash, {
        toValue: 0,
        duration: IMPACT_FLASH_HOLD_MS + 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  };

  const w = teeShotWindow(focus, power ?? 1);
  /** 赤い印。相手の到達点ではなく、GOOD で当てて越えるのに要るパワーに置く */
  const oppMark = opponentDrive === null ? null : powerToOutdrive(opponentDrive);
  const zone = (half: number) => ({
    left: pct(Math.max(0, IMPACT_POS - half)),
    width: pct(IMPACT_POS + half - Math.max(0, IMPACT_POS - half)),
  });

  const hint =
    phase === 'ready'
      ? 'タップで振り始める'
      : phase === 'up'
        ? 'もう一度タップでパワーを決める'
        : phase === 'down'
          ? '戻ってきたら印でタップ！'
          : // 空にすると行の高さが消え、光っている間にメーターが上へずれる
            ' ';

  /**
   * 暖色の帯の右端。振り上げ中は印を追い、パワーが決まったらそこで止める。
   * 帯そのものはバー全幅のグラデーションで、右側を暗い覆いで隠して長さを出す
   * （幅を動かすとグラデーションごと伸び縮みして、色が位置と結びつかない）
   */
  const fillEdge: Animated.AnimatedInterpolation<string> | `${number}%` =
    phase === 'up'
      ? pos.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' })
      : pct(phase === 'ready' ? 0 : power ?? 0);

  return (
    // 押した瞬間で取る（onPress は指を離したときに来るので、タイミングを取る操作では遅れる）。
    // Pressable の onPressIn は使わない: Web では既定で 50ms 遅れて来て、その間に離すと
    // （トラックパッドのタップ・素早いクリック）来ないまま終わる。遅れの 50ms も
    // 戻りのバーでは 0.07 ぶんで、PERFECT の窓より広い。responder の grant は
    // Web でも端末でも触れた瞬間に来る
    <View
      style={styles.area}
      accessibilityRole="button"
      onStartShouldSetResponder={() => phaseRef.current !== 'done'}
      onResponderGrant={handleTap}
    >
      <Text style={styles.hint} maxFontSizeMultiplier={MINI_GAME_MAX_FONT_SCALE}>{hint}</Text>

      <View style={styles.labels}>
        <Text style={styles.label} maxFontSizeMultiplier={MINI_GAME_MAX_FONT_SCALE}>インパクト</Text>
        <Text style={styles.label} maxFontSizeMultiplier={MINI_GAME_MAX_FONT_SCALE}>パワー →</Text>
      </View>

      <Animated.View
        style={[
          styles.frame,
          { transform: [{ scale: flash.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] },
        ]}
      >
        <View style={styles.trackArea}>
          <View style={styles.track}>
            {/* 暖色の帯（全幅）。右側は覆いで隠す */}
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="teeShotBand" x1="0" y1="0" x2="1" y2="0">
                  {/* 左端は濃い琥珀から。淡い黄で始めると、同じ側にある金色の PERFECT の窓が埋もれる */}
                  <Stop offset="0%" stopColor="#9A4E12" />
                  <Stop offset="50%" stopColor="#E07A1F" />
                  <Stop offset="100%" stopColor="#FF3B2E" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#teeShotBand)" opacity={0.9} />
            </Svg>
            <Animated.View style={[styles.cover, { left: fillEdge }]} />
            {/* 刻みの域。ここで止めると PERFECT は出ない */}
            <View style={[styles.layback, { left: 0, width: pct(LAYBACK_POWER) }]} />
            <View style={[styles.zone, styles.zoneGood, zone(w.good)]} />
            <View
              style={[styles.zone, talkAnswered ? styles.zoneGood : styles.zonePerfect, zone(w.perfect)]}
            />
            <View style={[styles.impactMark, { left: pct(IMPACT_POS) }]} />
            {/* PERFECT の目印。答え済みで PERFECT が出ないときは薄くして狙わせない */}
            <Text
              style={[styles.star, { left: pct(IMPACT_POS) }, talkAnswered && styles.starDim]}
              maxFontSizeMultiplier={MINI_GAME_MAX_FONT_SCALE}
            >
              ★
            </Text>
            {oppMark !== null && <View style={[styles.oppMark, { left: pct(oppMark) }]} />}
            {power !== null && <View style={[styles.powerMark, { left: pct(power) }]} />}
          </View>
          {/* 相手の印の頭。右側の帯は赤に近く、線だけだと埋もれる。凡例の ▼ と同じ形を枠の上に出す */}
          {oppMark !== null && <View style={[styles.oppHead, { left: pct(oppMark) }]} />}
          {/* 位置の印。バーの外（上）へはみ出すので、overflow を切るバーの外に置く */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                left: pos.interpolate({
                  inputRange: [BAR_END, 1],
                  outputRange: [pct(BAR_END), '100%'],
                }),
              },
            ]}
          >
            <View style={styles.indicatorHead} />
            <View style={styles.indicatorLine} />
          </Animated.View>
        </View>
        {/* インパクトの光り */}
        <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />
      </Animated.View>

      <View style={styles.legend}>
        <Text style={styles.legendText} maxFontSizeMultiplier={MINI_GAME_MAX_FONT_SCALE}>
          {`刻み（〜${Math.round(LAYBACK_POWER * 100)}）は PERFECT なし`}
        </Text>
        {opponentDrive !== null && (
          <Text style={[styles.legendText, styles.legendOpp]} maxFontSizeMultiplier={MINI_GAME_MAX_FONT_SCALE}>{`▼ ${opponentName}を越えるパワー`}</Text>
        )}
      </View>
    </View>
  );
}

/** バーの高さ。印の三角はこの上へはみ出す */
const TRACK_H = 44;

const styles = StyleSheet.create({
  area: { paddingVertical: 14, paddingHorizontal: 16 },
  hint: { color: '#FFD700', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  // 下の余白は印の三角（枠の上へ 6px はみ出す）のぶん
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#F5E6C8', fontSize: 11, opacity: 0.8 },
  // 木目の枠。WoodHeader と同じ濃い木と明るい縁
  frame: {
    backgroundColor: COLORS.woodDark,
    borderWidth: 2,
    borderColor: COLORS.woodLight,
    borderRadius: 6,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  trackArea: { height: TRACK_H },
  track: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#24170b',
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 200, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  /** 帯のまだ塗られていない側。バーの地の色で覆う */
  cover: { position: 'absolute', top: 0, bottom: 0, right: 0, backgroundColor: '#24170b' },
  layback: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.07)' },
  zone: { position: 'absolute', top: 0, bottom: 0 },
  // 帯の暖色の上で埋もれないよう、緑は濃いめにして縁を明るくする
  zoneGood: {
    backgroundColor: 'rgba(80, 190, 100, 0.8)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(200, 255, 210, 0.9)',
  },
  zonePerfect: { backgroundColor: 'rgba(255, 215, 0, 0.92)' },
  impactMark: { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: '#ffffff' },
  star: {
    position: 'absolute',
    top: 1,
    width: 20,
    marginLeft: -10,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 15,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  starDim: { opacity: 0.3 },
  // 白い縁を付ける。帯の赤の上でも線が見えるように
  oppMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 5,
    marginLeft: -2.5,
    backgroundColor: '#e63946',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ffffff',
  },
  oppHead: {
    position: 'absolute',
    top: -9,
    width: 0,
    height: 0,
    marginLeft: -6,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ff5a66',
  },
  powerMark: { position: 'absolute', top: 0, bottom: 0, width: 3, marginLeft: -1.5, backgroundColor: '#7fd3ff' },
  indicator: {
    position: 'absolute',
    top: -12,
    bottom: -3,
    width: 18,
    marginLeft: -9,
    alignItems: 'center',
  },
  // 下向きの三角（枠線の色違いで作る）
  indicatorHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
  },
  indicatorLine: {
    flex: 1,
    width: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.55)',
  },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFF6D0', borderRadius: 4 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  legendText: { color: '#F5E6C8', fontSize: 11, opacity: 0.75 },
  legendOpp: { color: '#ff8a8a', opacity: 1 },
});
