import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme/theme';

export default function SplashScreen({ navigation }) {
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introScale = useRef(new Animated.Value(0.72)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslate = useRef(new Animated.Value(24)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(introOpacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(introScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(brandOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(brandTranslate, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(dotsOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(900),
    ]).start(() => navigation.replace('Main'));

    return undefined;
  }, [brandOpacity, brandTranslate, dotsOpacity, introOpacity, introScale, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <Animated.View style={[styles.hero, { opacity: introOpacity, transform: [{ scale: introScale }] }]}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>M</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.welcome, { opacity: brandOpacity, transform: [{ translateY: brandTranslate }] }]}>
        <Text style={styles.welcomeText}>أهلًا بك في</Text>
        <View style={styles.brandName}>
          <Text style={styles.brandPrimary}>MY</Text>
          <Text style={styles.brandSecondary}>BRAND</Text>
        </View>
        <Text style={styles.tagline}>كل اللي بتحبه... أقرب ليك.</Text>
        <Text style={styles.actions}>اكتشف  •  اختار  •  اطلب</Text>
      </Animated.View>

      <Animated.View style={[styles.loadingDots, { opacity: dotsOpacity }]}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  glowOne: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,210,63,0.12)', top: -90, right: -80 },
  glowTwo: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)', bottom: -80, left: -70 },
  hero: { alignItems: 'center', marginBottom: 24 },
  logoMark: { width: 118, height: 118, borderRadius: 32, borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  logoLetter: { fontSize: 66, fontWeight: '900', color: colors.primary, lineHeight: 74 },
  welcome: { alignItems: 'center' },
  welcomeText: { color: colors.white, fontSize: 18, fontWeight: '600', marginBottom: 7 },
  brandName: { flexDirection: 'row', alignItems: 'center' },
  brandPrimary: { ...typography.h1, color: colors.accent, fontWeight: '900', letterSpacing: 4 },
  brandSecondary: { ...typography.h1, color: colors.white, fontWeight: '900', letterSpacing: 4 },
  tagline: { color: colors.white, fontSize: 15, fontWeight: '600', marginTop: 13 },
  actions: { color: colors.accent, fontSize: 12, fontWeight: '700', marginTop: 8, letterSpacing: 0.4 },
  loadingDots: { flexDirection: 'row', alignItems: 'center', gap: 9, position: 'absolute', bottom: 48 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,210,63,0.4)' },
  activeDot: { backgroundColor: colors.accent },
});
