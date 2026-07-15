// hooks/useAudioAlert.ts
import { useState, useCallback, useEffect } from 'react';

const AUDIO_ASSETS = {
  ALARM: '/sounds/modern_sms.mp3',
} as const;

interface UseAudioAlertReturn {
  playAlert: (taskId: string) => Promise<void>;
  isAudioEnabled: boolean;
  toggleAudio: () => void;
  hasPlayedAlert: (taskId: string) => boolean;
  isAudioReady: boolean;
  initializeAudio: () => Promise<void>;
  resetAlerts: () => void; 
}

export const useAudioAlert = (): UseAudioAlertReturn => {
  const [playedAlerts, setPlayedAlerts] = useState<Record<string, boolean>>({});
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('audioEnabled');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [isAudioReady, setIsAudioReady] = useState(false);

 
  const initializeAudio = useCallback(async () => {
    if (audioInstance || !isAudioEnabled) return;

    try {
      const audio = new Audio(AUDIO_ASSETS.ALARM);
      audio.volume = 0.4;
      audio.preload = 'auto';
      
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        audio.pause();
        audio.currentTime = 0;
        
        setAudioInstance(audio);
        setIsAudioReady(true);
       
      }
    } catch (error) {
      
      setIsAudioReady(false);
    }
  }, [isAudioEnabled, audioInstance]);

  const playAlert = useCallback(async (taskId: string) => {
    if (!isAudioEnabled || playedAlerts[taskId] || !audioInstance || !isAudioReady) {
      return;
    }

    try {
      audioInstance.currentTime = 0; 
      await audioInstance.play();
      
      setPlayedAlerts(prev => ({
        ...prev,
        [taskId]: true
      }));
      
      
    } catch (error) {
      console.error('Audio play failed:', error);
    }
  }, [isAudioEnabled, playedAlerts, audioInstance, isAudioReady]);

  const toggleAudio = useCallback(() => {
    const newValue = !isAudioEnabled;
    setIsAudioEnabled(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioEnabled', JSON.stringify(newValue));
    }
    
    if (!newValue && audioInstance) {
      audioInstance.pause();
      setAudioInstance(null);
      setIsAudioReady(false);
    }
  }, [isAudioEnabled, audioInstance]);

  const hasPlayedAlert = useCallback((taskId: string) => {
    return !!playedAlerts[taskId];
  }, [playedAlerts]);

  const resetAlerts = useCallback(() => {
    setPlayedAlerts({});
  }, []);

  return {
    playAlert,
    isAudioEnabled,
    toggleAudio,
    hasPlayedAlert,
    isAudioReady,
    initializeAudio,
    resetAlerts
  };
};
