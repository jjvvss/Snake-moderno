import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBestScore, getStreak, updateStreak } from '../utils/storage';
import { t } from '../i18n';
import { GAME_MODES, COLOR_THEMES } from '../utils/constants';

const MODES = [
  { key: GAME_MODES.CLASSIC, labelKey: 'modes.classic', descKey: 'modes.classicDesc' },
  { key: GAME_MODES.TIME_TRIAL, labelKey: 'modes.timeTrial', descKey: 'modes.timeTrialDesc' },
  { key: GAME_MODES.INFINITE, labelKey: 'modes.infinite', descKey: 'modes.infiniteDesc' },
  { key: GAME_MODES.DAILY, labelKey: 'modes.daily', descKey: 'modes.dailyDesc' },
];

export default function HomeScreen({ navigation }) {
  const [bestScore, setBestScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedMode, setSelectedMode] = useState(GAME_MODES.CLASSIC);
  const [accentColor, setAccentColor] = useState('#00FF41');
  const titleAnim = React.useRef(new Animated.Value(0)).current;
  const glowAnim = React.useRef(new Animated.Value(0.6)).current;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const score = await getBestScore();
        setBestScore(score);
        const s = await updateStreak();
        setStreak(s);
      })();
    }, [])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, []);

  const handlePlay = () => {
    navigation.navigate('Game', { mode: selectedMode });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        <View style={styles.titleSection}>
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: titleAnim,
                transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
              },
            ]}
          >
            {t('home.title')}
          </Animated.Text>
          <Animated.View style={[styles.titleUnderline, { opacity: glowAnim }]} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('home.bestScore')}</Text>
            <Text style={styles.statValue}>{bestScore}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('home.streak')}</Text>
            <Text style={styles.statValue}>{streak} {'🔥'}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('home.selectMode')}</Text>
        <View style={styles.modeContainer}>
          {MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.modeBtn,
                selectedMode === mode.key && styles.modeBtnActive,
              ]}
              onPress={() => setSelectedMode(mode.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeName, selectedMode === mode.key && styles.modeNameActive]}>
                {t(mode.labelKey)}
              </Text>
              <Text style={styles.modeDesc}>{t(mode.descKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.playBtn} onPress={handlePlay} activeOpacity={0.8}>
          <Text style={styles.playText}>{t('home.play')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsText}>{'⚙'}  {t('home.settings')}</Text>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
            <Text style={styles.bottomLink}>{'📊'} {t('home.stats')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
            <Text style={styles.bottomLink}>{'🏆'} {t('home.achievements')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  titleSection: { alignItems: 'center', marginBottom: 24 },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#00FF41',
    letterSpacing: 6,
    textShadowColor: '#00FF41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleUnderline: {
    width: 200,
    height: 2,
    backgroundColor: '#00FF41',
    marginTop: 8,
    shadowColor: '#00FF41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#0D1A0D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00FF4130',
    padding: 16,
    width: '100%',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#888888', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  statValue: { color: '#00FF41', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#00FF4130' },
  sectionLabel: {
    color: '#888888',
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  modeContainer: { width: '100%', marginBottom: 20 },
  modeBtn: {
    borderWidth: 1,
    borderColor: '#1a2a1a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    backgroundColor: '#050A05',
  },
  modeBtnActive: {
    borderColor: '#00FF41',
    backgroundColor: '#0D1A0D',
  },
  modeName: { color: '#666666', fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  modeNameActive: { color: '#00FF41' },
  modeDesc: { color: '#444444', fontSize: 11 },
  playBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00FF41',
    backgroundColor: '#001A00',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#00FF41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  playText: {
    color: '#00FF41',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 6,
  },
  settingsBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  settingsText: { color: '#888888', fontSize: 15, letterSpacing: 1 },
  bottomRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 8,
    paddingVertical: 8,
  },
  bottomLink: {
    color: '#666666',
    fontSize: 14,
    letterSpacing: 1,
  },
});
