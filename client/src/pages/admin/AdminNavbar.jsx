import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/AdminNavbar.css';

function AdminNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="dag-premium-admin-nav">
      <div className="dag-nav-wrapper">
        {/* Brand Section */}
        <Link className="dag-brand-zone" to="/admin" onClick={() => setShowMobileMenu(false)}>
          <div >
   

          </div>
          <div className="dag-brand-info text-center">
            <span className="dag-brand-name text-center">DAG <small className='text-black'>Admin</small></span>
           
          </div>
           
        </Link>

        {/* Desktop Navigation */}
        <div className={`dag-main-menu ${showMobileMenu ? 'dag-menu-open' : ''}`} ref={mobileMenuRef}>
          <ul className="dag-nav-links">
            <li><Link to="/admin" className="dag-nav-item"><i className="bi bi-grid-1x2-fill"></i><span>Admin Dashboard</span></Link></li>
            <li><Link to="/admin/dress-management" className="dag-nav-item"><i className="bi bi-tag-fill"></i><span>Dress Management</span></Link></li>
            <li><Link to="/admin/jewellery-management" className="dag-nav-item"><i className="bi bi-gem"></i><span>Jewellery Management</span></Link></li>
             <li><Link to="/admin/ads-management" className="dag-nav-item"><i className="bi bi-badge-ad-fill"></i><span>Ads Management</span></Link></li>
            <li><Link to="/admin/user-management" className="dag-nav-item"><i className="bi bi-shield-lock-fill"></i><span>User Management</span></Link></li>
            <li><Link to="/admin/order-management" className="dag-nav-item"><i className="bi bi-box-fill"></i><span>Order Management</span></Link></li>
          </ul>
        </div>

        {/* Actions & Profile */}
        <div className="dag-action-zone d-flex flex-row gap-2">
                <div className="dag-profile-container" ref={profileMenuRef}>
            <button 
              className={`dag-profile-pill ${showProfileMenu ? 'active' : ''}`} 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="dag-avatar-ring">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="Admin" />
                ) : (
                  <span className="dag-initials">{getInitials(user?.name)}</span>
                )}
                <span className="dag-status-dot"></span>
              </div>
              <span className="dag-admin-name">{user?.name || 'Admin'}</span>
              <i className="bi bi-chevron-down text-white"></i>
            </button>

            <div className={`dag-dropdown-card ${showProfileMenu ? 'dag-show' : ''}`}>
              <div className="dag-dropdown-header">
                <p className="dag-signed-in">Signed in as</p>
                <small className="dag-user-email">{user?.email || 'admin@dag.com'}</small>
              </div>
              <div className="dag-dropdown-body">
  
                <div className="dag-divider"></div>
                <button onClick={handleLogout} className="dag-drop-link dag-logout">
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </div>
            </div>
          </div>
          <button className={`dag-mobile-hamburger mt-3 ${showMobileMenu ? 'active' : ''}`} onClick={() => setShowMobileMenu(!showMobileMenu)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      {showMobileMenu && <div className="dag-glass-overlay" onClick={() => setShowMobileMenu(false)}></div>}
    </nav>
  );
}

export default AdminNavbar;