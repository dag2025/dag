import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import OutfitRecommendations from '../../AI/OutfitRecommendation';
import axios from 'axios';
import { Link } from 'react-router-dom';

import API_BASE_URL from '../../Config/Api';

function Search() {
  const { isAuthenticated, token } = useAuth();
  const [index, setIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredOutfit, setHoveredOutfit] = useState(null);
  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    occasions: [],
    colors: []
  });
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    occasion: '',
    color: '',
    minPrice: '',
    maxPrice: ''
  });

  // States for order & AI recommendations
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [allDresses, setAllDresses] = useState([]);
  const [allJewellery, setAllJewellery] = useState([]);
  const [similarOutfits, setSimilarOutfits] = useState([]);

  const placeholders = useMemo(
    () => [
      "Search for 'Party Dress'...",
      "Search for 'Wedding Jewelry'...",
      "Search for 'Casual Outfit'...",
      "Search for 'Red Dress'...",
      "Search for 'Gold Necklace'...",
      "Search for 'Summer Wear'..."
    ],
    []
  );

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
        setTimeout(() => {
          document.getElementById('search-form').dispatchEvent(
            new Event('submit', { cancelable: true, bubbles: true })
          );
        }, 100);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Fetch available filters
  useEffect(() => {
    fetchAvailableFilters();
  }, []);

  // Rotate placeholder
  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(intervalId);
  }, [placeholders.length]);

  // Fetch search history & real orders + all products for AI recs
  useEffect(() => {
    if (isAuthenticated) {
      fetchSearchHistory();
      fetchRealOrdersAndProducts();
    }
  }, [isAuthenticated]);

  const fetchAvailableFilters = async () => {
    try {
      const [dressesRes, jewelleryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dresses`),
        axios.get(`${API_BASE_URL}/jewellery`)
      ]);

      const allProducts = [
        ...(dressesRes.data.dresses || []),
        ...(jewelleryRes.data.jewellery || [])
      ];

      const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
      const occasions = [...new Set(allProducts.map(p => p.occasion).filter(Boolean))];
      const colors = [...new Set(allProducts.map(p => p.color).filter(Boolean))];

      setAvailableFilters({ categories, occasions, colors });
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const fetchSearchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/search/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSearchHistory(res.data.history || []);
        setOutfits(res.data.outfits || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Fetch orders, all dresses, all jewellery – then generate AI recommendations
  const fetchRealOrdersAndProducts = async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      // 1. Fetch orders
      const ordersRes = await axios.get(`${API_BASE_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let purchased = [];
      if (ordersRes.data.success && ordersRes.data.orders.length) {
        ordersRes.data.orders.forEach(order => {
          order.items.forEach(item => {
            purchased.push({
              ...item,
              orderId: order._id,
              orderDate: order.createdAt,
              orderStatus: order.orderStatus
            });
          });
        });
      }
      setPurchasedItems(purchased);

      // 2. Fetch all dresses and jewellery (for recommendations)
      const [dressesRes, jewelleryRes] = await Promise.all([
        axios.get('${API_BASE_URL}/dresses'),
        axios.get('${API_BASE_URL}/jewellery')
      ]);
      
      const dresses = dressesRes.data.dresses || [];
      const jewellery = jewelleryRes.data.jewellery || [];
      setAllDresses(dresses);
      setAllJewellery(jewellery);

      // 3. Generate AI similar outfits based on purchased items
      if (purchased.length > 0) {
        const similar = generateSimilarOutfits(purchased, dresses, jewellery);
        setSimilarOutfits(similar);
      } else {
        setSimilarOutfits([]);
      }
    } catch (err) {
      console.error('Error fetching data for recommendations:', err);
      setPurchasedItems([]);
      setSimilarOutfits([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // AI-like scoring: find products similar to purchased items
  const generateSimilarOutfits = (purchased, dresses, jewellery) => {
    // Collect all purchased product IDs to avoid recommending already bought items
    const purchasedIds = new Set(purchased.map(p => p._id?.toString()));
    
    // Score each dress based on purchased items
    const scoredDresses = dresses.map(dress => {
      let score = 0;
      purchased.forEach(p => {
        if (dress.category === p.category) score += 10;
        if (dress.occasion === p.occasion) score += 8;
        if (dress.color === p.color) score += 5;
        // Price similarity (±30%)
        const priceDiff = Math.abs(dress.finalPrice - p.finalPrice);
        if (priceDiff / p.finalPrice <= 0.3) score += 3;
      });
      return { ...dress, score, type: 'dress' };
    }).filter(d => !purchasedIds.has(d._id.toString()) && d.score > 0)
      .sort((a,b) => b.score - a.score);

    // Score each jewellery similarly
    const scoredJewellery = jewellery.map(j => {
      let score = 0;
      purchased.forEach(p => {
        if (j.category === p.category) score += 10;
        if (j.occasion === p.occasion) score += 8;
        if (j.color === p.color) score += 5;
        const priceDiff = Math.abs(j.finalPrice - p.finalPrice);
        if (priceDiff / p.finalPrice <= 0.3) score += 3;
      });
      return { ...j, score, type: 'jewellery' };
    }).filter(j => !purchasedIds.has(j._id.toString()) && j.score > 0)
      .sort((a,b) => b.score - a.score);

    // Create outfit pairs (dress + jewellery) from top scores
    const outfits = [];
    const maxPairs = Math.min(6, scoredDresses.length, scoredJewellery.length);
    for (let i = 0; i < maxPairs; i++) {
      outfits.push({
        id: `ai-outfit-${i}`,
        basedOn: 'Your purchase history (AI matched)',
        dress: scoredDresses[i],
        jewellery: scoredJewellery[i]
      });
    }
    return outfits;
  };

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ q: searchQuery, ...filters });
      const res = await axios.get(`${API_BASE_URL}/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setSearchResults(res.data.results);
        fetchSearchHistory();
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, token]);

  const handleQuickSearch = useCallback((term) => {
    setSearchQuery(term);
    setTimeout(() => {
      document.getElementById('search-form').dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }, 100);
  }, []);

  const clearHistory = useCallback(async () => {
    if (!window.confirm('Clear search history?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/search/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchHistory([]);
      setOutfits([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  }, [token]);

  const startVoiceSearch = useCallback(() => {
    if (recognition) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition error:', error);
      }
    } else {
      alert('Voice search is not supported in your browser. Please use Chrome, Edge, or Safari.');
    }
  }, [recognition]);

  const handleViewProduct = useCallback((product, type) => {
    window.location.href = `/${type}/${product._id}`;
  }, []);

  const renderOutfitCard = useCallback((outfit, type = 'search') => {
    const fallbackImg = 'https://via.placeholder.com/300x400?text=No+Image';
    return (
      <div 
        key={outfit.id} 
        className="outfit-card"
        onMouseEnter={() => setHoveredOutfit(outfit.id)}
        onMouseLeave={() => setHoveredOutfit(null)}
      >
        <div className="outfit-images">
          <div className="outfit-product">
            <span className="product-type-tag"> Dress</span>
            <img 
              src={outfit.dress.images?.cover || outfit.dress.image || fallbackImg} 
              alt={outfit.dress.name}
              onError={(e) => e.target.src = fallbackImg}
            />
          </div>
          <div className="outfit-plus">+</div>
          <div className="outfit-product">
            <span className="product-type-tag"> Jewelry</span>
            <img 
              src={outfit.jewellery.image || fallbackImg} 
              alt={outfit.jewellery.name}
              onError={(e) => e.target.src = fallbackImg}
            />
          </div>
        </div>
        <div className="outfit-details">
          <div className="outfit-products-names">
            <Link 
              to={`/dress/${outfit.dress._id}`}
              className="product-name-link dress"
            >
              <i className="bi bi-dot"></i>
              {outfit.dress.name}
            </Link>
            <Link 
              to={`/jewellery/${outfit.jewellery._id}`}
              className="product-name-link"
            >
              <i className="bi bi-dot"></i>
              {outfit.jewellery.name}
            </Link>
            <small className="text-muted d-block mt-1">
              <i className="bi bi-info-circle me-1"></i>
              {outfit.basedOn}
            </small>
          </div>
          <div className="outfit-total">
            <div className="outfit-price">
              ₹{outfit.dress.finalPrice + outfit.jewellery.finalPrice}
              <small>total</small>
            </div>
            <div className="outfit-actions">
              <Link 
                to={`/dress/${outfit.dress._id}`}
                className="outfit-action-btn dress"
              >
                <i className="bi bi-eye text-white"></i> Dress
              </Link>
              <Link 
                to={`/jewellery/${outfit.jewellery._id}`}
                className="outfit-action-btn jewellery"
              >
                <i className="bi bi-eye text-white"></i> Jewel
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="container-fluid search-container mt-4">
      <style>{`
        .search-wrapper {
          max-width: 98%;
          margin: 0 auto;
          padding: 5px;
        }

        /* Search Bar */
        .search-section {
          background: linear-gradient(135deg, #ed3545 0%, #ff6b6b 100%);
          padding: 40px 20px;
          border-radius: 20px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(237,53,69,0.3);
        }

        .search-form {
          max-width: 100%;
          margin: 0 auto;
        }

        .search-input-group {
          display: flex;
          gap: 10px;
          background: white;
          border-radius: 10px;
          height: 50px;
          padding: 5px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }

        .search-input {
          flex: 1;
          border: none;
          padding: 0 20px;
          border-radius: 10px;
          font-size: 16px;
          outline: none;
        }

        .voice-btn {
          background: none;
          border: none;
          padding: 0 15px;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.3s ease;
          border-radius: 10px;
        }

        .voice-btn:hover {
          border: 1px solid #ed3545;
        }

        .voice-btn.listening {
          background: #ed3545;
          color: white;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .search-btn {
          background: #ed3545;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .search-btn:hover {
          background: #d42c3a;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(237,53,69,0.3);
        }

        .filter-toggle {
          text-align: center;
          margin-top: 15px;
        }

        .filter-toggle-btn {
          background: rgba(255,255,255,0.2);
          color: white;
          border: 2px solid white;
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-toggle-btn:hover {
          background: white;
          color: #ed3545;
        }

        .filters-panel {
          border-radius: 10px;
          padding: 20px;
          margin-top: 20px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }

        .filter-select {
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
        }

        /* Search History Pills */
        .history-section {
          margin-bottom: 30px;
        }

        .history-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .history-pill {
          background: white;
          color: #000000;
          padding: 5px 10px;
          border-radius: 10px;
          font-weight:bold;
          text-transform: capitalize;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid #ed3545;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .history-pill:hover {
          background: #ed3545;
          color: white;
          transform: translateY(-2px);
        }

        .clear-history {
          background: none;
          border: 1px solid #dc3545;
          color: #dc3545;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .clear-history:hover {
          background: #dc3545;
          color: white;
        }

        /* Search Results */
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .result-card {
          background: white;
          border-radius: 5px;
          height: 500px;
          max-width: 350px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          border: 1px solid #f0f0f0;
        }

        .result-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(237,53,69,0.1);
        }

        .result-image {
          width: 100%;
          height: 350px;
          object-fit: cover;
        }

        .result-info {
          padding: 15px;
        }

        .result-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0 0 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .result-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }

        .result-price {
          font-size: 18px;
          font-weight: 700;
          color: #ed3545;
        }

        .result-type {
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          color: #666;
        }

        .search-view-btn {
          display: block;
          text-align: center;
          background: #ed3545;
          color: white;
          text-decoration: none;
          padding: 8px;
          border-radius: 6px;
          margin-top: 10px;
          font-size: 13px;
          transition: all 0.3s ease;
        }

        .search-view-btn:hover {
          background: #d42c3a;
        }

        /* Horizontal Scroll Outfits */
        .outfits-section {
          margin: 40px 0;
        }

        .section-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ai-badge {
          background: linear-gradient(135deg, #fd5b68 0%, #ed3545 100%);
          color: white;
          font-size: 0.7rem;
          padding: 4px 10px;
          border-radius: 20px;
          margin-left: 10px;
        }

        .outfits-horizontal {
          display: flex;
          overflow-x: auto;
          gap: 20px;
          padding-bottom: 10px;
          scrollbar-width: thin;
        }

        .outfits-horizontal::-webkit-scrollbar {
          height: 6px;
        }

        .outfits-horizontal::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .outfits-horizontal::-webkit-scrollbar-thumb {
          background: #ed3545;
          border-radius: 10px;
        }

        .outfit-card {
          flex: 0 0 320px;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          border: 1px solid #f0f0f0;
        }

        .outfit-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 30px rgba(237,53,69,0.1);
        }

        .outfit-images {
          display: flex;
          padding: 15px;
          gap: 10px;
          background: #f8f9fa;
          position: relative;
        }

        .outfit-product {
          flex: 1;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          aspect-ratio: 3/4;
          cursor: pointer;
        }

        .outfit-product img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .outfit-product:hover img {
          transform: scale(1.08);
        }

        .product-type-tag {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(0,0,0,0.6);
          color: white;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 12px;
          backdrop-filter: blur(4px);
          z-index: 2;
        }

        .outfit-plus {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          color: #ed3545;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 3;
          border: 2px solid #ed3545;
        }

        .outfit-details {
          padding: 15px;
        }

        .outfit-products-names {
          margin-bottom: 10px;
        }

        .product-name-link {
          color: #333;
          text-decoration: none;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 2px 0;
          transition: color 0.2s ease;
        }

        .product-name-link:hover {
          color: #ed3545;
        }

        .product-name-link.dress {
          color: #ed3545;
          font-weight: 500;
        }

        .outfit-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed #e0e0e0;
        }

        .outfit-price {
          font-size: 18px;
          font-weight: 700;
          color: #333;
        }

        .outfit-price small {
          font-size: 11px;
          font-weight: 400;
          color: #999;
          margin-left: 4px;
        }

        .outfit-actions {
          display: flex;
          gap: 8px;
        }

        .outfit-action-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .outfit-action-btn.dress {
          background: #ed3545;
          color: white;
        }

        .outfit-action-btn.jewellery {
          background: #333;
          color: white;
        }

        .outfit-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        /* Purchased item card */
        .purchased-item-card {
          flex: 0 0 200px;
          min-width: 250px;
          min-height: 400px;
          background: white;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: transform 0.2s ease;
          border: 1px solid #f0f0f0;
        }

        .purchased-item-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .purchased-item-image {
          width: 100%;
          height: 300px;
          object-fit: cover;
        }

        .purchased-item-info {
          padding: 10px;
        }

        .purchased-item-name {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .purchased-item-price {
          font-size: 14px;
          font-weight: 700;
          color: #ed3545;
        }

        .purchased-item-date {
          font-size: 10px;
          color: #999;
          margin-top: 5px;
        }

        .search-loading-spinner {
          text-align: center;
          padding: 40px;
        }

        .search-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #ed3545;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .empty-state i {
          font-size: 48px;
          color: #ed3545;
          opacity: 0.3;
          margin-bottom: 15px;
        }

        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
          .search-input-group {
            height: 45px;
          }
          .outfit-card {
            flex: 0 0 280px;
          }
          .purchased-item-card {
            flex: 0 0 160px;
          }
        }
      `}</style>

      <div className="search-wrapper mb-5">
        {/* Search Section */}
        <div className="search-section">
          <form id="search-form" className="search-form" onSubmit={handleSearch}>
            <div className="search-input-group">
              <input
                type="text"
                className="search-input"
                placeholder={placeholders[index]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="button" 
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={startVoiceSearch}
                title="Voice Search"
              >
                <i className="bi bi-mic"></i>
              </button>
              <button type="submit" className="search-btn">
                 Search
              </button>
            </div>
          </form>

          <div className="filter-toggle">
            <button 
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="bi bi-sliders2 me-2"></i>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filters-grid">
                <select 
                  className="filter-select"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="">All Categories</option>
                  {availableFilters.categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select 
                  className="filter-select"
                  value={filters.occasion}
                  onChange={(e) => setFilters({...filters, occasion: e.target.value})}
                >
                  <option value="">All Occasions</option>
                  {availableFilters.occasions.map(occ => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>

                <select 
                  className="filter-select"
                  value={filters.color}
                  onChange={(e) => setFilters({...filters, color: e.target.value})}
                >
                  <option value="">All Colors</option>
                  {availableFilters.colors.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>

                <input
                  type="number"
                  className="filter-select"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                />

                <input
                  type="number"
                  className="filter-select"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>

        {/* Search History Pills */}
        {isAuthenticated && searchHistory.length > 0 && (
          <div className="history-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 text-uppercase">
                <i className="bi bi-clock-history me-2" style={{ color: '#ed3545' }}></i>
                 Search Interests
              </h5>
              <button className="clear-history" onClick={clearHistory}>
                <i className="bi bi-x-lg me-1"></i>
                Clear
              </button>
            </div>
            <div className="history-pills">
              {searchHistory.map((term, idx) => (
                <button
                  key={idx}
                  className="history-pill"
                  onClick={() => handleQuickSearch(term)}
                >
                  <i className="bi bi-search"></i>
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {loading ? (
          <div className="search-loading-spinner">
            <div className="search-spinner"></div>
            <p>Searching products...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="mb-5">
            <h5 className="mb-3 text-uppercase">
              <i className="bi bi-grid-3x3-gap-fill me-2" style={{ color: '#ed3545' }}></i>
              Search Results ({searchResults.length})
            </h5>
            <div className="results-grid">
              {searchResults.map((item, idx) => (
                <div key={idx} className="result-card">
                  <img 
                    src={item.images?.cover || item.image} 
                    alt={item.name}
                    className="result-image"
                    onError={(e) => e.target.src = "https://via.placeholder.com/200"}
                  />
                  <div className="result-info">
                    <h6 className="result-name">{item.name}</h6>
                    <div className="result-meta">
                      <span className="result-price">₹{item.finalPrice}</span>
                      <span className="result-type">{item.type}</span>
                    </div>
                    <Link 
                      to={`/${item.type}/${item._id}`} 
                      className="search-view-btn"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery && (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-emoji-frown" style={{ fontSize: '40px' }}></i>
            <p className="mt-2">No products found for "{searchQuery}"</p>
          </div>
        )}

        {/* Search-Based Outfit Recommendations (horizontal scroll) */}
        {isAuthenticated && outfits.length > 0 && (
          <div className="outfits-section">
            <div className="section-title text-uppercase">
            
                 <i className="bi bi-stars" style={{ color: '#ed3545' }}></i> Outfits Based on Your Searches
              
             
            </div>
            <div className="outfits-horizontal">
              {outfits.map(outfit => renderOutfitCard(outfit, 'search'))}
            </div>
          </div>
        )}

        {/* AI Recommendations Based on Purchase History */}
        {isAuthenticated && !ordersLoading && similarOutfits.length > 0 && (
          <div className="outfits-section">
            <div className="section-title text-uppercase">
              <i className="bi bi-stars"></i>
             DAG AI Recommendations Based on Your Taste
              <span className="ai-badge">Powered by AI</span>
            </div>
            <div className="outfits-horizontal">
              {similarOutfits.map(outfit => renderOutfitCard(outfit, 'ai'))}
            </div>
          </div>
        )}

        {/* Your Past Purchases (Real Items) */}
        {isAuthenticated && !ordersLoading && purchasedItems.length > 0 && (
          <div className="outfits-section">
            <div className="section-title text-uppercase">
              <i className="bi bi-bag-check" style={{ color: '#ed3545' }}></i>
              Past Purchases
            </div>
            <div className="outfits-horizontal">
              {purchasedItems.map((item, idx) => (
                <div key={`${item.orderId}-${item._id || idx}`} className="purchased-item-card">
                  <img 
                    src={item.images?.cover || item.image || 'https://via.placeholder.com/200'} 
                    alt={item.name}
                    className="purchased-item-image"
                    onError={(e) => e.target.src = "https://via.placeholder.com/200"}
                  />
                  <div className="purchased-item-info">
                    <div className="purchased-item-name">{item.name}</div>
                    <div className="purchased-item-price">₹{item.finalPrice}</div>
                    <div className="purchased-item-date">
                      <i className="bi bi-calendar3 me-1"></i>
                      {new Date(item.orderDate).toLocaleDateString()}
                    </div>
                  
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAuthenticated && !ordersLoading && purchasedItems.length === 0 && (
          <div className="empty-state">
            <i className="bi bi-bag-x"></i>
            <p>You haven't purchased anything yet. Start shopping to see AI recommendations!</p>
            <Link to="/" className="btn btn-danger">Start Shopping</Link>
          </div>
        )}

        {/* AI Outfit Recommendations (external component) */}
        <OutfitRecommendations />
      </div>
    </div>
  );
}

export default Search;