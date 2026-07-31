/**
 * 「何をした選択か」に噛み合った返事
 *
 * 従来、選択肢に専用セリフ（`Choice.speech`）が無い場合は
 * `speechLineTemplates[口調スタイル][ランク]` からランダムに1行引いていた。
 * これは**プレイヤーが何を言ったかを見ていない**ため、
 * 何を選んでも「ま、そういう手もあるか。」のような返事になっていた（監査 C-5）。
 *
 * 選択肢ごとに4行書くと 1,022件 × 4 = 約4,000行になるうえ、
 * 大半が機械的な量産になる。代わりに**タグ**（＝その選択がどういう行為か）を鍵にした。
 * 39種 × 4ランク で全1,070選択肢を覆える。
 *
 * 口調が正体になっているキャラ（体育会系・方言・英語混じり等）では
 * 共通セリフを使うとキャラが崩れるため、従来どおり `resolveChoiceSpeech` が
 * このプールを使わずキャラ専用テンプレートに戻す。
 */

import { ReactionRank, Tag } from '../types';

type RankLines = Record<ReactionRank, string[]>;

/**
 * タグの優先順位。1つの選択肢が複数のタグを持つとき、
 * **より具体的に「何をしたか」を表すもの**を先に拾う。
 * `safe` `neutral` `extreme` のような色の薄いタグは最後に置く。
 */
export const TAG_SPEECH_PRIORITY: Tag[] = [
  'cheat_physical',
  'cheat',
  'cheat_score',
  'snitch',
  'over_praise',
  'over_support',
  'flattery',
  'silence',
  'alcohol',
  'distance',
  'excuse',
  'pressure',
  'boss',
  'kiai',
  'risk',
  'adversity',
  'challenge',
  'bro',
  'team',
  'back_up',
  'self_reflect',
  'analysis_praise',
  'ethics',
  'sportsmanship',
  'fair_compete',
  'hype',
  'ride_the_mood',
  'bold',
  'humor',
  'logic',
  'serious',
  'honesty',
  'etiquette',
  'safe_play',
  'avoid_risk',
  'focus',
  'safe',
  'neutral',
  'extreme',
];

export const tagSpeechLines: Partial<Record<Tag, RankLines>> = {
  // ===== 不正 =====
  cheat_physical: {
    good: ['…今のは、見ていませんでした。', '気が回りますね。助かります。'],
    neutral: ['…今、何かしました？', '…見なかったことにします。'],
    bad: ['今、動かしましたね。', 'それはやめてください。'],
    worst: ['ゴルフを何だと思っているんですか。', 'それは、もうゴルフではない。'],
  },
  cheat: {
    good: ['…その話は聞かなかったことに。', '話の早い人ですね。'],
    neutral: ['…まあ、そういう手も。', '…そうですか。'],
    bad: ['それはできません。', 'まずいでしょう、それは。'],
    worst: ['そんな提案をする人だとは。', '二度と言わないでください。'],
  },
  cheat_score: {
    good: ['…細かいことは、まあ。', 'そういうことにしておきましょうか。'],
    neutral: ['…数えていましたか、そこ。', '…まあ、いいでしょう。'],
    bad: ['数字は正確にお願いします。', 'それは、まずいでしょう。'],
    worst: ['スコアを汚す気ですか。', '正確でないスコアに意味はない。'],
  },
  snitch: {
    good: ['記録が残るのは、悪くない。', '証拠好きですね。'],
    neutral: ['…撮っているんですか。', '…ご自由に。'],
    bad: ['それ、やめてもらえますか。', '撮られるのは好みません。'],
    worst: ['言いつける気ですか。', '趣味が悪い。'],
  },

  // ===== 持ち上げる・世話を焼く =====
  over_praise: {
    good: ['そこまで言われると、照れますね。', '大げさだが、悪い気はしない。'],
    neutral: ['はは、言いすぎですよ。', '…大げさな人だ。'],
    bad: ['盛りすぎです。', 'そこまで言われると嘘くさい。'],
    worst: ['馬鹿にしていますか。', 'そんなに褒めても、何も出ませんよ。'],
  },
  over_support: {
    good: ['そこまでしてもらって、恐縮です。', '気が利きますね。'],
    neutral: ['…どうも。', 'そこまでしなくても大丈夫ですよ。'],
    bad: ['やりすぎですよ。', '子ども扱いされている気分だ。'],
    worst: ['そこまでされると、こちらが困ります。', '自分でできますから。'],
  },
  flattery: {
    good: ['そう言ってもらえると、悪くない。', '持ち上げるのが上手ですね。'],
    neutral: ['はは、お上手ですね。', '…どうも。'],
    bad: ['…そういうのは、いいですから。', '褒めれば済むと思っていませんか。'],
    worst: ['見え透いていますよ。', 'そういうのは、かえって失礼です。'],
  },

  // ===== 引く・黙る =====
  silence: {
    good: ['…黙っていてくれて助かります。', '言葉はいらないですね。'],
    neutral: ['…。', '…ええ。'],
    bad: ['…何か言ってください。', '黙られると、こちらが困る。'],
    worst: ['その沈黙は、何ですか。', '無視されている気分だ。'],
  },
  distance: {
    good: ['…気を遣わせましたね。', '察してくれましたか。'],
    neutral: ['…そうですね。', 'まあ、そういうことにしましょう。'],
    bad: ['遠回しですね。', 'はっきり言ったらどうです。'],
    worst: ['他人事のように言いますね。', '線を引かれている気がします。'],
  },
  excuse: {
    good: ['…まあ、そういう日もあります。', '気にしないでください。'],
    neutral: ['…そうですか。', 'なるほど。'],
    bad: ['言い訳ですね。', '風のせいにしますか。'],
    worst: ['みっともないですよ。', '認めたらどうです。'],
  },

  // ===== 酒・場 =====
  alcohol: {
    good: ['いい飲みっぷりだ。', '付き合いのいい人ですね。'],
    neutral: ['はい、いただきます。', '…ほどほどにしましょうか。'],
    bad: ['昼から、ですか。', 'まだプレー中ですよ。'],
    worst: ['飲みに来たわけではないでしょう。', 'その調子だと、後半持ちませんよ。'],
  },
  hype: {
    good: ['その勢い、悪くないですね。', '乗せるのが上手い。'],
    neutral: ['…はいはい。', '元気な人ですね。'],
    bad: ['少しうるさいですよ。', 'そこまで盛り上げなくても。'],
    worst: ['一人で騒がないでください。', '空回りしていますよ。'],
  },
  ride_the_mood: {
    good: ['その切り替え、いいですね。', 'では、そうしましょう。'],
    neutral: ['…はい。', 'ええ、そうですね。'],
    bad: ['調子がいいですね。', '合わせているだけでしょう。'],
    worst: ['流されているだけですよ。', 'ご自分の考えは無いんですか。'],
  },
  bro: {
    good: ['いいですね、その距離感。', '調子が出てきましたね。'],
    neutral: ['…はは。', 'ええ。'],
    bad: ['馴れ馴れしいですね。', '少し距離が近い。'],
    worst: ['そこまで親しくありませんよ。', '不躾ですね。'],
  },
  team: {
    good: ['一緒にやりましょう。', '心強いですね。'],
    neutral: ['…ええ。', 'はい。'],
    bad: ['巻き込まないでください。', '一人でやりますよ。'],
    worst: ['馴れ合う気はありません。', 'そういうのは、結構です。'],
  },
  back_up: {
    good: ['助かります。', 'そう言ってもらえると気が楽だ。'],
    neutral: ['…どうも。', 'ええ。'],
    bad: ['気を遣わせましたね。', '大丈夫ですよ、そこまでは。'],
    worst: ['同情はいりません。', '見下されている気がします。'],
  },

  // ===== 攻める =====
  kiai: {
    good: ['その気合、伝わりますよ。', 'いい顔をしていますね。'],
    neutral: ['…気合十分ですね。', 'はい、いきましょう。'],
    bad: ['気合だけでは入りませんよ。', '声を出せばいいというものでも。'],
    worst: ['精神論はやめましょう。', '正直、うるさいですね。'],
  },
  risk: {
    good: ['その賭け、乗りましょう。', '面白い。'],
    neutral: ['…思い切りますね。', '賭けますか。'],
    bad: ['危ない橋ですね。', '無理をする場面ではない。'],
    worst: ['無謀です。', '何を考えているんですか。'],
  },
  adversity: {
    good: ['その強さ、いいですね。', '頼もしい。'],
    neutral: ['…そうですね。', 'ええ。'],
    bad: ['無理をしていませんか。', '強がりに聞こえます。'],
    worst: ['意地を張る場面ではない。', '空元気は疲れますよ。'],
  },
  challenge: {
    good: ['望むところです。', '面白い、やりましょう。'],
    neutral: ['…いいですね。', 'はい、やりましょう。'],
    bad: ['挑発ですか。', '今、それを言いますか。'],
    worst: ['勝負を煽らないでください。', 'そういうのは結構です。'],
  },
  bold: {
    good: ['思い切りがいい。嫌いじゃない。', 'そうこなくては。'],
    neutral: ['…強気ですね。', 'なるほど、攻めますか。'],
    bad: ['無茶を言う。', '威勢はいいですが。'],
    worst: ['向こう見ずにも程がある。', 'その勢いだけで来られても困ります。'],
  },
  fair_compete: {
    good: ['いいですね、やりましょう。', '対等にいきましょう。'],
    neutral: ['…ええ。', 'はい。'],
    bad: ['勝ち負けにこだわりますね。', 'そこまで真剣にならなくても。'],
    worst: ['今日はそういう日ではないでしょう。', 'competitive すぎますよ。'],
  },

  // ===== 圧・立場 =====
  pressure: {
    good: ['…言ってくれてよかった。', 'きちんと言える人ですね。'],
    neutral: ['…はい。', 'わかりました。'],
    bad: ['圧をかけますね。', 'そういう言い方をしますか。'],
    worst: ['脅しているつもりですか。', '不愉快です。'],
  },
  boss: {
    good: ['話が早くて助かります。', 'では、その話をしましょう。'],
    neutral: ['…なるほど。', '後ほど伺います。'],
    bad: ['今、その話をしますか。', 'ここは仕事場ではありませんよ。'],
    worst: ['商談に来たんですか。', '興ざめです。'],
  },

  // ===== 筋・誠実 =====
  ethics: {
    good: ['そこを曲げないのはいい。', '筋の通った人ですね。'],
    neutral: ['…ええ、それが正しい。', 'その通りです。'],
    bad: ['正しさを振りかざしますね。', '…お説ごもっともです。'],
    worst: ['潔癖なのも考えものですよ。', '誰も聖人の話はしていません。'],
  },
  sportsmanship: {
    good: ['そう来なくては。', '対等にやりましょう。'],
    neutral: ['ええ、それでいきましょう。', '…結構です。'],
    bad: ['杓子定規ですね。', 'そこまで厳密にしなくても。'],
    worst: ['ルールの話ばかりですね。', '窮屈な人だ。'],
  },
  self_reflect: {
    good: ['素直ですね。いい姿勢だ。', '認められる人は伸びます。'],
    neutral: ['…そうですか。', '気にしないでください。'],
    bad: ['自分を責めすぎです。', 'そこまで気に病まなくても。'],
    worst: ['湿っぽいですね。', '謝られても困ります。'],
  },
  honesty: {
    good: ['正直に言ってくれるんですね。', 'そういう話が聞きたかった。'],
    neutral: ['なるほど、率直ですね。', 'そうですか、ありがとうございます。'],
    bad: ['…そこまで言わなくても。', '正直なのも、程度によりますね。'],
    worst: ['それ、今言う必要がありますか。', '正直と無神経は違いますよ。'],
  },

  // ===== 見る・読む =====
  analysis_praise: {
    good: ['よく見ていますね。', 'そこに気づく人は少ない。'],
    neutral: ['…なるほど。', 'そういう見方ですか。'],
    bad: ['解説はいりませんよ。', '評論家のようですね。'],
    worst: ['上から見ていますか。', '批評されている気分です。'],
  },
  logic: {
    good: ['筋が通っている。', 'その読みは正しい。'],
    neutral: ['理屈ではそうですね。', 'なるほど、理屈は。'],
    bad: ['理屈っぽいですね。', '正しさだけで動く話でもない。'],
    worst: ['理屈で人が動くと思っていますか。', 'その正論、今いりますか。'],
  },
  serious: {
    good: ['よく見ていますね。', '真剣に付き合ってくれている。'],
    neutral: ['…なるほど。', 'そういう見方もありますね。'],
    bad: ['そこまで硬くならなくても。', '話が重いですね。'],
    worst: ['説教ですか、これは。', 'そんな話をしに来たのではない。'],
  },
  focus: {
    good: ['集中していますね。', 'いい顔をしている。'],
    neutral: ['…どうぞ。', 'はい。'],
    bad: ['…そんなに構えなくても。', '力んでいますね。'],
    worst: ['一人の世界に入らないでください。', 'こちらが見えていますか。'],
  },

  // ===== 笑い =====
  humor: {
    good: ['はは、それは笑いました。', 'うまいことを言いますね。'],
    neutral: ['…ふふ。まあ、そうですね。', '面白い人ですね。'],
    bad: ['…笑うところでしたか。', '今のは、少し軽いですね。'],
    worst: ['ふざける場面ではないでしょう。', 'その冗談は、いただけない。'],
  },

  // ===== 礼儀・守り =====
  etiquette: {
    good: ['きちんとした方ですね。', 'そういうところ、見ていますよ。'],
    neutral: ['はい、結構です。', '…ご丁寧にどうも。'],
    bad: ['形式ばりすぎでは。', 'そこまで気を張らなくても。'],
    worst: ['堅苦しいですね。息が詰まる。', '作法の話をしに来たわけじゃない。'],
  },
  safe_play: {
    good: ['堅実な選択です。', 'それが正解でしょう。'],
    neutral: ['…はい。', 'ええ、それで。'],
    bad: ['刻みますか。', '守りに入りましたね。'],
    worst: ['面白みがないですね。', 'それでは勝てませんよ。'],
  },
  avoid_risk: {
    good: ['堅実ですね。', '無理をしないのが一番だ。'],
    neutral: ['…そうしましょうか。', 'ええ、それで。'],
    bad: ['守りに入りましたね。', '攻めないんですか。'],
    worst: ['逃げてばかりですね。', 'それでは何も起きませんよ。'],
  },
  safe: {
    good: ['無理のない判断ですね。', 'そのくらいがちょうどいい。'],
    neutral: ['…まあ、そうですね。', 'はい、そうしましょうか。'],
    bad: ['当たり障りのない返事ですね。', '…それ、答えになっていますか。'],
    worst: ['何も言っていないのと同じですよ。', '今、逃げましたね。'],
  },
  neutral: {
    good: ['…間の取り方が上手いですね。', '余計なことを言わないのがいい。'],
    neutral: ['…ええ。', 'そうですか。'],
    bad: ['…何か言ったらどうです。', '興味がなさそうですね。'],
    worst: ['聞いていましたか、今の話。', 'そういう態度ですか。'],
  },
  extreme: {
    good: ['振り切っていますね。嫌いじゃない。', 'そこまでやりますか。'],
    neutral: ['…すごい人ですね。', 'はは、極端だ。'],
    bad: ['やりすぎですよ。', '少し落ち着きましょう。'],
    worst: ['ついていけません。', '正気ですか。'],
  },
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * その選択の「行為の種類」に噛み合った返事を返す。
 * 該当するタグが無ければ null（呼び出し側でキャラ専用テンプレートに戻る）。
 */
export function resolveTagSpeech(tags: Tag[], rank: ReactionRank): string | null {
  if (!tags.length) return null;
  for (const tag of TAG_SPEECH_PRIORITY) {
    if (!tags.includes(tag)) continue;
    const lines = tagSpeechLines[tag]?.[rank];
    if (lines?.length) return pick(lines);
  }
  return null;
}

/**
 * 口調が正体になっているキャラ向けの、タグ別セリフ。
 *
 * 上の共通プールは全キャラ同じ文章なので、体育会・関西弁・英語混じり等では
 * キャラが崩れる。かといって従来の汎用テンプレートに戻すと
 * 「何を選んだか」を見ない返事に逆戻りしてしまう（キャストの24%＝5人）。
 * 採用率の高い上位19タグ（全選択肢の95%を覆う）を口調ごとに書き下ろした。
 * ここに無いタグは従来どおりキャラ専用テンプレートに戻る。
 */
export const styleTagSpeechLines: Record<string, Partial<Record<Tag, RankLines>>> = {
  // 熱血体育会（鬼塚）
  S01: {
    snitch: { good: ['記録は残しとけ。'], neutral: ['…撮っとんのか。'], bad: ['それやめろや。'], worst: ['チクる気か。'] },
    extreme: { good: ['振り切っとるな、いいぞ。'], neutral: ['…すげぇやつだな。'], bad: ['やりすぎだって。'], worst: ['ついていけねぇわ。'] },
    risk: { good: ['その勝負、乗った。'], neutral: ['…思い切るな。'], bad: ['危ねぇ橋だぞ。'], worst: ['無謀すぎんだろ。'] },
    kiai: { good: ['その気合だよ！'], neutral: ['おう、気合十分だな。'], bad: ['気合だけじゃ入らねぇぞ。'], worst: ['うるせぇって。'] },
    adversity: { good: ['その根性、いいぞ。'], neutral: ['…まあ、そうだな。'], bad: ['無理してねぇか。'], worst: ['意地張る場面じゃねぇ。'] },
    excuse: { good: ['…まあ、そういう日もある。'], neutral: ['…そうかよ。'], bad: ['言い訳すんなよ。'], worst: ['みっともねぇぞ。'] },
    focus: { good: ['集中してんな。'], neutral: ['…おう。'], bad: ['力んでんぞ。'], worst: ['こっち見えてんのか。'] },
    pressure: { good: ['…言ってくれてよかった。'], neutral: ['…おう、わかった。'], bad: ['圧かけんなよ。'], worst: ['脅してんのか。'] },
    boss: { good: ['話が早ぇな。'], neutral: ['…なるほどな。'], bad: ['今その話かよ。'], worst: ['商談しに来たのか。'] },
    safe: { good: ['無理しねぇのも判断だな。'], neutral: ['ま、そんなとこか。'], bad: ['無難すぎんだろ。'], worst: ['面白くねぇな、それ。'] },
    flattery: { good: ['お、言うじゃねぇか。'], neutral: ['はは、調子いいな。'], bad: ['おだてても何も出ねぇぞ。'], worst: ['見え透いてんだよ。'] },
    humor: { good: ['はは、お前面白いな！'], neutral: ['…ふっ、まあいいか。'], bad: ['今、笑うとこか？'], worst: ['ふざけてる場合かよ。'] },
    honesty: { good: ['そうだ、それが聞きたかった。'], neutral: ['ふーん、正直だな。'], bad: ['言い方ってもんがあんだろ。'], worst: ['バカ正直も程々にしろ。'] },
    serious: { good: ['よく見てんな。'], neutral: ['まあ、そうかもな。'], bad: ['固ぇんだよ、話が。'], worst: ['説教はやめてくれ。'] },
    etiquette: { good: ['礼儀は大事だ。いいぞ。'], neutral: ['おう、悪くねぇ。'], bad: ['堅ぇよ、お前。'], worst: ['息が詰まるわ。'] },
    bold: { good: ['おっしゃ！そうこなくちゃな！'], neutral: ['お、強気だな。'], bad: ['威勢だけじゃなあ。'], worst: ['無茶苦茶だろ、それ。'] },
    over_support: { good: ['気ぃ利くじゃねぇか。'], neutral: ['おう、悪いな。'], bad: ['やりすぎだって。'], worst: ['子ども扱いすんな。'] },
    logic: { good: ['筋は通ってんな。'], neutral: ['理屈ではな。'], bad: ['理屈っぽいんだよ。'], worst: ['頭でっかちかよ。'] },
    over_praise: { good: ['はは、褒めすぎだろ！'], neutral: ['大げさなヤツだな。'], bad: ['盛りすぎだって。'], worst: ['バカにしてんのか。'] },
    hype: { good: ['その勢いだよ！'], neutral: ['元気だなお前。'], bad: ['うるせぇよ、少し。'], worst: ['一人で騒ぐな。'] },
    ethics: { good: ['筋を通すのはいい。'], neutral: ['まあ、そりゃそうだ。'], bad: ['正論振りかざすなよ。'], worst: ['聖人君子かよ。'] },
    cheat_score: { good: ['細けぇことは言いっこなしだ。'], neutral: ['…まあ、いいか。'], bad: ['そりゃマズいだろ。'], worst: ['スコアいじんじゃねぇよ。'] },
    silence: { good: ['…黙っててくれて助かる。'], neutral: ['…おう。'], bad: ['なんか言えよ。'], worst: ['無視かよ。'] },
    neutral: { good: ['余計なこと言わねぇのがいい。'], neutral: ['…ふーん。'], bad: ['なんか言ったらどうだ。'], worst: ['聞いてんのか、お前。'] },
    distance: { good: ['気ぃ遣わせたな。'], neutral: ['…まあな。'], bad: ['回りくどいんだよ。'], worst: ['他人事かよ。'] },
    cheat_physical: { good: ['…見てねぇことにしとくわ。'], neutral: ['…今、なんかやったか？'], bad: ['おい、今動かしたろ。'], worst: ['それはゴルフじゃねぇ。'] },
    alcohol: { good: ['いい飲みっぷりだ！'], neutral: ['おう、飲むか。'], bad: ['昼間っからかよ。'], worst: ['飲みに来たんじゃねぇぞ。'] },
    sportsmanship: { good: ['そうこなくちゃな。'], neutral: ['おう、対等でいこう。'], bad: ['堅ぇこと言うなよ。'], worst: ['ルールの話ばっかだな。'] },
  },
  // 外資合理英語混じり（スミス）
  S05: {
    snitch: { good: ['Records are useful.'], neutral: ['…撮っているのか。'], bad: ['Please stop that.'], worst: ['That\u2019s not appropriate.'] },
    extreme: { good: ['Extreme だが、悪くない。'], neutral: ['…Interesting だね。'], bad: ['It\u2019s too much.'], worst: ['I can\u2019t follow you.'] },
    risk: { good: ['Calculated risk か。いいね。'], neutral: ['…Risky だね。'], bad: ['Too risky だ。'], worst: ['That\u2019s not rational.'] },
    kiai: { good: ['Nice spirit.'], neutral: ['…Motivated だね。'], bad: ['気合だけでは入らない。'], worst: ['精神論は Meaningless だ。'] },
    adversity: { good: ['Tough. いいね。'], neutral: ['…Well。'], bad: ['無理をしていないか。'], worst: ['Stubborn すぎる。'] },
    excuse: { good: ['…まあ、Bad day もある。'], neutral: ['…I see.'], bad: ['It\u2019s an excuse.'], worst: ['Take responsibility, please.'] },
    focus: { good: ['Focused. Good.'], neutral: ['…Please.'], bad: ['力んでいるね。'], worst: ['こちらが見えているか。'] },
    pressure: { good: ['…言ってくれて助かる。'], neutral: ['…Understood.'], bad: ['少し Pushy だね。'], worst: ['That\u2019s a threat か。'] },
    boss: { good: ['Efficient だ。助かる。'], neutral: ['…後ほど。'], bad: ['今その話をするのか。'], worst: ['Business に来たのかな。'] },
    safe: { good: ['Safe but reasonable.'], neutral: ['Well, それでもいい。'], bad: ['Too safe じゃないか。'], worst: ['It says nothing.'] },
    flattery: { good: ['…Thank you. 悪くない。'], neutral: ['はは、お上手だね。'], bad: ['その flattery は要らない。'], worst: ['Insincere だ。'] },
    humor: { good: ['Ha, that\u2019s good.'], neutral: ['…まあ、Funny だね。'], bad: ['今のは Timing が悪い。'], worst: ['Not funny at all.'] },
    honesty: { good: ['That\u2019s honest. 助かる。'], neutral: ['なるほど、Straightforward だ。'], bad: ['少し Blunt すぎる。'], worst: ['Honesty と Rudeness は違う。'] },
    serious: { good: ['Good analysis.'], neutral: ['…I see.'], bad: ['少し Heavy だね。'], worst: ['Lecture は不要だ。'] },
    etiquette: { good: ['Well mannered. いいね。'], neutral: ['はい、Fine です。'], bad: ['Formal すぎないか。'], worst: ['Too rigid だ。'] },
    bold: { good: ['Bold move. 嫌いじゃない。'], neutral: ['…Aggressive だね。'], bad: ['Risky すぎる。'], worst: ['That\u2019s reckless.'] },
    over_support: { good: ['Thank you, 助かるよ。'], neutral: ['…No, 大丈夫だ。'], bad: ['It\u2019s too much.'], worst: ['自分でできる。Please stop.'] },
    logic: { good: ['Logical. 正しい。'], neutral: ['理屈では Correct だ。'], bad: ['Too theoretical だね。'], worst: ['Logic だけでは動かない。'] },
    over_praise: { good: ['…はは、Too much だよ。'], neutral: ['大げさだね。'], bad: ['It sounds fake.'], worst: ['Are you serious?'] },
    hype: { good: ['Nice energy.'], neutral: ['…Energetic だね。'], bad: ['少し Loud だ。'], worst: ['Calm down, please.'] },
    ethics: { good: ['That\u2019s the right call.'], neutral: ['ええ、Correct です。'], bad: ['Righteous すぎないか。'], worst: ['誰も Saint の話はしていない。'] },
    cheat_score: { good: ['…Off the record で。'], neutral: ['…まあ、Fine。'], bad: ['That\u2019s not acceptable.'], worst: ['Numbers は正確に。'] },
    silence: { good: ['…Silence も答えだ。'], neutral: ['…Yes.'], bad: ['Say something, please.'], worst: ['その Silence は失礼だ。'] },
    neutral: { good: ['余計なことを言わないのは Good だ。'], neutral: ['…I see.'], bad: ['何か言ったらどうだ。'], worst: ['Not interested ということかな。'] },
    distance: { good: ['…気を遣わせたね。'], neutral: ['…Well。'], bad: ['Indirect だね。'], worst: ['Too distant だ。'] },
    cheat_physical: { good: ['…I didn\u2019t see that.'], neutral: ['…今、何かしたか？'], bad: ['今、動かしたね。'], worst: ['That\u2019s cheating. Unacceptable.'] },
    alcohol: { good: ['Good. 付き合うよ。'], neutral: ['はい、いただこう。'], bad: ['…まだ Play 中だ。'], worst: ['Drinking に来たわけじゃない。'] },
    sportsmanship: { good: ['That\u2019s fair. いいね。'], neutral: ['ええ、Fair にいこう。'], bad: ['少し Strict だね。'], worst: ['Rules の話ばかりだ。'] },
  },
  // 昭和礼節重鎮（巌）
  S07: {
    snitch: { good: ['記録を残すのは悪くない。'], neutral: ['…撮っておるのか。'], bad: ['それはやめんか。'], worst: ['告げ口する気か。'] },
    extreme: { good: ['ふむ、振り切っておるな。'], neutral: ['…大した男よ。'], bad: ['やりすぎじゃ。'], worst: ['ついていけんわ。'] },
    risk: { good: ['その賭け、受けよう。'], neutral: ['…思い切るのう。'], bad: ['危ない橋じゃぞ。'], worst: ['無謀にも程がある。'] },
    kiai: { good: ['よい気合じゃ。'], neutral: ['うむ、気合十分じゃな。'], bad: ['気合だけでは入らんぞ。'], worst: ['やかましいわ。'] },
    adversity: { good: ['その根性、よろしい。'], neutral: ['…そうじゃな。'], bad: ['無理をしておらんか。'], worst: ['意地を張る場面ではない。'] },
    excuse: { good: ['…まあ、そういう日もある。'], neutral: ['…そうか。'], bad: ['言い訳はいかん。'], worst: ['みっともないぞ。'] },
    focus: { good: ['集中しておるな。'], neutral: ['…うむ。'], bad: ['力んでおるぞ。'], worst: ['こちらが見えておるか。'] },
    pressure: { good: ['…言うてくれてよかった。'], neutral: ['…承知した。'], bad: ['圧をかけるでない。'], worst: ['脅すつもりか。'] },
    boss: { good: ['話が早いのう。'], neutral: ['…ふむ。'], bad: ['今その話をするか。'], worst: ['商談に来たのか。'] },
    safe: { good: ['無理をせぬのも分別じゃ。'], neutral: ['まあ、そんなところか。'], bad: ['当たり障りがなさすぎるのう。'], worst: ['それでは何も言うておらん。'] },
    flattery: { good: ['…ふむ、悪い気はせんな。'], neutral: ['ほう、口が回るのう。'], bad: ['世辞はよい。'], worst: ['見え透いておるわ。'] },
    humor: { good: ['はっはっ、面白い男じゃ。'], neutral: ['…ふむ、まあよかろう。'], bad: ['今のは笑うところか。'], worst: ['ふざける場ではなかろう。'] },
    honesty: { good: ['よろしい。正直が一番じゃ。'], neutral: ['うむ、率直じゃな。'], bad: ['言葉を選ばんか。'], worst: ['正直と無礼は違うぞ。'] },
    serious: { good: ['よう見ておるな。'], neutral: ['ふむ、そうか。'], bad: ['固すぎるわい。'], worst: ['説教は要らん。'] },
    etiquette: { good: ['よろしい。礼儀を知っておる。'], neutral: ['うむ、結構。'], bad: ['堅苦しいのう。'], worst: ['形ばかりでは意味がない。'] },
    bold: { good: ['ほう、思い切りがよいな。'], neutral: ['…強気じゃな。'], bad: ['威勢ばかりよのう。'], worst: ['無鉄砲にも程がある。'] },
    over_support: { good: ['気が利くのう。'], neutral: ['…すまんな。'], bad: ['そこまでせんでよい。'], worst: ['年寄り扱いするでない。'] },
    logic: { good: ['筋は通っておる。'], neutral: ['理屈ではそうじゃな。'], bad: ['理屈が過ぎるわ。'], worst: ['理屈で人は動かんぞ。'] },
    over_praise: { good: ['…持ち上げすぎじゃ。'], neutral: ['大げさな男よのう。'], bad: ['盛りすぎじゃ。'], worst: ['わしを愚弄しておるのか。'] },
    hype: { good: ['…威勢はよいのう。'], neutral: ['元気な男じゃ。'], bad: ['少々やかましいわ。'], worst: ['一人で騒ぐでない。'] },
    ethics: { good: ['よろしい。筋が通っておる。'], neutral: ['うむ、その通りじゃ。'], bad: ['正論を振りかざすでない。'], worst: ['聖人ぶるでないわ。'] },
    cheat_score: { good: ['…細かいことは言うまい。'], neutral: ['…まあ、よかろう。'], bad: ['それはいかん。'], worst: ['数字を汚すでない。'] },
    silence: { good: ['…黙っておるのもよい。'], neutral: ['…うむ。'], bad: ['何か言うたらどうじゃ。'], worst: ['その黙りは何じゃ。'] },
    neutral: { good: ['余計を言わぬのはよい。'], neutral: ['…ふむ。'], bad: ['何か言わんか。'], worst: ['聞いておったか。'] },
    distance: { good: ['…気を遣わせたな。'], neutral: ['…まあ、そうじゃな。'], bad: ['回りくどいわ。'], worst: ['他人事のようじゃな。'] },
    cheat_physical: { good: ['…見なんだことにしよう。'], neutral: ['…今、何かしたか。'], bad: ['今、動かしたな。'], worst: ['それはゴルフではない。'] },
    alcohol: { good: ['よい飲みっぷりじゃ。'], neutral: ['うむ、いただこう。'], bad: ['昼から、か。'], worst: ['飲みに来たのではなかろう。'] },
    sportsmanship: { good: ['よろしい。対等でいこう。'], neutral: ['うむ、結構じゃ。'], bad: ['杓子定規じゃのう。'], worst: ['規則の話ばかりよのう。'] },
  },
  // 女将おもてなし（千鶴）
  S12: {
    snitch: { good: ['記録が残るのもよいですわね。'], neutral: ['…撮っていらっしゃるの。'], bad: ['おやめくださいまし。'], worst: ['言いつける気ですの。'] },
    extreme: { good: ['まあ、振り切っていらっしゃること。'], neutral: ['…すごい方ですわ。'], bad: ['やりすぎですわ。'], worst: ['ついていけませんわ。'] },
    risk: { good: ['その賭け、お受けしますわ。'], neutral: ['…思い切りますこと。'], bad: ['危ない橋ですわ。'], worst: ['無謀が過ぎますわ。'] },
    kiai: { good: ['よい気合ですこと。'], neutral: ['…気合十分ですわね。'], bad: ['気合だけでは入りませんわ。'], worst: ['少しやかましゅうございますわ。'] },
    adversity: { good: ['その強さ、よろしいですわ。'], neutral: ['…そうですわね。'], bad: ['ご無理をなさっていません？'], worst: ['意地を張る場面ではございませんわ。'] },
    excuse: { good: ['…そういう日もございますわ。'], neutral: ['…そうですか。'], bad: ['言い訳ですわね。'], worst: ['みっとものうございますわ。'] },
    focus: { good: ['集中していらっしゃいますわ。'], neutral: ['…どうぞ。'], bad: ['力んでいらっしゃいますわ。'], worst: ['こちらが見えていまして？'] },
    pressure: { good: ['…おっしゃっていただいてよかった。'], neutral: ['…承知しましたわ。'], bad: ['圧をおかけになりますのね。'], worst: ['脅していらっしゃるの。'] },
    boss: { good: ['お話が早くて助かりますわ。'], neutral: ['…のちほど伺いますわ。'], bad: ['今そのお話を。'], worst: ['商談にいらしたのかしら。'] },
    safe: { good: ['無理のないご判断ですわ。'], neutral: ['まあ、そうでございますわね。'], bad: ['当たり障りのないお返事ですこと。'], worst: ['何もおっしゃっていないのと同じですわ。'] },
    flattery: { good: ['まあ、お上手ですこと。'], neutral: ['ふふ、口がお上手ですわね。'], bad: ['…そういうのは、結構ですわ。'], worst: ['見え透いておりますわ。'] },
    humor: { good: ['まあ、おかしな方。'], neutral: ['…ふふ。'], bad: ['今のは、笑うところでしたかしら。'], worst: ['ふざける場ではございませんわ。'] },
    honesty: { good: ['正直におっしゃるのね。'], neutral: ['まあ、率直ですこと。'], bad: ['…そこまでおっしゃらなくても。'], worst: ['正直と無作法は違いますわ。'] },
    serious: { good: ['よく見ていらっしゃいますわ。'], neutral: ['…なるほど。'], bad: ['少し重うございますわね。'], worst: ['お説教はご遠慮くださいませ。'] },
    etiquette: { good: ['きちんとした方ですわね。'], neutral: ['はい、結構でございます。'], bad: ['堅苦しくございませんこと。'], worst: ['息が詰まりますわ。'] },
    bold: { good: ['まあ、思い切りがよろしいこと。'], neutral: ['…強気ですわね。'], bad: ['威勢だけでは困りますわ。'], worst: ['無茶が過ぎますわ。'] },
    over_support: { good: ['まあ、お気遣いいただいて。'], neutral: ['…恐れ入ります。'], bad: ['そこまでなさらなくても。'], worst: ['かえって気を遣いますわ。'] },
    logic: { good: ['筋が通っておりますわ。'], neutral: ['理屈ではそうですわね。'], bad: ['理屈っぽうございますわね。'], worst: ['理屈で人は動きませんわ。'] },
    over_praise: { good: ['まあ、おだてが過ぎますわ。'], neutral: ['大げさですこと。'], bad: ['…嘘くさく聞こえますわ。'], worst: ['からかっていらっしゃるの。'] },
    hype: { good: ['まあ、お元気ですこと。'], neutral: ['…賑やかですわね。'], bad: ['少しお声が大きいですわ。'], worst: ['おひとりで騒がないでくださいまし。'] },
    ethics: { good: ['筋を通されるのはよいことですわ。'], neutral: ['ええ、その通りですわ。'], bad: ['正しさを振りかざされますのね。'], worst: ['聖人のお話は結構ですわ。'] },
    cheat_score: { good: ['…細かいことは申しませんわ。'], neutral: ['…まあ、よろしいでしょう。'], bad: ['それはいけませんわ。'], worst: ['数字は正しくお願いいたします。'] },
    silence: { good: ['…お静かなのもよいものですわ。'], neutral: ['…ええ。'], bad: ['何かおっしゃってくださいまし。'], worst: ['その沈黙は、何かしら。'] },
    neutral: { good: ['余計をおっしゃらないのがよいですわ。'], neutral: ['…そうですか。'], bad: ['何かおっしゃったら。'], worst: ['聞いていらっしゃいました？'] },
    distance: { good: ['…お気遣いいただきましたわね。'], neutral: ['…そうですわね。'], bad: ['遠回しですこと。'], worst: ['他人事のようですわね。'] },
    cheat_physical: { good: ['…見なかったことにいたしますわ。'], neutral: ['…今、何か。'], bad: ['今、動かされましたわね。'], worst: ['それはもうゴルフではございませんわ。'] },
    alcohol: { good: ['よい飲みっぷりですこと。'], neutral: ['はい、いただきますわ。'], bad: ['昼から、でございますか。'], worst: ['お飲みになりに来られたのかしら。'] },
    sportsmanship: { good: ['ええ、対等に参りましょう。'], neutral: ['はい、結構でございます。'], bad: ['杓子定規ですこと。'], worst: ['規則のお話ばかりですわね。'] },
  },
  // 強気関西不動産（金城）
  S17: {
    snitch: { good: ['記録は残しとき。'], neutral: ['…撮っとんのか。'], bad: ['それやめてくれや。'], worst: ['チクる気かいな。'] },
    extreme: { good: ['振り切っとるな、ええで。'], neutral: ['…すごいやっちゃ。'], bad: ['やりすぎやって。'], worst: ['ついていかれへんわ。'] },
    risk: { good: ['その勝負、乗ったろ。'], neutral: ['…思い切るなあ。'], bad: ['危ない橋やで。'], worst: ['無謀すぎるわ。'] },
    kiai: { good: ['その気合や！'], neutral: ['おう、気合十分やな。'], bad: ['気合だけでは入らんで。'], worst: ['うるさいわ。'] },
    adversity: { good: ['その根性、ええで。'], neutral: ['…まあ、そやな。'], bad: ['無理してへんか。'], worst: ['意地張る場面ちゃうやろ。'] },
    excuse: { good: ['…まあ、そんな日もあるわ。'], neutral: ['…そうかいな。'], bad: ['言い訳すなや。'], worst: ['みっともないで。'] },
    focus: { good: ['集中しとるな。'], neutral: ['…おう。'], bad: ['力んどるで。'], worst: ['こっち見えとんのか。'] },
    pressure: { good: ['…言うてくれてよかったわ。'], neutral: ['…おう、わかった。'], bad: ['圧かけなや。'], worst: ['脅しとんのか。'] },
    boss: { good: ['話が早いな。'], neutral: ['…なるほどな。'], bad: ['今その話かいな。'], worst: ['商談しに来たんかいな。'] },
    safe: { good: ['無理せんのも判断やな。'], neutral: ['まあ、そんなとこやろ。'], bad: ['無難すぎるわ。'], worst: ['おもろないな、それ。'] },
    flattery: { good: ['お、言うやんけ。'], neutral: ['はは、口うまいなあ。'], bad: ['おだてても何も出えへんで。'], worst: ['見え透いとるわ。'] },
    humor: { good: ['はは、おもろいやっちゃな！'], neutral: ['…ふっ、まあええわ。'], bad: ['今、笑うとこかいな。'], worst: ['ふざけとる場合ちゃうやろ。'] },
    honesty: { good: ['そや、それが聞きたかったんや。'], neutral: ['ふーん、正直やな。'], bad: ['言い方っちゅうもんがあるやろ。'], worst: ['馬鹿正直もほどほどにな。'] },
    serious: { good: ['よう見とるな。'], neutral: ['まあ、そうかもな。'], bad: ['固いなあ、話が。'], worst: ['説教はやめてくれや。'] },
    etiquette: { good: ['礼儀は大事や。ええで。'], neutral: ['おう、悪ないな。'], bad: ['堅いなあ。'], worst: ['息が詰まるわ。'] },
    bold: { good: ['やるやんけ！そうこなあかん。'], neutral: ['お、強気やな。'], bad: ['威勢だけではなあ。'], worst: ['無茶苦茶やろ、それ。'] },
    over_support: { good: ['気ぃ利くやんけ。'], neutral: ['おう、すまんな。'], bad: ['やりすぎやって。'], worst: ['子ども扱いすんなや。'] },
    logic: { good: ['筋は通っとるな。'], neutral: ['理屈ではな。'], bad: ['理屈っぽいんじゃ。'], worst: ['頭でっかちやな。'] },
    over_praise: { good: ['はは、褒めすぎやろ！'], neutral: ['大げさなやっちゃ。'], bad: ['盛りすぎやって。'], worst: ['馬鹿にしとるんか。'] },
    hype: { good: ['その勢いや！'], neutral: ['元気やなあ。'], bad: ['ちょっとうるさいわ。'], worst: ['一人で騒ぐなや。'] },
    ethics: { good: ['筋通すんはええこっちゃ。'], neutral: ['まあ、そらそうや。'], bad: ['正論振りかざすなや。'], worst: ['聖人君子かいな。'] },
    cheat_score: { good: ['細かいことは言いっこなしや。'], neutral: ['…まあ、ええか。'], bad: ['そら、まずいやろ。'], worst: ['スコアいじんなや。'] },
    silence: { good: ['…黙っとってくれて助かるわ。'], neutral: ['…おう。'], bad: ['なんか言えや。'], worst: ['無視かいな。'] },
    neutral: { good: ['余計なこと言わんのがええな。'], neutral: ['…ふーん。'], bad: ['なんか言うたらどうや。'], worst: ['聞いとるんか。'] },
    distance: { good: ['気ぃ遣わせたな。'], neutral: ['…まあな。'], bad: ['回りくどいんじゃ。'], worst: ['他人事かいな。'] },
    cheat_physical: { good: ['…見てへんことにしとくわ。'], neutral: ['…今、なんかしたか。'], bad: ['今、動かしたやろ。'], worst: ['それはゴルフちゃうわ。'] },
    alcohol: { good: ['ええ飲みっぷりや！'], neutral: ['おう、飲もか。'], bad: ['昼間からかいな。'], worst: ['飲みに来たんちゃうで。'] },
    sportsmanship: { good: ['そうこなあかんな。'], neutral: ['おう、対等でいこか。'], bad: ['堅いこと言うなや。'], worst: ['規則の話ばっかやな。'] },
  },
};

/**
 * 口調が正体のキャラ向け。該当が無ければ null（キャラ専用テンプレートへ戻る）。
 */
export function resolveStyleTagSpeech(
  styleId: string,
  tags: Tag[],
  rank: ReactionRank
): string | null {
  const table = styleTagSpeechLines[styleId];
  if (!table || !tags.length) return null;
  for (const tag of TAG_SPEECH_PRIORITY) {
    if (!tags.includes(tag)) continue;
    const lines = table[tag]?.[rank];
    if (lines?.length) return pick(lines);
  }
  return null;
}
