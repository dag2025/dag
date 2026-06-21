import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCheckout } from '../../context/CheckoutContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const PaymentSection = React.memo(({ 
  activeTab, dressData, jewelleryData, comboItems, giftItems, cartItems, giftDetails,
  getComboTotal, getGiftTotal, getCartTotal, getGiftDiscount, getGiftSubtotal,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const { 
    paymentMethod, setPaymentMethod, appliedCoins, setAppliedCoins,
    loading, setLoading, selectedAddress
  } = useCheckout();

  // Modal state
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [coinInput, setCoinInput] = useState('');
  const [coinError, setCoinError] = useState('');

  // Calculate subtotal based on active tab
  const subtotal = useMemo(() => {
    if (activeTab === 1) return (dressData?.finalPrice || dressData?.price || 0) * (dressData?.quantity || 1);
    if (activeTab === 2) return (jewelleryData?.finalPrice || jewelleryData?.price || 0) * (jewelleryData?.quantity || 1);
    if (activeTab === 3) return getComboTotal?.() || 0;
    if (activeTab === 4) return getGiftSubtotal?.() || 0;
    if (activeTab === 5) return getCartTotal?.() || 0;
    return 0;
  }, [activeTab, dressData, jewelleryData, comboItems, giftItems, cartItems, getComboTotal, getGiftSubtotal, getCartTotal]);

  // Calculate discount (for gift/combo)
  const discount = useMemo(() => {
    if (activeTab === 3) return (getComboTotal?.() || 0) * 0.2;
    if (activeTab === 4) return getGiftDiscount?.() || 0;
    return 0;
  }, [activeTab, getComboTotal, getGiftDiscount]);

  // Total after discount but before coins
  const afterDiscountTotal = subtotal - discount;

  // Maximum coins that can be applied (each 10 coins = ₹1, cannot exceed afterDiscountTotal)
  const maxCoinsToApply = useMemo(() => {
    const maxRupees = Math.floor(afterDiscountTotal); // can't discount more than total
    const maxCoinsFromRupees = maxRupees * 10; // because 10 coins = ₹1
    const userCoins = user?.coins || 0;
    return Math.min(userCoins, maxCoinsFromRupees);
  }, [afterDiscountTotal, user?.coins]);

  // Final amount after coins
  const finalAmount = afterDiscountTotal - (appliedCoins / 10);

  // Effect to reset applied coins if maxCoinsToApply changes and applied exceeds
  useEffect(() => {
    if (appliedCoins > maxCoinsToApply) {
      setAppliedCoins(Math.max(0, maxCoinsToApply));
    }
  }, [maxCoinsToApply, appliedCoins, setAppliedCoins]);

  // Helper to format coins display
  const formatCoins = (coins) => `${coins} coins (₹${(coins / 10).toFixed(2)})`;

  // Open coin modal
  const handleOpenCoinModal = () => {
    setCoinInput(appliedCoins > 0 ? appliedCoins.toString() : '');
    setCoinError('');
    setShowCoinModal(true);
  };

  // Apply coins from modal
  const handleApplyCoins = () => {
    let coins = parseInt(coinInput);
    if (isNaN(coins) || coins < 0) {
      setCoinError('Please enter a valid number');
      return;
    }
    if (coins > maxCoinsToApply) {
      setCoinError(`You can apply at most ${maxCoinsToApply} coins (₹${(maxCoinsToApply / 10).toFixed(2)})`);
      return;
    }
    setAppliedCoins(coins);
    setShowCoinModal(false);
    setCoinInput('');
    setCoinError('');
  };

  // Remove all applied coins
  const handleRemoveCoins = () => {
    setAppliedCoins(0);
  };

  // Order type
  const getOrderType = () => {
    if (activeTab === 1 || activeTab === 2) return 'single';
    if (activeTab === 3) return 'combo';
    if (activeTab === 4) return 'gift';
    if (activeTab === 5) return 'cart';
    return '';
  };

  // Prepare order data (same as before but with improved logging)
  const prepareOrderData = () => {
    const baseOrderData = {
      userId: user?._id,
      address: selectedAddress,
      paymentMethod,
      coinsApplied: appliedCoins,
      orderType: getOrderType(),
      createdAt: new Date(),
    };

    if (activeTab === 1 && dressData) {
      const total = (dressData.finalPrice || dressData.price) * (dressData.quantity || 1);
      return {
        ...baseOrderData,
        items: [{
          productType: 'dress',
          productId: dressData._id,
          name: dressData.name,
          image: dressData.images?.cover,
          price: dressData.price,
          discount: dressData.discount,
          finalPrice: dressData.finalPrice || dressData.price,
          selectedSize: dressData.selectedSize,
          quantity: dressData.quantity || 1,
          total,
        }],
        subtotal: total,
        totalDiscount: 0,
        finalAmount: total - (appliedCoins / 10),
      };
    }

    if (activeTab === 2 && jewelleryData) {
      const total = (jewelleryData.finalPrice || jewelleryData.price) * (jewelleryData.quantity || 1);
      return {
        ...baseOrderData,
        items: [{
          productType: 'jewellery',
          productId: jewelleryData._id,
          name: jewelleryData.name,
          image: jewelleryData.image,
          price: jewelleryData.price,
          discount: jewelleryData.discount,
          finalPrice: jewelleryData.finalPrice || jewelleryData.price,
          selectedSize: jewelleryData.selectedSize,
          quantity: jewelleryData.quantity || 1,
          total,
        }],
        subtotal: total,
        totalDiscount: 0,
        finalAmount: total - (appliedCoins / 10),
      };
    }

    if (activeTab === 3 && comboItems) {
      const subtotalVal = getComboTotal?.() || 0;
      const discountVal = subtotalVal * 0.2;
      return {
        ...baseOrderData,
        items: comboItems.map(item => ({
          productType: item.productType || (item.dress ? 'dress' : 'jewellery'),
          productId: item._id || item.productId,
          name: item.name,
          image: item.images?.cover || item.image,
          price: item.price,
          discount: item.discount,
          finalPrice: item.finalPrice || item.price,
          selectedSize: item.selectedSize,
          quantity: item.quantity || 1,
          total: (item.finalPrice || item.price) * (item.quantity || 1),
        })),
        comboDiscount: 20,
        subtotal: subtotalVal,
        totalDiscount: discountVal,
        finalAmount: subtotalVal - discountVal - (appliedCoins / 10),
      };
    }

    if (activeTab === 4 && giftItems) {
      const items = giftItems.map(item => ({
        productType: item.productType || (item.dress ? 'dress' : 'jewellery'),
        productId: item._id || item.productId,
        name: item.name,
        image: item.images?.cover || item.image,
        price: item.price,
        discount: item.discount,
        finalPrice: item.finalPrice || item.price,
        selectedSize: item.selectedSize,
        quantity: item.quantity || 1,
        total: (item.finalPrice || item.price) * (item.quantity || 1),
      }));
      const subtotalVal = getGiftSubtotal?.() || 0;
      const discountVal = getGiftDiscount?.() || subtotalVal * 0.1;
      return {
        ...baseOrderData,
        orderType: 'gift',
        items,
        giftDetails: giftDetails || {},
        subtotal: subtotalVal,
        totalDiscount: discountVal,
        finalAmount: subtotalVal - discountVal - (appliedCoins / 10),
      };
    }

    if (activeTab === 5 && cartItems) {
      const subtotalVal = getCartTotal?.() || 0;
      return {
        ...baseOrderData,
        items: cartItems.map(item => ({
          productType: item.productType || (item.dress ? 'dress' : 'jewellery'),
          productId: item._id || item.productId,
          name: item.name,
          image: item.images?.cover || item.image,
          price: item.price,
          discount: item.discount,
          finalPrice: item.finalPrice || item.price,
          selectedSize: item.selectedSize,
          quantity: item.quantity || 1,
          total: (item.finalPrice || item.price) * (item.quantity || 1),
        })),
        subtotal: subtotalVal,
        totalDiscount: 0,
        finalAmount: subtotalVal - (appliedCoins / 10),
      };
    }
    return null;
  };

  // Razorpay logic (same as before, but ensure orderData is correct)
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (finalAmountVal) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Failed to load payment gateway. Please try again.');
      return;
    }
    try {
      const orderData = prepareOrderData();
      if (!orderData) throw new Error('Could not prepare order data');

      const razorpayRes = await axios.post(
        'http://localhost:5000/api/orders/create-razorpay-order',
        { amount: finalAmountVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!razorpayRes.data.success) throw new Error('Failed to create payment order');

      const razorpayOrder = razorpayRes.data.order;
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || process.env.REACT_APP_RAZORPAY_KEY_ID || '';
      if (!razorpayKey) throw new Error('Razorpay key not configured');

      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'DAG',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            setLoading(true);
            const finalOrderData = {
              ...orderData,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentStatus: 'paid',
            };
            const orderRes = await axios.post('http://localhost:5000/api/orders', finalOrderData, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (orderRes.data.success) {
              alert('Payment successful! Order placed.');
              navigate('/orders');
            }
          } catch (err) {
            console.error('Order creation error:', err);
            alert('Payment successful but order creation failed: ' + (err.response?.data?.message || err.message));
          } finally {
            setLoading(false);
            sessionStorage.removeItem('pendingOrder');
          }
        },
        modal: {
          ondismiss: () => {
            sessionStorage.removeItem('pendingOrder');
            alert('Payment cancelled. Please try again.');
          },
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: selectedAddress?.mobile,
        },
        theme: { color: '#ed3545' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay error:', err);
      alert('Payment initialization failed: ' + err.message);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }
    const orderData = prepareOrderData();
    if (!orderData) {
      alert('Could not prepare order data');
      return;
    }
    const finalAmountVal = finalAmount;
    if (paymentMethod === 'online') {
      await handleRazorpayPayment(finalAmountVal);
    } else {
      setLoading(true);
      try {
        const finalOrderData = { ...orderData, paymentStatus: 'pending' };
        const orderRes = await axios.post('http://localhost:5000/api/orders', finalOrderData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (orderRes.data.success) {
          alert('Order placed successfully!');
          navigate('/orders');
        }
      } catch (err) {
        console.error('Error placing order:', err);
        alert('Failed to place order: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  // Debug logging (optional)
  useEffect(() => {
    console.log('🔍 Checkout Data Debug:', {
      type: location.state?.type,
      data: location.state?.data,
      giftDetails,
      activeTab,
    });
  }, [location.state, giftDetails, activeTab]);

  return (
    <>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Left Column - Coins */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '1.1rem' }}>
              <i className="bi bi-coin" style={{ color: '#ffc107', marginRight: '8px' }}></i>
              Dag Coins
            </h4>
            <p style={{ fontSize: '1.1rem', margin: '16px 0' }}>
              Available: <strong style={{ color: '#ed3545', fontSize: '1.3rem' }}>{user?.coins || 0} coins</strong> 
              {(user?.coins || 0) > 0 && ` (₹${((user?.coins || 0) / 10).toFixed(2)})`}
            </p>

            {appliedCoins > 0 ? (
              <div style={{
                background: '#e8f5e9',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>
                  <i className="bi bi-check-circle-fill" style={{ color: '#2e7d32' }}></i> Applied: {formatCoins(appliedCoins)}
                </span>
                <button
                  onClick={handleRemoveCoins}
                  className="btn btn-sm btn-outline-danger"
                  style={{ padding: '4px 12px' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenCoinModal}
                disabled={!user?.coins || user?.coins === 0 || maxCoinsToApply === 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#fff3cd',
                  color: '#856404',
                  border: '1px solid #ffeeba',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: (user?.coins && maxCoinsToApply > 0) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  opacity: (user?.coins && maxCoinsToApply > 0) ? 1 : 0.5,
                }}
              >
                <i className="bi bi-coin"></i> Apply Coins
              </button>
            )}

            <div style={{
              background: '#d4edda',
              color: '#000000',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #c3e6cb',
            }} className='bg-white'>
              <h5 style={{ margin: '0 0 8px 0', color: '#000000' }}>Hurray!</h5>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                You'll get more coins for each purchase. When your order is completed, you earn coins.
              </p>
              <hr style={{ margin: '8px 0', border: '0', borderTop: '1px solid #c3e6cb' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>
                <strong>How coins work?</strong><br />
                <small>Spend ₹1000 → earn 10 coins → 10 coins = ₹1 off on next purchase</small>
              </p>
            </div>
          </div>

          {/* Right Column - Payment */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '1.1rem' }}>
              <i className="bi bi-credit-card" style={{ color: '#ed3545', marginRight: '8px' }}></i>
              Amount to Pay
            </h4>

            {/* Show breakdown */}
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#555' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#28a745' }}>
                  <span>Discount:</span>
                  <span>- ₹{discount.toFixed(2)}</span>
                </div>
              )}
              {appliedCoins > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ed3545' }}>
                  <span>Coins applied:</span>
                  <span>- ₹{(appliedCoins / 10).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '8px', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
                <span>Total:</span>
                <span style={{ fontSize: '1.2rem', color: '#ed3545' }}>₹{finalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', margin: '24px 0' }}>
              <label style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                border: `2px solid ${paymentMethod === 'cod' ? '#ed3545' : '#e0e0e0'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                background: paymentMethod === 'cod' ? '#fff0f0' : 'white',
                transition: 'all 0.2s',
              }}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ margin: 0 }}
                />
                <span>Cash on Delivery</span>
              </label>

              <label style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                border: `2px solid ${paymentMethod === 'online' ? '#ed3545' : '#e0e0e0'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                background: paymentMethod === 'online' ? '#fff0f0' : 'white',
                transition: 'all 0.2s',
              }}>
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ margin: 0 }}
                />
                <span>Online Payment</span>
              </label>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(135deg, #ed3545, #ff6b6b)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>

            {paymentMethod === 'online' && (
              <p style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center',
              }}>
                <i className="bi bi-shield-lock" style={{ marginRight: '4px' }}></i>
                Secure payment via Razorpay. You'll be redirected to complete payment.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bootstrap 5 Modal for applying coins */}
      <Modal show={showCoinModal} onHide={() => setShowCoinModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Apply Dag Coins</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You have <strong>{user?.coins || 0} coins</strong> available.</p>
          <p>Maximum applicable for this order: <strong>{maxCoinsToApply} coins</strong> (₹{(maxCoinsToApply / 10).toFixed(2)})</p>
          <p className="text-muted small">10 coins = ₹1 discount. Coins earned from past orders can be used here.</p>
          <Form.Group>
            <Form.Label>Enter coins to apply:</Form.Label>
            <Form.Control
              type="number"
              value={coinInput}
              onChange={(e) => setCoinInput(e.target.value)}
              placeholder={`Max ${maxCoinsToApply}`}
              min="0"
              max={maxCoinsToApply}
            />
            {coinError && <Alert variant="danger" className="mt-2">{coinError}</Alert>}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCoinModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleApplyCoins}>
            Apply Coins
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
});

PaymentSection.displayName = 'PaymentSection';

export default PaymentSection;