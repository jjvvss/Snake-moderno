import { useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export const useSound = (enabled) => {
  const sounds = useRef({});

  const loadSounds = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const files = {
        eat:     require('../../assets/sounds/eat.wav'),
        death:   require('../../assets/sounds/death.wav'),
        powerup: require('../../assets/sounds/powerup.wav'),
        levelup: require('../../assets/sounds/levelup.wav'),
      };
      for (const [key, src] of Object.entries(files)) {
        try {
          const { sound } = await Audio.Sound.createAsync(src);
          sounds.current[key] = sound;
        } catch {}
      }
    } catch {}
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
