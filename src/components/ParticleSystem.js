import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { CELL_SIZE } from '../utils/constants';

export default function ParticleSystem({ particles }) {
  return (
    <>
      {particles.map((p) => (
        <BurstParticle key={p.id} particle={p} />
      ))}
    </>
  );
}

function BurstParticle({ particle }) {
  const anims = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      op: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const animations = anims.map((a, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const d = CELL_SIZE * 1.2;
      return Animated.parallel([
        Animated.timing(a.x, { toValue: Math.cos(angle) * d, duration: 450, useNativeDriver: true }),
        Animated.timing(a.y, { toValue: Math.sin(angle) * d, duration: 450, useNativeDriver: true }),
        Animated.timing(a.op, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]);
    });
    Animated.parallel(animations).start();
  }, []);

  const cx = particle.gridX * CELL_SIZE + CELL_SIZE / 2 - 3;
  const cy = particle.gridY * CELL_SIZE + CELL_SIZE / 2 - 3;

  return (
    <>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: particle.color || '#FF0066',
            opacity: a.op,
            transform: [{ translateX: a.x }, { translateY: a.y }],
          }}
        />
      ))}
    </>
  );
}
