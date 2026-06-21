import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCheckout } from '../../context/CheckoutContext';

const DressCheckout = ({ dressData, setDressData }) => {
  const { userCoins } = useAuth();
  const { appliedCoins, setAppliedCoins } = useCheckout();

  // Debug: log received data
  useEffect(() => {
    console.log('DressCheckout received:', dressData);
    console.log('Selected size:', dressData?.selectedSize);
  }, [dressData]);

  const getSingleTotal = () => {
    return (dressData.finalPrice || dressData.price) * (dressData.quantity || 1);
  };

  const finalAmount = getSingleTotal() - (appliedCoins / 10);

  // Helper to render stock badge
  const renderStockBadge = (stock) => {
    if (stock > 5) return <span className="stock-badge in-stock">✓ {stock} left</span>;
    if (stock > 0) return <span className="stock-badge low-stock">⚠️ Only {stock} left</span>;
    return <span className="stock-badge out-of-stock">✗ Out of stock</span>;
  };

  // Determine if the selected size is from meterSizes or regular sizes
  const isMeterSize = dressData.selectedSize && dressData.meterSizes && 
    dressData.meterSizes.some(s => s.size === dressData.selectedSize.size);
  const sizesList = isMeterSize ? dressData.meterSizes : dressData.sizes;

  return (
    <div className="checkout-section">
      <h3>Dress Checkout</h3>



      <table className="checkout-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product Details</th>
            <th>Price & Discount</th>
            <th>Change Size</th>
            <th>Quantity</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <img 
                src={dressData.images?.cover || 'https://via.placeholder.com/60'} 
                alt={dressData.name} 
                className="product-thumb"
              />
            </td>
            <td className="product-info">
              <strong>{dressData.name}</strong>
              <br />
              <small>Category: {dressData.category}</small>
              <br />
              <small>Occasion: {dressData.occasion}</small>
            </td>
            <td>
              <strong>₹{dressData.finalPrice}</strong>
              {dressData.price > dressData.finalPrice && (
                <>
                  <br />
                  <small className="original-price">₹{dressData.price}</small>
                  <br />
                  <small className="discount-badge">
                    {Math.round(((dressData.price - dressData.finalPrice) / dressData.price) * 100)}% off
                  </small>
                </>
              )}
            </td>
            <td>
              <select 
                className="size-select"
                value={dressData.selectedSize?.size || ''}
                onChange={(e) => {
                  const selectedSize = sizesList?.find(s => s.size === e.target.value);
                  if (selectedSize) {
                    setDressData({...dressData, selectedSize});
                  }
                }}
              >
                <option value="">Select Size</option>
                {sizesList?.map(s => (
                  <option key={s.size} value={s.size}>
                    {s.size} {s.stock > 0 ? `(${s.stock} left)` : '(Out of stock)'}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <div className="quantity-control">
                <button 
                  onClick={() => {
                    const newQty = Math.max(1, (dressData.quantity || 1) - 1);
                    setDressData({...dressData, quantity: newQty});
                  }}
                  disabled={dressData.quantity <= 1}
                >
                  -
                </button>
                <span>{dressData.quantity || 1}</span>
                <button 
                  onClick={() => {
                    const newQty = (dressData.quantity || 1) + 1;
                    if (newQty > (dressData.selectedSize?.stock || Infinity)) {
                      alert(`Only ${dressData.selectedSize?.stock} items available`);
                      return;
                    }
                    setDressData({...dressData, quantity: newQty});
                  }}
                >
                  +
                </button>
              </div>
            </td>
            <td className="total-price">
              ₹{getSingleTotal().toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="checkout-summary">
        <h5 className="text-end">Total: ₹{finalAmount.toFixed(2)}</h5>
      </div>
    </div>
  );
};

export default DressCheckout;