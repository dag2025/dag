import '../../styles/ViewJewellery.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Review from './Review';
import SizePrediction from '../../AI/SizePrediction';
import SizeGuide from '../../assets/jewel-size-guide.png';
import API_BASE_URL from '../../Config/Api';
function ViewJewellery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [jewellery, setJewellery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToWishlist, checkInWishlist } = useWishlist();
  const [isInWishlist, setIsInWishlist] = useState(false);
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Gallery Modal State
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (isAuthenticated && jewellery) {
        const inWishlist = await checkInWishlist('jewellery', jewellery._id);
        setIsInWishlist(inWishlist);
      }
    };
    checkWishlistStatus();
  }, [isAuthenticated, jewellery, checkInWishlist]);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      alert('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    if (isInWishlist) {
      setIsInWishlist(false);
    } else {
      const result = await addToWishlist('jewellery', jewellery._id);
      if (result.success) {
        setIsInWishlist(true);
      } else {
        alert(result.error);
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchJewelleryDetails();
    }
  }, [id]);

  useEffect(() => {
    if (jewellery?.category) {
      fetchRelatedProducts(jewellery.category);
    }
  }, [jewellery]);

  const fetchJewelleryDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/jewellery/${id}`);
      if (response.data.success) {
        setJewellery(response.data.jewellery);
      }
    } catch (err) {
      console.error('Error fetching jewellery:', err);
      setError('Failed to load jewellery details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (category) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/jewellery`);
      if (response.data.success) {
        const related = response.data.jewellery
          .filter(j => j.category === category && j._id !== id)
          .slice(0, 4);
        setRelatedProducts(related);
      }
    } catch (err) {
      console.error('Error fetching related products:', err);
    }
  };

  const calculateDiscount = (price, finalPrice) => {
    if (!price || !finalPrice || price === finalPrice) return 0;
    return Math.round(((price - finalPrice) / price) * 100);
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handleAddToCart = async () => {
    if (jewellery.sizes && jewellery.sizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    setAddingToCart(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/cart/add`,
        {
          productType: 'jewellery',
          productId: jewellery._id,
          selectedSize: selectedSize || null,
          quantity: quantity
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('✅ Item added to cart successfully!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // FIX: Buy Now navigates directly to checkout
  const handleBuyNow = () => {
    if (jewellery.sizes && jewellery.sizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }
    
    navigate('/checkout', {
      state: {
        type: 'jewellery',
        data: {
          ...jewellery,
          selectedSize: selectedSize,
          quantity: quantity
        }
      }
    });
  };

  // FIX: Enhanced share functionality
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = jewellery?.name || 'Check out this jewellery';
    const shareText = `I found this beautiful jewellery: ${jewellery?.name}. Price: ₹${jewellery?.finalPrice || jewellery?.price}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Share cancelled or failed');
        }
      }
    }
    
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
  };

  const shareOnSocial = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(jewellery?.name || 'Beautiful Jewellery');
    const text = encodeURIComponent(`Check out this jewellery: ${jewellery?.name} - ₹${jewellery?.finalPrice || jewellery?.price}`);
    
    let shareLink = '';
    switch(platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${text}%20${url}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'instagram':
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Link copied! You can now paste it on Instagram.');
        closeShareModal();
        return;
      case 'pinterest':
        shareLink = `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
        break;
      default:
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        closeShareModal();
        return;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
    closeShareModal();
  };

  const openGalleryModal = (image) => {
    setSelectedImage(image);
    setShowGalleryModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeGalleryModal = () => {
    setShowGalleryModal(false);
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  if (loading) {
    return (
      <div className="view-jewellery">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading jewellery details...</p>
        </div>
      </div>
    );
  }

  if (error || !jewellery) {
    return (
      <div className="view-jewellery">
        <div className="error-state">
          <i className="bi bi-exclamation-circle"></i>
          <h3>Oops! Something went wrong</h3>
          <p>{error || 'Jewellery not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/jewellery')}>
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  const discountPercent = calculateDiscount(jewellery.price, jewellery.finalPrice);
  const hasDiscount = discountPercent > 0;
  const hasSizes = jewellery.sizes && jewellery.sizes.length > 0;

  return (
    <div className="view-jewellery mt-4">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Home</Link> <span className="separator">›</span>
        <Link to="/jewellery">Jewellery</Link> <span className="separator">›</span>
        <span className="current">{jewellery.name}</span>
      </div>

      {/* Main Product Section */}
      <div className="product-main">
        <div className="product-grid">
          {/* Left Column - Image */}
          <div className="image-column">
            <div className="main-image-container">
              <img 
                src={jewellery.image || "https://via.placeholder.com/600x800?text=No+Image"} 
                alt={jewellery.name}
                className="main-image"
                onClick={() => openGalleryModal(jewellery.image)}
              />
              {hasDiscount && (
                <span className="discount-badge-large">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
                        <div className="row">
              <div className="col">
      <div className="combo-ad d-flex flex-row gap-5 justify-content-center align-items-center mt-4 ">
            <div>
              <h1>20% OFF</h1>
            </div>
            <div>
              <h4 className='text-uppercase'>Create  combo</h4>
              <small>Get 20% off when you buy 2 items</small><br />
              <button className="combo-ad-btn"><a href="/combos" className='text-white'>Create Combo</a></button>
            </div>
            </div>
              </div>
              <div className="col">
                      <div className="combo-ad d-flex flex-row gap-5 justify-content-center align-items-center mt-4 ">
            <div>
              <h1>10% OFF</h1>
            </div>
            <div>
              <h4 className='text-uppercase'>Send gift</h4>
              <small>Get 10% off when you buy 2 items</small><br />
              <button className="combo-ad-btn"><a href="/combos" className='text-white'>Send Gift</a></button>
            </div>
            </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="details-column">
            <h1 className="product-title">{jewellery.name}</h1>
            
            <div className="product-meta">
              {jewellery.category && (
                <span className="category-tag">{jewellery.category}</span>
              )}
              {jewellery.occasion && (
                <span className="occasion-tag">{jewellery.occasion}</span>
              )}
            </div>

            {/* Price Section */}
            <div className="price-section">
              {hasDiscount ? (
                <>
                  <span className="final-price">₹{jewellery.finalPrice}/-</span>
                  <span className="original-price">₹{jewellery.price}/-</span>
                  <span className="save-badge">Save {discountPercent}%</span>
                </>
              ) : (
                <span className="final-price">₹{jewellery.price}/-</span>
              )}
            </div>

            {/* Material & Color */}
            <div className="specs-grid">
              {jewellery.material && (
                <div className="spec-item">
                  <span className="spec-label">Material</span>
                  <span className="spec-value">{jewellery.material}</span>
                </div>
              )}
              
              {jewellery.color && (
                <div className="spec-item">
                  <span className="spec-label">Color</span>
                  <div className="color-display">
                    <span 
                      className="color-dot" 
                      style={{ backgroundColor: jewellery.color.toLowerCase() }}
                    ></span>
                    <span className="color-name">{jewellery.color}</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Size Prediction Section */}
            <SizePrediction
              productId={jewellery._id}
              productType="jewellery"
              productSizes={jewellery.sizes}
              onSizeSelect={handleSizeSelect}
              selectedSize={selectedSize}
              productCategory={jewellery.category}
            />

            {/* Size Selection */}
            {hasSizes && (
              <div className="size-section mt-3">
                       <div className="size-header">
                               <span className="size-label">Select Size</span>
                               <button className="size-chart-btn" type="button" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                                 <i className="bi bi-rulers"></i> Size Chart
                               </button>
                              
             
             
             <div class="modal fade " id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
               <div className="modal-dialog bg-dark">
                 <div class="modal-content">
                   <div class="modal-header">
                     <h5 class="modal-title fw-bold" id="staticBackdropLabel">Jewellery Size Guide</h5>
                    
                   </div>
                   <div class="modal-body bg-black overflow-y-auto">
                     <img src={SizeGuide} alt="Size Guide" className='img-fluid '/>
                   </div>
                   <div class="modal-footer">
                     <button type="button" class="btn btn-outline-danger" data-bs-dismiss="modal">Close</button>
                     <button type="button" class="btn btn-outline-dark">Understood</button>
                   </div>
                 </div>
               </div>
             </div>
                             </div>
                
                <div className="size-grid">
                  {jewellery.sizes.map((size, index) => {
                    const isAvailable = size.stock > 0;
                    const isSelected = selectedSize?.size === size.size;
                    
                    return (
                      <button
                        key={index}
                        className={`size-box ${isSelected ? 'selected' : ''} ${!isAvailable ? 'out-of-stock' : ''}`}
                        onClick={() => isAvailable && handleSizeSelect(size)}
                        disabled={!isAvailable}
                      >
                        Size {size.size}
                        {isSelected && <span className="stock-badge">{size.stock} left</span>}
                      </button>
                    );
                  })}
                </div>

                {selectedSize && (
                  <div className="stock-info">
                    <i className="bi bi-check-circle-fill"></i>
                    {selectedSize.stock} items in stock
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="view-quantity-section">
              <span className="quantity-label">Quantity</span>
              <div className="view-quantity-control">
                <button 
                  className="view-quantity-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </button>
                <span className="quantity-value">{quantity}</span>
                <button 
                  className="view-quantity-btn"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                className="btn-cart" 
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cart-plus"></i> Add to Cart
                  </>
                )}
              </button>
              <button className="btn-buy" onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="secondary-actions">
              <button 
                className={`action-link ${isInWishlist ? 'wishlisted' : ''}`}
                onClick={handleWishlistToggle}
              >
                <i className={`bi ${isInWishlist ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                {isInWishlist ? 'Added to Wishlist' : 'Add to Wishlist'}
              </button>
              <button className="action-link" onClick={handleShare}>
                <i className="bi bi-share"></i> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="tabs-section">
        <div className="tabs-header">
          <button 
            className={`tab-btn  ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
           <small>Description</small> 
          </button>
          <button 
            className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('specifications')}
          >
            <small>Specifications</small>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'more' ? 'active' : ''}`}
            onClick={() => setActiveTab('more')}
          >
          <small >Informations</small> 
          </button>
        </div>
        
        <div className="tab-content overflow-y-auto" style={{maxHeight:"500px"}}>
          {activeTab === 'description' && (
            <small className="description-text">
              {jewellery.description || 'No description available for this product.'}
            </small>
          )}
          
          {activeTab === 'specifications' && (
            <div className="specifications-grid">
              <div className="spec-row">
                <span className="spec-title">Category</span>
                <span className="spec-detail">{jewellery.category || 'N/A'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-title">Material</span>
                <span className="spec-detail">{jewellery.material || 'N/A'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-title">Color</span>
                <span className="spec-detail">{jewellery.color || 'N/A'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-title">Occasion</span>
                <span className="spec-detail">{jewellery.occasion || 'N/A'}</span>
              </div>
              {hasSizes && (
                <div className="spec-row">
                  <span className="spec-title">Available Sizes</span>
                  <span className="spec-detail">
                    {jewellery.sizes.map(s => `Size ${s.size}`).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'more' && (
            <div className="more-info">
              <p>✓ Free shipping </p>
              <p>✓ 7-day return policy</p>
              <p>✓ 100% quality guaranteed</p>
              <p>✓ Cash on delivery available</p>
            </div>
          )}
        </div>
      </div>

      {/* You May Also Like Section */}
      {relatedProducts.length > 0 && (
        <div className="related-section">
          <h2 className="section-title">You May Also Like</h2>
          <div className="related-grid">
            {relatedProducts.map((product) => {
              const productDiscount = calculateDiscount(product.price, product.finalPrice);
              
              return (
                <Link 
                  to={`/jewellery/${product._id}`} 
                  key={product._id} 
                  className="related-card"
                >
                  <div className="related-image-container">
                    <img 
                      src={product.image || "https://via.placeholder.com/300x400"} 
                      alt={product.name}
                      className="related-image"
                    />
                    {productDiscount > 0 && (
                      <span className="related-discount">{productDiscount}% OFF</span>
                    )}
                  </div>
                  <div className="related-info">
                    <h3 className="related-name">{product.name}</h3>
                    <div className="related-price">
                      {productDiscount > 0 ? (
                        <>
                          <span className="related-final">₹{product.finalPrice}</span>
                          <span className="related-original">₹{product.price}</span>
                        </>
                      ) : (
                        <span className="related-final">₹{product.price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal" onClick={closeShareModal}>
          <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h4>Share this product</h4>
              <button className="share-modal-close" onClick={closeShareModal}>×</button>
            </div>
            <div className="share-modal-body">
              <div className="social-icons">
                <button className="social-icon whatsapp" onClick={() => shareOnSocial('whatsapp')}>
                  <i className="bi bi-whatsapp"></i> WhatsApp
                </button>
                <button className="social-icon facebook" onClick={() => shareOnSocial('facebook')}>
                  <i className="bi bi-facebook"></i> Facebook
                </button>
                <button className="social-icon twitter" onClick={() => shareOnSocial('twitter')}>
                  <i className="bi bi-twitter-x"></i> Twitter
                </button>
                <button className="social-icon instagram" onClick={() => shareOnSocial('instagram')}>
                  <i className="bi bi-instagram"></i> Instagram
                </button>
                <button className="social-icon pinterest" onClick={() => shareOnSocial('pinterest')}>
                  <i className="bi bi-pinterest"></i> Pinterest
                </button>
                <button className="social-icon email" onClick={() => shareOnSocial('email')}>
                  <i className="bi bi-envelope"></i> Email
                </button>
                <button className="social-icon copy" onClick={() => shareOnSocial('copy')}>
                  <i className="bi bi-link"></i> Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="gallery-modal" onClick={closeGalleryModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close position-fixed" onClick={closeGalleryModal}><i className="bi bi-x-lg"></i></button>
            <img 
              src={selectedImage} 
              alt="Gallery preview" 
              style={{width:'100%',height:'100%'}}
            />
          </div>
        </div>
      )}
      
      <div className="review-section">
        <Review productType="jewellery" productId={jewellery._id} />
      </div>
    </div>
  );
}

export default ViewJewellery;