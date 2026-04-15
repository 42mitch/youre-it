import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance } from '../lib/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function useNotifications(
  onTagged?: (taggerName: string, taggedName: string) => void
) {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async (): Promise<string | null> => {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return null;

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return null;

      const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      setToken(fcmToken);

      // Listen to foreground messages
      onMessage(messaging, (payload) => {
        const { taggerName, taggedName } = payload.data ?? {};
        if (onTagged) onTagged(taggerName, taggedName);
      });

      return fcmToken;
    } catch (e) {
      console.error('Notification setup failed:', e);
      return null;
    }
  };

  return { token, permission, requestPermission };
}