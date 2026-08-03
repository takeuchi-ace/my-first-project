export type SpeechStyle = {
  id: string;
  name: string;
  firstPerson: string;
  tone: string[];
  catchPhrases: string[];
  sampleLines: string[];
  /**
   * 口調そのものがキャラの正体になっているスタイル（体育会・方言・英語混じり等）。
   * true のキャラには curatedEvents の共通セリフ（choice.speech）を使わず、
   * このスタイル専用の speechLineTemplates を使う。
   * 共通セリフは丁寧語ベースで書かれており、これらの口調では成立しないため。
   */
  distinctVoice?: boolean;
  /**
   * curatedEvents の共通セリフ（choice.speech）をそのまま喋らせてよいスタイル。
   *
   * 共通セリフは「丁寧な挨拶ですね。こちらこそよろしくお願いします。」のような
   * 丁寧語・一人称「私」で書かれている。この register が合うスタイルにだけ渡す。
   *
   * distinctVoice とは別の軸で持つ。distinctVoice は
   * 「共通タグセリフにも落とさず自前のテンプレートに任せる」という意味なので、
   * 兼用すると『丁寧語は合わないが共通タグセリフは使いたい』スタイルを表せない。
   */
  sharedLinesOk?: boolean;
};

export const speechStyles: SpeechStyle[] = [
  {
    id: 'S01',
    distinctVoice: true,
    name: '熱血体育会',
    firstPerson: '俺',
    tone: ['勢い', '短文', '命令形混じり'],
    catchPhrases: ['気合', '根性', 'ナイス'],
    sampleLines: ['いいね！そのノリだ！', '行こうぜ、勝ちにいくぞ！'],
  },
  {
    id: 'S02',
    sharedLinesOk: true,
    name: '堅実ビジネス',
    firstPerson: '私',
    tone: ['丁寧', '慎重', '常識人'],
    catchPhrases: ['堅実に', '無理せず', 'まずは'],
    sampleLines: ['無理は禁物ですね。', '着実にいきましょう。'],
  },
  {
    id: 'S03',
    name: '楽天お坊ちゃん',
    firstPerson: '僕',
    tone: ['ふわっと', '楽観的', '楽しさ優先'],
    catchPhrases: ['まあまあ', '楽しいね', 'いいじゃない'],
    sampleLines: ['まあいいじゃない。', '楽しいのが一番だよ。'],
  },
  {
    id: 'S04',
    name: '寡黙プロ',
    firstPerson: '俺',
    tone: ['短文', '無駄なし', '静か'],
    catchPhrases: ['…', '悪くない'],
    sampleLines: ['ラインは読めてる。', '次、同じ球で。'],
  },
  {
    id: 'S05',
    distinctVoice: true,
    name: '外資合理英語混じり',
    firstPerson: 'I',
    tone: ['合理的', '冷静', '英語混じり'],
    catchPhrases: ['Fair', 'Make sense', 'Good'],
    sampleLines: ['That makes sense.', 'Fair playでいこう。'],
  },
  {
    id: 'S06',
    sharedLinesOk: true,
    name: '自己啓発ポジティブ',
    firstPerson: '私',
    tone: ['明るい', '前向き', '感謝'],
    catchPhrases: ['感謝', '学び', 'ご縁'],
    sampleLines: ['全部、学びですね！', 'この一打にも感謝です！'],
  },
  {
    id: 'S07',
    distinctVoice: true,
    name: '昭和礼節重鎮',
    firstPerson: 'わし',
    tone: ['説教気味', '重厚', '礼儀重視'],
    catchPhrases: ['礼儀', '筋', '若いの'],
    sampleLines: ['礼に始まり礼に終わる。', '腹から声を出さんか。'],
  },
  {
    id: 'S08',
    name: 'テック合理分析',
    firstPerson: '僕',
    tone: ['分析型', '淡々', '最適化志向'],
    catchPhrases: ['データ的に', '最適', '再現性'],
    sampleLines: ['確率的には刻みが最適。', '再現性ある選択にしよう。'],
  },
  {
    id: 'S09',
    name: '試し屋挑発型',
    firstPerson: '俺',
    tone: ['探り', '軽挑発', '本音重視'],
    catchPhrases: ['で？', 'ほんと？'],
    sampleLines: ['今の、本音？', '試してみる？'],
  },
  {
    id: 'S10',
    name: '褒め殺しハイテンション',
    firstPerson: '僕',
    tone: ['大げさ', '実況風', '過剰称賛'],
    catchPhrases: ['ナイス', 'さすが', '天才'],
    sampleLines: ['ナァァイス！！', 'あなた天才ですか！？'],
  },
  {
    id: 'S11',
    name: '政界含み型',
    firstPerson: '私',
    tone: ['低め', '含み', '圧がある'],
    catchPhrases: ['まあ…', '話は早い'],
    sampleLines: ['君は分かる側だな。', 'その話、場所を変えようか。'],
  },
  {
    id: 'S12',
    distinctVoice: true,
    name: '女将おもてなし',
    firstPerson: '私',
    tone: ['柔らかい', '品がある', '間合い重視'],
    catchPhrases: ['よろしければ', '無理なさらず'],
    sampleLines: ['よろしければ、少し召し上がります？', '急がずゆっくりで。'],
  },
  {
    id: 'S13',
    sharedLinesOk: true,
    name: '女性マーケ直球',
    firstPerson: '私',
    tone: ['端的', '本音', '分析型'],
    catchPhrases: ['正直', '数字は出ますよ'],
    sampleLines: ['正直、見抜けます。', '嘘は数字に出ますよ。'],
  },
  {
    id: 'S14',
    sharedLinesOk: true,
    name: '女性ロジック冷静',
    firstPerson: '私',
    tone: ['結論重視', '論点整理', '曖昧拒否'],
    catchPhrases: ['結論から', '前提は'],
    sampleLines: ['結論から言うと違います。', '前提を合わせましょう。'],
  },
  {
    id: 'S15',
    name: '女性社交共感',
    firstPerson: '私',
    tone: ['明るい', '共感型', '場を回す'],
    catchPhrases: ['わかる〜', 'それいい'],
    sampleLines: ['わかる〜！それ大事！', '楽しくいこ！'],
  },
  {
    id: 'S16',
    name: '芸能エンタメ',
    firstPerson: '僕',
    tone: ['盛り上げ', 'ショーマン', '大げさ'],
    catchPhrases: ['最高！', '映える！'],
    sampleLines: ['それ映えるよ！', '今日はショータイムだ！'],
  },
  {
    id: 'S17',
    distinctVoice: true,
    name: '強気関西不動産',
    firstPerson: 'ワシ',
    tone: ['豪快', '関西弁軽め', '攻め'],
    catchPhrases: ['攻めや', 'いったれ'],
    sampleLines: ['攻めなあかんやろ。', 'いったれいったれ。'],
  },
  {
    id: 'S18',
    sharedLinesOk: true,
    name: '医療丁寧慎重',
    firstPerson: '私',
    tone: ['冷静', '丁寧', 'リスク管理'],
    catchPhrases: ['慎重に', '安全第一'],
    sampleLines: ['安全第一でいきましょう。', 'リスクは最小限に。'],
  },
];
