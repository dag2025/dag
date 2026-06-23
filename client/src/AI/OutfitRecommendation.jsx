import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_BASE_URL from '../Config/Api';

const OutfitRecommendations = ({ occasion, season }) => {
  const { isAuthenticated, token } = useAuth();
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchRecommendations();
  }, [occasion, season]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/recommend/outfit`, {
        params: { occasion, season },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOutfits(res.data.outfits);
      }
    } catch (err) {
      console.error('Error fetching outfits:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (outfit, action) => {
    try {
      await axios.post(`${API_BASE_URL}/recommend/feedback`, 
        { dressId: outfit.dress._id, jewelId: outfit.jewel._id, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

const handleViewProduct = (outfit, type) => {
  sendFeedback(outfit, 'click');
  // Navigate to the correct product page
  const route = type === 'dress' ? 'dress' : 'jewellery';
  window.location.href = `/${route}/${outfit[type]._id}`;
};

  if (loading) return (
    <div className="text-center py-4">
      <div className="spinner-border text-danger" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger text-center mx-3">{error}</div>
  );

  if (!outfits.length) return null;

  return (
    <>
      <style>{`
        .outfit-section {
        max-width: 98%;
          padding: 5px;
          background: linear-gradient(to bottom, #fff, #fafafa);
        }

        .section-title {
          margin-bottom: 25px;
          font-size: 24px;
          font-weight: 600;
          color: #333;
          position: relative;
        }

        .section-title:after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: #ed3545;
          border-radius: 2px;
        }

        .outfit-scroll {
          display: flex;
          overflow-x: auto;
          gap: 20px;
          padding: 10px 20px 20px;
          scrollbar-width: thin;
          scrollbar-color: #ed3545 #f0f0f0;
        }

        .outfit-scroll::-webkit-scrollbar {
          height: 6px;
        }

        .outfit-scroll::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-radius: 10px;
        }

        .outfit-scroll::-webkit-scrollbar-thumb {
          background: #ed3545;
          border-radius: 10px;
        }

        .outfit-card {
          flex: 0 0 auto;
          width: 340px;
          background: white;
          border-radius: 5px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          overflow: hidden;
          border: 1px solid #f0f0f0;
        }

        .outfit-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(237,53,69,0.1);
        }

        .outfit-images {
          display: flex;
          padding: 15px 15px 5px;
          gap: 10px;
          position: relative;
        }

        .product-image-container {
          flex: 1;
          position: relative;
          
          overflow: hidden;
          aspect-ratio: 3/4;
          cursor: pointer;
          background: #f8f9fa;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .product-image-container:hover .product-image {
          transform: scale(1.08);
        }

        .outfit-section .product-image-container .product-type-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background:transparent;
          border:none;
          color:#ed3545;
          font-size: 8px;
          padding: 2px 6px;
        
          z-index: 2;
        }

        .view-product-btn {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(237,53,69,0.9);
          color: white;
          text-align: center;
          padding: 8px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transform: translateY(100%);
          transition: transform 0.2s ease;
          backdrop-filter: blur(4px);
          border: none;
          width: 100%;
          cursor: pointer;
        }

        .product-image-container:hover .view-product-btn {
          transform: translateY(0);
        }

        .outfit-info {
          padding: 15px;
        }

        .product-names {
          margin-bottom: 8px;
        }

        .product-name {
          font-size: 14px;
          color: #333;
          margin: 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-name.dress {
          color: #ed3545;
          font-weight: 500;
        }

        .product-name.jewel {
          color: #666;
        }

        .outfit-price {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed #e0e0e0;
        }

        .price-tag {
          font-size: 18px;
          font-weight: 700;
          color: #333;
        }

        .price-tag span {
          font-size: 12px;
          font-weight: 400;
          color: #999;
          margin-left: 4px;
        }

        .plus-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #f0f0f0;
          border-radius: 50%;
          color: #ff0000;
          font-size: 12px;
        }

        /* Mobile Responsive */
        @media (max-width: 576px) {
          .outfit-card {
            width: 280px;
          }
          
          .outfit-images {
            padding: 10px 10px 0;
          }
          
          .price-tag {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="outfit-section">
        <h3 className="section-title text-uppercase">
        DAG AI Styled for You
        </h3>

        <div className="outfit-scroll">
          {outfits.map((outfit, idx) => (
            <div 
              key={idx} 
              className="outfit-card"
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="outfit-images">
                {/* Dress Image */}
                {/* Dress Image */}
<div className="product-image-container">
  <span className="product-type-badge text-white"> Dress</span>
  <img 
    src={outfit.dress.images?.cover || outfit.dress.image} 
    alt={outfit.dress.name}
    className="product-image"
  />
  <button 
    className="view-product-btn"
    onClick={() => handleViewProduct(outfit, 'dress')}
  >
    View Dress
  </button>
</div>

{/* Jewelry Image */}
<div className="product-image-container">
  <span className="product-type-badge text-white">Jewelry</span>
  <img 
    src={outfit.jewel.image} 
    alt={outfit.jewel.name}
    className="product-image"
  />
  <button 
    className="view-product-btn"
    onClick={() => handleViewProduct(outfit, 'jewel')}
  >
    View Jewelry
  </button>
</div>
              </div>

              <div className="outfit-info">
                <div className="product-names">
                  <div className="product-name dress">
                    <i className="bi bi-dot me-1"></i>
                    {outfit.dress.name}
                  </div>
                  <div className="product-name jewel">
                    <i className="bi bi-dot me-1"></i>
                    {outfit.jewel.name}
                  </div>
                </div>

                <div className="outfit-price">
                  <div className="price-tag">
                    ₹{outfit.dress.finalPrice + outfit.jewel.finalPrice}
                    <span>total</span>
                  </div>
                  <small style={{ color: '#999', fontSize: '11px' }}>
                    Click images
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default OutfitRecommendations;