import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
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

/**
 * Swipeable day carousel using a 3-slot circular buffer.
 *
 * After a swipe the slot that slid into view keeps its content — only the
 * off-screen slot is recycled with a new date. This eliminates the flash
 * caused by resetting translateX before React re-renders.
 */
export default function SwipeableDay({ selectedDate, onDateChange, children: renderDay }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  // --- circular-buffer state ------------------------------------------------
  // Three slots, each with its own date.  centerIdx says which is "center".
  const centerIdx = useRef(1);
  const [slotDates, setSlotDates] = useState(() => [
    getDateOffset(selectedDate, -1),
    selectedDate,
    getDateOffset(selectedDate, 1),
  ]);
  const slotDatesRef = useRef(slotDates);
  slotDatesRef.current = slotDates;

  // Stable Animated.Values for each slot's base offset (prev / center / next)
  const slotOffsets = useRef([
    new Animated.Value(-SCREEN_WIDTH),
    new Animated.Value(0),
    new Animated.Value(SCREEN_WIDTH),
  ]).current;

  // Stable Animated.add nodes — created once, never recreated
  const slotTransforms = useRef([
    Animated.add(translateX, slotOffsets[0]),
    Animated.add(translateX, slotOffsets[1]),
    Animated.add(translateX, slotOffsets[2]),
  ]).current;

  const onDateChangeRef = useRef(onDateChange);
  onDateChangeRef.current = onDateChange;

  // --- sync with external date changes (e.g. DateHeader tap) ----------------
  useEffect(() => {
    const centerDate = slotDatesRef.current[centerIdx.current];
    if (selectedDate.getTime() !== centerDate.getTime()) {
      const newDates = [
        getDateOffset(selectedDate, -1),
        selectedDate,
        getDateOffset(selectedDate, 1),
      ];
      setSlotDates(newDates);
      slotDatesRef.current = newDates;
      centerIdx.current = 1;
      slotOffsets[0].setValue(-SCREEN_WIDTH);
      slotOffsets[1].setValue(0);
      slotOffsets[2].setValue(SCREEN_WIDTH);
      translateX.setValue(0);
    }
  }, [selectedDate, slotOffsets, translateX]);

  // --- snap / recycle logic -------------------------------------------------
  const snapTo = useCallback(
    (toValue, direction) => {
      // direction: -1 = next day, 1 = prev day, 0 = snap back
      isAnimating.current = true;

      Animated.timing(translateX, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;

        if (direction === 0) return; // snap-back, nothing to recycle

        const ci = centerIdx.current;
        const dates = slotDatesRef.current;

        if (direction === -1) {
          // Swiped left → go to next day
          const newCenter = (ci + 1) % 3;
          const recycle  = (ci + 2) % 3; // old "prev" → new "next"
          const newCenterDate = dates[newCenter];

          // Reposition slots so the visible page stays in place
          slotOffsets[recycle].setValue(SCREEN_WIDTH);
          slotOffsets[ci].setValue(-SCREEN_WIDTH);
          slotOffsets[newCenter].setValue(0);
          translateX.setValue(0);

          centerIdx.current = newCenter;

          const updated = [...dates];
          updated[recycle] = getDateOffset(newCenterDate, 1);
          setSlotDates(updated);
          slotDatesRef.current = updated;

          onDateChangeRef.current(newCenterDate);
        } else {
          // Swiped right → go to previous day
          const newCenter = (ci + 2) % 3;
          const recycle  = (ci + 1) % 3; // old "next" → new "prev"
          const newCenterDate = dates[newCenter];

          slotOffsets[recycle].setValue(-SCREEN_WIDTH);
          slotOffsets[ci].setValue(SCREEN_WIDTH);
          slotOffsets[newCenter].setValue(0);
          translateX.setValue(0);

          centerIdx.current = newCenter;

          const updated = [...dates];
          updated[recycle] = getDateOffset(newCenterDate, -1);
          setSlotDates(updated);
          slotDatesRef.current = updated;

          onDateChangeRef.current(newCenterDate);
        }
      });
    },
    [translateX, slotOffsets],
  );

  // --- pan responder --------------------------------------------------------
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
          if (dx > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY) {
            snapTo(SCREEN_WIDTH, 1);       // prev day
          } else if (dx < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY) {
            snapTo(-SCREEN_WIDTH, -1);     // next day
          } else {
            snapTo(0, 0);                  // snap back
          }
        },
        onPanResponderTerminate: () => {
          snapTo(0, 0);
        },
      }),
    [translateX, snapTo],
  );

  // --- render ---------------------------------------------------------------
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {slotDates.map((date, i) => (
        <Animated.View
          key={i}
          style={[
            styles.page,
            { transform: [{ translateX: slotTransforms[i] }] },
          ]}
        >
          {renderDay(date)}
        </Animated.View>
      ))}
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
