import React, { useEffect } from 'react';
import { useCheckout } from '../../context/CheckoutContext';

const CartCheckout = ({ cartItems, setCartItems }) => {
  const { appliedCoins } = useCheckout();

  // Debug logs (keep these for monitoring)
  useEffect(() => {
    console.log('📦 Cart items loaded:', cartItems);
  }, [cartItems]);

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => 
      sum + (item.finalPrice || item.price) * (item.quantity || 1), 0);
  };

  const finalAmount = calculateSubtotal() - (appliedCoins / 10);

  const handleQuantityChange = (index, delta) => {
    const item = cartItems[index];
    const currentQty = item.quantity || 1;
    const maxStock = item.selectedSize?.stock || Infinity;
    const newQty = currentQty + delta;

    if (newQty < 1) return;
    if (delta > 0 && newQty > maxStock) {
      alert(`Only ${maxStock} items available`);
      return;
    }

    const newItems = [...cartItems];
    newItems[index].quantity = newQty;
    setCartItems(newItems);
  };

  const handleSizeChange = (index, sizeObj) => {
    const newItems = [...cartItems];
    newItems[index].selectedSize = sizeObj;
    setCartItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Inline styles to ensure display
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
    border: '1px solid #ddd'
  };

  const thStyle = {
    background: '#f5f5f5',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #ed3545',
    fontWeight: '600'
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #eee',
    verticalAlign: 'middle'
  };

  const stockBadgeStyle = (stock) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    background: stock > 5 ? '#d4edda' : (stock > 0 ? '#fff3cd' : '#f8d7da'),
    color: stock > 5 ? '#155724' : (stock > 0 ? '#856404' : '#721c24'),
    display: 'inline-block'
  });

  return (
    <div className="checkout-section" style={{ padding: '20px', background: '#fff', borderRadius: '8px' }}>
      <h3 style={{ marginBottom: '20px', color: '#333' }}>Cart Checkout</h3>
      <h6 style={{ marginBottom: '15px', color: '#666' }}>Products in your cart</h6>
      
      {(!cartItems || cartItems.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Your cart is empty
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Image</th>
                <th style={thStyle}>Product Details</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Selected Size</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Quantity</th>
                <th style={thStyle}>Total</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => (
                <tr key={index}>
                  <td style={tdStyle}>
                    <img 
                      src={item.image || item.images?.cover || 'https://via.placeholder.com/60'} 
                      alt={item.name} 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div><strong>{item.name}</strong></div>
                  
                  </td>
                  <td style={tdStyle}>
                    <div><strong>₹{item.finalPrice || item.price}</strong></div>
                    {item.discount > 0 && (
                      <div style={{ fontSize: '11px', color: '#999', textDecoration: 'line-through' }}>
                        ₹{item.price}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <div><strong>{item.selectedSize?.size || 'Not selected'}</strong></div>
                  </td>
                  <td style={tdStyle}>
                    <span style={stockBadgeStyle(item.selectedSize?.stock)}>
                      {item.selectedSize?.stock || 0} left
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onClick={() => handleQuantityChange(index, -1)}
                        disabled={item.quantity <= 1}
                        style={{
                          width: '30px',
                          height: '30px',
                          border: '1px solid #ddd',
                          background: '#fff',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          opacity: item.quantity <= 1 ? 0.5 : 1
                        }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantity || 1}</span>
                      <button 
                        onClick={() => handleQuantityChange(index, 1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          border: '1px solid #ddd',
                          background: '#fff',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#ed3545' }}>
                    ₹{((item.finalPrice || item.price) * (item.quantity || 1)).toFixed(2)}
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => handleRemoveItem(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        fontSize: '18px',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        textAlign: 'right'
      }}>
        <h5 style={{ margin: '5px 0' }}>Total Items: {cartItems?.length || 0}</h5>
        <h4 style={{ margin: '10px 0', color: '#ed3545' }}>Total: ₹{finalAmount.toFixed(2)}</h4>
      </div>
    </div>
  );
};

export default CartCheckout;