// hooks/useNotificationAudio.ts
import { useState, useCallback, useEffect } from 'react';

const NOTIFICATION_AUDIO_ASSETS = {
  NEW_NOTIFICATION: '/sounds/viber.mp3',
} as const;

interface UseNotificationAudioReturn {
  playNotificationAlert: (notificationId: string) => Promise<void>;
  isNotificationAudioEnabled: boolean;
  toggleNotificationAudio: () => void;
  hasPlayedNotificationAlert: (notificationId: string) => boolean;
  isNotificationAudioReady: boolean;
  initializeNotificationAudio: () => Promise<void>;
  resetNotificationAlerts: () => void;
}

export const useNotificationAudio = (): UseNotificationAudioReturn => {
  const [playedNotificationAlerts, setPlayedNotificationAlerts] = useState<Record<string, boolean>>({});
  const [notificationAudioInstance, setNotificationAudioInstance] = useState<HTMLAudioElement | null>(null);
  const [isNotificationAudioEnabled, setIsNotificationAudioEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notificationAudioEnabled');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [isNotificationAudioReady, setIsNotificationAudioReady] = useState(false);

  
  const initializeNotificationAudio = useCallback(async () => {
    if (notificationAudioInstance || !isNotificationAudioEnabled) return;

    try {
      const audio = new Audio(NOTIFICATION_AUDIO_ASSETS.NEW_NOTIFICATION);
      audio.volume = 0.5;
      audio.preload = 'auto';
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        audio.pause();
        audio.currentTime = 0;
        
        setNotificationAudioInstance(audio);
        setIsNotificationAudioReady(true);
       
      }
    } catch (error) {
      
      setIsNotificationAudioReady(false);
    }
  }, [isNotificationAudioEnabled, notificationAudioInstance]);

  const playNotificationAlert = useCallback(async (notificationId: string) => {
    if (!isNotificationAudioEnabled || playedNotificationAlerts[notificationId] || !notificationAudioInstance || !isNotificationAudioReady) {
      return;
    }

    try {
      notificationAudioInstance.currentTime = 0; 
      await notificationAudioInstance.play();
      
      setPlayedNotificationAlerts(prev => ({
        ...prev,
        [notificationId]: true
      }));
      
    } catch (error) {
      console.error('Notification audio play failed:', error);
    }
  }, [isNotificationAudioEnabled, playedNotificationAlerts, notificationAudioInstance, isNotificationAudioReady]);

  const toggleNotificationAudio = useCallback(() => {
    const newValue = !isNotificationAudioEnabled;
    setIsNotificationAudioEnabled(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationAudioEnabled', JSON.stringify(newValue));
    }
    
    
    if (!newValue && notificationAudioInstance) {
      notificationAudioInstance.pause();
      setNotificationAudioInstance(null);
      setIsNotificationAudioReady(false);
    }
  }, [isNotificationAudioEnabled, notificationAudioInstance]);

  const hasPlayedNotificationAlert = useCallback((notificationId: string) => {
    return !!playedNotificationAlerts[notificationId];
  }, [playedNotificationAlerts]);

  const resetNotificationAlerts = useCallback(() => {
    setPlayedNotificationAlerts({});
  }, []);

  return {
    playNotificationAlert,
    isNotificationAudioEnabled,
    toggleNotificationAudio,
    hasPlayedNotificationAlert,
    isNotificationAudioReady,
    initializeNotificationAudio,
    resetNotificationAlerts
  };
};
