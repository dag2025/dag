import { useState } from 'react';
import { useCheckout } from '../../context/CheckoutContext';

const ComboCheckout = ({ comboItems, setComboItems }) => {
  const { appliedCoins } = useCheckout();

  const calculateSubtotal = () => {
    return comboItems.reduce((sum, item) => 
      sum + (item.finalPrice || item.price) * (item.quantity || 1), 0);
  };

  const getDiscount = () => calculateSubtotal() * 0.2;
  const getTotal = () => calculateSubtotal() - getDiscount();
  const finalAmount = getTotal() - (appliedCoins / 10);

  // Generate available sizes based on product type
  const getAvailableSizes = (item) => {
    if (item.productType === 'dress') {
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    } else if (item.productType === 'jewellery') {
      return ['5', '6', '7', '8', '9', '10', '11', '12'];
    }
    return [];
  };

  const handleQuantityChange = (index, delta) => {
    const item = comboItems[index];
    const currentQty = item.quantity || 1;
    const maxStock = item.selectedSize?.stock || Infinity;
    const newQty = currentQty + delta;

    if (newQty < 1) return;
    if (delta > 0 && newQty > maxStock) {
      alert(`Only ${maxStock} items available`);
      return;
    }

    const newItems = [...comboItems];
    newItems[index].quantity = newQty;
    setComboItems(newItems);
  };

  const handleSizeChange = (index, newSize) => {
    const item = comboItems[index];
    
    // Determine stock based on size (default to 10)
    let stock = 10;
    if (item.originalSizes) {
      const sizeData = item.originalSizes.find(s => s.size === newSize);
      if (sizeData) stock = sizeData.stock;
    }

    const newItems = [...comboItems];
    newItems[index].selectedSize = { 
      size: newSize, 
      stock: stock 
    };
    setComboItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setComboItems(comboItems.filter((_, i) => i !== index));
  };

  const getStockDisplay = (item) => {
    const stock = item.selectedSize?.stock;
    if (stock > 10) return { text: `${stock} left`, color: '#28a745', bg: '#d4edda' };
    if (stock > 5) return { text: `${stock} left`, color: '#ffc107', bg: '#fff3cd' };
    if (stock > 0) return { text: `Only ${stock} left!`, color: '#dc3545', bg: '#f8d7da' };
    return { text: 'Out of stock', color: '#6c757d', bg: '#e0e0e0' };
  };

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '16px', 
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0'
    }}>
      <h3 style={{ 
        marginBottom: '16px', 
        color: '#333',
        fontSize: '1.3rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ color: '#ed3545' }}>✦</span> Combo Checkout
      </h3>
      
      <p style={{ 
        color: '#666', 
        marginBottom: '20px',
        fontSize: '0.9rem',
        fontWeight: '500'
      }}>
        Products in your combo
      </p>

      {(!comboItems || comboItems.length === 0) ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#999',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          No items in combo
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            minWidth: '900px',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>#</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Image</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Price</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Size</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Stock</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Qty</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {comboItems.map((item, index) => {
                const stockInfo = getStockDisplay(item);
                const availableSizes = getAvailableSizes(item);

                return (
                  <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px', color: '#666' }}>{index + 1}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <img 
                          src={item.images?.cover || item.image || 'https://via.placeholder.com/50'} 
                          alt={item.name}
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #eee',
                            marginBottom: '4px'
                          }}
                        />
                        <span style={{ 
                          fontSize: '10px', 
                          color: '#999',
                          background: '#f5f5f5',
                          padding: '2px 6px',
                          borderRadius: '12px'
                        }}>
                          {item.productType || (item.dress ? 'Dress' : 'Jewellery')}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600', color: '#333' }}>{item.name}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '700', color: '#ed3545' }}>₹{item.finalPrice || item.price}</div>
                      {item.discount > 0 && (
                        <div style={{ fontSize: '11px', color: '#999', textDecoration: 'line-through' }}>
                          ₹{item.price}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                    
                      {item.selectedSize && (
                        <div style={{ fontSize: '15px', color: '#000000', marginTop: '4px' }}>
                           {item.selectedSize.size}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: stockInfo.bg,
                        color: stockInfo.color
                      }}>
                        {stockInfo.text}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => handleQuantityChange(index, -1)}
                          disabled={item.quantity <= 1}
                          style={{
                            width: '28px',
                            height: '28px',
                            border: '2px solid #e0e0e0',
                            background: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: item.quantity <= 1 ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.style.background = 'white'}
                        >-</button>
                        <span style={{ 
                          minWidth: '30px', 
                          textAlign: 'center', 
                          fontWeight: '600',
                          color: '#333'
                        }}>
                          {item.quantity || 1}
                        </span>
                        <button 
                          onClick={() => handleQuantityChange(index, 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            border: '2px solid #e0e0e0',
                            background: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.style.background = 'white'}
                        >+</button>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#ed3545' }}>
                      ₹{((item.finalPrice || item.price) * (item.quantity || 1)).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => handleRemoveItem(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          fontSize: '18px',
                          cursor: 'pointer',
                          padding: '5px',
                          borderRadius: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#fee'}
                        onMouseLeave={(e) => e.target.style.background = 'none'}
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
      )}

      <div style={{ 
        marginTop: '24px', 
        padding: '20px', 
        background: '#f8f9fa',
        borderRadius: '12px',
        textAlign: 'right'
      }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#666' }}>Total Items: </span>
          <strong style={{ color: '#333' }}>{comboItems.length}</strong>
        </div>
        <div style={{ marginBottom: '8px', color: '#28a745' }}>
          <span>Fixed Discount: </span>
          <strong>-₹{getDiscount().toFixed(2)} (20%)</strong>
        </div>
        <div>
          <span style={{ fontSize: '18px', color: '#666' }}>Total: </span>
          <strong style={{ fontSize: '24px', color: '#ed3545' }}>₹{finalAmount.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
};

export default ComboCheckout;