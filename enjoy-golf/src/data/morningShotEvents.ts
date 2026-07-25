import { MorningShotEvent, MorningShotResult } from '../types';

// =====================================================================
// 朝イチのショット イベントデータ
// =====================================================================

// ===== キャラ1: 銀行マン・田中 =====
const tanakaMorningShotEvent: MorningShotEvent = {
  characterId: 1,
  variants: [
    {
      shotResult: 'great',
      situation: '田中は深く一礼してから静かにテイクバック——ナイスショット。礼節が漂う一打。',
      choices: [
        {
          id: 'A',
          text: '「素晴らしいショットですね。フォームが美しい」',
          delta: { trust: 4, fun: 2, creep: 0 },
          tags: ['flattery', 'etiquette'],
        },
        {
          id: 'B',
          text: '静かに拍手を送る',
          delta: { trust: 6, fun: 0, creep: 0 },
          tags: ['etiquette', 'silence'],
        },
        {
          id: 'C',
          text: '「いいプレッシャーになります！」と笑顔で言う',
          delta: { trust: 2, fun: 4, creep: 2 },
          tags: ['humor', 'bold'],
        },
      ],
    },
    {
      shotResult: 'normal',
      situation: '田中はフォームを確認しながら丁寧に振り抜いた。可もなく不可もない出だし。',
      choices: [
        {
          id: 'A',
          text: '「安定感がありますね」と評価する',
          delta: { trust: 4, fun: 1, creep: 0 },
          tags: ['analysis_praise', 'etiquette'],
        },
        {
          id: 'B',
          text: '「後半に期待しましょう」と前向きに言う',
          delta: { trust: 3, fun: 3, creep: 0 },
          tags: ['humor', 'safe'],
        },
        {
          id: 'C',
          text: '何も言わずに自分の準備をする',
          delta: { trust: 2, fun: 0, creep: 0 },
          tags: ['silence', 'focus'],
        },
      ],
    },
    {
      shotResult: 'ob',
      situation: '田中が慎重に構えた瞬間——シャンク。「...失礼しました」と静かに頭を下げた。',
      choices: [
        {
          id: 'A',
          text: '「朝イチはよくあります。気にしないでください」',
          delta: { trust: 6, fun: 2, creep: 0 },
          tags: ['sportsmanship', 'safe'],
        },
        {
          id: 'B',
          text: '素知らぬ顔で遠くを見る',
          delta: { trust: 3, fun: 0, creep: 0 },
          tags: ['silence', 'distance'],
        },
        {
          id: 'C',
          text: '「自分も緊張していますよ！」と場を和ませる',
          delta: { trust: 4, fun: 5, creep: 2 },
          tags: ['humor', 'over_support'],
        },
      ],
    },
  ],
};

// ===== キャラ2: 体育会系社長・鬼塚 =====
const onizukaMorningShotEvent: MorningShotEvent = {
  characterId: 2,
  variants: [
    {
      shotResult: 'great',
      situation: '「よっしゃあ！」鬼塚の気合一閃、ボールは豪快にフェアウェイへ弾け飛んだ。',
      choices: [
        {
          id: 'A',
          text: '「最高です！今日は期待できますね！」と盛り上がる',
          delta: { fun: 6, trust: 4, creep: 0 },
          tags: ['hype', 'kiai'],
        },
        {
          id: 'B',
          text: '「さすが！気合が違う」とシンプルに称える',
          delta: { trust: 5, fun: 3, creep: 0 },
          tags: ['flattery', 'sportsmanship'],
        },
        {
          id: 'C',
          text: '拳を握って「負けてられない！」と気合を入れる',
          delta: { fun: 5, trust: 3, creep: 0 },
          tags: ['kiai', 'fair_compete'],
        },
      ],
    },
    {
      shotResult: 'normal',
      situation: '気合十分で振り抜いたが、ボールはやや右へ。「まあ悪くねえ！」',
      choices: [
        {
          id: 'A',
          text: '「フェアウェイキープ！完璧じゃないですか」と励ます',
          delta: { fun: 4, trust: 4, creep: 0 },
          tags: ['hype', 'over_support'],
        },
        {
          id: 'B',
          text: '「朝イチの一打、大事ですよね」と共感する',
          delta: { fun: 3, trust: 4, creep: 0 },
          tags: ['sportsmanship', 'safe'],
        },
        {
          id: 'C',
          text: '「午後に向けて調整していきましょう！」と前向きに',
          delta: { fun: 4, trust: 3, creep: 0 },
          tags: ['humor', 'bold'],
        },
      ],
    },
    {
      shotResult: 'ob',
      situation: 'フルスイングが空を切り裂き、ボールは右林へ消えた。「うおっ！」しばし沈黙。',
      choices: [
        {
          id: 'A',
          text: '「朝イチはみんなそんなもんですよ！」と笑い飛ばす',
          delta: { fun: 6, trust: 4, creep: 0 },
          tags: ['humor', 'sportsmanship'],
        },
        {
          id: 'B',
          text: '黙って自分の準備に集中する',
          delta: { trust: 3, fun: 0, creep: 0 },
          tags: ['silence', 'focus'],
        },
        {
          id: 'C',
          text: '「ペナルティが…大変でしたね」と真面目に言う',
          delta: { trust: -2, fun: -2, creep: 6 },
          tags: ['serious', 'distance'],
        },
      ],
    },
  ],
};

// =====================================================================
// 以下、キャラ3〜21（2026-07-25 追加）
//
// 朝イチのショットは全ラウンドのホール1で必ず発生し、ラウンドの第一印象を作る。
// 以前は田中・鬼塚以外の19キャラが汎用文（「相手は見事なショットを放った」）に
// フォールバックしていたため、全員分を書き起こした。
//
// 執筆ルール:
//  - 地の文は callName で呼ぶ（「相手」と書かない）
//  - 相手のセリフは speechStyle の一人称・語尾に合わせる
//  - 3択のうち最も効く選択肢の位置はキャラ・状況ごとに散らす（A固定にしない）
//  - 外し選択肢は、そのキャラの hatesTags を踏む形で作る
//    （characters.ts の reactions と likes/hates が加算されるため、tag選びが効く）
//  - 選択肢ラベルにナレーターの評価（「〜と的外れなことを言う」等）を混ぜない
// =====================================================================

// ===== キャラ3: 二代目オーナー・坊っちゃん =====
const bocchanMorningShotEvent: MorningShotEvent = {
  characterId: 3,
  variants: [
    {
      shotResult: 'great',
      situation: '坊っちゃんののんびりしたスイングから、驚くほど素直な球が伸びた。「あれ、今のよかった？」',
      choices: [
        { id: 'A', text: '「完璧でした！朝イチであれは気持ちいいですね」', delta: { fun: 5, trust: 4, creep: 0 }, tags: ['humor'] },
        { id: 'B', text: '「もう今日は優勝ですよ」と大きく持ち上げる', delta: { fun: 4, trust: 1, creep: 2 }, tags: ['flattery'] },
        { id: 'C', text: '「フェースの向きが最後まで安定してましたね」と技術的に返す', delta: { trust: 1, fun: -1, creep: 2 }, tags: ['logic', 'serious'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '坊っちゃんの球は右へ流れたが、フェアウェイには残った。「まあ、こんなもんだよね」',
      choices: [
        { id: 'A', text: '「こんなもんですよ」と軽く受け流す', delta: { trust: 2, fun: 1, creep: 0 }, tags: ['neutral'] },
        { id: 'B', text: '「フェアウェイなら十分です。楽しくいきましょう」', delta: { fun: 5, trust: 4, creep: 0 }, tags: ['humor'] },
        { id: 'C', text: '「スライス、直せますよ。グリップから見ましょうか」', delta: { trust: 0, fun: -2, creep: 3 }, tags: ['logic', 'serious'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '坊っちゃんの第一打は大きく右へ消えた。「うわ、いきなりやっちゃった」と笑っている。',
      choices: [
        { id: 'A', text: '「2打罰ですね。次は落ち着いていきましょう」', delta: { trust: -1, fun: -3, creep: 4 }, tags: ['serious', 'logic'] },
        { id: 'B', text: '「坊っちゃんならすぐ取り返せますよ」', delta: { fun: 3, trust: 2, creep: 1 }, tags: ['flattery'] },
        { id: 'C', text: '「朝イチはノーカンでいきましょう」と一緒に笑う', delta: { fun: 6, trust: 4, creep: 0 }, tags: ['humor'] },
      ],
    },
  ],
};

// ===== キャラ4: 寡黙なプロ・黒田 =====
const kurodaMorningShotEvent: MorningShotEvent = {
  characterId: 4,
  variants: [
    {
      shotResult: 'great',
      situation: '黒田は素振り一回だけで構え、フェードがピンポイントで落ちた。何も言わずクラブを納めた。',
      choices: [
        { id: 'A', text: '「今の、狙って曲げましたよね」と一言だけ返す', delta: { trust: 5, fun: 1, creep: 0 }, tags: ['honesty', 'analysis_praise'] },
        { id: 'B', text: '何も言わず、同じ場所を見つめる', delta: { trust: 4, fun: 0, creep: 0 }, tags: ['silence', 'serious'] },
        { id: 'C', text: '「さすがです！やっぱりプロは違いますね！」', delta: { trust: -2, fun: 2, creep: 4 }, tags: ['flattery', 'over_praise'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '黒田の球はフェアウェイ左。悪くはないが、本人は少し眉を寄せた。',
      choices: [
        { id: 'A', text: '「十分な当たりだと思いますが」と正直に言う', delta: { trust: 4, fun: 1, creep: 0 }, tags: ['honesty'] },
        { id: 'B', text: '「完璧じゃないと納得しないんですね」と踏み込む', delta: { trust: 5, fun: 2, creep: 0 }, tags: ['honesty', 'serious'] },
        { id: 'C', text: '「黒田さんにしては珍しいですね！」と明るく言う', delta: { trust: -1, fun: 1, creep: 3 }, tags: ['flattery', 'hype'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '黒田の球が右へ切れて林に消えた。「…読み違えた」低く一言だけ漏らした。',
      choices: [
        { id: 'A', text: '「黒田さんでもそうなるんですね」と驚いてみせる', delta: { trust: -3, fun: 1, creep: 4 }, tags: ['flattery', 'over_praise'] },
        { id: 'B', text: '何も言わず、次のクラブを選ぶ', delta: { trust: 4, fun: 0, creep: 0 }, tags: ['silence', 'focus'] },
        { id: 'C', text: '「風、途中で変わりましたね」と事実だけ述べる', delta: { trust: 5, fun: 0, creep: 0 }, tags: ['honesty', 'logic'] },
      ],
    },
  ],
};

// ===== キャラ5: 外資エリート・スミス =====
const smithMorningShotEvent: MorningShotEvent = {
  characterId: 5,
  variants: [
    {
      shotResult: 'great',
      situation: 'スミスは軽く素振りをしてから「OK, let\'s go.」——低いフェードがフェアウェイを捉えた。',
      choices: [
        { id: 'A', text: '「Nice shot! いい入り方ですね」と素直に称える', delta: { trust: 4, fun: 3, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
        { id: 'B', text: '「今日は勝てそうにないですね」と笑う', delta: { trust: 3, fun: 4, creep: 0 }, tags: ['humor'] },
        { id: 'C', text: '「スミスさんに全部教わりたいです」と持ち上げる', delta: { trust: -2, fun: 1, creep: 4 }, tags: ['flattery', 'over_support'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: 'スミスの一打はフェアウェイ右端。「Hmm, acceptable.」と肩をすくめた。',
      choices: [
        { id: 'A', text: '「acceptable、いい表現ですね」と笑って返す', delta: { trust: 3, fun: 4, creep: 0 }, tags: ['humor'] },
        { id: 'B', text: '「十分です。フェアウェイはフェアウェイですから」', delta: { trust: 5, fun: 2, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
        { id: 'C', text: '「完璧でしたよ！最高の当たりです！」と大げさに', delta: { trust: -2, fun: 1, creep: 4 }, tags: ['flattery', 'over_praise'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: 'スミスの球が左のOBゾーンへ。彼はすぐに「That\'s out. One penalty.」と自分で申告した。',
      choices: [
        { id: 'A', text: '「今のはセーフでもいいんじゃないですか」と譲る', delta: { trust: -6, fun: 1, creep: 8 }, tags: ['cheat_score'] },
        { id: 'B', text: '「朝イチですし、気にせずいきましょう」と流す', delta: { trust: 2, fun: 2, creep: 1 }, tags: ['safe', 'humor'] },
        { id: 'C', text: '「では1打罰で。ルール通りいきましょう」と受ける', delta: { trust: 6, fun: 1, creep: 0 }, tags: ['honesty', 'sportsmanship', 'ethics'] },
      ],
    },
  ],
};

// ===== キャラ6: 自己啓発社長・光山 =====
const mitsuyamaMorningShotEvent: MorningShotEvent = {
  characterId: 6,
  variants: [
    {
      shotResult: 'great',
      situation: '光山は空に向かって一礼してから打った。ボールは高く上がってフェアウェイ中央へ。「ありがとう、この一打！」',
      choices: [
        { id: 'A', text: '「今のは感謝が届きましたね」と全力で乗る', delta: { fun: 6, trust: 5, creep: 0 }, tags: ['hype', 'humor'] },
        { id: 'B', text: '「…いいショットでした」と静かに返す', delta: { fun: -3, trust: 0, creep: 3 }, tags: ['silence', 'serious'] },
        { id: 'C', text: '「弾道が高いのは打ち出し角が合ってるからですね」', delta: { fun: -1, trust: 2, creep: 2 }, tags: ['logic', 'analysis_praise'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '光山の球はまずまずの当たり。「これも学びです！全部意味がある！」と嬉しそうだ。',
      choices: [
        { id: 'A', text: '「次の一打も楽しみですね」と明るく続ける', delta: { fun: 4, trust: 3, creep: 0 }, tags: ['humor', 'ride_the_mood'] },
        { id: 'B', text: '「学びを拾える人が伸びるんですよね」と乗る', delta: { fun: 5, trust: 4, creep: 0 }, tags: ['hype', 'humor'] },
        { id: 'C', text: '「まずまずですね」と落ち着いて返す', delta: { fun: -2, trust: 1, creep: 2 }, tags: ['neutral', 'serious'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '光山の第一打は右へ大きく曲がってOB。それでも「これも必要な経験！」と拳を握っている。',
      choices: [
        { id: 'A', text: '「…OBはOBですよ。2打罰です」と現実を伝える', delta: { fun: -4, trust: -2, creep: 5 }, tags: ['serious', 'logic'] },
        { id: 'B', text: '「その切り替えの速さ、本当にすごいです」', delta: { fun: 5, trust: 4, creep: 1 }, tags: ['flattery', 'hype'] },
        { id: 'C', text: '「じゃあここからが本番ですね」と一緒に燃える', delta: { fun: 6, trust: 4, creep: 0 }, tags: ['hype', 'humor', 'adversity'] },
      ],
    },
  ],
};

// ===== キャラ7: 昭和の重鎮・巌 =====
const iwaoMorningShotEvent: MorningShotEvent = {
  characterId: 7,
  variants: [
    {
      shotResult: 'great',
      situation: '巌はティーグラウンドで深く一礼し、無駄のないスイングで真っ直ぐ飛ばした。「うむ」',
      choices: [
        { id: 'A', text: '同じように一礼してから「お見事です」と述べる', delta: { trust: 6, fun: 1, creep: 0 }, tags: ['etiquette', 'honesty'] },
        { id: 'B', text: '「ナイスショット！いきましょう！」と声を張る', delta: { trust: -2, fun: 1, creep: 4 }, tags: ['bold', 'hype'] },
        { id: 'C', text: '「あの構えは長年の積み重ねですね」と感じ入る', delta: { trust: 4, fun: 2, creep: 0 }, tags: ['flattery', 'etiquette'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '巌の球はストレートだが飛距離は控えめ。「これでいい。曲がらんのが一番だ」',
      choices: [
        { id: 'A', text: '「もっと飛ばせますよ！攻めていきましょう！」', delta: { trust: -3, fun: 0, creep: 5 }, tags: ['bold', 'hype'] },
        { id: 'B', text: '「曲がらないのが一番、その通りですね」と頷く', delta: { trust: 5, fun: 1, creep: 0 }, tags: ['honesty', 'etiquette'] },
        { id: 'C', text: '「飛距離より方向、勉強になります」と姿勢を正す', delta: { trust: 4, fun: 1, creep: 0 }, tags: ['etiquette', 'self_reflect'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '巌の一打が右へ切れて林へ。彼は表情を変えず、静かにティーを拾った。',
      choices: [
        { id: 'A', text: '「ドンマイです！次いきましょう！」と明るく言う', delta: { trust: -2, fun: 1, creep: 4 }, tags: ['hype', 'bold'] },
        { id: 'B', text: '「朝は誰でも体が回りませんから」とフォローする', delta: { trust: 3, fun: 1, creep: 0 }, tags: ['safe', 'etiquette'] },
        { id: 'C', text: '黙って一礼し、何も言わずに待つ', delta: { trust: 5, fun: 0, creep: 0 }, tags: ['etiquette', 'silence'] },
      ],
    },
  ],
};

// ===== キャラ8: テック社長・中村 =====
const nakamuraMorningShotEvent: MorningShotEvent = {
  characterId: 8,
  variants: [
    {
      shotResult: 'great',
      situation: '中村はスマホの風速表示を確認してから打った。狙い通りの直球。「うん、計算通り」',
      choices: [
        { id: 'A', text: '「風速と番手、どう合わせたんですか」と踏み込む', delta: { trust: 5, fun: 3, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「中村さん天才ですね！」と持ち上げる', delta: { trust: -2, fun: 1, creep: 4 }, tags: ['flattery', 'hype'] },
        { id: 'C', text: '「気持ちいい当たりでしたね」と素直に言う', delta: { trust: 3, fun: 2, creep: 0 }, tags: ['honesty'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '中村の球はフェアウェイだが想定より手前。「…湿度を入れ忘れたな」と呟いた。',
      choices: [
        { id: 'A', text: '「数字より気合ですよ」と盛り上げる', delta: { trust: -2, fun: 1, creep: 3 }, tags: ['hype', 'kiai'] },
        { id: 'B', text: '「朝の芝は湿ってますから、ランは出ませんよね」', delta: { trust: 5, fun: 3, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'C', text: '「そこまで計算するんですか」と素直に驚く', delta: { trust: 3, fun: 3, creep: 0 }, tags: ['honesty', 'analysis_praise'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '中村の第一打が左へ大きく外れた。「データ通りにいかないから面白い、と言いたいところですが」と苦笑。',
      choices: [
        { id: 'A', text: '「気にせず次いきましょう」と勢いで流す', delta: { trust: 0, fun: 1, creep: 2 }, tags: ['hype'] },
        { id: 'B', text: '「原因、心当たりありますか」と真面目に聞く', delta: { trust: 4, fun: 1, creep: 0 }, tags: ['logic', 'serious'] },
        { id: 'C', text: '「1打目のサンプル1件では何も言えませんね」と返す', delta: { trust: 5, fun: 4, creep: 0 }, tags: ['logic', 'humor'] },
      ],
    },
  ],
};

// ===== キャラ9: 試し屋・佐藤 =====
const satoMorningShotEvent: MorningShotEvent = {
  characterId: 9,
  variants: [
    {
      shotResult: 'great',
      situation: '佐藤の第一打は完璧だった。打った直後、彼はこちらを見た。「…で、どう思う？」',
      choices: [
        { id: 'A', text: '「素直に、羨ましいです」と正直に言う', delta: { trust: 6, fun: 2, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '「完璧です！さすが佐藤さん！」と褒める', delta: { trust: -3, fun: 1, creep: 5 }, tags: ['flattery'] },
        { id: 'C', text: '「試されてる気がしますけど、いい球でした」と笑う', delta: { trust: 5, fun: 4, creep: 0 }, tags: ['honesty', 'humor'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '佐藤の球はフックしてラフの手前。「今の、正直どう見えた？」とすぐ聞いてきた。',
      choices: [
        { id: 'A', text: '「自分には分かりません」とはぐらかす', delta: { trust: -1, fun: -1, creep: 3 }, tags: ['distance', 'silence'] },
        { id: 'B', text: '「少し引っかかってました」と見えた通りに答える', delta: { trust: 6, fun: 1, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'C', text: '「いい球だと思いましたよ」と無難に返す', delta: { trust: -2, fun: 0, creep: 4 }, tags: ['flattery', 'safe'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '佐藤の一打がOBゾーンへ消えた。彼は笑いながら「これも狙い通りって言ったら信じる？」と聞いてきた。',
      choices: [
        { id: 'A', text: '「佐藤さんならあり得ますね」と話を合わせる', delta: { trust: -4, fun: 1, creep: 5 }, tags: ['flattery'] },
        { id: 'B', text: '「…どうでしょうね」と曖昧に濁す', delta: { trust: -2, fun: 0, creep: 3 }, tags: ['distance'] },
        { id: 'C', text: '「信じません」と即答する', delta: { trust: 6, fun: 4, creep: 0 }, tags: ['honesty', 'humor', 'ethics'] },
      ],
    },
  ],
};

// ===== キャラ10: 褒め殺し王・ナイス松本 =====
const matsumotoMorningShotEvent: MorningShotEvent = {
  characterId: 10,
  variants: [
    {
      shotResult: 'great',
      situation: '松本は自分の一打に自分で「ナァァイスショット！」と叫んだ。実際、見事な当たりだった。',
      choices: [
        { id: 'A', text: '「ナイスショット！」と全力で被せる', delta: { fun: 6, trust: 4, creep: 0 }, tags: ['humor', 'over_praise'] },
        { id: 'B', text: '「本当にいい球でした」と落ち着いて言う', delta: { fun: -2, trust: 1, creep: 2 }, tags: ['honesty', 'serious'] },
        { id: 'C', text: '「自分で言うのが早すぎます」と笑ってツッコむ', delta: { fun: 5, trust: 4, creep: 0 }, tags: ['humor'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '松本の球は前に飛んだだけ。それでも「ナイス！ナイスですよ僕！」と自賛している。',
      choices: [
        { id: 'A', text: '「今のはさすがにナイスじゃないですよ」と笑う', delta: { fun: 5, trust: 4, creep: 0 }, tags: ['humor'] },
        { id: 'B', text: '「ナイスショット！」と合わせる', delta: { fun: 5, trust: 3, creep: 1 }, tags: ['over_praise', 'humor'] },
        { id: 'C', text: '「…前には飛びましたね」と静かに言う', delta: { fun: -4, trust: -1, creep: 4 }, tags: ['silence', 'serious'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '松本の第一打が大きく右へ。一瞬の沈黙のあと「…ナイスOB？」と本人が呟いた。',
      choices: [
        { id: 'A', text: '「ナイスです！全部ナイスです！」と勢いで押す', delta: { fun: 4, trust: 2, creep: 2 }, tags: ['over_praise', 'hype'] },
        { id: 'B', text: '無言で目をそらす', delta: { fun: -5, trust: -3, creep: 5 }, tags: ['silence', 'distance'] },
        { id: 'C', text: '「ナイスOB、初めて聞きました」と笑い返す', delta: { fun: 6, trust: 5, creep: 0 }, tags: ['humor'] },
      ],
    },
  ],
};

// ===== キャラ11: 政界フィクサー・大門 =====
const daimonMorningShotEvent: MorningShotEvent = {
  characterId: 11,
  variants: [
    {
      shotResult: 'great',
      situation: '大門は無言で構え、無言で振り抜いた。球はフェアウェイへ。「…さて、始めようか」',
      choices: [
        { id: 'A', text: '「いい入り方ですね。こちらも本気でいきます」', delta: { trust: 5, fun: 3, creep: 0 }, tags: ['bold', 'fair_compete'] },
        { id: 'B', text: '「大門さんのお手並み、拝見します」と控える', delta: { trust: 2, fun: 1, creep: 1 }, tags: ['safe', 'etiquette'] },
        { id: 'C', text: '「今日は何でもお手伝いしますので」と申し出る', delta: { trust: -4, fun: 0, creep: 6 }, tags: ['over_support', 'flattery'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '大門の球は右へ流れたが問題ない位置。彼はこちらの表情を確かめるように見た。',
      choices: [
        { id: 'A', text: '「完璧でした」と即座に言う', delta: { trust: -3, fun: 1, creep: 5 }, tags: ['flattery', 'over_praise'] },
        { id: 'B', text: '「右に出ましたね。次の狙いが難しくなりますか」と読む', delta: { trust: 5, fun: 2, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'C', text: '何も言わず、自分のティーアップに移る', delta: { trust: 3, fun: 0, creep: 0 }, tags: ['silence', 'distance'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '大門の第一打がOBラインを越えた。彼はゆっくりこちらを向いた。「…見なかったことにするか？」',
      choices: [
        { id: 'A', text: '「見てませんよ、何も」と合わせる', delta: { trust: -6, fun: 1, creep: 8 }, tags: ['cheat_score', 'over_support'] },
        { id: 'B', text: '黙って目を逸らす', delta: { trust: 0, fun: -1, creep: 3 }, tags: ['silence', 'neutral'] },
        { id: 'C', text: '「1打罰で打ち直しましょう。それが早いです」と返す', delta: { trust: 5, fun: 1, creep: 0 }, tags: ['honesty', 'logic', 'sportsmanship'] },
      ],
    },
  ],
};

// ===== キャラ12: 芸能プロデューサー・星野 =====
const hoshinoMorningShotEvent: MorningShotEvent = {
  characterId: 12,
  variants: [
    {
      shotResult: 'great',
      situation: '星野は「まわしてまわして！」とスマホを渡してきた直後に打った。球は完璧にフェアウェイへ。',
      choices: [
        { id: 'A', text: '「今の撮れてます。完全にオープニング映像です」', delta: { fun: 6, trust: 5, creep: 0 }, tags: ['humor', 'hype'] },
        { id: 'B', text: '「ナイスショットでした」と普通に返す', delta: { fun: 1, trust: 2, creep: 0 }, tags: ['neutral', 'safe'] },
        { id: 'C', text: '「プレー中の撮影はマナー的にどうかと」と諫める', delta: { fun: -4, trust: -2, creep: 5 }, tags: ['serious', 'etiquette'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '星野の一打はまずまず。「うーん、地味だな。もっと画になるやつが欲しい」と不満げだ。',
      choices: [
        { id: 'A', text: '「今のもう一回打ちましょう。撮り直しで」と勧める', delta: { fun: 4, trust: -1, creep: 5 }, tags: ['cheat_score', 'over_support'] },
        { id: 'B', text: '「見せ場は後半に取っておきましょう」と乗る', delta: { fun: 5, trust: 4, creep: 0 }, tags: ['humor', 'hype'] },
        { id: 'C', text: '「地味でもフェアウェイは正解ですよ」と正直に言う', delta: { fun: 1, trust: 3, creep: 0 }, tags: ['honesty', 'logic'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '星野の第一打が大きく曲がってOB。「よし、これは編集でカットだ」と自分で言った。',
      choices: [
        { id: 'A', text: '「ここからの巻き返しが一番盛り上がりますよ」と煽る', delta: { fun: 5, trust: 3, creep: 0 }, tags: ['hype', 'ride_the_mood'] },
        { id: 'B', text: '「2打罰です。スコアは正確につけましょう」と告げる', delta: { fun: -4, trust: -2, creep: 5 }, tags: ['serious', 'etiquette'] },
        { id: 'C', text: '「カットなしの生放送でいきましょう」と返す', delta: { fun: 6, trust: 4, creep: 0 }, tags: ['humor', 'bold'] },
      ],
    },
  ],
};

// ===== キャラ13: 不動産王・金城 =====
const kinjoMorningShotEvent: MorningShotEvent = {
  characterId: 13,
  variants: [
    {
      shotResult: 'great',
      situation: '「朝イチから刻むやつはおらんやろ」——金城はフルスイングで豪快に飛ばした。文句なしの当たり。',
      choices: [
        { id: 'A', text: '「気持ちいい。こっちも振っていきます」と応じる', delta: { fun: 6, trust: 5, creep: 0 }, tags: ['bold', 'kiai'] },
        { id: 'B', text: '「自分は安全に刻んでおきます」と構える', delta: { fun: -3, trust: -1, creep: 3 }, tags: ['safe', 'avoid_risk'] },
        { id: 'C', text: '「すごい飛距離ですね」と素直に言う', delta: { fun: 3, trust: 3, creep: 0 }, tags: ['honesty', 'flattery'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '金城の球は右に大きく曲がったが、なんとかセーフ。「ま、飛んどるからええわ」と笑っている。',
      choices: [
        { id: 'A', text: '「方向を優先した方が、スコアは安定しますよ」', delta: { fun: -3, trust: -1, creep: 4 }, tags: ['safe', 'logic'] },
        { id: 'B', text: '「自分も振っていきます。刻むのは性に合わないので」', delta: { fun: 5, trust: 5, creep: 0 }, tags: ['bold', 'challenge'] },
        { id: 'C', text: '「距離が出てるので十分ですよ」と乗る', delta: { fun: 4, trust: 4, creep: 0 }, tags: ['bold', 'humor'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '金城のフルスイングが大きく右へ。「あかん、力入りすぎたわ！」と豪快に笑っている。',
      choices: [
        { id: 'A', text: '「次は刻んだ方がいいと思いますよ」と助言する', delta: { fun: -3, trust: -2, creep: 4 }, tags: ['safe', 'avoid_risk'] },
        { id: 'B', text: '「金城さんならすぐ取り返せますよ」と持ち上げる', delta: { fun: 3, trust: 1, creep: 2 }, tags: ['flattery'] },
        { id: 'C', text: '「その振り方は嫌いじゃないです。もう一発いきましょう」', delta: { fun: 6, trust: 5, creep: 0 }, tags: ['bold', 'kiai', 'adversity'] },
      ],
    },
  ],
};

// ===== キャラ14: 医療法人理事長・白石 =====
const shiraishiMorningShotEvent: MorningShotEvent = {
  characterId: 14,
  variants: [
    {
      shotResult: 'great',
      situation: '白石は入念にストレッチをしてから構えた。無理のないスイングで球はフェアウェイ中央へ。',
      choices: [
        { id: 'A', text: '「準備から打ち方まで一貫してますね」と観察を返す', delta: { trust: 5, fun: 2, creep: 0 }, tags: ['logic', 'analysis_praise'] },
        { id: 'B', text: '「ナイスショット！最高です！」と盛り上げる', delta: { trust: -2, fun: 1, creep: 4 }, tags: ['hype', 'over_praise'] },
        { id: 'C', text: '「自分もストレッチしておきます」と真似る', delta: { trust: 4, fun: 2, creep: 0 }, tags: ['self_reflect', 'etiquette'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '白石の一打は控えめだが確実にフェアウェイ。「これでいいんです。無理をすると後半が持たない」',
      choices: [
        { id: 'A', text: '「攻めた方が面白いですよ」と勧める', delta: { trust: -2, fun: 0, creep: 4 }, tags: ['bold', 'hype'] },
        { id: 'B', text: '「18ホール逆算しての一打ですね」と受ける', delta: { trust: 5, fun: 2, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'C', text: '「体を大事にするのが一番ですよね」と同意する', delta: { trust: 4, fun: 2, creep: 0 }, tags: ['ethics', 'safe'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '白石の球が左に切れてOB。「…力が入りましたね。よくないサインです」と自己分析している。',
      choices: [
        { id: 'A', text: '「白石さんでもミスするんですね」と驚いてみせる', delta: { trust: -3, fun: 1, creep: 5 }, tags: ['over_praise', 'hype'] },
        { id: 'B', text: '「朝は体が起きてないですから」とフォローする', delta: { trust: 3, fun: 1, creep: 0 }, tags: ['safe', 'ethics'] },
        { id: 'C', text: '「原因が分かっているなら次で戻せますね」と返す', delta: { trust: 5, fun: 2, creep: 0 }, tags: ['logic', 'honesty'] },
      ],
    },
  ],
};

// ===== キャラ15: 老舗料亭女将・千鶴 =====
const chizuruMorningShotEvent: MorningShotEvent = {
  characterId: 15,
  variants: [
    {
      shotResult: 'great',
      situation: '千鶴は一礼してから静かに構えた。柔らかいスイングから真っ直ぐな球が伸びた。「まあ、よかった」',
      choices: [
        { id: 'A', text: '「気持ちのいい球でした」と静かに一礼する', delta: { trust: 6, fun: 2, creep: 0 }, tags: ['etiquette', 'honesty'] },
        { id: 'B', text: '「ナイスショット！いけますよ今日は！」と声を上げる', delta: { trust: -2, fun: 1, creep: 4 }, tags: ['bold', 'hype'] },
        { id: 'C', text: '「所作まで綺麗ですね」と感じたままに言う', delta: { trust: 4, fun: 3, creep: 0 }, tags: ['flattery', 'etiquette'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '千鶴の球は距離は出ないが真っ直ぐ。「急がずゆっくり、でよろしいですやろ？」と微笑む。',
      choices: [
        { id: 'A', text: '「もっと飛ばせますよ、思い切って振りましょう」', delta: { trust: -3, fun: 0, creep: 4 }, tags: ['bold', 'hype'] },
        { id: 'B', text: '「そのペースで大丈夫です。合わせます」と応じる', delta: { trust: 6, fun: 2, creep: 0 }, tags: ['etiquette', 'honesty'] },
        { id: 'C', text: '「真っ直ぐが一番強いですよね」と受ける', delta: { trust: 4, fun: 2, creep: 0 }, tags: ['honesty', 'safe'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '千鶴の一打が林へ入った。「あら…お恥ずかしい」と静かに口元を隠した。',
      choices: [
        { id: 'A', text: '「大丈夫です！全然余裕ですよ！」と大きく励ます', delta: { trust: -1, fun: 1, creep: 4 }, tags: ['hype', 'over_support'] },
        { id: 'B', text: '何も言わず、静かに次の準備をする', delta: { trust: 3, fun: 0, creep: 0 }, tags: ['silence', 'etiquette'] },
        { id: 'C', text: '「朝イチは誰でもです。お気になさらず」と穏やかに', delta: { trust: 6, fun: 2, creep: 0 }, tags: ['etiquette', 'sportsmanship'] },
      ],
    },
  ],
};

// ===== キャラ16: 銀座 ハジメ（弁護士法人エース 代表弁護士）=====
const hajimeMorningShotEvent: MorningShotEvent = {
  characterId: 16,
  variants: [
    {
      shotResult: 'great',
      situation: 'ハジメは軽く笑ってから打った。パワーフェード——本人の言い方だとそうなる球が、綺麗に伸びた。',
      choices: [
        { id: 'A', text: '「今のはスライスじゃないんですね」と確認する', delta: { trust: 4, fun: 5, creep: 0 }, tags: ['humor', 'honesty'] },
        { id: 'B', text: '「さすがです、完璧なフェードでした」と称える', delta: { trust: 3, fun: 3, creep: 1 }, tags: ['flattery'] },
        { id: 'C', text: '静かに拍手を送る', delta: { trust: 3, fun: 1, creep: 0 }, tags: ['etiquette', 'silence'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: 'ハジメの球は右へ緩やかに曲がってラフの手前。「これもパワーフェードだよ」と真顔で言う。',
      choices: [
        { id: 'A', text: '「言い方が上手いですね」と感心する', delta: { trust: 3, fun: 4, creep: 0 }, tags: ['humor', 'flattery'] },
        { id: 'B', text: '「今のは普通にスライスです」と正直に返す', delta: { trust: 5, fun: 5, creep: 0 }, tags: ['honesty', 'humor'] },
        { id: 'C', text: '「なるほど、パワーフェードですね」と合わせる', delta: { trust: 2, fun: 3, creep: 0 }, tags: ['safe', 'humor'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: 'ハジメの第一打が大きく右へ消えた。「上がり3ホールで返すから、心配しなくていい」',
      choices: [
        { id: 'A', text: '「その余裕、見習いたいです」と素直に言う', delta: { trust: 4, fun: 3, creep: 0 }, tags: ['honesty', 'self_reflect'] },
        { id: 'B', text: '「では上がり3ホールを楽しみにしています」と受ける', delta: { trust: 3, fun: 4, creep: 0 }, tags: ['humor', 'safe'] },
        { id: 'C', text: '「まだ1ホール目ですけどね」と笑って返す', delta: { trust: 4, fun: 5, creep: 0 }, tags: ['humor', 'honesty'] },
      ],
    },
  ],
};

// ===== キャラ17: IT起業家・篠原 =====
const shinoharaMorningShotEvent: MorningShotEvent = {
  characterId: 17,
  variants: [
    {
      shotResult: 'great',
      situation: '篠原は素振り一回で「はい、いきます」と即打ち。テンポそのままの綺麗なドローだった。',
      choices: [
        { id: 'A', text: '「速い。準備からショットまで無駄がないですね」', delta: { trust: 5, fun: 4, creep: 0 }, tags: ['logic', 'humor'] },
        { id: 'B', text: '「天才です、もう完全に別格ですよ」と持ち上げる', delta: { trust: -3, fun: 1, creep: 5 }, tags: ['over_praise', 'flattery'] },
        { id: 'C', text: '「自分もテンポ上げます」とすぐ構える', delta: { trust: 4, fun: 4, creep: 0 }, tags: ['humor', 'challenge'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '篠原の球はフェアウェイの端。「まあ許容範囲。次で寄せればいいので」と切り替えが早い。',
      choices: [
        { id: 'A', text: '「2打目の残り距離、いくつになりました」と聞く', delta: { trust: 5, fun: 2, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「その割り切りが速いですね」と感心する', delta: { trust: 4, fun: 4, creep: 0 }, tags: ['logic', 'humor'] },
        { id: 'C', text: '「…」と特に反応せず自分の準備をする', delta: { trust: -3, fun: -2, creep: 4 }, tags: ['silence', 'distance'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '篠原の第一打が左へ外れた。「はい、1本消費。想定内です」ともう次を見ている。',
      choices: [
        { id: 'A', text: '「切り替えが速すぎます」と笑って言う', delta: { trust: 5, fun: 5, creep: 0 }, tags: ['humor', 'honesty'] },
        { id: 'B', text: '「大丈夫です！篠原さんなら余裕です！」と励ます', delta: { trust: -2, fun: 1, creep: 4 }, tags: ['over_praise', 'hype'] },
        { id: 'C', text: '「打ち直しの方が期待値高いですよね」と確認する', delta: { trust: 5, fun: 2, creep: 0 }, tags: ['logic'] },
      ],
    },
  ],
};

// ===== キャラ18: マーケター・桐生 =====
const kiryuMorningShotEvent: MorningShotEvent = {
  characterId: 18,
  variants: [
    {
      shotResult: 'great',
      situation: '桐生の第一打は静かで正確だった。打ち終わってから、こちらの反応をまっすぐ見ている。',
      choices: [
        { id: 'A', text: '「正直、驚きました。いい球でした」と率直に言う', delta: { trust: 6, fun: 3, creep: 0 }, tags: ['honesty', 'ethics'] },
        { id: 'B', text: '「流石です！プロ級ですよ！」と称える', delta: { trust: -4, fun: 1, creep: 6 }, tags: ['over_praise', 'flattery'] },
        { id: 'C', text: '「見られてると緊張しますね」と笑う', delta: { trust: 3, fun: 4, creep: 0 }, tags: ['humor'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '桐生の球はフェアウェイだが本人は納得していない様子。「…今の、どう見えました？」',
      choices: [
        { id: 'A', text: '「完璧でしたよ」と即答する', delta: { trust: -4, fun: 0, creep: 6 }, tags: ['flattery', 'safe'] },
        { id: 'B', text: '「体が少し早く開いて見えました」と見えた通り伝える', delta: { trust: 6, fun: 2, creep: 0 }, tags: ['honesty', 'analysis_praise'] },
        { id: 'C', text: '「自分には判断できません」と正直に言う', delta: { trust: 3, fun: 1, creep: 0 }, tags: ['honesty'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '桐生の一打がOBゾーンへ。「これ、朝イチだからってフォローされるの一番嫌なんですよね」',
      choices: [
        { id: 'A', text: '「では何も言いません」と普通にプレーを続ける', delta: { trust: 6, fun: 3, creep: 0 }, tags: ['honesty', 'etiquette'] },
        { id: 'B', text: '「朝イチは誰でもありますよ」と声をかける', delta: { trust: -2, fun: 0, creep: 4 }, tags: ['safe', 'over_support'] },
        { id: 'C', text: '「じゃあ遠慮なく。今のは曲がりすぎです」と返す', delta: { trust: 5, fun: 4, creep: 0 }, tags: ['honesty', 'humor'] },
      ],
    },
  ],
};

// ===== キャラ19: 重工会長・鷹宮 =====
const takamiyaMorningShotEvent: MorningShotEvent = {
  characterId: 19,
  variants: [
    {
      shotResult: 'great',
      situation: '鷹宮は無言で構え、一切の飾りなく振り抜いた。真っ直ぐな球。彼は結果を見もせずクラブを納めた。',
      choices: [
        { id: 'A', text: '「…お見事です」と短く述べる', delta: { trust: 6, fun: 1, creep: 0 }, tags: ['honesty', 'etiquette'] },
        { id: 'B', text: '「素晴らしい！鷹宮さんは本当にすごいです！」と称える', delta: { trust: -4, fun: 1, creep: 6 }, tags: ['flattery', 'hype'] },
        { id: 'C', text: '何も言わず、自分も同じように構える', delta: { trust: 5, fun: 1, creep: 0 }, tags: ['silence', 'sportsmanship'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '鷹宮の球はフェアウェイ。彼は静かにこちらを見た。「…お前はどう打つ」',
      choices: [
        { id: 'A', text: '「安全に刻みます」と正直に言う', delta: { trust: 4, fun: 1, creep: 0 }, tags: ['honesty', 'safe'] },
        { id: 'B', text: '「同じ狙いでいきます」と真っ直ぐ答える', delta: { trust: 6, fun: 2, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
        { id: 'C', text: '「鷹宮さんに合わせます」と控える', delta: { trust: -3, fun: 0, creep: 5 }, tags: ['flattery', 'over_support'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '鷹宮の第一打が林へ消えた。彼は表情を変えず、静かに次のボールを取り出した。',
      choices: [
        { id: 'A', text: '何も言わず、自分の準備を進める', delta: { trust: 5, fun: 0, creep: 0 }, tags: ['silence', 'sportsmanship'] },
        { id: 'B', text: '「気にせずいきましょう！次です次！」と励ます', delta: { trust: -3, fun: 0, creep: 5 }, tags: ['hype', 'over_support'] },
        { id: 'C', text: '「1打罰ですね」と事実だけ確認する', delta: { trust: 5, fun: 0, creep: 0 }, tags: ['honesty', 'sportsmanship'] },
      ],
    },
  ],
};

// ===== キャラ20: 税理士法人代表・早瀬 =====
const hayaseMorningShotEvent: MorningShotEvent = {
  characterId: 20,
  variants: [
    {
      shotResult: 'great',
      situation: '早瀬は距離表示を確認し、番手を選び直してから打った。狙った場所にきっちり止まった。',
      choices: [
        { id: 'A', text: '「番手を上げたのは風の計算ですか」と聞く', delta: { trust: 6, fun: 3, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'B', text: '「さすが早瀬さん、完璧です！」と称える', delta: { trust: -3, fun: 1, creep: 5 }, tags: ['flattery', 'hype'] },
        { id: 'C', text: '「狙った場所に止まりましたね」と事実を述べる', delta: { trust: 4, fun: 2, creep: 0 }, tags: ['honesty'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: '早瀬の球はフェアウェイの手前。「想定より10ヤード足りません。原因は分かってます」',
      choices: [
        { id: 'A', text: '「気合でいきましょう！次は届きます！」と盛り上げる', delta: { trust: -2, fun: 0, creep: 4 }, tags: ['hype', 'kiai'] },
        { id: 'B', text: '「原因が分かっているなら次で調整できますね」と返す', delta: { trust: 6, fun: 2, creep: 0 }, tags: ['logic', 'honesty'] },
        { id: 'C', text: '「10ヤードなら大した差じゃないですよ」と慰める', delta: { trust: 1, fun: 1, creep: 1 }, tags: ['safe'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: '早瀬の第一打が右へ外れた。「…前提を間違えました。風向きを読み直します」と冷静だ。',
      choices: [
        { id: 'A', text: '「早瀬さんでも外すんですね」と意外そうに言う', delta: { trust: -3, fun: 1, creep: 5 }, tags: ['flattery', 'over_praise'] },
        { id: 'B', text: '「朝イチはこんなものですよ」と流す', delta: { trust: 1, fun: 1, creep: 1 }, tags: ['safe', 'neutral'] },
        { id: 'C', text: '「自分も読み直します。一緒に確認しませんか」と提案する', delta: { trust: 6, fun: 3, creep: 0 }, tags: ['logic', 'honesty'] },
      ],
    },
  ],
};

// ===== キャラ21: 美容クリニック経営・ミツキ =====
const mitsukiMorningShotEvent: MorningShotEvent = {
  characterId: 21,
  variants: [
    {
      shotResult: 'great',
      situation: 'ミツキは「よし、いくよ！」と明るく構え、綺麗なフェードを放った。「やった！見てました？」',
      choices: [
        { id: 'A', text: '「見てました。今の完全に狙い通りですよね」と笑う', delta: { fun: 6, trust: 5, creep: 0 }, tags: ['humor', 'honesty'] },
        { id: 'B', text: '「天才です！プロ級！もう別格ですよ！」と褒める', delta: { fun: 1, trust: -3, creep: 6 }, tags: ['over_praise', 'flattery'] },
        { id: 'C', text: '「いい球でした」と落ち着いて返す', delta: { fun: 1, trust: 3, creep: 0 }, tags: ['honesty', 'neutral'] },
      ],
    },
    {
      shotResult: 'normal',
      situation: 'ミツキの球はまずまず。「んー、まあこんな感じかな。朝イチだしね」と切り替えている。',
      choices: [
        { id: 'A', text: '「完璧でした！最高でした！」と大きく褒める', delta: { fun: 1, trust: -2, creep: 5 }, tags: ['over_praise', 'flattery'] },
        { id: 'B', text: '「朝イチであれなら上出来ですよ」と乗る', delta: { fun: 5, trust: 4, creep: 0 }, tags: ['humor', 'honesty'] },
        { id: 'C', text: '「集中していきましょう」と真面目に言う', delta: { fun: -3, trust: 0, creep: 3 }, tags: ['serious', 'focus'] },
      ],
    },
    {
      shotResult: 'ob',
      situation: 'ミツキの第一打が右へ大きく曲がった。「えー、待って、今のなし！」と笑いながら言っている。',
      choices: [
        { id: 'A', text: '「いいですよ、なしで。打ち直しましょう」と応じる', delta: { fun: 4, trust: -2, creep: 5 }, tags: ['cheat_score', 'over_support'] },
        { id: 'B', text: '「2打罰です。正確につけましょう」と告げる', delta: { fun: -4, trust: 0, creep: 4 }, tags: ['serious', 'ethics'] },
        { id: 'C', text: '「なしにはできないですよ」と笑ってツッコむ', delta: { fun: 6, trust: 5, creep: 0 }, tags: ['humor', 'honesty'] },
      ],
    },
  ],
};

// ===== フォールバック（未登録キャラ用）=====
export const buildGenericMorningShotEvent = (characterId: number): MorningShotEvent => ({
  characterId,
  variants: [
    {
      shotResult: 'great',
      situation: '相手は見事なショットを放った。ボールはフェアウェイ中央へ飛んでいく。',
      choices: [
        {
          id: 'A',
          text: '「ナイスショット！」と称賛する',
          delta: { trust: 4, fun: 2, creep: 0 },
          tags: ['flattery', 'sportsmanship'],
        },
        {
          id: 'B',
          text: '静かに拍手を送る',
          delta: { trust: 5, fun: 0, creep: 0 },
          tags: ['etiquette', 'silence'],
        },
        {
          id: 'C',
          text: '「いいプレッシャーですね」と笑顔で言う',
          delta: { trust: 2, fun: 4, creep: 2 },
          tags: ['humor', 'bold'],
        },
      ],
    },
    {
      shotResult: 'normal',
      situation: '相手は丁寧にスイングした。まずまずの出だし。',
      choices: [
        {
          id: 'A',
          text: '「安定感がありますね」と評価する',
          delta: { trust: 3, fun: 1, creep: 0 },
          tags: ['analysis_praise'],
        },
        {
          id: 'B',
          text: '「いい朝ですね」と話を変える',
          delta: { trust: 2, fun: 3, creep: 0 },
          tags: ['humor', 'safe'],
        },
        {
          id: 'C',
          text: '何も言わずに自分の準備をする',
          delta: { trust: 1, fun: 0, creep: 0 },
          tags: ['silence', 'focus'],
        },
      ],
    },
    {
      shotResult: 'ob',
      situation: '相手のボールが大きく曲がり、OB方向へ。気まずい空気が漂う。',
      choices: [
        {
          id: 'A',
          text: '「朝イチはよくありますよ」と声をかける',
          delta: { trust: 5, fun: 2, creep: 0 },
          tags: ['sportsmanship', 'safe'],
        },
        {
          id: 'B',
          text: '素知らぬ顔で遠くを見る',
          delta: { trust: 2, fun: 0, creep: 0 },
          tags: ['silence', 'distance'],
        },
        {
          id: 'C',
          text: '「大丈夫ですか？」と大げさに心配する',
          delta: { trust: 1, fun: 0, creep: 6 },
          tags: ['over_support'],
        },
      ],
    },
  ],
});

// ===== エクスポート =====
export const morningShotEvents: Record<number, MorningShotEvent> = {
  1: tanakaMorningShotEvent,
  2: onizukaMorningShotEvent,
  3: bocchanMorningShotEvent,
  4: kurodaMorningShotEvent,
  5: smithMorningShotEvent,
  6: mitsuyamaMorningShotEvent,
  7: iwaoMorningShotEvent,
  8: nakamuraMorningShotEvent,
  9: satoMorningShotEvent,
  10: matsumotoMorningShotEvent,
  11: daimonMorningShotEvent,
  12: hoshinoMorningShotEvent,
  13: kinjoMorningShotEvent,
  14: shiraishiMorningShotEvent,
  15: chizuruMorningShotEvent,
  16: hajimeMorningShotEvent,
  17: shinoharaMorningShotEvent,
  18: kiryuMorningShotEvent,
  19: takamiyaMorningShotEvent,
  20: hayaseMorningShotEvent,
  21: mitsukiMorningShotEvent,
};

export const getMorningShotEvent = (characterId: number): MorningShotEvent => {
  return morningShotEvents[characterId] ?? buildGenericMorningShotEvent(characterId);
};

export const pickMorningShotVariant = (characterId: number, result: MorningShotResult) => {
  const event = getMorningShotEvent(characterId);
  return event.variants.find((v) => v.shotResult === result)!;
};

export const rollMorningShotResult = (): MorningShotResult => {
  const r = Math.random();
  if (r < 0.3) return 'great';
  if (r < 0.8) return 'normal';
  return 'ob';
};
