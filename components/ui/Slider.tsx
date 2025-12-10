import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';

export const Slider = ({ label, min = 0, max = 100, value = 50, step = 1, onAction, path }: any) => {
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(Number(e.target.value));
  };

  const handleCommit = () => {
    if (onAction && path) {
      onAction({
        type: 'PATCH_STATE',
        path,
        payload: { value: localValue }
      });
    }
  };

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className={theme.slider.base}>
      {label && (
        <div className={theme.slider.label}>
          <span>{label}</span>
          <span className="text-slate-300 font-mono">{localValue}</span>
        </div>
      )}
      <div className="relative w-full h-4 flex items-center">
        <div className="absolute w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
             <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-75 ease-out"
                style={{ width: `${percentage}%` }}
             />
        </div>
        <input 
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
        <div 
            className="pointer-events-none absolute h-4 w-4 bg-white rounded-full shadow-md border border-zinc-200 transition-all duration-75"
            style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};
