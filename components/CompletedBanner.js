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

function makeConfetti() {
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    startX: randomBetween(-10, 30),
    startY: randomBetween(-10, 20),
    endX: randomBetween(-60, 80),
    endY: randomBetween(-60, 60),
    delay: Math.random() * 200,
    rotation: randomBetween(-360, 360),
  }));
}

export default function CompletedBanner({ isCompleted }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  // Initialize from prop so already-completed states show instantly on mount
  const bannerScale = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const wasCompleted = useRef(isCompleted);

  const confettiPieces = useRef(makeConfetti());

  useEffect(() => {
    if (isCompleted && !wasCompleted.current) {
      // Transitioned from incomplete → complete (user action)
      bannerScale.setValue(0);
      confettiPieces.current = makeConfetti();
      setConfettiKey((k) => k + 1);
      setShowConfetti(true);

      Animated.spring(bannerScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => setShowConfetti(false), 1000);
      wasCompleted.current = true;
      return () => clearTimeout(timer);
    } else if (!isCompleted && wasCompleted.current) {
      // Un-completed — hide instantly (no animation)
      bannerScale.setValue(0);
      setShowConfetti(false);
      wasCompleted.current = false;
    }
  }, [isCompleted, bannerScale]);

  if (!isCompleted) return null;

  return (
    <View style={styles.bannerContainer} pointerEvents="none">
      {showConfetti &&
        confettiPieces.current.map((piece, i) => (
          <ConfettiPiece key={`${confettiKey}-${i}`} {...piece} />
        ))}

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
    top: 0,
    left: 0,
    width: 50,
    height: 50,
    zIndex: 10,
    overflow: 'visible',
  },
  ribbon: {
    position: 'absolute',
    top: 10,
    left: -14,
    width: 64,
    backgroundColor: '#D32F2F',
    paddingVertical: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  ribbonText: {
    color: '#fff',
    fontSize: 6,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  confettiPiece: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 4,
    height: 4,
    borderRadius: 1,
  },
});
