'use client';

import { useEffect } from 'react';

export function DevModeWrapper() {
  useEffect(() => {
    // Check if black background dev mode is explicitly enabled
    const blackBackgroundEnabled = process.env.NEXT_PUBLIC_DEV_BLACK_BACKGROUND === 'true';
    
    if (blackBackgroundEnabled) {
      document.body.classList.add('dev-mode');
    } else {
      document.body.classList.remove('dev-mode');
    }
  }, []);

  return null;
}

