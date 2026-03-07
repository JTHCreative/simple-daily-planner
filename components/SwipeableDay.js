import { useRef, useState, useMemo, useCallback, useLayoutEffect, useEffect } from 'react';
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
  const pendingReset = useRef(false);

  // Internal date state so we can control render timing
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const currentDateRef = useRef(currentDate);
  currentDateRef.current = currentDate;

  const onDateChangeRef = useRef(onDateChange);
  onDateChangeRef.current = onDateChange;

  // Sync with external date changes (e.g. DateHeader tap)
  const prevSelectedDate = useRef(selectedDate);
  useEffect(() => {
    if (prevSelectedDate.current.getTime() !== selectedDate.getTime()) {
      setCurrentDate(selectedDate);
      translateX.setValue(0);
    }
    prevSelectedDate.current = selectedDate;
  }, [selectedDate, translateX]);

  const prevDate = useMemo(() => getDateOffset(currentDate, -1), [currentDate]);
  const nextDate = useMemo(() => getDateOffset(currentDate, 1), [currentDate]);

  // Stable animated nodes for prev/next page transforms (created once)
  const prevTransform = useRef(Animated.add(translateX, -SCREEN_WIDTH)).current;
  const nextTransform = useRef(Animated.add(translateX, SCREEN_WIDTH)).current;

  // After React commits new content, reset translateX so the center page
  // (now showing the correct new date) slides into position 0.  This fires
  // BEFORE the native paint, so the user never sees stale content.
  useLayoutEffect(() => {
    if (pendingReset.current) {
      translateX.setValue(0);
      pendingReset.current = false;
      isAnimating.current = false;
    }
  });

  const snapTo = useCallback(
    (toValue, newDate) => {
      isAnimating.current = true;
      Animated.timing(translateX, {
        toValue,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        if (newDate) {
          // Mark that translateX should reset after React re-renders
          pendingReset.current = true;
          // Update internal + external date — React batches both and
          // re-renders once. useLayoutEffect then resets translateX.
          setCurrentDate(newDate);
          onDateChangeRef.current(newDate);
        } else {
          // Snap-back, no date change
          translateX.setValue(0);
          isAnimating.current = false;
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
          const current = currentDateRef.current;
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
        style={[styles.page, { transform: [{ translateX: prevTransform }] }]}
      >
        {renderDay(prevDate)}
      </Animated.View>

      <Animated.View
        style={[styles.page, { transform: [{ translateX }] }]}
      >
        {renderDay(currentDate)}
      </Animated.View>

      <Animated.View
        style={[styles.page, { transform: [{ translateX: nextTransform }] }]}
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
