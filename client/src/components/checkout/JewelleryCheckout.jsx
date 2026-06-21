import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCheckout } from '../../context/CheckoutContext';

const JewelleryCheckout = ({ jewelleryData, setJewelleryData }) => {
  const { appliedCoins } = useCheckout();

  useEffect(() => {
    console.log('JewelleryCheckout received:', jewelleryData);
    console.log('Selected size:', jewelleryData?.selectedSize);
  }, [jewelleryData]);

  const getSingleTotal = () => {
    return (jewelleryData.finalPrice || jewelleryData.price) * (jewelleryData.quantity || 1);
  };

  const finalAmount = getSingleTotal() - (appliedCoins / 10);

  const renderStockBadge = (stock) => {
    if (stock > 5) return <span className="stock-badge in-stock">✓ {stock} left</span>;
    if (stock > 0) return <span className="stock-badge low-stock">⚠️ Only {stock} left</span>;
    return <span className="stock-badge out-of-stock">✗ Out of stock</span>;
  };

  return (
    <div className="checkout-section">
      <h3>Jewellery Checkout</h3>



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
                src={jewelleryData.image || 'https://via.placeholder.com/60'} 
                alt={jewelleryData.name} 
                className="product-thumb"
              />
            </td>
            <td className="product-info">
              <strong>{jewelleryData.name}</strong>
              <br />
              <small>Category: {jewelleryData.category}</small>
              <br />
              <small>Occasion: {jewelleryData.occasion}</small>
            </td>
            <td>
              <strong>₹{jewelleryData.finalPrice}</strong>
              {jewelleryData.price > jewelleryData.finalPrice && (
                <>
                  <br />
                  <small className="original-price">₹{jewelleryData.price}</small>
                  <br />
                  <small className="discount-badge">
                    {Math.round(((jewelleryData.price - jewelleryData.finalPrice) / jewelleryData.price) * 100)}% off
                  </small>
                </>
              )}
            </td>
            <td>
              <select 
                className="size-select"
                value={jewelleryData.selectedSize?.size || ''}
                onChange={(e) => {
                  const selectedSize = jewelleryData.sizes?.find(s => s.size.toString() === e.target.value);
                  if (selectedSize) setJewelleryData({...jewelleryData, selectedSize});
                }}
              >
                <option value="">Select Size</option>
                {jewelleryData.sizes?.map(s => (
                  <option key={s.size} value={s.size}>
                    Size {s.size} {s.stock > 0 ? `(${s.stock} left)` : '(Out of stock)'}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <div className="quantity-control">
                <button 
                  onClick={() => {
                    const newQty = Math.max(1, (jewelleryData.quantity || 1) - 1);
                    setJewelleryData({...jewelleryData, quantity: newQty});
                  }}
                  disabled={jewelleryData.quantity <= 1}
                >
                  -
                </button>
                <span>{jewelleryData.quantity || 1}</span>
                <button 
                  onClick={() => {
                    const newQty = (jewelleryData.quantity || 1) + 1;
                    if (newQty > (jewelleryData.selectedSize?.stock || Infinity)) {
                      alert(`Only ${jewelleryData.selectedSize?.stock} items available`);
                      return;
                    }
                    setJewelleryData({...jewelleryData, quantity: newQty});
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

export default JewelleryCheckout;