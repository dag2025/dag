import { useState, useEffect } from 'react';
import axios from 'axios';
import DressBanner from '../../assets/dress-banner.svg';
import { BestOfferForDress } from '../../components/BestOffers';
import NewArrivalsDress from '../../components/NewArrivalsDress';
import VideoAds from '../../components/VideoAd';
import '../../styles/Product.css';

import API_BASE_URL from '../../Config/Api';

function Dress() {
  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDresses();
  }, []);

  const fetchDresses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/dresses`);
      if (response.data.success) {
        setDresses(response.data.dresses || []);
      }
    } catch (err) {
      console.error('Error fetching dresses:', err);
      setError('Failed to load dresses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (price, finalPrice) => {
    if (!price || !finalPrice || price === finalPrice) return 0;
    return Math.round(((price - finalPrice) / price) * 100);
  };

  if (loading) {
    return (
      <div className="text-center mt-5 py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading dresses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mx-auto mt-5" style={{ maxWidth: '500px' }}>
        <strong>Error:</strong> {error}
        <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchDresses}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      
      <div className="container-fluid dress-container mt-4 mb-5">
        <img src={DressBanner} alt="Dress Banner" className="img-fluid mt-4 mb-3" style={{borderRadius:'0px'}} />
        <BestOfferForDress />
        <NewArrivalsDress />
        <div className="row g-3 g-md-4">
          {dresses.map((dress) => {
            const discountPercent = calculateDiscount(dress.price, dress.finalPrice || dress.price);
            const hasDiscount = discountPercent > 0;
            
            return (
              <div className="col-6 col-md-4 col-lg-3" key={dress._id}>
                <div className="dress-card">
                  <div className="card-inner">
                    
                    {/* Discount Badge */}
                    {hasDiscount && (
                      <span className="discount-badge">
                        Save {discountPercent}%
                      </span>
                    )}
                    
                    {/* Image Section */}
                    <div className="image-section">
                      <img 
                        src={dress.images?.cover || "https://via.placeholder.com/250x350?text=No+Image"} 
                        alt={dress.name}
                        className="dress-image"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/250x350?text=No+Image";
                        }}
                      />
                      
                      {/* Hover Button - Shows on Hover, Hides Content */}
                      <button className="view-btn">
                        <a href={`/dress/${dress._id}`}>View Product</a>
                      </button>
                    </div>
                    
                    {/* Content Section - Hidden on Hover */}
                    <div className="content-section">
                      <h4 className="dress-title ">{dress.name || "Unnamed Dress"}</h4>
                      <div className="price-wrapper ">
                        {hasDiscount ? (
                          <>
                            <span className="final-price">₹{dress.finalPrice || dress.price}/-</span>
                            <span className="original-price">₹{dress.price}/-</span>
                          </>
                        ) : (
                          <span className="final-price">₹{dress.price || "0"}/-</span>
                        )}
                      </div>
                      {(dress.category || dress.occasion) && (
                        <div className="dress-meta">
                          {dress.category && <span className="category">{dress.category}</span>}
                          {dress.occasion && <span className="occasion">{dress.occasion}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <VideoAds />
      </div>
    </>
  );
}

export default Dress;