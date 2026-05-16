import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Switch, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  getSoundEnabled, setSoundEnabled,
  getVibrationEnabled, setVibrationEnabled,
  getColorTheme, setColorTheme,
  getLanguage, setLanguage,
  getSelectedSkin, setSelectedSkin,
  getTotalScore,
} from '../utils/storage';
import { t, setLocale, SUPPORTED_LANGUAGES } from '../i18n';
import { SKINS, COLOR_THEMES } from '../utils/constants';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [theme, setTheme] = useState('green');
  const [language, setLangState] = useState('en');
  const [selectedSkinId, setSelectedSkinId] = useState('default');
  const [totalScore, setTotalScore] = useState(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    (async () => {
      const [s, v, th, lang, skinId, ts] = await Promise.all([
        getSoundEnabled(),
        getVibrationEnabled(),
        getColorTheme(),
        getLanguage(),
        getSelectedSkin(),
        getTotalScore(),
      ]);
      setSound(s);
      setVibration(v);
      setTheme(th || 'green');
      setLangState(lang || 'en');
      setSelectedSkinId(skinId || 'default');
      setTotalScore(ts || 0);
    })();
  }, []);

  const handleSoundToggle = async (val) => {
    setSound(val);
    await setSoundEnabled(val);
  };

  const handleVibrationToggle = async (val) => {
    setVibration(val);
    await setVibrationEnabled(val);
  };

  const handleTheme = async (id) => {
    setTheme(id);
    await setColorTheme(id);
  };

  const handleLanguage = async (code) => {
    setLangState(code);
    await setLanguage(code);
    setLocale(code);
    forceUpdate((n) => n + 1);
  };

  const handleSkin = async (id) => {
    const skinData = SKINS.find((s) => s.id === id);
    if (skinData && totalScore >= skinData.unlockScore) {
      setSelectedSkinId(id);
      await setSelectedSkin(id);
    }
  };

  const accentColor = COLOR_THEMES.find((c) => c.id === theme)?.primary || '#00FF41';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: accentColor }]}>← {t('settings.back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: accentColor }]}>{t('settings.title')}</Text>
          <View style={{ width: 80 }} />
        </View>

        {/* Sound */}
        <View style={[styles.card, { borderColor: accentColor + '30' }]}>
          <Text style={styles.cardLabel}>{t('settings.sound')}</Text>
          <Switch
            value={sound}
            onValueChange={handleSoundToggle}
            trackColor={{ false: '#333', true: accentColor + '80' }}
            thumbColor={sound ? accentColor : '#666'}
          />
        </View>

        {/* Vibration */}
        <View style={[styles.card, { borderColor: accentColor + '30' }]}>
          <Text style={styles.cardLabel}>{t('settings.vibration')}</Text>
          <Switch
            value={vibration}
            onValueChange={handleVibrationToggle}
            trackColor={{ false: '#333', true: accentColor + '80' }}
            thumbColor={vibration ? accentColor : '#666'}
          />
        </View>

        {/* Color Theme */}
        <View style={[styles.section, { borderColor: accentColor + '30' }]}>
          <Text style={styles.sectionLabel}>{t('settings.colorTheme')}</Text>
          <View style={styles.themeRow}>
            {COLOR_THEMES.map((ct) => (
              <TouchableOpacity
                key={ct.id}
                onPress={() => handleTheme(ct.id)}
                style={[
                  styles.themeCircle,
                  { backgroundColor: ct.primary },
                  theme === ct.id && styles.themeCircleActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Language */}
        <View style={[styles.section, { borderColor: accentColor + '30' }]}>
          <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
          <View style={styles.langGrid}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguage(lang.code)}
                style={[
                  styles.langBtn,
                  language === lang.code && { borderColor: accentColor, backgroundColor: accentColor + '15' },
                ]}
              >
                <Text style={[styles.langText, language === lang.code && { color: accentColor }]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Skins */}
        <View style={[styles.section, { borderColor: accentColor + '30' }]}>
          <Text style={styles.sectionLabel}>{t('settings.skins')}</Text>
          <View style={styles.skinsGrid}>
            {SKINS.map((sk) => {
              const unlocked = totalScore >= sk.unlockScore;
              const selected = selectedSkinId === sk.id;
              return (
                <TouchableOpacity
                  key={sk.id}
                  onPress={() => handleSkin(sk.id)}
                  style={[
                    styles.skinCard,
                    selected && { borderColor: sk.color },
                    !unlocked && styles.skinLocked,
                  ]}
                >
                  <View style={[styles.skinPreview, { backgroundColor: sk.color }]} />
                  <Text style={[styles.skinName, { color: unlocked ? sk.color : '#444' }]}>
                    {t(sk.nameKey)}
                  </Text>
                  {!unlocked && (
                    <Text style={styles.skinUnlock}>
                      {t('skins.unlockAt', { score: sk.unlockScore })}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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
  title: { fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#050505',
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    marginBottom: 10,
  },
  cardLabel: { color: '#CCCCCC', fontSize: 16, fontWeight: '600' },
  section: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    marginBottom: 10,
  },
  sectionLabel: {
    color: '#888888',
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  themeRow: { flexDirection: 'row', gap: 14 },
  themeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCircleActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 20,
    backgroundColor: '#0A0A0A',
  },
  langText: { color: '#666666', fontSize: 13 },
  skinsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skinCard: {
    width: '46%',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  skinLocked: { opacity: 0.5 },
  skinPreview: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginBottom: 6,
  },
  skinName: { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  skinUnlock: { color: '#555555', fontSize: 10, textAlign: 'center' },
});
