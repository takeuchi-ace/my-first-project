/**
 * 効果音 — 音源ファイルを持たず、その場で波形から作る
 *
 * ## なぜ合成か
 *
 * フリー素材はライセンス表記の要否が配布元ごとに違い、
 * 「表記が要るのに書いていない」状態を作りやすい。
 * オシレータとノイズだけで組めば、素材も権利者も存在しない。
 * ファイルが増えないのでバンドルも重くならない。
 *
 * ## 鳴らし方
 *
 * Web Audio API を直接叩く。expo-av は入れていない。
 * ネイティブ（iOS/Android）には Web Audio が無いので、そこでは黙って何もしない。
 * 現状の配信先はブラウザ（Vercel）なので実害はない。
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
 */

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

/** 効果音を鳴らすかどうか。設定画面から切り替える */
export const setSfxEnabled = (v: boolean): void => {
  enabled = v;
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

/** ノイズ。打球の「パシッ」はノイズの立ち上がりで作る */
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
  | 'shot'      // 打球
  | 'cupIn'     // カップイン
  | 'cupMiss'   // 外した
  | 'good'      // 刺さった
  | 'bad'       // 外した（相手の反応）
  | 'tap';      // 選択

/**
 * 鳴らす。設定がオフ、または Web Audio が無い環境では何もしない。
 *
 * 例外は投げない。音が出ないことでゲームが止まるのは本末転倒なので、
 * 失敗はすべて黙って捨てる。
 */
export const playSfx = (name: SfxName): void => {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;

  try {
    switch (name) {
      case 'shot':
        // 芯を食った音。ノイズの一撃に低い胴鳴りを重ねる
        noise(c, t, 0.06, 0.9, 2600);
        tone(c, 220, t, 0.09, 0.35, 'triangle', 120);
        break;

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
