import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import backgroundVideo from '../../assets/background.mp4';
import { useAuth } from '../../context/AuthContext';

import API_BASE_URL from '../../Config/Api';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: OTP & new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ type: '', text: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        login(response.data.user, response.data.token);
        alert('Login successful!');
        
        if (response.data.user.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error.response?.data?.message || 'Invalid email or password'
      });
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Handlers
  const handleSendOtp = async () => {
    if (!forgotEmail) {
      setForgotMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      setForgotMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setForgotLoading(true);
    setForgotMessage({ type: '', text: '' });
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: forgotEmail
      });
      if (response.data.success) {
        setForgotMessage({ type: 'success', text: 'OTP sent to your email. Please check your inbox.' });
        setForgotStep(2);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setForgotMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send OTP. Please try again.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || otp.length !== 6) {
      setForgotMessage({ type: 'error', text: 'Please enter a valid 6-digit OTP' });
      return;
    }
    if (!newPassword) {
      setForgotMessage({ type: 'error', text: 'Please enter a new password' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setForgotMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setForgotLoading(true);
    setForgotMessage({ type: '', text: '' });
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email: forgotEmail,
        otp: otp,
        newPassword: newPassword
      });
      if (response.data.success) {
        setForgotMessage({ type: 'success', text: 'Password reset successful! You can now login.' });
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowForgotModal(false);
          resetForgotState();
        }, 2000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setForgotMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reset password. Please try again.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotState = () => {
    setForgotStep(1);
    setForgotEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotMessage({ type: '', text: '' });
    setForgotLoading(false);
  };

  const closeModal = () => {
    setShowForgotModal(false);
    resetForgotState();
  };

  return (
    <>
      <style>{`
        .auth-container {
          min-height: 100vh;
          position: relative;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .auth-card {
          background: transparent;
          position: relative;
          z-index: 1;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(237, 53, 69, 0.1);
          width: 100%;
          max-width: 450px;
          overflow: hidden;
          animation: slideUp 0.5s ease;
          border: 1px solid white;
          padding: 20px;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-header {
          padding: 30px;
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
          font-weight: bold;
        }
        .auth-body {
          padding: 30px;
        }
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #ffffff;
          font-size: 14px;
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
        .form-label {
          color: white;
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
          padding: 14px;
          background: linear-gradient(135deg, #ed3545 0%, #ff6b6b 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
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
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }
        .auth-footer p {
          color: #666;
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
        .forgot-password {
          text-align: right;
          margin: 10px 0;
        }
        .forgot-password a {
          color: #ffffff;
          text-decoration: none;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
        }
        .forgot-password a:hover {
          text-decoration: underline;
        }
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .modal-container {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 450px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }
        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
          color: #ed3545;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }
        .modal-body {
          padding: 20px;
        }
        .modal-footer {
          padding: 20px;
          border-top: 1px solid #eee;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-secondary:hover {
          background: #5a6268;
        }
        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 15px;
          font-size: 14px;
        }
      `}</style>

      <div className="auth-container mt-0 mb-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1,
            filter: 'brightness(0.8)'
          }}
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Login to your DAG account</p>
          </div>

          <div className="auth-body">
            {errors.general && (
              <div className="general-error">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {errors.general}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label text-white fw-bold">Email Address</label>
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

              <div className="form-group">
                <label className="form-label text-white fw-bold">Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input border-0 ${errors.password ? 'error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                  <span 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash text-dark' : 'bi-eye text-dark'}`}></i>
                  </span>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="forgot-password">
                <a onClick={() => setShowForgotModal(true)} className='text-white fw-bold'>Forgot Password?</a>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p className='text-white'>
                Don't have an account?{' '}
                <Link to="/signup" className="auth-link">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              {forgotMessage.text && (
                <div className={forgotMessage.type === 'success' ? 'success-message' : 'general-error'}>
                  {forgotMessage.text}
                </div>
              )}
              
              {forgotStep === 1 && (
                <>
                  <p>Enter your email address and we'll send you a 6-digit OTP to reset your password.</p>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#333' }}>Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your email"
                      style={{ paddingLeft: '12px' }}
                    />
                  </div>
                </>
              )}

              {forgotStep === 2 && (
                <>
                  <p>Enter the OTP sent to <strong style={{textTransform:'none'}}>{forgotEmail}</strong> and your new password.</p>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#333' }}>OTP</label>
                    <input
                      type="text"
                      className="form-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      style={{ paddingLeft: '12px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#333' }}>New Password</label>
                    <div className="input-wrapper">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        style={{ paddingLeft: '12px' }}
                      />
                      <span 
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#333' }}>Confirm Password</label>
                    <div className="input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        style={{ paddingLeft: '12px' }}
                      />
                      <span 
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              {forgotStep === 1 && (
                <button className="btn-primary" onClick={handleSendOtp} disabled={forgotLoading} style={{ margin: 0 }}>
                  {forgotLoading ? 'Sending...' : 'Send OTP'}
                </button>
              )}
              {forgotStep === 2 && (
                <button className="btn-primary" onClick={handleResetPassword} disabled={forgotLoading} style={{ margin: 0 }}>
                  {forgotLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Login;