import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

function UserManagement() {
  const { user,token } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [offcanvasOpen, setOffcanvasOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalReviews: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users...');
      
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Users response:', res.data);
      
      if (res.data.success) {
        // Filter out admin users - only show regular users
        const regularUsers = res.data.users.filter(user => user.role !== 'admin');
        console.log('👤 Regular users:', regularUsers);
        setUsers(regularUsers);
        calculateStats(regularUsers);
      }
    } catch (err) {
      console.error('❌ Error fetching users:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async (userId) => {
    try {
      setReviewsLoading(true);
      console.log(`🔍 Fetching reviews for user: ${userId}`);
      
      const res = await axios.get(`http://localhost:5000/api/admin/users/${userId}/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Reviews response:', res.data);
      
      if (res.data.success) {
        setUserReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error('❌ Error fetching user reviews:', err.response?.data || err.message);
      setUserReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const calculateStats = (usersData) => {
    const totalReviews = usersData.reduce((sum, user) => sum + (user.reviewCount || 0), 0);
    const activeUsers = usersData.filter(user => user.isActive).length;
    
    setStats({
      totalUsers: usersData.length,
      activeUsers,
      totalReviews,
      averageRating: '4.2'
    });
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user._id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const openOffcanvas = (user) => {
    setSelectedUser(user);
    fetchUserReviews(user._id);
    setOffcanvasOpen(true);
  };

  const closeOffcanvas = () => {
    setOffcanvasOpen(false);
    setSelectedUser(null);
    setUserReviews([]);
  };

  const styles = {
    container: {
      maxWidth: '98%',
      margin: '0 auto',
      padding: '10px',
     
      background: '#ffffff',
      minHeight: '100vh'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#333',
      marginBottom: '20px',
      position: 'relative'
    },
    statsGrid: {
      display: 'grid',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'white',
      borderRadius: '16px',
      width: '100%',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0'
    },
    statIcon: {
      fontSize: '1rem',
      color: '#ed3545',
      marginBottom: '10px'
    },
    statValue: {
      fontSize: '1.8rem',
      fontWeight: 700,
      color: '#333'
    },
    statLabel: {
      color: '#666',
      fontSize: '0.9rem'
    },
    filtersSection: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '30px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0'
    },
    searchInput: {
      width: '100%',
      padding: '12px',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '14px'
    },
    tableContainer: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0',
      overflowX: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '800px'
    },
    th: {
      background: '#f8f9fa',
      padding: '15px',
      textAlign: 'left',
      borderBottom: '2px solid #ed3545',
      fontWeight: 600,
      color: '#333'
    },
    td: {
      padding: '15px',
      borderBottom: '1px solid #e0e0e0',
      verticalAlign: 'middle'
    },
    userAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #ed3545, #ff6b6b)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 600,
      fontSize: '16px'
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      display: 'inline-block'
    },
    activeBadge: {
      background: '#d4edda',
      color: '#155724'
    },
    inactiveBadge: {
      background: '#f8d7da',
      color: '#721c24'
    },
    reviewBadge: {
      background: user.reviewCount > 0 ? '#e7f3ff' : '#f0f0f0',
      color: user.reviewCount > 0 ? '#004085' : '#666',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      display: 'inline-block',
      marginRight: '8px'
    },
    viewBtn: {
      background: '#ed3545',
      border: 'none',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '13px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      transition: 'all 0.2s'
    },
    offcanvas: {
      position: 'fixed',
      top:'60px',
      left: 0,
      right: 0,
      height: '60vh',
      background: 'white',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      zIndex: 1050,
      transform: 'translateY(-100%)',
      transition: 'transform 0.3s ease',
     
    },
    offcanvasOpen: {
      transform: 'translateY(0)'
    },
    offcanvasHeader: {
      padding: '20px',
      borderBottom: '2px solid #ed3545',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'white'
    },
    offcanvasBody: {
      padding: '20px',
      maxHeight: 'calc(60vh - 80px)',
      overflowY: 'auto'
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#666',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%'
    },
    reviewCard: {
      display: 'flex',
      gap: '15px',
      padding: '15px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      marginBottom: '10px',
      background: '#f8f9fa'
    },
    reviewProductImage: {
      width: '60px',
      height: '60px',
      objectFit: 'cover',
      borderRadius: '8px',
      border: '1px solid #ddd'
    },
    starRating: {
      color: '#ffc107',
      fontSize: '14px'
    },
    loadingSpinner: {
      textAlign: 'center',
      padding: '50px'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #ed3545',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 15px'
    }
  };

  // Add keyframes animation
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .view-btn:hover {
      background: #d42c3a !important;
    }
    .offcanvas-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1040;
      display: none;
    }
    .offcanvas-overlay.show {
      display: block;
    }
    .close-btn:hover {
      background: #f0f0f0;
    }
  `;
  document.head.appendChild(styleSheet);

  if (loading) {
    return (
      <div style={styles.loadingSpinner}>
        <div style={styles.spinner}></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        User Management System
      </h1>

      {/* Stats Cards */}
      <div style={styles.statsGrid} className='d-flex overflow-auto'>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><i className="bi bi-people "></i></div>
          <div style={styles.statValue}>{stats.totalUsers}</div>
          <div style={styles.statLabel}>Total Users</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><i className="bi bi-check-circle"></i></div>
          <div style={styles.statValue}>{stats.activeUsers}</div>
          <div style={styles.statLabel}>Active Users</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><i className="bi bi-star"></i></div>
          <div style={styles.statValue}>{stats.totalReviews}</div>
          <div style={styles.statLabel}>Total Reviews</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><i className="bi bi-graph-up"></i></div>
          <div style={styles.statValue}>{stats.averageRating}</div>
          <div style={styles.statLabel}>Avg Rating</div>
        </div>
      </div>

      {/* Search Filter */}
      <div style={styles.filtersSection}>
        <input
          type="text"
          style={styles.searchInput}
          placeholder=" Search by name, email, or user ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div style={styles.tableContainer}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <i className="bi bi-people" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3">No users found</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>User</th>
                <th style={styles.th}>User ID</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Joined</th>
                <th style={styles.th}>Reviews</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user._id}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={styles.userAvatar}>
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <small>{user._id.slice(-8)}...</small>
                  </td>
                  <td style={styles.td} >
                    <a href={`mailto:${user.email}`} style={{ color: '#ed3545', textDecoration: 'none',textTransform:'none' }}>
                      {user.email}
                    </a>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      ...(user.isActive ? styles.activeBadge : styles.inactiveBadge)
                    }}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <small>{formatDate(user.createdAt)}</small>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: user.reviewCount > 0 ? '#e7f3ff' : '#f0f0f0',
                      color: user.reviewCount > 0 ? '#004085' : '#666'
                    }}>
                      {user.reviewCount} reviews
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.viewBtn}
                      onClick={() => openOffcanvas(user)}
                      className=""
                    >
                      <i className="bi bi-star text-white"></i> View Reviews
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Offcanvas Overlay */}
      <div 
        className={`offcanvas-overlay  ${offcanvasOpen ? 'show' : ''}`}
        onClick={closeOffcanvas}
      ></div>

      {/* Reviews Offcanvas */}
      <div style={{
        ...styles.offcanvas,
        ...(offcanvasOpen ? styles.offcanvasOpen : {})
      }}>
        <div style={styles.offcanvasHeader}>
          <h5 style={{ margin: 0, color: '#ed3545' }}>
            <i className="bi bi-star"></i> Reviews by {selectedUser?.name}
          </h5>
          <button 
            style={styles.closeBtn} 
            onClick={closeOffcanvas}
            className="close-btn"
          >
            ×
          </button>
        </div>
        <div style={styles.offcanvasBody} >
          {reviewsLoading ? (
            <div style={styles.loadingSpinner}>
              <div style={styles.spinner}></div>
              <p>Loading reviews...</p>
            </div>
          ) : userReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <i className="bi bi-chat" style={{ fontSize: '3rem', color: '#ccc' }}></i>
              <p className="mt-3">No reviews found for this user</p>
            </div>
          ) : (
            userReviews.map((review, idx) => (
              <div key={idx} style={styles.reviewCard}>
             
                <div style={{ flex: 1 }} className='d-flex justify-content-between'>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                    <div style={styles.starRating}>
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`bi ${i < review.rating ? 'bi-star-fill' : 'bi-star'}`}
                          style={{ color: i < review.rating ? '#ffc107' : '#ccc' }}
                        ></i>
                      ))}
                    </div>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: '14px', color: '#333' }}>{review.comment}</p>
                  <small style={{ color: '#999' }}>
                    <i className="bi bi-calendar"></i> {formatDate(review.createdAt)}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;