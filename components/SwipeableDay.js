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
  const prevOffset = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const nextOffset = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const isAnimating = useRef(false);

  // Keep date refs current so PanResponder closure always has latest
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;
  const onDateChangeRef = useRef(onDateChange);
  onDateChangeRef.current = onDateChange;

  const prevDate = useMemo(() => getDateOffset(selectedDate, -1), [selectedDate]);
  const nextDate = useMemo(() => getDateOffset(selectedDate, 1), [selectedDate]);

  const prevTransform = useRef(Animated.add(translateX, prevOffset)).current;
  const nextTransform = useRef(Animated.add(translateX, nextOffset)).current;

  const snapTo = useCallback(
    (toValue, newDate) => {
      isAnimating.current = true;
      Animated.timing(translateX, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Reset translateX BEFORE changing date so there's no flash
        translateX.setValue(0);
        isAnimating.current = false;
        if (newDate) {
          onDateChangeRef.current(newDate);
        }
      });
    },
    [translateX]
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
          const current = selectedDateRef.current;
          if (dx > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY) {
            snapTo(SCREEN_WIDTH, getDateOffset(current, -1));
          } else if (dx < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY) {
            snapTo(-SCREEN_WIDTH, getDateOffset(current, 1));
          } else {
            snapTo(0, null);
          }
        },
        onPanResponderTerminate: () => {
          snapTo(0, null);
        },
      }),
    [translateX, snapTo]
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Previous day */}
      <Animated.View
        style={[
          styles.page,
          { transform: [{ translateX: prevTransform }] },
        ]}
      >
        {renderDay(prevDate)}
      </Animated.View>

      {/* Current day */}
      <Animated.View
        style={[
          styles.page,
          { transform: [{ translateX }] },
        ]}
      >
        {renderDay(selectedDate)}
      </Animated.View>

      {/* Next day */}
      <Animated.View
        style={[
          styles.page,
          { transform: [{ translateX: nextTransform }] },
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
