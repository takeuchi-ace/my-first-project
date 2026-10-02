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
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { IMPACT_POS, LAYBACK_POWER, powerToOutdrive, teeShotWindow } from '../logic/teeShot';
import { playSfx } from '../lib/sound';

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

const pct = (v: number) => `${v * 100}%` as `${number}%`;

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
      animRef.current?.stop();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      finish(posRef.current);
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
          : '';

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
      <Text style={styles.hint}>{hint}</Text>

      <View style={styles.labels}>
        <Text style={styles.label}>インパクト</Text>
        <Text style={styles.label}>パワー →</Text>
      </View>

      <View style={styles.track}>
        {/* 刻みの域。ここで止めると PERFECT は出ない */}
        <View style={[styles.layback, { left: 0, width: pct(LAYBACK_POWER) }]} />
        <View style={[styles.zone, styles.zoneGood, zone(w.good)]} />
        <View
          style={[styles.zone, talkAnswered ? styles.zoneGood : styles.zonePerfect, zone(w.perfect)]}
        />
        <View style={[styles.impactMark, { left: pct(IMPACT_POS) }]} />
        {oppMark !== null && <View style={[styles.oppMark, { left: pct(oppMark) }]} />}
        {power !== null && <View style={[styles.powerMark, { left: pct(power) }]} />}
        <Animated.View
          style={[
            styles.indicator,
            {
              left: pos.interpolate({
                inputRange: [BAR_END, 1],
                outputRange: [pct(BAR_END), '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>
          {`刻み（〜${Math.round(LAYBACK_POWER * 100)}）は PERFECT なし`}
        </Text>
        {opponentDrive !== null && (
          <Text style={[styles.legendText, styles.legendOpp]}>{`▼ ${opponentName}を越えるパワー`}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { paddingVertical: 14, paddingHorizontal: 16 },
  hint: { color: '#FFD700', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#F5E6C8', fontSize: 11, opacity: 0.8 },
  track: {
    height: 26,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    borderColor: '#F5E6C8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  layback: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.06)' },
  zone: { position: 'absolute', top: 0, bottom: 0 },
  zoneGood: { backgroundColor: 'rgba(255, 215, 0, 0.25)' },
  zonePerfect: { backgroundColor: 'rgba(255, 215, 0, 0.6)' },
  impactMark: { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: '#ffffff' },
  oppMark: { position: 'absolute', top: 0, bottom: 0, width: 3, marginLeft: -1.5, backgroundColor: '#e63946' },
  powerMark: { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: '#7fd3ff' },
  indicator: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 6,
    marginLeft: -3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  legendText: { color: '#F5E6C8', fontSize: 11, opacity: 0.75 },
  legendOpp: { color: '#ff8a8a', opacity: 1 },
});
