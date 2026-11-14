import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PageIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<'ignite' | 'expand' | 'done'>('ignite');

  useEffect(() => {
    // Stage 1: star ignites
    const timer1 = setTimeout(() => {
      setStage('expand');
    }, 900);

    // Stage 2: zooms out into hero
    const timer2 = setTimeout(() => {
      setStage('done');
      onComplete();
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {stage !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 bg-[#04050d] flex items-center justify-center pointer-events-none"
        >
          {/* Central Igniting Star */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={
              stage === 'ignite'
                ? { scale: [0, 1.8, 1], opacity: [0, 1, 0.9] }
                : { scale: 50, opacity: 0 }
            }
            transition={{
              duration: stage === 'ignite' ? 0.9 : 0.8,
              ease: stage === 'ignite' ? 'easeOut' : 'easeInOut',
            }}
            className="relative flex items-center justify-center"
          >
            {/* Supernova core */}
            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_40px_#ffffff,0_0_80px_#f97316,0_0_120px_#8b5cf6]" />
            {/* Luminous corona */}
            <div className="absolute w-16 h-16 rounded-full bg-amber-400/30 blur-md animate-ping" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
