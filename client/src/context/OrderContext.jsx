import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrder must be used within OrderProvider');
  return context;
};

export const OrderProvider = ({ children }) => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrders(res.data.orders);
        if (res.data.orders.length > 0) setSelectedOrder(res.data.orders[0]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      showToast('Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelEntireOrder = async (orderId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast('Order cancelled successfully');
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel order', 'error');
    }
  };

  const returnOrder = async (orderId, reason) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/orders/${orderId}/return`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast('Return request submitted');
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit return', 'error');
    }
  };

  const updateAddress = async (orderId, address) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/orders/${orderId}/address`, address, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast('Address updated');
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update address', 'error');
    }
  };

  const updateGiftDetails = async (orderId, giftDetails) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/orders/${orderId}/gift-details`, giftDetails, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast('Gift details updated');
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update gift details', 'error');
    }
  };

  const updatePaymentMethod = async (orderId, paymentMethod) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/orders/${orderId}/payment-method`, 
        { paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showToast('Payment method updated');
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update payment', 'error');
    }
  };

  const cancelOrderItem = async (orderId, itemId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/orders/${orderId}/cancel-item`, 
        { itemId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showToast('Item cancelled successfully');
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel item', 'error');
    }
  };

  const deleteReturnRequest = async (orderId) => {
    try {
      const res = await axios.delete(`http://localhost:5000/api/orders/${orderId}/return`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast('Return request deleted');
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete return', 'error');
    }
  };

  const value = {
    orders,
    selectedOrder,
    setSelectedOrder,
    loading,
    fetchOrders,
    toast,
    setToast,
    cancelOrderItem,
    cancelEntireOrder,
    returnOrder,
    updateAddress,
    updateGiftDetails,
    updatePaymentMethod,
    deleteReturnRequest
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};