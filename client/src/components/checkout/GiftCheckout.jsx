import React, { useState } from 'react';
import { useCheckout } from '../../context/CheckoutContext';

const GiftCheckout = ({ giftItems, setGiftItems, giftDetails, setGiftDetails }) => {
  const { appliedCoins } = useCheckout();
  const [editingGift, setEditingGift] = useState(false);
  const [originalGift, setOriginalGift] = useState({ message: '', recipientName: '', recipientEmail: '' });

  const calculateSubtotal = () => {
    return giftItems.reduce((sum, item) => 
      sum + (item.finalPrice || item.price) * (item.quantity || 1), 0);
  };

  const getDiscount = () => calculateSubtotal() * 0.1;
  const getTotal = () => calculateSubtotal() - getDiscount();
  const finalAmount = getTotal() - (appliedCoins / 10);

  const handleQuantityChange = (index, delta) => {
    const item = giftItems[index];
    const currentQty = item.quantity || 1;
    const maxStock = item.selectedSize?.stock || Infinity;
    const newQty = currentQty + delta;

    if (newQty < 1) return;
    if (delta > 0 && newQty > maxStock) {
      alert(`Only ${maxStock} items available`);
      return;
    }

    const newItems = [...giftItems];
    newItems[index].quantity = newQty;
    setGiftItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setGiftItems(giftItems.filter((_, i) => i !== index));
  };

  const handleEditGift = () => {
    setOriginalGift({ ...giftDetails });
    setEditingGift(true);
  };

  const handleSaveGift = () => {
    setEditingGift(false);
  };

  const handleCancelGift = () => {
    setGiftDetails(originalGift);
    setEditingGift(false);
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
        <span style={{ color: '#ed3545' }}></span> Gift Checkout
      </h3>
      
      <p style={{ 
        color: '#666', 
        marginBottom: '20px',
        fontSize: '0.9rem',
        fontWeight: '500'
      }}>
        Products in your gift
      </p>

      {(!giftItems || giftItems.length === 0) ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#999',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          No items in gift
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
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Selected Size</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Stock</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Qty</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ed3545' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {giftItems.map((item, index) => {
                const stockInfo = getStockDisplay(item);

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
                      {item.selectedSize ? (
                        <div>
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            background: '#f0f0f0',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#333'
                          }}>
                            {item.selectedSize.size}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>No size selected</span>
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

      {/* Gift Details Section */}
      <div style={{ 
        marginTop: '24px', 
        padding: '20px', 
        background: '#f8f9fa',
        borderRadius: '12px',
        border: '1px dashed #ed3545'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h4 style={{ margin: 0, color: '#ed3545', fontSize: '1.1rem' }}>
            <i className="bi bi-gift-fill" style={{ marginRight: '8px' }}></i>
            Gift Details
          </h4>
          {!editingGift && (
            <button 
              onClick={handleEditGift}
              style={{
                background: 'none',
                border: '2px solid #ed3545',
                color: '#ed3545',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ed3545';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = '#ed3545';
              }}
            >
              <i className="bi bi-pencil"></i> Edit Gift
            </button>
          )}
        </div>

        {!editingGift ? (
          <div style={{ 
            background: 'white', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong style={{ color: '#333', minWidth: '80px', display: 'inline-block' }}>Message:</strong> 
              <span style={{ color: '#666', marginLeft: '8px' }}>{giftDetails?.message || 'No message'}</span>
            </p>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong style={{ color: '#333', minWidth: '80px', display: 'inline-block' }}>Recipient:</strong> 
              <span style={{ color: '#666', marginLeft: '8px' }}>
                {giftDetails?.recipientName || 'Not specified'}
                {giftDetails?.recipientEmail && ` (${giftDetails.recipientEmail})`}
              </span>
            </p>
          </div>
        ) : (
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#333'
              }}>
                Gift Message
              </label>
              <textarea
                value={giftDetails?.message || ''}
                onChange={(e) => setGiftDetails({...giftDetails, message: e.target.value})}
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Write your gift message here..."
              />
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '13px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={giftDetails?.recipientName || ''}
                  onChange={(e) => setGiftDetails({...giftDetails, recipientName: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter recipient's name"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '13px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={giftDetails?.recipientEmail || ''}
                  onChange={(e) => setGiftDetails({...giftDetails, recipientEmail: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter recipient's email"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleSaveGift}
                style={{
                  padding: '10px 24px',
                  background: '#ed3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#d42c3a'}
                onMouseLeave={(e) => e.target.style.background = '#ed3545'}
              >
                <i className="bi bi-check-circle" style={{ marginRight: '6px' }}></i>
                Save Gift Details
              </button>
              <button 
                onClick={handleCancelGift}
                style={{
                  padding: '10px 24px',
                  background: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
                onMouseLeave={(e) => e.target.style.background = '#f0f0f0'}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: '24px', 
        padding: '20px', 
        background: '#f8f9fa',
        borderRadius: '12px',
        textAlign: 'right'
      }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#666' }}>Total Items: </span>
          <strong style={{ color: '#333' }}>{giftItems.length}</strong>
        </div>
        <div style={{ marginBottom: '8px', color: '#28a745' }}>
          <span>Gift Discount: </span>
          <strong>-₹{getDiscount().toFixed(2)} (10%)</strong>
        </div>
        <div>
          <span style={{ fontSize: '18px', color: '#666' }}>Total: </span>
          <strong style={{ fontSize: '24px', color: '#ed3545' }}>₹{finalAmount.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
};

export default GiftCheckout;