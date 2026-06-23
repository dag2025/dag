import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CategoryBanner from '../../assets/category-banner.svg';

import API_BASE_URL from '../../Config/Api';

function Category() {
  const [activeTab, setActiveTab] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dressCategories, setDressCategories] = useState([]);
  const [jewelleryCategories, setJewelleryCategories] = useState([]);
  const [searchCategory, setSearchCategory] = useState('');

  const handleClose = () => {
    setActiveTab(null);
    setSearchCategory('');
  };

  useEffect(() => { fetchAllCategories(); }, []);

  const fetchAllCategories = async () => {
    try {
      const [dressesRes, jewelleryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dresses`),
        axios.get(`${API_BASE_URL}/jewellery`)
      ]);
      const dressCats = [...new Set((dressesRes.data.dresses || []).map(d => d.category).filter(Boolean).map(c => c.trim()))].sort();
      const jewelCats = [...new Set((jewelleryRes.data.jewellery || []).map(j => j.category).filter(Boolean).map(c => c.trim()))].sort();
      setDressCategories(dressCats);
      setJewelleryCategories(jewelCats);
    } catch (error) { console.error('Error:', error); }
  };

  useEffect(() => {
    if (activeTab) fetchProductsByCategory(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const filtered = products.filter(product => 
      product.category?.toLowerCase().includes(searchCategory.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchCategory, products]);

  const fetchProductsByCategory = async (category) => {
    setLoading(true);
    try {
      const [dressesRes, jewelleryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dresses`),
        axios.get(`${API_BASE_URL}/jewellery`)
      ]);
      const allProducts = [
        ...(dressesRes.data.dresses?.map(d => ({ ...d, type: 'dress' })) || []),
        ...(jewelleryRes.data.jewellery?.map(j => ({ ...j, type: 'jewellery' })) || [])
      ];
      setProducts(allProducts.filter(p => p.category?.toLowerCase() === category.toLowerCase()));
    } finally { setLoading(false); }
  };

  const isMatch = (cat) => !searchCategory || cat.toLowerCase().includes(searchCategory.toLowerCase());

  return (
    <>
      <style>{`
        /* Core Layout - Forced Side-by-Side */
        .split-screen {
          display: flex;
          flex-direction: row; /* Horizontal layout on ALL screens */
          height: 100vh;
          width: 98vw;
          overflow: hidden;
          background: #fafafa;
        }

        .left-banner {
          flex: 0 0 35%; /* Fixed ratio for Mobile/Tablet */
          height: 100vh;
          position: relative;
        }

        @media (min-width: 1024px) {
          .left-banner { flex: 0 0 30%; } /* Slightly slimmer on Desktop */
        }

        .left-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.9);
        }

        .right-content {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          padding: 2rem;
          scroll-behavior: smooth ;
        }

        /* Search Header with Glassmorphism */
        .search-wrapper {
          position: sticky;
          top: -2rem;
          margin: -2rem -2rem 2rem -2rem;
          padding: 3rem 2rem 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          z-index: 100;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .custom-search-input {
          height: 55px;
          border: none;
         border-bottom:2px solid #ed3545;
          padding-left: 20px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .custom-search-input:focus {
          background: #fff;
          box-shadow: 0 10px 20px rgba(237, 53, 69, 0.1);
           border-bottom:2px solid #ed3545;
        }

        /* Modern Category Pills */
        .category-pill {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 16px;
          padding: 1.2rem 1rem;
          text-align: center;
          cursor: pointer;
          transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-weight: 600;
          color: #444;
          font-size: 0.9rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .category-pill:hover:not(.dim) {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.08);
          border-color: #ed3545;
          color: #ed3545;
        }

        .category-pill.highlight {
          border-left: 4px solid #ed3545;
          background: #fff;
        }

        .category-pill.dim {
          opacity: 0.4;
          filter: grayscale(1);
          cursor: not-allowed;
        }

        /* Sidebar Product Styling */
        .custom-sidebar {
          width: 450px;
          max-width: 75vw;
          height: 100vh;
          position: fixed;
          top: 0; right: 0;
          background: white;
          z-index: 2000;
          transform: translateX(100%);
          transition: 0.5s cubic-bezier(0.77, 0, 0.175, 1);
          box-shadow: -20px 0 50px rgba(0,0,0,0.1);
        }

        .custom-sidebar.show { transform: translateX(0); }

        .product-mini-card {
          background: #fff;
          border-radius: 5px;
          height: 400px;
          
          border: 1px solid #f0f0f0;
          transition: 0.3s ease;
        }

        .product-mini-card:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }

        .btn-view {
          background: #ed3545;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          padding: 8px;
          transition: 0.3s;
        }

        .btn-view:hover {
          background: #c12a38;
          color: white;
        }

/* Scrollbar width */
.right-content::-webkit-scrollbar,
.scrollbar::-webkit-scrollbar {
  width: 8px;
  
}

/* Track (background) */
.right-content::-webkit-scrollbar-track,
.scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

/* Thumb (scroll handle) */
.right-content::-webkit-scrollbar-thumb,
.scrollbar::-webkit-scrollbar-thumb {
  background: #554a4b; /* your theme color */
  border-radius: 10px;
}

/* Hover effect */
.right-content::-webkit-scrollbar-thumb:hover,
.scrollbar::-webkit-scrollbar-thumb:hover {
  background: #f7354f;
}
}
.right-content,
.scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #ed3545 #f1f1f1; /* thumb track */
}


      `}</style>

      <div className="split-screen mb-4">
        <div className="left-banner">
          <img src={CategoryBanner} alt="Fashion" />
        </div>

        <div className="right-content">
          <div className="search-wrapper">
            <span className="text-danger fw-bold text-uppercase small" style={{letterSpacing: '2px'}}>Premium Collection</span>
            <h2 className="fw-bold mb-4 text-uppercase" style={{color: '#1a1a1a'}}>Explore Categories</h2>
            <div className="d-flex flex-row ">
            <input
              type="text"
              className="form-control custom-search-input"
              placeholder="Search for category..."
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            />
            <i className="bi bi-search-heart mt-3"></i>
            </div>
          </div>

          <section className="mb-5">
            <h6 className="section-title mb-4 text-start text-uppercase">Dress Categories</h6>
            <div className="row g-3" >
              {dressCategories.map(cat => (
                <div key={cat} className="col-6 col-md-4">
                  <div 
                    className={`category-pill ${isMatch(cat) ? 'highlight' : 'dim'}`}
                    onClick={() => isMatch(cat) && setActiveTab(cat)}
                  >
                    {cat}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-5">
            <h6 className="section-title mb-4 text-start text-uppercase">Jewellery Categories</h6>
            <div className="row g-3">
              {jewelleryCategories.map(cat => (
                <div key={cat} className="col-6 col-md-4">
                  <div 
                    className={`category-pill ${isMatch(cat) ? 'highlight' : 'dim'}`}
                    onClick={() => isMatch(cat) && setActiveTab(cat)}
                  >
                    {cat}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Sidebar - Remains functional and professional */}
      <div className={`custom-sidebar ${activeTab ? 'show' : ''}`}>
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0 fw-bold">{activeTab}</h4>
            <p className="text-muted small mb-0">{filteredProducts.length} items available</p>
          </div>
          <button className="btn-close" onClick={handleClose}></button>
        </div>
        
        <div className="overflow-auto h-100 p-3 pb-5 scrollbar">
          {loading ? (
             <div className="text-center mt-5"><div className="spinner-border text-danger"></div></div>
          ) : (
            <div className="row g-3">
              {filteredProducts.map(product => (
                <div key={product._id} className="col-6">
                  <div className="product-mini-card ">
                    <img src={product.images?.cover || product.image} className="w-100" style={{height: '290px', objectFit: 'cover'}} alt="" />
                    <div className="p-2">
                      <p className="small mb-1 text-truncate fw-bold">{product.name}</p>
                      <p className="text-danger fw-bold mb-2">₹{product.finalPrice}</p>
                      <Link to={`/${product.type}/${product._id}`} className="btn btn-view btn-sm w-100">Explore</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeTab && <div className="custom-backdrop" style={{zIndex: 1500, background: 'rgba(0,0,0,0.2)', position:'fixed', inset:0, backdropFilter: 'blur(4px)'}} onClick={handleClose}></div>}
    </>
  );
}

export default Category;