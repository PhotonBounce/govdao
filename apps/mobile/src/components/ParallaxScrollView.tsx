import { ReactNode, useRef, forwardRef, useImperativeHandle } from "react";
import { Animated, ScrollView, StyleProp, ViewStyle } from "react-native";

export interface ParallaxScrollViewHandle {
  scrollTo: (y: number) => void;
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
    const scrollRef = useRef<ScrollView>(null);

    useImperativeHandle(ref, () => ({
      scrollTo: (y: number) => {
        scrollRef.current?.scrollTo({ y, animated: true });
      },
    }));

    const parallaxY = scrollY.interpolate({
      inputRange: [0, 400],
      outputRange: [0, 110],
      extrapolate: "clamp",
    });

    return (
      <Animated.ScrollView
        ref={scrollRef as any}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={contentContainerStyle}
      >
        {heroContent !== undefined ? (
          <Animated.View style={[heroContainerStyle, { transform: [{ translateY: parallaxY }] }]}>
            {heroContent}
          </Animated.View>
        ) : null}
        {children}
      </Animated.ScrollView>
    );
  }
);
