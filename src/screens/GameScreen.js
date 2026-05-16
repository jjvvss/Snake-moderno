import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  PanResponder, Modal, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useGameLogic } from '../hooks/useGameLogic';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';
import GameBoard from '../components/GameBoard';
import DirectionalButtons from '../components/DirectionalButtons';
import { t } from '../i18n';
import {
  GAME_STATUS, GAME_MODES, POWER_UP_TYPES, SKINS,
  ACTUAL_BOARD_SIZE,
} from '../utils/constants';
import { getSelectedSkin, getSoundEnabled, getVibrationEnabled, getColorTheme } from '../utils/storage';
import { COLOR_THEMES } from '../utils/constants';

const SWIPE_THRESHOLD = 20;

export default function GameScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const mode = route.params?.mode || GAME_MODES.CLASSIC;

  const [skin, setSkin] = useState(SKINS[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [accentColor, setAccentColor] = useState('#00FF41');
  const [paused, setPaused] = useState(false);

  const {
    renderState,
    startGame,
    pauseGame,
    resumeGame,
    changeDirection,
    onEatCallback,
    onDeathCallback,
  } = useGameLogic();

  const haptics = useHaptics(vibrationEnabled);
  const sound = useSound(soundEnabled);

  // Refs to avoid stale closures in callbacks
  const renderStateRef = useRef(renderState);
  renderStateRef.current = renderState;
  const prevLevelRef = useRef(1);

  onEatCallback.current = () => {
    haptics.impact('light');
    sound.play('eat');
    // Detect level-up: level is updated in renderState after eat
    const newLevel = renderStateRef.current.level;
    if (newLevel > prevLevelRef.current) {
      prevLevelRef.current = newLevel;
      sound.play('levelup');
      haptics.notification('success');
    }
  };

  onDeathCallback.current = () => {
    haptics.notification('error');
    sound.play('death');
    setTimeout(() => {
      navigation.replace('GameOver', {
        score: renderStateRef.current.score,
        mode,
      });
    }, 700);
  };

  // Play powerup sound when an active power-up is first collected
  const prevActivePURef = useRef(null);
  useEffect(() => {
    const current = renderState.activePowerUp;
    if (current && !prevActivePURef.current) {
      sound.play('powerup');
      haptics.impact('heavy');
    }
    prevActivePURef.current = current;
  }, [renderState.activePowerUp]);

  useEffect(() => {
    (async () => {
      const [skinId, se, ve, theme] = await Promise.all([
        getSelectedSkin(),
        getSoundEnabled(),
        getVibrationEnabled(),
        getColorTheme(),
      ]);
      setSoundEnabled(se);
      setVibrationEnabled(ve);
      const foundSkin = SKINS.find((s) => s.id === skinId) || SKINS[0];
      setSkin(foundSkin);
      const themeObj = COLOR_THEMES.find((t) => t.id === theme);
      if (themeObj) setAccentColor(themeObj.primary);

      await sound.loadSounds();
      startGame(mode);
    })();
    return () => {};
  }, []);

  const swipeStart = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        swipeStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      },
      onPanResponderRelease: (e) => {
        const dx = e.nativeEvent.pageX - swipeStart.current.x;
        const dy = e.nativeEvent.pageY - swipeStart.current.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;
        if (absDx > absDy) {
          changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
          changeDirection(dy > 0 ? 'DOWN' : 'UP');
        }
      },
    })
  ).current;

  const handlePause = () => {
    if (renderState.status === GAME_STATUS.PLAYING) {
      pauseGame();
      setPaused(true);
    }
  };

  const handleResume = () => {
    setPaused(false);
    resumeGame();
  };

  const handleHome = () => {
    navigation.navigate('Home');
  };

  const activePU = renderState.activePowerUp;
  const puLabel = activePU
    ? activePU.type === POWER_UP_TYPES.TURBO
      ? t('game.powerUp.turbo')
      : activePU.type === POWER_UP_TYPES.INVINCIBILITY
      ? t('game.powerUp.invincibility')
      : t('game.powerUp.doublePoints')
    : null;

  const puColor = activePU
    ? activePU.type === POWER_UP_TYPES.TURBO
      ? '#FFFF00'
      : activePU.type === POWER_UP_TYPES.INVINCIBILITY
      ? '#00FFFF'
      : '#FF00FF'
    : '#FFFFFF';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>{t('game.score')}</Text>
          <Text style={[styles.hudValue, { color: accentColor }]}>{renderState.score}</Text>
        </View>

        {mode === GAME_MODES.TIME_TRIAL && (
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>{t('game.timeLeft')}</Text>
            <Text style={[styles.hudValue, { color: renderState.timeLeft <= 10 ? '#FF0066' : accentColor }]}>
              {renderState.timeLeft}s
            </Text>
          </View>
        )}

        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>{t('game.level')}</Text>
          <Text style={[styles.hudValue, { color: accentColor }]}>{renderState.level}</Text>
        </View>

        <TouchableOpacity onPress={handlePause} style={styles.pauseBtn}>
          <Text style={[styles.pauseText, { color: accentColor }]}>⏸</Text>
        </TouchableOpacity>
      </View>

      {activePU && (
        <View style={[styles.powerUpBanner, { borderColor: puColor }]}>
          <Text style={[styles.powerUpText, { color: puColor }]}>{puLabel}</Text>
        </View>
      )}

      <View style={styles.boardContainer} {...panResponder.panHandlers}>
        <GameBoard
          renderState={renderState}
          skin={skin}
          particles={renderState.particles}
        />
      </View>

      <View style={styles.controls}>
        <DirectionalButtons onDirection={changeDirection} accentColor={accentColor} />
      </View>

      <Modal visible={paused} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={[styles.modalTitle, { color: accentColor }]}>{t('game.paused')}</Text>
            <TouchableOpacity style={[styles.modalBtn, { borderColor: accentColor }]} onPress={handleResume}>
              <Text style={[styles.modalBtnText, { color: accentColor }]}>{t('game.resume')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalHomeBtn} onPress={handleHome}>
              <Text style={styles.modalHomeBtnText}>{t('gameOver.home')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#00FF4120',
  },
  hudItem: { alignItems: 'center', minWidth: 60 },
  hudLabel: { color: '#666666', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  hudValue: { fontSize: 24, fontWeight: 'bold' },
  pauseBtn: { padding: 8 },
  pauseText: { fontSize: 22 },
  powerUpBanner: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 20,
    marginVertical: 4,
  },
  powerUpText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
  boardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 12,
    paddingTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#00FF41',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: 280,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 24,
  },
  modalBtn: {
    width: '100%',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalBtnText: { fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  modalHomeBtn: { paddingVertical: 10 },
  modalHomeBtnText: { color: '#666666', fontSize: 14 },
});
