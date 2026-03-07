import { useRef, useMemo, useCallback } from 'react';
import { View, Animated, PanResponder, Dimensions, StyleSheet } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;
const SWIPE_VELOCITY = 0.3;

function getDateOffset(date, offset) {
  const d = new Date(date);
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SwipeableDay({ selectedDate, onDateChange, children: renderDay }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const prevDate = useMemo(() => getDateOffset(selectedDate, -1), [selectedDate]);
  const nextDate = useMemo(() => getDateOffset(selectedDate, 1), [selectedDate]);

  const snapTo = useCallback(
    (toValue, newDate) => {
      isAnimating.current = true;
      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        tension: 68,
        friction: 12,
      }).start(() => {
        if (newDate) {
          onDateChange(newDate);
        }
        translateX.setValue(0);
        isAnimating.current = false;
      });
    },
    [translateX, onDateChange]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          if (isAnimating.current) return false;
          return Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5;
        },
        onPanResponderMove: (_, gesture) => {
          translateX.setValue(gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          const { dx, vx } = gesture;
          if (dx > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY) {
            // Swipe right → previous day
            snapTo(SCREEN_WIDTH, prevDate);
          } else if (dx < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY) {
            // Swipe left → next day
            snapTo(-SCREEN_WIDTH, nextDate);
          } else {
            snapTo(0, null);
          }
        },
        onPanResponderTerminate: () => {
          snapTo(0, null);
        },
      }),
    [translateX, snapTo, prevDate, nextDate]
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Previous day */}
      <Animated.View
        style={[
          styles.page,
          {
            transform: [{ translateX: Animated.add(translateX, -SCREEN_WIDTH) }],
          },
        ]}
      >
        {renderDay(prevDate)}
      </Animated.View>

      {/* Current day */}
      <Animated.View
        style={[
          styles.page,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {renderDay(selectedDate)}
      </Animated.View>

      {/* Next day */}
      <Animated.View
        style={[
          styles.page,
          {
            transform: [{ translateX: Animated.add(translateX, SCREEN_WIDTH) }],
          },
        ]}
      >
        {renderDay(nextDate)}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  page: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
