import React, { useState } from 'react';
import BaseOrderCard from './BaseOrderCard';

const GiftOrder = ({ order, onUpdateGift, onCancelItem, onCancelEntire, onReturn, onEditAddress, onChangePayment }) => {
  const [showEditGift, setShowEditGift] = useState(false);
  const [giftDetails, setGiftDetails] = useState({ 
    message: order.giftDetails?.message || '', 
    recipientName: order.giftDetails?.recipientName || '', 
    recipientEmail: order.giftDetails?.recipientEmail || '' 
  });

  const canEditGift = ['placed', 'confirmed'].includes(order.orderStatus?.toLowerCase());
  const canCancel = ['placed', 'confirmed'].includes(order.orderStatus?.toLowerCase());
  const canReturn = order.orderStatus?.toLowerCase() === 'delivered';
  const canEditAddress = ['placed', 'confirmed'].includes(order.orderStatus?.toLowerCase());
  const canChangePayment = ['placed', 'confirmed'].includes(order.orderStatus?.toLowerCase());

  const handleSaveGift = () => {
    onUpdateGift(order._id, giftDetails);
    setShowEditGift(false);
  };

  const styles = {
    itemsTable: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '800px',
      marginBottom: '20px'
    },
    tableHeader: {
      background: '#f8f9fa',
      padding: '12px',
      textAlign: 'left',
      borderBottom: '2px solid #ed3545',
      fontWeight: 600,
      color: '#333'
    },
    tableCell: {
      padding: '12px',
      borderBottom: '1px solid #e0e0e0',
      verticalAlign: 'middle'
    },
    productImage: {
      width: '50px',
      height: '50px',
      objectFit: 'cover',
      borderRadius: '8px'
    },
    sizeBadge: {
      background: '#f0f0f0',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px'
    },
    itemTotal: {
      fontWeight: 700,
      color: '#ed3545'
    },
    btnCancel: {
      background: 'none',
      border: '1px solid #dc3545',
      color: '#dc3545',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer'
    },
    giftSection: {
      margin: '20px 0',
      padding: '16px',
      background: '#f8f9fa',
      borderRadius: '8px',
      borderLeft: '4px solid #ed3545'
    },
    giftHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px'
    },
    giftContent: {
      background: 'white',
      padding: '12px',
      borderRadius: '6px'
    },
    btnEditGift: {
      background: 'none',
      border: '1px solid #ed3545',
      color: '#ed3545',
      padding: '4px 12px',
      borderRadius: '20px',
      cursor: 'pointer'
    },
    giftForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    giftInput: {
      padding: '10px',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '14px'
    },
    giftTextarea: {
      padding: '10px',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical'
    },
    modalActions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
      marginTop: '15px'
    },
    btnSave: {
      padding: '8px 16px',
      background: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    btnCancel: {
      padding: '8px 16px',
      background: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  };

  return (
    <BaseOrderCard
      order={order}
      onCancelEntire={() => onCancelEntire(order._id)}
      onReturn={() => onReturn(order._id)}
      onEditAddress={onEditAddress}
      onChangePayment={onChangePayment}
      canEditAddress={canEditAddress}
      canChangePayment={canChangePayment}
      canCancel={canCancel}
      canReturn={canReturn}
    >
      {/* Items Table */}
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table style={styles.itemsTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>#</th>
              <th style={styles.tableHeader}>Image</th>
              <th style={styles.tableHeader}>Product</th>
              <th style={styles.tableHeader}>Size</th>
              <th style={styles.tableHeader}>Qty</th>
              <th style={styles.tableHeader}>Price</th>
              <th style={styles.tableHeader}>Total</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx}>
                <td style={styles.tableCell}>{idx + 1}</td>
                <td style={styles.tableCell}>
                  <img src={item.image || '/placeholder.png'} alt={item.name} style={styles.productImage} />
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                    {item.productType === 'dress' ? '👗' : '💍'}
                  </div>
                </td>
                <td style={styles.tableCell}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  {item.discount > 0 && <small style={{ color: '#666' }}>-{item.discount}%</small>}
                </td>
                <td style={styles.tableCell}>
                  <span style={styles.sizeBadge}>{item.selectedSize?.size || 'N/A'}</span>
                </td>
                <td style={styles.tableCell}>{item.quantity}</td>
                <td style={styles.tableCell}>₹{item.finalPrice}</td>
                <td style={{...styles.tableCell, ...styles.itemTotal}}>₹{item.total?.toFixed(2)}</td>
                <td style={styles.tableCell}>
                  {canCancel && (
                    <button style={styles.btnCancel} onClick={() => onCancelItem(order._id, item._id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gift Details Section */}
      <div style={styles.giftSection}>
        <div style={styles.giftHeader}>
          <h5 style={{ margin: 0, color: '#ed3545' }}>
            <i className="bi bi-gift-fill"></i> Gift Details
          </h5>
          {canEditGift && !showEditGift && (
            <button style={styles.btnEditGift} onClick={() => setShowEditGift(true)}>
              <i className="bi bi-pencil"></i> Edit
            </button>
          )}
        </div>

        {!showEditGift ? (
          <div style={styles.giftContent}>
            <p><strong>Message:</strong> {order.giftDetails?.message || 'No message'}</p>
            <p><strong>Recipient:</strong> {order.giftDetails?.recipientName} ({order.giftDetails?.recipientEmail})</p>
          </div>
        ) : (
          <div style={styles.giftForm}>
            <textarea
              style={styles.giftTextarea}
              value={giftDetails.message}
              onChange={(e) => setGiftDetails({...giftDetails, message: e.target.value})}
              placeholder="Gift message"
            />
            <input
              style={styles.giftInput}
              type="text"
              value={giftDetails.recipientName}
              onChange={(e) => setGiftDetails({...giftDetails, recipientName: e.target.value})}
              placeholder="Recipient name"
            />
            <input
              style={styles.giftInput}
              type="email"
              value={giftDetails.recipientEmail}
              onChange={(e) => setGiftDetails({...giftDetails, recipientEmail: e.target.value})}
              placeholder="Recipient email"
            />
            <div style={styles.modalActions}>
              <button style={styles.btnCancel} onClick={() => setShowEditGift(false)}>Cancel</button>
              <button style={styles.btnSave} onClick={handleSaveGift}>Save</button>
            </div>
          </div>
        )}
      </div>
    </BaseOrderCard>
  );
};

export default GiftOrder;