import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../Config/Api';
function AdsManagement() {
  const [activeTab,setActiveTab]=useState(0);
  const [showTable, setShowTable] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [ads, setAds] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    mediaType: 'image',
    media: null
  });
  const [previewUrl, setPreviewUrl] = useState('');

  // Fetch ads and products on component mount
  useEffect(() => {
    fetchAds();
    fetchProducts();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ads`);
      if (response.data.success) {
        setAds(response.data.ads);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ads/products`);
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, media: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('mediaType', formData.mediaType);
      if (formData.media) {
        formDataToSend.append('media', formData.media);
      }

      const response = await axios.post(
        '${API_BASE_URL}/ads',
        formDataToSend,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        alert('Ad created successfully!');
        setFormData({ title: '', mediaType: 'image', media: null });
        setPreviewUrl('');
        fetchAds();
      }
    } catch (error) {
      console.error('Error creating ad:', error);
      alert('Failed to create ad: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProduct = async (adId, product) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/ads/${adId}/link-product`,
        {
          productType: product.type,
          productId: product._id
        }
      );

      if (response.data.success) {
        alert(`Product linked successfully!`);
        setShowTable(false);
        setSelectedAd(null);
        fetchAds();
      }
    } catch (error) {
      console.error('Error linking product:', error);
      alert('Failed to link product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (adId) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/ads/${adId}`);
      if (response.data.success) {
        alert('Ad deleted successfully!');
        fetchAds();
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Failed to delete ad: ' + (error.response?.data?.message || error.message));
    }
  };

  // Internal Styles
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1050,
    },
    tableContainer: {
      backgroundColor: 'white',
      width: '90%',
      maxWidth: '1000px',
      maxHeight: '80vh',
      overflowY: 'auto',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      position: 'sticky',
      textAlign:'center',
      top: 0,
      backgroundColor: '#ed3545',
      color: 'white',
      padding: '15px',
      zIndex: 1,
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #e0e0e0',
      textAlign: 'center',
      verticalAlign: 'middle'
    }
  };

  return (
    <>
    <style>{`
      .ad-container {
        background-color: #ffffff;
        border-radius: 10px;
        padding: 20px;
      
      }
        .ad-container .card-header{
          background-color: #ffffff;
          color: #ed3545;
          border: 1px solid #ed3545;
        }
          .ad-container .btn {
            background-color: #ed3545;
            color: white;
          }
            .ad-container .btn:hover {
              background-color: #ffffff;
              color: black;
              border: 1px solid #ed3545;
            }
    `}</style>
      <div className="container-fluid ad-container mt-3" style={{ maxWidth: '90%' }}>
        <h1 className="text-center mb-4"> Ads Management System</h1>
        <div className="d-flex flex-row justify-content-between gap-5 mb-3">
          <button
            className={`btn  ${activeTab === 0 ? 'btn-danger' : 'btn-outline-danger'} btn-sm`}
            onClick={() => setActiveTab(1)}
          >
            Create Ad
          </button>
          <button
            className={`btn ${activeTab === 1 ? 'btn-danger' : 'btn-outline-danger'} btn-sm`}
            onClick={() => setActiveTab(0)}
          >
             Ads Catalog
          </button>
        </div>

        {/* Create Ad Form */}
        {activeTab === 1 && (
        <div className="card mb-5">
          <div className="card-header ">
            <h4 className="mb-0">Create New Ad</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Ad Title</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter ad title"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Media Type</label>
                    <select
                      className="form-select"
                      name="mediaType"
                      value={formData.mediaType}
                      onChange={handleInputChange}
                    >
                      <option value="image"><i className="bi bi-image"></i> Image</option>
                      <option value="video"><i className="bi bi-video"></i> Video</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Upload Media</label>
                    <input
                      type="file"
                      className="form-control"
                      accept={formData.mediaType === 'image' ? 'image/*' : 'video/*'}
                      onChange={handleMediaChange}
                      required
                    />
                    <small className="text-muted">
                      {formData.mediaType === 'image' ? 'Supported: JPG, PNG, GIF' : 'Supported: MP4, WebM'}
                    </small>
                  </div>
                </div>

                <div className="col-md-6">
                  {previewUrl && (
                    <div className="preview-section">
                      <h5>Preview:</h5>
                      {formData.mediaType === 'image' ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                        />
                      ) : (
                        <video
                          src={previewUrl}
                          controls
                          style={{ maxWidth: '100%', maxHeight: '200px' }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-end">
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Creating...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
)}
        {/* Ads Catalog */}
        {activeTab === 0 && (
        <div className="ads-catalog">
          <h3 className="text-center mb-4"> Ads Catalog</h3>
          
          {ads.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No ads created yet.</p>
            </div>
          ) : (
            <div className="row">
              {ads.map((ad) => (
                <div key={ad._id} className="col-md-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    {ad.mediaType === 'image' ? (
                      <img
                        src={ad.mediaUrl}
                        className="card-img-top"
                        alt={ad.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                    ) : (
                      <video
                        src={ad.mediaUrl}
                        className="card-img-top"
                        style={{ height: '200px', objectFit: 'cover' }}
                        controls
                      />
                    )}
                    
                    <div className="card-body">
                      <h5 className="card-title">{ad.title}</h5>
                      
                      {ad.productDetails ? (
                        <div className="linked-product mb-3 p-2 bg-light rounded">
                          <small className="text-muted">Linked Product:</small>
                          <p className="mb-1">
                            <strong>{ad.productDetails.name}</strong>
                            <span className="badge bg-info ms-2">
                              {ad.linkedProduct.productType}
                            </span>
                          </p>
                          <small>Price: ₹{ad.productDetails.finalPrice || ad.productDetails.price}</small>
                        </div>
                      ) : (
                        <p className="text-warning mb-3">No product linked</p>
                      )}

                      <div className="d-flex justify-content-between">
                        {!ad.productDetails && (
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              setSelectedAd(ad);
                              setShowTable(true);
                            }}
                          >
                            Link Product
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(ad._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Product Selection Modal */}
      {showTable && (
        <div style={styles.overlay} onClick={() => setShowTable(false)}>
          <div style={styles.tableContainer} onClick={(e) => e.stopPropagation()}>
            <div className="p-3 bg-light border-bottom">
              <h5 className="mb-0">Select Product to Link</h5>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Image</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={`${product.type}-${product._id}`}>
                    <td style={styles.td}>
                      <img
                        src={product.image || 'https://via.placeholder.com/50'}
                        alt={product.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </td>
                    <td style={styles.td}>
                      <span className={`badge bg-${product.type === 'dress' ? 'primary' : 'success'}`}>
                        {product.type}
                      </span>
                    </td>
                    <td style={styles.td}>{product.name}</td>
                    <td style={styles.td}>{product.category}</td>
                    <td style={styles.td}>₹{product.finalPrice || product.price}</td>
                    <td style={styles.td}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleLinkProduct(selectedAd._id, product)}
                      >
                        Link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 text-end border-top">
              <button className="btn btn-secondary" onClick={() => setShowTable(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdsManagement;