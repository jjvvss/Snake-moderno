import { useRef, useState, useCallback, useEffect } from 'react';
import {
  GAME_STATUS,
  GAME_MODES,
  DIRECTIONS,
  POWER_UP_TYPES,
  POWER_UP_DURATION,
  POWER_UP_LIFETIME,
  POWER_UP_SPAWN_CHANCE,
  TIME_TRIAL_DURATION,
  POINTS_PER_FOOD,
  LEVEL_THRESHOLD,
  GRID_SIZE,
} from '../utils/constants';
import {
  generateFood,
  generateObstacles,
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
    food: generateFood(snake, [], null),
    obstacles: [],
    direction: DIRECTIONS.RIGHT,
    nextDirection: DIRECTIONS.RIGHT,
    score: 0,
    level: 1,
    foodsEaten: 0,
    status: GAME_STATUS.IDLE,
    mode,
    timeLeft: TIME_TRIAL_DURATION,
    powerUpOnBoard: null,
    activePowerUp: null,
  };
};

export const useGameLogic = () => {
  const gameRef = useRef(getInitialGameState());
  const intervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const deathFlashRef = useRef(false);

  const onEatCallback = useRef(null);
  const onDeathCallback = useRef(null);
  const onParticleCallback = useRef(null);

  const [renderState, setRenderState] = useState(() => ({
    ...getInitialGameState(),
    deathFlash: false,
    particles: [],
  }));

  const particlesRef = useRef([]);
  const particleIdRef = useRef(0);

  const syncRenderState = useCallback(() => {
    const gs = gameRef.current;
    setRenderState((prev) => ({
      snake: gs.snake,
      food: gs.food,
      obstacles: gs.obstacles,
      direction: gs.direction,
      score: gs.score,
      level: gs.level,
      foodsEaten: gs.foodsEaten,
      status: gs.status,
      mode: gs.mode,
      timeLeft: gs.timeLeft,
      powerUpOnBoard: gs.powerUpOnBoard,
      activePowerUp: gs.activePowerUp,
      deathFlash: deathFlashRef.current,
      particles: [...particlesRef.current],
    }));
  }, []);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const triggerDeathFlash = useCallback(() => {
    let flashCount = 0;
    const maxFlashes = 6;
    const flashInterval = setInterval(() => {
      flashCount++;
      deathFlashRef.current = flashCount % 2 === 1;
      setRenderState((prev) => ({ ...prev, deathFlash: deathFlashRef.current }));
      if (flashCount >= maxFlashes) {
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
      if (gs.timeLeft <= 0) {
        killSnake();
      } else {
        syncRenderState();
      }
    }, 1000);
  }, [killSnake, syncRenderState]);

  const startGameLoop = useCallback((speed) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const gs = gameRef.current;
      if (gs.status !== GAME_STATUS.PLAYING) return;

      const now = Date.now();

      // Apply buffered direction if not opposite
      if (!isOppositeDirection(gs.direction, gs.nextDirection)) {
        gs.direction = gs.nextDirection;
      }

      const head = gs.snake[0];
      const wrap = gs.mode === GAME_MODES.INFINITE;
      const nextHead = getNextPosition(head, gs.direction, wrap);

      // Wall collision (not in INFINITE mode)
      if (!wrap && checkWallCollision(nextHead)) {
        killSnake();
        return;
      }

      // Self collision
      if (checkSelfCollision(nextHead, gs.snake)) {
        killSnake();
        return;
      }

      // Obstacle collision (unless INVINCIBILITY active)
      const invincible =
        gs.activePowerUp &&
        gs.activePowerUp.type === POWER_UP_TYPES.INVINCIBILITY &&
        now - gs.activePowerUp.activatedAt < POWER_UP_DURATION;

      if (!invincible && checkObstacleCollision(nextHead, gs.obstacles)) {
        killSnake();
        return;
      }

      // Move snake: prepend new head
      const newSnake = [nextHead, ...gs.snake];

      // Check food collision
      let ateFood = false;
      if (nextHead.x === gs.food.x && nextHead.y === gs.food.y) {
        ateFood = true;
        const multiplier =
          gs.activePowerUp &&
          gs.activePowerUp.type === POWER_UP_TYPES.DOUBLE_POINTS &&
          now - gs.activePowerUp.activatedAt < POWER_UP_DURATION
            ? 2
            : 1;

        gs.foodsEaten += 1;
        gs.score += POINTS_PER_FOOD * multiplier;

        // Level up check
        const newLevel = Math.floor(gs.score / LEVEL_THRESHOLD) + 1;
        if (newLevel > gs.level) {
          gs.level = newLevel;
          gs.obstacles = generateObstacles(gs.level, newSnake);
        }

        // Generate new food
        gs.food = generateFood(newSnake, gs.obstacles, gs.powerUpOnBoard);

        // Maybe spawn power-up
        if (!gs.powerUpOnBoard && Math.random() < POWER_UP_SPAWN_CHANCE) {
          const types = Object.values(POWER_UP_TYPES);
          const type = types[Math.floor(Math.random() * types.length)];
          const puFood = generateFood(newSnake, gs.obstacles, null);
          gs.powerUpOnBoard = {
            type,
            x: puFood.x,
            y: puFood.y,
            spawnedAt: now,
          };
        }

        // Spawn particles at food position
        const newParticle = {
          id: particleIdRef.current++,
          gridX: gs.food.x,
          gridY: gs.food.y,
          color: '#FF0066',
          createdAt: now,
        };
        particlesRef.current = [...particlesRef.current, newParticle];
        setTimeout(() => {
          particlesRef.current = particlesRef.current.filter(
            (p) => p.id !== newParticle.id
          );
        }, 600);

        if (onEatCallback.current) onEatCallback.current();

        // Restart interval with potentially new speed
        const newSpeed = calculateSpeed(
          gs.foodsEaten,
          gs.activePowerUp ? gs.activePowerUp.type : null
        );
        startGameLoop(newSpeed);
      } else {
        // Pop tail if didn't eat
        newSnake.pop();
      }

      gs.snake = newSnake;

      // Check power-up on board collection
      if (
        gs.powerUpOnBoard &&
        nextHead.x === gs.powerUpOnBoard.x &&
        nextHead.y === gs.powerUpOnBoard.y
      ) {
        gs.activePowerUp = {
          type: gs.powerUpOnBoard.type,
          activatedAt: now,
        };
        gs.powerUpOnBoard = null;

        // Restart loop with new speed (TURBO changes speed)
        const newSpeed = calculateSpeed(gs.foodsEaten, gs.activePowerUp.type);
        startGameLoop(newSpeed);
      }

      // Check power-up board lifetime
      if (
        gs.powerUpOnBoard &&
        now - gs.powerUpOnBoard.spawnedAt > POWER_UP_LIFETIME
      ) {
        gs.powerUpOnBoard = null;
      }

      // Check active power-up expiry
      if (
        gs.activePowerUp &&
        now - gs.activePowerUp.activatedAt >= POWER_UP_DURATION
      ) {
        const wasType = gs.activePowerUp.type;
        gs.activePowerUp = null;
        // If TURBO expired, restore normal speed
        if (wasType === POWER_UP_TYPES.TURBO) {
          const newSpeed = calculateSpeed(gs.foodsEaten, null);
          startGameLoop(newSpeed);
        }
      }

      syncRenderState();
    }, speed);
  }, [killSnake, syncRenderState]);

  const startGame = useCallback(
    (mode = GAME_MODES.CLASSIC) => {
      stopLoop();
      const snake = getInitialSnake();
      const initialState = {
        snake,
        food: generateFood(snake, [], null),
        obstacles: [],
        direction: DIRECTIONS.RIGHT,
        nextDirection: DIRECTIONS.RIGHT,
        score: 0,
        level: 1,
        foodsEaten: 0,
        status: GAME_STATUS.PLAYING,
        mode,
        timeLeft: TIME_TRIAL_DURATION,
        powerUpOnBoard: null,
        activePowerUp: null,
      };
      gameRef.current = initialState;
      particlesRef.current = [];
      deathFlashRef.current = false;
      syncRenderState();

      const speed = calculateSpeed(0, null);
      startGameLoop(speed);

      if (mode === GAME_MODES.TIME_TRIAL) {
        startTimerLoop();
      }
    },
    [stopLoop, syncRenderState, startGameLoop, startTimerLoop]
  );

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
    const speed = calculateSpeed(
      gs.foodsEaten,
      gs.activePowerUp ? gs.activePowerUp.type : null
    );
    startGameLoop(speed);
    if (gs.mode === GAME_MODES.TIME_TRIAL) {
      startTimerLoop();
    }
    syncRenderState();
  }, [startGameLoop, startTimerLoop, syncRenderState]);

  const changeDirection = useCallback((dir) => {
    const gs = gameRef.current;
    if (gs.status !== GAME_STATUS.PLAYING) return;
    if (!isOppositeDirection(gs.direction, dir)) {
      gs.nextDirection = dir;
    }
  }, []);

  const resetGame = useCallback(() => {
    stopLoop();
    const newState = getInitialGameState();
    gameRef.current = newState;
    particlesRef.current = [];
    deathFlashRef.current = false;
    syncRenderState();
  }, [stopLoop, syncRenderState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLoop();
    };
  }, [stopLoop]);

  return {
    renderState,
    startGame,
    pauseGame,
    resumeGame,
    changeDirection,
    resetGame,
    onEatCallback,
    onDeathCallback,
    onParticleCallback,
  };
};
