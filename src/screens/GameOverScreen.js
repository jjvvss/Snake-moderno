import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Animated, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getBestScore, setBestScore, addToTotalScore, getColorTheme } from '../utils/storage';
import { t } from '../i18n';
import { COLOR_THEMES } from '../utils/constants';

export default function GameOverScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { score = 0, mode } = route.params || {};

  const [bestScore, setBestScoreState] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [accentColor, setAccentColor] = useState('#00FF41');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const [prev, theme] = await Promise.all([getBestScore(), getColorTheme()]);
      const themeObj = COLOR_THEMES.find((t) => t.id === theme);
      if (themeObj) setAccentColor(themeObj.primary);

      let newBest = prev;
      if (score > prev) {
        newBest = score;
        await setBestScore(score);
        setIsNewRecord(true);
      }
      setBestScoreState(newBest);
      await addToTotalScore(score);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(scoreAnim, { toValue: score, duration: 1200, useNativeDriver: false }),
      ]).start();
    })();
  }, []);

  const animatedScore = scoreAnim.interpolate({
    inputRange: [0, score || 1],
    outputRange: [0, score || 0],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Animated.View
        style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <Text style={styles.title}>{t('gameOver.title')}</Text>

        {isNewRecord && (
          <View style={styles.newRecordBanner}>
            <Text style={styles.newRecordText}>{t('gameOver.newRecord')}</Text>
          </View>
        )}

        <View style={[styles.scoreBox, { borderColor: accentColor + '60' }]}>
          <Text style={styles.scoreLabel}>{t('gameOver.score')}</Text>
          <AnimatedNumber value={score} color={accentColor} />
        </View>

        <View style={[styles.scoreBox, { borderColor: '#FFFFFF20' }]}>
          <Text style={styles.scoreLabel}>{t('gameOver.record')}</Text>
          <Text style={[styles.scoreValue, { color: '#FFFFFF' }]}>{bestScore}</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, { borderColor: accentColor }]}
          onPress={() => navigation.replace('Game', { mode })}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnText, { color: accentColor }]}>{t('gameOver.tryAgain')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}
        >
          <Text style={styles.homeBtnText}>{t('gameOver.home')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

function AnimatedNumber({ value, color }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 1200, useNativeDriver: false }).start();
  }, [value]);

  return (
    <Animated.Text style={[styles.scoreValue, { color }]}>
      {anim.interpolate({ inputRange: [0, value || 1], outputRange: ['0', String(value || 0)] })}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FF0066',
    letterSpacing: 4,
    textShadowColor: '#FF0066',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 24,
  },
  newRecordBanner: {
    backgroundColor: '#1A0A00',
    borderWidth: 1,
    borderColor: '#FF9900',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 20,
  },
  newRecordText: {
    color: '#FF9900',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 2,
  },
  scoreBox: {
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 18,
    marginBottom: 14,
    backgroundColor: '#050505',
  },
  scoreLabel: {
    color: '#888888',
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  btn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
  },
  homeBtn: { paddingVertical: 12 },
  homeBtnText: { color: '#666666', fontSize: 15 },
});
