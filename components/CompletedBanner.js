import { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const CONFETTI_COUNT = 14;
const CONFETTI_COLORS = ['#FF4444', '#FFD700', '#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0'];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function ConfettiPiece({ delay, color, startX, startY, endX, endY, rotation }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [anim, delay]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, endY],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.2, 0.7, 1],
    outputRange: [0, 1, 1, 0],
  });
  const scale = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1.2, 0.4],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${rotation}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: color,
          transform: [{ translateX }, { translateY }, { scale }, { rotate }],
          opacity,
        },
      ]}
    />
  );
}

export default function CompletedBanner({ isCompleted }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const bannerScale = useRef(new Animated.Value(0)).current;
  const wasCompleted = useRef(false);

  const confettiPieces = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      startX: randomBetween(-10, 30),
      startY: randomBetween(-10, 20),
      endX: randomBetween(-60, 80),
      endY: randomBetween(-60, 60),
      delay: Math.random() * 200,
      rotation: randomBetween(-360, 360),
    }))
  );

  const regenerateConfetti = useCallback(() => {
    confettiPieces.current = Array.from({ length: CONFETTI_COUNT }, () => ({
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      startX: randomBetween(-10, 30),
      startY: randomBetween(-10, 20),
      endX: randomBetween(-60, 80),
      endY: randomBetween(-60, 60),
      delay: Math.random() * 200,
      rotation: randomBetween(-360, 360),
    }));
  }, []);

  useEffect(() => {
    if (isCompleted && !wasCompleted.current) {
      // Just became completed — pop in banner + confetti
      bannerScale.setValue(0);
      regenerateConfetti();
      setConfettiKey((k) => k + 1);
      setShowConfetti(true);

      Animated.spring(bannerScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();

      // Hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 1000);
      wasCompleted.current = true;
      return () => clearTimeout(timer);
    } else if (!isCompleted && wasCompleted.current) {
      // Un-completed — hide banner
      Animated.timing(bannerScale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      setShowConfetti(false);
      wasCompleted.current = false;
    } else if (isCompleted) {
      // Already completed on mount (e.g. returning to screen)
      bannerScale.setValue(1);
      wasCompleted.current = true;
    }
  }, [isCompleted, bannerScale, regenerateConfetti]);

  if (!isCompleted && !wasCompleted.current) return null;

  return (
    <View style={styles.bannerContainer} pointerEvents="none">
      {/* Confetti layer */}
      {showConfetti &&
        confettiPieces.current.map((piece, i) => (
          <ConfettiPiece key={`${confettiKey}-${i}`} {...piece} />
        ))}

      {/* Diagonal ribbon */}
      <Animated.View
        style={[
          styles.ribbon,
          { transform: [{ rotate: '-45deg' }, { scale: bannerScale }] },
        ]}
      >
        <Text style={styles.ribbonText}>COMPLETED</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 100,
    height: 100,
    zIndex: 10,
    overflow: 'visible',
  },
  ribbon: {
    position: 'absolute',
    top: 22,
    left: -24,
    width: 110,
    backgroundColor: '#D32F2F',
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  ribbonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  confettiPiece: {
    position: 'absolute',
    top: 25,
    left: 25,
    width: 7,
    height: 7,
    borderRadius: 1.5,
  },
});
