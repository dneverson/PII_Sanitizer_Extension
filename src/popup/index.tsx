import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import PIISanitizer from './PIISanitizer';

console.log('Popup script starting...');

const container = document.getElementById('root');
console.log('Root container:', container);

if (!container) {
  console.error('Failed to find root element');
} else {
  const root = createRoot(container);
  console.log('Created React root');
  
  try {
    root.render(<PIISanitizer />);
    console.log('Rendered PIISanitizer component');
  } catch (error) {
    console.error('Error rendering PIISanitizer:', error);
  }
}