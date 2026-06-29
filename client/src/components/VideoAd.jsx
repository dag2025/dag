import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../Config/Api';
function VideoAds() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mutedStates, setMutedStates] = useState({});
    const [playingStates, setPlayingStates] = useState({});
    const [zoomedId, setZoomedId] = useState(null);
    const videoRefs = useRef({});

    useEffect(() => {
        fetchVideoAds();
    }, []);

    // Effect to handle autoplay after videos are loaded
    useEffect(() => {
        if (ads.length > 0 && Object.keys(mutedStates).length > 0) {
            // Play all videos simultaneously
            const playAllVideos = async () => {
                for (const ad of ads) {
                    const video = videoRefs.current[ad._id];
                    if (video) {
                        try {
                            video.muted = true; // Ensure all videos start muted
                            video.preload = "auto";
                            const playPromise = video.play();
                            
                            if (playPromise !== undefined) {
                                playPromise
                                    .then(() => {
                                        setPlayingStates(prev => ({ ...prev, [ad._id]: true }));
                                    })
                                    .catch(error => {
                                        console.log(`Autoplay failed for video ${ad._id}:`, error.message);
                                    });
                            }
                        } catch (error) {
                            console.log(`Error setting up video ${ad._id}:`, error.message);
                        }
                    }
                }
            };
            
            requestAnimationFrame(() => {
                setTimeout(playAllVideos, 100);
            });
        }
    }, [ads]);

    const fetchVideoAds = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/ads`);
            if (response.data.success) {
                const videoAds = response.data.ads.filter(ad => ad.mediaType === 'video');
                setAds(videoAds);
                
                // Initialize states
                const initialMuted = {};
                const initialPlaying = {};
                videoAds.forEach(ad => {
                    initialMuted[ad._id] = true; // All start muted
                    initialPlaying[ad._id] = false;
                });
                setMutedStates(initialMuted);
                setPlayingStates(initialPlaying);
            }
        } catch (err) {
            console.error('Error fetching video ads:', err);
            setError('Failed to load video ads. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMute = (e, adId) => {
        e.stopPropagation();
        const video = videoRefs.current[adId];
        
        if (video) {
            // Toggle mute state
            const newMutedState = !video.muted;
            
            // Update video element
            video.muted = newMutedState;
            
            // Update state
            setMutedStates(prev => ({
                ...prev,
                [adId]: newMutedState
            }));
            
            // If unmuting, we need to ensure video plays with sound
            if (!newMutedState) {
                // Check if video is paused
                if (video.paused) {
                    video.play()
                        .then(() => {
                            console.log('Video playing with sound');
                            setPlayingStates(prev => ({ ...prev, [adId]: true }));
                        })
                        .catch(error => {
                            console.log('Could not play with sound:', error);
                            // If play with sound fails, revert to muted
                            video.muted = true;
                            setMutedStates(prev => ({ ...prev, [adId]: true }));
                        });
                }
            }
            
            console.log(`Video ${adId} muted: ${newMutedState}`);
        }
    };

    const handleVideoClick = (adId) => {
        setZoomedId(zoomedId === adId ? null : adId);
        
        // Toggle play/pause on click
        const video = videoRefs.current[adId];
        if (video) {
            if (video.paused) {
                video.play()
                    .then(() => {
                        setPlayingStates(prev => ({ ...prev, [adId]: true }));
                    })
                    .catch(error => console.log('Play failed:', error));
            } else {
                video.pause();
                setPlayingStates(prev => ({ ...prev, [adId]: false }));
            }
        }
    };

    const handleVideoPlay = (adId) => {
        setPlayingStates(prev => ({ ...prev, [adId]: true }));
    };

    const handleVideoPause = (adId) => {
        setPlayingStates(prev => ({ ...prev, [adId]: false }));
    };

    const handleVideoError = (adId, error) => {
        console.log(`Video error for ${adId}:`, error);
        const video = videoRefs.current[adId];
        if (video) {
            setTimeout(() => {
                video.load();
                video.play()
                    .then(() => {
                        setPlayingStates(prev => ({ ...prev, [adId]: true }));
                    })
                    .catch(e => console.log('Retry failed:', e));
            }, 1000);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid mt-5 text-center py-5">
                <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading video ads...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid mt-5 text-center py-5">
                <div className="alert alert-danger mx-auto" style={{ maxWidth: '500px' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
                <button className="btn btn-outline-danger mt-3" onClick={fetchVideoAds}>
                    <i className="bi bi-arrow-repeat me-2"></i>Retry
                </button>
            </div>
        );
    }

    if (ads.length === 0) {
        return (
            <div className="container-fluid mt-5 text-center py-5">
                <div className="empty-state">
                    <i className="bi bi-camera-reels" style={{ fontSize: '4rem', color: '#ed3545' }}></i>
                    <h4 className="mt-3">No Video Ads Available</h4>
                    <p className="text-muted">Check back later for exciting video content!</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>
                {`
                .video-ads-container {
                    background: linear-gradient(135deg, #fdfcfb 0%, #f7f7f7 100%);
                    min-height: fit-content;
                    padding: 5px ;
                    max-width: 98%;
                   
                }
                
                .video-ads-container a {
                    text-decoration: none;
                }
                
                .video-scroll-wrapper {
                    display: flex;
                    flex-direction: row;
                    gap: 25px;
                    overflow-x: auto;
                   
                    scrollbar-width: thin;
                    scrollbar-color: #ed3545 #f0f0f0;
                }

                .video-scroll-wrapper::-webkit-scrollbar {
                    height: 8px;
                }

                .video-scroll-wrapper::-webkit-scrollbar-track {
                    background: #f0f0f0;
                    border-radius: 10px;
                }

                .video-scroll-wrapper::-webkit-scrollbar-thumb {
                    background: #ed3545;
                    border-radius: 10px;
                }

                .video-scroll-wrapper::-webkit-scrollbar-thumb:hover {
                    background: #d42c3a;
                }

                .video-card {
                    min-width: 280px;
                    max-width: 280px;
                    background: white;
                    border-radius: 5px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(237, 53, 69, 0.1);
                    display: flex;
                    flex-direction: column;
                    padding-bottom: 15px;
                }

                .video-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 35px rgba(237, 53, 69, 0.15);
                }

                .video-card.zoomed {
                    transform: scale(1.05) translateY(-5px);
                    z-index: 20;
                    box-shadow: 0 25px 40px rgba(237, 53, 69, 0.25);
                }

                .video-wrapper {
                    width: 100%;
                    height: 400px;
                    position: relative;
                    overflow: hidden;
                    background: #000;
                }

                .video-element {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .video-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.8));
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }

                .video-card:hover .video-overlay {
                    opacity: 1;
                }

                .mute-btn {
                    position: absolute;
                    bottom: 15px;
                    right: 15px;
                    background: rgba(0,0,0,0.7);
                    border: 2px solid rgba(255,255,255,0.5);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 15;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(5px);
                    border: none;
                    outline: none;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                }

                .mute-btn:hover {
                    background: #ffffff;
                    transform: scale(1.1);
                }

                .mute-btn i {
                    font-size: 18px;
                }

                .play-indicator {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: transparent;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                    opacity: 0;
                    transition: all 0.3s ease;
                    pointer-events: none;
                    border: 3px solid #ed3545;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                }

                .video-card:hover .play-indicator {
                    opacity: 1;
                }

                .product-info {
                    padding: 15px;
                    background: white;
                    border-top: 1px solid #f0f0f0;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 12px;
                    height: 120px;
                }

                .product-image-wrapper {
                    position: relative;
                    flex-shrink: 0;
                }

                .product-img {
                    width: 70px;
                    height: 70px;
                    border-radius: 5px;
                    object-fit: cover;
                    border: 2px solid #fff;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }

                .product-type-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ed3545;
                    color: white;
                    border-radius: 20px;
                    padding: 2px 8px;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    border: 2px solid white;
                }

                .product-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 0;
                }

                .product-name {
                    font-weight: 700;
                    font-size: 14px;
                    color: #000000;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .product-category {
                    font-size: 11px;
                    color: #999;
                    margin: 0;
                    text-transform: capitalize;
                }

                .product-price {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 2px 0;
                }

                .current-price {
                    font-weight: 700;
                    color: #ed3545;
                    font-size: 14px;
                 
                      
                }

                .original-price {
                    font-size: 12px;
                    color: #999;
                    text-decoration: line-through;
                  
                }

                .shop-now-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    color: #ed3545;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    margin-top: 2px;
                }

                .shop-now-btn:hover {
                    color: #d42c3a;
                    gap: 8px;
                }

                .ad-title {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: #ed3545;
                    color: white;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    z-index: 15;
                    max-width: 150px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                }

                .no-product {
                    padding: 15px;
                    text-align: center;
                    color: #999;
                    font-size: 13px;
                    background: #f9f9f9;
                    border-top: 1px solid #f0f0f0;
                }

                .no-product i {
                    color: #ed3545;
                    margin-right: 5px;
                }

                .section-title {
                    text-align: center;
                    margin: 30px 0 20px;
                    font-size: 32px;
                    font-weight: 800;
                    color: #333;
                    position: relative;
                }

                .section-title:after {
                    content: '';
                    position: absolute;
                    bottom: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100px;
                    height: 4px;
                    background: linear-gradient(90deg, transparent, #ed3545, transparent);
                    border-radius: 2px;
                }

                .section-subtitle {
                    text-align: center;
                    color: #666;
                    margin-bottom: 20px;
                    font-size: 16px;
                }

                .gradient-text {
                    background: linear-gradient(135deg, #ed3545, #ff6b6b);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .video-stats {
                    position: absolute;
                    bottom: 15px;
                    left: 15px;
                    color: white;
                    font-size: 12px;
                    z-index: 15;
                    background: rgba(0,0,0,0.5);
                    padding: 4px 10px;
                    border-radius: 20px;
                    backdrop-filter: blur(5px);
                }

                .video-stats i {
                    margin-right: 5px;
                    color: #ed3545;
                }
                `}
            </style>

            <div className="video-ads-container">
                <div className="container-fluid">
                    <h2 className="section-title">
                        <span className="gradient-text text-uppercase">Watch 'N Shop</span>
                    </h2>
                    <p className="section-subtitle">Discover products through engaging video stories</p>
                    
                    <div className="video-scroll-wrapper pb-3">
                        {ads.map((ad) => (
                            <div 
                                key={ad._id}
                                className={`video-card  ${zoomedId === ad._id ? 'zoomed' : ''}`}
                                onClick={() => handleVideoClick(ad._id)}
                            >
                                <div className="video-wrapper">
                                    {/* Ad Title */}
                                    <div className="ad-title" title={ad.title}>
                                        {ad.title}
                                    </div>

                                 

                                    {/* Video Element */}
                                    <video
                                        ref={el => videoRefs.current[ad._id] = el}
                                        className="video-element"
                                        autoPlay
                                        muted={mutedStates[ad._id]}
                                        loop
                                        playsInline
                                        preload="auto"
                                        onPlay={() => handleVideoPlay(ad._id)}
                                        onPause={() => handleVideoPause(ad._id)}
                                        onError={(e) => handleVideoError(ad._id, e)}
                                    >
                                        <source src={ad.mediaUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>

                                    {/* Overlay */}
                                    <div className="video-overlay"></div>

                                    {/* Play/Pause Indicator */}
                                    <div className="play-indicator">
                                        <i className={`bi text-white ${playingStates[ad._id] ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                                    </div>

                                    {/* Mute/Unmute Button */}
                                    <button 
                                        className="mute-btn" 
                                        onClick={(e) => toggleMute(e, ad._id)}
                                        aria-label={mutedStates[ad._id] ? "Unmute" : "Mute"}
                                        title={mutedStates[ad._id] ? "Click to unmute" : "Click to mute"}
                                    >
                                        <i className={`bi ${mutedStates[ad._id] ? 'bi-volume-mute-fill' : 'bi-volume-up-fill'}`}></i>
                                    </button>
                                </div>

                                {/* Product Info */}
                                {ad.productDetails ? (
                                    <Link 
                                        to={`/${ad.linkedProduct?.productType || 'product'}/${ad.linkedProduct?.productId || ad._id}`}
                                        className="product-info"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="product-image-wrapper">
                                            <img 
                                                src={
                                                    ad.linkedProduct?.productType === 'dress' 
                                                        ? ad.productDetails.images?.cover || ad.productDetails.image
                                                        : ad.productDetails.image || ad.productDetails.images?.cover
                                                } 
                                                className="product-img" 
                                                alt={ad.productDetails.name || 'Product'}
                                                onError={(e) => {
                                                    e.target.src = "https://via.placeholder.com/70x70?text=Product";
                                                }}
                                            />
                                           
                                        </div>
                                        <div className="product-details">
                                            <h6 className="product-name">{ad.productDetails.name || 'Product Name'}</h6>
                                            <p className="product-category">{ad.productDetails.category || 'Category'}</p>
                                            <div className="product-price me-5">
                                                <span className="current-price ">
                                                    ₹{ad.productDetails.finalPrice || ad.productDetails.price || '0'}
                                                </span>
                                                {ad.productDetails.finalPrice && ad.productDetails.price && 
                                                 ad.productDetails.finalPrice < ad.productDetails.price && (
                                                    <span className="original-price">
                                                        ₹{ad.productDetails.price}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="shop-now-btn">
                                                Shop Now <i className="bi bi-arrow-right-short"></i>
                                            </span>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="no-product">
                                        <i className="bi bi-box-seam"></i>
                                        No product linked to this ad
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default VideoAds;