import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../Config/Api';
const NewArrivalsDress = () => {
  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  const fetchNewArrivals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/dresses`);
      
      if (response.data.success) {
        // Sort by createdAt (newest first) and take first 10
        const sorted = response.data.dresses
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
        
        setDresses(sorted);
      }
    } catch (err) {
      console.error('Error fetching new arrivals:', err);
      setError('Failed to load new arrivals');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (price, finalPrice) => {
    if (!price || !finalPrice || price === finalPrice) return 0;
    return Math.round(((price - finalPrice) / price) * 100);
  };

  const isNewArrival = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // New if added within last 7 days
  };

  const styles = {
    container: {
      maxWidth: '98%',
      margin: '0 auto',
      padding: '5px',
      marginTop: '10px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#333',
      position: 'relative',
      paddingLeft: '15px'
    },
    titleAccent: {
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: '4px',
      height: '24px',
      background: 'linear-gradient(135deg, #ed3545, #ff6b6b)',
      borderRadius: '2px'
    },
    viewAll: {
      color: '#ed3545',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      transition: 'all 0.2s'
    },
    scrollContainer: {
      display: 'flex',
      overflowX: 'auto',
      gap: '20px',
      padding: '10px 0 20px',
      scrollbarWidth: 'thin',
      scrollbarColor: '#ed3545 #f0f0f0',
      WebkitOverflowScrolling: 'touch'
    },
    card: {
      flex: '0 0 auto',
      width: '250px',
      background: 'white',
      borderRadius: '5px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      border: '1px solid #f0f0f0',
      position: 'relative',
      cursor: 'pointer'
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: '320px',
      overflow: 'hidden'
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.5s ease'
    },
    newBadge: {
      position: 'absolute',
      top: '12px',
      left: '12px',
      background: 'linear-gradient(135deg, #ed3545, #ff6b6b)',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      zIndex: 2,
      boxShadow: '0 2px 8px rgba(237,53,69,0.3)'
    },
    discountBadge: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: '#28a745',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      zIndex: 2,
      boxShadow: '0 2px 8px rgba(40,167,69,0.3)'
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0,
      transition: 'opacity 0.3s ease',
      zIndex: 3
    },
    viewBtn: {
      background: '#ed3545',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '30px',
      fontSize: '14px',
      fontWeight: '600',
      textDecoration: 'none',
      transform: 'translateY(20px)',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    },
    content: {
      padding: '16px'
    },
    productName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#333',
      margin: '0 0 5px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    category: {
      fontSize: '13px',
      color: '#999',
      marginBottom: '8px'
    },
    priceContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    finalPrice: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#ed3545'
    },
    originalPrice: {
      fontSize: '14px',
      color: '#999',
      textDecoration: 'line-through'
    },
    metaContainer: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    metaTag: {
      background: '#f0f0f0',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      color: '#666'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '40px'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #ed3545',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 15px'
    },
    errorContainer: {
      textAlign: 'center',
      padding: '40px',
      color: '#dc3545'
    }
  };

  // Add keyframes animation
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .newarrival-card:hover img {
      transform: scale(1.08);
    }
    
    .newarrival-card:hover .card-overlay {
      opacity: 1;
    }
    
    .newarrival-card:hover .view-btn {
      transform: translateY(0);
    }
    
    .scroll-container::-webkit-scrollbar {
      height: 6px;
    }
    
    .scroll-container::-webkit-scrollbar-track {
      background: #f0f0f0;
      border-radius: 10px;
    }
    
    .scroll-container::-webkit-scrollbar-thumb {
      background: #ed3545;
      border-radius: 10px;
    }
    
    .scroll-container::-webkit-scrollbar-thumb:hover {
      background: #d42c3a;
    }
  `;
  document.head.appendChild(styleSheet);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading new arrivals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <i className="bi bi-exclamation-triangle" style={{ fontSize: '40px' }}></i>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title} className='text-uppercase'>
          <span style={styles.titleAccent}></span>
          New Arrivals - Dresses
        </div>
        <Link to="/dresses?sort=new" style={styles.viewAll}>
          View All <i className="bi bi-arrow-right"></i>
        </Link>
      </div>

      <div className="scroll-container" style={styles.scrollContainer}>
        {dresses.map((dress) => {
          const discountPercent = calculateDiscount(dress.price, dress.finalPrice);
          const isNew = isNewArrival(dress.createdAt);

          return (
            <div 
              key={dress._id} 
              className="newarrival-card"
              style={styles.card}
            >
                  <Link 
                  className='text-decoration-none'
                    to={`/dress/${dress._id}`} 
                   
                    
                >
              <div style={styles.imageContainer}>
                <img 
                  src={dress.images?.cover || 'https://via.placeholder.com/280x320'} 
                  alt={dress.name}
                  style={styles.image}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/280x320'}
                />
                
                {isNew && <span style={styles.newBadge}>✨ NEW</span>}
                {discountPercent > 0 && (
                  <span style={styles.discountBadge}>{discountPercent} % OFF</span>
                )}
                
             
              </div>

              <div style={styles.content}>
                <h4 style={styles.productName}>{dress.name}</h4>
                <p style={styles.category}>{dress.category || 'Uncategorized'}</p>
                
                <div style={styles.priceContainer}>
                  <span style={styles.finalPrice}>₹{dress.finalPrice}</span>
                  {discountPercent > 0 && (
                    <span style={styles.originalPrice}>₹{dress.price}</span>
                  )}
                </div>

              </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NewArrivalsDress;