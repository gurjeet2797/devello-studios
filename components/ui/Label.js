import React from 'react';

export function Label({ children, className = '', htmlFor, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-black/90 text-sm font-medium drop-shadow-sm ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

export default Label; 
