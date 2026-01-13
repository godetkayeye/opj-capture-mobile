import { useEffect, useState } from 'react';

export function useSplashScreen(duration: number = 3000) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return { showSplash };
}
