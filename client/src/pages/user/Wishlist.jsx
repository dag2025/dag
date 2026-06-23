import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import Whishlistbanner from '../../assets/wishlist-banner.svg'
import API_BASE_URL from '../../Config/Api';

function Wishlist() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { wishlist, loading, fetchWishlist, removeFromWishlist } = useWishlist();
  const [removingId, setRemovingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [isAuthenticated]);

  const handleRemove = async (itemId) => {
    if (!window.confirm('Remove this item from wishlist?')) return;
    
    setRemovingId(itemId);
    const result = await removeFromWishlist(itemId);
    if (!result.success) {
      alert('Failed to remove item');
    }
    setRemovingId(null);
  };

  const calculateDiscount = (price, finalPrice) => {
    if (!price || !finalPrice || price === finalPrice) return 0;
    return Math.round(((price - finalPrice) / price) * 100);
  };

  if (loading) {
    return (
      <div className="container-fluid text-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .wishlist-container {
          min-height: 70vh;
          max-width: 98%;
          margin: 0 auto;
          padding: 5px;
          background:white;
          margin-bottom:50px;
          margin-top:10px;
        }

        /* Header Styles */
        .wishlist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 0 10px;
        }

        .wishlist-header h3 {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          position: relative;
        }

        .wishlist-header h3:after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #ed3545, #ff6b6b);
          border-radius: 2px;
        }

        .wishlist-count {
          background: #f8f9fa;
          padding: 8px 20px;
          border-radius: 30px;
          color: #666;
          font-size: 15px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .wishlist-count span {
          color: #ed3545;
          font-weight: 700;
          margin-right: 5px;
          font-size: 18px;
        }

        /* Card Grid - Responsive */
        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 25px;
          padding: 10px;
        }

        @media (max-width: 992px) {
          .wishlist-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .wishlist-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          
          .wishlist-header h3 {
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .wishlist-grid {
            gap: 10px;
          }
        }

        /* Card Styles */
        .wishlist-card {
          background: white;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          position: relative;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .wishlist-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 30px rgba(237, 53, 69, 0.12);
          border-color: rgba(237, 53, 69, 0.2);
        }

        /* Image Container */
        .card-image-container {
          position: relative;
          width: 100%;
          padding-top: 125%; /* 4:5 Aspect Ratio */
          overflow: hidden;
          background: #f8f9fa;
        }

        .card-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .wishlist-card:hover .card-image {
          transform: scale(1.08);
        }

        /* Discount Badge */
        .discount-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          background: linear-gradient(135deg, #ed3545 0%, #ff6b6b 100%);
          color: white;
          padding: 5px 12px;
          border-radius: 25px;
          font-size: 12px;
          font-weight: 700;
          z-index: 5;
          box-shadow: 0 4px 10px rgba(237, 53, 69, 0.3);
          border: 2px solid white;
        }

        /* Product Type Badge */
        .type-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(5px);
          color: #333;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          z-index: 5;
          border: 1px solid rgba(237,53,69,0.2);
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }

        /* Hover Overlay */
       .wishlist-container .card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 10;
        }

        .wishlist-card:hover .card-overlay {
          opacity: 1;
        }

        /* Action Buttons */
        .action-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 2px solid transparent;
        }

         .wl-view-btn {
          background: #ed3545;
          color: #ffffff;
          text-decoration:none;
          border-radius:5px;
          padding:3px;
          border:2px solid black;
        }

        .wl-view-btn:hover {
          background: #000000;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(237,53,69,0.3);
        }

        .wl-remove-btn {
          background: #ff0015;
          color: #ffffff;
          text-decoration:none;
          border-radius:5px;
          padding:3px;
          font-weight:bold;
          font-size:15px;
        }

        .wl-remove-btn:hover {
          background: #000000;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(237,53,69,0.3);
        }

        .wl-remove-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Card Content */
        .card-content {
          padding: 16px;
          background: white;
        }

        .product-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0 0 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-category {
          font-size: 13px;
          color: #999;
          margin-bottom: 8px;
        }

        .price-container {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .current-price {
          font-size: 18px;
          font-weight: 700;
          color: #ed3545;
        }

        .original-price {
          font-size: 14px;
          color: #999;
          text-decoration: line-through;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          max-width: 500px;
          margin: 40px auto;
          border: 1px solid #f0f0f0;
        }

        .empty-icon {
          font-size: 80px;
          color: #ed3545;
          opacity: 0.3;
          margin-bottom: 20px;
          animation: heartbeat 1.5s ease infinite;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .empty-state h4 {
          font-size: 24px;
          color: #333;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .empty-state p {
          color: #666;
          margin-bottom: 25px;
          font-size: 16px;
        }

        .shop-now-btn {
          display: inline-block;
          padding: 14px 35px;
          background: linear-gradient(135deg, #ed3545 0%, #ff6b6b 100%);
          color: white;
          text-decoration: none;
          border-radius: 40px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .shop-now-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(237,53,69,0.3);
        }

        /* Loading State */
        .loading-state {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #ed3545;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Font Sizes */
        @media (max-width: 768px) {
          .product-name {
            font-size: 14px;
          }
          
          .current-price {
            font-size: 16px;
          }
          
          .original-price {
            font-size: 12px;
          }
          
          .action-btn {
            padding: 8px 15px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .card-content {
            padding: 12px;
          }
          
          .product-name {
            font-size: 13px;
          }
          
          .action-btn {
            padding: 6px 12px;
            font-size: 11px;
          }
        }
      `}</style>

      <div className="wishlist-container">
         <img src={Whishlistbanner} alt="wishlist-banner" className='img-fluid' style={{width:'100%',borderRadius:'0px'}}/> <br />
        <div className="wishlist-header">
        
          {wishlist?.items?.length > 0 && (
            <div className="wishlist-count">
              <span>{wishlist.items.length}</span> items
            </div>
          )}
        </div>

        {!wishlist?.items?.length ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi bi-heart"></i>
            </div>
            <h4>Your wishlist is empty</h4>
            <p>Save your favorite items here and shop them later!</p>
            <Link to="/dress" className="shop-now-btn">
              Start Shopping <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.items.map((item) => {
              const discountPercent = calculateDiscount(item.price, item.finalPrice);
              const hasDiscount = discountPercent > 0;
              const isRemoving = removingId === item._id;
              
              return (
                <div 
                  className="wishlist-card" 
                  key={item._id}
                  onMouseEnter={() => setHoveredId(item._id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Image Container */}
                  <div className="card-image-container">
                    <img 
                      className='card-image' 
                      src={item.image || "https://via.placeholder.com/400x500"} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x500?text=No+Image";
                      }}
                    />
                    
                    {/* Badges */}
                    {hasDiscount && (
                      <span className="discount-badge">
                        {discountPercent}% OFF
                      </span>
                    )}
                    
                    <span className="type-badge">
                      {item.productType === 'dress' ? 'Dress' : 'Jewellery'}
                    </span>

                    {/* Hover Overlay */}
                    <div className="card-overlay">
                      <Link 
                        to={`/${item.productType}/${item.productId}`}
                        
                      >
                       <small className='btn btn-sm btn-outline-light'>
                        
                        Explore
                       </small>
                
                      </Link>
                      <button 
                        className='btn btn-sm btn-outline-danger'
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemove(item._id);
                        }}
                        disabled={isRemoving}
                      >
                        {isRemoving ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <>
                          <small >Remove</small>
                            
                            
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="card-content">
                    <h3 className="product-name text-capitalize">{item.name}</h3>
                    <div className="product-category">
              {item.category}
                    </div>
                    <div className="price-container">
                      <span className="current-price">₹{item.finalPrice}</span>
                      {hasDiscount && (
                        <span className="original-price">₹{item.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default Wishlist;