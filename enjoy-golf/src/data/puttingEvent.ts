import { SlopeType, PuttAim, PuttResult, GameEvent } from '../types';
import { withCharacterName } from '../lib/characterText';

// ===== Slope variant definition =====
export interface PuttSlopeVariant {
  slope: SlopeType;
  description: string;
  correctAim: PuttAim;
}

const SLOPE_VARIANTS: PuttSlopeVariant[] = [
  {
    slope: 'left',
    description: 'グリーンは左に傾いている。ボールは左へと流れるだろう。',
    correctAim: 'right',
  },
  {
    slope: 'right',
    description: 'グリーンは右へ下がっている。慎重に読まないとラインを外す。',
    correctAim: 'left',
  },
  {
    slope: 'flat',
    description: 'グリーンはほぼ平坦だ。真っ直ぐ狙えるチャンスだ。',
    correctAim: 'center',
  },
  {
    slope: 'uphill',
    description: '上り傾斜。しっかり打たないと届かない。',
    correctAim: 'center',
  },
];

export const getPuttSlopeVariant = (slope: SlopeType): PuttSlopeVariant => {
  return SLOPE_VARIANTS.find((v) => v.slope === slope)!;
};

/**
 * 誤アドバイス時に相手が指す狙い所。
 * correctAim と必ず食い違うよう傾斜ごとに定義する
 * （ここを一律にすると、傾斜によっては嘘がそのまま正解になってしまう）。
 */
const WRONG_AIM: Record<SlopeType, PuttAim> = {
  left: 'left',    // 正解は right
  right: 'right',  // 正解は left
  flat: 'right',   // 正解は center
  uphill: 'left',  // 正解は center
};

const AIM_WORD: Record<PuttAim, string> = {
  left: '左',
  right: '右',
  center: 'まっすぐ',
};

// ===== Character profile for putting =====
export interface PuttingCharacterProfile {
  characterId: number;
  adviceAccuracy: number; // 0.0〜1.0
  reactionIn: string;
  reactionLipOut: string;
  reactionMiss: string;
  getAdviceText: (slope: SlopeType, isCorrect: boolean) => string;
}

const TANAKA_PROFILE: PuttingCharacterProfile = {
  characterId: 1,
  adviceAccuracy: 0.8,
  reactionIn: '「...読み通りでしたね」と田中が静かに頷いた。',
  reactionLipOut: '「惜しかった。ラインは合っていました」と田中が言った。',
  reactionMiss: '田中が一瞬目を逸らした。',
  getAdviceText: (slope: SlopeType, isCorrect: boolean) => {
    if (slope === 'left') {
      return isCorrect
        ? '「右にずらして打つのが正解です。データ上も同じ傾斜でのミスが多い」と田中が分析した。'
        : '「カップを直接狙ってみては。私の読みでは...」と田中が言った。';
    }
    if (slope === 'right') {
      return isCorrect
        ? '「左寄りに打つといい。右への傾斜が強い」と田中が静かに言った。'
        : '「そのまま真っ直ぐでいいと思います」と田中が言った。';
    }
    if (slope === 'flat') {
      return isCorrect
        ? '「平坦ですね。カップを直接狙えます」と田中が淡々と言った。'
        : '「少し右に外してみては」と田中が提案した。';
    }
    // uphill
    return isCorrect
      ? '「上りですが、真っ直ぐ打てば問題ない傾斜です」と田中が告げた。'
      : '「右に外した方がラインが出やすいと思います」と田中が言った。';
  },
};

const ONIZUKA_PROFILE: PuttingCharacterProfile = {
  characterId: 2,
  adviceAccuracy: 0.5,
  reactionIn: '「入ったぁ！！読んだな！！」鬼塚が飛び上がった。',
  reactionLipOut: '「惜し〜！！次は絶対入れろよ！」',
  reactionMiss: '「気にすんな！最後はガッツだ！」',
  getAdviceText: (slope: SlopeType, isCorrect: boolean) => {
    if (isCorrect) {
      const aim = getPuttSlopeVariant(slope).correctAim;
      return `「${AIM_WORD[aim]}に打てばいいぞ！カンだけどな！」と鬼塚が豪快に言った。`;
    }
    return `「${AIM_WORD[WRONG_AIM[slope]]}に打っとけ！勢いで決めろ！！」と鬼塚が言った。`;
  },
};

const GENERIC_PROFILE: PuttingCharacterProfile = {
  characterId: -1,
  adviceAccuracy: 0.6,
  reactionIn: '「...ナイスパット」と相手が頷いた。',
  reactionLipOut: '「惜しかったですね」と相手が言った。',
  reactionMiss: '相手が何も言わず前を向いた。',
  getAdviceText: (slope: SlopeType, isCorrect: boolean) => {
    if (isCorrect) {
      if (slope === 'left') return '「右に外した方がいいと思いますよ」と相手がアドバイスした。';
      if (slope === 'right') return '「左寄りに狙うといいかもしれません」と相手が言った。';
      return '「真っ直ぐ狙えばいいと思います」と相手が言った。';
    }
    if (slope === 'left') return '「左寄りに狙うといいと思いますよ」と相手が言った。';
    if (slope === 'right') return '「右に外した方がいいかもしれません」と相手が言った。';
    if (slope === 'flat') return '「少し右に外してみてはどうでしょう」と相手が言った。';
    return '「左寄りに狙った方がラインが出ると思います」と相手が言った。';
  },
};

export const getPuttingProfile = (characterId: number): PuttingCharacterProfile => {
  if (characterId === 1) return TANAKA_PROFILE;
  if (characterId === 2) return ONIZUKA_PROFILE;
  return GENERIC_PROFILE;
};

export const getPuttReactionText = (
  characterId: number,
  result: PuttResult,
): string => {
  const profile = getPuttingProfile(characterId);
  const text =
    result === 'in'
      ? profile.reactionIn
      : result === 'lip_out'
        ? profile.reactionLipOut
        : profile.reactionMiss;
  return withCharacterName(text, characterId);
};

// ===== Build GameEvent for putting =====
export const buildPuttingGameEvent = (
  slope: SlopeType,
  adviceIsCorrect: boolean,
  characterId: number,
): GameEvent => {
  const variant = getPuttSlopeVariant(slope);
  const profile = getPuttingProfile(characterId);
  const adviceText = profile.getAdviceText(slope, adviceIsCorrect);

  return {
    id: `putting_event_${slope}_${adviceIsCorrect ? 'correct' : 'wrong'}`,
    title: '最終パット',
    description: `${variant.description}\n\n${adviceText}`,
    stage: 9,
    choices: [
      { text: '左にずらして打つ', delta: { focus: 1 }, tags: ['focus'] },
      { text: 'カップを直接狙う', delta: { focus: 1 }, tags: ['bold'] },
      { text: '右にずらして打つ', delta: { focus: 1 }, tags: ['focus'] },
    ],
  };
};
