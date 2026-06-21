import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

function OrderManagement() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [returnFilter, setReturnFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ orderId: null, status: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnAction, setReturnAction] = useState({ orderId: null, action: '', reason: '' });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
    returnRequests: 0
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter, typeFilter, returnFilter, dateRange]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrders(res.data.orders);
        calculateStats(res.data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    const stats = {
      total: ordersData.length,
      pending: ordersData.filter(o => o.orderStatus === 'placed').length,
      delivered: ordersData.filter(o => o.orderStatus === 'delivered').length,
      cancelled: ordersData.filter(o => o.orderStatus === 'cancelled').length,
      returnRequests: ordersData.filter(o => o.returnRequest?.status === 'pending').length,
      revenue: ordersData
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + (o.finalAmount || 0), 0)
    };
    setStats(stats);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === paymentFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(order => order.orderType === typeFilter);
    }

    if (returnFilter !== 'all') {
      if (returnFilter === 'pending') {
        filtered = filtered.filter(order => order.returnRequest?.status === 'pending');
      } else if (returnFilter === 'approved') {
        filtered = filtered.filter(order => order.returnRequest?.status === 'approved');
      } else if (returnFilter === 'rejected') {
        filtered = filtered.filter(order => order.returnRequest?.status === 'rejected');
      }
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= new Date(dateRange.start) && orderDate <= new Date(dateRange.end);
      });
    }

    setFilteredOrders(filtered);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        fetchOrders();
        setStatusUpdate({ orderId: null, status: '' });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleReturnAction = async () => {
    if (!returnAction.orderId || !returnAction.action) return;

    try {
      const res = await axios.post(`http://localhost:5000/api/admin/orders/${returnAction.orderId}/process-return`,
        { 
          approve: returnAction.action === 'approve',
          reason: returnAction.reason 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        fetchOrders();
        setShowReturnModal(false);
        setReturnAction({ orderId: null, action: '', reason: '' });
      }
    } catch (err) {
      console.error('Error processing return:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderId || !cancelReason) return;
    
    try {
      const res = await axios.post(`http://localhost:5000/api/admin/orders/${selectedOrderId}/cancel`, 
        { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        fetchOrders();
        setShowCancelModal(false);
        setCancelReason('');
        setSelectedOrderId(null);
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    
    try {
      const res = await axios.delete(`http://localhost:5000/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      placed: 'badge bg-secondary',
      confirmed: 'badge bg-info',
      shipped: 'badge bg-primary',
      delivered: 'badge bg-success',
      cancelled: 'badge bg-danger'
    };
    return <span className={colors[status] || 'badge bg-secondary'}>{status}</span>;
  };

  const getPaymentBadge = (status) => {
    return status === 'paid' 
      ? <span className="badge bg-success">Paid</span>
      : <span className="badge bg-warning text-dark">Pending</span>;
  };

  const getReturnBadge = (status) => {
    const colors = {
      pending: 'badge bg-warning text-dark',
      approved: 'badge bg-success',
      rejected: 'badge bg-danger'
    };
    return status ? <span className={colors[status]}>{status}</span> : null;
  };

  const styles = {
    returnBadge: {
      pending: { background: '#ffc107', color: '#333' },
      approved: { background: '#28a745', color: 'white' },
      rejected: { background: '#dc3545', color: 'white' }
    },
    refundPolicy: {
      background: '#e7f3ff',
      borderLeft: '4px solid #17a2b8',
      padding: '8px 12px',
      marginTop: '10px',
      borderRadius: '4px',
      fontSize: '12px'
    }
  };

  return (
    <>
      <style>{`
        .order-management {
          max-width: 98%;
          margin: 0 auto;
          padding: 10px;
          
          background: #ffffff;
          min-height: 100vh;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 20px;
          position: relative;
        }

 
        /* Stats Cards */
        .stats-grid {
          display: grid;
          
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
          transition: transform 0.2s;
          position: relative;
          
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(237,53,69,0.1);
        }

        .stat-card.return {
          border-left: 4px solid #ffc107;
        }

        .stat-icon {
          font-size: 2rem;
          color: #ed3545;
          margin-bottom: 10px;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }

        .stat-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #ffc107;
          color: #333;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        /* Filters Section */
        .filters-section {
          background: white;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .filter-input {
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          margin-top: 10px;
          border: 2px solid #000000;
          
        }

        .filter-input:focus {
          border-color: #ed3545;
          outline: none;
        }

        .date-range {
          display: flex;
          gap: 10px;
        }

        .filter-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 5px;
        }

        /* Orders Table */
        .orders-table-container {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
          overflow-x: auto;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
          border:2px solid #ed3545;
        }

        .orders-table th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          border-bottom: 2px solid #ed3545;
          font-weight: 600;
          color: #333;
          white-space: nowrap;
          border:2px solid #ed3545;
        }

        .orders-table td {
          padding: 15px;
          border-bottom: 1px solid #e0e0e0;
          border:2px solid #ed3545;
          vertical-align: top;
        }

        .orders-table tr:hover {
          background: #f8f9fa;
        }

        .order-expanded {
          background: #f0f0f0;
        }

        .product-image {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 8px;
          margin-right: 10px;
        }

        .product-details {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-icon {
          background: none;
          border: 1px solid #ed3545;
          border-radius: 6px;
          padding: 6px 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
        }

        .btn-icon:hover {
          background: #ed3545;
          color: white;
        }

        .btn-icon.delete:hover {
          background: #fee;
          color: #dc3545;
          border-color: #dc3545;
        }

        .btn-icon.approve:hover {
          background: #d4edda;
          color: #28a745;
          border-color: #28a745;
        }

        .btn-icon.reject:hover {
          background: #f8d7da;
          color: #dc3545;
          border-color: #dc3545;
        }

        .status-dropdown {
          padding: 6px 10px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 12px;
          width: 140px;
        }

        .return-status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 5px;
        }

        .return-pending {
          background: #fff3cd;
          color: #856404;
        }

        .return-approved {
          background: #d4edda;
          color: #155724;
        }

        .return-rejected {
          background: #f8d7da;
          color: #721c24;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-title {
          margin-bottom: 15px;
          color: #333;
        }

        .modal-textarea {
          width: 100%;
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          margin: 15px 0;
          min-height: 100px;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn-primary {
          background: #ed3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-success {
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }

        /* Gift Section */
        .gift-details {
          background: #fff3cd;
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
          font-size: 12px;
          border-left: 3px solid #ed3545;
        }

        .cancel-reason {
          background: #f8d7da;
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
          font-size: 12px;
        }

        .return-info {
          background: #e7f3ff;
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
          font-size: 12px;
          border-left: 3px solid #17a2b8;
        }

        .loading-spinner {
          text-align: center;
          padding: 50px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #ed3545;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className='order-management'>
        <h1 className="page-title">Order Management System</h1>

        {/* Stats Cards */}
        <div className="stats-grid overflow-auto d-flex flex-row gap-3 mb-4">
          <div className="stat-card">
            <div className="stat-icon"><i className="bi bi-box"></i></div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><i className="bi bi-clock"></i></div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><i className="bi bi-check-circle"></i></div>
            <div className="stat-value">{stats.delivered}</div>
            <div className="stat-label">Delivered</div>
          </div>
          <div className="stat-card return">
            <div className="stat-icon"><i className="bi bi-arrow-repeat"></i></div>
            <div className="stat-value">{stats.returnRequests}</div>
            <div className="stat-label">Return Requests</div>
            {stats.returnRequests > 0 && (
              <span className="stat-badge ">Pending</span>
            )}
          </div>
          <div className="stat-card">
            <div className="stat-icon"><i className="bi bi-x-circle"></i></div>
            <div className="stat-value">{stats.cancelled}</div>
            <div className="stat-label">Cancelled</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><i className="bi bi-currency-rupee"></i></div>
            <div className="stat-value">₹{stats.revenue.toLocaleString()}</div>
            <div className="stat-label">Revenue</div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-3 overflow-auto">
          <h5><i className="bi bi-filter"></i> Filter Orders</h5>
          <div className="d-flex flex-row  gap-2 ">
            
            <input
              type="text"
              className="filter-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            /> <br/>
      
              <div className="">
                 <select className="filter-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
              </div>
              <div className=""> <select className="filter-input" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select></div>
           
           
            <div className="">   <select className="filter-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="combo">Combo</option>
              <option value="gift">Gift</option>
              <option value="cart">Cart</option>
            </select></div>
            <div className="">
            <select className="filter-input" value={returnFilter} onChange={(e) => setReturnFilter(e.target.value)}>
              <option value="all">All Returns</option>
              <option value="pending">Pending Returns</option>
              <option value="approved">Approved Returns</option>
              <option value="rejected">Rejected Returns</option>
            </select></div>
          
         
            <div className="date-range">
              <input
                type="date"
                className="filter-input"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <input
                type="date"
                className="filter-input"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="orders-table-container">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
              <p className="mt-3">No orders found</p>
            </div>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User Details</th>
                  <th>Order Info</th>
                  <th>Products</th>
                  <th>Delivery Details</th>
                  <th>Status & Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <React.Fragment key={order._id}>
                    <tr>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{order.userId?.name || 'N/A'}</strong>
                        <br />
                        <small className="text-muted" style={{ textTransform: 'none' }}>{order.userId?.email || 'N/A'}</small>
                        <br />
                        <small className="text-muted">ID: {order._id.slice(-6)}</small>
                      </td>
                      <td>
                        <div><strong>Type:</strong> {order.orderType}</div>
                        <div><small>Date: {formatDate(order.createdAt)}</small></div>
                        <div><small>Items: {order.items?.length || 0}</small></div>
                        <div><small>Subtotal: ₹{order.subtotal}</small></div>
                        {order.totalDiscount > 0 && (
                          <div><small className="text-success">Discount: -₹{order.totalDiscount}</small></div>
                        )}
                        <div><strong>Total: ₹{order.finalAmount}</strong></div>
                        
                        {/* Return Request Status */}
                        {order.returnRequest && (
                          <div className="mt-2">
                            <span className={`return-status-badge return-${order.returnRequest.status}`}>
                              Return: {order.returnRequest.status}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn-icon"
                          onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        >
                          {expandedOrder === order._id ? 'Hide' : 'Check'} Products
                        </button>
                      </td>
                      <td>
                        <div><strong>{order.address?.name}</strong></div>
                        <small>{order.address?.address}, {order.address?.city}</small>
                        <br />
                        <small>{order.address?.state} - {order.address?.pincode}</small>
                        <br />
                        <small>📞 {order.address?.mobile}</small>
                        <div className="mt-2">
                          {getPaymentBadge(order.paymentStatus)}
                          <span className="ms-2">{order.paymentMethod === 'cod' ? '💵 COD' : '💳 Online'}</span>
                        </div>

                        {/* Refund Policy for Online Payments */}
                        {order.paymentMethod === 'online' && order.paymentStatus === 'paid' && (
                          <div style={styles.refundPolicy}>
                            <i className="bi bi-shield-check"></i> Refund will be processed within 5-7 business days to original payment method.
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <select 
                            className="status-dropdown"
                            value={statusUpdate.orderId === order._id ? statusUpdate.status : order.orderStatus}
                            onChange={(e) => setStatusUpdate({ orderId: order._id, status: e.target.value })}
                          >
                            <option value="placed">Placed</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          {statusUpdate.orderId === order._id && (
                            <button
                              className="btn-icon"
                              onClick={() => handleStatusUpdate(order._id, statusUpdate.status)}
                            >
                              Update
                            </button>
                          )}
                          
                          {/* Return Action Buttons */}
                          {order.returnRequest?.status === 'pending' && (
                            <>
                              <button
                                className="btn-icon approve"
                                onClick={() => {
                                  setReturnAction({ 
                                    orderId: order._id, 
                                    action: 'approve',
                                    reason: ''
                                  });
                                  setShowReturnModal(true);
                                }}
                              >
                                Approve Return
                              </button>
                              <button
                                className="btn-icon reject"
                                onClick={() => {
                                  setReturnAction({ 
                                    orderId: order._id, 
                                    action: 'reject',
                                    reason: ''
                                  });
                                  setShowReturnModal(true);
                                }}
                              >
                                Reject Return
                              </button>
                            </>
                          )}
                          
                          <button
                            className="btn-icon delete"
                            onClick={() => {
                              setSelectedOrderId(order._id);
                              setShowCancelModal(true);
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDeleteOrder(order._id)}
                          >
                            Delete
                          </button>
                        </div>
                        
                        {order.orderStatus === 'cancelled' && order.cancelReason && (
                          <div className="cancel-reason">
                            <small><strong>Reason:</strong> {order.cancelReason}</small>
                          </div>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded Products Row */}
                    {expandedOrder === order._id && (
                      <tr className="order-expanded">
                        <td colSpan="6">
                          <div className="p-3">
                            <h6>Products in this order:</h6>
                            <div className="row">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="col-md-6 mb-2">
                                  <div className="d-flex align-items-center gap-3 p-2 bg-white rounded">
                                    <img 
                                      src={item.image || 'https://via.placeholder.com/50'} 
                                      alt={item.name}
                                      className="product-image"
                                    />
                                    <div>
                                      <strong>{item.name}</strong>
                                      <br />
                                      <small>{item.productType} | Size: {item.selectedSize?.size || 'N/A'}</small>
                                      <br />
                                      <small>Qty: {item.quantity} | ₹{item.finalPrice} each</small>
                                      <br />
                                      <small>Total: ₹{item.total}</small>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Gift Details if applicable */}
                            {order.orderType === 'gift' && order.giftDetails && (
                              <div className="gift-details mt-3">
                                <strong>🎁 Gift Details</strong>
                                <p className="mb-1 mt-2">Message: {order.giftDetails.message}</p>
                                <p className="mb-0">Recipient: {order.giftDetails.recipientName} ({order.giftDetails.recipientEmail})</p>
                              </div>
                            )}

                            {/* Return Request Details */}
                            {order.returnRequest && (
                              <div className="return-info mt-3">
                                <strong>🔄 Return Request</strong>
                                <p className="mb-1 mt-2"><strong>Reason:</strong> {order.returnRequest.reason}</p>
                                <p className="mb-0"><strong>Requested:</strong> {formatDate(order.returnRequest.requestedAt)}</p>
                                {order.returnRequest.processedAt && (
                                  <p className="mb-0"><strong>Processed:</strong> {formatDate(order.returnRequest.processedAt)}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4 className="modal-title">Cancel Order</h4>
            <p>Please provide a reason for cancellation:</p>
            <textarea
              className="modal-textarea"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Out of stock, Customer request, etc."
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                Close
              </button>
              <button className="btn-primary" onClick={handleCancelOrder}>
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Action Modal */}
      {showReturnModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4 className="modal-title">
              {returnAction.action === 'approve' ? 'Approve' : 'Reject'} Return Request
            </h4>
            {returnAction.action === 'reject' && (
              <>
                <p>Please provide a reason for rejection:</p>
                <textarea
                  className="modal-textarea"
                  value={returnAction.reason}
                  onChange={(e) => setReturnAction({...returnAction, reason: e.target.value})}
                  placeholder="Reason for rejection..."
                />
              </>
            )}
            {returnAction.action === 'approve' && (
              <div className="return-info mb-3">
                <i className="bi bi-info-circle"></i> Upon approval, the refund will be processed according to the payment method.
                {orders.find(o => o._id === returnAction.orderId)?.paymentMethod === 'online' && (
                  <p className="mt-2 mb-0"><strong>Refund will be processed to original payment method within 5-7 business days.</strong></p>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowReturnModal(false)}>
                Cancel
              </button>
              <button 
                className={returnAction.action === 'approve' ? 'btn-success' : 'btn-danger'}
                onClick={handleReturnAction}
                disabled={returnAction.action === 'reject' && !returnAction.reason}
              >
                {returnAction.action === 'approve' ? 'Approve Return' : 'Reject Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrderManagement;