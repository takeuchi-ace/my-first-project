import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface Props {
  isActive: boolean;
  onDone: () => void;
}

export default function InsightOverlay({ isActive, onDone }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;

    scaleAnim.setValue(0);
    opacityAnim.setValue(1);

    // Scale pop: 0 → 1.2 → 1.0 over 900ms
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade out after 1.2s
    const fadeTimer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onDone();
      });
    }, 1200);

    return () => clearTimeout(fadeTimer);
  }, [isActive, scaleAnim, opacityAnim, onDone]);

  if (!isActive) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.icon}>💡</Text>
        <Text style={styles.text}>本心読破！</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    right: 16,
    zIndex: 150,
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 36,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
