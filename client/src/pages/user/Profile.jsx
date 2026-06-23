import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckoutProvider } from '../../context/CheckoutContext';
import { OrderProvider } from '../../context/OrderContext';
import { WishlistProvider } from '../../context/WishlistContext';
import { CartProvider } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

import API_BASE_URL from '../../Config/Api';

import Cart from './Cart';
import Wishlist from './Wishlist';
import Order from './Order';
import AddressSection from '../../components/checkout/AddressSection';

const Profile = React.memo(() => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalOrders: 0,
    wishlistCount: 0,
    cartCount: 0,
    currentCoins: 0,
    earnedCoins: 0,
    spentCoins: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch user stats from backend
  const fetchUserStats = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch orders
      const ordersRes = await axios.get(`${API_BASE_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orders = ordersRes.data.orders || [];
      
      // Fetch wishlist
      const wishlistRes = await axios.get(`${API_BASE_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch cart
      const cartRes = await axios.get(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Calculate total coins earned from all orders (sum of coinsEarned)
      const totalEarnedCoins = orders.reduce((sum, order) => sum + (order.coinsEarned || 0), 0);
      
      // Calculate total coins spent (sum of coinsApplied)
      const totalSpentCoins = orders.reduce((sum, order) => sum + (order.coinsApplied || 0), 0);
      
      // Current balance from user object (should match earned - spent, but we trust the database)
      const currentCoins = user?.coins || 0;

      setStats({
        totalOrders: orders.length,
        wishlistCount: wishlistRes.data.wishlist?.items?.length || 0,
        cartCount: cartRes.data.cart?.items?.length || 0,
        currentCoins: currentCoins,
        earnedCoins: totalEarnedCoins,
        spentCoins: totalSpentCoins
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (user && token) {
      fetchUserStats();
    }
  }, [user, token, fetchUserStats]);

  // Memoized styles to avoid recreating on every render
  const styles = useMemo(() => ({
    container: {
      maxWidth: '98%',
      padding: '10px',
    },
    profileCard: {
      background: 'linear-gradient(135deg, #ed3545 0%, #b71825 100%)',
      borderRadius: '24px',
      padding: '30px',
      color: 'white',
      marginBottom: '30px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    avatar: {
      width: '80px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '40px',
      color: 'white',
    },
    userName: {
      fontSize: '28px',
      fontWeight: '700',
      margin: '0 0 5px'
    },
    userEmail: {
      fontSize: '16px',
      opacity: '0.9',
      margin: 0
    },
    coinsCard: {
      background: 'rgba(255,255,255,0.15)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '20px'
    },
    coinsTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '15px'
    },
    coinsAmount: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '10px'
    },
    coinsStats: {
      display: 'flex',
      gap: '20px',
      fontSize: '14px',
      opacity: '0.9'
    },
    tabsContainer: {
      display: 'flex',
      gap: '15px',
      marginBottom: '30px',
      flexWrap: 'wrap'
    },
    tab: {
      flex: 1,
      minWidth: '200px',
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '2px solid transparent',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      position: 'relative',
      overflow: 'hidden'
    },
    tabActive: {
      borderColor: '#ed3545',
      background: 'linear-gradient(135deg, #fff0f0 0%, #ffffff 100%)',
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 24px rgba(237,53,69,0.15)'
    },
    tabIcon: {
      fontSize: '32px',
      color: '#ed3545',
      marginBottom: '10px'
    },
    tabTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#333',
      marginBottom: '5px'
    },
    tabCount: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#ed3545'
    },
    tabBadge: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: '#ed3545',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600'
    },
    contentContainer: {
      background: 'white',
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
      marginBottom: '30px'
    },
    addressContainer: {
      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
      borderRadius: '24px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
    },
    addressTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#333',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255,255,255,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    },
    spinner: {
      width: '50px',
      height: '50px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #ed3545',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    userBox: {
      background: '#ed3545',
      borderRadius: '20px',
      color: 'white',
      padding: '20px',
    }
  }), []);

  // Memoize coin animation style
  const coinAnimation = useMemo(() => ({
    fontSize: '50px',
    animation: 'coin-twist 2s infinite linear',
    transformStyle: 'preserve-3d',
    display: 'inline-block'
  }), []);

  // Add keyframes animation once
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes coin-twist {
        0% { transform: rotateY(0deg); }
        100% { transform: rotateY(360deg); }
      }
      
      .profile-tab {
        transition: all 0.3s ease;
      }
      
      .profile-tab:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(237,53,69,0.15);
        border-color: #ed3545;
      }
      
      .profile-tab.active {
        border-color: #ed3545;
        background: linear-gradient(135deg, #fff0f0 0%, #ffffff 100%);
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(237,53,69,0.15);
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingOverlay}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.container} className='mt-4'>
      {/* Profile Header */}
      <div style={styles.userBox}>
        <div className='row'>
          <div style={styles.userInfo} className='col'>
            <div style={styles.avatar}>
              <i className="bi bi-person-circle" style={{fontSize:'50px', color: 'white'}}></i>
            </div>
            <div>
              <h2 style={styles.userName}>{user?.name || 'User'}</h2>
              <p style={styles.userEmail}>{user?.email || 'email@example.com'}</p>
            </div>
          </div>
          
          <div style={styles.coinsCard} className='col mt-2'>
            <div style={styles.coinsTitle} className='mx-auto'>
              <span>Dag Coins</span>
            </div>
            <div style={{...styles.coinsAmount, perspective:'500px'}}>
              <i className="bi bi-coin text-warning" style={coinAnimation}></i>  {stats.currentCoins}
            </div>
            <div style={styles.coinsStats}>
              <span>Earned: {stats.earnedCoins}</span>
              <span>Spent: {stats.spentCoins}</span>
            </div>
           
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabsContainer} className='mt-3'>
        <div 
          className={`profile-tab ${activeTab === 0 ? 'active' : ''}`}
          style={{ ...styles.tab, ...(activeTab === 0 ? styles.tabActive : {}) }}
          onClick={() => setActiveTab(0)}
        >
          <div style={styles.tabIcon}>
            <i className="bi bi-box"></i>
          </div>
          <div style={styles.tabTitle}>My Orders</div>
          <div style={styles.tabCount}>{stats.totalOrders}</div>
          {stats.totalOrders > 0 && (
            <span style={styles.tabBadge}>{stats.totalOrders}</span>
          )}
        </div>

        <div 
          className={`profile-tab ${activeTab === 1 ? 'active' : ''}`}
          style={{ ...styles.tab, ...(activeTab === 1 ? styles.tabActive : {}) }}
          onClick={() => setActiveTab(1)}
        >
          <div style={styles.tabIcon}>
            <i className="bi bi-bag-check"></i>
          </div>
          <div style={styles.tabTitle}>My Cart</div>
          <div style={styles.tabCount}>{stats.cartCount}</div>
          {stats.cartCount > 0 && (
            <span style={styles.tabBadge}>{stats.cartCount}</span>
          )}
        </div>

        <div 
          className={`profile-tab ${activeTab === 2 ? 'active' : ''}`}
          style={{ ...styles.tab, ...(activeTab === 2 ? styles.tabActive : {}) }}
          onClick={() => setActiveTab(2)}
        >
          <div style={styles.tabIcon}>
            <i className="bi bi-heart"></i>
          </div>
          <div style={styles.tabTitle}>My Wishlist</div>
          <div style={styles.tabCount}>{stats.wishlistCount}</div>
          {stats.wishlistCount > 0 && (
            <span style={styles.tabBadge}>{stats.wishlistCount}</span>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div style={styles.addressContainer}>
        <h1 style={styles.addressTitle}>
          <i className="bi bi-geo-alt" style={{ color: '#ed3545' }}></i>
          Saved Addresses
        </h1>
        <CheckoutProvider>
          <AddressSection />
        </CheckoutProvider>
      </div>

      {/* Tab Content */}
      <div style={styles.contentContainer}>
        {activeTab === 0 && (
          <OrderProvider>
            <Order />
          </OrderProvider>
        )}
        
        {activeTab === 1 && (
          <CartProvider>
            <Cart />
          </CartProvider>
        )}
        
        {activeTab === 2 && (
          <WishlistProvider>
            <Wishlist />
          </WishlistProvider>
        )}
      </div>
    </div>
  );
});

Profile.displayName = 'Profile';

export default Profile;