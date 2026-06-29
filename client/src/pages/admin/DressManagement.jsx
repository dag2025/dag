import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import "../../styles/DressManagement.css";
import API_BASE_URL from "../../Config/Api";
const DressManagement = React.memo(() => {
  // ------------------ STATES ------------------
  const [activeView, setActiveView] = useState("catalog"); // "catalog", "add", "edit"
    const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    discount: "",
    material: "",
    color: "",
    occasion: "",
    description: "",
  });

  const [size, setSize] = useState("");
  const [stock, setStock] = useState("");
  const [sizes, setSizes] = useState([]);

  const [meterSize, setMeterSize] = useState("");
  const [meterStock, setMeterStock] = useState("");
  const [meterSizes, setMeterSizes] = useState([]);

  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const [dresses, setDresses] = useState([]);
  const [editId, setEditId] = useState(null);
  const [isLoadingDresses, setIsLoadingDresses] = useState(true);
  const [selectedDress, setSelectedDress] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  // ------------------ FETCH DRESSES ------------------
  const fetchDresses = useCallback(async () => {
    setIsLoadingDresses(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/dresses`);
      setDresses(response.data.dresses || []);
    } catch (error) {
      console.error("Error fetching dresses:", error);
      setError("Failed to load dresses");
    } finally {
      setIsLoadingDresses(false);
    }
  }, []);

  useEffect(() => {
    fetchDresses();
  }, [fetchDresses]);

  // ------------------ FORM HANDLERS ------------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
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

  const addMeterSize = () => {
    if (!meterSize || !meterStock) {
      setError("Please enter both meter size and stock");
      return;
    }
    setMeterSizes([...meterSizes, { size: meterSize, stock: parseInt(meterStock) || 0 }]);
    setMeterSize("");
    setMeterStock("");
    setError(null);
  };

  const removeSize = (index) => setSizes(sizes.filter((_, i) => i !== index));
  const removeMeterSize = (index) => setMeterSizes(meterSizes.filter((_, i) => i !== index));

  // ------------------ IMAGE HANDLERS ------------------
  const handleCoverImageChange = (e) => {
    if (e.target.files[0]) setCoverImage(e.target.files[0]);
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setGalleryImages(files);
    setGalleryPreviews(files.map(file => URL.createObjectURL(file)));
  };

  // ------------------ EDIT & DELETE ------------------
  const handleEditClick = (dress) => {
    setSelectedDress(dress);
    setEditId(dress._id);
    setForm({
      name: dress.name || "",
      category: dress.category || "",
      price: dress.price || "",
      discount: dress.discount || "",
      material: dress.material || "",
      color: dress.color || "",
      occasion: dress.occasion || "",
      description: dress.description || "",
    });
    setSizes(dress.sizes || []);
    setMeterSizes(dress.meterSizes || []);
    setCoverImage(null);
    setGalleryImages([]);
    setGalleryPreviews([]);
    setActiveView("edit");
    setActiveTab(2);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/dresses/${id}`);
      setDresses(prev => prev.filter(d => d._id !== id));
      showSuccessModal("Dress deleted successfully!");
    } catch (error) {
      showErrorModal("Delete failed", error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ SUBMIT (CREATE/UPDATE) ------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value || ""));
      formData.append("sizes", JSON.stringify(sizes));
      formData.append("meterSizes", JSON.stringify(meterSizes)); // ✅ ensure meterSizes are sent
      if (coverImage) formData.append("cover", coverImage);
      galleryImages.forEach(img => formData.append("gallery", img));

      let response;
      if (activeView === "edit") {
        response = await axios.put(`${API_BASE_URL}/dresses/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        response = await axios.post(`${API_BASE_URL}/dresses`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      if (response.data.success) {
        showSuccessModal(activeView === "edit" ? "Dress updated!" : "Dress added!");
        resetForm();
        fetchDresses();
        setActiveView("catalog");
      }
    } catch (error) {
      showErrorModal("Operation failed", error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ RESET FORM ------------------
  const resetForm = () => {
    setForm({
      name: "", category: "", price: "", discount: "", material: "", color: "", occasion: "", description: ""
    });
    setSizes([]);
    setMeterSizes([]);
    setCoverImage(null);
    setGalleryImages([]);
    setGalleryPreviews([]);
    setSize("");
    setStock("");
    setMeterSize("");
    setMeterStock("");
    setEditId(null);
    setSelectedDress(null);
    setError(null);
    setActiveTab(0);
  };

  // ------------------ MODAL ------------------
  const showSuccessModal = (msg) => {
    setModalTitle("Success");
    setModalContent(msg);
    setShowModal(true);
  };

  const showErrorModal = (title, msg) => {
    setModalTitle(title);
    setModalContent(msg);
    setShowModal(true);
  };

  const viewDescription = (desc) => {
    setModalTitle("Description");
    setModalContent(desc || "No description available.");
    setShowModal(true);
  };

  const viewGallery = (gallery) => {
    setModalTitle("Gallery");
    setModalContent(
      <div className="row g-3">
        {gallery?.map((img, idx) => (
          <div key={idx} className="col-md-6">
            <img src={img} alt={`Gallery ${idx+1}`} className="img-fluid rounded" style={{ maxHeight: "200px", objectFit: "cover" }} />
          </div>
        ))}
      </div>
    );
    setShowModal(true);
  };

  // ------------------ MEMOIZED TOTAL STOCK ------------------
  const totalStock = useMemo(() => (sizes) => {
    return sizes?.reduce((sum, s) => sum + (parseInt(s.stock) || 0), 0) || 0;
  }, []);

  // ------------------ RENDER ------------------
  return (
    <div className="dress-management container-fluid mt-4">
      <h2 className="text-center mb-4 text-uppercase" style={{ color: "#000000" }}>Dress Management System</h2>

 {/* TABS */}
<div className="d-flex justify-content-between gap-3 mb-4">
  <button
    className={`btn ${activeView === "catalog" ? "btn-dark" : "btn-outline-dark"}`}
    style={activeView === "catalog" ? { backgroundColor: "#ed3545", borderColor: "#ed3545" } : {}}
    onClick={() => { setActiveView("catalog"); setActiveTab(0); }}
  >
    Dress Catalog
  </button>
  <button
    className={`btn ${activeView === "add" ? "btn-dark" : "btn-outline-dark"}`}
    style={activeView === "add" ? { backgroundColor: "#ed3545", borderColor: "#ed3545" } : {}}
    onClick={() => { resetForm(); setActiveView("add"); setActiveTab(1); }}
  >
    Add New Dress
  </button>
  {activeView === "edit" && activeTab === 2 && (
    <button className="btn btn-warning" disabled>
      <i className="bi bi-pencil text-dark"></i>
    </button>
  )}
</div>

      {/* ERROR ALERT */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* ADD/EDIT FORM */}
{((activeView === "add" && activeTab === 1) || (activeView === "edit" && activeTab === 2)) && (
  // form JSX
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white border-bottom">
            <h4 className="mb-0" style={{ color: "#ed3545" }}>
              {activeView === "add" ? "Add New Dress" : `Edit: ${selectedDress?.name}`}
            </h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">Dress Name *</label>
                  <input className="form-control" name="name" required value={form.name} onChange={handleChange} disabled={loading} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Category *</label>
                  <input className="form-control" name="category" required value={form.category} onChange={handleChange} disabled={loading} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Price ($) *</label>
                  <input type="number" className="form-control" name="price" required min="0" step="0.01" value={form.price} onChange={handleChange} disabled={loading} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Discount (%)</label>
                  <input type="number" className="form-control" name="discount" min="0" max="100" value={form.discount} onChange={handleChange} disabled={loading} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Occasion</label>
                  <input className="form-control" name="occasion" value={form.occasion} onChange={handleChange} disabled={loading} />
                </div>
              </div>

              {/* Material & Color */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">Material</label>
                  <input className="form-control" name="material" value={form.material} onChange={handleChange} disabled={loading} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Color</label>
                  <input className="form-control" name="color" value={form.color} onChange={handleChange} disabled={loading} />
                </div>
              </div>

              {/* Sizes */}
              <div className="mb-4">
                <h5>Regular Sizes & Stock</h5>
                <div className="row g-2 align-items-end mb-3">
                  <div className="col-md-4">
                    <input className="form-control" placeholder="Size (S, M, L, XL)" value={size} onChange={(e) => setSize(e.target.value)} disabled={loading} />
                  </div>
                  <div className="col-md-4">
                    <input type="number" className="form-control" placeholder="Stock" min="0" value={stock} onChange={(e) => setStock(e.target.value)} disabled={loading} />
                  </div>
                  <div className="col-md-4">
                    <button type="button" className="btn btn-outline-primary w-100" onClick={addSize} disabled={loading}>Add Size</button>
                  </div>
                </div>
                {sizes.length > 0 && (
                  <div className="list-group mb-3">
                    {sizes.map((s, i) => (
                      <div key={i} className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="badge bg-primary me-2">{s.size}</span>
                        <span>Stock: <strong>{s.stock}</strong></span>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeSize(i)} disabled={loading}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Meter Sizes - FIXED */}
              <div className="mb-4">
                <h5>Meter Sizes (Optional)</h5>
                <div className="row g-2 align-items-end mb-3">
                  <div className="col-md-4">
                    <input className="form-control" placeholder="e.g., 5m, 6.5m" value={meterSize} onChange={(e) => setMeterSize(e.target.value)} disabled={loading} />
                  </div>
                  <div className="col-md-4">
                    <input type="number" className="form-control" placeholder="Stock" min="0" value={meterStock} onChange={(e) => setMeterStock(e.target.value)} disabled={loading} />
                  </div>
                  <div className="col-md-4">
                    <button type="button" className="btn btn-outline-secondary w-100" onClick={addMeterSize} disabled={loading}>Add Meter Size</button>
                  </div>
                </div>
                {meterSizes.length > 0 && (
                  <div className="list-group mb-3">
                    {meterSizes.map((s, i) => (
                      <div key={i} className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="badge bg-secondary me-2">{s.size}</span>
                        <span>Stock: <strong>{s.stock}</strong></span>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeMeterSize(i)} disabled={loading}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="4" name="description" placeholder="Enter dress description..." value={form.description} onChange={handleChange} disabled={loading} />
              </div>

              {/* Images */}
              <div className="mb-4">
                <h5>Images</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Cover Image {activeView === "add" && "*"}</label>
                    <input type="file" className="form-control" required={activeView === "add"} accept="image/*" onChange={handleCoverImageChange} disabled={loading} />
                    {coverImage && (
                      <div className="mt-2">
                        <small>Selected: {coverImage.name}</small>
                        <img src={URL.createObjectURL(coverImage)} alt="Cover preview" className="img-thumbnail d-block mt-1" style={{ width: "80px", height: "80px", objectFit: "cover" }} />
                      </div>
                    )}
                    {activeView === "edit" && <small className="text-muted d-block mt-1">Leave empty to keep existing image</small>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Gallery Images (max 3)</label>
                    <input type="file" multiple className="form-control" accept="image/*" onChange={handleGalleryImagesChange} disabled={loading} />
                    {galleryPreviews.length > 0 && (
                      <div className="mt-2">
                        <small>{galleryPreviews.length} image(s) selected</small>
                        <div className="d-flex gap-2 mt-1">
                          {galleryPreviews.map((preview, idx) => (
                            <img key={idx} src={preview} alt="Preview" className="img-thumbnail" style={{ width: "60px", height: "60px", objectFit: "cover" }} />
                          ))}
                        </div>
                      </div>
                    )}
                    {activeView === "edit" && <small className="text-muted d-block mt-1">Uploading new images replaces all existing gallery images</small>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex gap-2">
                <button type="submit" className="btn" style={{ backgroundColor: "#ed3545", color: "white" }} disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                  {activeView === "edit" ? "Update Dress" : "Add Dress"}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setActiveView("catalog"); setActiveTab(0); }} disabled={loading}>Cancel</button>
                <button type="button" className="btn btn-outline-danger" onClick={resetForm} disabled={loading}>Reset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(activeView === "catalog" && activeTab === 0 )&& (

      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center border-bottom">
          <h4 className="mb-0" style={{ color: "#ed3545" }}>Dress Catalog</h4>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-dark" onClick={fetchDresses} disabled={isLoadingDresses}> Refresh</button>
            <span className="badge bg-dark p-2">Total: {dresses.length}</span>
          </div>
        </div>
        <div className="card-body p-0">
          {isLoadingDresses ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div><p className="mt-3">Loading dresses...</p></div>
          ) : dresses.length === 0 ? (
            <div className="text-center py-5"><i className="bi bi-emoji-frown" style={{ fontSize: "3rem" }}></i><h5 className="mt-3">No dresses found</h5><p>Click "Add New Dress" to get started.</p></div>
          ) : (
            <div className="table-responsive" >
              <table className="table table-hover mb-0 text-center">
                <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                  <tr>
                    <th>Cover</th><th>Gallery</th><th>Name</th><th>Category</th><th>Material</th><th>Sizes & Stock</th><th>Price</th><th>Disc.</th><th>Final</th><th>Occasion</th><th>Color</th><th>Description</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dresses.map(dress => {
                    const totalRegStock = totalStock(dress.sizes);
                    const totalMeterStock = totalStock(dress.meterSizes);
                    return (
                      <tr key={dress._id}>
                        <td>
                          {dress.images?.cover ? (
                            <img src={dress.images.cover} alt={dress.name} className="rounded border" style={{ width: "60px", height: "60px", objectFit: "cover", cursor: "pointer" }} onClick={() => window.open(dress.images.cover, '_blank')} />
                          ) : <div className="bg-light rounded border d-inline-block" style={{ width: "60px", height: "60px" }}></div>}
                        </td>
                        <td>
                          {dress.images?.gallery?.length ? (
                            <div className="d-flex gap-1">
                              {dress.images.gallery.slice(0,2).map((img, idx) => (
                                <img key={idx} src={img} className="rounded border" style={{ width: "40px", height: "40px", objectFit: "cover", cursor: "pointer" }} onClick={() => viewGallery(dress.images.gallery)} />
                              ))}
                              {dress.images.gallery.length > 2 && (
                                <div className="bg-secondary text-white d-flex align-items-center justify-content-center rounded border" style={{ width: "40px", height: "40px", cursor: "pointer" }} onClick={() => viewGallery(dress.images.gallery)}>+{dress.images.gallery.length-2}</div>
                              )}
                            </div>
                          ) : <span className="text-muted">No gallery</span>}
                        </td>
                        <td className="fw-bold p-5 w-auto">{dress.name}</td>
                        <td>{dress.category || "-"}</td>
                        <td>{dress.material || "-"}</td>
                        <td className="">
                          <div className="small d-flex flex-row gap-5">
                            {dress.sizes?.map((s, idx) => <div key={idx}><span className="badge bg-light text-dark me-1">Size - {s.size} :</span> <small className="small">Stock - {s.stock}</small></div>)}
                            {dress.meterSizes?.length > 0 && (
                              <>
                                <div className="mt-1"><small className="text-muted">Meter sizes:</small></div>
                                {dress.meterSizes.map((s, idx) => <div key={idx}><span className="badge bg-secondary me-1">Size - {s.size} :</span> <small className="small">Stock - {s.stock}</small></div>)}
                              </>
                            )}
                            <div className="mt-1"><small className="text-primary fw-bold">Total: {totalRegStock + totalMeterStock} units</small></div>
                          </div>
                        </td>
                        <td>${dress.price || "0"}</td>
                        <td>{dress.discount || "0"}%</td>
                        <td className="fw-bold text-success">${dress.finalPrice || dress.price || "0"}</td>
                        <td>{dress.occasion || "-"}</td>
                        <td><span className="badge" style={{ backgroundColor: dress.color?.toLowerCase() || "#ccc", color: "#ffffff",border:'1px solid #ed3545' }}>{dress.color || "-"}</span></td>
                        <td style={{ maxWidth: "200px" }}>
                          <div className="text-truncate small">{dress.description || "No description"}</div>
                          {dress.description?.length > 50 && <button className="btn btn-link btn-sm p-0 mt-1" onClick={() => viewDescription(dress.description)}>Read more</button>}
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <button className="btn btn-sm btn-white" onClick={() => handleEditClick(dress)} disabled={loading}>
                              <i className="bi bi-pencil text-dark"></i> 
                            </button>
                            <button className="btn btn-sm btn-white" onClick={() => handleDelete(dress._id, dress.name)} disabled={loading}>
                              <i className="bi bi-trash text-danger"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
)}
      {/* MODAL */}
      {showModal && (
        <div className="modal fade show d-block mt-3" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content small">
              <div className="modal-header">
                <h5 className="modal-title" style={{ color: "#ed3545" }}>{modalTitle}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">{modalContent}</div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0,0,0,0.3)", zIndex: 9999 }}>
          <div className="spinner-border text-primary" style={{ width: "4rem", height: "4rem" }}></div>
        </div>
      )}
    </div>
    
  );
});

DressManagement.displayName = "DressManagement";
export default DressManagement;