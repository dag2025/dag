import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckoutProvider, useCheckout } from '../../context/CheckoutContext';
import DressCheckout from '../../components/checkout/DressCheckout';
import JewelleryCheckout from '../../components/checkout/JewelleryCheckout';
import ComboCheckout from '../../components/checkout/ComboCheckout';
import GiftCheckout from '../../components/checkout/GiftCheckout';
import CartCheckout from '../../components/checkout/CartCheckout';
import AddressSection from '../../components/checkout/AddressSection';
import PaymentSection from '../../components/checkout/PaymentSection';
import checkoutbanner from '../../assets/checkout-banner.svg';
import '../../styles/Checkout.css';

function CheckoutContent() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(1);
  
  // Data states
  const [dressData, setDressData] = useState(null);
  const [jewelleryData, setJewelleryData] = useState(null);
  const [comboData, setComboData] = useState(null);
  const [giftData, setGiftData] = useState(null);
  const [cartData, setCartData] = useState(null);
  
  // Item states
  const [comboItems, setComboItems] = useState([]);
  const [giftItems, setGiftItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  
  // Gift details
  const [giftDetails, setGiftDetails] = useState({ message: '', recipientName: '', recipientEmail: '' });
// In Checkout.jsx, add these functions
const getGiftDiscount = () => {
  const subtotal = giftItems.reduce((sum, item) => 
    sum + (item.finalPrice || item.price) * (item.quantity || 1), 0);
  return subtotal * 0.1;
};

const getGiftSubtotal = () => {
  return giftItems.reduce((sum, item) => 
    sum + (item.finalPrice || item.price) * (item.quantity || 1), 0);
};
// In Checkout.jsx - Update the useEffect
useEffect(() => {
  console.log('🔍 Checkout location.state:', location.state);
  
  if (location.state) {
    const { type, data } = location.state;
    console.log('📦 Received checkout data:', { type, data });
    
    if (type === 'dress') {
      setActiveTab(1);
      setDressData(data);
    } else if (type === 'jewellery') {
      setActiveTab(2);
      setJewelleryData(data);
    } else if (type === 'combo') {
      setActiveTab(3);
      setComboData(data);
      setComboItems(data.items || []);
    } else if (type === 'gift') {
      setActiveTab(4);
      setGiftData(data);
      setGiftItems(data.items || []);
      if (data?.giftDetails) {
        console.log('🎁 Setting gift details:', data.giftDetails);
        setGiftDetails(data.giftDetails);
      }
    } else if (type === 'cart') {
      setActiveTab(5);
      setCartData(data);
      setCartItems(data.items || []);
    }
  } else {
    console.warn('⚠️ No location.state found in checkout');
  }
}, [location.state]);

  // Calculate totals (passed to PaymentSection)
  const getComboTotal = () => {
    const subtotal = comboItems.reduce((sum, item) => 
      sum + (item.finalPrice || item.price) * (item.quantity || 1), 0);
    return subtotal - (subtotal * 0.2);
  };

  const getGiftTotal = () => {
    const subtotal = giftItems.reduce((sum, item) => 
      sum + (item.finalPrice || item.price) * (item.quantity || 1), 0);
    return subtotal - (subtotal * 0.1);
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => 
      sum + (item.finalPrice || item.price) * (item.quantity || 1), 0);
  };

  return (
    <div className="checkout-container mb-5">
    <img src={checkoutbanner} alt="checkout-banner" className='img-fluid mt-3' style={{width:'100%',borderRadius:'0px'}} />

      {/* Tab Navigation */}
      <div className="checkout-tabs mt-2">
        <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
          <i className="bi bi-grid"></i> Dress
        </button>
        <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>
          <i className="bi bi-gem"></i> Jewellery
        </button>
        <button className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>
          <i className="bi bi-grid-3x3-gap-fill"></i> Combo
        </button>
        <button className={`tab-btn ${activeTab === 4 ? 'active' : ''}`} onClick={() => setActiveTab(4)}>
          <i className="bi bi-gift"></i> Gift
        </button>
        <button className={`tab-btn ${activeTab === 5 ? 'active' : ''}`} onClick={() => setActiveTab(5)}>
          <i className="bi bi-cart"></i> Cart
        </button>
      </div>


      {/* Tab Content */}
      <div className="checkout-content">
        {activeTab === 1 && dressData && (
          <DressCheckout dressData={dressData} setDressData={setDressData} />
        )}
        {activeTab === 2 && jewelleryData && (
          <JewelleryCheckout jewelleryData={jewelleryData} setJewelleryData={setJewelleryData} />
        )}
        {activeTab === 3 && comboData && (
          <ComboCheckout 
            comboItems={comboItems} 
            setComboItems={setComboItems}
            giftDetails={giftDetails}
            setGiftDetails={setGiftDetails}
          />
        )}
        {activeTab === 4 && giftData && (
          <GiftCheckout 
            giftItems={giftItems} 
            setGiftItems={setGiftItems}
            giftDetails={giftDetails}
            setGiftDetails={setGiftDetails}
          />
        )}
        {activeTab === 5 && cartData && (
          <CartCheckout cartItems={cartItems} setCartItems={setCartItems} />
        )}
      </div>

      {/* Shared Sections */}
      <AddressSection />
   <PaymentSection 
  activeTab={activeTab}
  dressData={dressData}
  jewelleryData={jewelleryData}
  comboItems={comboItems}
  giftItems={giftItems}
  cartItems={cartItems}
  giftDetails={giftDetails}  // ← THIS IS MISSING!
  getComboTotal={getComboTotal}
  getGiftTotal={getGiftTotal}
  getCartTotal={getCartTotal}
  getGiftDiscount={getGiftDiscount}
  getGiftSubtotal={getGiftSubtotal}
/>
    </div>
  );
}

export default function Checkout() {
  return (
    <CheckoutProvider>
      <CheckoutContent />
    </CheckoutProvider>
  );
}