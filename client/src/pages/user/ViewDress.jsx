import '../../styles/ViewDress.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Review from './Review';
import SizePrediction from '../../AI/SizePrediction';
import DressSizeGuide from '../../assets/dress-size-guide.png';
import API_BASE_URL from '../../Config/Api';

function ViewDress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [dress, setDress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedMeterSize, setSelectedMeterSize] = useState(null);
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
  const [allImages, setAllImages] = useState([]);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (isAuthenticated && dress) {
        const inWishlist = await checkInWishlist('dress', dress._id);
        setIsInWishlist(inWishlist);
      }
    };
    checkWishlistStatus();
  }, [isAuthenticated, dress, checkInWishlist]);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      alert('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    if (isInWishlist) {
      setIsInWishlist(false);
    } else {
      const result = await addToWishlist('dress', dress._id);
      if (result.success) {
        setIsInWishlist(true);
      } else {
        alert(result.error);
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchDressDetails();
    }
  }, [id]);

  useEffect(() => {
    if (dress?.category) {
      fetchRelatedProducts(dress.category);
    }
  }, [dress]);

  useEffect(() => {
    // Combine cover and gallery images for modal
    if (dress?.images) {
      const images = [];
      if (dress.images.cover) images.push(dress.images.cover);
      if (dress.images.gallery && dress.images.gallery.length > 0) {
        images.push(...dress.images.gallery);
      }
      setAllImages(images);
    }
  }, [dress]);

  const fetchDressDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/dresses/${id}`);
      if (response.data.success) {
        setDress(response.data.dress);
      }
    } catch (err) {
      console.error('Error fetching dress:', err);
      setError('Failed to load dress details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (category) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dresses`);
      if (response.data.success) {
        const related = response.data.dresses
          .filter(d => d.category === category && d._id !== id)
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
    setSelectedMeterSize(null);
  };

  const handleMeterSizeSelect = (size) => {
    setSelectedMeterSize(size);
    setSelectedSize(null);
  };

  const handleAddToCart = async () => {
    const hasSizes = dress.sizes && dress.sizes.length > 0;
    const hasMeterSizes = dress.meterSizes && dress.meterSizes.length > 0;
    
    if (hasSizes && !selectedSize) {
      alert('Please select a size');
      return;
    }
    
    if (hasMeterSizes && !selectedMeterSize) {
      alert('Please select a meter size');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    const selected = selectedSize || selectedMeterSize;
    
    setAddingToCart(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/cart/add`,
        {
          productType: 'dress',
          productId: dress._id,
          selectedSize: selected || null,
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

  // FIX 1: Buy Now navigates to checkout page directly (not cart)
  const handleBuyNow = () => {
    const hasSizes = dress.sizes && dress.sizes.length > 0;
    const hasMeterSizes = dress.meterSizes && dress.meterSizes.length > 0;
    
    if (hasSizes && !selectedSize) {
      alert('Please select a size');
      return;
    }
    
    if (hasMeterSizes && !selectedMeterSize) {
      alert('Please select a meter size');
      return;
    }
    
    const selected = selectedSize || selectedMeterSize;
    // Navigate directly to checkout with product data
    navigate('/checkout', {
      state: {
        type: 'dress',
        data: {
          ...dress,
          selectedSize: selected,
          quantity: quantity
        }
      }
    });
  };

  // FIX 2: Share functionality with social media options
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = dress?.name || 'Check out this dress';
    const shareText = `I found this beautiful dress: ${dress?.name}. Price: ₹${dress?.finalPrice || dress?.price}`;
    
    // Try native Web Share API first (mobile)
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
    
    // Fallback: Show modal with social media links
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
  };

  const shareOnSocial = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(dress?.name || 'Beautiful Dress');
    const text = encodeURIComponent(`Check out this dress: ${dress?.name} - ₹${dress?.finalPrice || dress?.price}`);
    
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
        // Instagram doesn't have a direct share URL, copy to clipboard instead
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

  const navigateGallery = (direction) => {
    const currentIndex = allImages.indexOf(selectedImage);
    if (direction === 'next' && currentIndex < allImages.length - 1) {
      setSelectedImage(allImages[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSelectedImage(allImages[currentIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="view-dress">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dress details...</p>
        </div>
      </div>
    );
  }

  if (error || !dress) {
    return (
      <div className="view-dress">
        <div className="error-state">
          <i className="bi bi-exclamation-circle"></i>
          <h3>Oops! Something went wrong</h3>
          <p>{error || 'Dress not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/dresses')}>
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  const discountPercent = calculateDiscount(dress.price, dress.finalPrice);
  const hasDiscount = discountPercent > 0;
  const hasSizes = dress.sizes && dress.sizes.length > 0;
  const hasMeterSizes = dress.meterSizes && dress.meterSizes.length > 0;

  return (
    <div className="view-dress mt-4">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Home</Link> <span className="separator">›</span>
        <Link to="/dress">Dresses</Link> <span className="separator">›</span>
        <span className="current">{dress.name}</span>
      </div>

      {/* Main Product Section */}
      <div className="product-main">
        <div className="product-grid">
          {/* Left Column - Images */}
          <div className="image-column">
            <div className="main-image-container  pb-5">
              <img 
                src={dress.images?.cover || "https://via.placeholder.com/600x800"} 
                alt={dress.name}
                className="main-image"
                style={{objectFit:'contain'}}
                onClick={() => openGalleryModal(dress.images?.cover)}
              />
              {hasDiscount && (
                <span className="discount-badge-large">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
            
            {/* Gallery Grid */}
            <div className="gallery-grid ">
              {dress.images?.cover && (
                <div className="gallery-item" onClick={() => openGalleryModal(dress.images.cover)}>
                  <img 
                    src={dress.images.cover} 
                    alt={`${dress.name} cover`}
                    className="gallery-image"
                  />
                </div>
              )}
              
              {dress.images?.gallery && dress.images.gallery.length > 0 && (
                dress.images.gallery.map((img, index) => (
                  <div key={index} className="gallery-item" onClick={() => openGalleryModal(img)}>
                    <img 
                      src={img} 
                      alt={`${dress.name} ${index + 1}`}
                      className="gallery-image"
                    />
                  </div>
                ))
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
            <h1 className="product-title">{dress.name}</h1>
            
            <div className="product-meta">
              {dress.category && (
                <span className="category-tag">{dress.category}</span>
              )}
              {dress.occasion && (
                <span className="occasion-tag">{dress.occasion}</span>
              )}
            </div>

            {/* Price Section */}
            <div className="price-section">
              {hasDiscount ? (
                <>
                  <span className="final-price">₹{dress.finalPrice}/-</span>
                  <span className="original-price">₹{dress.price}/-</span>
                  <span className="save-badge">Save {discountPercent}%</span>
                </>
              ) : (
                <span className="final-price">₹{dress.price}/-</span>
              )}
            </div>

            {/* Color & Material */}
            <div className="specs-grid">
              {dress.color && (
                <div className="spec-item">
                  <span className="spec-label">Color</span>
                  <div className="color-display">
                    <span 
                      className="color-dot" 
                      style={{ backgroundColor: dress.color.toLowerCase() }}
                    ></span>
                    <span className="color-name">{dress.color}</span>
                  </div>
                </div>
              )}
              
              {dress.material && (
                <div className="spec-item">
                  <span className="spec-label">Material</span>
                  <span className="spec-value">{dress.material}</span>
                </div>
              )}
            </div>

            {/* AI Size Prediction Section - Enhanced with KNN */}
            <SizePrediction
              productId={dress._id}
              productType="dress"
              productSizes={dress.sizes}
              meterSizes={dress.meterSizes}
              onSizeSelect={(size, isMeterSize) => {
                if (isMeterSize) {
                  handleMeterSizeSelect(size);
                } else {
                  handleSizeSelect(size);
                }
              }}
              selectedSize={selectedSize || selectedMeterSize}
              productCategory={dress.category}
            />

            {/* Regular Sizes Selection */}
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
        <h5 class="modal-title fw-bold" id="staticBackdropLabel">Dress Size Guide</h5>
       
      </div>
      <div class="modal-body bg-black">
        <img src={DressSizeGuide} alt="Size Guide" className='img-fluid h-100 w-100'/>
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
                  {dress.sizes.map((size, index) => {
                    const isAvailable = size.stock > 0;
                    const isSelected = selectedSize?.size === size.size;
                    
                    return (
                      <button
                        key={index}
                        className={`size-box ${isSelected ? 'selected' : ''} ${!isAvailable ? 'out-of-stock' : ''}`}
                        onClick={() => isAvailable && handleSizeSelect(size)}
                        disabled={!isAvailable}
                      >
                        {size.size.toUpperCase()}
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

            {/* Meter Sizes Selection */}
            {hasMeterSizes && (
              <div className="size-section">
                <div className="size-header">
                  <span className="size-label">Select Meter Size</span>
                </div>
                
                <div className="size-grid">
                  {dress.meterSizes.map((size, index) => {
                    const isAvailable = size.stock > 0;
                    const isSelected = selectedMeterSize?.size === size.size;
                    
                    return (
                      <button
                        key={index}
                        className={`size-box meter-size ${isSelected ? 'selected' : ''} ${!isAvailable ? 'out-of-stock' : ''}`}
                        onClick={() => isAvailable && handleMeterSizeSelect(size)}
                        disabled={!isAvailable}
                      >
                        {size.size}
                        {isSelected && <span className="stock-badge">{size.stock} left</span>}
                      </button>
                    );
                  })}
                </div>

                {selectedMeterSize && (
                  <div className="stock-info">
                    <i className="bi bi-check-circle-fill"></i>
                    {selectedMeterSize.stock} meters in stock
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
                <span className="view-quantity-value">{quantity}</span>
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
              <button 
                className="btn-buy"
                onClick={handleBuyNow}
              >
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
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button 
            className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('specifications')}
          >
            Specifications
          </button>
          <button 
            className={`tab-btn ${activeTab === 'more' ? 'active' : ''}`}
            onClick={() => setActiveTab('more')}
          >
            Informations
          </button>
        </div>
        
        <div className="tab-content overflow-y-auto" style={{maxHeight:"500px"}}>
          {activeTab === 'description' && (
            <p className="description-text">
              {dress.description || 'No description available for this product.'}
            </p>
          )}
          
          {activeTab === 'specifications' && (
            <div className="specifications-grid">
              <div className="spec-row">
                <span className="spec-title">Category</span>
                <span className="spec-detail">{dress.category || 'N/A'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-title">Material</span>
                <span className="spec-detail">{dress.material || 'N/A'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-title">Color</span>
                <span className="spec-detail">{dress.color || 'N/A'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-title">Occasion</span>
                <span className="spec-detail">{dress.occasion || 'N/A'}</span>
              </div>
              {hasSizes && (
                <div className="spec-row">
                  <span className="spec-title">Available Sizes</span>
                  <span className="spec-detail">
                    {dress.sizes.map(s => s.size.toUpperCase()).join(', ')}
                  </span>
                </div>
              )}
              {hasMeterSizes && (
                <div className="spec-row">
                  <span className="spec-title">Meter Sizes</span>
                  <span className="spec-detail">
                    {dress.meterSizes.map(s => s.size).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'more' && (
            <div className="more-info">
              <p>✓ Free shipping </p>
              <p>✓ 30-day return policy</p>
              <p>✓ 100% quality guaranteed</p>
              <p>✓ Cash on delivery available</p>
            </div>
          )}
        </div>
      </div>

      {/* You May Also Like Section */}
      {relatedProducts.length > 0 && (
        <div className="related-section">
          <h2 className="section-title text-uppercase">You May Also Like</h2>
          <div className="related-grid">
            {relatedProducts.map((product) => {
              const productDiscount = calculateDiscount(product.price, product.finalPrice);
              
              return (
                <Link 
                  to={`/dress/${product._id}`} 
                  key={product._id} 
                  className="related-card"
                >
                  <div className="related-image-container">
                    <img 
                      src={product.images?.cover || "https://via.placeholder.com/300x400"} 
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
            <button className="modal-close position-fixed" onClick={closeGalleryModal}><i className="bi bi-x-lg "></i></button>
            
            {allImages.length > 1 && (
              <>
                <button 
                  className="modal-nav prev" 
                  onClick={() => navigateGallery('prev')}
                  disabled={allImages.indexOf(selectedImage) === 0}
                >
                  ‹
                </button>
                <button 
                  className="modal-nav next" 
                  onClick={() => navigateGallery('next')}
                  disabled={allImages.indexOf(selectedImage) === allImages.length - 1}
                >
                  ›
                </button>
              </>
            )}
            
            <img 
              src={selectedImage} 
              alt="Gallery preview" 
              className="modal-image"
              style={{width:'100%',height:'100%'}}
            />
            
            <div className="modal-thumbnails">
              {allImages.map((img, index) => (
                <div 
                  key={index}
                  className={`thumbnail ${selectedImage === img ? 'active' : ''}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="review-section">
        <Review productType="dress" productId={dress._id} />
      </div>
    </div>
  );
}

export default ViewDress;