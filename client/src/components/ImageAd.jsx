import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function ImageAd() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const [direction, setDirection] = useState('right');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showProduct, setShowProduct] = useState(false);
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);
  const productTimeoutRef = useRef(null);

  useEffect(() => {
    fetchImageAds();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (carouselRef.current) {
        const carouselPosition = carouselRef.current.getBoundingClientRect().top;
        setIsSticky(carouselPosition <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (ads.length > 0 && !isPaused) {
      startAutoPlay();
      setShowProduct(false); // Hide product when playing
    } else if (isPaused) {
      clearInterval(intervalRef.current);
      // Show product with slight delay for better UX
      productTimeoutRef.current = setTimeout(() => {
        setShowProduct(true);
      }, 300);
    }
    
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(productTimeoutRef.current);
    };
  }, [ads.length, currentIndex, isPaused]);

  const fetchImageAds = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/ads');
      if (response.data.success) {
        const imageAds = response.data.ads.filter(ad => ad.mediaType === 'image');
        setAds(imageAds);
      }
    } catch (err) {
      console.error('Error fetching image ads:', err);
      setError('Failed to load image ads. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const startAutoPlay = () => {
    clearInterval(intervalRef.current);
    setProgress(0);
    
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 1;
      });
    }, 50);
  };

  const handlePrev = () => {
    setDirection('left');
    setCurrentIndex((prev) => (prev === 0 ? ads.length - 1 : prev - 1));
    setProgress(0);
    setShowProduct(false);
    if (!isPaused) startAutoPlay();
  };

  const handleNext = () => {
    setDirection('right');
    setCurrentIndex((prev) => (prev === ads.length - 1 ? 0 : prev + 1));
    setProgress(0);
    setShowProduct(false);
    if (!isPaused) startAutoPlay();
  };

  const handleDotClick = (index) => {
    setDirection(index > currentIndex ? 'right' : 'left');
    setCurrentIndex(index);
    setProgress(0);
    setShowProduct(false);
    if (!isPaused) startAutoPlay();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleImageClick = () => {
    togglePause();
  };

  if (loading) {
    return (
      <div className="text-center py-5" style={{ margin: 0, padding: 0 }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading image ads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5" style={{ margin: 0, padding: 0 }}>
        <div className="alert alert-danger mx-auto" style={{ maxWidth: '500px' }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
        <button className="btn btn-outline-danger mt-3" onClick={fetchImageAds}>
          <i className="bi bi-arrow-repeat me-2"></i>Retry
        </button>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="text-center py-5" style={{ margin: 0, padding: 0 }}>
        <i className="bi bi-images" style={{ fontSize: '4rem', color: '#ed3545' }}></i>
        <h4 className="mt-3">No Image Ads Available</h4>
        <p className="text-muted">Check back later for exciting offers!</p>
      </div>
    );
  }

  const currentAd = ads[currentIndex];

  return (
    <>
      <style>
        {`
     

        .image-ad-container {
          width: 100%;
          margin: 0 !important;
          padding: 0 !important;
          position: relative;
          transition: all 0.3s ease;
          line-height: 0; /* Remove any line height spacing */
          z-index:0;
        }

      

        .carousel-wrapper {
          position: relative;
          width: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          line-height: 0;
        }

        .image-slide {
          width: 100%;
          margin: 0;
          padding: 0;
          display: block;
          transition: transform 0.5s ease;
          line-height: 0;
        }

        .image-slide img {
          width: 100%;
          margin: 0;
          padding: 0;
          display: block;
          height: auto;
          max-height: 600px;
          object-fit: cover;
          cursor: pointer;
        }

        /* Navigation Arrows */
        .nav-arrow {
          width: 50px;
          height: 50px;
          background: rgba(255,255,255,0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
          border: 2px solid white;
          margin: 0;
          padding: 0;
        }

        .nav-arrow:hover {
          background: #ed3545;
          transform: translateY(-50%) scale(1.1);
        }

        .nav-arrow:hover i {
          color: white;
        }

        .nav-arrow i {
          font-size: 24px;
          color: #333;
          transition: color 0.3s ease;
          margin: 0;
          padding: 0;
        }

        .nav-arrow.left {
          left: 20px;
        }

        .nav-arrow.right {
          right: 20px;
        }

        /* Progress Bar */
        .progress-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(0,0,0,0.3);
          z-index: 25;
          margin: 0;
          padding: 0;
        }

        .progress-bar {
          height: 100%;
          background: #ed3545;
          transition: width 0.05s linear;
          box-shadow: 0 0 10px #ed3545;
          margin: 0;
          padding: 0;
        }

        /* Pause Button */
        .pause-btn {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          background: rgba(0,0,0,0.6);
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 25;
          cursor: pointer;
          transition: all 0.3s ease;
          color: white;
          margin: 0;
          padding: 0;
        }

        .pause-btn:hover {
          background: #ed3545;
          transform: scale(1.1);
        }

        /* Dots Navigation */
        .dots-container {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 25;
          background: rgba(0,0,0,0.5);
          padding: 8px 15px;
          border-radius: 30px;
          backdrop-filter: blur(5px);
          margin: 0;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid transparent;
          margin: 0;
          padding: 0;
        }

        .dot:hover {
          background: rgba(255,255,255,0.8);
          transform: scale(1.2);
        }

        .dot.active {
          background: #ed3545;
          transform: scale(1.2);
          border-color: white;
        }

        /* Product Overlay - Only visible when paused */
       .image-ad-container .product-overlay {
          position: absolute;
          
          left: 30px;
          right: 30px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          z-index: 30;
          max-width: 300px;
          max-height: 200px;
          animation: slideUp 0.5s ease;
          border: 1px solid rgba(237,53,69,0.2);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
          margin: 0;
        }

        .product-overlay.visible {
          opacity: 1;
          visibility: visible;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .image-ad-container.product-content {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .image-ad-container.product-image-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .product-thumb {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          object-fit: cover;
          border: 3px solid white;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          margin: 0;
          padding: 0;
        }

        .image-ad-container.product-type-badge {
          position: absolute;
          
          background: transparent;
          color: white;
          width: 30px;
          height: 22px;
          
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 600;
          border: 2px solid white;
          margin-bottom:-20px;
        }

        .image-ad-container .product-details {
         margin-left: -60px;
        }

        .image-ad-container.ad-title {
          margin-top: -20px;
          font-size: 18px;
          font-weight: 700;
          color: #333;
        }

        .image-ad-container .product-name {
          margin-bottom: 10px;
          font-size: 16px;
          font-weight: 600;
          color: #ed3545;
        }

       .image-ad-container .product-category {
        margin-top:20px;
          font-size: 13px;
          color: #666;
        
        }

       .image-ad-container .product-price {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 0;
        }

       .image-ad-container .current-price {
        margin-top:10px;
          font-size: 18px;
          font-weight: 700;
          color: #333;
        }

       .image-ad-container .original-price {
        margin-top:10px;
          font-size: 14px;
          color: #999;
          text-decoration: line-through;
        }

       .image-ad-container .shop-btn {
          display: inline-block;
          padding: 8px 20px;
          background: #ffffff;
          color: #ed3545;
          text-decoration: none;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          
          margin: 0;
        }

        .shop-btn:hover {
          background: transparent;
          color: #ed3545;
          text-decoration: underline #ed3545;
        }

        /* Stats Badge */
        .stats-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(5px);
          color: white;
          padding: 8px 15px;
          border-radius: 30px;
          font-size: 13px;
          z-index: 25;
          border: 1px solid rgba(255,255,255,0.2);
          margin: 0;
        }

        .stats-badge i {
          margin-right: 5px;
          color: #ed3545;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .product-overlay {
            left: 15px;
            right: 15px;
            bottom: 60px;
            padding: 15px;
            max-width: calc(100% - 30px);
          }

          .product-thumb {
            width: 60px;
            height: 60px;
          }

          .ad-title {
            font-size: 16px;
          }

          .product-name {
            font-size: 14px;
          }

          .nav-arrow {
            width: 40px;
            height: 40px;
          }

          .nav-arrow i {
            font-size: 20px;
          }

          .dots-container {
            bottom: 15px;
            padding: 5px 12px;
          }

          .stats-badge {
            top: 15px;
            right: 15px;
            padding: 5px 12px;
            font-size: 11px;
          }
        }

        @media (max-width: 576px) {
          .product-overlay {
            bottom: 50px;
          }

          .product-content {
            flex-direction: column;
            text-align: center;
          }

          .product-price {
            justify-content: center;
          }

          .nav-arrow {
            width: 35px;
            height: 35px;
          }

          .nav-arrow.left {
            left: 10px;
          }

          .nav-arrow.right {
            right: 10px;
          }
        }
        `}
      </style>

      <div 
        ref={carouselRef}
        className='image-ad-container p-0 '
      >
        <div className="carousel-wrapper">
          {/* Main Image */}
          <div className="image-slide" onClick={handleImageClick}>
            <img 
              src={currentAd.mediaUrl} 
              alt={currentAd.title}
            />
          </div>


          {/* Navigation Arrows */}
          <div className="nav-arrow left" onClick={handlePrev}>
            <i className="bi bi-chevron-left"></i>
          </div>
          <div className="nav-arrow right" onClick={handleNext}>
            <i className="bi bi-chevron-right"></i>
          </div>

          {/* Progress Bar */}
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Pause/Play Button */}
          <div className="pause-btn" onClick={togglePause}>
            <i className={`bi ${isPaused ? 'bi-play-fill' : 'bi-pause-fill'}`}></i>
          </div>

          {/* Dots Navigation */}
          <div className="dots-container">
            {ads.map((_, index) => (
              <div
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => handleDotClick(index)}
              ></div>
            ))}
          </div>

          {/* Product Overlay - Only visible when paused AND product is linked */}
          {currentAd.productDetails && (
            <div className={`product-overlay ${showProduct ? 'visible' : ''}`}>
              <h4 className="ad-title">{currentAd.title}</h4>

              <div className="product-content">
              <div className="row ">
                <div className="col">
                <div className="product-image-wrapper">
                  <img 
                    src={
                      currentAd.linkedProduct.productType === 'dress'
                        ? currentAd.productDetails.images?.cover
                        : currentAd.productDetails.image
                    }
                    alt={currentAd.productDetails.name}
                    className="product-thumb"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/80x80?text=No+Image";
                    }}
                  />
                  
                </div>
                </div>
                <div className="col">
                <div className="product-details">
                  <p className="product-name">{currentAd.productDetails.name}</p>
                  <p className="product-category">{currentAd.productDetails.category}</p>
                  <div className="product-price">
                    <span className="current-price">
                      ₹{currentAd.productDetails.finalPrice || currentAd.productDetails.price}
                    </span>
                    {currentAd.productDetails.finalPrice && 
                     currentAd.productDetails.finalPrice < currentAd.productDetails.price && (
                      <span className="original-price">
                        ₹{currentAd.productDetails.price}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/${currentAd.linkedProduct.productType}/${currentAd.linkedProduct.productId}`}
                    className="shop-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Shop Now <i className="bi bi-arrow-right-short"></i>
                  </Link>
                </div>
                </div>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ImageAd;