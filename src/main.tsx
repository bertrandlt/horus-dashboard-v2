import React from 'react';
import ReactDOM from 'react-dom/client';
import { RealtimeProvider } from './context/RealtimeContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RealtimeProvider>
      <App />
    </RealtimeProvider>
  </React.StrictMode>,
);
