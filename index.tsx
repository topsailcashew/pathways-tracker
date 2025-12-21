import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { runStartupChecks, displayStartupBanner, validateRuntime } from './utils/startup';
import { logger } from './utils/logger';

// Run startup checks
displayStartupBanner();

// Validate runtime environment
if (!validateRuntime()) {
  logger.critical('Runtime validation failed. App may not work correctly.');
}

// Run startup checks
runStartupChecks();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);