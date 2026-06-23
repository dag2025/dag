import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../../styles/Dashboard.css';
import API_BASE_URL from '../../Config/Api';
function Dashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalDresses: 0,
    totalJewellery: 0,
    totalAds: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    generateSalesData();
  }, [selectedPeriod, stats]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [ordersRes, usersRes, dressesRes, jewelleryRes, adsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/dresses`),
        axios.get(`${API_BASE_URL}/jewellery`),
        axios.get(`${API_BASE_URL}/ads`)
      ]);

      // Process orders data
      const orders = ordersRes.data.orders || [];
      const recentOrdersData = orders.slice(0, 5).map(order => ({
        ...order,
        date: new Date(order.createdAt).toLocaleDateString()
      }));
      
      // Process users data
      const users = usersRes.data.users || [];
      const recentUsersData = users
        .filter(user => user.role !== 'admin')
        .slice(0, 5)
        .map(user => ({
          ...user,
          joinDate: new Date(user.createdAt).toLocaleDateString()
        }));

      // Calculate stats
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.orderStatus === 'placed' || o.orderStatus === 'confirmed').length;
      const deliveredOrders = orders.filter(o => o.orderStatus === 'delivered').length;
      const totalRevenue = orders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + (o.finalAmount || 0), 0);

      setStats({
        totalUsers: users.filter(u => u.role !== 'admin').length,
        totalOrders,
        totalDresses: dressesRes.data.dresses?.length || 0,
        totalJewellery: jewelleryRes.data.jewellery?.length || 0,
        totalAds: adsRes.data.ads?.length || 0,
        totalRevenue,
        pendingOrders,
        deliveredOrders
      });

      setRecentOrders(recentOrdersData);
      setRecentUsers(recentUsersData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSalesData = () => {
    const data = [];
    const today = new Date();
    let days = 7;
    let labelFormat = {};

    switch(selectedPeriod) {
      case 'week':
        days = 7;
        labelFormat = { weekday: 'short' };
        break;
      case 'month':
        days = 30;
        labelFormat = { day: 'numeric', month: 'short' };
        break;
      case 'year':
        days = 12;
        labelFormat = { month: 'short' };
        break;
      default:
        days = 7;
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      let label;
      if (selectedPeriod === 'year') {
        label = date.toLocaleDateString('en-US', { month: 'short' });
      } else {
        label = date.toLocaleDateString('en-US', labelFormat);
      }

      // Generate random sales data (replace with real data from backend)
      const sales = Math.floor(Math.random() * 5000) + 1000;
      const orders = Math.floor(Math.random() * 20) + 5;

      data.push({
        label,
        sales,
        orders
      });
    }

    setSalesData(data);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title text-uppercase">Dashboard </h1>
      
      {/* Stats Cards */}
      <div className="stats-grid d-flex flex-row gap-3 mb-5 overflow-auto">
        <div className="stat-card">
          <div className="stat-icon"><i class="bi bi-people"></i></div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.totalUsers)}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><i class="bi bi-box"></i></div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.totalOrders)}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><i class="bi bi-hourglass-split"></i></div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.pendingOrders)}</div>
            <div className="stat-label">Pending Orders</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><i class="bi bi-check-square"></i></div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.deliveredOrders)}</div>
            <div className="stat-label">Delivered</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><i class="bi bi-currency-rupee"></i></div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Revenue</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><i class="bi bi-shop"></i></div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.totalDresses)}</div>
            <div className="stat-label">Dresses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><i class="bi bi-gem"></i></div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.totalJewellery)}</div>
            <div className="stat-label">Jewellery</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><i className="bi bi-badge-ad"></i></div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.totalAds)}</div>
            <div className="stat-label">Active Ads</div>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="chart-section text-uppercase">
        <div className="section-header">
          <h2>Sales Chart</h2>
          <div className="period-selector">
            <button 
              className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('week')}
            >
              Week
            </button>
            <button 
              className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('month')}
            >
              Month
            </button>
            <button 
              className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('year')}
            >
              Year
            </button>
          </div>
        </div>

        <div className="chart-container mt-5 overflow-auto">
          {salesData.map((item, index) => (
            <div key={index} className="chart-bar-group">
              <div className="chart-label">{item.label}</div>
              <div className="chart-bars">
                <div 
                  className="sales-bar"
                  style={{ height: `${(item.sales / 5000) * 100}%` }}
                  title={`Sales: ${formatCurrency(item.sales)}`}
                >
                  <span className="bar-tooltip">{formatCurrency(item.sales)}</span>
                </div>
                <div 
                  className="orders-bar"
                  style={{ height: `${(item.orders / 30) * 100}%` }}
                  title={`Orders: ${item.orders}`}
                >
                  <span className="bar-tooltip">{item.orders} orders</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color sales-color"></span>
            <span>Sales (₹)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color orders-color"></span>
            <span>Orders Count</span>
          </div>
        </div>
      </div>

      {/* Recent Data Tables */}
      <div className="recent-section">
        <div className="recent-orders">
          <h2 className='text-uppercase'>Recent Orders</h2>
          <div className="table-responsive">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-6)}</td>
                      <td>{order.userId?.name || 'N/A'}</td>
                      <td className="amount">{formatCurrency(order.finalAmount)}</td>
                      <td>
                        <span className={`status-badge ${order.orderStatus}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td>{order.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">No recent orders</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="recent-users">
          <h2 className='text-uppercase'>Recent Users</h2>
          <div className="table-responsive">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.joinDate}</td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">No recent users</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;