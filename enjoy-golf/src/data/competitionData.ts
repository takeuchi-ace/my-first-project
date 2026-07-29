/**
 * コンペイベント定義
 *
 * 3つのコンペ、各コンペに:
 * - 基本情報（名前、紹介元、対象キャラ、難易度）
 * - 受付・組合せ・挨拶テキスト
 * - 前半イベント×2 + 後半イベント×2
 * - 表彰式テキスト
 */

import { CompetitionId, CharacterSpecificEvent } from '../types';

export interface CompetitionDef {
  id: CompetitionId;
  name: string;
  referrerId: number;         // 紹介元キャラID
  targetCharacterId: number;  // 解放対象キャラID
  difficulty: 'easy' | 'medium' | 'hard';
  receptionText: string;
  pairingText: string;
  greetingText: string;
  referrerComment: string;    // 紹介元の一言（バナー用）
  awardSuccessText: string;
  awardFailText: string;
  unlockText: string;         // 「今度ゆっくり行きましょう」的な
  trustThreshold: number;     // 契約成功に必要なtrust
  reputationThreshold: number; // 契約成功に必要なreputation(fun)
}

export const competitions: CompetitionDef[] = [
  {
    id: 'springOpen',
    name: '春の名門オープン',
    referrerId: 1,
    targetCharacterId: 17,
    difficulty: 'easy',
    receptionText: '春の名門コースで開催されるオープンコンペ。\n田中さんの紹介で参加することになった。',
    pairingText: '組合せが発表された。\n同組は…IT起業家の篠原さん。',
    greetingText: '「はじめまして。篠原です。\n今日は楽しみましょう！」',
    referrerComment: '篠原は面白い男ですよ。気軽にやってください。',
    awardSuccessText: '表彰式が終わり、篠原さんが近づいてきた。\n「今度ゆっくり行きましょう。いいコースを知ってます」',
    awardFailText: '表彰式が終わった。篠原さんとは軽く挨拶を交わしたが、\nそれ以上の進展はなかった。',
    unlockText: '篠原さんとの通常ラウンドが解放されました！',
    trustThreshold: 60,
    reputationThreshold: 45,
  },
  {
    id: 'seasideCharity',
    name: 'シーサイドチャリティカップ',
    referrerId: 17,
    targetCharacterId: 18,
    difficulty: 'medium',
    receptionText: '海沿いの美しいコースで開催されるチャリティコンペ。\n篠原さんの紹介で参加することになった。',
    pairingText: '組合せが発表された。\n同組は…マーケターの桐生さん。',
    greetingText: '「桐生です。よろしくお願いします。\n…嘘はつかないでくださいね」',
    referrerComment: '桐生さんは鋭い人です。誠実に行きましょう。',
    awardSuccessText: '表彰式後、桐生さんが声をかけてきた。\n「今度ゆっくりラウンドしましょう。楽しみにしてます」',
    awardFailText: '表彰式が終わった。桐生さんは軽く会釈して去っていった。\n印象は悪くないが、もう少し何かが必要だったようだ。',
    unlockText: '桐生さんとの通常ラウンドが解放されました！',
    trustThreshold: 65,
    reputationThreshold: 50,
  },
  {
    id: 'executivesCup',
    name: '経営者杯',
    referrerId: 2,
    targetCharacterId: 19,
    difficulty: 'hard',
    receptionText: '格式高い名門コースで開催される経営者限定コンペ。\n鬼塚さんの紹介で参加することになった。',
    pairingText: '組合せが発表された。\n同組は…重工会長の鷹宮さん。',
    greetingText: '「鷹宮だ。…しっかりやれ」',
    referrerComment: '鷹宮さんは手強いぞ。気合入れていけ！',
    awardSuccessText: '表彰式後、鷹宮さんが歩み寄ってきた。\n「なかなか見所のある男だ。今度ゆっくりやりましょう」',
    awardFailText: '表彰式が終わった。鷹宮さんは無言で去っていった。\n実力も誠意も、まだ足りなかったようだ。',
    unlockText: '鷹宮さんとの通常ラウンドが解放されました！',
    trustThreshold: 70,
    reputationThreshold: 50,
  },
];

export const competitionMap = new Map(competitions.map((c) => [c.id, c]));

/** 紹介ツリー順序（この順番でアンロックチェーン） */
export const competitionOrder: CompetitionId[] = [
  'springOpen',
  'seasideCharity',
  'executivesCup',
];

// ===== コンペ専用イベント =====
// 各コンペに前半2 + 後半2 = 4イベント

export const competitionEvents: Record<CompetitionId, CharacterSpecificEvent[]> = {
  // =====================================================================
  // 春の名門オープン（篠原 — IT起業家、軽快）
  // =====================================================================
  springOpen: [
    // 前半1
    {
      id: 'comp_spring_f1',
      title: 'ティーショットの賭け',
      situation: '篠原が軽い口調で言った。「ドラコン勝負しません？」',
      choices: [
        { id: 'A', text: '「面白い！やりましょう」', delta: { fun: 8, trust: 5, focus: -2, creep: 0 }, tags: ['bold', 'humor'] },
        { id: 'B', text: '「ほどほどにしましょう」', delta: { fun: 2, trust: 3, focus: 2, creep: 0 }, tags: ['safe'] },
        { id: 'C', text: '「コンペですからね…」', delta: { fun: -2, trust: -3, focus: 4, creep: 4 }, tags: ['serious'] },
      ],
    },
    // 前半2
    {
      id: 'comp_spring_f2',
      title: 'スタートアップの話',
      situation: '篠原がスタートアップ時代の苦労話を始めた。',
      choices: [
        { id: 'A', text: '自分の経験も正直に語る', delta: { fun: 2, trust: 8, focus: 4, creep: 0 }, tags: ['honesty', 'logic'] },
        { id: 'B', text: '「すごいですね！」と褒める', delta: { fun: 4, trust: 0, focus: 0, creep: 5 }, tags: ['flattery'] },
        { id: 'C', text: 'アドバイスする', delta: { fun: 0, trust: -2, focus: 2, creep: 6 }, tags: ['boss'] },
      ],
    },
    // 後半1
    {
      id: 'comp_spring_b1',
      title: 'バンカー脱出',
      situation: '篠原がバンカーに入れてしまった。悔しそうだ。',
      choices: [
        { id: 'A', text: '「バンカーの打ち方、こうすると出やすいですよ」', delta: { fun: 4, trust: 6, focus: 4, creep: 0 }, tags: ['logic', 'sportsmanship'] },
        { id: 'B', text: '「ドンマイ！次行きましょう」', delta: { fun: 4, trust: 4, focus: 0, creep: 0 }, tags: ['hype'] },
        { id: 'C', text: '「プロに教わった方がいいですよ」', delta: { fun: -2, trust: -4, focus: 2, creep: 6 }, tags: ['distance'] },
      ],
    },
    // 後半2
    {
      id: 'comp_spring_b2',
      title: 'ビジネスの本音',
      situation: '篠原が真剣な顔で聞いてきた。「ビジネスで一番大事なことって何ですか？」',
      choices: [
        { id: 'A', text: '「信頼関係です」と答える', delta: { fun: 2, trust: 8, focus: 4, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '「スピードですね」とテンポよく', delta: { fun: 6, trust: 4, focus: 0, creep: 0 }, tags: ['humor', 'logic'] },
        { id: 'C', text: '「まぁ色々ありますよね」と曖昧に', delta: { fun: 0, trust: -2, focus: 0, creep: 4 }, tags: ['safe', 'distance'] },
      ],
    },
  ],

  // =====================================================================
  // シーサイドチャリティカップ（桐生 — 女性マーケター、鋭い）
  // =====================================================================
  seasideCharity: [
    // 前半1
    {
      id: 'comp_seaside_f1',
      title: '自己紹介',
      situation: '桐生が丁寧に自己紹介した後、こちらを見ている。',
      choices: [
        { id: 'A', text: '飾らず正直に自己紹介する', delta: { fun: 2, trust: 8, focus: 4, creep: 0 }, tags: ['honesty'] },
        { id: 'B', text: '実績を盛って話す', delta: { fun: 2, trust: -4, focus: 0, creep: 8 }, tags: ['hype', 'risk'] },
        { id: 'C', text: '「桐生さんの噂は聞いてます」', delta: { fun: 0, trust: -2, focus: 0, creep: 6 }, tags: ['flattery'] },
      ],
    },
    // 前半2
    {
      id: 'comp_seaside_f2',
      title: 'チャリティの意義',
      situation: '桐生が聞いてきた。「チャリティゴルフって、どう思いますか？」',
      choices: [
        { id: 'A', text: '「社会貢献の良い機会だと思います」', delta: { fun: 2, trust: 6, focus: 4, creep: 0 }, tags: ['ethics', 'honesty'] },
        { id: 'B', text: '「人脈作りにもなりますし」', delta: { fun: 4, trust: 2, focus: 0, creep: 2 }, tags: ['logic'] },
        { id: 'C', text: '「桐生さんが参加してるなら最高ですよ」', delta: { fun: 0, trust: -6, focus: -2, creep: 10 }, tags: ['flattery', 'over_praise'] },
      ],
    },
    // 後半1
    {
      id: 'comp_seaside_b1',
      title: '風が強い',
      situation: '海風が強くなってきた。桐生は冷静にコース攻略を考えている。',
      choices: [
        { id: 'A', text: '一緒に風を読んで攻略を相談する', delta: { fun: 4, trust: 6, focus: 6, creep: 0 }, tags: ['logic', 'sportsmanship'] },
        { id: 'B', text: '「風なんか気にせず打ちましょう！」', delta: { fun: 4, trust: -2, focus: -2, creep: 4 }, tags: ['bold'] },
        { id: 'C', text: '「桐生さんなら大丈夫ですよ」', delta: { fun: 0, trust: -4, focus: 0, creep: 8 }, tags: ['flattery'] },
      ],
    },
    // 後半2
    {
      id: 'comp_seaside_b2',
      title: '仕事の失敗談',
      situation: '桐生が突然聞いてきた。「一番の失敗を教えてください」',
      choices: [
        { id: 'A', text: '正直に失敗談を語る', delta: { fun: 2, trust: 10, focus: 4, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '失敗を成功談に変えて語る', delta: { fun: 4, trust: -4, focus: 0, creep: 6 }, tags: ['hype', 'risk'] },
        { id: 'C', text: '「失敗なんてないですよ」', delta: { fun: -2, trust: -8, focus: -2, creep: 10 }, tags: ['flattery', 'risk'] },
      ],
    },
  ],

  // =====================================================================
  // 経営者杯（鷹宮 — 重工会長、重厚）
  // =====================================================================
  executivesCup: [
    // 前半1
    {
      id: 'comp_exec_f1',
      title: '第一印象',
      situation: '鷹宮が無言でこちらを見ている。品定めされているようだ。',
      choices: [
        { id: 'A', text: '「本日はよろしくお願いします」と丁寧に', delta: { fun: 0, trust: 6, focus: 4, creep: 0 }, tags: ['etiquette', 'honesty'] },
        { id: 'B', text: '「鬼塚さんから話は聞いてます」', delta: { fun: 2, trust: 2, focus: 0, creep: 2 }, tags: ['safe'] },
        { id: 'C', text: '「お手柔らかに！」と軽く', delta: { fun: 4, trust: -4, focus: -2, creep: 6 }, tags: ['hype'] },
      ],
    },
    // 前半2
    {
      id: 'comp_exec_f2',
      title: 'OB処理',
      situation: 'あなたのボールがOBゾーンへ。鷹宮がじっと見ている。',
      choices: [
        { id: 'A', text: '即座に自己申告する', delta: { fun: 0, trust: 10, focus: 6, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
        { id: 'B', text: '「セーフですかね…」と周りに確認', delta: { fun: 0, trust: -2, focus: 0, creep: 4 }, tags: ['safe'] },
        { id: 'C', text: 'さりげなくボールを戻す', delta: { fun: 0, trust: -12, focus: -4, creep: 14 }, tags: ['cheat_physical'] },
      ],
    },
    // 後半1
    {
      id: 'comp_exec_b1',
      title: '経営哲学',
      situation: '鷹宮が口を開いた。「君の経営哲学は何だ」',
      choices: [
        { id: 'A', text: '「信用第一です」と真っ直ぐに', delta: { fun: 0, trust: 8, focus: 6, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '「利益の最大化です」と合理的に', delta: { fun: 2, trust: 2, focus: 2, creep: 2 }, tags: ['logic'] },
        { id: 'C', text: '「鷹宮さんと同じです」と合わせる', delta: { fun: 0, trust: -6, focus: -2, creep: 8 }, tags: ['flattery'] },
      ],
    },
    // 後半2
    {
      id: 'comp_exec_b2',
      title: '最終ホールの勝負',
      situation: '最終ホール。鷹宮が初めて笑みを見せた。「最後は全力で行こう」',
      choices: [
        { id: 'A', text: '全力で真剣勝負する', delta: { fun: 4, trust: 8, focus: 6, creep: 0 }, tags: ['bold', 'sportsmanship'] },
        { id: 'B', text: '「お手柔らかに」と謙虚に', delta: { fun: 2, trust: 2, focus: 2, creep: 0 }, tags: ['etiquette'] },
        { id: 'C', text: 'わざと負ける', delta: { fun: 0, trust: -8, focus: -4, creep: 10 }, tags: ['flattery'] },
      ],
    },
  ],
};
