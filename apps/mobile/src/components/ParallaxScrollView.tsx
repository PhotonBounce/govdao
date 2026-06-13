import { ReactNode, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

interface ParallaxScrollViewProps {
  contentContainerStyle?: StyleProp<ViewStyle>;
  heroContent?: ReactNode;
  heroContainerStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function ParallaxScrollView({ contentContainerStyle, heroContent, heroContainerStyle, children }: ParallaxScrollViewProps) {
  const scrollY = useRef(new Animated.Value(0)).current;

  const parallaxY = scrollY.interpolate({
    inputRange: [0, 400],
    outputRange: [0, 110],
    extrapolate: "clamp",
  });

  return (
    <Animated.ScrollView
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
