import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

import API_BASE_URL from '../../Config/Api';

function Review({ productType, productId }) {
  const { isAuthenticated, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [userReview, setUserReview] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [productType, productId]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserReview();
    }
  }, [isAuthenticated, user, productType, productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/reviews/${productType}/${productId}`
      );
      
      if (response.data.success) {
        setReviews(response.data.reviews);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/reviews/user/${productType}/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success && response.data.review) {
        setUserReview(response.data.review);
        setFormData({
          rating: response.data.review.rating,
          comment: response.data.review.comment
        });
      }
    } catch (error) {
      console.error('Error fetching user review:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please login to write a review');
      return;
    }
    
    if (!formData.comment.trim()) {
      alert('Please write a review');
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      if (userReview) {
        // Update existing review
        const response = await axios.put(
          `${API_BASE_URL}/reviews/${userReview._id}`,
          {
            rating: formData.rating,
            comment: formData.comment
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          alert('Review updated successfully!');
          setUserReview(response.data.review);
        }
      } else {
        // Add new review
        const response = await axios.post(
          `${API_BASE_URL}/reviews`,
          {
            productType,
            productId,
            rating: formData.rating,
            comment: formData.comment
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          alert('Review added successfully!');
          setUserReview(response.data.review);
        }
      }
      
      // Refresh reviews
      fetchReviews();
      setIsVisible(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/reviews/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('Review deleted successfully!');
        if (userReview && userReview._id === reviewId) {
          setUserReview(null);
          setFormData({ rating: 5, comment: '' });
        }
        fetchReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const toggleVisibility = () => {
    if (!isAuthenticated) {
      alert('Please login to write a review');
      return;
    }
    setIsVisible(!isVisible);
  };

  const startEdit = (review) => {
    setEditingId(review._id);
    setFormData({
      rating: review.rating,
      comment: review.comment
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      rating: userReview?.rating || 5,
      comment: userReview?.comment || ''
    });
  };

  // Get top 5 rated reviews
  const topReviews = [...reviews]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  // Get remaining reviews
  const otherReviews = reviews.filter(
    review => !topReviews.some(top => top._id === review._id)
  );

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <i
        key={index}
        className={`bi ${index < rating ? 'bi-star-fill' : 'bi-star'}`}
        style={{ color: index < rating ? '#ed3545' : '#ccc' }}
      ></i>
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <style>{`
        .review-container {
          max-width: 1200px;
          margin: 40px auto;
          padding: 30px;
          background: white;
          border-radius: 20px;
        ;
        }

        .review-heading {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 30px;
          position: relative;
        }

        .review-heading:after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, #ed3545, #ff6b6b);
          border-radius: 2px;
        }

        /* Rating Summary */
        .rating-summary {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
        }

        .average-rating {
          text-align: center;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .average-number {
          font-size: 48px;
          font-weight: 700;
          color: #ed3545;
          line-height: 1;
        }

        .total-reviews {
          color: #666;
          font-size: 14px;
          margin-top: 5px;
        }

        .rating-bars {
          padding: 10px 20px;
        }

        .rating-bar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .rating-label {
          min-width: 60px;
          font-size: 14px;
          color: #666;
        }

        .bar-container {
          flex: 1;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ed3545, #ff6b6b);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .rating-count {
          min-width: 40px;
          font-size: 14px;
          color: #666;
          text-align: right;
        }

        /* Write Review Button */
        .write-review-btn {
          background: transparent;
          border: 2px solid #ed3545;
          color: #ed3545;
          padding: 10px 25px;
          border-radius: 30px;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .write-review-btn:hover {
          background: #ed3545;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(237,53,69,0.2);
        }

        .write-review-btn.cancel {
          background: #ed3545;
          color: white;
        }

        /* Review Form */
        .review-form {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .rating-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .star-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .star-btn:hover {
          transform: scale(1.2);
        }

        .star-btn.selected i {
          color: #ed3545;
        }

        .review-textarea {
          width: 100%;
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 14px;
          resize: vertical;
          transition: all 0.3s ease;
        }

        .review-textarea:focus {
          border-color: #ed3545;
          outline: none;
          box-shadow: 0 0 0 3px rgba(237,53,69,0.1);
        }

        .submit-btn {
          background: linear-gradient(135deg, #ed3545 0%, #ff6b6b 100%);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 30px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 15px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(237,53,69,0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Reviews List */
        .reviews-section {
          margin-top: 30px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin-bottom: 20px;
        }

        .top-reviews {
          margin-bottom: 30px;
        }

        .review-card {
          background: white;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }

        .review-card:hover {
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          transform: translateY(-2px);
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .reviewer-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .reviewer-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ed3545 0%, #ff6b6b 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
        }

        .reviewer-name {
          font-weight: 600;
          color: #333;
        }

        .review-date {
          font-size: 12px;
          color: #999;
        }

        .review-rating {
          margin-bottom: 10px;
        }

        .review-comment {
          color: #666;
          line-height: 1.6;
          font-size: 14px;
        }

        .review-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .action-btn {
          background: none;
          border: none;
          color: #999;
          font-size: 14px;
          cursor: pointer;
          transition: color 0.3s ease;
          padding: 5px;
        }

        .action-btn:hover {
          color: #ed3545;
        }

        .action-btn.delete:hover {
          color: #dc3545;
        }

        /* Other Reviews Scroll */
        .other-reviews {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 10px;
        }

        .other-reviews::-webkit-scrollbar {
          width: 5px;
        }

        .other-reviews::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .other-reviews::-webkit-scrollbar-thumb {
          background: #ed3545;
          border-radius: 10px;
        }

        .no-reviews {
          text-align: center;
          padding: 40px;
          color: #999;
          font-style: italic;
        }

        /* Edit Mode */
        .edit-form {
          margin-top: 10px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
        }

        .edit-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cancel-btn:hover {
          background: #5a6268;
        }

        /* Loading State */
        .loading-spinner {
          text-align: center;
          padding: 40px;
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

      <div className="review-container">
        <h2 className="review-heading text-center">Reviews & Ratings</h2>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading reviews...</p>
          </div>
        ) : (
          <>
            {/* Rating Summary */}
            {stats.totalReviews > 0 && (
              <div className="rating-summary">
                <div className="row d- flex justify-content-center align-items-center">
                  <div className="col-md-4">
                    <div className="average-rating">
                      <div className="average-number">{stats.averageRating}</div>
                      <div className="mb-2">
                        {renderStars(Math.round(stats.averageRating))}
                      </div>
                      <div className="total-reviews">
                        Based on {stats.totalReviews} reviews
                      </div>
                    </div>
                  </div>
                  <div className="col-md-8">
                    <div className="rating-bars">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="rating-bar-item">
                          <span className="rating-label">{rating} Star</span>
                          <div className="bar-container">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${(stats.ratingCounts[rating] / stats.totalReviews) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="rating-count">
                            {stats.ratingCounts[rating]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Write Review Button */}
            <div className="text-center mb-4">
              <button
                className={`write-review-btn ${isVisible ? 'cancel' : ''}`}
                onClick={toggleVisibility}
              >
                {isVisible ? '✕ Cancel' : '✎ Write a Review'}
              </button>
            </div>

            {/* Review Form */}
            {isVisible && (
              <div className="review-form">
                <form onSubmit={handleSubmit}>
                  <div className="rating-selector">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${formData.rating >= star ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, rating: star })}
                      >
                        <i className={`bi ${formData.rating >= star ? 'bi-star-fill' : 'bi-star'}`}></i>
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="review-textarea"
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    placeholder="Share your experience with this product..."
                    rows="4"
                    maxLength="500"
                  ></textarea>

                  <div className="text-end">
                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Submitting...
                        </>
                      ) : (
                        userReview ? 'Update Review' : 'Submit Review'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="no-reviews">
                <i className="bi bi-chat-dots" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                <p className="mt-3">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div className="reviews-section">
                {/* Top 5 Reviews */}
                {topReviews.length > 0 && (
                  <div className="top-reviews">
                    <h4 className="section-title">Top Reviews</h4>
                    {topReviews.map((review) => (
                      <div key={review._id} className="review-card">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <div className="reviewer-avatar">
                              {review.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="reviewer-name">{review.userName}</div>
                              <div className="review-date">{formatDate(review.createdAt)}</div>
                            </div>
                          </div>
                          {review.userId === user?._id && (
                            <div className="review-actions">
                              <button
                                className="border-0 bg-white"
                                onClick={() => startEdit(review)}
                              >
                                <i className="bi bi-pencil "></i>
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => handleDelete(review._id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          )}
                        </div>

                        {editingId === review._id ? (
                          <div className="edit-form">
                            <div className="rating-selector mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  className={`star-btn ${formData.rating >= star ? 'selected' : ''}`}
                                  onClick={() => setFormData({ ...formData, rating: star })}
                                >
                                  <i className={`bi ${formData.rating >= star ? 'bi-star-fill' : 'bi-star'}`}></i>
                                </button>
                              ))}
                            </div>
                            <textarea
                              className="review-textarea"
                              value={formData.comment}
                              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                              rows="3"
                            ></textarea>
                            <div className="edit-actions">
                              <button
                                className="submit-btn"
                                onClick={handleSubmit}
                                disabled={submitting}
                              >
                                Update
                              </button>
                              <button
                                className="cancel-btn"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="review-rating">
                              {renderStars(review.rating)}
                            </div>
                            <p className="review-comment">{review.comment}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Other Reviews */}
                {otherReviews.length > 0 && (
                  <div>
                    <h4 className="section-title"> All Reviews</h4>
                    <div className="other-reviews">
                      {otherReviews.map((review) => (
                        <div key={review._id} className="review-card">
                          <div className="review-header">
                            <div className="reviewer-info">
                              <div className="reviewer-avatar">
                                {review.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="reviewer-name">{review.userName}</div>
                                <div className="review-date">{formatDate(review.createdAt)}</div>
                              </div>
                            </div>
                            {review.userId === user?._id && (
                              <div className="review-actions">
                                <button
                                  className="action-btn"
                                  onClick={() => startEdit(review)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="action-btn delete"
                                  onClick={() => handleDelete(review._id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            )}
                          </div>

                          {editingId === review._id ? (
                            <div className="edit-form">
                              <div className="rating-selector mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    className={`star-btn ${formData.rating >= star ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                  >
                                    <i className={`bi ${formData.rating >= star ? 'bi-star-fill' : 'bi-star'}`}></i>
                                  </button>
                                ))}
                              </div>
                              <textarea
                                className="review-textarea"
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                rows="3"
                              ></textarea>
                              <div className="edit-actions">
                                <button
                                  className="submit-btn"
                                  onClick={handleSubmit}
                                  disabled={submitting}
                                >
                                  Update
                                </button>
                                <button
                                  className="cancel-btn"
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="review-rating">
                                {renderStars(review.rating)}
                              </div>
                              <p className="review-comment">{review.comment}</p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Review;