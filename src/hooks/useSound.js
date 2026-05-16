import { useRef, useCallback } from 'react';

export const useSound = (enabled) => {
  const sounds = useRef({});

  // Gracefully load sounds - these files would be in assets/sounds/
  // Game works silently if files don't exist
  const loadSounds = useCallback(async () => {
    // Sound files not bundled - system works silently.
    // To add sounds: place MP3 files in assets/sounds/ and require() them here,
    // then use Audio.Sound.createAsync() to load each one.
    // Example:
    // try {
    //   const { sound: eatSound } = await Audio.Sound.createAsync(
    //     require('../../assets/sounds/eat.mp3')
    //   );
    //   sounds.current.eat = eatSound;
    // } catch {}
  }, []);

  const play = useCallback(
    (soundName) => {
      if (!enabled) return;
      const sound = sounds.current[soundName];
      if (!sound) return;
      try {
        sound.replayAsync();
      } catch {}
    },
    [enabled]
  );

  const unloadSounds = useCallback(async () => {
    for (const key of Object.keys(sounds.current)) {
      try {
        await sounds.current[key].unloadAsync();
      } catch {}
    }
    sounds.current = {};
  }, []);

  return { play, loadSounds, unloadSounds };
};
