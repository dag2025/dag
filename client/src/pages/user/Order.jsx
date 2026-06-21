import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrder } from '../../context/OrderContext';
import { useNavigate } from 'react-router-dom';
import orderbanner from '../../assets/order-banner.svg';
import axios from 'axios';
import '../../styles/Order.css'

const STATUS_STEPS = ["Placed", "Confirmed", "Shipped", "Delivered"];
const TOOLTIPS = [
  "Order placed successfully",
  "Order confirmed by seller",
  "Order shipped – no further changes allowed",
  "Order delivered – you can now return if needed"
];

function Order() {
  const { user, token } = useAuth();
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
    updatePaymentMethod
  } = useOrder();

  // Local state for modals and forms
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState({ type: null, id: null });
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [editingReturn, setEditingReturn] = useState(false);
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [editAddress, setEditAddress] = useState({});
  const [showEditGift, setShowEditGift] = useState(false);
  const [giftDetails, setGiftDetails] = useState({ message: '', recipientName: '', recipientEmail: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showRefundInfo, setShowRefundInfo] = useState(false);

  // Debug: Log when component mounts and when data changes
  useEffect(() => {
    console.log('🔍 Order Component Mounted');
    fetchOrders();
  }, []);

  // Debug: Log selected order details with special attention to gift details
  useEffect(() => {
    if (selectedOrder) {
      console.log('🔍 Selected Order Debug:', {
        id: selectedOrder._id,
        type: selectedOrder.orderType,
        hasGiftDetails: !!selectedOrder.giftDetails,
        giftDetails: selectedOrder.giftDetails,
        status: selectedOrder.orderStatus,
        cancelReason: selectedOrder.cancelReason,
        returnRequest: selectedOrder.returnRequest,
        paymentMethod: selectedOrder.paymentMethod,
        paymentStatus: selectedOrder.paymentStatus
      });
    }
  }, [selectedOrder]);

  // Helper functions
  const canModify = (status) => {
    const statusLower = status?.toLowerCase();
    return !['shipped', 'delivered', 'cancelled'].includes(statusLower);
  };
  
  const canCancel = (status) => {
    const statusLower = status?.toLowerCase() || '';
    return ['placed', 'confirmed'].includes(statusLower);
  };

  // ✅ FIXED: Return button only shows when order status is 'delivered' AND no return request already exists
  const canReturn = (status, returnRequest) => {
    const statusLower = status?.toLowerCase() || '';
    return statusLower === 'delivered' && !returnRequest;
  };

  const canEditAddress = (status) => {
    const statusLower = status?.toLowerCase() || '';
    return ['placed', 'confirmed'].includes(statusLower);
  };

  const getStatusIndex = (status) => {
    const statusLower = status?.toLowerCase() || '';
    const steps = STATUS_STEPS.map(s => s.toLowerCase());
    return steps.indexOf(statusLower);
  };
  
  const canEditGift = (status, orderType) => {
    const statusLower = status?.toLowerCase();
    return orderType === 'gift' && ['placed', 'confirmed'].includes(statusLower);
  };

  const canChangePayment = (status) => {
    const statusLower = status?.toLowerCase();
    return ['placed', 'confirmed'].includes(statusLower);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const handleCancelClick = (type, id) => {
    console.log('🔍 Cancel clicked:', { type, id });
    setCancelTarget({ type, id });
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    console.log('🔍 Confirm cancel:', cancelTarget);
    if (cancelTarget.type === 'entire') {
      await cancelEntireOrder(cancelTarget.id);
    } else {
      await cancelOrderItem(selectedOrder._id, cancelTarget.id);
    }
    setShowCancelModal(false);
  };

  // Return request functions
  const handleReturnSubmit = async () => {
    if (!returnReason.trim() || returnReason.length < 10) {
      alert('Please provide a detailed reason (min 10 characters)');
      return;
    }
    await returnOrder(selectedOrder._id, returnReason);
    setShowReturnModal(false);
    setReturnReason('');
  };

  const handleEditReturn = () => {
    setReturnReason(selectedOrder.returnRequest?.reason || '');
    setEditingReturn(true);
    setShowReturnModal(true);
  };

  const handleDeleteReturn = async () => {
    if (!window.confirm('Are you sure you want to delete this return request?')) return;
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/orders/${selectedOrder._id}/return`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setToast({
          show: true,
          message: 'Return request deleted successfully',
          type: 'success'
        });
        fetchOrders();
      }
    } catch (err) {
      console.error('Error deleting return:', err);
      setToast({
        show: true,
        message: err.response?.data?.message || 'Failed to delete return',
        type: 'error'
      });
    }
  };

  const handleAddressUpdate = async () => {
    if (!editAddress.name || !editAddress.mobile || !editAddress.pincode || !editAddress.address || !editAddress.city || !editAddress.state) {
      alert('Please fill all required fields');
      return;
    }
    await updateAddress(selectedOrder._id, editAddress);
    setShowEditAddress(false);
  };

  const handleGiftUpdate = async () => {
    console.log('🔍 Updating gift details:', giftDetails);
    await updateGiftDetails(selectedOrder._id, giftDetails);
    setShowEditGift(false);
  };

  // Razorpay functions
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

  const handlePaymentChange = async () => {
    if (!newPaymentMethod) return;
    
    if (newPaymentMethod === 'cod') {
      await updatePaymentMethod(selectedOrder._id, 'cod');
      setShowPaymentModal(false);
      return;
    }

    if (newPaymentMethod === 'online') {
      setProcessingPayment(true);
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) throw new Error('Failed to load Razorpay');

        const amountToPay = selectedOrder.finalAmount;
        
        const razorpayRes = await axios.post(
          'http://localhost:5000/api/orders/create-razorpay-order',
          { amount: amountToPay },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!razorpayRes.data.success) {
          throw new Error('Failed to create payment order');
        }

        const razorpayOrder = razorpayRes.data.order;
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 
                            process.env.REACT_APP_RAZORPAY_KEY_ID || '';

        if (!razorpayKey) throw new Error('Razorpay key not configured');

        const options = {
          key: razorpayKey,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'DAG',
          description: `Payment for Order #${selectedOrder._id.slice(-6)}`,
          order_id: razorpayOrder.id,
          handler: async (response) => {
            try {
              const verifyRes = await axios.post(
                'http://localhost:5000/api/orders/verify-payment-update',
                {
                  orderId: selectedOrder._id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (verifyRes.data.success) {
                setToast({
                  show: true,
                  message: 'Payment successful! Order updated to online payment.',
                  type: 'success'
                });
                fetchOrders();
                setShowPaymentModal(false);
              }
            } catch (err) {
              console.error('Payment verification error:', err);
              setToast({
                show: true,
                message: 'Payment verification failed. Please contact support.',
                type: 'error'
              });
            }
          },
          modal: {
            ondismiss: () => {
              setProcessingPayment(false);
              setShowPaymentModal(false);
              setToast({
                show: true,
                message: 'Payment cancelled. Order remains as COD.',
                type: 'info'
              });
            }
          },
          prefill: {
            name: selectedOrder.address?.name || user?.name,
            email: selectedOrder.address?.email || user?.email,
            contact: selectedOrder.address?.mobile
          },
          theme: { color: '#ed3545' }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        
      } catch (err) {
        console.error('Payment error:', err);
        setToast({
          show: true,
          message: err.message || 'Payment failed. Please try again.',
          type: 'error'
        });
        setProcessingPayment(false);
        setShowPaymentModal(false);
      }
    }
  };

  // Coin calculation
  const calculateCoins = (amount) => {
    return Math.floor(amount / 1000) * 10;
  };

  const estimatedCoins = selectedOrder?.finalAmount ? calculateCoins(selectedOrder.finalAmount) : 0;
  const coinsEarned = selectedOrder?.orderStatus?.toLowerCase() === 'delivered' ? estimatedCoins : 0;
  const coinsMessage = selectedOrder?.orderStatus?.toLowerCase() === 'delivered'
    ? `✨ You earned ${coinsEarned} Dag Coins!`
    : `💰 You'll earn ${estimatedCoins} coins once delivered.`;

  // ✅ Get refund policy message based on payment method
  const getRefundPolicy = (order) => {
    if (!order) return null;
    
    if (order.paymentMethod === 'online' && order.paymentStatus === 'paid') {
      return {
        title: '💳 Online Payment Refund Policy',
        message: 'Refund will be processed to your original payment method within 5-7 business days after return approval.',
        icon: 'bi-credit-card'
      };
    } else if (order.paymentMethod === 'cod') {
      return {
        title: '💵 Cash on Delivery Refund Policy',
        message: 'Refund will be provided via bank transfer within 3-5 business days after return approval. Please provide your bank details.',
        icon: 'bi-cash'
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <i className="bi bi-box empty-icon"></i>
        <h3 className="empty-title">No orders yet</h3>
        <p>Looks like you haven't placed any orders.</p>
        <button className="btn-start-shopping" onClick={() => navigate('/dress')}>
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="order-container">
    <img src={orderbanner} alt="Order Banner" className='img-fluid' style={{borderRadius:'0px'}} />

      {/* Order selector */}
      <div className="order-selector">
        {orders.map(order => (
          <button
            key={order._id}
            onClick={() => setSelectedOrder(order)}
            className={`order-tab ${selectedOrder?._id === order._id ? 'active' : 'inactive'}`}
          >
            Order #{order._id.slice(-6)} • {formatDate(order.createdAt)}
          </button>
        ))}
      </div>

      {selectedOrder && (
        <div className="order-card">
          {/* Header */}
          <div className="order-header">
            <div>
              <p><strong>Order ID:</strong> {selectedOrder._id}</p>
              <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
              <p>
                <strong>Payment:</strong> {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}
                {canChangePayment(selectedOrder.orderStatus) && (
                  <button 
                    className="btn-change-payment ms-2"
                    onClick={() => {
                      setNewPaymentMethod(selectedOrder.paymentMethod);
                      setShowPaymentModal(true);
                    }}
                  >
                    <i className="bi bi-pencil"></i> Change
                  </button>
                )}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`order-status text-capitalize ${selectedOrder.orderStatus?.toLowerCase()}`}>
                  {selectedOrder.orderStatus}
                </span>
              </p>
              <p><strong>Coins:</strong> {coinsMessage}</p>
              
              {/* Show cancellation reason if order is cancelled */}
              {selectedOrder.orderStatus?.toLowerCase() === 'cancelled' && selectedOrder.cancelReason && (
                <div className="cancellation-reason">
                  <p><strong>Cancellation Reason:</strong> {selectedOrder.cancelReason}</p>
                </div>
              )}
            </div>
            <div className="total-amount">₹{selectedOrder.finalAmount?.toFixed(2)}</div>
          </div>

          {/* Items table */}
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <img src={item.image || '/placeholder.png'} alt={item.name} className="product-image" />
                      <div className="product-type-badge">{item.productType === 'dress' ? 'Dress' : 'Jewel'}</div>
                    </td>
                    <td>
                      <div className="product-name">{item.name}</div>
                      <small>{item.category}</small> <br />
                      {item.discount > 0 && <small className="text-muted">-{item.discount}%</small>}
                    </td>
                    <td><span className="size-badge">{item.selectedSize?.size || 'N/A'}</span></td>
                    <td>{item.quantity}</td>
                    <td>₹{item.finalPrice}</td>
                    <td className="item-total">₹{item.total?.toFixed(2)}</td>
                    <td>
                      {canCancel(selectedOrder.orderStatus) && (
                        <button
                          className="btn-cancel btn-sm btn"
                          onClick={() => handleCancelClick('item', item._id)}
                        >
                         
                        <i className='bi bi-x-lg'> </i> 
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gift details - Always show if gift order */}
          {selectedOrder.orderType === 'gift' && (
            <div className="gift-section">
              <div className="gift-header">
                <h5><i className="bi bi-gift-fill"></i> Gift Details</h5>
                {canEditGift(selectedOrder.orderStatus, selectedOrder.orderType) && (
                  <button
                    className="btn-edit-gift"
                    onClick={() => {
                      setGiftDetails(selectedOrder.giftDetails || { message: '', recipientName: '', recipientEmail: '' });
                      setShowEditGift(true);
                    }}
                  >
                    <i className="bi bi-pencil"></i> Edit
                  </button>
                )}
              </div>
              <div className="gift-content">
                <p><strong>Message:</strong> {selectedOrder.giftDetails?.message || 'No message'}</p>
                <p><strong>Recipient:</strong> {selectedOrder.giftDetails?.recipientName} ({selectedOrder.giftDetails?.recipientEmail})</p>
              </div>
            </div>
          )}

          {/* Return Request Section */}
          {selectedOrder.returnRequest.status === 'delivered' && (
            <div className="return-request-section">
              <div className="return-header">
                <h5><i className="bi bi-arrow-return-left"></i> Return Request</h5>
                {selectedOrder.returnRequest.status === 'delivered' && (
                  <div className="return-actions">
                    <button className="btn-edit-return" onClick={handleEditReturn}>
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                    <button className="btn-delete-return" onClick={handleDeleteReturn}>
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="return-content">
                <p><strong>Reason:</strong> {selectedOrder.returnRequest.reason}</p>
                <p><strong>Status:</strong> 
                  <span className={`return-status ${selectedOrder.returnRequest.status}`}>
                    {selectedOrder.returnRequest.status}
                  </span>
                </p>
                <p><strong>Requested on:</strong> {formatDate(selectedOrder.returnRequest.requestedAt)}</p>
                {selectedOrder.returnRequest.processedAt && (
                  <p><strong>Processed on:</strong> {formatDate(selectedOrder.returnRequest.processedAt)}</p>
                )}
              </div>

              {/* ✅ Show refund policy for approved returns */}
              {selectedOrder.returnRequest.status === 'approved' && (
                <div className="refund-policy-info">
                  {getRefundPolicy(selectedOrder) && (
                    <>
                      <p><strong>{getRefundPolicy(selectedOrder).title}</strong></p>
                      <p>{getRefundPolicy(selectedOrder).message}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Address */}
          <div className="address-section">
            <div className="address-header">
              <h5>Delivery Address</h5>
              {canEditAddress(selectedOrder.orderStatus) && (
                <button
                  className="btn-edit-address"
                  onClick={() => {
                    setEditAddress(selectedOrder.address);
                    setShowEditAddress(true);
                  }}
                >
                  <i className="bi bi-pencil"></i> Edit
                </button>
              )}
            </div>
            <div className="address-details">
              <p><strong>{selectedOrder.address?.name}</strong></p>
              <p>{selectedOrder.address?.address}</p>
              {selectedOrder.address?.landmark && <p>{selectedOrder.address.landmark}</p>}
              <p>{selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}</p>
              <p>📞 {selectedOrder.address?.mobile} | ✉️ {selectedOrder.address?.email}</p>
            </div>
            {!canEditAddress(selectedOrder.orderStatus) && (
              <p className="text-muted small"><i className="bi bi-info-circle"></i> Address cannot be changed after shipping.</p>
            )}
          </div>

          {/* Status tracker */}
          <div className="status-tracker">
            <h5>Order Status</h5>
            {selectedOrder.orderStatus?.toLowerCase() === 'cancelled' ? (
              <div className="status-cancelled">
                <i className="bi bi-exclamation-triangle-fill"></i> This order has been cancelled.
              </div>
            ) : (
              <div className="status-steps">
                {STATUS_STEPS.map((step, i) => {
                  const isActive = getStatusIndex(selectedOrder.orderStatus) >= i;
                  const isCurrent = selectedOrder.orderStatus?.toLowerCase() === step.toLowerCase();
                  return (
                    <div key={step} className="status-step">
                      <div
                        className={`step-circle ${isActive ? 'active' : 'inactive'} ${isCurrent ? 'current' : ''}`}
                        title={TOOLTIPS[i]}
                      >
                        {i + 1}
                      </div>
                      <p className={`step-label ${isActive ? 'active' : 'inactive'}`}>{step}</p>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`step-connector ${isActive ? 'active' : 'inactive'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="main-actions">
            {canCancel(selectedOrder.orderStatus) && (
              <button
                className="btn-cancel-order"
                onClick={() => handleCancelClick('entire', selectedOrder._id)}
              >
                <i className="bi bi-x-circle text-white"></i> Cancel Entire Order
              </button>
            )}
            
            {/* ✅ Return button - Only shows when order is delivered and no return request exists */}
            {canReturn(selectedOrder.orderStatus, selectedOrder.returnRequest) && (
              <button
                className="btn-return-order"
                onClick={() => setShowReturnModal(true)}
              >
                <i className="bi bi-arrow-return-left"></i> Return Order
              </button>
            )}
            
            {selectedOrder.orderStatus?.toLowerCase() === 'shipped' && (
              <p className="text-warning small mt-2">
                <i className="bi bi-exclamation-triangle"></i> Order has been shipped - no further changes allowed.
              </p>
            )}
            <button className="btn-shop text-dark " onClick={() => navigate('/dress')}>
              <i className="bi bi-arrow-left text-dark"></i> Continue Shopping
            </button>
          </div>

          {/* Return policy info - Only show for delivered orders without return request */}
          {selectedOrder.orderStatus?.toLowerCase() === 'delivered' && !selectedOrder.returnRequest && (
            <div className="return-policy">
              <small>
                <i className="bi bi-info-circle"></i> Returns accepted within 7 days of delivery.
                Items must be unused and in original packaging.
              </small>
            </div>
          )}

          {/* ✅ Refund policy info for delivered orders (as tooltip) */}
          {selectedOrder.orderStatus?.toLowerCase() === 'delivered' && !selectedOrder.returnRequest && (
            <div className="refund-policy-tooltip" onClick={() => setShowRefundInfo(!showRefundInfo)}>
              <small className="text-info" style={{ cursor: 'pointer' }}>
                <i className="bi bi-question-circle"></i> View refund policy
              </small>
              {showRefundInfo && getRefundPolicy(selectedOrder) && (
                <div className="refund-policy-popup">
                  <p><strong>{getRefundPolicy(selectedOrder).title}</strong></p>
                  <p>{getRefundPolicy(selectedOrder).message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Cancel {cancelTarget.type === 'entire' ? 'Order' : 'Item'}</h4>
            <p>Are you sure? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-modal-secondary" onClick={() => setShowCancelModal(false)}>No</button>
              <button className="btn-modal-danger" onClick={confirmCancel}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="modal-overlay bg-white  text-dark">
          <div className="modal-content">
            <h4>{editingReturn ? 'Edit' : 'Submit'} Return Request</h4>
            <p>Please tell us why you want to return this order (min 10 characters).</p>
            <textarea
              className="modal-textarea"
              rows="4"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Reason for return..."
            />
            
            {/* ✅ Show refund policy based on payment method */}
            {selectedOrder && (
              <div className="refund-policy-notice">
                {getRefundPolicy(selectedOrder) && (
                  <>
                    <p><strong>{getRefundPolicy(selectedOrder).title}</strong></p>
                    <p>{getRefundPolicy(selectedOrder).message}</p>
                  </>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-modal-secondary" onClick={() => {
                setShowReturnModal(false);
                setReturnReason('');
                setEditingReturn(false);
              }}>
                Cancel
              </button>
              <button className="btn-modal-primary" onClick={handleReturnSubmit}>
                {editingReturn ? 'Update' : 'Submit'}
              </button>
            </div>
            {returnReason.length > 0 && returnReason.length < 10 && (
              <p className="text-danger small">Please enter at least 10 characters</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {showEditAddress && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Edit Address</h4>
            <div className="address-form-grid">
              <input type="text" placeholder="Full Name *" value={editAddress.name || ''} onChange={(e) => setEditAddress({...editAddress, name: e.target.value})} />
              <input type="email" placeholder="Email *" value={editAddress.email || ''} onChange={(e) => setEditAddress({...editAddress, email: e.target.value})} />
              <input type="text" placeholder="Mobile *" value={editAddress.mobile || ''} onChange={(e) => setEditAddress({...editAddress, mobile: e.target.value})} />
              <input type="text" placeholder="Pincode *" value={editAddress.pincode || ''} onChange={(e) => setEditAddress({...editAddress, pincode: e.target.value})} />
              <textarea placeholder="Full Address *" rows="3" value={editAddress.address || ''} onChange={(e) => setEditAddress({...editAddress, address: e.target.value})} />
              <input type="text" placeholder="Landmark" value={editAddress.landmark || ''} onChange={(e) => setEditAddress({...editAddress, landmark: e.target.value})} />
              <div className="address-row">
                <input type="text" placeholder="City *" value={editAddress.city || ''} onChange={(e) => setEditAddress({...editAddress, city: e.target.value})} />
                <input type="text" placeholder="State *" value={editAddress.state || ''} onChange={(e) => setEditAddress({...editAddress, state: e.target.value})} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-modal-secondary" onClick={() => setShowEditAddress(false)}>Cancel</button>
              <button className="btn-modal-primary" onClick={handleAddressUpdate}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gift Modal */}
      {showEditGift && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Edit Gift Details</h4>
            <div className="gift-form">
              <textarea
                placeholder="Gift message"
                rows="3"
                value={giftDetails.message || ''}
                onChange={(e) => setGiftDetails({...giftDetails, message: e.target.value})}
              />
              <input
                type="text"
                placeholder="Recipient name"
                value={giftDetails.recipientName || ''}
                onChange={(e) => setGiftDetails({...giftDetails, recipientName: e.target.value})}
              />
              <input
                type="email"
                placeholder="Recipient email"
                value={giftDetails.recipientEmail || ''}
                onChange={(e) => setGiftDetails({...giftDetails, recipientEmail: e.target.value})}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-modal-secondary" onClick={() => setShowEditGift(false)}>Cancel</button>
              <button className="btn-modal-primary" onClick={handleGiftUpdate}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Change Modal */}
      {showPaymentModal && (
        <div className="modal-overlay bg-white">
          <div className="modal-content">
            <h4>Change Payment Method</h4>
            <p className="text-muted small mb-3">
              Current payment method: <strong>{selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</strong>
            </p>
            
            <div className="payment-options">
              <label className={`payment-option ${newPaymentMethod === 'cod' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={newPaymentMethod === 'cod'}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  disabled={processingPayment}
                />
                <span>Cash on Delivery</span>
                <small className="text-muted d-block">Pay when you receive</small>
              </label>
              
              <label className={`payment-option ${newPaymentMethod === 'online' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={newPaymentMethod === 'online'}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  disabled={processingPayment}
                />
                <span>Online Payment</span>
                <small className="text-muted d-block">Pay now via Razorpay</small>
              </label>
            </div>

            {newPaymentMethod === 'online' && (
              <div className="alert alert-info small mt-2">
                <i className="bi bi-info-circle"></i>
                You'll be redirected to Razorpay to complete payment. 
                Amount to pay: <strong>₹{selectedOrder.finalAmount}</strong>
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="btn-modal-secondary" 
                onClick={() => {
                  setShowPaymentModal(false);
                  setNewPaymentMethod('');
                }}
                disabled={processingPayment}
              >
                Cancel
              </button>
              <button 
                className="btn-modal-primary" 
                onClick={handlePaymentChange}
                disabled={!newPaymentMethod || processingPayment}
              >
                {processingPayment ? 'Processing...' : 'Update Payment Method'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast?.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => setToast({ show: false })}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Order;