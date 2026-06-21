import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlistCount(0);
      setWishlist(null);
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/wishlist', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setWishlist(response.data.wishlist);
        setWishlistCount(response.data.wishlist.totalItems || 0);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productType, productId) => {
    try {
      const response = await axios.post('http://localhost:5000/api/wishlist/add', 
        { productType, productId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        setWishlist(response.data.wishlist);
        setWishlistCount(response.data.wishlist.totalItems || 0);
        return { success: true };
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add to wishlist' 
      };
    }
  };

  const removeFromWishlist = async (itemId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/wishlist/remove/${itemId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setWishlist(response.data.wishlist);
        setWishlistCount(response.data.wishlist.totalItems || 0);
        return { success: true };
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, error: 'Failed to remove from wishlist' };
    }
  };

  const checkInWishlist = async (productType, productId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/wishlist/check/${productType}/${productId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      return response.data.inWishlist;
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return false;
    }
  };

  const value = {
    wishlistCount,
    wishlist,
    loading,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    checkInWishlist
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};