
import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useDebounce } from '../../hooks/useDebounce';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Input = ({ label, placeholder, inputType = 'text', value = '', validation, onAction, path }: any) => {
  const { theme } = useTheme();
  
  // Local state
  const [localValue, setLocalValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedValue = useDebounce(localValue, 300);

  // Validation Logic
  const validate = (val: string) => {
    if (!validation) return null;

    if (validation.required && !val.trim()) {
      return validation.errorMessage || "This field is required";
    }

    if (validation.minLength && val.length < validation.minLength) {
      return `Minimum ${validation.minLength} characters required`;
    }

    if (validation.maxLength && val.length > validation.maxLength) {
      return `Maximum ${validation.maxLength} characters allowed`;
    }

    if (validation.pattern) {
      try {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(val)) {
           return validation.errorMessage || "Invalid format";
        }
      } catch (e) {
        console.warn("Invalid regex in schema:", validation.pattern);
      }
    }

    return null;
  };

  useEffect(() => {
    // Dispatch patch only if value changed
    if (debouncedValue !== value && path && onAction) {
      onAction({
        type: 'PATCH_STATE',
        path,
        payload: { value: debouncedValue }
      });
    }
  }, [debouncedValue, onAction, path, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    if (isTouched) {
      setError(validate(e.target.value));
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    setError(validate(localValue));
  };

  return (
    <div className={theme.input.base}>
      <label className={theme.input.label}>
        {label}
        {validation?.required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input 
          type={inputType}
          className={`${theme.input.field} ${error ? theme.input.error : ''}`}
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        
        <AnimatePresence>
          {error && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.8 }}
               className="absolute right-3 top-3.5 text-rose-500"
            >
               <AlertCircle className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className={theme.input.errorMessage}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
