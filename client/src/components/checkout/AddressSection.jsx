import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCheckout } from '../../context/CheckoutContext';
import axios from 'axios';
import API_BASE_URL from '../../Config/Api';
const AddressSection = () => {
  const { user, token } = useAuth();
  const { 
    addresses, setAddresses, selectedAddress, setSelectedAddress,
    showAddressForm, setShowAddressForm, editingAddressId, setEditingAddressId,
    newAddress, setNewAddress
  } = useCheckout();

  // Fetch addresses on component mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      console.log('Fetching addresses with token:', token);
      const res = await axios.get(`${API_BASE_URL}/orders/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Addresses response:', res.data);
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

  const handleAddAddress = async () => {
    try {
      console.log('Adding address:', newAddress);
      const res = await axios.post(`${API_BASE_URL}/orders/addresses`, newAddress, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Add address response:', res.data);
      if (res.data.success) {
        // Refresh addresses from database instead of just updating local state
        await fetchAddresses();
        setShowAddressForm(false);
        resetAddressForm();
      }
    } catch (err) {
      console.error('Error adding address:', err);
    }
  };

  const handleUpdateAddress = async () => {
    try {
      console.log('Updating address:', editingAddressId, newAddress);
      const res = await axios.put(`${API_BASE_URL}/orders/addresses/${editingAddressId}`, newAddress, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Update address response:', res.data);
      if (res.data.success) {
        // Refresh addresses from database
        await fetchAddresses();
        setShowAddressForm(false);
        setEditingAddressId(null);
        resetAddressForm();
      }
    } catch (err) {
      console.error('Error updating address:', err);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      console.log('Deleting address:', addressId);
      await axios.delete(`${API_BASE_URL}/orders/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh addresses from database
      await fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  const resetAddressForm = () => {
    setNewAddress({
      name: user?.name || '', 
      email: user?.email || '', 
      mobile: '', 
      altMobile: '', 
      pincode: '',
      landmark: '', 
      city: '', 
      state: '', 
      address: '', 
      isDefault: false
    });
  };

  const editAddress = (address) => {
    setNewAddress(address);
    setEditingAddressId(address._id);
    setShowAddressForm(true);
  };

  return (
    <div className="address-section">
      <h4>Choose Delivery Address</h4>
      <div className="address-header">
        <strong>Checkout Details</strong>
        <button 
          className="btn-add-address"
          onClick={() => {
            setShowAddressForm(true);
            setEditingAddressId(null);
            resetAddressForm();
          }}
        >
          <i className="bi bi-plus-circle"></i> Add New Address
        </button>
      </div>

      <div className="address-list">
        {addresses.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            No addresses found. Please add a new address.
          </p>
        ) : (
          addresses.map(addr => (
            <div 
              key={addr._id} 
              className={`address-card ${selectedAddress?._id === addr._id ? 'selected' : ''}`}
              onClick={() => setSelectedAddress(addr)}
            >
              <div className="address-radio">
                <input 
                  type="radio" 
                  name="address" 
                  checked={selectedAddress?._id === addr._id} 
                  onChange={() => setSelectedAddress(addr)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="address-details">
                <p><strong>{addr.name}</strong> {addr.isDefault && <span className="default-badge">Default</span>}</p>
                <p>{addr.address}</p>
                <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                <p>Mobile: {addr.mobile}</p>
                {addr.altMobile && <p>Alt: {addr.altMobile}</p>}
              </div>
              <div className="address-actions">
                <button onClick={(e) => { e.stopPropagation(); editAddress(addr); }}>
                  <i className="bi bi-pencil"></i>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr._id); }}>
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="address-modal">
          <div className="address-modal-content">
            <h4>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h4>
            <div className="address-form">
              <input 
                type="text" 
                placeholder="Full Name *" 
                value={newAddress.name} 
                onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                required
              />
              <input 
                type="email" 
                placeholder="Email *" 
                value={newAddress.email} 
                onChange={(e) => setNewAddress({...newAddress, email: e.target.value})}
                required
              />
              <div className="form-row">
                <input 
                  type="text" 
                  placeholder="Mobile *" 
                  value={newAddress.mobile} 
                  onChange={(e) => setNewAddress({...newAddress, mobile: e.target.value})}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Alt Mobile (optional)" 
                  value={newAddress.altMobile} 
                  onChange={(e) => setNewAddress({...newAddress, altMobile: e.target.value})}
                />
              </div>
              <div className="form-row">
                <input 
                  type="text" 
                  placeholder="Pincode *" 
                  value={newAddress.pincode} 
                  onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Landmark" 
                  value={newAddress.landmark} 
                  onChange={(e) => setNewAddress({...newAddress, landmark: e.target.value})}
                />
              </div>
              <div className="form-row">
                <input 
                  type="text" 
                  placeholder="City *" 
                  value={newAddress.city} 
                  onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                  required
                />
                <input 
                  type="text" 
                  placeholder="State *" 
                  value={newAddress.state} 
                  onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                  required
                />
              </div>
              <textarea 
                placeholder="Full Address *" 
                value={newAddress.address} 
                onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                rows="3"
                required
              />
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={newAddress.isDefault} 
                  onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                />
                Set as default address
              </label>
              <div className="form-actions">
                <button 
                  className="btn-save" 
                  onClick={editingAddressId ? handleUpdateAddress : handleAddAddress}
                >
                  {editingAddressId ? 'Update' : 'Save'} Address
                </button>
                <button 
                  className="btn-cancel" 
                  onClick={() => {
                    setShowAddressForm(false);
                    setEditingAddressId(null);
                    resetAddressForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSection;