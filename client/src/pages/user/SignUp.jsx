import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import backgroundVideo from '../../assets/background.mp4';
import axios from 'axios';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const toggleOff = () => {
    setShowTerms(false);
    setShowPrivacy(false);
  };

  // Professional 20-point Terms for Jewelry/Apparel
  const terms = [
    "All jewelry is 'Imitation/Dummy' and contains no precious metals unless stated.",
    "Colors may vary slightly due to digital photography lighting.",
    "Clothing must be returned within 7 days of delivery.",
    "Items must be unworn, unwashed, and have original tags attached.",
    "Hygiene protocol: Earrings and nose pins are non-returnable.",
    "Standard shipping takes 5-7 business days.",
    "Expedited shipping is available at extra cost.",
    "We are not responsible for delays caused by courier services.",
    "Orders can only be cancelled within 2 hours of placement.",
    "Refunds are processed within 10-12 working days.",
    "Incorrect addresses provided by users are not our liability.",
    "We reserve the right to refuse service to anyone.",
    "Product prices are subject to change without notice.",
    "Discounts and coupons cannot be combined.",
    "Wholesale inquiries must be made via our official contact form.",
    "Damaged items must be reported within 24 hours of receipt with video proof.",
    "International customs duties are the responsibility of the buyer.",
    "Account security is the sole responsibility of the user.",
    "Intellectual property: Website images cannot be used without permission.",
    "Terms are governed by local e-commerce trade laws."
  ];

  const isAnyOpen = showTerms || showPrivacy;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        // Store token
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        alert('Sign up successful!');
        navigate('/');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({
        general: error.response?.data?.message || 'Failed to sign up. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        
        }

        .auth-card {
          background: transparent;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(237, 53, 69, 0.1);
          width: 100%;
          max-width: 450px;
          overflow: hidden;
          animation: slideUp 0.5s ease;
          height: 510px;
           border:1px solid white;
           padding:10px;
        }

        .auth-header {
          background: transparent;
          padding: 10px;
          text-align: center;
          border-bottom: 1px solid white;
        }

        .auth-header h2 {
          color: #ed3545;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          -webkit-text-stroke: .5px white;
        }

        .auth-header p {
          color: rgba(0, 0, 0, 0.9);
          margin: 10px 0 0;
          font-size: 14px;
        }

        .auth-body {
          padding: 5px;
        }

        .form-group {
          margin-bottom: 5px;
        }

        .form-label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
          -webkit-text-stroke: .10px #efe8e8;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }

        .form-input {
          width: 100%;
          height: 40px;
          padding: 12px 12px 12px 40px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          border-color: #ed3545;
          outline: none;
          box-shadow: 0 0 0 3px rgba(237, 53, 69, 0.1);
        }

        .form-input.error {
          border-color: #dc3545;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          color: #999;
        }

        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 5px;
          display: block;
        }

        .general-error {
          background: #fee;
          color: #dc3545;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          text-align: center;
          border: 1px solid #fcc;
        }

        .btn-primary {
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #ed3545 0%, #ff6b6b 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
          height: 45px;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(237, 53, 69, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          margin-top: 10px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .auth-footer p {
          color: #ffffff;
          margin: 0;
          font-size: 14px;
        }

        .auth-link {
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .auth-link:hover {
          color: #000000;
          text-decoration: underline;
        }

        .terms {
          margin-top: 5px;
          font-size: 12px;
          color: #ffffff;
          text-align: center;
        }

        .terms a {
          color: #ffffff;
          text-decoration: none;
          font-weight:bold;
          text-decoration:underline;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
               .legal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .legal-modal-card {
          width: 100%;
          max-width: 600px;
          border-radius: 12px;
          border: none;
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        `}
      </style>

      <div className="auth-container">
           <video
                autoPlay
                muted
                loop
                playsInline
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', // Ensures the video covers the entire div
                  zIndex: '-1',
                  filter: 'brightness(0.8)'
                }}
              >
                <source src={backgroundVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
        <div className="auth-card ">
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Join DAG to start shopping</p>
          </div>

          <div className="auth-body">
            {errors.general && (
              <div className="general-error">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label text-white">Full Name</label>
                <div className="input-wrapper">
                  
                  <input
                    type="text"
                    name="name"
                    className={`form-input border-0 ${errors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label text-white">Email Address</label>
                <div className="input-wrapper">
                  
                  <input
                    type="email"
                    name="email"
                    className={`form-input border-0 ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
<div className="d-flex flex-row gap-3">
              <div className="form-group">
                <label className="form-label text-white">Password</label>
                <div className="input-wrapper">
                  
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input border-0 ${errors.password ? 'error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                  />
                  <span 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi text-dark ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </span>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label text-white">Confirm Password</label>
                <div className="input-wrapper">
                 
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-input border-0 ${errors.confirmPassword ? 'error' : ''}`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                  />
                  <span 
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`bi text-dark ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </span>
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
</div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating Account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                  Login
                </Link>
              </p>
            </div>

            <div className="terms">
              By signing up, you agree to our{' '}
              <a href="/terms"  onClick={(e) => { e.preventDefault(); setShowTerms(!showTerms); }}>Terms of Service</a> and{' '}
              <a href="/privacy" onClick={(e) => { e.preventDefault(); setShowPrivacy(!showPrivacy); }}>Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
       

      {/* Centered Overlay Container */}
      {isAnyOpen && (
        <div className="legal-overlay" onClick={toggleOff}>
          <div className="legal-modal-card card shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="card-header bg-white d-flex justify-content-between align-items-center sticky-top">
              <h5 className="mb-0 fw-bold">{showTerms ? "Terms & Conditions" : "Privacy Policy"}</h5>
              <button className="btn-close" onClick={toggleOff}></button>
            </div>
            
            <div className="card-body overflow-auto" style={{ maxHeight: '70vh' }}>
              {showTerms ? (
                <small>
                <ol className="list-group list-group-flush list-group-numbered">
                  {terms.map((item, index) => (
                    <li key={index} className="list-group-item small text-muted">{item}</li>
                  ))}
                </ol>
                </small>
              ) : (
                <div className="small text-muted">
                  <p><strong>Data Collection:</strong> We collect name, shipping address, and email for order fulfillment.</p>
                  <p><strong>Security:</strong> We use SSL encryption for all transactions.</p>
                  <p><strong>Cookies:</strong> Used only to improve your shopping experience and cart persistence.</p>
                  <p><strong>Third Parties:</strong> We only share data with logistics partners to deliver your goods.</p>
                </div>
              )}
            </div>

            <div className="card-footer bg-light text-end">
              <button className="btn btn-dark btn-sm" onClick={toggleOff}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SignUp;