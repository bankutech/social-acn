import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [startY, setStartY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [offsetY, setOffsetY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const threshold = 60; // pixels to pull before refreshing
  
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling || refreshing) return;
    
    const y = e.touches[0].clientY;
    const diff = y - startY;
    
    // Only pull down
    if (diff > 0 && window.scrollY === 0) {
      // Add friction
      const pullDistance = Math.min(diff * 0.4, 100);
      setOffsetY(pullDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling || refreshing) return;
    setPulling(false);
    
    if (offsetY > threshold) {
      setRefreshing(true);
      setOffsetY(40); // hold at loading position
      
      try {
        await onRefresh();
      } catch (e) {
        console.error(e);
      } finally {
        setRefreshing(false);
        setOffsetY(0);
      }
    } else {
      setOffsetY(0);
    }
  };

  return (
    <div 
      style={{ minHeight: '100%', position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        animate={{ y: offsetY }}
        transition={pulling ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.3 }}
        style={{
          position: 'absolute',
          top: -40,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 40,
          zIndex: 10
        }}
      >
        <motion.div
          animate={{ rotate: refreshing ? 360 : (offsetY / threshold) * 360 }}
          transition={refreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0 }}
        >
          <Loader2 
            size={22} 
            color="var(--accent)" 
            style={{ 
              opacity: Math.min(offsetY / threshold, 1)
            }} 
          />
        </motion.div>
      </motion.div>
      
      <motion.div
        animate={{ y: offsetY }}
        transition={pulling ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
