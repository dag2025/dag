import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../Config/Api';
const CheckoutContext = createContext();

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
};

export const CheckoutProvider = ({ children }) => {
  // Shared checkout state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [appliedCoins, setAppliedCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Address form state - THESE WERE MISSING
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: '', email: '', mobile: '', altMobile: '', pincode: '',
    landmark: '', city: '', state: '', address: '', isDefault: false
  });

  // Address management functions
  const fetchAddresses = async (token) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/orders/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAddresses(res.data.addresses);
        const defaultAddr = res.data.addresses.find(a => a.isDefault);
        if (defaultAddr) setSelectedAddress(defaultAddr);
        else if (res.data.addresses.length > 0) setSelectedAddress(res.data.addresses[0]);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const value = {
    // Address state
    addresses,
    setAddresses,
    selectedAddress,
    setSelectedAddress,
    
    // Address form state - NOW INCLUDED
    showAddressForm,
    setShowAddressForm,
    editingAddressId,
    setEditingAddressId,
    newAddress,
    setNewAddress,
    
    // Payment state
    paymentMethod,
    setPaymentMethod,
    appliedCoins,
    setAppliedCoins,
    loading,
    setLoading,
    
    // Functions
    fetchAddresses
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};