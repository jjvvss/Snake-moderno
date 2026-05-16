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
};

export const GAME_STATUS = {
  IDLE: 'IDLE',
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
export const TIME_TRIAL_DURATION = 60;
export const POINTS_PER_FOOD = 10;
export const LEVEL_THRESHOLD = 50;

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
