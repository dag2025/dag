import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import Logo from '../../assets/logo.png';
import '../../styles/Navbar.css';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth(); // ✅ Fixed: Added isAuthenticated here
  const { cartCount, fetchCart } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { wishlistCount } = useWishlist();
  const divRef = useRef(null);
  const userMenuRef = useRef(null);



  // Fetch cart count when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const handleLogout = () => {
    logout();
    setIsVisible(false);
    setShowUserMenu(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header >
  <div class="scroll-box border-bottom">
  <div class="scroll-content fw-bold">
   
    <span class="mx-4">Fast Delivery</span><span>|</span>
    <span class="mx-4">Earn Dag Coins</span><span>|</span>
    <span class="mx-4">Fast Return Policy</span><span>|</span>
    <span class="mx-4">Fast Refund Policy</span><span>|</span>
    <span class="mx-4">24/7 Expert Support</span><span>|</span>
    <span class="mx-4">Fantastic AI Features</span><span>|</span>
    <span class="mx-4">Create Combos</span><span>|</span>
    <span class="mx-4">Send Gifts</span><span>|</span>

   
    <span class="mx-4">Fast Delivery</span><span>|</span>
    <span class="mx-4">Earn Dag Coins</span><span>|</span>
    <span class="mx-4">Fast Return Policy</span><span>|</span>
    <span class="mx-4">Fast Refund Policy</span><span>|</span>
    <span class="mx-4">24/7 Expert Support</span><span>|</span>
    <span class="mx-4">Fantastic AI Features</span><span>|</span>
    <span class="mx-4">Create Combos</span><span>|</span>
    <span class="mx-4">Send Gifts</span><span>|</span>
  </div>
</div>


      <nav className="container-fluid d-flex justify-content-between align-items-center py-2 px-4 border-bottom">
        {/* Left Menu */}
        <ul className="d-flex list-unstyled gap-3 mb-0">
          <li>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              setIsVisible(!isVisible);
            }} className="menu-trigger">
              <i className={`bi ${isVisible ? 'bi-x-lg' : 'bi-list'}`}></i>
            </a>
          </li>
          <li><Link to="/search"><i className='bi bi-search'></i></Link></li>
                    <li className="wishlist-icon-container">
  <Link to="/wishlist" className="position-relative">
    <i className='bi bi-heart'></i>
    {isAuthenticated && wishlistCount > 0 && (
      <span className="wishlist-badge">
        {wishlistCount > 99 ? '99+' : wishlistCount}
      </span>
    )}
  </Link>
</li>
        </ul>

        {/* Logo */}
        <div className="flex-grow-1 text-center">
          <Link to="/">
            <img src={Logo} alt="Logo" style={{ height: '40px' }} className="mx-auto d-block logo" />
          </Link>
        </div>

        {/* Right Menu */}
        <ul className="d-flex list-unstyled gap-3 mb-0 align-items-center">

          <li className="cart-icon-container">
            <Link to="/cart" className="position-relative">
              <i className='bi bi-cart'></i>
              {isAuthenticated && cartCount > 0 && (
                <span className="cart-badge">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </li>
          <li className="user-menu-container" ref={userMenuRef}>
            {isAuthenticated && user ? (
              <div className="user-menu-trigger" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt={user.name} />
                  ) : (
                    <span className="avatar-initials">{getInitials(user.name)}</span>
                  )}
                </div>
                <span className="user-name">{user.name.split(' ')[0]}</span>
                <i className={`bi ${showUserMenu ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </div>
            ) : (
              <i className='bi bi-person-circle' onClick={() => setShowUserMenu(!showUserMenu)}></i>
            )}

            {/* User Dropdown Menu */}
            <div className={`user-dropdown ${showUserMenu ? 'show' : ''}`}>
              {isAuthenticated && user ? (
                <>
                  <div className="user-info">
                    <div className="user-detail">
                      <i className="bi bi-person-circle"></i>
                      <div>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item mx-3" onClick={() => setShowUserMenu(false)}>
                    <i className="bi bi-person"></i> My Profile
                  </Link>
                  <Link to="/orders" className="dropdown-item mx-3" onClick={() => setShowUserMenu(false)}>
                    <i className="bi bi-box"></i> My Orders
                  </Link>
                  <Link to="/wishlist" className="dropdown-item mx-3" onClick={() => setShowUserMenu(false)}>
                    <i className="bi bi-heart"></i> Wishlist
                  </Link>
                  <Link to="/profile" className="dropdown-item mx-3" onClick={() => setShowUserMenu(false)}>
                    <i className="bi bi-gear"></i> Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout mx-3" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </button>
                </>
              ) : (
                <div className="auth-options">
                  <h6>Welcome to DAG!</h6>
                  <p>Login to access your account</p>
                  <Link to="/login" className="auth-btn login-btn" onClick={() => setShowUserMenu(false)}>
                    <i className="bi bi-box-arrow-in-right"></i> Login
                  </Link>
                  <Link to="/signup" className="auth-btn signup-btn" onClick={() => setShowUserMenu(false)}>
                    <i className="bi bi-person-plus"></i> Sign Up
                  </Link>
                </div>
              )}
            </div>
          </li>
        </ul>
      </nav>

      {/* Sidebar Menu */}
      <div className={`sidebar ${isVisible ? 'open' : ''}`} ref={divRef}>
        <div className="sidebar-header">
          {isAuthenticated && user ? (
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {getInitials(user.name)}
              </div>
              <div className="sidebar-user-info">
                <h6>{user.name}</h6>
                <p>{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="sidebar-guest">
              <h6>Welcome Guest!</h6>
              <div className="guest-actions">
                <Link to="/login" className="guest-btn" onClick={() => setIsVisible(false)}>
                  <i className="bi bi-box-arrow-in-right"></i> Login
                </Link>
                <Link to="/signup" className="guest-btn" onClick={() => setIsVisible(false)}>
                  <i className="bi bi-person-plus"></i> Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-menu">
          <div className="menu-section">
            <h5> Dress Collections</h5>
            <ul>
              <li><Link to="/dress" onClick={() => setIsVisible(false)}>Explore Dresses</Link></li>
               <li><Link to="/category" onClick={() => setIsVisible(false)}>Dress Categories</Link></li>
              <li><Link to="/dress" onClick={() => setIsVisible(false)}>New Arrivals</Link></li>
              <li><Link to="/dress" onClick={() => setIsVisible(false)}>Best Offers</Link></li>
            </ul>
          </div>

          <div className="menu-section">
            <h5> Jewellery Collections</h5>
            <ul>
              <li><Link to="/jewellery" onClick={() => setIsVisible(false)}>Explore Jewellery</Link></li>
               <li><Link to="/category" onClick={() => setIsVisible(false)}>Jewellery Categories</Link></li>
              <li><Link to="/jewellery" onClick={() => setIsVisible(false)}>New Arrivals</Link></li>
              <li><Link to="/jewellery" onClick={() => setIsVisible(false)}>Best Offers</Link></li>
            </ul>
          </div>

          <div className="menu-section">
            <h5>Best Features</h5>
            <ul>
              <li><Link to="/combos" onClick={() => setIsVisible(false)}>Create Combos</Link></li>
              <li><Link to="/combos" onClick={() => setIsVisible(false)}>Send Gifts</Link></li>
              <li><Link to="/" onClick={() => setIsVisible(false)}>AI Stylist</Link></li>
            </ul>
          </div>
        </div>

        <div className="sidebar-footer">
          {isAuthenticated && (
            <button className="sidebar-logout" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i> Logout
            </button>
          )}
          <div className="social-media">
            <a href="#" className="social-icon"><i className="bi bi-facebook"></i></a>
            <a href="#" className="social-icon"><i className="bi bi-instagram"></i></a>
            <a href="#" className="social-icon"><i className="bi bi-whatsapp"></i></a>
            <a href="#" className="social-icon"><i className="bi bi-youtube"></i></a>
          </div>
        </div>
      </div>

      {/* Overlay for sidebar */}
      {isVisible && <div className="sidebar-overlay" onClick={() => setIsVisible(false)}></div>}
    </header>
  );
}

export default Navbar;