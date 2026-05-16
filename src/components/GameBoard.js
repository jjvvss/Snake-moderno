import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { CELL_SIZE, ACTUAL_BOARD_SIZE, POWER_UP_TYPES, GRID_SIZE } from '../utils/constants';

const OBSTACLE_COLOR = '#1a0000';
const OBSTACLE_BORDER = '#8B0000';
const FOOD_COLOR = '#FF0066';
const GRID_DOT_COLOR = '#0A1A0A';

function FoodCell({ x, y }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.35, duration: 400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 400, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.foodCell,
        {
          left: x * CELL_SIZE + CELL_SIZE * 0.1,
          top: y * CELL_SIZE + CELL_SIZE * 0.1,
          width: CELL_SIZE * 0.8,
          height: CELL_SIZE * 0.8,
          borderRadius: CELL_SIZE * 0.4,
          transform: [{ scale: pulse }],
          opacity,
        },
      ]}
    />
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
    powerUp.type === POWER_UP_TYPES.TURBO
      ? '#FFFF00'
      : powerUp.type === POWER_UP_TYPES.INVINCIBILITY
      ? '#00FFFF'
      : '#FF00FF';

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={[
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
      ]}
    />
  );
}

function DeathFlash({ visible }) {
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(flashAnim, { toValue: 0.5, duration: 80, useNativeDriver: true }).start();
    } else {
      Animated.timing(flashAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start();
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.deathFlash, { opacity: flashAnim }]}
    />
  );
}

function Particle({ particle, cellSize }) {
  const anims = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const animations = anims.map((anim, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const distance = cellSize * 1.5;
      return Animated.parallel([
        Animated.timing(anim.x, { toValue: Math.cos(angle) * distance, duration: 500, useNativeDriver: true }),
        Animated.timing(anim.y, { toValue: Math.sin(angle) * distance, duration: 500, useNativeDriver: true }),
        Animated.timing(anim.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]);
    });
    Animated.parallel(animations).start();
  }, []);

  const cx = particle.gridX * cellSize + cellSize / 2;
  const cy = particle.gridY * cellSize + cellSize / 2;

  return (
    <>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: cx - 3,
            top: cy - 3,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: particle.color,
            opacity: anim.opacity,
            transform: [{ translateX: anim.x }, { translateY: anim.y }],
          }}
        />
      ))}
    </>
  );
}

export default function GameBoard({ renderState, skin, particles = [] }) {
  const { snake, food, obstacles, powerUpOnBoard, deathFlash } = renderState;

  const gridDots = useMemo(() => {
    const dots = [];
    for (let x = 0; x <= GRID_SIZE; x++) {
      for (let y = 0; y <= GRID_SIZE; y++) {
        dots.push(
          <View
            key={`d${x}-${y}`}
            style={{
              position: 'absolute',
              left: x * CELL_SIZE - 1,
              top: y * CELL_SIZE - 1,
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: GRID_DOT_COLOR,
            }}
          />
        );
      }
    }
    return dots;
  }, []);

  return (
    <View style={[styles.board, { width: ACTUAL_BOARD_SIZE, height: ACTUAL_BOARD_SIZE }]}>
      {gridDots}

      {obstacles.map((obs, i) => (
        <View
          key={`obs${i}`}
          style={[
            styles.obstacleCell,
            {
              left: obs.x * CELL_SIZE + 1,
              top: obs.y * CELL_SIZE + 1,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            },
          ]}
        />
      ))}

      {food && <FoodCell x={food.x} y={food.y} />}

      {powerUpOnBoard && <PowerUpCell powerUp={powerUpOnBoard} />}

      {snake.map((seg, i) => {
        const isHead = i === 0;
        const color = isHead ? skin.headColor : skin.color;
        const size = isHead ? CELL_SIZE - 1 : CELL_SIZE - 2;
        const offset = isHead ? 0.5 : 1;
        return (
          <View
            key={`s${i}`}
            style={{
              position: 'absolute',
              left: seg.x * CELL_SIZE + offset,
              top: seg.y * CELL_SIZE + offset,
              width: size,
              height: size,
              borderRadius: isHead ? CELL_SIZE * 0.3 : CELL_SIZE * 0.2,
              backgroundColor: color,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isHead ? 0.9 : 0.5,
              shadowRadius: isHead ? 6 : 3,
              elevation: isHead ? 4 : 2,
            }}
          />
        );
      })}

      {particles.map((p) => (
        <Particle key={p.id} particle={p} cellSize={CELL_SIZE} />
      ))}

      <DeathFlash visible={deathFlash} />
    </View>
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
    backgroundColor: FOOD_COLOR,
    shadowColor: FOOD_COLOR,
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
    borderColor: OBSTACLE_BORDER,
    borderRadius: 2,
  },
  deathFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF0000',
  },
});
