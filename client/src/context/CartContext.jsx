import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, token } = useAuth();

  // Fetch cart whenever user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCartCount(0);
      setCart(null);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setCart(response.data.cart);
        setCartCount(response.data.cart.totalItems || 0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/cart/add', 
        productData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        setCart(response.data.cart);
        setCartCount(response.data.cart.totalItems || 0);
        return { success: true };
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, error: error.response?.data?.message };
    }
  };

  const updateCart = (updatedCart) => {
    setCart(updatedCart);
    setCartCount(updatedCart.totalItems || 0);
  };

  const value = {
    cartCount,
    cart,
    loading,
    fetchCart,
    addToCart,
    updateCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};