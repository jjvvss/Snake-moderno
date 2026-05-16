import {
  GRID_SIZE,
  DIRECTIONS,
  INITIAL_SPEED,
  MIN_SPEED,
  SPEED_MILESTONE,
  POWER_UP_TYPES,
} from './constants';

// Generate a random food position not overlapping snake, obstacles, or power-up
export const generateFood = (snake, obstacles = [], powerUp = null) => {
  const occupied = new Set();

  snake.forEach(({ x, y }) => occupied.add(`${x},${y}`));
  obstacles.forEach(({ x, y }) => occupied.add(`${x},${y}`));
  if (powerUp) occupied.add(`${powerUp.x},${powerUp.y}`);

  const free = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) {
        free.push({ x, y });
      }
    }
  }

  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(Math.random() * free.length)];
};

// Generate obstacles for the current level
export const generateObstacles = (level, snake = []) => {
  if (level <= 1) return [];

  const count = Math.min((level - 1) * 2, 20);
  const occupied = new Set();

  snake.forEach(({ x, y }) => occupied.add(`${x},${y}`));

  // Keep center area clear (5x5 around center)
  const centerX = Math.floor(GRID_SIZE / 2);
  const centerY = Math.floor(GRID_SIZE / 2);
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      occupied.add(`${centerX + dx},${centerY + dy}`);
    }
  }

  const obstacles = [];
  let attempts = 0;

  while (obstacles.length < count && attempts < 200) {
    attempts++;
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    const key = `${x},${y}`;

    if (!occupied.has(key)) {
      occupied.add(key);
      obstacles.push({ x, y });
    }
  }

  return obstacles;
};

// Get the next head position, wrapping if wrap=true
export const getNextPosition = (head, direction, wrap = false) => {
  let { x, y } = head;

  switch (direction) {
    case DIRECTIONS.UP:
      y -= 1;
      break;
    case DIRECTIONS.DOWN:
      y += 1;
      break;
    case DIRECTIONS.LEFT:
      x -= 1;
      break;
    case DIRECTIONS.RIGHT:
      x += 1;
      break;
  }

  if (wrap) {
    x = ((x % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
    y = ((y % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
  }

  return { x, y };
};

// Check if position is out of grid bounds
export const checkWallCollision = (pos) => {
  return pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE;
};

// Check if position hits snake body (excluding head at index 0)
export const checkSelfCollision = (head, snake) => {
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) return true;
  }
  return false;
};

// Check if position hits any obstacle
export const checkObstacleCollision = (pos, obstacles = []) => {
  return obstacles.some((o) => o.x === pos.x && o.y === pos.y);
};

// Check if two directions are opposite (180 degrees)
export const isOppositeDirection = (dir1, dir2) => {
  if (dir1 === DIRECTIONS.UP && dir2 === DIRECTIONS.DOWN) return true;
  if (dir1 === DIRECTIONS.DOWN && dir2 === DIRECTIONS.UP) return true;
  if (dir1 === DIRECTIONS.LEFT && dir2 === DIRECTIONS.RIGHT) return true;
  if (dir1 === DIRECTIONS.RIGHT && dir2 === DIRECTIONS.LEFT) return true;
  return false;
};

// Create the initial snake (3 cells, centered, moving right)
export const getInitialSnake = () => {
  const centerX = Math.floor(GRID_SIZE / 2);
  const centerY = Math.floor(GRID_SIZE / 2);
  return [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];
};

// Calculate game speed based on foods eaten and active power-up
export const calculateSpeed = (foodsEaten, activePowerUpType = null) => {
  const speedReductions = Math.floor(foodsEaten / SPEED_MILESTONE);
  let speed = Math.max(INITIAL_SPEED - speedReductions * 10, MIN_SPEED);

  if (activePowerUpType === POWER_UP_TYPES.TURBO) {
    speed = Math.max(Math.floor(speed / 2), MIN_SPEED);
  }

  return speed;
};

// Typed food generation
export const generateTypedFood = (snake, obstacles, powerUp) => {
  const pos = generateFood(snake, obstacles, powerUp);
  const r = Math.random();
  let type = 'NORMAL';
  if (r < 0.06) type = 'POISONED';
  else if (r < 0.16) type = 'GOLDEN';
  return { ...pos, type };
};

// Portal generation (2 portals far apart)
export const generatePortals = (snake, obstacles, food) => {
  const occupied = new Set([
    ...snake.map(s => `${s.x},${s.y}`),
    ...obstacles.map(o => `${o.x},${o.y}`),
    `${food.x},${food.y}`,
  ]);
  const portals = [];
  let attempts = 0;
  while (portals.length < 2 && attempts < 500) {
    attempts++;
    const pos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    const key = `${pos.x},${pos.y}`;
    if (occupied.has(key)) continue;
    if (portals.length === 1) {
      const dx = Math.abs(pos.x - portals[0].x);
      const dy = Math.abs(pos.y - portals[0].y);
      if (dx + dy < 6) continue; // ensure portals are far apart
    }
    occupied.add(key);
    portals.push({ ...pos, id: portals.length });
  }
  return portals.length === 2 ? portals : [];
};

// Moving obstacles: each has dx/dy direction
export const generateMovingObstacles = (level, snake) => {
  const statics = generateObstacles(level, snake);
  if (level < 6) return statics.map(o => ({ ...o, dx: 0, dy: 0 }));
  // Make up to 3 obstacles moving
  return statics.map((o, i) => {
    if (i < 3) {
      const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      return { ...o, ...d };
    }
    return { ...o, dx: 0, dy: 0 };
  });
};

// Daily challenge seed from today's date
export const getDailyChallengeSeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

// Simple LCG seeded random
export const createSeededRandom = (seed) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
};
