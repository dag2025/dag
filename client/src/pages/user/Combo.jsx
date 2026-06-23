import { useState, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import combobanner from '../../assets/combo-banner.svg';
import giftbanner from '../../assets/gift-banner.svg';
import axios from 'axios';
import '../../styles/Combo.css';

import API_BASE_URL from "../../Config/Api";

function Combo() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(1);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    minPrice: 0,
    maxPrice: 10000
  });
  
  // Combo/Gift state
  const [combo, setCombo] = useState(null);
  const [gift, setGift] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [giftMessage, setGiftMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [savedGiftDetails, setSavedGiftDetails] = useState({ message: '', recipientName: '', recipientEmail: '' });
  const [isEditingGift, setIsEditingGift] = useState(false);
  const [showComboOffcanvas, setShowComboOffcanvas] = useState(false);
  
  // Store available sizes for each combo item (keyed by item._id)
  const [itemSizes, setItemSizes] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProducts();
    fetchCombo('combo');
    fetchCombo('gift');
  }, [isAuthenticated]);

  // Fetch sizes for items when combo/gift changes
  useEffect(() => {
    const fetchSizesForItems = async (items) => {
      const sizesMap = {};
      for (const item of items) {
        try {
          const endpoint = item.productType === 'dress' 
            ? `${API_BASE_URL}/dresses/${item.productId}`
            : `${API_BASE_URL}/jewellery/${item.productId}`;
          const response = await axios.get(endpoint);
          if (response.data.success) {
            const product = response.data.dress || response.data.jewellery;
            const allSizes = [...(product.sizes || []), ...(product.meterSizes || [])];
            sizesMap[item._id] = allSizes;
          }
        } catch (error) {
          console.error('Error fetching product sizes:', error);
        }
      }
      setItemSizes(prev => ({ ...prev, ...sizesMap }));
    };

    if (combo?.items?.length) {
      fetchSizesForItems(combo.items);
    }
    if (gift?.items?.length) {
      fetchSizesForItems(gift.items);
    }
  }, [combo, gift]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [dressesRes, jewelleryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dresses`),
        axios.get(`${API_BASE_URL}/jewellery`)
      ]);
      
      const allProducts = [
        ...(dressesRes.data.dresses?.map(d => ({ ...d, type: 'dress' })) || []),
        ...(jewelleryRes.data.jewellery?.map(j => ({ ...j, type: 'jewellery' })) || [])
      ];
      
      setProducts(allProducts);
      
      // Extract unique categories from products
      const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(c => c))];
      setCategories(['all', ...uniqueCategories]);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCombo = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/combo/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        if (type === 'combo') setCombo(response.data.combo);
        else {
          setGift(response.data.combo);
          // Load saved gift details from the combo data
          if (response.data.combo?.giftDetails) {
            const details = response.data.combo.giftDetails;
            setGiftMessage(details.message || '');
            setRecipientName(details.recipientName || '');
            setRecipientEmail(details.recipientEmail || '');
            setSavedGiftDetails(details);
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    }
  };

  const handleAddToCombo = async (product, type) => {
    const selectedSize = selectedSizes[product._id];
    
    // Check if product has sizes and user selected one
    if ((product.sizes?.length > 0 || product.meterSizes?.length > 0) && !selectedSize) {
      alert('Please select a size');
      return;
    }

    try {
      setUpdatingId(product._id);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/combo/add/${type}`,
        {
          productType: product.type,
          productId: product._id,
          selectedSize: selectedSize || null,
          quantity: 1
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (type === 'combo') setCombo(response.data.combo);
        else setGift(response.data.combo);
        alert(`✓ Added to ${type === 'combo' ? 'Combo' : 'Gift'}!`);
        
        // Clear selected size for this product after adding
        setSelectedSizes(prev => {
          const newState = { ...prev };
          delete newState[product._id];
          return newState;
        });
      }
    } catch (error) {
      console.error('Error adding to combo:', error);
      alert(error.response?.data?.message || 'Failed to add');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveFromCombo = async (item, type) => {
    const comboData = type === 'combo' ? combo : gift;
    if (!comboData) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/combo/remove/${comboData._id}/${item._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (type === 'combo') setCombo(response.data.combo);
        else setGift(response.data.combo);
      }
    } catch (error) {
      console.error('Error removing from combo:', error);
      alert('Failed to remove');
    }
  };

  const handleUpdateQuantity = async (item, type, newQuantity) => {
    if (newQuantity < 1) return;
    
    const comboData = type === 'combo' ? combo : gift;
    if (!comboData) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/combo/update/${comboData._id}/${item._id}`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (type === 'combo') setCombo(response.data.combo);
        else setGift(response.data.combo);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleUpdateSize = async (item, type, newSize) => {
    const comboData = type === 'combo' ? combo : gift;
    if (!comboData) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/combo/update/${comboData._id}/${item._id}`,
        { selectedSize: newSize },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (type === 'combo') setCombo(response.data.combo);
        else setGift(response.data.combo);
      }
    } catch (error) {
      console.error('Error updating size:', error);
      alert(error.response?.data?.message || 'Failed to update size');
    }
  };

  const handleClearCombo = async (type) => {
    const comboData = type === 'combo' ? combo : gift;
    if (!comboData || comboData.items.length === 0) return;
    
    if (!window.confirm(`Clear all items from ${type}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/combo/clear/${comboData._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (type === 'combo') setCombo(response.data.combo);
        else setGift(response.data.combo);
        
        // Close offcanvas if it's open after clearing
        setShowComboOffcanvas(false);
      }
    } catch (error) {
      console.error('Error clearing combo:', error);
      alert('Failed to clear');
    }
  };

  const handlePurchase = async (type) => {
    const comboData = type === 'combo' ? combo : gift;
    
    // IMPROVEMENT 1: Ensure multiple products are added (at least 2 items)
    if (!comboData || comboData.items.length === 0) {
      alert('Your combo is empty. Please add some products first.');
      return;
    }
    
    if (comboData.items.length < 2) {
      alert('✨ Please add at least 2 products to create a combo! Mix and match items to get the best discount. ✨');
      return;
    }

    // Navigate to checkout
    navigate('/checkout', { 
      state: { 
        type: activeTab === 1 ? 'combo' : 'gift', 
        data: { 
          items: (activeTab === 1 ? combo : gift)?.items,
          giftDetails: activeTab === 2 ? { 
            message: giftMessage, 
            recipientName, 
            recipientEmail 
          } : undefined
        } 
      } 
    });
  };

  const handleSaveGiftDetails = async () => {
    if (!gift) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/combo/gift/${gift._id}`,
        {
          message: giftMessage,
          recipientName,
          recipientEmail
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSavedGiftDetails({ message: giftMessage, recipientName, recipientEmail });
        setIsEditingGift(false);
        alert('Gift details saved!');
      }
    } catch (error) {
      console.error('Error saving gift details:', error);
      alert('Failed to save gift details');
    }
  };

  const handleEditGift = () => {
    setIsEditingGift(true);
  };

  const handleCancelEdit = () => {
    setGiftMessage(savedGiftDetails.message);
    setRecipientName(savedGiftDetails.recipientName);
    setRecipientEmail(savedGiftDetails.recipientEmail);
    setIsEditingGift(false);
  };

  const filteredProducts = products.filter(product => {
    if (filters.type !== 'all' && product.type !== filters.type) return false;
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (product.price < filters.minPrice || product.price > filters.maxPrice) return false;
    return true;
  });

  const calculateDiscount = (price, finalPrice) => {
    if (!price || !finalPrice || price === finalPrice) return 0;
    return Math.round(((price - finalPrice) / price) * 100);
  };

  const getAllSizes = (product) => {
    const sizes = [];
    if (product.sizes) sizes.push(...product.sizes);
    if (product.meterSizes) sizes.push(...product.meterSizes);
    return sizes;
  };

  // Check if combo/gift has items (for showing view button)
  const hasItems = activeTab === 1 
    ? (combo?.items?.length || 0) > 0 
    : (gift?.items?.length || 0) > 0;

  // Render items table inside component to access itemSizes
  const renderItemsTable = (comboData, type) => {
    return (
      <div className="items-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Price</th>
              <th>Size</th>
              <th>Qty</th>
              <th>Stock</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {comboData.items.map((item, index) => {
              const sizes = itemSizes[item._id] || [];
              const currentSize = item.selectedSize;
              return (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td className="product-cell">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.productType}</small>
                    </div>
                  </td>
                  <td>
                    ₹{item.finalPrice}
                    {item.discount > 0 && <small className="discount">{item.discount}% off</small>}
                  </td>
                  <td>
                    {currentSize ? (
                      <select
                        className="size-select"
                        value={currentSize.size}
                        onChange={(e) => {
                          const selected = sizes.find(s => s.size === e.target.value);
                          if (selected) handleUpdateSize(item, type, selected);
                        }}
                      >
                        {sizes.map(s => (
                          <option key={s.size} value={s.size}>
                            {s.size} {s.stock === 0 ? '(Out of stock)' : `(${s.stock} left)`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="no-size">No size</span>
                    )}
                  </td>
                  <td>
                    <div className="quantity-control">
                      <button
                        onClick={() => handleUpdateQuantity(item, type, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item, type, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    <p className={`combo-stock-badge ${currentSize?.stock > 5 ? 'in-stock' : 'low-stock'}`}>
                      {currentSize?.stock !== undefined ? currentSize.stock : 'N/A'}
                    </p>
                  </td>
                  <td>₹{item.finalPrice * item.quantity}</td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveFromCombo(item, type)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="combo-container mt-2 mb-2">
      {/* Header */}
        {activeTab === 1 ? (
              <>   <img  src={combobanner} alt="combo-banner" className='img-fluid' style={{width:'100%',borderRadius:'0px'}}/></>

            ) : (
              <><img src={giftbanner} alt="gift-banner" className='img-fluid' style={{width:'100%',borderRadius:'0px'}}/></>
            )}
   
      <div className="combo-header">
      
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => setActiveTab(1)}
        >
          <i className="bi bi-grid-3x3-gap-fill"></i>
          Create Combo
          <span className="discount-badge">20% OFF</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 2 ? 'active' : ''}`}
          onClick={() => setActiveTab(2)}
        >
          <i className="bi bi-gift-fill"></i>
          Send Gift
          <span className="discount-badge">10% OFF</span>
        </button>
      </div>
  
      {/* Filters */}
      <div className="filters-section">
        <select
          className="filter-select"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="all">All Products</option>
          <option value="dress">Dresses Only</option>
          <option value="jewellery">Jewellery Only</option>
        </select>

        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>

        <div className="price-range">
          <input
            type="range"
            min="0"
            max="10000"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
          />
          <span>Max: ₹{filters.maxPrice}</span>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => {
            const discountPercent = calculateDiscount(product.price, product.finalPrice);
            const hasSizes = product.sizes?.length > 0 || product.meterSizes?.length > 0;
            const allSizes = getAllSizes(product);
            
            return (
              <div key={product._id} className="product-card">
                <img src={product.images?.cover || product.image} alt={product.name} />
                
                {discountPercent > 0 && (
                  <span className="discount-badge">{discountPercent}% OFF</span>
                )}
                
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="product-category">{product.category}</p>
                  <div className="product-price">
                    <span className="final-price">₹{product.finalPrice}</span>
                    {discountPercent > 0 && (
                      <span className="original-price">₹{product.price}</span>
                    )}
                  </div>
                  
                  {hasSizes && (
                    <>
                      <label>Select Size:</label>
                      <div className="size-selector">
                        <div className="size-options">
                          {allSizes.map(size => (
                            <button
                              key={size.size}
                              className={`size-btn ${selectedSizes[product._id]?.size === size.size ? 'selected' : ''} ${size.stock === 0 ? 'out-of-stock' : ''}`}
                              onClick={() => setSelectedSizes({
                                ...selectedSizes,
                                [product._id]: size
                              })}
                              disabled={size.stock === 0}
                            >
                              {size.size}
                              {size.stock === 0 && <span className="stock-warning">(0)</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="product-actions">
                    <a href={`/${product.type}/${product._id}`} className="view-link">
                      <i className="bi bi-eye"></i> View
                    </a>
                    <button
                      className="add-btn"
                      onClick={() => handleAddToCombo(product, activeTab === 1 ? 'combo' : 'gift')}
                      disabled={updatingId === product._id || (hasSizes && !selectedSizes[product._id])}
                    >
                      {updatingId === product._id ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        <>
                          <i className="bi bi-plus-circle text-white"></i>
                          Add to {activeTab === 1 ? 'Combo' : 'Gift'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IMPROVEMENT 3: Bottom Action Buttons - Only show if at least one item is added */}
      {hasItems && (
        <div className="button-container">
          <button
            className="action-btn view-details-btn"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#comboOffcanvas"
            onClick={() => setShowComboOffcanvas(true)}
          >
            <i className="bi bi-cart-check"></i>
            View {activeTab === 1 ? 'Combo' : 'Gift'} Details
            <span className="item-count">
              {(activeTab === 1 ? combo?.items?.length : gift?.items?.length) || 0}
            </span>
          </button>
          
          <button
            className="action-btn buy-btn"
            onClick={() => handlePurchase(activeTab === 1 ? 'combo' : 'gift')}
          >
            <i className="bi bi-lightning-charge text-white"></i>
            Buy Now
          </button>
        </div>
      )}

      {/* Empty State when no items */}
      {!hasItems && (
        <div className="empty-combo-state">
          <i className="bi bi-cart-plus"></i>
          <h4>Your {activeTab === 1 ? 'Combo' : 'Gift'} is Empty</h4>
          <p>Add at least 2 products to get started!</p>
          <p className="small-text">✨ Mix and match dresses with jewellery for the best discounts ✨</p>
        </div>
      )}

      {/* Offcanvas Details */}
      <div 
        className={`offcanvas offcanvas-bottom overflow-y-auto ${showComboOffcanvas ? 'show' : ''}`} 
        tabIndex="-1" 
        id="comboOffcanvas"
        style={{ display: showComboOffcanvas ? 'block' : 'none' }}
      >
        <div className="offcanvas-header sticky-top ">
          <h5 className="offcanvas-title">
            {activeTab === 1 ? (
              <><i className="bi bi-grid-3x3-gap-fill"></i> Combo Details</>
            ) : (
              <><i className="bi bi-gift-fill"></i> Gift Details</>
            )}
          </h5>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setShowComboOffcanvas(false)}
          ></button>
        </div>
        
        <div className="offcanvas-body">
          {activeTab === 1 && combo && (
            <>
              <div className="discount-info">
                <i className="bi bi-tag-fill"></i>
                Get 20% discount on total combo price! <strong>Minimum 2 items required</strong>
              </div>
              
              {renderItemsTable(combo, 'combo')}
              
              {combo.items.length < 2 && (
                <div className="warning-message">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  Add at least 2 products to get the combo discount!
                </div>
              )}
            </>
          )}
          
          {activeTab === 2 && gift && (
            <>
              <div className="discount-info">
                <i className="bi bi-tag-fill"></i>
                Get 10% discount on total gift price! <strong>Minimum 2 items required</strong>
              </div>
              
              {renderItemsTable(gift, 'gift')}
              
              {gift.items.length < 2 && (
                <div className="warning-message">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  Add at least 2 products to get the gift discount!
                </div>
              )}
              
              <div className="gift-message-section">
                <div className="gift-header">
                  <h6><i className="bi bi-chat-heart"></i> Gift Message</h6>
                  {!isEditingGift && savedGiftDetails.message && (
                    <button className="edit-gift-btn" onClick={handleEditGift}>
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                  )}
                </div>
                
                {!isEditingGift ? (
                  <div className="saved-gift-details">
                    {savedGiftDetails.message ? (
                      <>
                        <p><strong>Message:</strong> {savedGiftDetails.message}</p>
                        <p><strong>Recipient:</strong> {savedGiftDetails.recipientName} ({savedGiftDetails.recipientEmail})</p>
                      </>
                    ) : (
                      <p className="text-muted">No gift details saved. Click Edit to add.</p>
                    )}
                    {!savedGiftDetails.message && (
                      <button className="add-gift-btn" onClick={handleEditGift}>
                        <i className="bi bi-plus-circle"></i> Add Gift Details
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <textarea
                      className="gift-message"
                      placeholder="Write a message to your friend..."
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      rows="3"
                    ></textarea>
                    
                    <div className="recipient-details">
                      <input
                        type="text"
                        placeholder="Recipient's Name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                      <input
                        type="email"
                        placeholder="Recipient's Email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>
                    
                    <div className="gift-actions">
                      <button
                        className="save-gift-btn"
                        onClick={handleSaveGiftDetails}
                      >
                        <i className="bi bi-check-circle"></i> Save Gift Details
                      </button>
                      <button
                        className="cancel-gift-btn"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
          
          {(activeTab === 1 ? combo?.items?.length : gift?.items?.length) > 0 && (
            <>
              <div className="combo-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{(activeTab === 1 ? combo?.totalPrice : gift?.totalPrice) || 0}</span>
                </div>
                <div className="summary-row discount">
                  <span>Discount ({(activeTab === 1 ? combo?.discountPercentage : gift?.discountPercentage) || 0}%):</span>
                  <span>-₹{((activeTab === 1 ? combo?.totalPrice : gift?.totalPrice) - (activeTab === 1 ? combo?.finalPrice : gift?.finalPrice)).toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₹{(activeTab === 1 ? combo?.finalPrice : gift?.finalPrice)?.toFixed(2) || 0}</span>
                </div>
              </div>
              
              <div className="offcanvas-actions">
                <button
                  className="clear-btn"
                  onClick={() => handleClearCombo(activeTab === 1 ? 'combo' : 'gift')}
                >
                  <i className="bi bi-trash"></i> Clear All
                </button>
                <button
                  className="purchase-btn"
                  onClick={() => {
                    handlePurchase(activeTab === 1 ? 'combo' : 'gift');
                    setShowComboOffcanvas(false);
                  }}
                  disabled={(activeTab === 1 ? combo?.items?.length : gift?.items?.length) < 2}
                >
                  <i className="bi bi-lightning-charge"></i> Proceed to Buy
                  {(activeTab === 1 ? combo?.items?.length : gift?.items?.length) < 2 && (
                    <span className="ms-2 small">(Add {2 - (activeTab === 1 ? combo?.items?.length : gift?.items?.length)} more)</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Backdrop for offcanvas */}
      {showComboOffcanvas && (
        <div 
          className="offcanvas-backdrop fade show" 
          onClick={() => setShowComboOffcanvas(false)}
        ></div>
      )}
    </div>
  );
}

export default Combo;