import React from 'react';

const BaseOrderCard = ({ 
  order, 
  children,
  onCancelItem,
  onCancelEntire,
  onReturn,
  onEditAddress,
  onEditGift,
  onChangePayment,
  canEditAddress,
  canEditGift,
  canChangePayment,
  canCancel,
  canReturn
}) => {
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const calculateCoins = (amount) => Math.floor(amount / 100) * 10;
  const estimatedCoins = order?.finalAmount ? calculateCoins(order.finalAmount) : 0;
  const coinsEarned = order?.orderStatus?.toLowerCase() === 'delivered' ? estimatedCoins : 0;
  const coinsMessage = order?.orderStatus?.toLowerCase() === 'delivered'
    ? `✨ You earned ${coinsEarned} Dag Coins!`
    : `💰 You'll earn ${estimatedCoins} coins once delivered.`;

  const styles = {
    orderCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      marginBottom: '20px',
      border: '1px solid #f0f0f0'
    },
    orderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '15px'
    },
    totalAmount: {
      fontSize: '1.3rem',
      color: '#ed3545',
      fontWeight: '700'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      marginLeft: '8px'
    },
    orderStatus: {
      placed: { background: '#cfe2ff', color: '#084298' },
      confirmed: { background: '#fff3cd', color: '#856404' },
      shipped: { background: '#d1e7dd', color: '#0f5132' },
      delivered: { background: '#d4edda', color: '#155724' },
      cancelled: { background: '#f8d7da', color: '#721c24' }
    },
    cancellationReason: {
      marginTop: '10px',
      padding: '8px 12px',
      background: '#f8d7da',
      borderRadius: '6px',
      borderLeft: '3px solid #dc3545'
    },
    mainActions: {
      display: 'flex',
      gap: '15px',
      marginTop: '20px',
      flexWrap: 'wrap'
    },
    btnCancel: {
      padding: '10px 20px',
      background: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    btnReturn: {
      padding: '10px 20px',
      background: '#ffc107',
      color: '#333',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    btnShop: {
      padding: '10px 20px',
      background: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    btnChangePayment: {
      background: 'none',
      border: '1px solid #ed3545',
      color: '#ed3545',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      cursor: 'pointer',
      marginLeft: '8px'
    }
  };

  const getStatusStyle = () => {
    const status = order.orderStatus?.toLowerCase();
    return styles.orderStatus[status] || styles.orderStatus.placed;
  };

  return (
    <div style={styles.orderCard}>
      {/* Header */}
      <div style={styles.orderHeader}>
        <div>
          <p><strong>Order ID:</strong> {order._id}</p>
          <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
          <p>
            <strong>Payment:</strong> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}
            {canChangePayment && (
              <button 
                style={styles.btnChangePayment}
                onClick={() => onChangePayment(order.paymentMethod)}
              >
                <i className="bi bi-pencil"></i> Change
              </button>
            )}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            <span style={{...styles.statusBadge, ...getStatusStyle()}}>
              {order.orderStatus}
            </span>
          </p>
          <p><strong>Coins:</strong> {coinsMessage}</p>
          
          {order.orderStatus?.toLowerCase() === 'cancelled' && order.cancelReason && (
            <div style={styles.cancellationReason}>
              <p><strong>Cancellation Reason:</strong> {order.cancelReason}</p>
            </div>
          )}
        </div>
        <div style={styles.totalAmount}>₹{order.finalAmount?.toFixed(2)}</div>
      </div>

      {/* Child-specific content */}
      {children}

      {/* Address Section */}
      <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h5 style={{ margin: 0, color: '#333' }}>Delivery Address</h5>
          {canEditAddress && (
            <button
              style={{
                background: 'none',
                border: '1px solid #ed3545',
                color: '#ed3545',
                padding: '5px 15px',
                borderRadius: '20px',
                cursor: 'pointer'
              }}
              onClick={() => onEditAddress(order.address)}
            >
              <i className="bi bi-pencil"></i> Edit
            </button>
          )}
        </div>
        <div>
          <p><strong>{order.address?.name}</strong></p>
          <p>{order.address?.address}</p>
          {order.address?.landmark && <p>{order.address.landmark}</p>}
          <p>{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
          <p>📞 {order.address?.mobile} | ✉️ {order.address?.email}</p>
        </div>
        {!canEditAddress && (
          <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>
            <i className="bi bi-info-circle"></i> Address cannot be changed after shipping.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div style={styles.mainActions}>
        {canCancel && (
          <button style={styles.btnCancel} onClick={onCancelEntire}>
            <i className="bi bi-x-circle"></i> Cancel Entire Order
          </button>
        )}
        {canReturn && (
          <button style={styles.btnReturn} onClick={onReturn}>
            <i className="bi bi-arrow-return-left"></i> Return Order
          </button>
        )}
        <button style={styles.btnShop} onClick={() => window.location.href = '/dress'}>
          <i className="bi bi-bag"></i> Continue Shopping
        </button>
      </div>

      {order.orderStatus?.toLowerCase() === 'delivered' && !order.returnRequest && (
        <div style={{ marginTop: '16px', padding: '8px', background: '#e7f3ff', borderRadius: '6px', color: '#004085', fontSize: '13px' }}>
          <i className="bi bi-info-circle"></i> Returns accepted within 7 days of delivery.
          Items must be unused and in original packaging.
        </div>
      )}
    </div>
  );
};

export default BaseOrderCard;