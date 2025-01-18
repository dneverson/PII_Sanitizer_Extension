import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
};
//{`p-2 rounded-lg mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}
export const AlertTitle: React.FC<AlertProps> = ({ children, className = '' }) => {
  return (
    <h4 className={`text-lg font-semibold mb-2 ${className}`}>
      {children}
    </h4>
  );
};

export const AlertDescription: React.FC<AlertProps> = ({ children, className = '' }) => {
  return (
    <div className={`text-sm opacity-90 ${className}`}>
      {children}
    </div>
  );
};