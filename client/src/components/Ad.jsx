import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../Config/Api';
import '../styles/Ad.css';

// ==========================================
// 1. IMAGE ADS COMPONENT (Iad)
// ==========================================
export function Iad() {
  const [imageAds, setImageAds] = useState([]);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  // FIX: use a ref to always have the latest index inside the interval closure
  const currentIndexRef = useRef(0);
  const imageAdsLengthRef = useRef(0);

  useEffect(() => {
    fetchImageAds();
    return () => clearInterval(intervalRef.current);
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    imageAdsLengthRef.current = imageAds.length;
  }, [imageAds.length]);

  useEffect(() => {
    if (imageAds.length > 0 && !isPaused) {
      startAutoPlay();
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [imageAds.length, currentIndex, isPaused]);

  const fetchImageAds = async () => {
    try {
      setImgLoading(true);
      const response = await axios.get(`${API_BASE_URL}/ads`);
      if (response.data.success) {
        const filteredImageAds = response.data.ads.filter(ad => ad.mediaType === 'image');
        setImageAds(filteredImageAds);
      }
    } catch (err) {
      console.error('Error fetching image ads:', err);
      setImgError('Failed to load image ads.');
    } finally {
      setImgLoading(false);
    }
  };

  // FIX: use refs inside interval so the closure never goes stale
  const startAutoPlay = () => {
    clearInterval(intervalRef.current);
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Use ref to get fresh index and length
          const len = imageAdsLengthRef.current;
          const next = currentIndexRef.current === len - 1 ? 0 : currentIndexRef.current + 1;
          currentIndexRef.current = next;
          setCurrentIndex(next);
          return 0;
        }
        return prev + 1;
      });
    }, 50);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      const next = prev === 0 ? imageAds.length - 1 : prev - 1;
      currentIndexRef.current = next;
      return next;
    });
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const next = prev === imageAds.length - 1 ? 0 : prev + 1;
      currentIndexRef.current = next;
      return next;
    });
    setProgress(0);
  };

  const handleDotClick = (index) => {
    currentIndexRef.current = index;
    setCurrentIndex(index);
    setProgress(0);
  };

  const togglePlay = () => setIsPaused(p => !p);

  if (imgLoading) return <div className="iad-loader"><div className="spinner-border text-light"></div></div>;
  if (imgError || imageAds.length === 0) return null;

  const currentAd = imageAds[currentIndex];

  return (
    <div className="iad-container">
      {/* Navigation Buttons */}
      {imageAds.length > 1 && (
        <>
          <button className="iad-nav-btn iad-nav-left" onClick={handlePrev} aria-label="Previous ad">
            <i className="bi bi-chevron-left"></i>
          </button>
          <button className="iad-nav-btn iad-nav-right" onClick={handleNext} aria-label="Next ad">
            <i className="bi bi-chevron-right"></i>
          </button>
        </>
      )}

      {/* FIX: key on wrapper forces re-render when ad changes, so image src updates instantly */}
      <div className="iad-content-wrapper" key={currentAd._id}>
        {/* Left: Ad Image */}
        <div className="iad-image-section" onClick={togglePlay}>
          <img
            src={currentAd?.mediaUrl}
            alt={currentAd?.title || 'Advertisement'}
            className="iad-ad-image"
          />
          <div className="iad-progress-bar">
            <div className="iad-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="iad-play-overlay">
            <i className={`bi ${isPaused ? 'bi-play-circle-fill' : 'bi-pause-circle-fill'}`}></i>
          </div>
          {/* Ad counter badge */}
          <div className="iad-counter-badge">
            {currentIndex + 1} / {imageAds.length}
          </div>
        </div>

        {/* Right: Product Details — always shows the linked product of current ad */}
        <div className="iad-product-section">
          {currentAd?.productDetails ? (
            <>
              <div className="iad-product-header">
                <img
                  src={
                    currentAd.linkedProduct?.productType === 'dress'
                      ? currentAd.productDetails.images?.cover
                      : currentAd.productDetails.image
                  }
                  alt={currentAd.productDetails.name}
                  className="iad-product-thumb"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=Product'; }}
                />
                <div className="iad-product-info">
                  <h2 className="iad-title">{currentAd?.title || 'Special Offer'}</h2>
                  <h3 className="iad-product-name">{currentAd.productDetails.name}</h3>
                  <span className="iad-category">{currentAd.productDetails.category}</span>
                </div>
              </div>

              <div className="iad-price-row">
                <span className="iad-current-price">
                  ₹{currentAd.productDetails.finalPrice || currentAd.productDetails.price}
                </span>
                {currentAd.productDetails.finalPrice &&
                  currentAd.productDetails.finalPrice < currentAd.productDetails.price && (
                    <span className="iad-original-price">₹{currentAd.productDetails.price}</span>
                  )}
                {currentAd.productDetails.discount && (
                  <span className="iad-discount-badge">{currentAd.productDetails.discount}% OFF</span>
                )}
              </div>

              <Link
                to={`/${currentAd.linkedProduct?.productType || 'product'}/${currentAd.linkedProduct?.productId}`}
                className="iad-shop-btn"
              >
                Shop Now <i className="bi bi-arrow-right text-white"></i>
              </Link>
            </>
          ) : (
            <div className="iad-no-product">
              <i className="bi bi-tag"></i>
              <p>Exclusive Offer Available</p>
            </div>
          )}
        </div>
      </div>

      {/* Dots Navigation */}
      {imageAds.length > 1 && (
        <div className="iad-dots">
          {imageAds.map((_, index) => (
            <button
              key={index}
              className={`iad-dot ${index === currentIndex ? 'iad-dot-active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to ad ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. VIDEO ADS COMPONENT (Vad)
// ==========================================
export default function Vad() {
  const [videoAds, setVideoAds] = useState([]);
  const [vidLoading, setVidLoading] = useState(true);
  const [vidError, setVidError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  // FIX: single muted state (boolean) — both videos share one mute toggle
  const [isMuted, setIsMuted] = useState(true);
  // FIX: single playing state — both videos mirror each other
  const [isPlaying, setIsPlaying] = useState(false);

  // FIX: two separate refs for left and right video elements
  const leftVideoRef = useRef(null);
  const rightVideoRef = useRef(null);
  const currentIndexRef = useRef(0);
  const videoAdsLengthRef = useRef(0);

  useEffect(() => {
    fetchVideoAds();
    return () => {
      [leftVideoRef, rightVideoRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
    };
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    videoAdsLengthRef.current = videoAds.length;
  }, [videoAds.length]);

  // FIX: when currentIndex changes, reload and play both videos with correct src
  useEffect(() => {
    if (videoAds.length === 0) return;
    const ad = videoAds[currentIndex];
    if (!ad) return;

    [leftVideoRef, rightVideoRef].forEach(ref => {
      const video = ref.current;
      if (!video) return;
      // Load the new source
      video.load();
      video.muted = isMuted;
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    });
  }, [videoAds, currentIndex]);

  // Sync mute state to both video elements whenever it changes
  useEffect(() => {
    [leftVideoRef, rightVideoRef].forEach(ref => {
      if (ref.current) ref.current.muted = isMuted;
    });
  }, [isMuted]);

  const fetchVideoAds = async () => {
    try {
      setVidLoading(true);
      const response = await axios.get(`${API_BASE_URL}/ads`);
      if (response.data.success) {
        const filteredVideoAds = response.data.ads.filter(ad => ad.mediaType === 'video');
        setVideoAds(filteredVideoAds);
      }
    } catch (err) {
      console.error('Error fetching video ads:', err);
      setVidError('Failed to load video ads.');
    } finally {
      setVidLoading(false);
    }
  };

  // FIX: toggle play/pause on both videos simultaneously
  const handleVideoClick = () => {
    [leftVideoRef, rightVideoRef].forEach(ref => {
      const video = ref.current;
      if (!video) return;
      if (video.paused) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        video.pause();
        setIsPlaying(false);
      }
    });
  };

  // FIX: toggle mute on both videos simultaneously
  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  };

  const requestFullscreen = (e) => {
    e.stopPropagation();
    const video = leftVideoRef.current;
    if (!video) return;
    if (video.requestFullscreen) video.requestFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    else if (video.msRequestFullscreen) video.msRequestFullscreen();
  };

  const handlePrev = () => {
    if (videoAds.length === 0) return;
    setCurrentIndex(prev => (prev === 0 ? videoAds.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (videoAds.length === 0) return;
    setCurrentIndex(prev => (prev === videoAds.length - 1 ? 0 : prev + 1));
  };

  // FIX: auto-advance when video ends — only need to listen to one video (left)
  const handleVideoEnded = () => {
    if (videoAds.length > 1) {
      handleNext();
    } else {
      // Single ad: loop both
      [leftVideoRef, rightVideoRef].forEach(ref => {
        if (ref.current) {
          ref.current.currentTime = 0;
          ref.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      });
    }
  };

  if (vidLoading) return <div className="vad-loader"><div className="spinner-border text-light"></div></div>;
  if (vidError || videoAds.length === 0) return null;

  const currentAd = videoAds[currentIndex];

  return (
    <div className="vad-container">
      {/* Navigation Buttons */}
      {videoAds.length > 1 && (
        <>
          <button className="vad-nav-btn vad-nav-left" onClick={handlePrev} aria-label="Previous ad">
            <i className="bi bi-chevron-left"></i>
          </button>
          <button className="vad-nav-btn vad-nav-right" onClick={handleNext} aria-label="Next ad">
            <i className="bi bi-chevron-right"></i>
          </button>
        </>
      )}

      {/* FIX: key forces DOM remount when ad changes so src/load is clean */}
      <div className="vad-content-wrapper" key={currentAd._id}>

        {/* Left Video */}
        <div className="vad-video-section vad-video-left" onClick={handleVideoClick}>
          <video
            ref={leftVideoRef}
            muted={isMuted}
            playsInline
            autoPlay
            preload="auto"
            className="vad-video"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnded}   // FIX: auto-advance on end
          >
            <source src={currentAd.mediaUrl} type="video/mp4" />
          </video>

          <div className="vad-video-controls">
            <button className="vad-control-btn" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
              <i className={`bi ${isMuted ? 'bi-volume-mute-fill' : 'bi-volume-up-fill'}`}></i>
            </button>
            <button className="vad-control-btn" onClick={(e) => { e.stopPropagation(); handleVideoClick(); }} aria-label={isPlaying ? 'Pause' : 'Play'}>
              <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
            </button>
            <button className="vad-control-btn" onClick={requestFullscreen} aria-label="Fullscreen">
              <i className="bi bi-arrows-angle-expand"></i>
            </button>
          </div>

          {!isPlaying && (
            <div className="vad-play-indicator">
              <i className="bi bi-play-circle-fill"></i>
            </div>
          )}

          {/* Counter badge on left video */}
          <div className="vad-counter-badge">{currentIndex + 1} / {videoAds.length}</div>
        </div>

        {/* Center: Product Details — shows exact product of current ad */}
        <div className="vad-product-section">
          {currentAd.productDetails ? (
            <>
              <div className="vad-product-header">
                <img
                  src={
                    currentAd.linkedProduct?.productType === 'dress'
                      ? currentAd.productDetails.images?.cover || currentAd.productDetails.image
                      : currentAd.productDetails.image || currentAd.productDetails.images?.cover
                  }
                  alt={currentAd.productDetails.name || 'Product'}
                  className="vad-product-thumb"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=Product'; }}
                />
                <div className="vad-product-info">
                  <h2 className="vad-title">{currentAd?.title || 'Special Offer'}</h2>
                  <h3 className="vad-product-name">{currentAd.productDetails.name}</h3>
                  <span className="vad-category">{currentAd.productDetails.category}</span>
                </div>
              </div>

              <div className="vad-price-row">
                <span className="vad-current-price">
                  ₹{currentAd.productDetails.finalPrice || currentAd.productDetails.price}
                </span>
                {currentAd.productDetails.finalPrice &&
                  currentAd.productDetails.price &&
                  currentAd.productDetails.finalPrice < currentAd.productDetails.price && (
                    <span className="vad-original-price">₹{currentAd.productDetails.price}</span>
                  )}
                {currentAd.productDetails.discount && (
                  <span className="vad-discount-badge">{currentAd.productDetails.discount}% OFF</span>
                )}
              </div>

              <Link
                to={`/${currentAd.linkedProduct?.productType || 'product'}/${currentAd.linkedProduct?.productId || currentAd._id}`}
                className="vad-shop-btn"
              >
                Shop Now <i className="bi bi-arrow-right text-white"></i>
              </Link>
            </>
          ) : (
            <div className="vad-no-product">
              <i className="bi bi-box-seam"></i>
              <span>No linked product</span>
            </div>
          )}
        </div>

        {/* Right Video — mirrors left, same ad, shared controls */}
        <div className="vad-video-section vad-video-right" onClick={handleVideoClick}>
          <video
            ref={rightVideoRef}
            muted={isMuted}
            playsInline
            autoPlay
            preload="auto"
            className="vad-video"
            // FIX: right video mirrors play/pause; only left fires onEnded to avoid double advance
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={currentAd.mediaUrl} type="video/mp4" />
          </video>

          <div className="vad-video-controls">
            <button className="vad-control-btn" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
              <i className={`bi ${isMuted ? 'bi-volume-mute-fill' : 'bi-volume-up-fill'}`}></i>
            </button>
            <button className="vad-control-btn" onClick={(e) => { e.stopPropagation(); handleVideoClick(); }} aria-label={isPlaying ? 'Pause' : 'Play'}>
              <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
            </button>
            <button className="vad-control-btn" onClick={requestFullscreen} aria-label="Fullscreen">
              <i className="bi bi-arrows-angle-expand"></i>
            </button>
          </div>

          {!isPlaying && (
            <div className="vad-play-indicator">
              <i className="bi bi-play-circle-fill"></i>
            </div>
          )}
        </div>
      </div>

      {/* Dots Navigation */}
      {videoAds.length > 1 && (
        <div className="vad-dots">
          {videoAds.map((_, index) => (
            <button
              key={index}
              className={`vad-dot ${index === currentIndex ? 'vad-dot-active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to ad ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}