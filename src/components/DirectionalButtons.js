import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const BTN_SIZE = 52;

export default function DirectionalButtons({ onDirection, accentColor = '#00FF41' }) {
  const btn = (dir, label) => (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => onDirection(dir)}
      style={[styles.btn, { borderColor: accentColor + '80' }]}
    >
      <Text style={[styles.arrow, { color: accentColor }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>{btn('UP', '▲')}</View>
      <View style={styles.row}>
        {btn('LEFT', '◀')}
        <View style={styles.center} />
        {btn('RIGHT', '▶')}
      </View>
      <View style={styles.row}>{btn('DOWN', '▼')}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  arrow: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  center: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    margin: 3,
  },
});
