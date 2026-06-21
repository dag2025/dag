import React from 'react';
import BaseOrderCard from './BaseOrderCard';

const JewelleryOrder = ({ order, onCancelItem, onCancelEntire, onReturn, onEditAddress, onChangePayment }) => {
  const canCancel = ['placed', 'confirmed'].includes(order.orderStatus?.toLowerCase());
  const canReturn = order.orderStatus?.toLowerCase() === 'delivered';
  const canEditAddress = ['placed', 'confirmed'].includes(order.orderStatus?.toLowerCase());
  const canChangePayment = ['placed', 'confirmed'].includes(order.orderStatus?.toLowerCase());

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
    materialInfo: {
      marginTop: '20px',
      padding: '16px',
      background: '#fff3cd',
      borderRadius: '8px',
      borderLeft: '4px solid #ffc107'
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
                    💍 Jewellery
                  </div>
                </td>
                <td style={styles.tableCell}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {item.category} {item.occasion && `• ${item.occasion}`}
                  </div>
                  {item.discount > 0 && (
                    <small style={{ color: '#28a745', fontWeight: 600 }}>
                      -{item.discount}% off
                    </small>
                  )}
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

      {/* Jewellery-specific details */}
      {order.items?.[0] && (
        <div style={styles.materialInfo}>
          <strong>Jewellery Details</strong>
          <div style={{ marginTop: '10px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {order.items[0].material && (
              <div>
                <span style={{ color: '#666', fontSize: '13px' }}>Material:</span>
                <span style={{ marginLeft: '5px', fontWeight: 600 }}>{order.items[0].material}</span>
              </div>
            )}
            {order.items[0].color && (
              <div>
                <span style={{ color: '#666', fontSize: '13px' }}>Color:</span>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: order.items[0].color.toLowerCase(),
                  marginLeft: '5px',
                  border: '1px solid #ddd',
                  verticalAlign: 'middle'
                }}></span>
                <span style={{ marginLeft: '5px' }}>{order.items[0].color}</span>
              </div>
            )}
            {order.items[0].occasion && (
              <div>
                <span style={{ color: '#666', fontSize: '13px' }}>Occasion:</span>
                <span style={{ marginLeft: '5px', fontWeight: 600 }}>{order.items[0].occasion}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </BaseOrderCard>
  );
};

export default JewelleryOrder;