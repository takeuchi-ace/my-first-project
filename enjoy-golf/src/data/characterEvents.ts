import { CharacterSpecificEvent } from '../types';

/**
 * キャラクター固有イベント（各キャラ5本 × 21 = 105本）
 *
 * - characterSpecificEvents[characterId] で 5本の配列を取得
 * - ラウンド開始時に1〜3本がランダム選出・ランダムホールに配置
 * - hole 5（ランチ）は除外
 * - 同一ラウンドで同じイベントは1度だけ出現
 */
export const characterSpecificEvents: Record<number, CharacterSpecificEvent[]> = {
  // =====================================================================
  // キャラ1: 銀行マン・田中
  // =====================================================================
  1: [
    {
      id: 'char_1_1',
      title: 'スコアの確認',
      situation: '田中がスコアカードを几帳面に記入している。',
      choices: [
        { id: 'A', text: '自分も正確に記入する', delta: { fun: 1, trust: 9, focus: 5, creep: 0 }, tags: ['honesty', 'etiquette'] },
        { id: 'B', text: '「そんな細かくなくても」', delta: { fun: 1, trust: -4, focus: -1, creep: 6 }, tags: ['distance'] },
        { id: 'C', text: '「田中さんって真面目ですね〜」', delta: { fun: 2, trust: -3, focus: 0, creep: 7 }, tags: ['over_praise'] },
      ],
    },
    {
      id: 'char_1_2',
      title: 'フェアプレーの瞬間',
      situation: '田中が自分のOBを即座に申告した。',
      choices: [
        { id: 'A', text: '「潔いですね」', delta: { fun: 1, trust: 8, focus: 4, creep: 0 }, tags: ['honesty', 'sportsmanship', 'fair_compete'] },
        { id: 'B', text: '「惜しかったです！」', delta: { fun: 4, trust: 2, focus: 1, creep: 3 }, tags: ['hype'] },
        { id: 'C', text: '「見えなかったことにします？」', delta: { fun: 2, trust: -10, focus: -4, creep: 14 }, tags: ['cheat_score'] },
      ],
    },
    {
      id: 'char_1_3',
      title: 'バンカーショットの判断',
      situation: '田中のボールがグリーンサイドバンカーに入った。アゴが高く難しいライだ。',
      choices: [
        { id: 'A', text: '「無理せずグリーンセンター狙いが堅実ですね」と正直にアドバイスする', delta: { fun: 3, trust: 8, focus: 4, creep: 0 }, tags: ['honesty', 'etiquette', 'analysis_praise'] },
        { id: 'B', text: '「どちらでもアリだと思いますよ」と曖昧に答える', delta: { fun: 2, trust: 3, focus: 2, creep: 2 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「田中さんなら絶対ピンに寄せられますよ！天才的です！」と大げさに煽る', delta: { fun: 1, trust: -4, focus: -2, creep: 8 }, tags: ['over_praise', 'flattery'] },
      ],
    },
    {
      id: 'char_1_4',
      title: 'カート内での商談話',
      situation: '移動中、田中が「最近、融資の審査基準が厳しくなってきましてね…」とぽつりと漏らした。',
      choices: [
        { id: 'A', text: '「現場のご苦労は想像以上だと思います」と誠実に共感する', delta: { fun: 2, trust: 7, focus: 3, creep: 0 }, tags: ['honesty', 'serious'] },
        { id: 'B', text: '「今日はゴルフに集中しましょう！」と話題を切り替える', delta: { fun: 4, trust: 2, focus: 1, creep: 1 }, tags: ['neutral', 'humor'] },
        { id: 'C', text: '「じゃあウチの融資、通してもらえません？」と冗談めかして頼む', delta: { fun: -1, trust: -5, focus: -3, creep: 10 }, tags: ['cheat_score', 'pressure'] },
      ],
    },
    {
      id: 'char_1_5',
      title: 'スコア確認',
      situation: 'ハーフ終了後、田中が「7番ホール、私5打でしたっけ？」と聞いてきた。実際は6打だった。',
      choices: [
        { id: 'A', text: '「6打だったと思います。ダボでしたよね」と正確に伝える', delta: { fun: 2, trust: 9, focus: 5, creep: 0 }, tags: ['honesty', 'etiquette'] },
        { id: 'B', text: '「もう一度思い出してみましょう」と一緒に振り返る', delta: { fun: 2, trust: 4, focus: 2, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「5打でしたよ！」と嘘をついてスコアを良くしてあげる', delta: { fun: 0, trust: -6, focus: -4, creep: 12 }, tags: ['cheat_score', 'flattery'] },
      ],
    },
    {
      id: 'char_1_6',
      title: '静かな勝負の提案',
      situation: '田中がティーグラウンドで静かにこちらを見た。「…このホール、真剣に勝負しませんか」',
      choices: [
        { id: 'A', text: '「望むところです」と真っ直ぐ目を見て答える', delta: { fun: 4, trust: 9, focus: 5, creep: 0 }, tags: ['challenge', 'fair_compete', 'sportsmanship'] },
        { id: 'B', text: '「田中さんのプレー、見習いたいです」と謙虚に返す', delta: { fun: 2, trust: 7, focus: 3, creep: 0 }, tags: ['self_reflect', 'honesty'] },
        { id: 'C', text: '「田中さんには敵いませんよ！」と大げさに持ち上げる', delta: { fun: 3, trust: -3, focus: 0, creep: 7 }, tags: ['flattery', 'over_praise'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ2: 体育会系社長・鬼塚
  // =====================================================================
  2: [
    {
      id: 'char_2_1',
      title: '素振り100回宣言',
      situation: '鬼塚が「昨日素振り100回やってきた」と腕まくりしている。',
      choices: [
        { id: 'A', text: '「さすがですね、気合入ってますね！」', delta: { fun: 5, trust: 6, focus: 4, creep: 0 }, tags: ['bold', 'kiai'] },
        { id: 'B', text: '「量より質も大事ですよ」', delta: { fun: -1, trust: 4, focus: 7, creep: 2 }, tags: ['logic'] },
        { id: 'C', text: '「僕は200回やりました」', delta: { fun: 2, trust: -4, focus: -2, creep: 10 }, tags: ['over_praise'] },
      ],
    },
    {
      id: 'char_2_2',
      title: '根性パット',
      situation: '長いパットを前に「気合で入れる！」と叫んでいる。',
      choices: [
        { id: 'A', text: '「いけます！打ちましょう！」', delta: { fun: 6, trust: 5, focus: 3, creep: 0 }, tags: ['bold', 'humor', 'kiai', 'ride_the_mood'] },
        { id: 'B', text: '「ラインだけ確認しませんか」', delta: { fun: 0, trust: 6, focus: 8, creep: 1 }, tags: ['logic'] },
        { id: 'C', text: '「鬼塚さんなら目を瞑っても入りますよ」', delta: { fun: 3, trust: -4, focus: -3, creep: 10 }, tags: ['over_praise'] },
      ],
    },
    {
      id: 'char_2_3',
      title: '雨天続行の判断',
      situation: '突然の雨。他の組はクラブハウスに戻り始めているが、鬼塚は空を見上げている。',
      choices: [
        { id: 'A', text: '「このくらいの雨、むしろ燃えますね！やりましょう！」', delta: { fun: 6, trust: 8, focus: 3, creep: 0 }, tags: ['bold', 'humor', 'kiai', 'adversity'] },
        { id: 'B', text: '「雷が来なければ続けましょうか」と提案する', delta: { fun: 3, trust: 3, focus: 3, creep: 1 }, tags: ['neutral', 'logic'] },
        { id: 'C', text: '「…濡れるの嫌なので戻りませんか」と小声で言う', delta: { fun: -2, trust: -5, focus: -1, creep: 7 }, tags: ['safe', 'silence', 'excuse', 'avoid_risk'] },
      ],
    },
    {
      id: 'char_2_4',
      title: 'ドラコンホールの挑戦',
      situation: 'ドラコンホールに到着。鬼塚が「よし、ここは全力だ！」とドライバーを振り回している。',
      choices: [
        { id: 'A', text: '「負けませんよ！全力勝負といきましょう！」と対抗心を燃やす', delta: { fun: 7, trust: 7, focus: 2, creep: 0 }, tags: ['bold', 'humor', 'kiai', 'challenge'] },
        { id: 'B', text: '「鬼塚さんの飛距離には敵いませんが、頑張ります」と謙虚に構える', delta: { fun: 3, trust: 4, focus: 3, creep: 2 }, tags: ['neutral', 'honesty'] },
        { id: 'C', text: '黙ってフェアウェイウッドを取り出し、安全に刻む構えを見せる', delta: { fun: -3, trust: -4, focus: 1, creep: 8 }, tags: ['safe', 'silence', 'safe_play', 'avoid_risk'] },
      ],
    },
    {
      id: 'char_2_5',
      title: 'OB連発の後輩',
      situation: '同伴の若手社員がOBを3連発し萎縮している。鬼塚がこちらをチラッと見た。',
      choices: [
        { id: 'A', text: '「OBなんて気合で取り返せる！次は一緒に声出していこう！」と若手を鼓舞する', delta: { fun: 5, trust: 8, focus: 3, creep: 0 }, tags: ['bold', 'humor', 'bro', 'team', 'back_up'] },
        { id: 'B', text: '「誰でもそういう日はありますよ」とフォローする', delta: { fun: 3, trust: 3, focus: 2, creep: 2 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '何も言わず若手に目もくれず自分のプレーに集中する', delta: { fun: -2, trust: -5, focus: 0, creep: 9 }, tags: ['silence', 'distance', 'avoid_risk'] },
      ],
    },
    {
      id: 'char_2_6',
      title: '池ポチャからの逆境',
      situation: 'あなたのティーショットが池に吸い込まれた。鬼塚が腕組みしてこちらを見ている。「…で、どうする？」',
      choices: [
        { id: 'A', text: '「打ち直します！次は絶対フェアウェイに！」と即座に構える', delta: { fun: 6, trust: 9, focus: 5, creep: 0 }, tags: ['kiai', 'challenge', 'adversity'] },
        { id: 'B', text: '「一緒に最後まで走りましょう！」と鬼塚を巻き込む', delta: { fun: 5, trust: 8, focus: 3, creep: 0 }, tags: ['bro', 'team', 'adversity'] },
        { id: 'C', text: '「…まぁ、こういう日もありますよね」と苦笑いする', delta: { fun: -1, trust: -4, focus: -2, creep: 5 }, tags: ['excuse', 'safe_play'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ3: 二代目オーナー・坊っちゃん
  // =====================================================================
  3: [
    {
      id: 'char_3_1',
      title: 'のんびりティーショット',
      situation: '坊っちゃんがのんびり素振りを繰り返している。急ぐ気配がない。',
      choices: [
        { id: 'A', text: '一緒にのんびり待つ', delta: { fun: 5, trust: 6, focus: 2, creep: 0 }, tags: ['humor'] },
        { id: 'B', text: '「フォーム綺麗ですね」', delta: { fun: 3, trust: 4, focus: 1, creep: 2 }, tags: ['flattery'] },
        { id: 'C', text: '「時間大丈夫ですか？」', delta: { fun: -2, trust: -4, focus: 1, creep: 8 }, tags: ['serious'] },
      ],
    },
    {
      id: 'char_3_2',
      title: '突然の鋭い一言',
      situation: '「…あのミス、わざとじゃないですよね？」と坊っちゃんが急に鋭い目をした。',
      choices: [
        { id: 'A', text: '正直に答える', delta: { fun: 1, trust: 8, focus: 4, creep: 0 }, tags: ['honesty'] },
        { id: 'B', text: '「まさか！」と笑い飛ばす', delta: { fun: 4, trust: 3, focus: 1, creep: 3 }, tags: ['humor'] },
        { id: 'C', text: '話を逸らす', delta: { fun: 0, trust: -6, focus: -1, creep: 10 }, tags: ['distance'] },
      ],
    },
    {
      id: 'char_3_3',
      title: '新しいウェッジ自慢',
      situation: '坊っちゃんが「これ、限定モデルのウェッジなんです」と嬉しそうに新しいクラブを見せてきた。',
      choices: [
        { id: 'A', text: '「かっこいい！一回打たせてください！」と興味を示す', delta: { fun: 6, trust: 7, focus: 2, creep: 0 }, tags: ['humor', 'flattery'] },
        { id: 'B', text: '「いいクラブですね」とさらっと反応する', delta: { fun: 3, trust: 4, focus: 2, creep: 1 }, tags: ['neutral', 'etiquette'] },
        { id: 'C', text: '「スペック的にはノーマルモデルと同じですよね」と分析を始める', delta: { fun: -2, trust: -3, focus: -1, creep: 8 }, tags: ['logic', 'serious'] },
      ],
    },
    {
      id: 'char_3_4',
      title: 'アプローチの距離感',
      situation: 'グリーンまで50ヤード。坊っちゃんが「何番で打てばいいんだろう…」と迷っている。',
      choices: [
        { id: 'A', text: '「坊っちゃんの柔らかいスイングなら、SWでふわっと上げたら最高ですよ！」', delta: { fun: 5, trust: 7, focus: 3, creep: 0 }, tags: ['humor', 'flattery'] },
        { id: 'B', text: '「SWかAWか、お好きな方で」と選択肢を示す', delta: { fun: 3, trust: 3, focus: 2, creep: 2 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「58度のロフトで打ち出し角を考慮して、キャリー45、ラン5の計算で…」', delta: { fun: -1, trust: -4, focus: -2, creep: 9 }, tags: ['logic', 'serious'] },
      ],
    },
    {
      id: 'char_3_5',
      title: 'カートでの雑談',
      situation: '坊っちゃんが「最近ハマってることあります？」と楽しそうに話を振ってきた。',
      choices: [
        { id: 'A', text: '「実はゴルフYouTubeにハマってて！面白いの見つけたんですよ」と趣味の話を広げる', delta: { fun: 6, trust: 6, focus: 2, creep: 0 }, tags: ['humor', 'flattery'] },
        { id: 'B', text: '「まあいろいろと」と当たり障りなく答える', delta: { fun: 3, trust: 3, focus: 1, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「最近は市場動向の分析レポートを読み込んでいて…」と仕事の話を始める', delta: { fun: -3, trust: -4, focus: 0, creep: 10 }, tags: ['serious', 'logic'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ4: 寡黙なプロ・黒田
  // =====================================================================
  4: [
    {
      id: 'char_4_1',
      title: '無言のバーディ',
      situation: '黒田が無表情でバーディを沈めた。',
      choices: [
        { id: 'A', text: '何も言わず静かに見届ける', delta: { fun: 0, trust: 9, focus: 5, creep: 0 }, tags: ['silence', 'serious'] },
        { id: 'B', text: '「ナイスバーディ！」', delta: { fun: 3, trust: 2, focus: 1, creep: 4 }, tags: ['hype'] },
        { id: 'C', text: '「さすが黒田さん！天才ですね！」', delta: { fun: 2, trust: -6, focus: -1, creep: 11 }, tags: ['over_praise'] },
      ],
    },
    {
      id: 'char_4_2',
      title: 'スイングへの視線',
      situation: '黒田が黙ってこちらのスイングを見ている。',
      choices: [
        { id: 'A', text: '「何か気になりますか」と聞く', delta: { fun: 1, trust: 8, focus: 6, creep: 0 }, tags: ['honesty'] },
        { id: 'B', text: '「見ないでくださいよ」と笑う', delta: { fun: 3, trust: 1, focus: 1, creep: 3 }, tags: ['humor'] },
        { id: 'C', text: '「黒田さんみたいに打ちたいです！」', delta: { fun: 2, trust: -5, focus: -1, creep: 10 }, tags: ['flattery'] },
      ],
    },
    {
      id: 'char_4_3',
      title: 'ティーショットの風読み',
      situation: 'パー3。風が複雑に吹いている。黒田が静かに芝を投げて風を読んでいる。',
      choices: [
        { id: 'A', text: '「左からのアゲンストですね。一番手上げて低く打つのが正解でしょうか」と意見を述べる', delta: { fun: 3, trust: 8, focus: 5, creep: 0 }, tags: ['honesty', 'serious'] },
        { id: 'B', text: '黙って黒田の判断を見守る', delta: { fun: 2, trust: 4, focus: 3, creep: 1 }, tags: ['neutral', 'silence'] },
        { id: 'C', text: '「黒田さんってほんと職人ですね！すごい！」と大げさに感動してみせる', delta: { fun: 0, trust: -5, focus: -3, creep: 10 }, tags: ['flattery', 'over_praise'] },
      ],
    },
    {
      id: 'char_4_4',
      title: 'ミスショットの後',
      situation: '黒田がアイアンをダフり、珍しく苦い顔をしている。一瞬の沈黙が流れた。',
      choices: [
        { id: 'A', text: '何も触れず、さりげなく自分のショット準備に取りかかる', delta: { fun: 2, trust: 9, focus: 5, creep: 0 }, tags: ['honesty', 'serious'] },
        { id: 'B', text: '「ライが悪かったですね」と事実だけ述べる', delta: { fun: 2, trust: 4, focus: 3, creep: 2 }, tags: ['neutral', 'logic'] },
        { id: 'C', text: '「大丈夫ですよ！黒田さんなら次で絶対取り返せます！さすがプロ！」', delta: { fun: -1, trust: -6, focus: -4, creep: 11 }, tags: ['over_praise', 'flattery'] },
      ],
    },
    {
      id: 'char_4_5',
      title: 'クラブ選択の相談',
      situation: '残り160ヤード、やや打ち上げ。番手選びに悩んでいると、黒田がこちらを見ている気がした。',
      choices: [
        { id: 'A', text: '「160ヤード打ち上げで迷ってます。6番だと大きいでしょうか」と素直に聞く', delta: { fun: 3, trust: 8, focus: 4, creep: 0 }, tags: ['honesty', 'serious'] },
        { id: 'B', text: '自分なりに判断して、黙って7番アイアンを抜く', delta: { fun: 2, trust: 3, focus: 3, creep: 1 }, tags: ['neutral', 'focus'] },
        { id: 'C', text: '「黒田さんならどうしますか？全部教えてください！」と全依存する', delta: { fun: 0, trust: -4, focus: -3, creep: 9 }, tags: ['over_support', 'flattery'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ5: 外資エリート・アレクサンダー
  // =====================================================================
  5: [
    {
      id: 'char_5_1',
      title: 'ルール確認',
      situation: 'スミスが「This is out of bounds, right?」とフェアにルールを確認している。',
      choices: [
        { id: 'A', text: '「Yes. ルール通りにいきましょう」', delta: { fun: 1, trust: 8, focus: 5, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
        { id: 'B', text: '「気にしなくていいですよ」', delta: { fun: 2, trust: -4, focus: 0, creep: 6 }, tags: ['distance'] },
        { id: 'C', text: '「セーフにしましょう」', delta: { fun: 2, trust: -10, focus: -2, creep: 12 }, tags: ['cheat_score'] },
      ],
    },
    {
      id: 'char_5_2',
      title: 'マナーへの反応',
      situation: '前の組が遅延プレーをしている。スミスが少し眉をひそめた。',
      choices: [
        { id: 'A', text: '「待ちましょう。焦っても仕方ないです」', delta: { fun: 1, trust: 7, focus: 4, creep: 0 }, tags: ['sportsmanship'] },
        { id: 'B', text: '「文句言いに行きましょうか」', delta: { fun: 2, trust: -2, focus: 0, creep: 6 }, tags: ['bold'] },
        { id: 'C', text: '「先に打っちゃいましょう」', delta: { fun: 2, trust: -8, focus: -2, creep: 12 }, tags: ['cheat_physical'] },
      ],
    },
    {
      id: 'char_5_3',
      title: 'ロストボールの処理',
      situation: 'スミスのボールが深いラフに消えた。5分間の捜索時間が過ぎようとしている。',
      choices: [
        { id: 'A', text: '「時間ですし、ルール通り暫定球の位置からプレーしましょう」とフェアに促す', delta: { fun: 2, trust: 9, focus: 5, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
        { id: 'B', text: '「あと少しだけ探しますか？」と判断を委ねる', delta: { fun: 3, trust: 4, focus: 2, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: 'ポケットからこっそりボールを落として「ありましたよ！」と叫ぶ', delta: { fun: -1, trust: -7, focus: -4, creep: 14 }, tags: ['cheat_physical', 'cheat_score'] },
      ],
    },
    {
      id: 'char_5_4',
      title: 'グリーン上のマナー',
      situation: 'スミスのパッティングライン上を同伴者が無神経に歩いてしまった。スミスの表情が少し曇った。',
      choices: [
        { id: 'A', text: '同伴者に「ラインの上は避けましょう」と穏やかに伝える', delta: { fun: 2, trust: 8, focus: 4, creep: 0 }, tags: ['sportsmanship', 'honesty'] },
        { id: 'B', text: 'スミスに「気にせず打ちましょう」と声をかける', delta: { fun: 3, trust: 3, focus: 2, creep: 2 }, tags: ['neutral', 'humor'] },
        { id: 'C', text: 'スミスのラインの跡をスパイクで踏み直して均そうとする', delta: { fun: -1, trust: -4, focus: -2, creep: 8 }, tags: ['cheat_physical', 'over_support'] },
      ],
    },
    {
      id: 'char_5_5',
      title: 'ハンディキャップの話',
      situation: 'ラウンド後、スミスが「今日のスコアをちゃんとハンディキャップに反映させないとね」と言った。',
      choices: [
        { id: 'A', text: '「正確なハンディキャップが公正な競争の土台ですから」と同意する', delta: { fun: 3, trust: 7, focus: 4, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
        { id: 'B', text: '「ちゃんとやらないとですね」と軽く返す', delta: { fun: 3, trust: 4, focus: 2, creep: 1 }, tags: ['neutral', 'etiquette'] },
        { id: 'C', text: '「悪いスコアは入れなくていいんじゃないですか？」と提案する', delta: { fun: 1, trust: -6, focus: -3, creep: 10 }, tags: ['cheat_score', 'cheat'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ6: 自己啓発社長・光山
  // =====================================================================
  6: [
    {
      id: 'char_6_1',
      title: '感謝のスピーチ',
      situation: '光山が突然「今日この瞬間に感謝！」と両手を広げた。',
      choices: [
        { id: 'A', text: '「最高の天気ですね！」とノる', delta: { fun: 7, trust: 5, focus: 1, creep: 0 }, tags: ['hype', 'humor'] },
        { id: 'B', text: '「…はい」と静かに返す', delta: { fun: -3, trust: -2, focus: 2, creep: 6 }, tags: ['silence'] },
        { id: 'C', text: '「ゴルフに集中しましょう」', delta: { fun: -4, trust: -3, focus: 3, creep: 8 }, tags: ['serious'] },
      ],
    },
    {
      id: 'char_6_2',
      title: 'ポジティブすぎるOB',
      situation: 'OBを打って「これも学び！」と光山が叫んでいる。',
      choices: [
        { id: 'A', text: '「その精神、見習います！」', delta: { fun: 6, trust: 5, focus: 2, creep: 1 }, tags: ['hype'] },
        { id: 'B', text: '「次は大丈夫ですよ」', delta: { fun: 2, trust: 3, focus: 3, creep: 2 }, tags: ['safe'] },
        { id: 'C', text: '「…ポジティブすぎませんか？」', delta: { fun: -3, trust: -5, focus: 1, creep: 9 }, tags: ['serious'] },
      ],
    },
    {
      id: 'char_6_3',
      title: 'OBからの切り替え',
      situation: '光山がOBを打ったが「これはチャンスだ！」と満面の笑みで叫んでいる。',
      choices: [
        { id: 'A', text: '「OBからの逆転こそドラマですよね！伝説のホールにしましょう！」', delta: { fun: 7, trust: 7, focus: 2, creep: 0 }, tags: ['hype', 'humor'] },
        { id: 'B', text: '「切り替え大事ですよね」と軽く同調する', delta: { fun: 3, trust: 4, focus: 2, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「…普通にOBはOBですよ。2打罰です」と現実を突きつける', delta: { fun: -3, trust: -5, focus: 0, creep: 9 }, tags: ['serious', 'logic'] },
      ],
    },
    {
      id: 'char_6_4',
      title: '目標宣言タイム',
      situation: 'スタート前、光山が「今日の目標を宣言しよう！」と全員に求めてきた。',
      choices: [
        { id: 'A', text: '「全ホール笑顔でプレーします！最高の1日にしましょう！」と元気に宣言する', delta: { fun: 6, trust: 8, focus: 3, creep: 0 }, tags: ['hype', 'humor'] },
        { id: 'B', text: '「90切り目指します」とスコアの目標を普通に言う', delta: { fun: 3, trust: 3, focus: 3, creep: 2 }, tags: ['neutral', 'focus'] },
        { id: 'C', text: '「…特にないです」と無言気味に返す', delta: { fun: -2, trust: -5, focus: -1, creep: 8 }, tags: ['silence', 'serious'] },
      ],
    },
    {
      id: 'char_6_5',
      title: '朝の練習グリーン',
      situation: '練習グリーンで光山が「パターは宇宙と繋がる瞬間だ」と独自の理論を熱く語り始めた。',
      choices: [
        { id: 'A', text: '「宇宙のリズムでストロークすれば入る気がしてきました！」と全力で乗っかる', delta: { fun: 7, trust: 6, focus: 1, creep: 0 }, tags: ['humor', 'hype'] },
        { id: 'B', text: '「面白い考え方ですね」とにこやかに聞く', delta: { fun: 4, trust: 3, focus: 2, creep: 1 }, tags: ['neutral', 'flattery'] },
        { id: 'C', text: '「科学的根拠はあるんですか？」と真面目に問い詰める', delta: { fun: -3, trust: -6, focus: 0, creep: 10 }, tags: ['serious', 'logic'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ7: 昭和の重鎮・巌
  // =====================================================================
  7: [
    {
      id: 'char_7_1',
      title: '昔話ラッシュ',
      situation: '巌が「ワシが若い頃はな…」と延々と昔話を続けている。',
      choices: [
        { id: 'A', text: '「勉強になります」と丁寧に聞く', delta: { fun: 1, trust: 8, focus: 3, creep: 0 }, tags: ['etiquette'] },
        { id: 'B', text: '「今は時代が違いますよ」', delta: { fun: 0, trust: -6, focus: 1, creep: 10 }, tags: ['bold'] },
        { id: 'C', text: '話を遮る', delta: { fun: -1, trust: -10, focus: -2, creep: 14 }, tags: ['bold'] },
      ],
    },
    {
      id: 'char_7_2',
      title: '挨拶の作法',
      situation: '巌がティーグラウンドで一礼してから構えた。',
      choices: [
        { id: 'A', text: '同じように一礼する', delta: { fun: 1, trust: 9, focus: 5, creep: 0 }, tags: ['etiquette', 'honesty'] },
        { id: 'B', text: '「いいですね！」と声を上げる', delta: { fun: 2, trust: -3, focus: 0, creep: 7 }, tags: ['hype'] },
        { id: 'C', text: '気にせず先に打つ', delta: { fun: 0, trust: -8, focus: -2, creep: 12 }, tags: ['bold'] },
      ],
    },
    {
      id: 'char_7_3',
      title: 'ティーグラウンドの順番',
      situation: '前のホールのスコアでは巌のオナーだが、若手が先にティーアップしてしまった。巌の眉がピクリと動いた。',
      choices: [
        { id: 'A', text: '若手にそっと「巌さんがオナーですよ」と声をかけ、順番を正す', delta: { fun: 2, trust: 9, focus: 4, creep: 0 }, tags: ['etiquette', 'honesty'] },
        { id: 'B', text: '「まあまあ、楽しくやりましょう」と場を和ませる', delta: { fun: 3, trust: 2, focus: 1, creep: 3 }, tags: ['neutral', 'humor'] },
        { id: 'C', text: '「準備できた人から打つ方が効率的っすよ！」と新しいスタイルを提案する', delta: { fun: -1, trust: -6, focus: -2, creep: 11 }, tags: ['bold', 'hype'] },
      ],
    },
    {
      id: 'char_7_4',
      title: 'クラブハウスでの振る舞い',
      situation: 'ラウンド後のラウンジ。ドレスコード的に微妙な格好の客が近くを通った。巌が眉をひそめている。',
      choices: [
        { id: 'A', text: '「格式が守られているのは気持ちいいですね」と巌に同意を示す', delta: { fun: 2, trust: 8, focus: 3, creep: 0 }, tags: ['etiquette', 'honesty'] },
        { id: 'B', text: '特に触れず、別の話題にする', delta: { fun: 3, trust: 3, focus: 2, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「今どきドレスコードとか古くないですか？もっとカジュアルでいいのに！」', delta: { fun: -2, trust: -7, focus: -3, creep: 12 }, tags: ['bold', 'hype'] },
      ],
    },
    {
      id: 'char_7_5',
      title: 'グリーンフォークの作法',
      situation: 'グリーンに大きなボールマークがついた。巌がじっとこちらを見ている。',
      choices: [
        { id: 'A', text: 'すぐにグリーンフォークで丁寧にボールマークを直す。「コースへの感謝ですね」', delta: { fun: 2, trust: 9, focus: 4, creep: 0 }, tags: ['etiquette', 'honesty'] },
        { id: 'B', text: 'ボールマークを直すが、特に何も言わずさりげなくやる', delta: { fun: 2, trust: 5, focus: 3, creep: 1 }, tags: ['neutral', 'etiquette'] },
        { id: 'C', text: 'ボールマークを無視して「早くパット打ちましょう！テンポ大事っす！」と急かす', delta: { fun: -2, trust: -7, focus: -3, creep: 11 }, tags: ['bold', 'hype'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ8: テック社長・中村
  // =====================================================================
  8: [
    {
      id: 'char_8_1',
      title: 'データ分析',
      situation: '中村がスマホでスイングデータを分析している。',
      choices: [
        { id: 'A', text: '「どんな数値が出てますか？」', delta: { fun: 1, trust: 8, focus: 6, creep: 0 }, tags: ['logic'] },
        { id: 'B', text: '「データより感覚ですよ」', delta: { fun: 2, trust: -3, focus: 0, creep: 5 }, tags: ['hype'] },
        { id: 'C', text: '「中村さんって天才ですね！」', delta: { fun: 2, trust: -4, focus: -1, creep: 9 }, tags: ['flattery'] },
      ],
    },
    {
      id: 'char_8_2',
      title: '効率化の提案',
      situation: '「このホール、セオリー的にはこう攻めるべきなんですよね」と中村が語る。',
      choices: [
        { id: 'A', text: '「データ的にはそうですね」と同意', delta: { fun: 1, trust: 7, focus: 5, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「理屈じゃないですよ」', delta: { fun: 3, trust: -2, focus: 0, creep: 4 }, tags: ['hype'] },
        { id: 'C', text: '「さすがです！」と過剰に褒める', delta: { fun: 2, trust: -5, focus: -1, creep: 8 }, tags: ['flattery'] },
      ],
    },
    {
      id: 'char_8_3',
      title: 'スコア記録アプリ',
      situation: '中村がスマートウォッチでショットデータをリアルタイム記録している。「風速3.2m/sで湿度62%。番手選びの根拠が変わる」と嬉しそうだ。',
      choices: [
        { id: 'A', text: '「そのデータだと今のホールは何番が最適解ですか？」と論理的に興味を示す', delta: { fun: 4, trust: 8, focus: 3, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「へえ、すごいですね」と軽く感心して聞き流す', delta: { fun: 2, trust: 2, focus: 1, creep: 2 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「中村さんのデータ分析、AIより正確じゃないですか！」と大げさに持ち上げる', delta: { fun: 1, trust: -4, focus: -1, creep: 8 }, tags: ['flattery', 'hype'] },
      ],
    },
    {
      id: 'char_8_4',
      title: 'コース戦略の議論',
      situation: 'ドッグレッグのホール。中村が「刻むか攻めるか、期待値で計算すると刻む方が0.3打有利なんだけど…」と考え込んでいる。',
      choices: [
        { id: 'A', text: '「ミスの分散も含めてですか？リスクリワード比で見ると攻めも合理的かも」と議論に乗る', delta: { fun: 5, trust: 9, focus: 4, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「難しいホールですよね。中村さんの判断にお任せします」', delta: { fun: 1, trust: 1, focus: 2, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「中村さんなら攻めても絶対大丈夫ですよ！信じてます！」と根拠なく煽る', delta: { fun: 2, trust: -5, focus: -2, creep: 9 }, tags: ['flattery', 'hype'] },
      ],
    },
    {
      id: 'char_8_5',
      title: 'キャディとの見解の違い',
      situation: 'キャディが「7番で」と助言したが、中村のデータでは6番が正しいと主張。「データとキャディの経験、どっちが正しい？」とあなたに意見を求めてきた。',
      choices: [
        { id: 'A', text: '「両方の根拠を聞いて判断するのが合理的では」と正直に述べる', delta: { fun: 3, trust: 10, focus: 3, creep: 0 }, tags: ['logic', 'honesty', 'ethics'] },
        { id: 'B', text: '「どっちもありそうですよね」と曖昧に濁す', delta: { fun: 1, trust: 0, focus: 0, creep: 2 }, tags: ['neutral', 'silence'] },
        { id: 'C', text: '「もちろん中村さんのデータが正しいです！キャディより上ですって！」', delta: { fun: 1, trust: -6, focus: -2, creep: 10 }, tags: ['flattery', 'over_praise'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ9: 試し屋・佐藤
  // =====================================================================
  9: [
    {
      id: 'char_9_1',
      title: 'わざとミスショット',
      situation: '佐藤がわざとミスをして、こちらの反応をじっと見ている。',
      choices: [
        { id: 'A', text: '「今のは意図的ですよね」', delta: { fun: 1, trust: 9, focus: 5, creep: 0 }, tags: ['honesty'] },
        { id: 'B', text: '「ドンマイです！」', delta: { fun: 2, trust: 1, focus: 1, creep: 4 }, tags: ['hype'] },
        { id: 'C', text: '「佐藤さん、それでも上手い！」', delta: { fun: 2, trust: -6, focus: -1, creep: 10 }, tags: ['flattery'] },
      ],
    },
    {
      id: 'char_9_2',
      title: '値踏みの質問',
      situation: '「正直に言って、今日の自分の調子は？」と佐藤が試すように聞いてくる。',
      choices: [
        { id: 'A', text: '正直に答える', delta: { fun: 1, trust: 10, focus: 4, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '「まあまあです」と濁す', delta: { fun: 0, trust: -2, focus: 1, creep: 5 }, tags: ['distance'] },
        { id: 'C', text: '「佐藤さんのおかげで絶好調です」', delta: { fun: 2, trust: -8, focus: -2, creep: 12 }, tags: ['flattery'] },
      ],
    },
    {
      id: 'char_9_3',
      title: 'わざとらしいミス自慢',
      situation: 'OBを打った後「風のせいだな。俺の腕前なら普通はフェアウェイど真ん中だけど」とニヤニヤしながらこちらを見ている。',
      choices: [
        { id: 'A', text: '「スイングが少し開いてましたよ。風だけじゃないと思います」と率直に指摘する', delta: { fun: 4, trust: 9, focus: 3, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '「風は確かに強かったですからね」と部分的に同意する', delta: { fun: 2, trust: 2, focus: 1, creep: 3 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「佐藤さんの実力ならありえないですもん！完全に風のせいです！」と全力で同調', delta: { fun: 0, trust: -6, focus: -2, creep: 10 }, tags: ['flattery', 'over_praise'] },
      ],
    },
    {
      id: 'char_9_4',
      title: 'スコアの書き間違い',
      situation: '佐藤が「このホール俺5打だったよな？」と聞いてきた。実際には6打だった。佐藤の目がこちらを観察している。',
      choices: [
        { id: 'A', text: '「6打だったと思います」と正直に伝える', delta: { fun: 3, trust: 10, focus: 4, creep: 0 }, tags: ['honesty', 'ethics', 'sportsmanship'] },
        { id: 'B', text: '「自信ないですけど…もう一回数え直しましょうか」', delta: { fun: 1, trust: 1, focus: 0, creep: 3 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「5打でしたよ！間違いないです！」と嘘をつく', delta: { fun: 0, trust: -8, focus: -3, creep: 12 }, tags: ['cheat_score', 'flattery'] },
      ],
    },
    {
      id: 'char_9_5',
      title: 'ビジネスの本音',
      situation: 'カートで佐藤が「正直に聞くけど、今日俺とゴルフしてるの、仕事のためだろ？」とストレートに切り込んできた。',
      choices: [
        { id: 'A', text: '「ビジネスのきっかけになればとは思ってます。でもゴルフ自体が楽しいのも本当です」と本音で答える', delta: { fun: 5, trust: 10, focus: 2, creep: 0 }, tags: ['honesty', 'bold'] },
        { id: 'B', text: '「まあ、いろんな意味がありますかね…」と笑ってごまかす', delta: { fun: 2, trust: 0, focus: 0, creep: 3 }, tags: ['neutral', 'silence'] },
        { id: 'C', text: '「そんなことないですよ！純粋にゴルフを楽しみたくて！」と必死に取り繕う', delta: { fun: 0, trust: -7, focus: -2, creep: 11 }, tags: ['flattery', 'over_support'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ10: 褒め殺し王・ナイス松本
  // =====================================================================
  10: [
    {
      id: 'char_10_1',
      title: 'ナイスショットの嵐',
      situation: '松本が全てのショットに「ナイスショット！」と叫んでいる。',
      choices: [
        { id: 'A', text: 'ノリで「ナイス！」と返す', delta: { fun: 7, trust: 5, focus: 1, creep: 0 }, tags: ['humor', 'over_praise'] },
        { id: 'B', text: '「ありがとうございます」と静かに返す', delta: { fun: -3, trust: -1, focus: 2, creep: 5 }, tags: ['silence'] },
        { id: 'C', text: '「全部ナイスって言いすぎでは」', delta: { fun: -5, trust: -3, focus: 1, creep: 9 }, tags: ['serious'] },
      ],
    },
    {
      id: 'char_10_2',
      title: '褒めの応酬',
      situation: '「いやあ、あなた最高ですよ！」と松本が肩を叩いてきた。',
      choices: [
        { id: 'A', text: '「松本さんこそ最高です！」', delta: { fun: 6, trust: 4, focus: 1, creep: 1 }, tags: ['humor', 'over_praise'] },
        { id: 'B', text: '「いえいえ…」と謙遜', delta: { fun: -2, trust: 1, focus: 1, creep: 4 }, tags: ['silence'] },
        { id: 'C', text: '「本気で言ってます？」', delta: { fun: -4, trust: -4, focus: 0, creep: 10 }, tags: ['serious'] },
      ],
    },
    {
      id: 'char_10_3',
      title: 'バンカーからの脱出',
      situation: '松本がバンカーに入れたが「ナイスバンカー！砂の感触を楽しめるなんて最高！」と叫んでいる。ノリを求めている。',
      choices: [
        { id: 'A', text: '「ナイスビーチイン！ここからのエクスプロージョン、見せ場ですよ！」', delta: { fun: 6, trust: 8, focus: 2, creep: 0 }, tags: ['humor', 'over_praise'] },
        { id: 'B', text: '「バンカー、頑張って出しましょう」と普通に励ます', delta: { fun: 1, trust: 2, focus: 2, creep: 2 }, tags: ['neutral', 'serious'] },
        { id: 'C', text: '「次は気をつけたほうがいいですよ」と冷静にアドバイスする', delta: { fun: -3, trust: -4, focus: 1, creep: 7 }, tags: ['serious', 'silence'] },
      ],
    },
    {
      id: 'char_10_4',
      title: 'ナイスオン合戦',
      situation: 'あなたがグリーンにオンさせた。松本が「ナーイスオン！天才！今日のMVP確定！」とお返しの褒めを期待している。',
      choices: [
        { id: 'A', text: '「松本さんのさっきのアプローチこそ神業でしたよ！ゾーン入ってません？」と褒め返す', delta: { fun: 7, trust: 8, focus: 1, creep: 0 }, tags: ['humor', 'over_praise', 'hype'] },
        { id: 'B', text: '「ありがとうございます」と控えめに受け取る', delta: { fun: 2, trust: 2, focus: 2, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「別に普通のショットですけど…大げさすぎませんか？」とテンションを下げる', delta: { fun: -4, trust: -5, focus: 0, creep: 8 }, tags: ['serious', 'silence'] },
      ],
    },
    {
      id: 'char_10_5',
      title: '空振りのフォロー',
      situation: '松本がティーショットでまさかの空振り。一瞬の沈黙の後「…ナイス素振り？」と苦笑い。場の空気をどうするかの瞬間。',
      choices: [
        { id: 'A', text: '「完璧な素振りでした！フォームチェックとしては100点！本番いきましょう！」', delta: { fun: 7, trust: 9, focus: 2, creep: 0 }, tags: ['humor', 'over_praise'] },
        { id: 'B', text: '「ドンマイです、もう一回いきましょう」と声をかける', delta: { fun: 2, trust: 3, focus: 2, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '無言で目をそらして気まずそうにする', delta: { fun: -5, trust: -6, focus: -1, creep: 9 }, tags: ['silence', 'serious'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ11: 政界フィクサー・大門
  // =====================================================================
  11: [
    {
      id: 'char_11_1',
      title: '派閥の探り',
      situation: '「あなたは…どちら側の人間かな？」と大門が意味深に聞いてくる。',
      choices: [
        { id: 'A', text: '「自分は自分のスタンスです」', delta: { fun: 0, trust: 8, focus: 5, creep: 0 }, tags: ['bold', 'logic'] },
        { id: 'B', text: '「大門さんと同じ側です」', delta: { fun: 1, trust: -4, focus: 0, creep: 8 }, tags: ['over_support'] },
        { id: 'C', text: '「○○さんの話だと…」と他人の情報を出す', delta: { fun: 1, trust: -8, focus: -2, creep: 12 }, tags: ['snitch'] },
      ],
    },
    {
      id: 'char_11_2',
      title: '噂話の罠',
      situation: '大門が他人の噂話を振ってきた。試されている気がする。',
      choices: [
        { id: 'A', text: '乗らずに話題を変える', delta: { fun: 0, trust: 9, focus: 3, creep: 0 }, tags: ['logic'] },
        { id: 'B', text: '少し乗る', delta: { fun: 3, trust: -4, focus: -1, creep: 8 }, tags: ['risk'] },
        { id: 'C', text: '積極的に情報を出す', delta: { fun: 4, trust: -10, focus: -2, creep: 14 }, tags: ['snitch'] },
      ],
    },
    {
      id: 'char_11_3',
      title: '意味深な誘い',
      situation: '大門が「来月、ある大臣と非公開のゴルフコンペがある。君も来るか？誰にも言うなよ」と囁いてきた。',
      choices: [
        { id: 'A', text: '「光栄です。ただ利害関係がある件が進行中なら辞退します」と筋を通す', delta: { fun: 3, trust: 9, focus: 4, creep: 0 }, tags: ['bold', 'logic', 'ethics'] },
        { id: 'B', text: '「ちょっと考えさせてください」と保留にする', delta: { fun: 1, trust: 2, focus: 1, creep: 2 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「もちろん行きます！何でもお手伝いしますよ！」と前のめりになる', delta: { fun: 2, trust: -5, focus: -2, creep: 10 }, tags: ['over_support', 'flattery'] },
      ],
    },
    {
      id: 'char_11_4',
      title: '他プレーヤーの評価',
      situation: '大門が前の組のプレーヤーを顎で指し「あいつ信用できると思うか？」と品定めするように聞いてきた。',
      choices: [
        { id: 'A', text: '「直接取引がないので判断材料がありません。大門さんはどう見ていますか？」と逆に聞き返す', delta: { fun: 3, trust: 8, focus: 3, creep: 0 }, tags: ['logic', 'bold'] },
        { id: 'B', text: '「よく存じ上げないですね」とかわす', delta: { fun: 1, trust: 2, focus: 1, creep: 2 }, tags: ['neutral', 'distance'] },
        { id: 'C', text: '「あの人、実は裏で○○って噂がありますよ」と噂話に乗る', delta: { fun: 2, trust: -7, focus: -3, creep: 12 }, tags: ['snitch', 'over_support'] },
      ],
    },
    {
      id: 'char_11_5',
      title: 'ルール違反の目撃',
      situation: '大門のボールが木の根元に。大門がさりげなくボールを動かそうとし「見なかったことにしろ」と低い声で言った。',
      choices: [
        { id: 'A', text: '「アンプレヤブル宣言すれば1打罰で楽に打てます。そっちが賢明です」と合理的な代案を出す', delta: { fun: 3, trust: 10, focus: 4, creep: 0 }, tags: ['logic', 'bold', 'sportsmanship'] },
        { id: 'B', text: '視線をそらして何も言わない', delta: { fun: 0, trust: 0, focus: -1, creep: 4 }, tags: ['silence', 'neutral'] },
        { id: 'C', text: '「大門さんの判断なら何でも正しいです。見てません」と追従する', delta: { fun: 0, trust: -6, focus: -3, creep: 11 }, tags: ['cheat', 'over_support'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ12: 芸能プロデューサー・星野
  // =====================================================================
  12: [
    {
      id: 'char_12_1',
      title: '演出提案',
      situation: '「このホール、ドラマチックに攻めましょうよ！」と星野がノリノリ。',
      choices: [
        { id: 'A', text: '「面白いですね！やりましょう」', delta: { fun: 7, trust: 5, focus: 1, creep: 0 }, tags: ['humor', 'hype'] },
        { id: 'B', text: '「安全に行きましょう」', delta: { fun: -2, trust: 2, focus: 4, creep: 4 }, tags: ['safe'] },
        { id: 'C', text: '「ゴルフに演出は不要です」', delta: { fun: -5, trust: -4, focus: 2, creep: 9 }, tags: ['serious'] },
      ],
    },
    {
      id: 'char_12_2',
      title: 'テンポの催促',
      situation: '「次！次！テンポテンポ！」と星野がせかしてくる。',
      choices: [
        { id: 'A', text: 'テンポよく合わせる', delta: { fun: 6, trust: 5, focus: 2, creep: 0 }, tags: ['humor', 'hype'] },
        { id: 'B', text: '「少し待ってください」', delta: { fun: -1, trust: 1, focus: 3, creep: 3 }, tags: ['safe'] },
        { id: 'C', text: '「落ち着いてください」', delta: { fun: -4, trust: -5, focus: 1, creep: 10 }, tags: ['serious', 'etiquette'] },
      ],
    },
    {
      id: 'char_12_3',
      title: 'ショットのリプレイ要求',
      situation: '星野がナイスショットを決めた後「今の撮った？もう一回打つから撮ってよ！SNS用！」とスマホを渡してきた。',
      choices: [
        { id: 'A', text: '「了解！スロー撮影で行きましょう。カメラワークは任せて！」', delta: { fun: 6, trust: 7, focus: 1, creep: 0 }, tags: ['humor', 'hype'] },
        { id: 'B', text: '「すみません撮れてなかったです。次で撮りますね」', delta: { fun: 2, trust: 3, focus: 2, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「ゴルフ中にSNSは…マナー的にどうかと」とたしなめる', delta: { fun: -4, trust: -5, focus: 1, creep: 8 }, tags: ['serious', 'etiquette'] },
      ],
    },
    {
      id: 'char_12_4',
      title: 'キャスティング話',
      situation: 'カートで星野が「次のゴルフ番組、ゲスト誰がいい？面白い人いる？」と企画会議のテンションで振ってきた。',
      choices: [
        { id: 'A', text: '「芸人×プロゴルファーの異種マッチとか？ギャップでバズりそう」と企画ノリで返す', delta: { fun: 7, trust: 8, focus: 2, creep: 0 }, tags: ['humor', 'hype', 'bold'] },
        { id: 'B', text: '「詳しくないのでお任せします」と控える', delta: { fun: 1, trust: 1, focus: 1, creep: 2 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「番組のことより今はゴルフに集中しませんか」', delta: { fun: -5, trust: -6, focus: 2, creep: 9 }, tags: ['serious', 'etiquette'] },
      ],
    },
    {
      id: 'char_12_5',
      title: 'ドラマチックなパット',
      situation: '最終ホール、星野の3mのバーディーパット。「実況して！盛り上げて！」と無茶振りしてきた。',
      choices: [
        { id: 'A', text: '「さあ運命の最終ホール！星野Pの一打が伝説になるか！…静まり返るギャラリー！」と全力実況', delta: { fun: 8, trust: 9, focus: 1, creep: 0 }, tags: ['humor', 'hype'] },
        { id: 'B', text: '「頑張ってください」と普通に応援する', delta: { fun: 2, trust: 2, focus: 2, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「集中が乱れるので静かにしたほうがいいと思います」', delta: { fun: -4, trust: -5, focus: 2, creep: 8 }, tags: ['serious', 'etiquette'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ13: 不動産王・金城
  // =====================================================================
  13: [
    {
      id: 'char_13_1',
      title: '豪快なドライバー',
      situation: '金城が「全力で飛ばしたるわ！」とフルスイングの構え。',
      choices: [
        { id: 'A', text: '「いきましょう！豪快に！」', delta: { fun: 6, trust: 5, focus: 2, creep: 0 }, tags: ['bold'] },
        { id: 'B', text: '「安全にフェアウェイ狙いで」', delta: { fun: -3, trust: -1, focus: 4, creep: 5 }, tags: ['safe'] },
        { id: 'C', text: '黙って見ている', delta: { fun: -2, trust: -4, focus: 1, creep: 8 }, tags: ['silence'] },
      ],
    },
    {
      id: 'char_13_2',
      title: '打ち上げの誘い',
      situation: '「今日の打ち上げ、ワシが全部出すわ！」と金城が豪快に宣言。',
      choices: [
        { id: 'A', text: '「やった！ありがとうございます！」', delta: { fun: 7, trust: 5, focus: 1, creep: 0 }, tags: ['bold', 'humor'] },
        { id: 'B', text: '「いえ、割り勘で」', delta: { fun: -2, trust: 2, focus: 2, creep: 4 }, tags: ['safe'] },
        { id: 'C', text: '「…」と黙る', delta: { fun: -3, trust: -5, focus: 0, creep: 9 }, tags: ['silence'] },
      ],
    },
    {
      id: 'char_13_3',
      title: '豪快な賭けゴルフ',
      situation: '「このホール、ニアピン勝負しようぜ！負けたら焼肉おごりな！」と金城が豪快に勝負を仕掛けてきた。',
      choices: [
        { id: 'A', text: '「いいですよ！負けたら最高級カルビ奢ります。金城さんが負けたらワインも追加で！」', delta: { fun: 6, trust: 8, focus: 3, creep: 0 }, tags: ['bold', 'humor'] },
        { id: 'B', text: '「昼飯くらいなら…」と控えめに応じる', delta: { fun: 2, trust: 2, focus: 1, creep: 2 }, tags: ['safe', 'neutral'] },
        { id: 'C', text: '「賭け事はちょっと…ルール上も」と断る', delta: { fun: -4, trust: -5, focus: 1, creep: 7 }, tags: ['safe', 'serious'] },
      ],
    },
    {
      id: 'char_13_4',
      title: 'ウォーターハザード越え',
      situation: '目の前に大きな池。金城が「刻むなんてつまらねぇ！男なら池越え一択だろ！」とドライバーを構えながら煽ってくる。',
      choices: [
        { id: 'A', text: '「やりましょう！沈んだらボール代おごってくださいよ！」と笑いながらドライバーを抜く', delta: { fun: 7, trust: 9, focus: 1, creep: 0 }, tags: ['bold', 'humor', 'risk'] },
        { id: 'B', text: '「自分は刻みますけど、金城さんの池越えは見届けますよ」', delta: { fun: 3, trust: 3, focus: 3, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「ここは冷静に刻むべきです。無謀は避けましょう」と静かに断る', delta: { fun: -3, trust: -4, focus: 2, creep: 6 }, tags: ['safe', 'silence'] },
      ],
    },
    {
      id: 'char_13_5',
      title: 'クラブハウスでの豪遊',
      situation: 'ラウンド後、レストランで金城が「好きなもん頼め！酒もガンガンいけ！」と豪快に振る舞っている。',
      choices: [
        { id: 'A', text: '「遠慮なく！金城さん、乾杯しましょう！今日のベストショットに！」', delta: { fun: 6, trust: 8, focus: 1, creep: 0 }, tags: ['bold', 'alcohol'] },
        { id: 'B', text: '「少しだけいただきます」と控えめに受ける', delta: { fun: 3, trust: 2, focus: 2, creep: 2 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「割り勘にしましょう。おごっていただくのは」と固辞する', delta: { fun: -3, trust: -5, focus: 1, creep: 7 }, tags: ['safe', 'silence'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ14: 医療法人理事長・白石
  // =====================================================================
  14: [
    {
      id: 'char_14_1',
      title: '診察するような視線',
      situation: '白石がこちらのスイングをじっと観察している。',
      choices: [
        { id: 'A', text: '「何かお気づきですか」', delta: { fun: 1, trust: 8, focus: 6, creep: 0 }, tags: ['logic'] },
        { id: 'B', text: '「見ないでくださいよ〜」と盛り上げる', delta: { fun: 2, trust: -2, focus: 0, creep: 6 }, tags: ['hype'] },
        { id: 'C', text: '「白石さんすごいですね！」', delta: { fun: 1, trust: -4, focus: -1, creep: 8 }, tags: ['over_praise'] },
      ],
    },
    {
      id: 'char_14_2',
      title: '健康の話',
      situation: '「ゴルフは健康管理の一環です。体調管理はどうされてますか？」と白石が聞く。',
      choices: [
        { id: 'A', text: '具体的に答える', delta: { fun: 1, trust: 9, focus: 5, creep: 0 }, tags: ['logic', 'ethics'] },
        { id: 'B', text: '「気合です！」', delta: { fun: 2, trust: -3, focus: 0, creep: 6 }, tags: ['hype'] },
        { id: 'C', text: '「白石先生に診てほしいです」', delta: { fun: 2, trust: -5, focus: -1, creep: 10 }, tags: ['over_praise'] },
      ],
    },
    {
      id: 'char_14_3',
      title: 'フォーム分析',
      situation: '白石があなたのスイングを観察し「左肩の可動域がやや狭い。デスクワークが多いでしょう」と診断のように指摘してきた。',
      choices: [
        { id: 'A', text: '「さすがですね。改善にはどんなアプローチが有効ですか？」と論理的に質問する', delta: { fun: 4, trust: 8, focus: 4, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「そうかもしれません。気をつけます」と軽く受け流す', delta: { fun: 1, trust: 2, focus: 2, creep: 1 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「白石先生すごい！まるで魔法みたい！」と大げさに驚く', delta: { fun: 1, trust: -5, focus: -1, creep: 9 }, tags: ['over_praise', 'hype'] },
      ],
    },
    {
      id: 'char_14_4',
      title: 'メンタルと集中力',
      situation: '連続ミスの後、白石が「焦っているね。心拍数が上がっているのが表情でわかる」と冷静に分析してきた。',
      choices: [
        { id: 'A', text: '「集中力を維持するための医学的なアプローチはありますか？」と真摯に教えを請う', delta: { fun: 3, trust: 9, focus: 5, creep: 0 }, tags: ['logic', 'ethics', 'focus'] },
        { id: 'B', text: '「確かに焦ってますね…落ち着きます」と素直に認める', delta: { fun: 2, trust: 4, focus: 3, creep: 0 }, tags: ['honesty', 'neutral'] },
        { id: 'C', text: '「白石先生に見られてると緊張しちゃうんですよ〜！」とおどけて誤魔化す', delta: { fun: 2, trust: -5, focus: -2, creep: 10 }, tags: ['hype', 'over_praise'] },
      ],
    },
    {
      id: 'char_14_5',
      title: '倫理観の問い',
      situation: '同伴者がOBのボールをこっそりフェアウェイに戻しているのを白石と二人で目撃した。白石が「…あなたならどうする？」と静かに聞いた。',
      choices: [
        { id: 'A', text: '「恥をかかせずにアンプレヤブルの選択肢を伝えるのが筋だと思います」と倫理観を示す', delta: { fun: 2, trust: 10, focus: 4, creep: 0 }, tags: ['ethics', 'logic', 'sportsmanship'] },
        { id: 'B', text: '「難しいですね…見なかったことにするのも一つの選択ですかね」', delta: { fun: 1, trust: 1, focus: 0, creep: 3 }, tags: ['neutral', 'silence'] },
        { id: 'C', text: '「楽しいゴルフですし細かいことは気にしなくていいんじゃないですか？」', delta: { fun: 2, trust: -6, focus: -3, creep: 11 }, tags: ['hype', 'over_praise'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ15: 老舗料亭女将・千鶴
  // =====================================================================
  15: [
    {
      id: 'char_15_1',
      title: 'さりげない気配り',
      situation: '千鶴がそっとタオルを差し出してくれた。',
      choices: [
        { id: 'A', text: '「ありがとうございます」と丁寧に受け取る', delta: { fun: 1, trust: 8, focus: 4, creep: 0 }, tags: ['etiquette'] },
        { id: 'B', text: '「お気遣いなく！」と大げさに返す', delta: { fun: 2, trust: -3, focus: 0, creep: 6 }, tags: ['bold'] },
        { id: 'C', text: '「千鶴さんって本当に素敵ですね！」', delta: { fun: 2, trust: -5, focus: -1, creep: 10 }, tags: ['over_praise'] },
      ],
    },
    {
      id: 'char_15_2',
      title: '静かな観察',
      situation: '千鶴が穏やかな表情で、こちらの所作をじっと見ている。',
      choices: [
        { id: 'A', text: '自然体で丁寧にプレーする', delta: { fun: 1, trust: 9, focus: 5, creep: 0 }, tags: ['etiquette', 'honesty'] },
        { id: 'B', text: '「見られてると緊張します」と冗談を言う', delta: { fun: 3, trust: 2, focus: 1, creep: 3 }, tags: ['humor'] },
        { id: 'C', text: '気にして過剰に振る舞う', delta: { fun: 1, trust: -4, focus: -1, creep: 9 }, tags: ['over_praise'] },
      ],
    },
    {
      id: 'char_15_3',
      title: 'グリーン上の作法',
      situation: '千鶴がグリーン上でそっとボールマーカーを置き、丁寧にラインを読んでいる。あなたのマーカーの位置が千鶴のラインにかかっている。',
      choices: [
        { id: 'A', text: '何も言われる前にマーカーをずらす', delta: { fun: 1, trust: 9, focus: 5, creep: 0 }, tags: ['etiquette', 'honesty'] },
        { id: 'B', text: '「マーカー動かしましょうか？」と聞く', delta: { fun: 2, trust: 4, focus: 3, creep: 2 }, tags: ['etiquette'] },
        { id: 'C', text: '「千鶴さんのパット、絶対入りますよ！」と応援する', delta: { fun: 2, trust: -5, focus: -1, creep: 10 }, tags: ['over_praise', 'bold'] },
      ],
    },
    {
      id: 'char_15_4',
      title: '茶店での一服',
      situation: '茶店で休憩中、千鶴が静かにお茶を飲んでいる。「こういうひとときが好きなんどす」と微笑む。',
      choices: [
        { id: 'A', text: '「いい時間ですね」と穏やかに返す', delta: { fun: 2, trust: 8, focus: 4, creep: 0 }, tags: ['honesty', 'etiquette'] },
        { id: 'B', text: '「千鶴さんとご一緒できて光栄です」', delta: { fun: 3, trust: 1, focus: 1, creep: 4 }, tags: ['flattery'] },
        { id: 'C', text: '「早く次のホール行きましょう！」とテンポを急かす', delta: { fun: -1, trust: -6, focus: -2, creep: 9 }, tags: ['bold'] },
      ],
    },
    {
      id: 'char_15_5',
      title: 'バンカーの後始末',
      situation: 'バンカーショットの後、千鶴がこちらのレーキ捌きをさりげなく見ている。',
      choices: [
        { id: 'A', text: '丁寧にバンカーを均してからレーキを戻す', delta: { fun: 1, trust: 10, focus: 5, creep: 0 }, tags: ['etiquette', 'sportsmanship'] },
        { id: 'B', text: 'ざっと均して次に向かう', delta: { fun: 2, trust: -2, focus: 2, creep: 4 }, tags: ['neutral'] },
        { id: 'C', text: '均さずにそのまま出る', delta: { fun: 0, trust: -8, focus: -3, creep: 12 }, tags: ['bold'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ17: IT起業家・篠原
  // =====================================================================
  17: [
    {
      id: 'char_17_1',
      title: 'アプリの企画',
      situation: '篠原がスマホを見せてきた。「新しいアプリの企画、どう思います？」',
      choices: [
        { id: 'A', text: '具体的なフィードバックを出す', delta: { fun: 4, trust: 8, focus: 4, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「すごいですね！」と褒める', delta: { fun: 4, trust: 0, focus: 0, creep: 6 }, tags: ['flattery'] },
        { id: 'C', text: '「よく分かりません」', delta: { fun: -2, trust: -2, focus: 2, creep: 4 }, tags: ['distance'] },
      ],
    },
    {
      id: 'char_17_2',
      title: 'スピード勝負',
      situation: '「残り3ホール、ペース上げて行きましょう！」とテンポアップを提案。',
      choices: [
        { id: 'A', text: '「いいですね！テンポ大事」', delta: { fun: 6, trust: 6, focus: 4, creep: 0 }, tags: ['humor', 'logic'] },
        { id: 'B', text: '「焦らず行きましょう」', delta: { fun: 0, trust: 2, focus: 4, creep: 2 }, tags: ['safe'] },
        { id: 'C', text: '「もっとゆっくり楽しみましょう」', delta: { fun: -4, trust: -4, focus: 2, creep: 6 }, tags: ['silence'] },
      ],
    },
    {
      id: 'char_17_3',
      title: 'コース攻略の最適解',
      situation: '篠原がコースレイアウトを見ながら「このドッグレッグ、刻むのと攻めるの、期待値的にどっちが上だと思います？」と問いかけてきた。',
      choices: [
        { id: 'A', text: '「リスクリワード的に刻んだ方が合理的ですね」と分析する', delta: { fun: 3, trust: 8, focus: 6, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「感覚で攻めましょう！」とノリで返す', delta: { fun: 4, trust: 2, focus: 0, creep: 3 }, tags: ['humor'] },
        { id: 'C', text: '「篠原さんに任せます」と丸投げする', delta: { fun: -1, trust: -5, focus: -2, creep: 7 }, tags: ['silence', 'distance'] },
      ],
    },
    {
      id: 'char_17_4',
      title: 'ガジェットの話',
      situation: '篠原が最新のレーザー距離計を取り出した。「これ、誤差0.1ヤードらしいですよ。試します？」',
      choices: [
        { id: 'A', text: '「いいですね！データ見せてください」と興味を示す', delta: { fun: 5, trust: 7, focus: 5, creep: 0 }, tags: ['logic', 'humor'] },
        { id: 'B', text: '「自分は目測派なんで」と断る', delta: { fun: 0, trust: 2, focus: 3, creep: 2 }, tags: ['safe'] },
        { id: 'C', text: '「…」と特に反応しない', delta: { fun: -3, trust: -6, focus: 0, creep: 8 }, tags: ['silence'] },
      ],
    },
    {
      id: 'char_17_5',
      title: 'ショートカットの誘惑',
      situation: 'パー5のセカンドショット。篠原が「池越え狙えば2オンできますけど、成功率は30%ぐらいですかね」と冷静に分析している。',
      choices: [
        { id: 'A', text: '「30%なら刻みましょう。期待値で勝負です」', delta: { fun: 2, trust: 9, focus: 6, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「面白いですね、攻めてみましょう！」', delta: { fun: 5, trust: 3, focus: 1, creep: 2 }, tags: ['humor', 'risk'] },
        { id: 'C', text: '「篠原さんなら100%入りますよ！」と持ち上げる', delta: { fun: 1, trust: -6, focus: -2, creep: 10 }, tags: ['over_praise'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ18: マーケター・桐生
  // =====================================================================
  18: [
    {
      id: 'char_18_1',
      title: '数字の話',
      situation: '桐生が「最近のKPI、どう管理してますか？」と聞いてきた。',
      choices: [
        { id: 'A', text: '正直に現状の課題を語る', delta: { fun: 2, trust: 10, focus: 4, creep: 0 }, tags: ['honesty', 'logic'] },
        { id: 'B', text: '「全部順調です」と答える', delta: { fun: 2, trust: -6, focus: 0, creep: 8 }, tags: ['hype', 'risk'] },
        { id: 'C', text: '「桐生さんはどうですか？」と返す', delta: { fun: 2, trust: 2, focus: 2, creep: 2 }, tags: ['safe'] },
      ],
    },
    {
      id: 'char_18_2',
      title: '本音と建前',
      situation: '「ビジネスで本音って、どこまで出しますか？」と桐生が静かに聞いた。',
      choices: [
        { id: 'A', text: '「本音で話せる関係が一番です」', delta: { fun: 2, trust: 10, focus: 6, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '「相手次第ですね」', delta: { fun: 2, trust: 2, focus: 2, creep: 2 }, tags: ['logic'] },
        { id: 'C', text: '「桐生さんには本音で話しますよ」', delta: { fun: 0, trust: -4, focus: 0, creep: 8 }, tags: ['flattery'] },
      ],
    },
    {
      id: 'char_18_3',
      title: 'スコアの誤魔化し',
      situation: '前の組のプレーヤーがスコアを誤魔化しているのが見えた。桐生が「…見ました？」と静かに聞いてくる。',
      choices: [
        { id: 'A', text: '「見えましたね。ああいうのは良くないですね」と正直に答える', delta: { fun: 1, trust: 9, focus: 5, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '「まあ、人それぞれですよ」と流す', delta: { fun: 2, trust: 0, focus: 2, creep: 3 }, tags: ['neutral'] },
        { id: 'C', text: '「桐生さんは観察力ありますね！さすが」', delta: { fun: 1, trust: -6, focus: -1, creep: 10 }, tags: ['flattery', 'over_praise'] },
      ],
    },
    {
      id: 'char_18_4',
      title: '競合の噂',
      situation: 'ラウンド中、桐生が「最近、同業他社の評判聞きます？」とさりげなく探りを入れてきた。',
      choices: [
        { id: 'A', text: '「正直、あまり気にしてないです。自分の仕事に集中してます」', delta: { fun: 1, trust: 8, focus: 6, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '「少し聞きますけど、噂は噂ですからね」', delta: { fun: 2, trust: 4, focus: 3, creep: 2 }, tags: ['logic'] },
        { id: 'C', text: '「実は色々聞いてますよ」と情報を出す', delta: { fun: 3, trust: -7, focus: -2, creep: 11 }, tags: ['snitch', 'risk'] },
      ],
    },
    {
      id: 'char_18_5',
      title: 'ミスショットへの反応',
      situation: '桐生がティーショットでチョロした。少し悔しそうな表情を浮かべている。',
      choices: [
        { id: 'A', text: '何も言わず、普通にプレーを続ける', delta: { fun: 1, trust: 8, focus: 5, creep: 0 }, tags: ['honesty', 'etiquette'] },
        { id: 'B', text: '「次がありますよ」と軽く声をかける', delta: { fun: 3, trust: 3, focus: 2, creep: 2 }, tags: ['safe'] },
        { id: 'C', text: '「桐生さんでもそういうことあるんですね！」と驚いてみせる', delta: { fun: 0, trust: -5, focus: -2, creep: 9 }, tags: ['over_praise', 'flattery'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ19: 重工会長・鷹宮
  // =====================================================================
  19: [
    {
      id: 'char_19_1',
      title: '覚悟を問う',
      situation: '鷹宮が無言でこちらを見据えている。「覚悟はあるか」',
      choices: [
        { id: 'A', text: '「はい」と静かに答える', delta: { fun: 0, trust: 10, focus: 6, creep: 0 }, tags: ['honesty', 'serious'] },
        { id: 'B', text: '「もちろんです！」と元気よく', delta: { fun: 4, trust: -2, focus: -2, creep: 4 }, tags: ['hype'] },
        { id: 'C', text: '「覚悟とは…」と哲学的に語る', delta: { fun: 0, trust: 2, focus: 2, creep: 2 }, tags: ['logic'] },
      ],
    },
    {
      id: 'char_19_2',
      title: '後輩への助言',
      situation: '「お前なら、後輩にどう指導する？」と鷹宮が聞いた。',
      choices: [
        { id: 'A', text: '「背中で見せます」', delta: { fun: 2, trust: 8, focus: 6, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
        { id: 'B', text: '「理論的に教えます」', delta: { fun: 2, trust: 4, focus: 4, creep: 0 }, tags: ['logic'] },
        { id: 'C', text: '「鷹宮さんのように」', delta: { fun: 0, trust: -4, focus: -2, creep: 8 }, tags: ['flattery'] },
      ],
    },
    {
      id: 'char_19_3',
      title: '風の中の一打',
      situation: '強風のホール。鷹宮が黙って風を読み、迷いなくクラブを選んでいる。「風に逆らうか、乗るか。お前はどうする」',
      choices: [
        { id: 'A', text: '「風を読んで低い球で攻めます」と冷静に答える', delta: { fun: 1, trust: 9, focus: 6, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
        { id: 'B', text: '「鷹宮さんと同じ選択で」と合わせる', delta: { fun: 2, trust: -2, focus: 1, creep: 5 }, tags: ['flattery'] },
        { id: 'C', text: '「風なんて関係ないっす！」と威勢よく返す', delta: { fun: 3, trust: -6, focus: -3, creep: 9 }, tags: ['hype', 'bold'] },
      ],
    },
    {
      id: 'char_19_4',
      title: '同伴者への態度',
      situation: 'キャディがミスをした。鷹宮がじっとこちらの反応を見ている。',
      choices: [
        { id: 'A', text: '「大丈夫ですよ」とキャディに穏やかに声をかける', delta: { fun: 1, trust: 10, focus: 4, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
        { id: 'B', text: '特に何も言わずプレーを続ける', delta: { fun: 0, trust: 3, focus: 3, creep: 2 }, tags: ['neutral'] },
        { id: 'C', text: 'キャディに不満をぶつける', delta: { fun: -2, trust: -10, focus: -4, creep: 14 }, tags: ['pressure'] },
      ],
    },
    {
      id: 'char_19_5',
      title: '最終ホールの握手',
      situation: '18番ホールを終え、鷹宮が無言で手を差し出した。その目は「今日の全てを見ていた」と語っている。',
      choices: [
        { id: 'A', text: '真っ直ぐ目を見て、力強く握手する', delta: { fun: 2, trust: 10, focus: 5, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
        { id: 'B', text: '「ありがとうございました！勉強になりました」と深く頭を下げる', delta: { fun: 2, trust: 4, focus: 3, creep: 2 }, tags: ['etiquette'] },
        { id: 'C', text: '「鷹宮会長とラウンドできて最高でした！」と興奮気味に言う', delta: { fun: 3, trust: -5, focus: -2, creep: 8 }, tags: ['hype', 'flattery'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ20: 税理士法人代表・早瀬 玲奈
  // =====================================================================
  20: [
    {
      id: 'char_20_1',
      title: '決算書の話',
      situation: '「決算書を見れば会社の本質が分かるんです」と早瀬が静かに語る。',
      choices: [
        { id: 'A', text: '「具体的にはどんな指標を見ますか？」', delta: { fun: 2, trust: 9, focus: 6, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「さすが早瀬さん！」と褒める', delta: { fun: 2, trust: -3, focus: 0, creep: 8 }, tags: ['flattery'] },
        { id: 'C', text: '「数字って苦手で…」と笑う', delta: { fun: 3, trust: -6, focus: -2, creep: 6 }, tags: ['humor'] },
      ],
    },
    {
      id: 'char_20_2',
      title: '信頼の定義',
      situation: '「信頼って、結局は数字の積み重ねだと思いません？」と真剣に聞いてくる。',
      choices: [
        { id: 'A', text: '「そう思います。実績がすべてですよね」', delta: { fun: 1, trust: 8, focus: 6, creep: 0 }, tags: ['honesty', 'logic'] },
        { id: 'B', text: '「人間性も大事ですよ」と共感する', delta: { fun: 3, trust: 4, focus: 2, creep: 2 }, tags: ['ethics'] },
        { id: 'C', text: '「難しい話ですね」とごまかす', delta: { fun: 0, trust: -6, focus: -2, creep: 8 }, tags: ['distance'] },
      ],
    },
    {
      id: 'char_20_3',
      title: 'スコア管理の流儀',
      situation: '早瀬がスコアカードに一打ごと正確に記入している。「スコアって経営と同じで、正確な記録がないと改善できないんですよ」',
      choices: [
        { id: 'A', text: '「おっしゃる通りです。自分も正確に記録します」', delta: { fun: 1, trust: 9, focus: 6, creep: 0 }, tags: ['honesty', 'logic'] },
        { id: 'B', text: '「大体の感覚で覚えてます」と軽く返す', delta: { fun: 2, trust: -3, focus: 0, creep: 5 }, tags: ['humor'] },
        { id: 'C', text: '「早瀬さんってほんと几帳面ですよね！」', delta: { fun: 1, trust: -5, focus: -2, creep: 9 }, tags: ['flattery', 'over_praise'] },
      ],
    },
    {
      id: 'char_20_4',
      title: 'クラブ選択の根拠',
      situation: '残り150ヤード。早瀬が「この距離、何番で打ちますか？根拠も聞かせてください」と静かに問う。',
      choices: [
        { id: 'A', text: '「7番です。風と傾斜を考慮して、実質155ヤード計算です」', delta: { fun: 2, trust: 10, focus: 6, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「なんとなく7番ですかね」と曖昧に答える', delta: { fun: 1, trust: -3, focus: 1, creep: 5 }, tags: ['neutral'] },
        { id: 'C', text: '「早瀬さんはどう思いますか？」と丸投げする', delta: { fun: 0, trust: -6, focus: -2, creep: 8 }, tags: ['distance'] },
      ],
    },
    {
      id: 'char_20_5',
      title: '投資とリスクの話',
      situation: 'カート移動中、早瀬が「ゴルフのコースマネジメントと資産運用って似てますよね。リスクの取り方に性格が出る」と呟いた。',
      choices: [
        { id: 'A', text: '「確かに。期待値とリスク許容度のバランスですよね」', delta: { fun: 2, trust: 8, focus: 5, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「自分はどっちも攻め派です」と笑う', delta: { fun: 4, trust: 2, focus: 1, creep: 3 }, tags: ['humor', 'bold'] },
        { id: 'C', text: '「早瀬さんの考え、すごく深いですね！」', delta: { fun: 1, trust: -5, focus: -1, creep: 9 }, tags: ['flattery', 'hype'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ21: 美容クリニック経営・ミツキ（立花 美月）
  // =====================================================================
  21: [
    {
      id: 'char_21_1',
      title: 'SNSの話',
      situation: '「あ、この景色映える！撮っていいですか？」と笑顔でスマホを取り出す。',
      choices: [
        { id: 'A', text: '「一緒に撮りましょう！」とノる', delta: { fun: 8, trust: 5, focus: -2, creep: 2 }, tags: ['humor', 'hype'] },
        { id: 'B', text: '「いい景色ですよね」と共感する', delta: { fun: 4, trust: 6, focus: 2, creep: 0 }, tags: ['honesty'] },
        { id: 'C', text: '「集中しましょう」と窘める', delta: { fun: -4, trust: -4, focus: 6, creep: 8 }, tags: ['serious'] },
      ],
    },
    {
      id: 'char_21_2',
      title: '経営の悩み',
      situation: '「スタッフとの距離感って難しいですよね…」とふと弱さを見せる。',
      choices: [
        { id: 'A', text: '「わかります。僕もそう思います」', delta: { fun: 2, trust: 8, focus: 4, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '「ミツキさんなら大丈夫ですよ！」', delta: { fun: 4, trust: -2, focus: 0, creep: 6 }, tags: ['flattery', 'over_praise'] },
        { id: 'C', text: '「ゴルフの話しましょう」と話題を変える', delta: { fun: -2, trust: -6, focus: 2, creep: 8 }, tags: ['distance'] },
      ],
    },
    {
      id: 'char_21_3',
      title: '患者さんの話',
      situation: '「この前、施術後に泣いて喜んでくれた患者さんがいて…」とミツキが嬉しそうに話し始めた。',
      choices: [
        { id: 'A', text: '「それは嬉しいですね。やりがいがありますね」と共感する', delta: { fun: 3, trust: 8, focus: 4, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '「美容医療って儲かるんですか？」とビジネスの話に切り替える', delta: { fun: -1, trust: -3, focus: 2, creep: 5 }, tags: ['logic'] },
        { id: 'C', text: '「ミツキさんの腕がいいからですよ！天才！」', delta: { fun: 2, trust: -5, focus: -1, creep: 10 }, tags: ['over_praise', 'flattery'] },
      ],
    },
    {
      id: 'char_21_4',
      title: 'ナイスショットの瞬間',
      situation: 'ミツキがベストショットを打った。「やった！見ました？」と目を輝かせている。',
      choices: [
        { id: 'A', text: '「見ましたよ！完璧でしたね」と素直に称える', delta: { fun: 5, trust: 7, focus: 3, creep: 0 }, tags: ['humor', 'honesty'] },
        { id: 'B', text: '「フォームが良かったですね。スイング安定してます」と具体的に褒める', delta: { fun: 3, trust: 5, focus: 4, creep: 1 }, tags: ['logic'] },
        { id: 'C', text: '「もう毎回こんなの打ってくださいよ！プロ級！」と騒ぐ', delta: { fun: 3, trust: -4, focus: -2, creep: 9 }, tags: ['over_praise', 'flattery'] },
      ],
    },
    {
      id: 'char_21_5',
      title: 'カート内の沈黙',
      situation: 'カートで移動中、ミツキが珍しく黙っている。何か考え込んでいるようだ。',
      choices: [
        { id: 'A', text: '無理に話しかけず、穏やかに景色を見ている', delta: { fun: 2, trust: 7, focus: 4, creep: 0 }, tags: ['ethics', 'honesty'] },
        { id: 'B', text: '「何かあったら言ってくださいね」と軽く声をかける', delta: { fun: 3, trust: 5, focus: 2, creep: 2 }, tags: ['humor'] },
        { id: 'C', text: '「ミツキさん元気ないですね！笑顔笑顔！」と無理に盛り上げる', delta: { fun: -1, trust: -6, focus: -2, creep: 11 }, tags: ['over_praise', 'pressure'] },
      ],
    },
  ],

  // =====================================================================
  // キャラ16: 銀座 ハジメ（弁護士法人エース 代表弁護士・ラスボス）本文中の呼称は「ハジメ」
  // =====================================================================
  16: [
    {
      id: 'char_16_1',
      title: '媚びは効かない',
      situation: 'ハジメが無表情でこちらを見ている。',
      choices: [
        { id: 'A', text: '過剰に褒める', delta: { fun: 1, trust: -12, focus: -4, creep: 14 }, tags: ['over_praise'] },
        { id: 'B', text: '静かに敬意を示す', delta: { fun: 0, trust: 12, focus: 8, creep: 0 }, tags: ['ethics', 'silence'] },
        { id: 'C', text: '軽口を叩く', delta: { fun: 3, trust: -8, focus: -2, creep: 12 }, tags: ['hype'] },
      ],
    },
    {
      id: 'char_16_2',
      title: '切り札の判断',
      situation: '「最後のホール、攻めますか？」',
      choices: [
        { id: 'A', text: '安全策', delta: { fun: 0, trust: 6, focus: 10, creep: 0 }, tags: ['focus'] },
        { id: 'B', text: '攻める', delta: { fun: 2, trust: 4, focus: 3, creep: 3 }, tags: ['risk'] },
        { id: 'C', text: '相手に委ねる', delta: { fun: 0, trust: -6, focus: -2, creep: 9 }, tags: ['distance'] },
      ],
    },
    {
      id: 'char_16_3',
      title: '昔のコースの話',
      situation: 'ハジメが懐かしそうに言った。「このコース、昔よく来たんだよ。あの頃は仕事ばっかりで…ゴルフの楽しさなんて分かってなかった」',
      choices: [
        { id: 'A', text: '「今は楽しめてますか？」と穏やかに聞く', delta: { fun: 4, trust: 6, focus: 3, creep: 0 }, tags: ['honesty', 'humor'] },
        { id: 'B', text: '「仕事も大事ですけどね」と返す', delta: { fun: 2, trust: 3, focus: 2, creep: 1 }, tags: ['logic'] },
        { id: 'C', text: '「ハジメさんの過去、興味あります！」と食いつく', delta: { fun: 1, trust: -2, focus: 0, creep: 4 }, tags: ['hype'] },
      ],
    },
    {
      id: 'char_16_4',
      title: 'ミスへの向き合い方',
      situation: 'こちらがOBを打った。ハジメが隣で「ドンマイ」と言った後、静かにこう聞いた。「…で、次どうする？」',
      choices: [
        { id: 'A', text: '「切り替えて、安全に刻みます」と冷静に答える', delta: { fun: 2, trust: 7, focus: 6, creep: 0 }, tags: ['honesty', 'focus'] },
        { id: 'B', text: '「もう一回同じ球打ちます！」と強気に宣言', delta: { fun: 4, trust: 4, focus: 2, creep: 1 }, tags: ['bold', 'humor'] },
        { id: 'C', text: '「もうダメです…」と落ち込む', delta: { fun: -1, trust: 0, focus: -1, creep: 3 }, tags: ['safe'] },
      ],
    },
    {
      id: 'char_16_5',
      title: 'ゴルフの本質',
      situation: '最終ホールのティーグラウンド。ハジメが空を見上げて言った。「ゴルフって結局、自分との勝負だよな。お前はどう思う？」',
      choices: [
        { id: 'A', text: '「そう思います。だから面白いんですよね」', delta: { fun: 5, trust: 7, focus: 5, creep: 0 }, tags: ['honesty', 'humor'] },
        { id: 'B', text: '「自分はまだ他人の目が気になります」と正直に言う', delta: { fun: 2, trust: 5, focus: 3, creep: 0 }, tags: ['honesty'] },
        { id: 'C', text: '「深いですね！名言です！」と持ち上げる', delta: { fun: 1, trust: -1, focus: 0, creep: 3 }, tags: ['over_praise'] },
      ],
    },
  ],
};
