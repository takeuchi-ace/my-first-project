import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFormalPortrait } from '../assets/formalPortraits';

type Props = {
  characterId: number;
  name: string;
  title?: string;
  onDismiss: () => void;
};

/** 初回契約時だけ出す、幻想画の全画面カットイン。 */
export default function FormalPortraitReveal({
  characterId,
  name,
  title,
  onDismiss,
}: Props) {
  const { width, height } = useWindowDimensions();
  const imageSize = Math.min(width, height * 0.62, 720);
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(1.045)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(imageScale, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(copyOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [copyOpacity, imageOpacity, imageScale]);

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        style={styles.pressArea}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={`${name}の契約成立画面。タップして続ける`}
      >
        <View style={styles.imageStage}>
          <Animated.Image
            source={getFormalPortrait(characterId)}
            resizeMode="contain"
            style={[
              styles.image,
              {
                width: imageSize,
                height: imageSize,
                opacity: imageOpacity,
                transform: [{ scale: imageScale }],
              },
            ]}
          />
        </View>

        <Animated.View style={[styles.copy, { opacity: copyOpacity }]}>
          <Text style={styles.eyebrow}>CONTRACT ESTABLISHED</Text>
          <Text style={styles.name}>{name}</Text>
          {/* 銀座は fullName と name が同じで、そのまま出すと
              「銀座 ハジメ」が2行続く。違うときだけ肩書きを添える */}
          {!!title && title !== name && (
            <Text style={styles.title}>{title}</Text>
          )}
          <Text style={styles.tapHint}>タップして続ける</Text>
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070807',
  },
  pressArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  imageStage: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: '#111',
  },
  copy: {
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: '#c9a85c',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 8,
  },
  name: {
    color: '#f5ead0',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  title: {
    color: 'rgba(245,234,208,0.62)',
    fontSize: 13,
    marginTop: 5,
    textAlign: 'center',
  },
  tapHint: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 11,
    marginTop: 20,
  },
});
