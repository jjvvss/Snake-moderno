import { useRef, useState, useCallback, useEffect } from 'react';
import {
  GAME_STATUS,
  GAME_MODES,
  DIRECTIONS,
  POWER_UP_TYPES,
  POWER_UP_DURATION,
  POWER_UP_LIFETIME,
  POWER_UP_SPAWN_CHANCE,
  TIME_TRIAL_START,
  TIME_TRIAL_MAX,
  TIME_PER_FOOD,
  FOOD_TYPES,
  FOOD_POINTS,
  COMBO_WINDOW_MS,
  COMBO_THRESHOLDS,
  PORTAL_UNLOCK_LEVEL,
  PORTAL_COOLDOWN_TICKS,
  MOVING_OBS_LEVEL,
  MOVING_OBS_TICKS,
  COUNTDOWN_SECONDS,
  GRID_SIZE,
  LEVEL_THRESHOLD,
} from '../utils/constants';
import {
  generateTypedFood,
  generatePortals,
  generateMovingObstacles,
  getNextPosition,
  checkWallCollision,
  checkSelfCollision,
  checkObstacleCollision,
  isOppositeDirection,
  getInitialSnake,
  calculateSpeed,
} from '../utils/gameUtils';

const getInitialGameState = (mode = GAME_MODES.CLASSIC) => {
  const snake = getInitialSnake();
  return {
    snake,
    food: generateTypedFood(snake, [], null),
    obstacles: [],
    movingObstacles: [],
    movingObsTicks: 0,
    portals: [],
    portalCooldown: 0,
    direction: DIRECTIONS.RIGHT,
    nextDirection: DIRECTIONS.RIGHT,
    score: 0,
    level: 1,
    foodsEaten: 0,
    status: GAME_STATUS.IDLE,
    mode,
    timeLeft: TIME_TRIAL_START,
    powerUpOnBoard: null,
    activePowerUp: null,
    comboCount: 0,
    comboMultiplier: 1,
    lastEatTime: 0,
    countdown: COUNTDOWN_SECONDS,
    gameStartTime: 0,
    goldenEaten: 0,
    powerupsCollected: 0,
    replayHistory: [],
  };
};

export const useGameLogic = () => {
  const gameRef = useRef(getInitialGameState());
  const intervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const deathFlashRef = useRef(false);

  const onEatCallback = useRef(null);
  const onDeathCallback = useRef(null);
  const onAchievementCallback = useRef(null);

  const [renderState, setRenderState] = useState(() => ({
    ...getInitialGameState(),
    deathFlash: false,
    particles: [],
  }));

  const particlesRef = useRef([]);
  const particleIdRef = useRef(0);

  const syncRenderState = useCallback((overrides = {}) => {
    const gs = gameRef.current;
    setRenderState(() => ({
      snake: gs.snake,
      food: gs.food,
      obstacles: gs.obstacles,
      movingObstacles: gs.movingObstacles,
      portals: gs.portals,
      direction: gs.direction,
      score: gs.score,
      level: gs.level,
      foodsEaten: gs.foodsEaten,
      status: gs.status,
      mode: gs.mode,
      timeLeft: gs.timeLeft,
      powerUpOnBoard: gs.powerUpOnBoard,
      activePowerUp: gs.activePowerUp,
      comboCount: gs.comboCount,
      comboMultiplier: gs.comboMultiplier,
      countdown: gs.countdown,
      replayHistory: gs.replayHistory,
      deathFlash: deathFlashRef.current,
      particles: [...particlesRef.current],
      ...overrides,
    }));
  }, []);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
  }, []);

  const triggerDeathFlash = useCallback(() => {
    let flashCount = 0;
    const flashInterval = setInterval(() => {
      flashCount++;
      deathFlashRef.current = flashCount % 2 === 1;
      setRenderState((prev) => ({ ...prev, deathFlash: deathFlashRef.current }));
      if (flashCount >= 6) {
        clearInterval(flashInterval);
        deathFlashRef.current = false;
        setRenderState((prev) => ({ ...prev, deathFlash: false }));
      }
    }, 100);
  }, []);

  const killSnake = useCallback(() => {
    gameRef.current.status = GAME_STATUS.GAME_OVER;
    stopLoop();
    triggerDeathFlash();
    syncRenderState();
    if (onDeathCallback.current) onDeathCallback.current();
  }, [stopLoop, triggerDeathFlash, syncRenderState]);

  const startTimerLoop = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      const gs = gameRef.current;
      if (gs.status !== GAME_STATUS.PLAYING) return;
      if (gs.mode !== GAME_MODES.TIME_TRIAL) return;
      gs.timeLeft = Math.max(0, gs.timeLeft - 1);
      if (gs.timeLeft <= 0) killSnake();
      else syncRenderState();
    }, 1000);
  }, [killSnake, syncRenderState]);

  const startGameLoop = useCallback((speed) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const gs = gameRef.current;
      if (gs.status !== GAME_STATUS.PLAYING) return;

      const now = Date.now();

      // Move moving obstacles every N ticks
      if (gs.movingObstacles.some(o => o.dx !== 0 || o.dy !== 0)) {
        gs.movingObsTicks = (gs.movingObsTicks || 0) + 1;
        if (gs.movingObsTicks >= MOVING_OBS_TICKS) {
          gs.movingObsTicks = 0;
          gs.movingObstacles = gs.movingObstacles.map(obs => {
            if (obs.dx === 0 && obs.dy === 0) return obs;
            let nx = obs.x + obs.dx;
            let ny = obs.y + obs.dy;
            let ndx = obs.dx;
            let ndy = obs.dy;
            if (nx < 0 || nx >= GRID_SIZE) { ndx = -ndx; nx = obs.x + ndx; }
            if (ny < 0 || ny >= GRID_SIZE) { ndy = -ndy; ny = obs.y + ndy; }
            return { ...obs, x: nx, y: ny, dx: ndx, dy: ndy };
          });
        }
      }

      // Apply buffered direction
      if (!isOppositeDirection(gs.direction, gs.nextDirection)) {
        gs.direction = gs.nextDirection;
      }

      const wrap = gs.mode === GAME_MODES.INFINITE || gs.mode === GAME_MODES.DAILY;
      let nextHead = getNextPosition(gs.snake[0], gs.direction, wrap);

      // Wall collision
      if (!wrap && checkWallCollision(nextHead)) { killSnake(); return; }

      // Portal teleportation
      const allObstacles = gs.movingObstacles.length ? gs.movingObstacles : gs.obstacles;
      if (gs.portals.length === 2 && gs.portalCooldown === 0) {
        const p0 = gs.portals[0];
        const p1 = gs.portals[1];
        if (nextHead.x === p0.x && nextHead.y === p0.y) {
          nextHead = getNextPosition(p1, gs.direction, true);
          gs.portalCooldown = PORTAL_COOLDOWN_TICKS;
        } else if (nextHead.x === p1.x && nextHead.y === p1.y) {
          nextHead = getNextPosition(p0, gs.direction, true);
          gs.portalCooldown = PORTAL_COOLDOWN_TICKS;
        }
      }
      if (gs.portalCooldown > 0) gs.portalCooldown--;

      // Self collision
      if (checkSelfCollision(nextHead, gs.snake)) { killSnake(); return; }

      // Obstacle collision (unless invincible)
      const invincible = gs.activePowerUp &&
        gs.activePowerUp.type === POWER_UP_TYPES.INVINCIBILITY &&
        now - gs.activePowerUp.activatedAt < POWER_UP_DURATION;

      const obstacleHit = allObstacles.some(o => o.x === nextHead.x && o.y === nextHead.y);
      if (!invincible && obstacleHit) { killSnake(); return; }

      // Move snake
      const newSnake = [nextHead, ...gs.snake];

      // Check food collision
      let ateFood = false;
      if (nextHead.x === gs.food.x && nextHead.y === gs.food.y) {
        ateFood = true;
        const foodType = gs.food.type || FOOD_TYPES.NORMAL;

        // Combo
        if (now - gs.lastEatTime < COMBO_WINDOW_MS && gs.lastEatTime > 0) {
          gs.comboCount++;
        } else {
          gs.comboCount = 1;
        }
        gs.lastEatTime = now;
        const threshold = COMBO_THRESHOLDS.find(t => gs.comboCount >= t.count);
        gs.comboMultiplier = threshold ? threshold.mult : 1;

        // Points
        const doubleActive = gs.activePowerUp &&
          gs.activePowerUp.type === POWER_UP_TYPES.DOUBLE_POINTS &&
          now - gs.activePowerUp.activatedAt < POWER_UP_DURATION;
        const basePoints = FOOD_POINTS[foodType] !== undefined ? FOOD_POINTS[foodType] : 10;
        const pointsGained = Math.round(basePoints * gs.comboMultiplier * (doubleActive ? 2 : 1));
        gs.score = Math.max(0, gs.score + pointsGained);
        gs.foodsEaten++;

        // Poison: shorten snake
        if (foodType === FOOD_TYPES.POISONED && newSnake.length > 3) {
          newSnake.pop();
          newSnake.pop();
        }

        // Golden tracking
        if (foodType === FOOD_TYPES.GOLDEN) gs.goldenEaten++;

        // Level up
        const newLevel = Math.floor(gs.score / LEVEL_THRESHOLD) + 1;
        if (newLevel > gs.level) {
          gs.level = newLevel;
          gs.movingObstacles = generateMovingObstacles(gs.level, newSnake);
          gs.obstacles = gs.movingObstacles;
          // Regenerate portals at new level
          if (gs.level >= PORTAL_UNLOCK_LEVEL) {
            gs.portals = generatePortals(newSnake, gs.obstacles, gs.food);
          }
        }

        // TIME_TRIAL: add time
        if (gs.mode === GAME_MODES.TIME_TRIAL) {
          const timeAdd = TIME_PER_FOOD[foodType] !== undefined ? TIME_PER_FOOD[foodType] : 0;
          gs.timeLeft = Math.min(TIME_TRIAL_MAX, gs.timeLeft + timeAdd);
        }

        // Generate new food
        gs.food = generateTypedFood(newSnake, gs.obstacles, gs.powerUpOnBoard);

        // Maybe spawn power-up
        if (!gs.powerUpOnBoard && Math.random() < POWER_UP_SPAWN_CHANCE) {
          const types = Object.values(POWER_UP_TYPES);
          const type = types[Math.floor(Math.random() * types.length)];
          const puPos = generateTypedFood(newSnake, gs.obstacles, null);
          gs.powerUpOnBoard = { type, x: puPos.x, y: puPos.y, spawnedAt: now };
        }

        // Particles at food position
        const foodColor =
          foodType === FOOD_TYPES.GOLDEN ? '#FFD700' :
          foodType === FOOD_TYPES.POISONED ? '#8800CC' : '#FF0066';
        const newParticle = {
          id: particleIdRef.current++,
          gridX: nextHead.x,
          gridY: nextHead.y,
          color: foodColor,
          createdAt: now,
        };
        particlesRef.current = [...particlesRef.current, newParticle];
        setTimeout(() => {
          particlesRef.current = particlesRef.current.filter(p => p.id !== newParticle.id);
        }, 600);

        if (onEatCallback.current) onEatCallback.current();

        const newSpeed = calculateSpeed(gs.foodsEaten, gs.activePowerUp ? gs.activePowerUp.type : null);
        startGameLoop(newSpeed);
      } else {
        newSnake.pop();
        // Reset combo if time window expired
        if (gs.lastEatTime > 0 && now - gs.lastEatTime >= COMBO_WINDOW_MS) {
          gs.comboCount = 0;
          gs.comboMultiplier = 1;
        }
      }

      gs.snake = newSnake;

      // Record replay history (keep last 10 frames)
      gs.replayHistory = [
        ...gs.replayHistory.slice(-9),
        { snake: [...gs.snake], food: { ...gs.food } },
      ];

      // Power-up on board collection
      if (gs.powerUpOnBoard && nextHead.x === gs.powerUpOnBoard.x && nextHead.y === gs.powerUpOnBoard.y) {
        gs.activePowerUp = { type: gs.powerUpOnBoard.type, activatedAt: now };
        gs.powerUpOnBoard = null;
        gs.powerupsCollected++;
        const newSpeed = calculateSpeed(gs.foodsEaten, gs.activePowerUp.type);
        startGameLoop(newSpeed);
      }

      // Power-up board lifetime
      if (gs.powerUpOnBoard && now - gs.powerUpOnBoard.spawnedAt > POWER_UP_LIFETIME) {
        gs.powerUpOnBoard = null;
      }

      // Active power-up expiry
      if (gs.activePowerUp && now - gs.activePowerUp.activatedAt >= POWER_UP_DURATION) {
        const wasType = gs.activePowerUp.type;
        gs.activePowerUp = null;
        if (wasType === POWER_UP_TYPES.TURBO) {
          startGameLoop(calculateSpeed(gs.foodsEaten, null));
        }
      }

      syncRenderState();
    }, speed);
  }, [killSnake, syncRenderState]);

  const startGame = useCallback((mode = GAME_MODES.CLASSIC) => {
    stopLoop();
    const snake = getInitialSnake();
    const food = generateTypedFood(snake, [], null);
    const initialState = {
      snake,
      food,
      obstacles: [],
      movingObstacles: [],
      movingObsTicks: 0,
      portals: [],
      portalCooldown: 0,
      direction: DIRECTIONS.RIGHT,
      nextDirection: DIRECTIONS.RIGHT,
      score: 0,
      level: 1,
      foodsEaten: 0,
      status: 'COUNTDOWN',
      mode,
      timeLeft: TIME_TRIAL_START,
      powerUpOnBoard: null,
      activePowerUp: null,
      comboCount: 0,
      comboMultiplier: 1,
      lastEatTime: 0,
      countdown: COUNTDOWN_SECONDS,
      gameStartTime: Date.now(),
      goldenEaten: 0,
      powerupsCollected: 0,
      replayHistory: [],
    };
    gameRef.current = initialState;
    particlesRef.current = [];
    deathFlashRef.current = false;
    syncRenderState();

    // Countdown phase
    countdownIntervalRef.current = setInterval(() => {
      const gs = gameRef.current;
      gs.countdown--;
      if (gs.countdown <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        gs.status = GAME_STATUS.PLAYING;
        gs.countdown = 0;
        syncRenderState();
        const speed = calculateSpeed(0, null);
        startGameLoop(speed);
        if (mode === GAME_MODES.TIME_TRIAL) startTimerLoop();
      } else {
        syncRenderState();
      }
    }, 1000);
  }, [stopLoop, syncRenderState, startGameLoop, startTimerLoop]);

  const pauseGame = useCallback(() => {
    if (gameRef.current.status !== GAME_STATUS.PLAYING) return;
    gameRef.current.status = GAME_STATUS.PAUSED;
    stopLoop();
    syncRenderState();
  }, [stopLoop, syncRenderState]);

  const resumeGame = useCallback(() => {
    if (gameRef.current.status !== GAME_STATUS.PAUSED) return;
    gameRef.current.status = GAME_STATUS.PLAYING;
    const gs = gameRef.current;
    const speed = calculateSpeed(gs.foodsEaten, gs.activePowerUp ? gs.activePowerUp.type : null);
    startGameLoop(speed);
    if (gs.mode === GAME_MODES.TIME_TRIAL) startTimerLoop();
    syncRenderState();
  }, [startGameLoop, startTimerLoop, syncRenderState]);

  const changeDirection = useCallback((dir) => {
    const gs = gameRef.current;
    if (gs.status !== GAME_STATUS.PLAYING) return;
    if (!isOppositeDirection(gs.direction, dir)) gs.nextDirection = dir;
  }, []);

  const resetGame = useCallback(() => {
    stopLoop();
    gameRef.current = getInitialGameState();
    particlesRef.current = [];
    deathFlashRef.current = false;
    syncRenderState();
  }, [stopLoop, syncRenderState]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    renderState,
    startGame,
    pauseGame,
    resumeGame,
    changeDirection,
    resetGame,
    onEatCallback,
    onDeathCallback,
    onAchievementCallback,
  };
};
