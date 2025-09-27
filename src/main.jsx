// src/main.jsx
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartProvider';
import { FavoritesProvider } from './context/FavoritesProvider';

// Normaliza: '/kokorishop/' -> '/kokorishop', '/' -> ''
const BASENAME = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider>
      <FavoritesProvider>
        <BrowserRouter basename={BASENAME}>
          <App />
        </BrowserRouter>
      </FavoritesProvider>
    </CartProvider>
  </React.StrictMode>,
);
