import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAchievements, getColorTheme } from '../utils/storage';
import { ACHIEVEMENTS, COLOR_THEMES } from '../utils/constants';
import { t } from '../i18n';

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const [unlockedList, setUnlockedList] = useState([]);
  const [accentColor, setAccentColor] = useState('#00FF41');

  useEffect(() => {
    (async () => {
      const [achievements, theme] = await Promise.all([
        getAchievements(),
        getColorTheme(),
      ]);
      setUnlockedList(achievements);
      const themeObj = COLOR_THEMES.find((c) => c.id === theme);
      if (themeObj) setAccentColor(themeObj.primary);
    })();
  }, []);

  const unlockedIds = new Set(unlockedList.map(a => a.id));

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: accentColor }]}>{'←'} {t('stats.back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: accentColor }]}>{t('achievements.title')}</Text>
          <View style={{ width: 80 }} />
        </View>

        <Text style={styles.progressText}>
          {unlockedIds.size} / {ACHIEVEMENTS.length}
        </Text>

        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = unlockedIds.has(ach.id);
          const unlockedEntry = unlockedList.find(u => u.id === ach.id);

          return (
            <View
              key={ach.id}
              style={[
                styles.achCard,
                {
                  borderColor: isUnlocked ? accentColor + '60' : '#1a1a1a',
                  opacity: isUnlocked ? 1 : 0.3,
                },
              ]}
            >
              <Text style={styles.achIcon}>{ach.icon}</Text>
              <View style={styles.achInfo}>
                <Text style={[styles.achName, { color: isUnlocked ? accentColor : '#666666' }]}>
                  {t(ach.nameKey)}
                </Text>
                <Text style={styles.achDesc}>{t(ach.descKey)}</Text>
                {isUnlocked && unlockedEntry && (
                  <Text style={styles.achDate}>{formatDate(unlockedEntry.unlockedAt)}</Text>
                )}
              </View>
              {isUnlocked && (
                <View style={[styles.checkBadge, { backgroundColor: accentColor }]}>
                  <Text style={styles.checkMark}>{'✓'}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 8,
  },
  backBtn: { width: 80 },
  backText: { fontSize: 14 },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  progressText: {
    color: '#555555',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20,
  },
  achCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050505',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  achIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  achInfo: {
    flex: 1,
  },
  achName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  achDesc: {
    color: '#666666',
    fontSize: 12,
  },
  achDate: {
    color: '#444444',
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 1,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  checkMark: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});
