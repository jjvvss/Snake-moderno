import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getStats, getColorTheme } from '../utils/storage';
import { COLOR_THEMES } from '../utils/constants';
import { t } from '../i18n';

function formatTimePlayed(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function StatsScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState({ gamesPlayed: 0, foodsEaten: 0, timePlayed: 0, maxLength: 3 });
  const [accentColor, setAccentColor] = useState('#00FF41');

  useEffect(() => {
    (async () => {
      const [s, theme] = await Promise.all([
        getStats(),
        getColorTheme(),
      ]);
      setStats(s);
      const themeObj = COLOR_THEMES.find((c) => c.id === theme);
      if (themeObj) setAccentColor(themeObj.primary);
    })();
  }, []);

  const statItems = [
    { labelKey: 'stats.gamesPlayed', value: String(stats.gamesPlayed) },
    { labelKey: 'stats.totalFoods', value: String(stats.foodsEaten) },
    { labelKey: 'stats.bestLength', value: String(stats.maxLength) },
    { labelKey: 'stats.timePlayed', value: formatTimePlayed(stats.timePlayed) },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: accentColor }]}>{'←'} {t('stats.back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: accentColor }]}>{t('stats.title')}</Text>
          <View style={{ width: 80 }} />
        </View>

        <View style={styles.statsGrid}>
          {statItems.map((item) => (
            <View
              key={item.labelKey}
              style={[styles.statCard, { borderColor: accentColor + '30' }]}
            >
              <Text style={[styles.statValue, { color: accentColor }]}>{item.value}</Text>
              <Text style={styles.statLabel}>{t(item.labelKey)}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 24,
  },
  backBtn: { width: 80 },
  backText: { fontSize: 14 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '46%',
    backgroundColor: '#050505',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 8,
  },
  statLabel: {
    color: '#888888',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
