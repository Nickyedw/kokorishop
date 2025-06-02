import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartProvider';
import { FavoritesProvider } from './context/FavoritesProvider'; // ✅ Importar aquí también

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider>
      <FavoritesProvider>
        <BrowserRouter basename="/kokoshop/">
          <App />
        </BrowserRouter>
      </FavoritesProvider>
    </CartProvider>
  </React.StrictMode>,
);
