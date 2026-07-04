import { ReactNode, useRef, forwardRef, useImperativeHandle } from "react";
import { Animated, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleProp, ViewStyle } from "react-native";

export interface ParallaxScrollViewHandle {
  scrollTo: (y: number) => void;
  /** Current scroll offset — lets callers save/restore their place. */
  getOffset: () => number;
}

interface ParallaxScrollViewProps {
  contentContainerStyle?: StyleProp<ViewStyle>;
  heroContent?: ReactNode;
  heroContainerStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export const ParallaxScrollView = forwardRef<ParallaxScrollViewHandle, ParallaxScrollViewProps>(
  function ParallaxScrollView({ contentContainerStyle, heroContent, heroContainerStyle, children }, ref) {
    const scrollY = useRef(new Animated.Value(0)).current;
    const offsetRef = useRef(0);
    const scrollRef = useRef<ScrollView>(null);

    useImperativeHandle(ref, () => ({
      scrollTo: (y: number) => {
        scrollRef.current?.scrollTo({ y, animated: true });
      },
      getOffset: () => offsetRef.current,
    }));

    const parallaxY = scrollY.interpolate({
      inputRange: [0, 400],
      outputRange: [0, 110],
      extrapolate: "clamp",
    });

    // Fade the hero out as it parallaxes so it never shows as a half-clipped
    // slice under the nav row when views land at the post-hero offset.
    const heroOpacity = scrollY.interpolate({
      inputRange: [0, 280],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.ScrollView
        ref={scrollRef as any}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
              offsetRef.current = event.nativeEvent.contentOffset.y;
            },
          }
        )}
        contentContainerStyle={contentContainerStyle}
      >
        {heroContent !== undefined ? (
          <Animated.View style={[heroContainerStyle, { opacity: heroOpacity, transform: [{ translateY: parallaxY }] }]}>
            {heroContent}
          </Animated.View>
        ) : null}
        {children}
      </Animated.ScrollView>
    );
  }
);
