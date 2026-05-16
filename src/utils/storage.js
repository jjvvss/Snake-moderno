import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  BEST_SCORE: '@neon_snake:best_score',
  TOTAL_SCORE: '@neon_snake:total_score',
  SELECTED_SKIN: '@neon_snake:selected_skin',
  SOUND_ENABLED: '@neon_snake:sound_enabled',
  VIBRATION_ENABLED: '@neon_snake:vibration_enabled',
  LANGUAGE: '@neon_snake:language',
  COLOR_THEME: '@neon_snake:color_theme',
  STREAK_LAST_DATE: '@neon_snake:streak_last_date',
  STREAK_COUNT: '@neon_snake:streak_count',
  STATS: '@neon_snake:stats',
  ACHIEVEMENTS: '@neon_snake:achievements',
  TUTORIAL_SHOWN: '@neon_snake:tutorial_shown',
  SWIPE_SENSITIVITY: '@neon_snake:swipe_sensitivity',
  DAILY_SCORE: '@neon_snake:daily_score',
};

// Best Score
export const getBestScore = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.BEST_SCORE);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
};

export const setBestScore = async (score) => {
  try {
    await AsyncStorage.setItem(KEYS.BEST_SCORE, String(score));
  } catch {}
};

// Total Score (cumulative, used for skin unlocks)
export const getTotalScore = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.TOTAL_SCORE);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
};

export const addToTotalScore = async (points) => {
  try {
    const current = await getTotalScore();
    await AsyncStorage.setItem(KEYS.TOTAL_SCORE, String(current + points));
    return current + points;
  } catch {
    return 0;
  }
};

// Selected Skin
export const getSelectedSkin = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.SELECTED_SKIN);
    return val || 'default';
  } catch {
    return 'default';
  }
};

export const setSelectedSkin = async (skinId) => {
  try {
    await AsyncStorage.setItem(KEYS.SELECTED_SKIN, skinId);
  } catch {}
};

// Sound
export const getSoundEnabled = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.SOUND_ENABLED);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
};

export const setSoundEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem(KEYS.SOUND_ENABLED, String(enabled));
  } catch {}
};

// Vibration
export const getVibrationEnabled = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.VIBRATION_ENABLED);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
};

export const setVibrationEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem(KEYS.VIBRATION_ENABLED, String(enabled));
  } catch {}
};

// Language
export const getLanguage = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.LANGUAGE);
    return val || null;
  } catch {
    return null;
  }
};

export const setLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
  } catch {}
};

// Color Theme
export const getColorTheme = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.COLOR_THEME);
    return val || 'green';
  } catch {
    return 'green';
  }
};

export const setColorTheme = async (theme) => {
  try {
    await AsyncStorage.setItem(KEYS.COLOR_THEME, theme);
  } catch {}
};

// Streak
export const getStreak = async () => {
  try {
    const lastDate = await AsyncStorage.getItem(KEYS.STREAK_LAST_DATE);
    const count = await AsyncStorage.getItem(KEYS.STREAK_COUNT);
    return {
      lastDate: lastDate || null,
      count: count ? parseInt(count, 10) : 0,
    };
  } catch {
    return { lastDate: null, count: 0 };
  }
};

export const updateStreak = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { lastDate, count } = await getStreak();

    if (lastDate === today) {
      return count;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newCount;
    if (lastDate === yesterdayStr) {
      newCount = count + 1;
    } else {
      newCount = 1;
    }

    await AsyncStorage.setItem(KEYS.STREAK_LAST_DATE, today);
    await AsyncStorage.setItem(KEYS.STREAK_COUNT, String(newCount));
    return newCount;
  } catch {
    return 0;
  }
};

// Stats: { gamesPlayed, foodsEaten, timePlayed (seconds), maxLength }
export const getStats = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.STATS);
    return val ? JSON.parse(val) : { gamesPlayed: 0, foodsEaten: 0, timePlayed: 0, maxLength: 3 };
  } catch { return { gamesPlayed: 0, foodsEaten: 0, timePlayed: 0, maxLength: 3 }; }
};

export const updateStats = async (delta) => {
  try {
    const current = await getStats();
    const updated = {
      gamesPlayed: current.gamesPlayed + (delta.gamesPlayed || 0),
      foodsEaten: current.foodsEaten + (delta.foodsEaten || 0),
      timePlayed: current.timePlayed + (delta.timePlayed || 0),
      maxLength: Math.max(current.maxLength, delta.maxLength || 0),
    };
    await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(updated));
    return updated;
  } catch { return null; }
};

// Achievements: array of unlocked IDs with timestamps
export const getAchievements = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
    return val ? JSON.parse(val) : [];
  } catch { return []; }
};

export const unlockAchievement = async (id) => {
  try {
    const current = await getAchievements();
    if (current.find(a => a.id === id)) return false; // already unlocked
    const updated = [...current, { id, unlockedAt: new Date().toISOString() }];
    await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(updated));
    return true; // newly unlocked
  } catch { return false; }
};

// Tutorial
export const getTutorialShown = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.TUTORIAL_SHOWN);
    return val === 'true';
  } catch { return false; }
};

export const setTutorialShown = async () => {
  try { await AsyncStorage.setItem(KEYS.TUTORIAL_SHOWN, 'true'); } catch {}
};

// Swipe sensitivity (threshold in px, default 20)
export const getSwipeSensitivity = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.SWIPE_SENSITIVITY);
    return val ? parseInt(val, 10) : 20;
  } catch { return 20; }
};

export const setSwipeSensitivity = async (value) => {
  try { await AsyncStorage.setItem(KEYS.SWIPE_SENSITIVITY, String(value)); } catch {}
};

// Daily Challenge score: { date: 'YYYY-MM-DD', score: number }
export const getDailyScore = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.DAILY_SCORE);
    return val ? JSON.parse(val) : { date: '', score: 0 };
  } catch { return { date: '', score: 0 }; }
};

export const setDailyScore = async (score) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(KEYS.DAILY_SCORE, JSON.stringify({ date: today, score }));
  } catch {}
};
