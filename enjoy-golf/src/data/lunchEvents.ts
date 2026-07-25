import { CharacterSpecificEvent } from '../types';

/**
 * 昼休憩イベント（各キャラ1本 × 16 = 16本）
 *
 * - characterLunchEvents[characterId] で1本のイベントを取得
 * - hole 5 で固定挿入
 * - 通常イベントより影響係数1.5倍（engine側で処理）
 * - 選択肢は3択以上
 */
export const characterLunchEvents: Record<number, CharacterSpecificEvent> = {
  // =====================================================================
  // キャラ1: 銀行マン・田中
  // =====================================================================
  1: {
    id: 'lunch_1',
    title: '融資計画の本音',
    situation: '「ところで、御社の経営状況を正直に教えてもらえますか？」と真剣な目で聞かれる。',
    choices: [
      { id: 'A', text: '誠実に現状を話す', delta: { fun: 1, trust: 10, focus: 6, creep: 0 }, tags: ['honesty', 'logic'] },
      { id: 'B', text: '調子よく盛る', delta: { fun: 4, trust: 2, focus: -2, creep: 10 }, tags: ['hype', 'risk'] },
      { id: 'C', text: '話題をそらす', delta: { fun: 0, trust: -6, focus: -2, creep: 8 }, tags: ['distance'] },
    ],
  },

  // =====================================================================
  // キャラ2: 体育会系社長・鬼塚
  // =====================================================================
  2: {
    id: 'lunch_2',
    title: '昼のビール勝負',
    situation: '「昼から行くぞ！男は黙ってビール！」とジョッキを掲げる。',
    choices: [
      { id: 'A', text: '一緒に豪快に乾杯する', delta: { fun: 10, trust: 6, focus: -4, creep: 0 }, tags: ['bold', 'alcohol'] },
      { id: 'B', text: '乾杯だけ付き合う', delta: { fun: 4, trust: 4, focus: 2, creep: 2 }, tags: ['humor'] },
      { id: 'C', text: '「午後もあるので…」と遠慮する', delta: { fun: -4, trust: -4, focus: 4, creep: 8 }, tags: ['safe', 'distance'] },
    ],
  },

  // =====================================================================
  // キャラ3: 二代目オーナー・坊っちゃん
  // =====================================================================
  3: {
    id: 'lunch_3',
    title: '趣味の車自慢',
    situation: 'スマホで愛車コレクションの写真を見せてくる。「見て見て、これ最近買ったんだ！」',
    choices: [
      { id: 'A', text: '「最高ですね！もっと見せてください！」', delta: { fun: 10, trust: 4, focus: -2, creep: 2 }, tags: ['hype', 'humor'] },
      { id: 'B', text: '「いいですね」と程よく返す', delta: { fun: 4, trust: 6, focus: 2, creep: 0 }, tags: ['flattery'] },
      { id: 'C', text: '「維持費大変じゃないですか？」', delta: { fun: -4, trust: -4, focus: 4, creep: 8 }, tags: ['logic'] },
    ],
  },

  // =====================================================================
  // キャラ4: 寡黙なプロ・黒田
  // =====================================================================
  4: {
    id: 'lunch_4',
    title: '無言の昼食',
    situation: '黒田は黙々と食事をしている。一切の雑談をしない。',
    choices: [
      { id: 'A', text: '同じく黙って食べる', delta: { fun: 0, trust: 10, focus: 8, creep: 0 }, tags: ['silence', 'serious'] },
      { id: 'B', text: '「午後のコース戦略、教えてください」', delta: { fun: 2, trust: 6, focus: 4, creep: 2 }, tags: ['logic'] },
      { id: 'C', text: '気まずさに耐えかね話し続ける', delta: { fun: 2, trust: -6, focus: -4, creep: 10 }, tags: ['hype', 'over_praise'] },
    ],
  },

  // =====================================================================
  // キャラ5: 外資エリート・スミス
  // =====================================================================
  5: {
    id: 'lunch_5',
    title: 'フェアプレーの議論',
    situation: '「Do you think fairness truly exists in business?」と真剣に聞かれる。',
    choices: [
      { id: 'A', text: '信念を持ってフェアにやるべきだと語る', delta: { fun: 2, trust: 10, focus: 6, creep: 0 }, tags: ['honesty', 'ethics'] },
      { id: 'B', text: '「ケースバイケースですね」と曖昧に', delta: { fun: 2, trust: 2, focus: 2, creep: 4 }, tags: ['safe'] },
      { id: 'C', text: '「綺麗事では勝てませんよ」', delta: { fun: 4, trust: -4, focus: -2, creep: 8 }, tags: ['bold', 'risk'] },
    ],
  },

  // =====================================================================
  // キャラ6: 自己啓発社長・光山
  // =====================================================================
  6: {
    id: 'lunch_6',
    title: '感謝ワークの提案',
    situation: '「ここで感謝ワークやりません？人生変わりますよ！」と目を輝かせる。',
    choices: [
      { id: 'A', text: 'ノリノリで参加する', delta: { fun: 10, trust: 4, focus: -2, creep: 2 }, tags: ['hype', 'humor'] },
      { id: 'B', text: '適度に付き合う', delta: { fun: 4, trust: 2, focus: 2, creep: 2 }, tags: ['safe'] },
      { id: 'C', text: '「結構です」と断る', delta: { fun: -6, trust: -6, focus: 4, creep: 8 }, tags: ['serious', 'distance'] },
    ],
  },

  // =====================================================================
  // キャラ7: 昭和の重鎮・巌
  // =====================================================================
  7: {
    id: 'lunch_7',
    title: '日本酒の作法',
    situation: '「この日本酒の注ぎ方、知っとるか？」と杯を掲げる。',
    choices: [
      { id: 'A', text: '「ご教示ください」と頭を下げる', delta: { fun: 2, trust: 10, focus: 4, creep: 0 }, tags: ['etiquette', 'honesty'] },
      { id: 'B', text: '「知ってます！」と自信を見せる', delta: { fun: 2, trust: -4, focus: 0, creep: 8 }, tags: ['bold'] },
      { id: 'C', text: '「まぁまぁ、乾杯しましょう！」', delta: { fun: 4, trust: -6, focus: -2, creep: 10 }, tags: ['hype'] },
    ],
  },

  // =====================================================================
  // キャラ8: テック社長・中村
  // =====================================================================
  8: {
    id: 'lunch_8',
    title: 'SNSの話題',
    situation: '「そういえば、あなたのSNS見ましたよ。データ面白いですね」',
    choices: [
      { id: 'A', text: '「データ分析が趣味でして」と補足する', delta: { fun: 4, trust: 8, focus: 4, creep: 0 }, tags: ['logic'] },
      { id: 'B', text: '「フォローありがとうございます！」', delta: { fun: 4, trust: 0, focus: 0, creep: 8 }, tags: ['flattery'] },
      { id: 'C', text: '「SNSはあまり力入れてなくて…」', delta: { fun: -2, trust: -2, focus: 2, creep: 4 }, tags: ['distance'] },
    ],
  },

  // =====================================================================
  // キャラ9: 試し屋・佐藤
  // =====================================================================
  9: {
    id: 'lunch_9',
    title: '過去の失敗を問う',
    situation: '「あなたの一番の失敗、正直に教えてもらえますか？」と真剣に聞く。',
    choices: [
      { id: 'A', text: '正直に語る', delta: { fun: 0, trust: 12, focus: 6, creep: 0 }, tags: ['honesty', 'ethics'] },
      { id: 'B', text: '少し盛って語る', delta: { fun: 4, trust: -4, focus: -2, creep: 10 }, tags: ['hype', 'risk'] },
      { id: 'C', text: '「失敗はないです」と強がる', delta: { fun: 0, trust: -8, focus: -4, creep: 12 }, tags: ['bold', 'flattery'] },
    ],
  },

  // =====================================================================
  // キャラ10: 褒め殺し王・松本
  // =====================================================================
  10: {
    id: 'lunch_10',
    title: '褒め合い合戦',
    situation: '「いやぁ、あなた最高！今日一番のパートナーだよ！」と突然褒めちぎってくる。',
    choices: [
      { id: 'A', text: '同じテンションで褒め返す', delta: { fun: 8, trust: 6, focus: 0, creep: 0 }, tags: ['humor', 'hype'] },
      { id: 'B', text: '更に上回る褒め殺しで応戦', delta: { fun: 10, trust: 4, focus: -2, creep: 2 }, tags: ['over_praise', 'humor'] },
      { id: 'C', text: '「ありがとうございます」とだけ', delta: { fun: -4, trust: -4, focus: 4, creep: 8 }, tags: ['silence'] },
    ],
  },

  // =====================================================================
  // キャラ11: 政界フィクサー・大門
  // =====================================================================
  11: {
    id: 'lunch_11',
    title: '人脈の値踏み',
    situation: '「あなたの人脈、率直に聞かせてもらえますか？」と笑顔で切り出す。',
    choices: [
      { id: 'A', text: '率直に語る', delta: { fun: 2, trust: 8, focus: 6, creep: 0 }, tags: ['honesty', 'logic'] },
      { id: 'B', text: '盛って語る', delta: { fun: 4, trust: -2, focus: -2, creep: 10 }, tags: ['hype', 'risk'] },
      { id: 'C', text: '「それは…」と口ごもる', delta: { fun: -2, trust: -6, focus: -2, creep: 8 }, tags: ['distance', 'silence'] },
    ],
  },

  // =====================================================================
  // キャラ12: 芸能プロデューサー・星野
  // =====================================================================
  12: {
    id: 'lunch_12',
    title: '即興企画ピッチ',
    situation: '「面白い企画、何かない？今すぐ聞かせて！」とテーブルを叩く。',
    choices: [
      { id: 'A', text: 'ノリで即興アイデアを出す', delta: { fun: 10, trust: 4, focus: -2, creep: 2 }, tags: ['hype', 'humor'] },
      { id: 'B', text: '相手の企画を褒めまくる', delta: { fun: 6, trust: 2, focus: 0, creep: 4 }, tags: ['flattery', 'over_praise'] },
      { id: 'C', text: '「準備してからお話しします」', delta: { fun: -6, trust: -4, focus: 4, creep: 8 }, tags: ['serious', 'logic'] },
    ],
  },

  // =====================================================================
  // キャラ13: 不動産王・金城
  // =====================================================================
  13: {
    id: 'lunch_13',
    title: '投資話',
    situation: '「ええ物件あるんやけど、一口乗らへん？」と身を乗り出す。',
    choices: [
      { id: 'A', text: '「面白そうですね！」と乗る', delta: { fun: 8, trust: 6, focus: -2, creep: 2 }, tags: ['bold', 'risk'] },
      { id: 'B', text: '「金城さんの目利きなら間違いない」', delta: { fun: 4, trust: 4, focus: 2, creep: 2 }, tags: ['flattery'] },
      { id: 'C', text: '「リスクも考えないと」と冷静に返す', delta: { fun: -4, trust: -2, focus: 6, creep: 6 }, tags: ['logic', 'safe'] },
    ],
  },

  // =====================================================================
  // キャラ14: 医療法人理事長・白石
  // =====================================================================
  14: {
    id: 'lunch_14',
    title: '医療制度の議論',
    situation: '「日本の医療制度について、どうお考えですか？」と静かに聞く。',
    choices: [
      { id: 'A', text: 'データを交えて自分の見解を述べる', delta: { fun: 2, trust: 10, focus: 6, creep: 0 }, tags: ['logic', 'ethics'] },
      { id: 'B', text: '「理事長のお考えを聞かせてください」', delta: { fun: 2, trust: 0, focus: 0, creep: 6 }, tags: ['flattery'] },
      { id: 'C', text: '「あまり詳しくなくて…」', delta: { fun: -2, trust: -4, focus: -2, creep: 4 }, tags: ['distance', 'silence'] },
    ],
  },

  // =====================================================================
  // キャラ15: 老舗料亭女将・千鶴（藤原 千鶴）
  // =====================================================================
  15: {
    id: 'lunch_15',
    title: '料理へのこだわり',
    situation: '「このお料理、どう思われます？」と微笑みながら聞く。',
    choices: [
      { id: 'A', text: '丁寧に味の感想を述べる', delta: { fun: 4, trust: 10, focus: 4, creep: 0 }, tags: ['etiquette', 'honesty'] },
      { id: 'B', text: '「最高です！」と大げさに褒める', delta: { fun: 4, trust: -4, focus: -2, creep: 10 }, tags: ['over_praise', 'hype'] },
      { id: 'C', text: '「美味しいです」とだけ', delta: { fun: 0, trust: 2, focus: 2, creep: 2 }, tags: ['safe'] },
    ],
  },

  // =====================================================================
  // キャラ17: IT起業家・篠原
  // =====================================================================
  17: {
    id: 'lunch_17',
    title: 'ピッチの練習',
    situation: '「昼休みにちょっとピッチの練習していいですか？」とスマホでメモを取り始めた。',
    choices: [
      { id: 'A', text: '「面白そう、聞かせてください」', delta: { fun: 6, trust: 6, focus: 2, creep: 0 }, tags: ['humor', 'logic'] },
      { id: 'B', text: '「食事に集中しましょう」', delta: { fun: -2, trust: 2, focus: 4, creep: 4 }, tags: ['serious'] },
      { id: 'C', text: '「最高のピッチですね！」', delta: { fun: 2, trust: -2, focus: 0, creep: 6 }, tags: ['over_praise'] },
    ],
  },

  // =====================================================================
  // キャラ18: マーケター・桐生
  // =====================================================================
  18: {
    id: 'lunch_18',
    title: '食事の好み',
    situation: '桐生がメニューをじっと見ている。「何にしますか？」',
    choices: [
      { id: 'A', text: '「軽めのものにします」と自然に', delta: { fun: 2, trust: 8, focus: 4, creep: 0 }, tags: ['honesty'] },
      { id: 'B', text: '「桐生さんと同じもので」', delta: { fun: 0, trust: -4, focus: 0, creep: 8 }, tags: ['flattery'] },
      { id: 'C', text: '「一番高いものを」と見栄を張る', delta: { fun: 2, trust: -6, focus: -2, creep: 8 }, tags: ['hype'] },
    ],
  },

  // =====================================================================
  // キャラ19: 重工会長・鷹宮
  // =====================================================================
  19: {
    id: 'lunch_19',
    title: '無言の昼食',
    situation: '鷹宮は黙々と食事をしている。質実剛健そのものだ。',
    choices: [
      { id: 'A', text: '同じく静かに食べる', delta: { fun: 0, trust: 10, focus: 8, creep: 0 }, tags: ['silence', 'serious'] },
      { id: 'B', text: '「午後の戦略を相談させてください」', delta: { fun: 2, trust: 4, focus: 4, creep: 2 }, tags: ['logic'] },
      { id: 'C', text: '話題を振って盛り上げようとする', delta: { fun: 2, trust: -6, focus: -4, creep: 8 }, tags: ['hype'] },
    ],
  },

  // =====================================================================
  // キャラ20: 税理士法人代表・早瀬 玲奈
  // =====================================================================
  20: {
    id: 'lunch_20',
    title: '仕事の流儀',
    situation: '「正確さと誠実さ、どちらが大事だと思いますか？」と真剣な目で聞く。',
    choices: [
      { id: 'A', text: '「両方必要ですが、誠実さが土台です」', delta: { fun: 2, trust: 10, focus: 6, creep: 0 }, tags: ['honesty', 'ethics'] },
      { id: 'B', text: '「正確さですよ、数字は嘘をつかない」', delta: { fun: 2, trust: 6, focus: 4, creep: 2 }, tags: ['logic'] },
      { id: 'C', text: '「早瀬さんのお考えは？」と返す', delta: { fun: 0, trust: -4, focus: -2, creep: 6 }, tags: ['distance'] },
    ],
  },

  // =====================================================================
  // キャラ21: 美容クリニック経営・ミツキ（立花 美月）
  // =====================================================================
  21: {
    id: 'lunch_21',
    title: '理想の休日',
    situation: '「休みの日って何してます？」と楽しそうに聞いてくる。',
    choices: [
      { id: 'A', text: '「ゴルフですかね。あとは読書とか」と自然に', delta: { fun: 4, trust: 8, focus: 4, creep: 0 }, tags: ['honesty', 'humor'] },
      { id: 'B', text: '「ミツキさんは？」と聞き返す', delta: { fun: 2, trust: 4, focus: 2, creep: 2 }, tags: ['distance'] },
      { id: 'C', text: '「仕事ばかりで…」と同情を引く', delta: { fun: -2, trust: -4, focus: -2, creep: 8 }, tags: ['flattery'] },
    ],
  },

  // =====================================================================
  // キャラ16: 銀座 ハジメ（弁護士法人エース 代表弁護士・ラスボス）本文中の呼称は「ハジメ」
  // =====================================================================
  16: {
    id: 'lunch_16',
    title: 'コンプライアンスの問い',
    situation: '「あなたにとって、コンプライアンスとは何ですか？」と静かに聞く。',
    choices: [
      { id: 'A', text: '「正義と公正さの基盤です」', delta: { fun: 0, trust: 12, focus: 8, creep: 0 }, tags: ['ethics', 'honesty'] },
      { id: 'B', text: '「まぁ形式的なものですよね」', delta: { fun: 2, trust: -10, focus: -4, creep: 12 }, tags: ['risk'] },
      { id: 'C', text: '「難しい質問ですね…」', delta: { fun: 0, trust: -4, focus: -2, creep: 6 }, tags: ['distance'] },
    ],
  },
};
