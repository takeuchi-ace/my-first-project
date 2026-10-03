/**
 * 効果音 — 合成した音と、オーナー自身が録った打球音1つ
 *
 * ## なぜ合成か
 *
 * フリー素材はライセンス表記の要否が配布元ごとに違い、
 * 「表記が要るのに書いていない」状態を作りやすい。
 * オシレータとノイズだけで組めば、素材も権利者も存在しない。
 * ファイルが増えないのでバンドルも重くならない。
 *
 * ## 例外：朝イチのインパクト音（`impact`）
 *
 * 合成の「パシッ」では芯を食った手応えが出なかったので、ここだけ録音を使う。
 * `assets/sounds/impact.m4a` は**オーナー自身のスイング動画から切り出した音**（2026-10-03）。
 * 第三者の素材ではないので、権利の問題は起きない（フリー素材を入れない方針はそのまま）。
 * 0.55 秒、打音が 5ms ほどで立ち上がるよう頭を詰めてある。
 *
 * ## 鳴らし方
 *
 * 合成音は Web Audio API を直接叩く。ネイティブ（iOS/Android）には Web Audio が無いので、
 * **合成音は Web だけ**で、ネイティブでは黙って何もしない。
 * 押しても何も起きない「音 ON」を出さないよう、ネイティブのタイトル画面は
 * トグルを置かず、「音 ON」を消した画像を使う（TitleScreen.tsx）。
 *
 * インパクト音は expo-audio で鳴らすので、**Web とネイティブの両方で鳴る**。
 * expo-audio はネイティブモジュールなので、入っていないビルド（build 2 まで）では鳴らない。
 * マイクは使わない（app.json のプラグイン設定でマイクの使用目的の文言も出さない）。
 *
 * ブラウザは「ユーザー操作より前に鳴らす」ことを禁じている。
 * 効果音はすべてタップの結果として鳴るので条件は満たすが、
 * 初回だけ AudioContext が suspended で始まるため resume() を挟む。
 *
 * ## 音作りの方針
 *
 * 短く、小さく、耳につかないこと。
 * このゲームは相手の表情と間合いを読む時間が本体なので、
 * 音が主張すると読む邪魔になる。最長でも 0.4 秒、音量は控えめに固定する。
 * （インパクト音の 0.55 秒は打球の余韻ぶん。鳴るのは朝イチの一打だけ）
 */

import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let enabled = true;

/**
 * 全体の音量。ここだけで絞れるようにしておく。
 *
 * 0.18 だと各音のピークが 0.02〜0.10（およそ -20dB）にしかならず、
 * 環境音のある場所では聞こえない。0.32 でピーク 0.04〜0.18。
 * それでも短い音ばかりなので耳につくほどではない。
 */
const MASTER = 0.32;

const getCtx = (): Ctx | null => {
  if (typeof window === 'undefined') return null;
  const AC =
    (window as any).AudioContext ?? (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') {
    // 初回タップで解除される。失敗しても音が出ないだけなので握りつぶす
    ctx.resume().catch(() => {});
  }
  return ctx;
};

/**
 * 効果音を鳴らすかどうか。Web のタイトル画面のトグルから切り替える。
 *
 * **ネイティブでは false を受け付けない**（常に鳴らす）。ネイティブのタイトル画面には
 * トグルが無く（冒頭「鳴らし方」）、オンに戻す手段がない。build 1 にはトグルがあったので、
 * そのとき切った端末は保存された false を読み込み続け、インパクト音が二度と鳴らなくなる。
 * ネイティブで消したい人は iOS の消音スイッチで消せる（playsInSilentMode を立てていない）
 */
export const setSfxEnabled = (v: boolean): void => {
  enabled = v || Platform.OS !== 'web';
};

// ===== 録音の音（expo-audio） =====

/** 朝イチのインパクト音。オーナー自身の録音（冒頭参照） */
const IMPACT_SOURCE = require('../../assets/sounds/impact.m4a');

let impactPlayer: AudioPlayer | null = null;
/** 作るのに失敗したら二度と試さない（毎タップで例外を出し続けないため） */
let impactBroken = false;

const getImpactPlayer = (): AudioPlayer | null => {
  if (impactPlayer || impactBroken) return impactPlayer;
  try {
    if (Platform.OS !== 'web') {
      // iOS の消音スイッチには従う（playsInSilentMode は立てない）。
      // 効果音のためにマナーモードを破らない。
      // 何も設定しないと iOS の既定（soloAmbient）で、鳴った瞬間にほかのアプリの
      // 音楽が止まる。mixWithOthers で ambient にして、流している音楽の上に重ねる
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    const p = createAudioPlayer(IMPACT_SOURCE);
    // 鳴り終わったらすぐ頭に戻しておく。タップの時点では play() を呼ぶだけで済むように
    // （seekTo は非同期なので、タップのたびに戻してから鳴らすと、戻しきる前に play が来て
    // 前回の終わり＝無音の所から鳴る・頭が欠けることがある）
    p.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish) p.seekTo(0).catch(() => {});
    });
    impactPlayer = p;
  } catch {
    impactBroken = true;
    impactPlayer = null;
  }
  return impactPlayer;
};

/**
 * 録音の音を先に読み込んでおく。初めて鳴らすときに読み込みを待つと、
 * タップから音までが遅れて「当たった」感じがずれる。メーターが出た時点で呼ぶ
 */
export const preloadSfx = (): void => {
  getImpactPlayer();
};

const playImpact = (): void => {
  const p = getImpactPlayer();
  if (!p) return;
  try {
    // ふだんは鳴り終わりで頭に戻してある（getImpactPlayer の購読）ので、そのまま鳴らす。
    // まだ鳴っている途中（素早く続けて打った）や、戻しが間に合っていないときだけ、
    // 戻しきってから鳴らす。そのぶんわずかに遅れるが、途中や終わりから鳴るよりよい
    if (p.currentTime > 0.05) {
      p.seekTo(0)
        .then(() => p.play())
        .catch(() => {});
    } else {
      p.play();
    }
  } catch {
    // 鳴らせなくても進行は止めない
  }
};

// ===== 部品 =====

/** 単音。減衰は指数で落とす（線形だとブツッと切れる） */
const tone = (
  c: Ctx,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  type: OscillatorType = 'sine',
  endFreq?: number
): void => {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), start + dur);
  }
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain * MASTER, start + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
};

/** ノイズ。縁を舐める「ザッ」などの擦れる音に使う */
const noise = (
  c: Ctx,
  start: number,
  dur: number,
  gain: number,
  filterHz: number
): void => {
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    // 後ろに行くほど小さくして、余韻を残さない
    d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = filterHz;
  bp.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(gain * MASTER, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  src.start(start);
  src.stop(start + dur + 0.02);
};

// ===== 音の種類 =====

export type SfxName =
  | 'impact'    // 朝イチのインパクト（録音。Web・ネイティブとも鳴る）
  | 'cupIn'     // カップイン
  | 'cupMiss'   // 外した
  | 'good'      // 刺さった
  | 'bad'       // 外した（相手の反応）
  | 'tap';      // 選択

/**
 * 鳴らす。設定がオフ、または Web Audio が無い環境では何もしない
 * （`impact` だけは録音なので Web Audio が無くても鳴る）。
 *
 * 例外は投げない。音が出ないことでゲームが止まるのは本末転倒なので、
 * 失敗はすべて黙って捨てる。
 */
export const playSfx = (name: SfxName): void => {
  if (!enabled) return;
  if (name === 'impact') {
    playImpact();
    return;
  }
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;

  try {
    switch (name) {
      case 'cupIn':
        // カップの底で跳ねる。落ちる音を2回、間を詰めて
        tone(c, 880, t, 0.07, 0.5, 'sine', 620);
        tone(c, 660, t + 0.07, 0.12, 0.4, 'sine', 440);
        tone(c, 440, t + 0.16, 0.22, 0.25, 'sine', 330);
        break;

      case 'cupMiss':
        // 縁を舐めて外れる。高いところから下がって、鳴りきらない
        tone(c, 700, t, 0.1, 0.35, 'sine', 520);
        noise(c, t + 0.08, 0.09, 0.35, 900);
        break;

      case 'good':
        // 短い2音。上がって終わる
        tone(c, 587, t, 0.1, 0.32, 'sine');
        tone(c, 784, t + 0.07, 0.18, 0.28, 'sine');
        break;

      case 'bad':
        // 半音下げて濁らせる。低く、短く
        tone(c, 262, t, 0.16, 0.3, 'triangle');
        tone(c, 247, t + 0.02, 0.2, 0.24, 'triangle');
        break;

      case 'tap':
        // 選択の手応え。ほとんど聞こえない程度
        tone(c, 1200, t, 0.03, 0.12, 'sine', 900);
        break;
    }
  } catch {
    // 鳴らせなくても進行は止めない
  }
};
