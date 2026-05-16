import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Animated, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  getBestScore, setBestScore, addToTotalScore, getColorTheme,
  updateStats, unlockAchievement, getStats,
} from '../utils/storage';
import { t } from '../i18n';
import { COLOR_THEMES, ACHIEVEMENTS, ACTUAL_BOARD_SIZE, CELL_SIZE } from '../utils/constants';

const MINI_SCALE = 0.35;

function MiniBoard({ replayHistory }) {
  if (!replayHistory || replayHistory.length === 0) return null;
  const lastFrame = replayHistory[replayHistory.length - 1];
  if (!lastFrame) return null;
  const { snake, food } = lastFrame;
  const miniSize = ACTUAL_BOARD_SIZE * MINI_SCALE;

  return (
    <View style={[styles.miniBoard, { width: miniSize, height: miniSize }]}>
      {food && (
        <View style={{
          position: 'absolute',
          left: food.x * CELL_SIZE * MINI_SCALE + CELL_SIZE * MINI_SCALE * 0.1,
          top: food.y * CELL_SIZE * MINI_SCALE + CELL_SIZE * MINI_SCALE * 0.1,
          width: CELL_SIZE * MINI_SCALE * 0.8,
          height: CELL_SIZE * MINI_SCALE * 0.8,
          borderRadius: CELL_SIZE * MINI_SCALE * 0.4,
          backgroundColor: '#FF0066',
        }} />
      )}
      {snake && snake.map((seg, i) => (
        <View key={i} style={{
          position: 'absolute',
          left: seg.x * CELL_SIZE * MINI_SCALE + 0.5,
          top: seg.y * CELL_SIZE * MINI_SCALE + 0.5,
          width: CELL_SIZE * MINI_SCALE - 1,
          height: CELL_SIZE * MINI_SCALE - 1,
          borderRadius: i === 0 ? CELL_SIZE * MINI_SCALE * 0.3 : CELL_SIZE * MINI_SCALE * 0.2,
          backgroundColor: i === 0 ? '#00FF41' : '#00CC33',
          opacity: i === 0 ? 1 : 0.8,
        }} />
      ))}
    </View>
  );
}

export default function GameOverScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    score = 0,
    mode,
    replayHistory = [],
    foodsEaten = 0,
    snakeLength = 3,
    gameStartTime = 0,
  } = route.params || {};

  const [bestScore, setBestScoreState] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [accentColor, setAccentColor] = useState('#00FF41');
  const [newAchievements, setNewAchievements] = useState([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const lastTapRef = useRef(0);

  useEffect(() => {
    (async () => {
      const [prev, theme] = await Promise.all([getBestScore(), getColorTheme()]);
      const themeObj = COLOR_THEMES.find((th) => th.id === theme);
      if (themeObj) setAccentColor(themeObj.primary);

      let newBest = prev;
      if (score > prev) {
        newBest = score;
        await setBestScore(score);
        setIsNewRecord(true);
      }
      setBestScoreState(newBest);
      await addToTotalScore(score);

      // Update stats
      const timePlayed = gameStartTime > 0 ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
      const prevStats = await getStats();
      const newStats = await updateStats({
        gamesPlayed: 1,
        foodsEaten,
        timePlayed,
        maxLength: snakeLength,
      });

      // Achievement unlocks
      const unlocked = [];

      const isFirst = await unlockAchievement('first_game');
      if (isFirst) unlocked.push('first_game');

      if (score >= 100) {
        const u = await unlockAchievement('score_100');
        if (u) unlocked.push('score_100');
      }

      if (snakeLength >= 10) {
        const u = await unlockAchievement('long_snake');
        if (u) unlocked.push('long_snake');
      }

      if (newStats && newStats.gamesPlayed >= 10) {
        const u = await unlockAchievement('veteran');
        if (u) unlocked.push('veteran');
      }

      if (unlocked.length > 0) {
        setNewAchievements(unlocked);
      }

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    })();
  }, []);

  const handleTryAgain = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      navigation.replace('Game', { mode });
      return;
    }
    lastTapRef.current = now;
    navigation.replace('Game', { mode });
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      navigation.replace('Game', { mode });
    }
    lastTapRef.current = now;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={handleDoubleTap}
        activeOpacity={1}
      >
        <Animated.View
          style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={styles.title}>{t('gameOver.title')}</Text>

          {isNewRecord && (
            <View style={styles.newRecordBanner}>
              <Text style={styles.newRecordText}>{t('gameOver.newRecord')}</Text>
            </View>
          )}

          {newAchievements.length > 0 && (
            <View style={styles.achievementBanner}>
              <Text style={styles.achievementTitle}>{t('achievements.unlocked')}</Text>
              {newAchievements.map(id => {
                const ach = ACHIEVEMENTS.find(a => a.id === id);
                return ach ? (
                  <Text key={id} style={styles.achievementItem}>
                    {ach.icon} {t(ach.nameKey)}
                  </Text>
                ) : null;
              })}
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

          {replayHistory && replayHistory.length > 0 && (
            <View style={styles.replayContainer}>
              <Text style={styles.replayLabel}>{'Last Position'}</Text>
              <MiniBoard replayHistory={replayHistory} />
            </View>
          )}

          <Text style={styles.doubleTapHint}>{t('gameOver.tapToRestart')}</Text>

          <TouchableOpacity
            style={[styles.btn, { borderColor: accentColor }]}
            onPress={handleTryAgain}
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
      </TouchableOpacity>
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
    marginBottom: 16,
  },
  newRecordText: {
    color: '#FF9900',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 2,
  },
  achievementBanner: {
    backgroundColor: '#0A0A1A',
    borderWidth: 1,
    borderColor: '#8800CC',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  achievementTitle: {
    color: '#AA44FF',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  achievementItem: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
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
  replayContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  replayLabel: {
    color: '#555555',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  miniBoard: {
    backgroundColor: '#030303',
    borderWidth: 1,
    borderColor: '#00FF4120',
    overflow: 'hidden',
  },
  doubleTapHint: {
    color: '#444444',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginTop: 4,
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
