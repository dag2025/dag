import { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/JewelleryManagement.css";
import API_BASE_URL from "../../Config/Api";
function JewelleryManagement() {
  // ------------------ VIEW STATE ------------------
  const [activeView, setActiveView] = useState("catalog"); // "catalog", "add", "edit"
  const [activeTab, setActiveTab] = useState(0); // 0: Jewellery Catalog, 1: Add Form, 2: Edit Form
  // ------------------ FORM STATE ------------------
  const [form, setForm] = useState({
    name: "",
    category: "",
    material: "",
    color: "",
    occasion: "",
    price: "",
    discount: "",
    finalPrice: "",
    description: ""
  });

  // ------------------ SIZE STATE ------------------
  const [size, setSize] = useState("");
  const [stock, setStock] = useState("");
  const [sizes, setSizes] = useState([]);

  // ------------------ IMAGE STATE ------------------
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // ------------------ JEWELLERY DATA ------------------
  const [jewellery, setJewellery] = useState([]);
  const [editId, setEditId] = useState(null);
  const [selectedJewellery, setSelectedJewellery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ------------------ UI STATE ------------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ------------------ MODAL STATE ------------------
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  // ------------------ EFFECTS ------------------
  useEffect(() => {
    fetchJewellery();
  }, []);

  // Auto-calculate final price
  useEffect(() => {
    const price = parseFloat(form.price) || 0;
    const discount = parseFloat(form.discount) || 0;
    
    if (price > 0) {
      const finalPrice = discount > 0 
        ? price - (price * discount / 100) 
        : price;
      setForm(prev => ({ ...prev, finalPrice: finalPrice.toFixed(2) }));
    }
  }, [form.price, form.discount]);

  // Sync activeTab with activeView
  useEffect(() => {
    switch(activeView) {
      case "catalog":
        setActiveTab(0);
        break;
      case "add":
        setActiveTab(1);
        break;
      case "edit":
        setActiveTab(2);
        break;
      default:
        setActiveTab(0);
    }
  }, [activeView]);

  // ------------------ API FUNCTIONS ------------------
  const fetchJewellery = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/jewellery`);
      setJewellery(response.data.jewellery || []);
    } catch (error) {
      console.error("Error fetching jewellery:", error);
      showErrorModal("Failed to load jewellery", error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------ FORM HANDLERS ------------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addSize = () => {
    if (!size || !stock) {
      setError("Please enter both size and stock");
      return;
    }
    setSizes([...sizes, { size, stock: parseInt(stock) || 0 }]);
    setSize("");
    setStock("");
    setError(null);
  };

  const removeSize = (index) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  // ------------------ EDIT FUNCTION ------------------
  const handleEditClick = (item) => {
    setSelectedJewellery(item);
    setEditId(item._id);
    
    setForm({
      name: item.name || "",
      category: item.category || "",
      material: item.material || "",
      color: item.color || "",
      occasion: item.occasion || "",
      price: item.price || "",
      discount: item.discount || "",
      finalPrice: item.finalPrice || "",
      description: item.description || ""
    });
    
    setSizes(item.sizes || []);
    setImage(null);
    setImagePreview(item.image || "");
    setActiveView("edit"); // This will automatically set activeTab to 2
  };

  // ------------------ DELETE FUNCTION ------------------
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/jewellery/${id}`);
      
      if (response.data.success) {
        setJewellery(jewellery.filter(item => item._id !== id));
        showSuccessModal("Jewellery deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting jewellery:", error);
      showErrorModal("Failed to delete jewellery", error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ SUBMIT HANDLER ------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (!form.name || !form.category || !form.material || !form.price) {
      setError("Name, Category, Material, and Price are required");
      setLoading(false);
      return;
    }

    if (!image && activeView === "add") {
      setError("Image is required");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();

      // Add form fields
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value || "");
      });

      // Add sizes as JSON string
      formData.append("sizes", JSON.stringify(sizes));

      // Add image
      if (image) formData.append("image", image);

      let response;
      let message;
      
      if (activeView === "edit") {
        response = await axios.put(
          `${API_BASE_URL}/jewellery/${editId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        message = "Jewellery updated successfully!";
      } else {
        response = await axios.post(
          `${API_BASE_URL}/jewellery`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        message = "Jewellery added successfully!";
      }

      if (response.data.success) {
        resetForm();
        fetchJewellery();
        setActiveView("catalog"); // This will automatically set activeTab to 0
        showSuccessModal(message);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      const errorMsg = error.response?.data?.message || error.message;
      setError(errorMsg);
      showErrorModal("Operation failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ RESET FORM ------------------
  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      material: "",
      color: "",
      occasion: "",
      price: "",
      discount: "",
      finalPrice: "",
      description: ""
    });
    setSizes([]);
    setImage(null);
    setImagePreview("");
    setSize("");
    setStock("");
    setEditId(null);
    setSelectedJewellery(null);
    setError(null);
  };

  // ------------------ VIEW HANDLERS ------------------
  const handleCatalogClick = () => {
    setActiveView("catalog");
    resetForm();
  };

  const handleAddClick = () => {
    resetForm();
    setActiveView("add");
  };

  // ------------------ MODAL FUNCTIONS ------------------
  const showSuccessModal = (message) => {
    setModalTitle("Success");
    setModalContent(message);
    setShowModal(true);
    setTimeout(() => setShowModal(false), 3000);
  };

  const showErrorModal = (title, message) => {
    setModalTitle(title);
    setModalContent(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent("");
    setModalTitle("");
  };

  const viewDescription = (description) => {
    setModalTitle("Jewellery Description");
    setModalContent(description || "No description available.");
    setShowModal(true);
  };

  // ------------------ CALCULATE TOTAL STOCK ------------------
  const calculateTotalStock = (sizes) => {
    return sizes?.reduce((total, s) => total + (parseInt(s.stock) || 0), 0) || 0;
  };

  // ------------------ RENDER ------------------
  return (
    <div className="jewellery-management-container ">
      <h1 className="main-title text-uppercase">Jewellery Management System</h1>

      {/* VIEW TOGGLE BUTTONS */}
      <div className="view-toggles">
        <button 
          className={`toggle-btn ${activeTab === 0 ? "active" : ""}`}
          onClick={handleCatalogClick}
        >
          <span className="icon"></span> Jewellery Catalog
        </button>
        <button 
          className={`toggle-btn ${activeTab === 1 ? "active" : ""}`}
          onClick={handleAddClick}
        >
          <span className="icon"></span> Add Jewellery
        </button>
        {activeTab === 2 && (
          <button className="toggle-btn edit-mode active">
            <span className="icon"></span> Edit Mode
          </button>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* ADD/EDIT FORM - Show when activeTab is 1 (Add) or 2 (Edit) */}
      {(activeTab === 1 || activeTab === 2) && (
        <div className="form-card">
          <div className="form-header">
            <h2>{activeTab === 1 ? "Add New Jewellery" : `Edit: ${selectedJewellery?.name || "Jewellery"}`}</h2>
          </div>
          <div className="form-body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Left Column */}
                <div className="form-left">
                  <div className="form-group">
                    <label>Jewellery Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={form.name} 
                      onChange={handleChange} 
                      placeholder="Eg: jimikki"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <input 
                      type="text" 
                      name="category" 
                      value={form.category} 
                      onChange={handleChange} 
                      placeholder="Eg: ring"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Material *</label>
                    <input 
                      type="text" 
                      name="material" 
                      value={form.material} 
                      onChange={handleChange} 
                      placeholder="Eg: copper brass"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label>Color</label>
                      <input 
                        type="text" 
                        name="color" 
                        value={form.color} 
                        onChange={handleChange} 
                        placeholder="Eg: silver"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group half">
                      <label>Occasion</label>
                      <input 
                        type="text" 
                        name="occasion" 
                        value={form.occasion} 
                        onChange={handleChange} 
                        placeholder="Eg: party wear"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label>Price (₹) *</label>
                      <input 
                        type="number" 
                        name="price" 
                        value={form.price} 
                        onChange={handleChange} 
                        placeholder="Eg: 1200"
                        min="0"
                        step="0.01"
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="form-group half">
                      <label>Discount (%)</label>
                      <input 
                        type="number" 
                        name="discount" 
                        value={form.discount} 
                        onChange={handleChange} 
                        placeholder="Eg: 10"
                        min="0"
                        max="100"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Final Price (₹)</label>
                    <input 
                      type="text" 
                      name="finalPrice" 
                      value={form.finalPrice} 
                      placeholder="Auto calculated"
                      disabled
                      className="auto-calc"
                    />
                    <small className="field-hint">Auto-calculated from price and discount</small>
                  </div>
                </div>

                {/* Right Column */}
                <div className="form-right">
                  {/* Size Management */}
                  <div className="size-section">
                    <label>Sizes (Inches) & Stock</label>
                    <div className="size-input-group">
                      <input 
                        type="text" 
                        value={size} 
                        onChange={(e) => setSize(e.target.value)} 
                        placeholder="Size (5.2inch)"
                        disabled={loading}
                      />
                      <input 
                        type="number" 
                        value={stock} 
                        onChange={(e) => setStock(e.target.value)} 
                        placeholder="Stock"
                        min="0"
                        disabled={loading}
                      />
                      <button 
                        type="button" 
                        onClick={addSize} 
                        className="add-size-btn"
                        disabled={loading}
                      >
                        Add Size
                      </button>
                    </div>

                    {sizes.length > 0 && (
                      <div className="sizes-list">
                        {sizes.map((s, i) => (
                          <div key={i} className="size-item">
                            <span className="size-badge">{s.size}</span>
                            <span className="stock-badge">Stock: {s.stock}</span>
                            <button 
                              type="button" 
                              onClick={() => removeSize(i)}
                              className="remove-size-btn"
                              disabled={loading}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      name="description" 
                      value={form.description} 
                      onChange={handleChange} 
                      placeholder="Eg: good product..."
                      rows="4"
                      disabled={loading}
                    ></textarea>
                  </div>

                  {/* Image Upload */}
                  <div className="form-group">
                    <label>Jewellery Image {activeTab === 1 && "*"}</label>
                    <div className="image-upload-container">
                      <input 
                        type="file" 
                        id="imageUpload"
                        accept="image/*" 
                        onChange={handleImageChange} 
                        disabled={loading}
                        className="file-input"
                      />
                      <label htmlFor="imageUpload" className="file-label">
                        <span className="upload-icon"></span>
                        Choose Image
                      </label>
                      <p className="image-hint">Single image only allowed for jewellery</p>
                    </div>
                    
                    {imagePreview && (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button 
                          type="button" 
                          className="remove-image"
                          onClick={() => {
                            setImage(null);
                            setImagePreview("");
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    
                    {activeTab === 2 && !image && selectedJewellery?.image && (
                      <div className="current-image">
                        <small>Current Image:</small>
                        <img src={selectedJewellery.image} alt="Current" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions d-flex flex-row">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : activeTab === 2 ? (
                    "Update Jewellery"
                  ) : (
                    "Add Jewellery"
                  )}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleCatalogClick}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="reset-btn"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Reset 
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JEWELLERY CATALOG TABLE - Show when activeTab is 0 */}
      {activeTab === 0 && (
        <div className="catalog-section">
          <div className="catalog-header">
            <h2> Jewellery Catalog</h2>
            <div className="catalog-stats">
              <span className="total-count">Total: {jewellery.length} items</span>
              <button className="refresh-btn" onClick={fetchJewellery} disabled={isLoading}>
                {isLoading ? "Loading..." : " Refresh"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="spinner-large"></div>
              <p>Loading jewellery collection...</p>
            </div>
          ) : jewellery.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <h3>No Jewellery Found</h3>
              <p>Click "Add Jewellery" to add your first piece!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="jewellery-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Material</th>
                    <th>Color</th>
                    <th>Sizes & Stock</th>
                    <th>Price</th>
                    <th>Disc.</th>
                    <th>Final</th>
                    <th>Occasion</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jewellery.map((item) => (
                    <tr key={item._id}>
                      {/* Image */}
                      <td className="image-cell">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="table-image"
                            onClick={() => window.open(item.image, '_blank')}
                          />
                        ) : (
                          <div className="no-image">No image</div>
                        )}
                      </td>
                      
                      {/* Basic Info */}
                      <td className="name-cell">{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.material}</td>
                      <td>
                        {item.color ? (
                          <span className="color-badge" style={{ 
                            backgroundColor: item.color.toLowerCase(),
                            color: ['white', 'yellow', 'lightblue', 'pink'].includes(item.color.toLowerCase()) ? 'black' : 'white'
                          }}>
                            {item.color}
                          </span>
                        ) : '-'}
                      </td>
                      
                      {/* Sizes & Stock */}
                      <td className="sizes-cell">
                        {item.sizes && item.sizes.length > 0 ? (
                          <div className="size-stock-list">
                            {item.sizes.map((s, idx) => (
                              <div key={idx} className="size-stock-item">
                                <span className="size-tag">{s.size}</span>
                                <span className="stock-tag">{s.stock}</span>
                              </div>
                            ))}
                            <div className="total-stock">
                              Total: {calculateTotalStock(item.sizes)} units
                            </div>
                          </div>
                        ) : (
                          <span className="no-data">No sizes</span>
                        )}
                      </td>
                      
                      {/* Pricing */}
                      <td className="price-cell">₹{item.price}</td>
                      <td className="discount-cell">{item.discount > 0 ? `${item.discount}%` : '-'}</td>
                      <td className="final-price-cell">₹{item.finalPrice || item.price}</td>
                      
                      {/* Occasion */}
                      <td>{item.occasion || '-'}</td>
                      
                      {/* Description */}
                      <td className="description-cell">
                        {item.description ? (
                          <>
                            <div className="description-preview">
                              {item.description.length > 50 
                                ? `${item.description.substring(0, 50)}...` 
                                : item.description
                              }
                            </div>
                            {item.description.length > 50 && (
                              <button 
                                className="read-more-btn"
                                onClick={() => viewDescription(item.description)}
                              >
                                Read more
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="no-data">No description</span>
                        )}
                      </td>
                      
                      {/* Actions */}
                      <td className="actions-cell">
                        <button 
                          className="btn btn-sm"
                          onClick={() => handleEditClick(item)}
                          disabled={loading}
                          title="Edit"
                        >
                          <i className="bi bi-pencil-fill text-dark"></i>
                        </button>
                        <button 
                          className="btn btn-sm "
                          onClick={() => handleDelete(item._id, item.name)}
                          disabled={loading}
                          title="Delete"
                        >
                          <i className="bi bi-trash-fill "></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay bg-white  d-flex mx-auto border-" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalTitle}</h3>
              <button className="modal-close" onClick={closeModal}><i className="bi-x-lg position-fixed text-danger"></i></button>
            </div>
            <div className="modal-body">
              {modalContent}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-danger" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
}

export default JewelleryManagement;