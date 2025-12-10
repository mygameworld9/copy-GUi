
import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { motion } from 'framer-motion';

export const Switch = ({ label, value = false, onAction, path }: any) => {
  const { theme } = useTheme();
  const [isOn, setIsOn] = useState(value);

  useEffect(() => {
    setIsOn(value);
  }, [value]);

  const toggle = (e: React.MouseEvent) => {
    // Critical: Stop click from bubbling to parent Card (which handles selection)
    e.stopPropagation(); 
    e.nativeEvent.stopImmediatePropagation();
    
    const newState = !isOn;
    setIsOn(newState);
    
    if (onAction && path) {
      onAction({
        type: 'PATCH_STATE',
        path,
        payload: { value: newState }
      });
    }
  };

  return (
    <div 
      className={theme.switch.base} 
      onClick={(e) => { e.stopPropagation(); }} // Also block container clicks
    >
      {label && <span className={theme.switch.label}>{label}</span>}
      <button 
        onClick={toggle}
        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${isOn ? 'bg-indigo-600' : 'bg-zinc-700'}`}
      >
        <motion.div
          layout
          className="bg-white w-4 h-4 rounded-full shadow-md"
          animate={{ x: isOn ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
};
