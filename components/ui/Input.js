import React from 'react';
import { useTheme } from '../Layout';

const Input = React.forwardRef(({ className = '', ...props }, ref) => {
  const { isDark } = useTheme();
  
  return (
    <input
      className={`rounded-[2rem] sm:rounded-xl backdrop-blur-sm transition-all duration-200 w-full text-center ${
        isDark 
          ? 'bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/15 focus:border-white/30' 
          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-blue-300'
      } ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
export default Input; 
