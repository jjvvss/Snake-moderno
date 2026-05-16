import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import {
  CELL_SIZE, ACTUAL_BOARD_SIZE, POWER_UP_TYPES, GRID_SIZE, FOOD_TYPES, FOOD_COLORS,
} from '../utils/constants';

const OBSTACLE_COLOR = '#1a0000';
const OBSTACLE_BORDER = '#8B0000';
const MOVING_OBS_BORDER = '#FF6600';
const GRID_DOT_COLOR = '#0A1A0A';
const PORTAL_COLOR = '#00FFFF';

function FoodCell({ x, y, type = 'NORMAL' }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  const color = FOOD_COLORS[type] || FOOD_COLORS.NORMAL;
  const pulseMax = type === 'GOLDEN' ? 1.5 : type === 'POISONED' ? 1.15 : 1.35;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: pulseMax, duration: type === 'GOLDEN' ? 300 : 400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: type === 'GOLDEN' ? 300 : 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: type === 'POISONED' ? 0.5 : 0.7, duration: 400, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [type]);

  return (
    <Animated.View style={[
      styles.foodCell,
      {
        left: x * CELL_SIZE + CELL_SIZE * 0.1,
        top: y * CELL_SIZE + CELL_SIZE * 0.1,
        width: CELL_SIZE * 0.8,
        height: CELL_SIZE * 0.8,
        borderRadius: CELL_SIZE * 0.4,
        backgroundColor: color,
        shadowColor: color,
        transform: [{ scale: pulse }],
        opacity,
      },
    ]} />
  );
}

function PortalCell({ portal, phaseOffset = 0 }) {
  const pulse = useRef(new Animated.Value(0.8)).current;
  const rotate = useRef(new Animated.Value(phaseOffset)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        ]),
        Animated.timing(rotate, { toValue: phaseOffset + 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const spin = rotate.interpolate({ inputRange: [phaseOffset, phaseOffset + 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[
      styles.portal,
      {
        left: portal.x * CELL_SIZE,
        top: portal.y * CELL_SIZE,
        width: CELL_SIZE,
        height: CELL_SIZE,
        borderRadius: CELL_SIZE / 2,
        transform: [{ scale: pulse }, { rotate: spin }],
      },
    ]} />
  );
}

function PowerUpCell({ powerUp }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.9, duration: 500, useNativeDriver: true }),
        ]),
        Animated.timing(rotate, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const color =
    powerUp.type === POWER_UP_TYPES.TURBO ? '#FFFF00' :
    powerUp.type === POWER_UP_TYPES.INVINCIBILITY ? '#00FFFF' : '#FF00FF';
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[
      styles.powerUpCell,
      {
        left: powerUp.x * CELL_SIZE + CELL_SIZE * 0.1,
        top: powerUp.y * CELL_SIZE + CELL_SIZE * 0.1,
        width: CELL_SIZE * 0.8,
        height: CELL_SIZE * 0.8,
        backgroundColor: color,
        shadowColor: color,
        transform: [{ scale: pulse }, { rotate: spin }],
      },
    ]} />
  );
}

function DeathFlash({ visible }) {
  const flashAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(flashAnim, { toValue: visible ? 0.5 : 0, duration: 80, useNativeDriver: true }).start();
  }, [visible]);
  return (
    <Animated.View pointerEvents="none" style={[styles.deathFlash, { opacity: flashAnim }]} />
  );
}

function Particle({ particle }) {
  const anims = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const animations = anims.map((anim, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const distance = CELL_SIZE * 1.5;
      return Animated.parallel([
        Animated.timing(anim.x, { toValue: Math.cos(angle) * distance, duration: 500, useNativeDriver: true }),
        Animated.timing(anim.y, { toValue: Math.sin(angle) * distance, duration: 500, useNativeDriver: true }),
        Animated.timing(anim.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]);
    });
    Animated.parallel(animations).start();
  }, []);

  const cx = particle.gridX * CELL_SIZE + CELL_SIZE / 2;
  const cy = particle.gridY * CELL_SIZE + CELL_SIZE / 2;

  return (
    <>
      {anims.map((anim, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          left: cx - 3, top: cy - 3,
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: particle.color,
          opacity: anim.opacity,
          transform: [{ translateX: anim.x }, { translateY: anim.y }],
        }} />
      ))}
    </>
  );
}

function ComboOverlay({ multiplier }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (multiplier > 1) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [multiplier]);

  const color = multiplier >= 2 ? '#FF00FF' : '#FFFF00';
  const label = multiplier >= 2 ? '\xd72' : multiplier >= 1.5 ? '\xd71.5' : '';

  return (
    <Animated.View pointerEvents="none" style={[styles.comboOverlay, { opacity }]}>
      <Animated.Text style={[styles.comboText, { color, transform: [{ scale }] }]}>
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

export default function GameBoard({ renderState, skin, particles = [], shake = false, accentColor = '#00FF41' }) {
  const { snake, food, obstacles, movingObstacles, portals, powerUpOnBoard, deathFlash, comboMultiplier } = renderState;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shake) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [shake]);

  const gridDots = useMemo(() => {
    const dots = [];
    for (let x = 0; x <= GRID_SIZE; x++) {
      for (let y = 0; y <= GRID_SIZE; y++) {
        dots.push(
          <View key={`d${x}-${y}`} style={{
            position: 'absolute',
            left: x * CELL_SIZE - 1, top: y * CELL_SIZE - 1,
            width: 2, height: 2, borderRadius: 1,
            backgroundColor: GRID_DOT_COLOR,
          }} />
        );
      }
    }
    return dots;
  }, []);

  const scanlines = useMemo(() => {
    const lines = [];
    for (let y = 0; y < ACTUAL_BOARD_SIZE; y += 4) {
      lines.push(
        <View key={`sl${y}`} style={{
          position: 'absolute',
          left: 0, top: y,
          width: ACTUAL_BOARD_SIZE, height: 1,
          backgroundColor: '#000000',
          opacity: 0.08,
        }} />
      );
    }
    return lines;
  }, []);

  const allObstacles = movingObstacles && movingObstacles.length > 0 ? movingObstacles : (obstacles || []);

  return (
    <Animated.View style={[
      styles.board,
      { width: ACTUAL_BOARD_SIZE, height: ACTUAL_BOARD_SIZE },
      { transform: [{ translateX: shakeAnim }] },
    ]}>
      {gridDots}

      {allObstacles.map((obs, i) => (
        <View key={`obs${i}`} style={[
          styles.obstacleCell,
          {
            left: obs.x * CELL_SIZE + 1, top: obs.y * CELL_SIZE + 1,
            width: CELL_SIZE - 2, height: CELL_SIZE - 2,
            borderColor: (obs.dx !== 0 || obs.dy !== 0) ? MOVING_OBS_BORDER : OBSTACLE_BORDER,
          },
        ]} />
      ))}

      {portals && portals.map((portal, i) => (
        <PortalCell key={`portal${i}`} portal={portal} phaseOffset={i === 1 ? 0.5 : 0} />
      ))}

      {food && <FoodCell x={food.x} y={food.y} type={food.type || 'NORMAL'} />}
      {powerUpOnBoard && <PowerUpCell powerUp={powerUpOnBoard} />}

      {snake && snake.map((seg, i) => {
        const isHead = i === 0;
        const tailIdx = snake.length - 1 - i;
        const trailOpacity = tailIdx < 4 ? Math.max(0.2, 0.85 - tailIdx * 0.2) : 1;
        const color = isHead ? skin.headColor : skin.color;
        const size = isHead ? CELL_SIZE - 1 : CELL_SIZE - 2;
        const offset = isHead ? 0.5 : 1;
        return (
          <View key={`s${i}`} style={{
            position: 'absolute',
            left: seg.x * CELL_SIZE + offset,
            top: seg.y * CELL_SIZE + offset,
            width: size, height: size,
            borderRadius: isHead ? CELL_SIZE * 0.3 : CELL_SIZE * 0.2,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isHead ? 0.9 : 0.5,
            shadowRadius: isHead ? 6 : 3,
            elevation: isHead ? 4 : 2,
            opacity: trailOpacity,
          }} />
        );
      })}

      {particles.map(p => <Particle key={p.id} particle={p} />)}

      {/* CRT scanlines overlay */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {scanlines}
      </View>

      <ComboOverlay multiplier={comboMultiplier || 1} />
      <DeathFlash visible={deathFlash} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#00FF4130',
    overflow: 'hidden',
  },
  foodCell: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  portal: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: PORTAL_COLOR,
    backgroundColor: '#00FFFF18',
    shadowColor: PORTAL_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  powerUpCell: {
    position: 'absolute',
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  obstacleCell: {
    position: 'absolute',
    backgroundColor: OBSTACLE_COLOR,
    borderWidth: 1,
    borderRadius: 2,
  },
  deathFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF0000',
  },
  comboOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0, right: 0,
    alignItems: 'center',
  },
  comboText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
