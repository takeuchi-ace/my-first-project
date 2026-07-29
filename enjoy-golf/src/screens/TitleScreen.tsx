import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Title'>;

/**
 * スプラッシュ → タイトル。
 *
 * スプラッシュは同名義の別アプリ（麺の細道）と同じ体裁で揃えている。
 * 白地に「POWERED BY」＋ロゴ、3秒で自動遷移、タップで飛ばせる。
 * ロゴは 611×93 の原寸比を保つ。
 *
 * タイトルは未記入のスコアカード。ホールとパーだけが刷られていて
 * スコア欄が空なのは「まだ回っていない」ことを示す。
 */

const SPLASH_MS = 3000;
const FADE_MS = 500;

const LOGO_ASPECT = 611 / 93;
const { width: SCREEN_W } = Dimensions.get('window');
const LOGO_WIDTH = Math.min(SCREEN_W * 0.56, 420);
const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT;

/** スコアカードに刷るパー構成（前半9ホール・合計36） */
const PARS = [4, 3, 4, 5, 4, 4, 3, 5, 4];
const PAR_TOTAL = PARS.reduce((a, b) => a + b, 0);

export default function TitleScreen({ navigation }: Props) {
  const [stage, setStage] = useState<'splash' | 'title'>('splash');

  // スプラッシュ
  const poweredBy = useRef(new Animated.Value(0)).current;
  const logo = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;

  // タイトル
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0)).current;
  const titleText = useRef(new Animated.Value(0)).current;
  const grid = useRef(new Animated.Value(0)).current;
  const startBtn = useRef(new Animated.Value(0)).current;
  const credit = useRef(new Animated.Value(0)).current;

  const movedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToTitle = () => {
    if (movedRef.current) return;
    movedRef.current = true;

    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: FADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setStage('title');
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: FADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      const fadeUp = (v: Animated.Value, delay: number) =>
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();

      // カードが置かれ、題字が入り、罫線が刷られ、最後にボタンが出る
      Animated.spring(card, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }).start();
      fadeUp(titleText, 300);
      fadeUp(grid, 800);
      fadeUp(startBtn, 1400);
      fadeUp(credit, 1800);
    });
  };

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(poweredBy, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logo, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(goToTitle, SPLASH_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace('CharacterSelect');
  };

  return (
    <View style={styles.root}>
      <StatusBar style={stage === 'splash' ? 'dark' : 'light'} />

      {/* ===== タイトル（下に敷いておき、スプラッシュが退いたら見える） ===== */}
      <Animated.View style={[styles.titleLayer, { opacity: titleOpacity }]}>
        {/* スコアカード */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: card,
              transform: [
                { rotate: '-1.5deg' },
                {
                  scale: card.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.94, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {/* カード上部：発行元の体裁 */}
          <View style={styles.cardHead}>
            <Text style={styles.cardHeadText}>CLUBHOUSE</Text>
            <Text style={styles.cardHeadText}>SCORE CARD</Text>
          </View>

          {/* 題字 */}
          <Animated.View
            style={{
              opacity: titleText,
              transform: [
                {
                  translateY: titleText.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            }}
          >
            <Text style={styles.title}>ENJOY</Text>
            <Text style={styles.title}>GOLF</Text>
            <View style={styles.subtitleRow}>
              <View style={styles.subtitleRule} />
              <Text style={styles.subtitle}>接待ゴルフ</Text>
              <View style={styles.subtitleRule} />
            </View>
          </Animated.View>

          {/* ホール／パー／スコアの表。スコア欄が空なのは「まだ回っていない」 */}
          <Animated.View
            style={[
              styles.grid,
              {
                opacity: grid,
                transform: [
                  {
                    translateY: grid.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.gridRow}>
              <Text style={[styles.gridLabel, styles.gridLabelHead]}>HOLE</Text>
              {PARS.map((_, i) => (
                <Text key={i} style={[styles.gridCell, styles.gridCellHead]}>
                  {i + 1}
                </Text>
              ))}
              <Text style={[styles.gridTotal, styles.gridCellHead]}>OUT</Text>
            </View>
            <View style={[styles.gridRow, styles.gridRowMid]}>
              <Text style={styles.gridLabel}>PAR</Text>
              {PARS.map((p, i) => (
                <Text key={i} style={styles.gridCell}>
                  {p}
                </Text>
              ))}
              <Text style={styles.gridTotal}>{PAR_TOTAL}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>SCORE</Text>
              {PARS.map((_, i) => (
                <Text key={i} style={styles.gridCell}>
                  {' '}
                </Text>
              ))}
              <Text style={styles.gridTotal}>{' '}</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* スタート */}
        <Animated.View
          style={{
            width: '100%',
            paddingHorizontal: 28,
            opacity: startBtn,
            transform: [
              {
                translateY: startBtn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          }}
        >
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
          >
            <Text style={styles.startBtnText}>ラウンドへ</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={{ opacity: credit }}>
          <Text style={styles.credit}>Produced by HINANO Inc.</Text>
        </Animated.View>
      </Animated.View>

      {/* ===== スプラッシュ（上に重ねてフェードアウト） ===== */}
      <Animated.View
        pointerEvents={stage === 'splash' ? 'auto' : 'none'}
        style={[styles.splash, { opacity: splashOpacity }]}
      >
        <Pressable onPress={goToTitle} style={styles.splashPress}>
          <Animated.Text
            style={[
              styles.poweredBy,
              {
                opacity: poweredBy,
                transform: [
                  {
                    translateY: poweredBy.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            POWERED BY
          </Animated.Text>
          <Animated.View
            style={{
              opacity: logo,
              transform: [
                {
                  translateY: logo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            }}
          >
            <Image
              source={require('../../assets/ace-logo.png')}
              resizeMode="contain"
              style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
            />
            <Text style={styles.copyright}>©</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** スコアカードの紙・罫線・刷り文字の色（深緑の上に置く前提） */
const PAPER = '#F5EFE0';
const RULE = 'rgba(26,71,42,0.22)';
const INK = '#1a472a';
const INK_LIGHT = 'rgba(26,71,42,0.55)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // ===== タイトル =====
  titleLayer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 28,
  },
  card: {
    width: '86%',
    maxWidth: 420,
    backgroundColor: PAPER,
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    // 紙が置かれている感じを出す影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    paddingBottom: 8,
    marginBottom: 18,
  },
  cardHeadText: {
    fontSize: 9,
    letterSpacing: 2.5,
    color: INK_LIGHT,
    fontWeight: '600',
  },
  title: {
    fontSize: 46,
    lineHeight: 50,
    fontWeight: '900',
    letterSpacing: 4,
    color: INK,
    textAlign: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  subtitleRule: {
    flex: 1,
    height: 1,
    backgroundColor: RULE,
  },
  subtitle: {
    fontSize: 13,
    letterSpacing: 5,
    color: INK_LIGHT,
    fontWeight: '600',
  },
  // ===== ホール表 =====
  grid: {
    borderWidth: 1,
    borderColor: RULE,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  gridRowMid: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: RULE,
  },
  gridLabel: {
    width: 46,
    paddingVertical: 5,
    fontSize: 8,
    letterSpacing: 1,
    color: INK_LIGHT,
    fontWeight: '700',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: RULE,
  },
  gridLabelHead: {
    color: INK,
  },
  gridCell: {
    flex: 1,
    paddingVertical: 5,
    fontSize: 11,
    color: INK_LIGHT,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: RULE,
  },
  gridCellHead: {
    color: INK,
    fontWeight: '700',
  },
  gridTotal: {
    width: 34,
    paddingVertical: 5,
    fontSize: 11,
    color: INK_LIGHT,
    textAlign: 'center',
    fontWeight: '700',
  },
  // ===== スタート =====
  startBtn: {
    backgroundColor: COLORS.woodDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.woodLight,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnPressed: {
    opacity: 0.75,
  },
  startBtnText: {
    color: COLORS.textCream,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 6,
    marginLeft: 6, // letterSpacing の右余白ぶんを補正して中央に見せる
  },
  credit: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.4)',
  },
  // ===== スプラッシュ =====
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  splashPress: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poweredBy: {
    fontSize: 12,
    letterSpacing: 6,
    color: '#9aa6ad',
    marginBottom: 10,
  },
  copyright: {
    position: 'absolute',
    right: -14,
    bottom: -2,
    fontSize: 11,
    color: '#9aa6ad',
  },
});
