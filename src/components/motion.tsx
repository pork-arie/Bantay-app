import { useEffect, useState, type ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Fades and slides content up when it first appears; `index` staggers lists. */
export function FadeIn({
  children,
  index = 0,
  style,
}: {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(380).delay(Math.min(index, 10) * 45)} style={style}>
      {children}
    </Animated.View>
  );
}

/** A Pressable that gently shrinks while pressed, like a physical button. */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  ...props
}: Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle>; scaleTo?: number; children: ReactNode }) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 20, stiffness: 400 });
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        props.onPressOut?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** A chart bar that grows from the bottom to `percent` (0–100). */
export function GrowBar({
  percent,
  color,
  style,
  delay = 0,
}: {
  percent: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}) {
  const height = useSharedValue(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      height.value = withTiming(percent, { duration: 600 });
    }, delay);
    return () => clearTimeout(timer);
  }, [percent, delay, height]);
  const animated = useAnimatedStyle(() => ({ height: `${height.value}%` }));
  return <Animated.View style={[style, { backgroundColor: color }, animated]} />;
}

/** Counts up to `value` over a short time, for money totals. */
export function useCountUp(value: number, duration = 700) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    let frame = 0;
    const start = Date.now();
    const from = 0;
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      // Ease out so the number settles gently.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (value - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return shown;
}
