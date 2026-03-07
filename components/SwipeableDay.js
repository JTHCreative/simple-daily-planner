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

  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;
  const onDateChangeRef = useRef(onDateChange);
  onDateChangeRef.current = onDateChange;

  const prevDate = useMemo(() => getDateOffset(selectedDate, -1), [selectedDate]);
  const nextDate = useMemo(() => getDateOffset(selectedDate, 1), [selectedDate]);

  const snapTo = useCallback(
    (toValue, newDate) => {
      isAnimating.current = true;
      Animated.timing(translateX, {
        toValue,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        // With useNativeDriver:false these are synchronous on the JS thread —
        // translateX resets and React re-renders with the new date in the
        // same frame, so there is no flash of stale content.
        translateX.setValue(0);
        isAnimating.current = false;
        if (newDate) {
          onDateChangeRef.current(newDate);
        }
      });
    },
    [translateX],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          if (isAnimating.current) return false;
          return (
            Math.abs(gesture.dx) > 10 &&
            Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5
          );
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gesture) => {
          translateX.setValue(gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          const { dx, vx } = gesture;
          const current = selectedDateRef.current;
          if (dx > SWIPE_THRESHOLD || (dx > 0 && vx > SWIPE_VELOCITY)) {
            snapTo(SCREEN_WIDTH, getDateOffset(current, -1));
          } else if (dx < -SWIPE_THRESHOLD || (dx < 0 && vx < -SWIPE_VELOCITY)) {
            snapTo(-SCREEN_WIDTH, getDateOffset(current, 1));
          } else {
            snapTo(0, null);
          }
        },
        onPanResponderTerminate: () => {
          snapTo(0, null);
        },
      }),
    [translateX, snapTo],
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.page,
          { transform: [{ translateX: Animated.add(translateX, -SCREEN_WIDTH) }] },
        ]}
      >
        {renderDay(prevDate)}
      </Animated.View>

      <Animated.View
        style={[styles.page, { transform: [{ translateX }] }]}
      >
        {renderDay(selectedDate)}
      </Animated.View>

      <Animated.View
        style={[
          styles.page,
          { transform: [{ translateX: Animated.add(translateX, SCREEN_WIDTH) }] },
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
