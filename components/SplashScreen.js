import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

export default function SplashScreen({ onFinish }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        <Svg width={100} height={100} viewBox="0 0 1024 1024">
          <Circle
            cx="512"
            cy="512"
            r="280"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="48"
            strokeLinecap="round"
          />
          <Polyline
            points="380,520 470,620 644,420"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="52"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <View style={styles.textGroup}>
          <Text style={styles.title}>My Planner</Text>
          <Text style={styles.subtitle}>Task Manager</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  textGroup: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 2,
    opacity: 0.85,
  },
});
