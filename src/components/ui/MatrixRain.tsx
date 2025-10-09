'use client';

import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  active?: boolean;
}

export const MatrixRain: React.FC<MatrixRainProps> = ({ className = '', size = 'lg', active = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Extended matrix characters (more code-like symbols)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?/\\~`!abcdefghijklmnopqrstuvwxyz';
    const codeSymbols = '{}[]();,.<>?/\\|~`!@#$%^&*()_+-=:;';
    const numbers = '0123456789';
    const charArray = chars.split('');
    const codeArray = codeSymbols.split('');
    const numArray = numbers.split('');

    const fontSize = 14; // Slightly smaller font for the popup
    
    // Array of drops with streak data
    let drops: Array<{
      y: number;
      speed: number;
      streak: string[];
      streakLength: number;
    }> = [];
    
    // Function to initialize/reinitialize drops
    const initDrops = () => {
      const columns = Math.floor(canvas.width / fontSize);
      drops = [];
      
      // Initialize drops with streaks - spread them across the screen immediately
      for (let i = 0; i < columns; i++) {
        const streakLength = Math.floor(Math.random() * 6) + 3; // 3-8 characters long (shorter for popup)
        const streak: string[] = [];
        
        // Generate a streak of characters
        for (let j = 0; j < streakLength; j++) {
          const rand = Math.random();
          if (rand < 0.3) {
            streak.push(codeArray[Math.floor(Math.random() * codeArray.length)]);
          } else if (rand < 0.6) {
            streak.push(numArray[Math.floor(Math.random() * numArray.length)]);
          } else {
            streak.push(charArray[Math.floor(Math.random() * charArray.length)]);
          }
        }
        
        drops[i] = {
          y: Math.random() * (canvas.height / fontSize),
          speed: Math.random() * 0.2 + 0.1, // Slower speed for popup
          streak: streak,
          streakLength: streakLength
        };
      }
    };
    
    // Set canvas size to parent container
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        
        // Always set canvas size and reinitialize if we have valid dimensions
        if (width > 0 && height > 0) {
          const needsResize = canvas.width !== width || canvas.height !== height;
          
          if (needsResize || drops.length === 0) {
            canvas.width = width;
            canvas.height = height;
            console.log('📐 MatrixRain canvas resized:', width, 'x', height);
            
            // Reinitialize drops when canvas size changes or if empty
            initDrops();
          }
        }
      }
    };

    // Initial resize and drop initialization (immediate)
    resizeCanvas();
    
    // Quick retry if needed (only if drops are empty)
    if (drops.length === 0) {
      requestAnimationFrame(() => resizeCanvas());
    }
    
    // One more delayed retry to catch flex layout
    setTimeout(resizeCanvas, 100);
    
    window.addEventListener('resize', resizeCanvas);
    
    // Use ResizeObserver to detect when parent container size changes
    const parent = canvas.parentElement;
    let resizeObserver: ResizeObserver | null = null;
    
    if (parent && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      resizeObserver.observe(parent);
    }

    const draw = () => {
      // Clear canvas completely (no background)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set text properties
      ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
      ctx.textBaseline = 'top';

      // Draw character streaks
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const x = i * fontSize;
        
        // Draw the entire streak
        for (let j = 0; j < drop.streakLength; j++) {
          const charY = (drop.y - j) * fontSize;
          
          // Only draw if character is visible on screen
          if (charY >= -fontSize && charY < canvas.height + fontSize) {
            // Randomly change characters as they fall (Matrix effect)
            let char = drop.streak[j];
            if (Math.random() < 0.03) { // 3% chance to change each frame (less chaotic)
              const rand = Math.random();
              if (rand < 0.3) {
                char = codeArray[Math.floor(Math.random() * codeArray.length)];
              } else if (rand < 0.6) {
                char = numArray[Math.floor(Math.random() * numArray.length)];
              } else {
                char = charArray[Math.floor(Math.random() * charArray.length)];
              }
              // Update the streak with the new character
              drop.streak[j] = char;
            }
            
            // Calculate opacity based on position in streak (brighter at head)
            let opacity = 1 - (j / drop.streakLength);
            opacity = Math.max(opacity, 0.2); // Lower minimum opacity for subtlety
            
            // Green matrix color with opacity
            ctx.fillStyle = `rgba(0, 255, 65, ${opacity})`;
            
            ctx.fillText(char, x, charY);
          }
        }

        // Move drop down
        drop.y += drop.speed;

        // Reset drop when the head goes off screen
        if (drop.y * fontSize > canvas.height + drop.streakLength * fontSize) {
          // Generate new streak
          const newStreakLength = Math.floor(Math.random() * 6) + 3;
          const newStreak: string[] = [];
          
          for (let j = 0; j < newStreakLength; j++) {
            const rand = Math.random();
            if (rand < 0.3) {
              newStreak.push(codeArray[Math.floor(Math.random() * codeArray.length)]);
            } else if (rand < 0.6) {
              newStreak.push(numArray[Math.floor(Math.random() * numArray.length)]);
            } else {
              newStreak.push(charArray[Math.floor(Math.random() * charArray.length)]);
            }
          }
          
          drop.y = -Math.random() * 10;
          drop.speed = Math.random() * 0.2 + 0.1;
          drop.streak = newStreak;
          drop.streakLength = newStreakLength;
        }
      }
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, active]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{
        zIndex: 0,
        background: 'transparent',
        pointerEvents: 'none'
      }}
    />
  );
};
