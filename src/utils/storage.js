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
