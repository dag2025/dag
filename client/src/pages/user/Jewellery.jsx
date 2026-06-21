import { useState, useEffect } from 'react';
import axios from 'axios';
import Jbanner from '../../assets/jewel-banner.svg'
import VideoAd from '../../components/VideoAd'
import { BestOfferForJewel } from '../../components/BestOffers';
import NewArrivalsJewellery from '../../components/NewArrivalsJewellery';
import '../../styles/Product.css'; // Using the same CSS as Dress component

function Jewellery() {
  const [jewellery, setJewellery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJewellery();
  }, []);

  const fetchJewellery = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/jewellery');
      console.log('API Response:', response.data); // Debug log
      
      if (response.data.success) {
        // ✅ FIX 1: Corrected typo from 'jewelley' to 'jewellery'
        setJewellery(response.data.jewellery || []);
      }
    } catch (err) {
      console.error('Error fetching jewellery:', err);
      setError('Failed to load jewellery. Please try again later.');
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
        <p className="mt-3">Loading jewellery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mx-auto mt-5" style={{ maxWidth: '500px' }}>
        <strong>Error:</strong> {error}
        <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchJewellery}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="container-fluid dress-container mt-4"> {/* Using same container class */}
        <img src={Jbanner} alt="Jewellery Banner" className='img-fluid'/>
        <div className="mt-2">
          <BestOfferForJewel/>
        </div>
        <div className="mt-2 mb-2">
          <NewArrivalsJewellery/>
        </div>
        {jewellery.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No jewellery items found.</p>
          </div>
        ) : (
          <div className="row g-3 g-md-4">
            {jewellery.map((item) => {
              const discountPercent = calculateDiscount(item.price, item.finalPrice || item.price);
              const hasDiscount = discountPercent > 0;
              
              return (
                <div className="col-6 col-md-4 col-lg-3" key={item._id}>
                  <div className="dress-card"> {/* Using same card class */}
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
                          // ✅ FIX 2: Corrected image path - using item.image (not item.images?.image)
                          src={item.image || "https://via.placeholder.com/250x350?text=No+Image"} 
                          alt={item.name}
                          className="dress-image"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/250x350?text=No+Image";
                          }}
                        />
                        
                        {/* Hover Button */}
                        <button className="view-btn">
                          <a href={`/jewellery/${item._id}`}>View Product</a>
                        </button>
                      </div>
                      
                      {/* Content Section */}
                      <div className="content-section">
                        <h4 className="dress-title">{item.name || "Unnamed Jewellery"}</h4>
                        <div className="price-wrapper">
                          {hasDiscount ? (
                            <>
                              <span className="final-price">₹{item.finalPrice || item.price}/-</span>
                              <span className="original-price">₹{item.price}/-</span>
                            </>
                          ) : (
                            <span className="final-price">₹{item.price || "0"}/-</span>
                          )}
                        </div>
                        {(item.category || item.occasion || item.material) && (
                          <div className="dress-meta">
                            {item.category && <span className="category">{item.category}</span>}
                          
                            {item.occasion && <span className="occasion">{item.occasion}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-2 mb-2">
          <VideoAd/>
        </div>
      </div>
    </>
  );
}

export default Jewellery;