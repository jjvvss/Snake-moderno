import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const GRID_SIZE = 20;
export const BOARD_PADDING = 16;
export const BOARD_SIZE = Math.min(SCREEN_WIDTH - BOARD_PADDING * 2, SCREEN_HEIGHT * 0.52);
export const CELL_SIZE = Math.floor(BOARD_SIZE / GRID_SIZE);
export const ACTUAL_BOARD_SIZE = CELL_SIZE * GRID_SIZE;

export const INITIAL_SPEED = 200;
export const MIN_SPEED = 80;
export const SPEED_MILESTONE = 5;

export const GAME_MODES = {
  CLASSIC: 'CLASSIC',
  TIME_TRIAL: 'TIME_TRIAL',
  INFINITE: 'INFINITE',
  DAILY: 'DAILY',
};

export const GAME_STATUS = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
};

export const DIRECTIONS = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

export const POWER_UP_TYPES = {
  TURBO: 'TURBO',
  INVINCIBILITY: 'INVINCIBILITY',
  DOUBLE_POINTS: 'DOUBLE_POINTS',
};

export const POWER_UP_DURATION = 4000;
export const POWER_UP_LIFETIME = 8000;
export const POWER_UP_SPAWN_CHANCE = 0.2;
export const POINTS_PER_FOOD = 10;
export const LEVEL_THRESHOLD = 50;

// Food types
export const FOOD_TYPES = { NORMAL: 'NORMAL', GOLDEN: 'GOLDEN', POISONED: 'POISONED' };
export const FOOD_GOLDEN_CHANCE = 0.10;
export const FOOD_POISONED_CHANCE = 0.06;
export const FOOD_POINTS = { NORMAL: 10, GOLDEN: 30, POISONED: -5 };
export const FOOD_COLORS = { NORMAL: '#FF0066', GOLDEN: '#FFD700', POISONED: '#8800CC' };

// Time Trial (inverse countdown)
export const TIME_TRIAL_START = 30;   // starting seconds
export const TIME_TRIAL_MAX = 90;     // cap
export const TIME_PER_FOOD = { NORMAL: 7, GOLDEN: 14, POISONED: 0 };

// Combo
export const COMBO_WINDOW_MS = 5000;
export const COMBO_THRESHOLDS = [{ count: 5, mult: 2 }, { count: 3, mult: 1.5 }];

// Portals (unlock at level 3)
export const PORTAL_UNLOCK_LEVEL = 3;
export const PORTAL_COOLDOWN_TICKS = 10;

// Moving obstacles (level 6+)
export const MOVING_OBS_LEVEL = 6;
export const MOVING_OBS_TICKS = 3; // move every N ticks

// Countdown before game
export const COUNTDOWN_SECONDS = 3;

// Achievements
export const ACHIEVEMENTS = [
  { id: 'first_game', nameKey: 'achievements.firstGame', descKey: 'achievements.firstGameDesc', icon: '🎮' },
  { id: 'score_100', nameKey: 'achievements.score100', descKey: 'achievements.score100Desc', icon: '💯' },
  { id: 'long_snake', nameKey: 'achievements.longSnake', descKey: 'achievements.longSnakeDesc', icon: '🐍' },
  { id: 'speed_demon', nameKey: 'achievements.speedDemon', descKey: 'achievements.speedDemonDesc', icon: '⚡' },
  { id: 'golden_touch', nameKey: 'achievements.goldenTouch', descKey: 'achievements.goldenTouchDesc', icon: '✨' },
  { id: 'veteran', nameKey: 'achievements.veteran', descKey: 'achievements.veteranDesc', icon: '🏆' },
  { id: 'survivor', nameKey: 'achievements.survivor', descKey: 'achievements.survivorDesc', icon: '⏱' },
  { id: 'collector', nameKey: 'achievements.collector', descKey: 'achievements.collectorDesc', icon: '💎' },
];

export const SKINS = [
  { id: 'default', nameKey: 'skins.default', color: '#00FF41', headColor: '#00FF41', glowColor: '#00FF4180', unlockScore: 0 },
  { id: 'cyber', nameKey: 'skins.cyber', color: '#00BFFF', headColor: '#00FFFF', glowColor: '#00BFFF80', unlockScore: 100 },
  { id: 'purple', nameKey: 'skins.purple', color: '#BF00FF', headColor: '#DF00FF', glowColor: '#BF00FF80', unlockScore: 250 },
  { id: 'fire', nameKey: 'skins.fire', color: '#FF6600', headColor: '#FF9900', glowColor: '#FF660080', unlockScore: 500 },
  { id: 'rainbow', nameKey: 'skins.rainbow', color: '#FF00FF', headColor: '#FF66FF', glowColor: '#FF00FF80', unlockScore: 1000 },
];

export const COLOR_THEMES = [
  { id: 'green', label: 'Green', primary: '#00FF41', accent: '#00FF41' },
  { id: 'blue', label: 'Blue', primary: '#00BFFF', accent: '#00BFFF' },
  { id: 'purple', label: 'Purple', primary: '#BF00FF', accent: '#BF00FF' },
  { id: 'orange', label: 'Orange', primary: '#FF6600', accent: '#FF6600' },
];
