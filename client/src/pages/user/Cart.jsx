import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import CartBanner from '../../assets/cart-banner.svg';
import '../../styles/Cart.css';

function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  // Add this with your other useState declarations
const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [appliedCoins, setAppliedCoins] = useState(false);
  const [productDetails, setProductDetails] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated]);

  useEffect(() => {
    if (cart?.items) {
      fetchProductDetailsForItems();
    }
  }, [cart]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetailsForItems = async () => {
    const details = {};
    
    for (const item of cart.items) {
      try {
        const token = localStorage.getItem('token');
        const endpoint = item.productType === 'dress' 
          ? `http://localhost:5000/api/dresses/${item.productId}`
          : `http://localhost:5000/api/jewellery/${item.productId}`;
        
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          const product = response.data.dress || response.data.jewellery;
          details[item._id] = {
            sizes: product.sizes || [],
            meterSizes: product.meterSizes || []
          };
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
      }
    }
    
    setProductDetails(details);
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdatingItem(itemId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/cart/update/${itemId}`, 
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert(err.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleSizeChange = async (itemId, newSize, currentItem) => {
    setUpdatingItem(itemId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/cart/update-size/${itemId}`,
        { selectedSize: newSize },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setCart(response.data.cart);
        // Refresh product details after size change
        await fetchProductDetailsForItems();
      }
    } catch (err) {
      console.error('Error updating size:', err);
      alert(err.response?.data?.message || 'Failed to update size');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;
    
    setUpdatingItem(itemId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/cart/remove/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Failed to remove item');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete('http://localhost:5000/api/cart/clear', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      alert('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };



  // Find where you navigate to checkout - likely in a handleProceedToCheckout function
const handleProceedToCheckout = () => {
  // Use cart (not cartItems) if that's your state variable name
  navigate('/checkout', { 
    state: { 
      type: 'cart', 
      data: { items: cart?.items || [] }  // Use your cart state variable name
    } 
  });
};

  // Fixed coin calculation: 10 coins per 1000 spent
  const calculateCoins = (amount) => {
    return Math.floor(amount / 1000) * 10; // 10 coins per 1000 (100/1000*10 = 1 coin per 100)
  };

  if (loading) {
    return (
      <div className="cart-container container-fluid mt-5 text-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-container container-fluid mt-5">
        <div className="alert alert-danger text-center">
          {error}
          <button className="btn btn-outline-danger ms-3" onClick={fetchCart}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    
    <div className="cart-container container-fluid mt-2 text-capitalize">

      <img src={CartBanner} alt="Cart Banner" className="cart-banner img-fluid" style={{width:'100%', borderRadius:'0px'}}/>
      
      {!cart?.items?.length ? (
        <div className="empty-cart text-center py-5">
          <i className="bi bi-cart-x" style={{ fontSize: '4rem', color: '#ed3545' }}></i>
          <h4 className="mt-3">Your cart is empty</h4>
          <p className="text-muted">Looks like you haven't added anything to your cart yet</p>
          <Link to="/dress" className="btn btn-primary mt-3">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-table mt-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Image</th>
                    <th scope="col">Name</th>
                    <th scope="col">Price</th>
                    <th scope="col">Selected Size</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Stock</th>
                    <th scope="col">Total</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item, index) => {
                    const itemDetails = productDetails[item._id];
                    const allSizes = [];
                    
                    if (itemDetails) {
                      if (item.productType === 'dress') {
                        allSizes.push(...(itemDetails.sizes || []));
                        allSizes.push(...(itemDetails.meterSizes || []));
                      } else {
                        allSizes.push(...(itemDetails.sizes || []));
                      }
                    }
                    
                    return (
                      <tr key={item._id} className={updatingItem === item._id ? 'table-secondary' : ''}>
                        <th scope="row">{index + 1}</th>
                        <td>
                          <div className="d-flex align-items-center">
                            <img 
                              src={item.image || "https://via.placeholder.com/50"} 
                              alt={item.name}
                              className="cart-product-img me-3"
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }}
                            />
                           
                          </div>
                        </td>
                        <td>
                           <div>
                              <Link to={`/${item.productType}/${item.productId}`} className="text-decoration-none text-dark">
                                <strong>{item.name}</strong>
                              </Link>
                              <div className="small text-muted">
                                {item.productType === 'dress' ? ' Dress' : ' Jewellery'}
                              </div>
                            </div>
                        </td>
                        <td>
                          <div>
                            <span className="fw-bold">₹{item.finalPrice}</span>
                            {item.discount > 0 && (
                              <>
                                <br />
                                <small className="text-muted text-decoration-line-through">
                                  ₹{item.price}
                                </small>
                                <br />
                                <small className="text-success">{item.discount}% off</small>
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          {item.selectedSize ? (
                            <div className="dropdown">
                              <button 
                                className="btn btn-outline-secondary dropdown-toggle" 
                                type="button" 
                                data-bs-toggle="dropdown" 
                                disabled={updatingItem === item._id || !allSizes.length}
                              >
                                {item.selectedSize.size}
                              </button>
                              <ul className="dropdown-menu" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {allSizes.map((size, idx) => {
                                  const isAvailable = size.stock > 0;
                                  const isSelected = item.selectedSize?.size === size.size;
                                  
                                  return (
                                    <li key={idx}>
                                      <button 
                                        className={`dropdown-item ${isSelected ? 'active' : ''} ${!isAvailable ? 'text-muted' : ''}`}
                                        onClick={() => isAvailable && handleSizeChange(item._id, size, item)}
                                        disabled={!isAvailable}
                                      >
                                        {size.size} 
                                        {!isAvailable && ' (Out of Stock)'}
                                        {isAvailable && <span className="badge bg-success ms-2">{size.stock} left</span>}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : (
                            <span className="text-muted">No size required</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updatingItem === item._id}
                            >
                              <i className="bi bi-dash"></i>
                            </button>
                            <span className="mx-3 fw-bold">{item.quantity}</span>
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                              disabled={updatingItem === item._id}
                            >
                              <i className="bi bi-plus"></i>
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${item.selectedSize?.stock > 5 ? 'bg-success' : 'bg-warning'}`}>
                            {item.selectedSize?.stock || 'N/A'} left
                          </span>
                        </td>
                        <td className="fw-bold text-danger">₹{item.finalPrice * item.quantity}</td>
                        <td>
                          <button 
                            className="text-danger border-0 bg-white"
                            onClick={() => handleRemoveItem(item._id)}
                            disabled={updatingItem === item._id}
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button 
                className="btn btn-outline-danger"
                onClick={handleClearCart}
                disabled={loading}
              >
                <i className="bi bi-x-lg me-2"></i>
                Clear Cart
              </button>
              <span className="text-muted">
                Total Items: <strong>{cart.totalItems}</strong>
              </span>
            </div>
          </div>

          <div className="cart-summary mt-5 bg-white ">
            <div className="row">
              <div className="col-md-6 offset-md-6">
                <div className="card mx-auto">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Cart Summary</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal ({cart.totalItems} items):</span>
                      <span className="fw-bold">₹{cart.totalPrice}</span>
                    </div>
                    {cart.totalDiscount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Discount:</span>
                        <span>- ₹{cart.totalDiscount}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between mb-3">
                      <span>Total:</span>
                      <span className="fw-bold fs-5 text-danger">₹{cart.finalPrice}</span>
                    </div>

                    <div className="alert alert-success bg-white" role="alert">
                      <h6 className="alert-heading d-flex align-items-center">
                        <i className="bi bi-gem me-2"></i>
                        Dag Coins Rewards!
                      </h6>
                      <p className="small mb-2">
                        You'll earn <strong className="text-danger">{calculateCoins(cart.finalPrice)} Dag Coins</strong> on this purchase!
                        <br />
                        <small className="text-muted">
                          (10 coins per ₹1000 spent • 10 coins = ₹1)
                        </small>
                      </p>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="small">
                          <i className="bi bi-coin text-warning me-1"></i>
                          Balance: {calculateCoins(cart.finalPrice)} coins (₹{Math.floor(calculateCoins(cart.finalPrice) / 10)})
                        </span>
                       
                      </div>
                    </div>

<button 
  className="btn btn-success w-100 py-3 fw-bold"
  onClick={handleProceedToCheckout}
>
  <i className="bi bi-lock me-2 text-white"></i>
  Proceed to Checkout
</button>
                    
                    <Link to="/dress" className="btn btn-link text-danger w-100 mt-2 text-decoration-none">
                      <i className="bi bi-arrow-left me-1"></i>
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}

export default Cart;