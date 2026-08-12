import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useGameStore } from '../store/useGameStore';
import { playSfx } from '../lib/sound';

type Props = NativeStackScreenProps<RootStackParamList, 'Title'>;

/**
 * スプラッシュ → タイトル。
 *
 * スプラッシュは同名義の別アプリ（麺の細道）と同じ体裁で揃えている。
 * 白地に「POWERED BY」＋ロゴ、3秒で自動遷移、タップで飛ばせる。
 * ロゴは 611×93 の原寸比を保つ。
 *
 * タイトルは完成済みのドット絵1枚（title_screen.png 941×1672）。
 * 「ENJOY GOLF QUEST」「ラウンドへ」「音 ON」「Produced by HINANO Inc.」は
 * すべて画像に描かれているので、テキストは置かない。
 * 操作は画像上の該当位置に透明の Pressable を重ねて受ける。
 */

const SPLASH_MS = 3000;
const FADE_MS = 500;

const LOGO_ASPECT = 611 / 93;
const { width: SCREEN_W } = Dimensions.get('window');
const LOGO_WIDTH = Math.min(SCREEN_W * 0.56, 420);
const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT;

/** タイトル画像の原寸。縦横比の計算と pixelated 表示の基準 */
const TITLE_IMG_W = 941;
const TITLE_IMG_H = 1672;
const TITLE_ASPECT = TITLE_IMG_W / TITLE_IMG_H;

export default function TitleScreen({ navigation }: Props) {
  const store = useGameStore();
  const [stage, setStage] = useState<'splash' | 'title'>('splash');
  const { width: winW, height: winH } = useWindowDimensions();

  // 画像を切らずに（contain）画面へ収めたときの実表示サイズ。
  // 透明ボタンはこのコンテナ内にパーセントで置くので、
  // 端末サイズが変わっても画像上の位置とずれない
  const imgW = Math.min(winW, winH * TITLE_ASPECT);
  const imgH = imgW / TITLE_ASPECT;

  // スプラッシュ
  const poweredBy = useRef(new Animated.Value(0)).current;
  const logo = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;

  // タイトル（画像1枚になったのでフェードインだけ残す）
  const titleOpacity = useRef(new Animated.Value(0)).current;

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

  const handleToggleSound = () => {
    const next = !store.settings.sfxEnabled;
    store.setSfxEnabled(next);
    if (next) playSfx('tap');
  };

  return (
    <View style={styles.root}>
      <StatusBar style={stage === 'splash' ? 'dark' : 'light'} />

      {/* ===== タイトル（下に敷いておき、スプラッシュが退いたら見える） ===== */}
      <Animated.View style={[styles.titleLayer, { opacity: titleOpacity }]}>
        <View style={{ width: imgW, height: imgH }}>
          <Image
            source={require('../../assets/title_screen.png')}
            resizeMode="contain"
            style={[
              { width: imgW, height: imgH },
              // ドット絵を滑らかに補間させない（Web のみ効く生 CSS）
              Platform.OS === 'web' && ({ imageRendering: 'pixelated' } as object),
            ]}
          />

          {/* 「ラウンドへ」。画像に描かれた文字の上に透明ボタンを重ねる */}
          <Pressable
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="ゲームを始める"
            style={({ pressed }) => [
              styles.startHit,
              pressed && styles.hitPressed,
            ]}
          />

          {/* 「音 ON」。OFF のときは画像の文字が嘘になるので、
              その領域だけドット絵風の小さなパネルで覆って OFF を出す */}
          <Pressable
            onPress={handleToggleSound}
            accessibilityRole="button"
            accessibilityLabel="効果音を切り替える"
            style={({ pressed }) => [
              styles.soundHit,
              pressed && styles.hitPressed,
            ]}
          >
            {!store.settings.sfxEnabled && (
              <View style={styles.soundOffPanel}>
                <Text style={styles.soundOffText}>音 OFF</Text>
              </View>
            )}
          </Pressable>
        </View>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // 画像の外に余白が出る端末では濃紺で埋める（画像の夜空に馴染む色）
    backgroundColor: '#0d1b2e',
  },
  // ===== タイトル =====
  titleLayer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * 画像上の「ラウンドへ」に重ねる透明ボタン。
   * パーセントは画像コンテナ基準（画像と同じ縦横比なのでずれない）
   */
  startHit: {
    position: 'absolute',
    left: '20%',
    top: '74%',
    width: '60%',
    height: '11%',
  },
  soundHit: {
    position: 'absolute',
    left: '34%',
    top: '85%',
    width: '32%',
    height: '6%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 押した手応え。透明ボタンのままだと押せたか分からない */
  hitPressed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
  },
  /** OFF 表示。画像の「音 ON」を覆う小さなドット絵風パネル */
  soundOffPanel: {
    backgroundColor: '#0d1b2e',
    borderWidth: 2,
    borderColor: '#f0e6c8',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  soundOffText: {
    color: '#f0e6c8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
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
