import { SlopeType, PuttAim, PuttResult, GameEvent, ReactionRank, Tag } from '../types';
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

const AIM_CHOICE_TEXT: Record<PuttAim, string> = {
  left: '左にずらして打つ',
  center: 'カップを直接狙う',
  right: '右にずらして打つ',
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

// =====================================================================
// キャラ3〜21のパッティングプロフィール（2026-07-25 追加）
//
// 最終パットは全ラウンドのホール9で必ず発生する。以前は田中・鬼塚以外の19キャラが
// GENERIC_PROFILE（「相手が頷いた」）に落ちていたため、全員分を用意した。
//
// adviceAccuracy はそのキャラの腕前と性格から決めている。
// 読み合いの相手として信用できるかがキャラごとに変わる。
// =====================================================================

/**
 * 狙い所の言い回しを（左／まっすぐ／右）の3つ与えるだけで、
 * 正解アドバイスと誤アドバイスの出し分けを生成する。
 * 誤アドバイス側は WRONG_AIM を経由するので、傾斜によって嘘がそのまま
 * 正解と一致することは起こらない。
 */
const buildAdvice = (
  phrase: Record<PuttAim, string>,
): PuttingCharacterProfile['getAdviceText'] =>
  (slope: SlopeType, isCorrect: boolean) =>
    phrase[isCorrect ? getPuttSlopeVariant(slope).correctAim : WRONG_AIM[slope]];

const BOCCHAN_PROFILE: PuttingCharacterProfile = {
  characterId: 3,
  adviceAccuracy: 0.35,
  reactionIn: '「入った！すごいね今の」と坊っちゃんが手を叩いた。',
  reactionLipOut: '「あー、惜しい。惜しかったねぇ」と坊っちゃんが笑った。',
  reactionMiss: '「まあまあ、こういう日もあるよ」と坊っちゃんがのんびり言った。',
  getAdviceText: buildAdvice({
    left: '「なんとなく左かなあ」と坊っちゃんが首をかしげた。',
    center: '「まっすぐでいいんじゃない？」と坊っちゃんがのんびり言った。',
    right: '「右かなあ。いや、勘だけどね」と坊っちゃんが笑った。',
  }),
};

const KURODA_PROFILE: PuttingCharacterProfile = {
  characterId: 4,
  adviceAccuracy: 0.9,
  reactionIn: '黒田が小さく頷いた。「…それでいい」',
  reactionLipOut: '「ラインは合っていた」と黒田が短く言った。',
  reactionMiss: '黒田は何も言わず、カップの縁を見ていた。',
  getAdviceText: buildAdvice({
    left: '「左だ。芝目が右から入ってる」と黒田が言った。',
    center: '「まっすぐでいい。曲がらない」と黒田が言い切った。',
    right: '「右。それ以外はない」と黒田が短く告げた。',
  }),
};

const SMITH_PROFILE: PuttingCharacterProfile = {
  characterId: 5,
  adviceAccuracy: 0.75,
  reactionIn: '「Beautiful! ナイスパットです」とスミスが手を差し出した。',
  reactionLipOut: '「Oh… so close.」とスミスが天を仰いだ。',
  reactionMiss: '「It happens. 次があります」とスミスが肩をすくめた。',
  getAdviceText: buildAdvice({
    left: '「左を狙うべきです。傾斜がそう言っています」とスミスが言った。',
    center: '「Straight. 余計なことはしない方がいい」とスミスが言った。',
    right: '「右です。My read はそうなります」とスミスが言った。',
  }),
};

const MITSUYAMA_PROFILE: PuttingCharacterProfile = {
  characterId: 6,
  adviceAccuracy: 0.45,
  reactionIn: '「入った！これが引き寄せの力です！」と光山が拳を握った。',
  reactionLipOut: '「今のも意味があります！」と光山が力強く言った。',
  reactionMiss: '「学びですね！最高の学びです！」と光山が笑った。',
  getAdviceText: buildAdvice({
    left: '「左です！心が左を向いてます！」と光山が断言した。',
    center: '「まっすぐ！信じた道をまっすぐ！」と光山が力を込めた。',
    right: '「右ですね！直感がそう言ってます！」と光山が言った。',
  }),
};

const IWAO_PROFILE: PuttingCharacterProfile = {
  characterId: 7,
  adviceAccuracy: 0.6,
  reactionIn: '「うむ、見事」と巌が静かに頷いた。',
  reactionLipOut: '「惜しい。だが打ち切ったのはよかった」と巌が言った。',
  reactionMiss: '巌は何も言わず、静かにグリーンを見ていた。',
  getAdviceText: buildAdvice({
    left: '「左を見て打て。芝は嘘をつかん」と巌が言った。',
    center: '「まっすぐだ。迷えば曲がる」と巌が言った。',
    right: '「右だ。腹を決めて打て」と巌が言った。',
  }),
};

const NAKAMURA_PROFILE: PuttingCharacterProfile = {
  characterId: 8,
  adviceAccuracy: 0.8,
  reactionIn: '「入りましたね。読みと結果が一致すると気持ちいい」と中村が言った。',
  reactionLipOut: '「ラインは正解でした。強さだけの問題です」と中村が分析した。',
  reactionMiss: '「サンプルが増えました」と中村が苦笑した。',
  getAdviceText: buildAdvice({
    left: '「左。傾斜と芝目、両方が左を示してます」と中村が言った。',
    center: '「まっすぐが最適解です。曲げる根拠がない」と中村が言った。',
    right: '「右です。落ち際で右に切れます」と中村が言った。',
  }),
};

const SATO_PROFILE: PuttingCharacterProfile = {
  characterId: 9,
  adviceAccuracy: 0.5,
  reactionIn: '「入れたか」と佐藤がこちらを見て笑った。',
  reactionLipOut: '「惜しいな。…俺の読み、信じた？」と佐藤が聞いてきた。',
  reactionMiss: '「で、今のは俺のせい？」と佐藤が面白そうに言った。',
  getAdviceText: buildAdvice({
    left: '「左だと思うけどな。…信じる？」と佐藤が試すように言った。',
    center: '「まっすぐでいいんじゃないか。たぶん」と佐藤が言った。',
    right: '「右。まあ、自分で読んでもいいぞ」と佐藤が笑った。',
  }),
};

const MATSUMOTO_PROFILE: PuttingCharacterProfile = {
  characterId: 10,
  adviceAccuracy: 0.3,
  reactionIn: '「ナァァイスパット！！今日のMVPです！」と松本が叫んだ。',
  reactionLipOut: '「ナイスライン！入ったも同じですよ！」と松本が言った。',
  reactionMiss: '「ナイストライ！次があります！」と松本が拍手した。',
  getAdviceText: buildAdvice({
    left: '「左！絶対左！僕が言うんだから左！」と松本が言い切った。',
    center: '「まっすぐ！迷わずまっすぐ！」と松本が太鼓判を押した。',
    right: '「右です！間違いない！たぶん！」と松本が言った。',
  }),
};

const DAIMON_PROFILE: PuttingCharacterProfile = {
  characterId: 11,
  adviceAccuracy: 0.55,
  reactionIn: '「…決めるところで決めるか」と大門が目を細めた。',
  reactionLipOut: '「惜しかったな。だが読みは悪くない」と大門が言った。',
  reactionMiss: '大門は何も言わず、こちらを一度だけ見た。',
  getAdviceText: buildAdvice({
    left: '「左だな。私にはそう見える」と大門が言った。',
    center: '「まっすぐでいい。余計な細工は要らん」と大門が言った。',
    right: '「右だ。…あとは君の判断だな」と大門が言った。',
  }),
};

const HOSHINO_PROFILE: PuttingCharacterProfile = {
  characterId: 12,
  adviceAccuracy: 0.35,
  reactionIn: '「入ったー！今の絶対使える！」と星野がスマホを構えた。',
  reactionLipOut: '「惜しい！でも今の"間"は最高だった！」と星野が言った。',
  reactionMiss: '「ドラマは次に持ち越しだな！」と星野が笑った。',
  getAdviceText: buildAdvice({
    left: '「左でしょ、絵になるのは左！」と星野が言った。',
    center: '「まっすぐドーン！それが一番映える！」と星野が言った。',
    right: '「右！右から入るの、画として最高だから！」と星野が言った。',
  }),
};

const KINJO_PROFILE: PuttingCharacterProfile = {
  characterId: 13,
  adviceAccuracy: 0.4,
  reactionIn: '「入ったやん！ええぞ！」と金城が豪快に笑った。',
  reactionLipOut: '「惜しいなあ！もう一回打たせてやりたいわ」と金城が言った。',
  reactionMiss: '「気にすんな、次いこ次！」と金城が背中を叩いた。',
  getAdviceText: buildAdvice({
    left: '「左やろ。ワシの勘やけどな」と金城が言った。',
    center: '「まっすぐ強めに打っとけ。それが一番や」と金城が言った。',
    right: '「右やな。細かいこと考えんと打て」と金城が言った。',
  }),
};

const SHIRAISHI_PROFILE: PuttingCharacterProfile = {
  characterId: 14,
  adviceAccuracy: 0.8,
  reactionIn: '「見事です。力の入れ方が的確でした」と白石が言った。',
  reactionLipOut: '「ラインは正確でした。強さが僅かに足りませんね」と白石が述べた。',
  reactionMiss: '「力が入りましたね。よくあることです」と白石が穏やかに言った。',
  getAdviceText: buildAdvice({
    left: '「左です。傾斜がしっかり出ています」と白石が言った。',
    center: '「まっすぐで問題ありません。無理をしないことです」と白石が言った。',
    right: '「右へ。落ち際で確実に切れます」と白石が言った。',
  }),
};

const CHIZURU_PROFILE: PuttingCharacterProfile = {
  characterId: 15,
  adviceAccuracy: 0.65,
  reactionIn: '「まあ、お見事」と千鶴が静かに手を合わせた。',
  reactionLipOut: '「惜しゅうございましたね」と千鶴が微笑んだ。',
  reactionMiss: '千鶴は静かに頷き、何も言わなかった。',
  getAdviceText: buildAdvice({
    left: '「左に見えますけど、どうでしょう」と千鶴が控えめに言った。',
    center: '「まっすぐでよろしいんやないですか」と千鶴が言った。',
    right: '「右へ、少しだけ」と千鶴が静かに言った。',
  }),
};

const HAJIME_PROFILE: PuttingCharacterProfile = {
  characterId: 16,
  adviceAccuracy: 0.5,
  reactionIn: '「ほら、上がり3ホールだって言ったろ」とハジメが笑った。',
  reactionLipOut: '「惜しい。今のは運が悪いだけだよ」とハジメが言った。',
  reactionMiss: '「気にするな。次のラウンドがあるだろ」とハジメが軽く言った。',
  getAdviceText: buildAdvice({
    left: '「左じゃないかな。まあ僕の読みだけど」とハジメが言った。',
    center: '「まっすぐでいいと思うよ。悩むと入らない」とハジメが言った。',
    right: '「右かな。信じなくてもいいよ」とハジメが笑った。',
  }),
};

const SHINOHARA_PROFILE: PuttingCharacterProfile = {
  characterId: 17,
  adviceAccuracy: 0.8,
  reactionIn: '「ナイス！やっぱり読み通りでしたね」と篠原が即座に言った。',
  reactionLipOut: '「惜しい。ラインは合ってたのでOKです」と篠原が言った。',
  reactionMiss: '「はい、次いきましょう」と篠原がもう歩き出していた。',
  getAdviceText: buildAdvice({
    left: '「左です。傾斜見れば一発で分かります」と篠原が言った。',
    center: '「まっすぐ。曲げる要素ないです」と篠原が即答した。',
    right: '「右ですね。最後に切れます」と篠原が言った。',
  }),
};

const KIRYU_PROFILE: PuttingCharacterProfile = {
  characterId: 18,
  adviceAccuracy: 0.75,
  reactionIn: '「入りましたね。いいパットでした」と桐生が率直に言った。',
  reactionLipOut: '「読みは合ってました。今のは仕方ないです」と桐生が言った。',
  reactionMiss: '「フォローはしませんよ」と桐生が笑った。',
  getAdviceText: buildAdvice({
    left: '「左に見えます。私の読みですけど」と桐生が言った。',
    center: '「まっすぐです。素直に打った方がいいと思います」と桐生が言った。',
    right: '「右ですね。落ち際で切れます」と桐生が言った。',
  }),
};

const TAKAMIYA_PROFILE: PuttingCharacterProfile = {
  characterId: 19,
  adviceAccuracy: 0.85,
  reactionIn: '鷹宮が初めて口の端を上げた。「…上出来だ」',
  reactionLipOut: '「よく打った。それでいい」と鷹宮が言った。',
  reactionMiss: '鷹宮は静かに頷いただけだった。',
  getAdviceText: buildAdvice({
    left: '「左だ」と鷹宮が短く言った。',
    center: '「まっすぐ打て。迷うな」と鷹宮が言った。',
    right: '「右。それだけだ」と鷹宮が告げた。',
  }),
};

const HAYASE_PROFILE: PuttingCharacterProfile = {
  characterId: 20,
  adviceAccuracy: 0.8,
  reactionIn: '「入りましたね。読みと強さ、両方合ってました」と早瀬が言った。',
  reactionLipOut: '「ラインは正解です。強さが2割足りませんでした」と早瀬が言った。',
  reactionMiss: '「前提が違いましたね」と早瀬が冷静に言った。',
  getAdviceText: buildAdvice({
    left: '「左です。傾斜の数字がそう出ています」と早瀬が言った。',
    center: '「まっすぐ。曲げる根拠がありません」と早瀬が言い切った。',
    right: '「右です。結論から言うと右です」と早瀬が言った。',
  }),
};

const MITSUKI_PROFILE: PuttingCharacterProfile = {
  characterId: 21,
  adviceAccuracy: 0.4,
  reactionIn: '「入った！すごいすごい！」とミツキが飛び跳ねた。',
  reactionLipOut: '「あー惜しい！今の入ってほしかった！」とミツキが言った。',
  reactionMiss: '「大丈夫大丈夫、楽しいのが一番！」とミツキが笑った。',
  getAdviceText: buildAdvice({
    left: '「左っぽくない？なんとなくだけど」とミツキが言った。',
    center: '「まっすぐでいいと思う！迷ったら負け！」とミツキが言った。',
    right: '「右かな〜。当たってたら褒めてね」とミツキが笑った。',
  }),
};

const PROFILE_MAP: Record<number, PuttingCharacterProfile> = {
  1: TANAKA_PROFILE,
  2: ONIZUKA_PROFILE,
  3: BOCCHAN_PROFILE,
  4: KURODA_PROFILE,
  5: SMITH_PROFILE,
  6: MITSUYAMA_PROFILE,
  7: IWAO_PROFILE,
  8: NAKAMURA_PROFILE,
  9: SATO_PROFILE,
  10: MATSUMOTO_PROFILE,
  11: DAIMON_PROFILE,
  12: HOSHINO_PROFILE,
  13: KINJO_PROFILE,
  14: SHIRAISHI_PROFILE,
  15: CHIZURU_PROFILE,
  16: HAJIME_PROFILE,
  17: SHINOHARA_PROFILE,
  18: KIRYU_PROFILE,
  19: TAKAMIYA_PROFILE,
  20: HAYASE_PROFILE,
  21: MITSUKI_PROFILE,
};

export const getPuttingProfile = (characterId: number): PuttingCharacterProfile => {
  const profile = PROFILE_MAP[characterId];
  if (profile) return profile;
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

/**
 * そのとき相手が指した狙い所。
 * 誤アドバイスのときは WRONG_AIM、正しいときは correctAim を指している。
 */
export const getAdvisedAim = (
  slope: SlopeType,
  adviceIsCorrect: boolean
): PuttAim => (adviceIsCorrect ? getPuttSlopeVariant(slope).correctAim : WRONG_AIM[slope]);

/**
 * 狙いを決めた直後に相手が言うこと。
 *
 * 通常の反応テンプレートは「何を選んだか」を見ないので、
 * ここでは場面に合った言葉を選択とランクの組み合わせで返す。
 */
const AIM_REPLIES: Record<'follow' | 'defy', Record<'up' | 'mid' | 'down', string[]>> = {
  follow: {
    up: ['そう、そこです。', '信じてもらえましたね。', 'ええ、そのラインです。'],
    mid: ['では、決めてください。', '…はい、そこで。'],
    down: ['…言われた通りに、ですか。', '自分の目は、使わないんですね。'],
  },
  defy: {
    up: ['…自分で読みましたか。いい目だ。', 'なるほど、そう見ましたか。'],
    mid: ['…その線もありますね。', 'ふむ。お手並み拝見です。'],
    down: ['…私の読みが、信用できませんか。', 'そうですか。ご自由に。'],
  },
};

export const getPuttAimReply = (
  followedAdvice: boolean,
  rank: ReactionRank
): string => {
  const tier = rank === 'good' ? 'up' : rank === 'neutral' ? 'mid' : 'down';
  const pool = AIM_REPLIES[followedAdvice ? 'follow' : 'defy'][tier];
  return pool[Math.floor(Math.random() * pool.length)];
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
  const advisedAim = getAdvisedAim(slope, adviceIsCorrect);

  return {
    id: `putting_event_${slope}_${adviceIsCorrect ? 'correct' : 'wrong'}`,
    title: '最終パット',
    description: `${variant.description}\n\n${adviceText}`,
    stage: 9,
    choices: (['left', 'center', 'right'] as PuttAim[]).map((aim) => {
      // 3択は社交的に3通りの意味を持つ。
      //   相手の読みに乗る       … 顔を立てる（おもねる）
      //   自分で正しい線を読む   … 相手の読みを退けて自分の目を信じる
      //   どちらでもない         … 誰の読みでもない場所。判断を放棄している
      // 全部 focus+1 のままだと trust が動かず 94% が bad に落ち、
      // 狙いを決めただけで相手が毎ラウンド不機嫌になっていた（実測）。
      if (aim === advisedAim) {
        return {
          text: AIM_CHOICE_TEXT[aim],
          delta: { trust: 3, fun: 2, focus: 1 },
          tags: ['etiquette', 'flattery'] as Tag[],
        };
      }
      if (aim === variant.correctAim) {
        return {
          text: AIM_CHOICE_TEXT[aim],
          delta: { trust: 2, focus: 2 },
          tags: ['honesty', 'bold'] as Tag[],
        };
      }
      return {
        text: AIM_CHOICE_TEXT[aim],
        // 誰の読みでもない場所。相手の顔も立てず自分の目も使っていない
        delta: { trust: -1, focus: 1 },
        tags: ['safe'] as Tag[],
      };
    }),
  };
};
