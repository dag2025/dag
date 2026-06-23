import React, { useState, useEffect } from 'react';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../Config/Api';

import GiftOrder from '../../components/order/GiftOrder';
import ComboOrder from '../../components/order/ComboOrder';
import CartOrder from '../../components/order/CartOrder';
import DressOrder from '../../components/order/DressOrder';
import JewelleryOrder from '../../components/order/JewelleryOrder';

const Order = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    orders,
    selectedOrder,
    setSelectedOrder,
    loading,
    fetchOrders,
    toast,
    setToast,
    cancelOrderItem,
    cancelEntireOrder,
    returnOrder,
    updateAddress,
    updateGiftDetails,
    updatePaymentMethod,
    deleteReturnRequest
  } = useOrder();

  // Local state for modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState({ type: null, id: null });
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [editingReturn, setEditingReturn] = useState(false);
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [editAddress, setEditAddress] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

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

  const handlePaymentChange = async (orderId, currentMethod) => {
    setNewPaymentMethod(currentMethod);
    setCancelTarget({ type: 'payment', id: orderId });
    setShowPaymentModal(true);
  };

  const confirmPaymentChange = async () => {
    if (!newPaymentMethod || !cancelTarget.id) return;

    if (newPaymentMethod === 'cod') {
      await updatePaymentMethod(cancelTarget.id, 'cod');
      setShowPaymentModal(false);
      return;
    }

    if (newPaymentMethod === 'online') {
      setProcessingPayment(true);
      try {
        const order = orders.find(o => o._id === cancelTarget.id);
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) throw new Error('Failed to load Razorpay');

        const amountToPay = order.finalAmount;
        
        const razorpayRes = await axios.post(
          `${API_BASE_URL}/orders/create-razorpay-order`,
          { amount: amountToPay },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        if (!razorpayRes.data.success) throw new Error('Failed to create payment order');

        const razorpayOrder = razorpayRes.data.order;
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

        const options = {
          key: razorpayKey,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'DAG',
          description: `Payment for Order #${order._id.slice(-6)}`,
          order_id: razorpayOrder.id,
          handler: async (response) => {
            try {
              const verifyRes = await axios.post(
                `${API_BASE_URL}/orders/verify-payment-update`,
                {
                  orderId: order._id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
              );

              if (verifyRes.data.success) {
                setToast({ show: true, message: 'Payment successful!', type: 'success' });
                fetchOrders();
                setShowPaymentModal(false);
              }
            } catch (err) {
              console.error('Payment verification error:', err);
              setToast({ show: true, message: 'Payment verification failed', type: 'error' });
            }
          },
          modal: { ondismiss: () => setProcessingPayment(false) },
          prefill: {
            name: order.address?.name || user?.name,
            email: order.address?.email || user?.email,
            contact: order.address?.mobile
          },
          theme: { color: '#ed3545' }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error('Payment error:', err);
        setToast({ show: true, message: err.message, type: 'error' });
        setProcessingPayment(false);
        setShowPaymentModal(false);
      }
    }
  };

  const handleCancelClick = (type, id) => {
    setCancelTarget({ type, id });
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (cancelTarget.type === 'entire') {
      await cancelEntireOrder(cancelTarget.id);
    } else {
      await cancelOrderItem(selectedOrder._id, cancelTarget.id);
    }
    setShowCancelModal(false);
  };

  const handleReturnSubmit = async () => {
    if (!returnReason.trim() || returnReason.length < 10) {
      alert('Please provide a detailed reason (min 10 characters)');
      return;
    }
    await returnOrder(selectedOrder._id, returnReason);
    setShowReturnModal(false);
    setReturnReason('');
    setEditingReturn(false);
  };

  const handleDeleteReturn = async (orderId) => {
    if (!window.confirm('Delete return request?')) return;
    await deleteReturnRequest(orderId);
  };

  const handleEditReturn = (reason) => {
    setReturnReason(reason);
    setEditingReturn(true);
    setShowReturnModal(true);
  };

  const handleAddressUpdate = async () => {
    if (!editAddress.name || !editAddress.mobile || !editAddress.pincode || !editAddress.address || !editAddress.city || !editAddress.state) {
      alert('Please fill all required fields');
      return;
    }
    await updateAddress(selectedOrder._id, editAddress);
    setShowEditAddress(false);
  };

  const renderOrderComponent = (order) => {
    const props = {
      key: order._id,
      order,
      onCancelItem: (orderId, itemId) => handleCancelClick('item', itemId),
      onCancelEntire: (orderId) => handleCancelClick('entire', orderId),
      onReturn: (orderId) => setShowReturnModal(true),
      onEditAddress: (address) => {
        setEditAddress(address);
        setShowEditAddress(true);
      },
      onChangePayment: (currentMethod) => handlePaymentChange(order._id, currentMethod),
      onUpdateGift: updateGiftDetails,
      onDeleteReturn: handleDeleteReturn,
      onEditReturn: handleEditReturn
    };

    switch (order.orderType?.toLowerCase()) {
      case 'gift':
        return <GiftOrder {...props} />;
      case 'combo':
        return <ComboOrder {...props} />;
      case 'cart':
        return <CartOrder {...props} />;
      case 'dress':
      case 'single':
        return <DressOrder {...props} />;
      case 'jewellery':
        return <JewelleryOrder {...props} />;
      default:
        return <CartOrder {...props} />;
    }
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: "'Inter', sans-serif"
    },
    title: {
      textAlign: 'center',
      fontSize: '2rem',
      fontWeight: 700,
      color: '#333',
      marginBottom: '0.5rem',
      position: 'relative'
    },
    titleAccent: {
      content: '',
      position: 'absolute',
      bottom: '-10px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80px',
      height: '3px',
      background: 'linear-gradient(90deg, #ed3545, #ff6b6b)',
      borderRadius: '2px'
    },
    subtitle: {
      textAlign: 'center',
      color: '#666',
      marginBottom: '2rem',
      fontSize: '1rem'
    },
    orderSelector: {
      marginBottom: '20px',
      display: 'flex',
      gap: '10px',
      overflowX: 'auto',
      padding: '10px 0',
      scrollbarWidth: 'thin'
    },
    orderTab: {
      padding: '10px 20px',
      borderRadius: '30px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s',
      border: 'none'
    },
    orderTabActive: {
      background: '#ed3545',
      color: 'white'
    },
    orderTabInactive: {
      background: 'white',
      color: '#333',
      border: '1px solid #ddd'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '50px'
    },
    spinner: {
      width: '50px',
      height: '50px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #ed3545',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 20px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '50px'
    },
    emptyIcon: {
      fontSize: '4rem',
      color: '#ccc',
      marginBottom: '20px'
    },
    emptyTitle: {
      marginTop: '20px',
      color: '#666',
      fontSize: '1.5rem'
    },
    btnStart: {
      background: '#ed3545',
      color: 'white',
      border: 'none',
      padding: '10px 30px',
      borderRadius: '8px',
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: '20px'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'white',
      padding: '30px',
      borderRadius: '16px',
      maxWidth: '500px',
      width: '90%'
    },
    modalTitle: {
      marginBottom: '15px',
      color: '#333'
    },
    modalTextarea: {
      width: '100%',
      padding: '10px',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      marginBottom: '20px',
      fontSize: '14px',
      minHeight: '100px'
    },
    modalActions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end'
    },
    btnSecondary: {
      padding: '8px 16px',
      background: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    btnPrimary: {
      padding: '8px 16px',
      background: '#ed3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    btnDanger: {
      padding: '8px 16px',
      background: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    paymentOptions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      margin: '15px 0'
    },
    paymentOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      cursor: 'pointer'
    }
  };

  // Add keyframes animation
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .order-selector::-webkit-scrollbar {
      height: 4px;
    }
    .order-selector::-webkit-scrollbar-thumb {
      background: #ed3545;
      border-radius: 4px;
    }
  `;
  document.head.appendChild(styleSheet);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={styles.emptyState}>
        <i className="bi bi-box" style={styles.emptyIcon}></i>
        <h3 style={styles.emptyTitle}>No orders yet</h3>
        <p>Looks like you haven't placed any orders.</p>
        <button style={styles.btnStart} onClick={() => navigate('/dress')}>
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Orders</h2>
      <div style={styles.titleAccent}></div>
      <p style={styles.subtitle}>Track and manage your orders</p>

      {/* Order Selector */}
      <div style={styles.orderSelector} className="order-selector">
        {orders.map(order => (
          <button
            key={order._id}
            onClick={() => setSelectedOrder(order)}
            style={{
              ...styles.orderTab,
              ...(selectedOrder?._id === order._id ? styles.orderTabActive : styles.orderTabInactive)
            }}
          >
            Order #{order._id.slice(-6)} • {formatDate(order.createdAt)}
          </button>
        ))}
      </div>

      {/* Selected Order */}
      {selectedOrder && renderOrderComponent(selectedOrder)}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h4 style={styles.modalTitle}>Cancel {cancelTarget.type === 'entire' ? 'Order' : 'Item'}</h4>
            <p>Are you sure? This action cannot be undone.</p>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setShowCancelModal(false)}>No</button>
              <button style={styles.btnDanger} onClick={confirmCancel}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h4 style={styles.modalTitle}>{editingReturn ? 'Edit' : 'Submit'} Return Request</h4>
            <p>Please tell us why you want to return this order (min 10 characters).</p>
            <textarea
              style={styles.modalTextarea}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Reason for return..."
            />
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => {
                setShowReturnModal(false);
                setReturnReason('');
                setEditingReturn(false);
              }}>
                Cancel
              </button>
              <button style={styles.btnPrimary} onClick={handleReturnSubmit}>
                {editingReturn ? 'Update' : 'Submit'}
              </button>
            </div>
            {returnReason.length > 0 && returnReason.length < 10 && (
              <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '10px' }}>
                Please enter at least 10 characters
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {showEditAddress && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h4 style={styles.modalTitle}>Edit Address</h4>
            <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
              <input type="text" placeholder="Full Name *" value={editAddress.name || ''} onChange={(e) => setEditAddress({...editAddress, name: e.target.value})} style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
              <input type="email" placeholder="Email *" value={editAddress.email || ''} onChange={(e) => setEditAddress({...editAddress, email: e.target.value})} style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
              <input type="text" placeholder="Mobile *" value={editAddress.mobile || ''} onChange={(e) => setEditAddress({...editAddress, mobile: e.target.value})} style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
              <input type="text" placeholder="Pincode *" value={editAddress.pincode || ''} onChange={(e) => setEditAddress({...editAddress, pincode: e.target.value})} style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
              <textarea placeholder="Full Address *" rows="3" value={editAddress.address || ''} onChange={(e) => setEditAddress({...editAddress, address: e.target.value})} style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
              <input type="text" placeholder="Landmark" value={editAddress.landmark || ''} onChange={(e) => setEditAddress({...editAddress, landmark: e.target.value})} style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" placeholder="City *" value={editAddress.city || ''} onChange={(e) => setEditAddress({...editAddress, city: e.target.value})} style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
                <input type="text" placeholder="State *" value={editAddress.state || ''} onChange={(e) => setEditAddress({...editAddress, state: e.target.value})} style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setShowEditAddress(false)}>Cancel</button>
              <button style={styles.btnPrimary} onClick={handleAddressUpdate}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h4 style={styles.modalTitle}>Change Payment Method</h4>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
              Current: <strong>{newPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</strong>
            </p>
            <div style={styles.paymentOptions}>
              <label style={{...styles.paymentOption, borderColor: newPaymentMethod === 'cod' ? '#ed3545' : '#e0e0e0'}}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={newPaymentMethod === 'cod'}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  disabled={processingPayment}
                />
                <span>Cash on Delivery</span>
              </label>
              <label style={{...styles.paymentOption, borderColor: newPaymentMethod === 'online' ? '#ed3545' : '#e0e0e0'}}>
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={newPaymentMethod === 'online'}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  disabled={processingPayment}
                />
                <span>Online Payment</span>
              </label>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button style={styles.btnPrimary} onClick={confirmPaymentChange} disabled={processingPayment}>
                {processingPayment ? 'Processing...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast?.show && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: toast.type === 'success' ? '#28a745' : '#dc3545',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 2000,
          animation: 'slideIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
            <span>{toast.message}</span>
            <button style={{ background: 'none', border: 'none', color: 'white', marginLeft: '20px', cursor: 'pointer', fontSize: '18px' }} onClick={() => setToast({ show: false })}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;