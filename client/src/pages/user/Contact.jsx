import React, { useState,useEffect,useRef } from 'react';
import '../../styles/Contact.css';
import audioFile from "../../assets/background.mp3"; // Replace with your music file path

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    
    // Simulate API call
    setTimeout(() => {
      setFormStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormStatus(null), 3000);
    }, 1500);
  };
    const audioRef = useRef(new Audio(audioFile)); // Replace with your music file path

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;

    // Start playing
    audio.play().catch(error => {
      console.log("Autoplay blocked by browser. User must click first.");
    });

    // Cleanup: Stops music when page/component closes
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I track my order?",
      answer: "You can track your order by logging into your account and visiting the 'My Orders' section. You'll also receive tracking information via email and SMS once your order ships."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), UPI, Net Banking, Google Pay, PhonePe, and Cash on Delivery (COD) for eligible orders."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping takes 3-5 business days, Express shipping takes 1-2 business days, and Same Day Delivery is available in select cities. Delivery times may vary based on your location."
    },
    {
      question: "Do you offer international shipping?",
      answer: "Currently, we ship only within India. International shipping will be available soon! Stay tuned for updates."
    },
    {
      question: "How can I return an item?",
      answer: "You can initiate a return within 30 days of delivery. Go to 'My Orders', select the item, and click 'Return'. We'll arrange a pickup or provide return instructions."
    },
    {
      question: "How long does it take to process a refund?",
      answer: "Refunds are processed within 7-10 business days after we receive and inspect the returned item. The amount will be credited to your original payment method."
    }
  ];

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="hero-content">
          <h1 className="hero-title">Get in Touch</h1>
          <p className="hero-subtitle">We're here to help you with any questions or concerns</p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="contact-info-section">
        <div className="container">
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">
                <i className="bi bi-geo-alt-fill"></i>
              </div>
              <h3>Visit Us</h3>
              <p>123 Fashion Street,<br />Andheri East, Mumbai - 400093<br />Maharashtra, India</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <i className="bi bi-envelope-fill"></i>
              </div>
              <h3>Email Us</h3>
              <p>support@dagfashion.com<br />careers@dagfashion.com</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <i className="bi bi-telephone-fill"></i>
              </div>
              <h3>Call Us</h3>
              <p>+91 22 1234 5678<br />+91 98765 43210</p>
              <small>Mon-Sat, 10AM - 7PM</small>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <i className="bi bi-clock-fill"></i>
              </div>
              <h3>Support Hours</h3>
              <p>Monday - Friday: 9AM - 8PM<br />Saturday: 10AM - 6PM<br />Sunday: Closed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-form-section">
        <div className="container">
          <div className="form-container">
            <div className="form-header">
              <h2 className="section-title">Send Us a Message</h2>
              <div className="title-underline"></div>
              <p>Have questions? Fill out the form below and we'll get back to you within 24 hours.</p>
            </div>
            
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="What is this regarding?"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  placeholder="Please describe your query in detail..."
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="submit-btn"
                disabled={formStatus === 'sending'}
              >
                {formStatus === 'sending' ? (
                  <>
                    <i className="bi bi-hourglass-split"></i> Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send"></i> Send Message
                  </>
                )}
              </button>
              
              {formStatus === 'success' && (
                <div className="success-message">
                  <i className="bi bi-check-circle-fill"></i>
                  Thank you for your message! We'll get back to you soon.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <div className="title-underline"></div>
            <p className="section-subtitle">Find quick answers to common questions</p>
          </div>
          
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <h3>{faq.question}</h3>
                  <i className={`bi ${activeFaq === index ? 'bi-dash-lg' : 'bi-plus-lg'}`}></i>
                </div>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Center Section */}
      <section className="help-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Help Center</h2>
            <div className="title-underline"></div>
            <p className="section-subtitle">Resources to help you shop with confidence</p>
          </div>
          
          <div className="help-grid">
            <div className="help-card">
              <div className="help-icon">
                <i className="bi bi-person-circle"></i>
              </div>
              <h3>Account Management</h3>
              <ul>
                <li>How to create an account</li>
                <li>Forgot password recovery</li>
                <li>Updating profile information</li>
                <li>Managing addresses</li>
              </ul>
              <a href="#" className="help-link">Learn More <i className="bi bi-arrow-right"></i></a>
            </div>
            
            <div className="help-card">
              <div className="help-icon">
                <i className="bi bi-cart-check"></i>
              </div>
              <h3>Order & Payment</h3>
              <ul>
                <li>How to place an order</li>
                <li>Payment options explained</li>
                <li>Order cancellation policy</li>
                <li>Gift cards & vouchers</li>
              </ul>
              <a href="#" className="help-link">Learn More <i className="bi bi-arrow-right"></i></a>
            </div>
            
            <div className="help-card">
              <div className="help-icon">
                <i className="bi bi-truck"></i>
              </div>
              <h3>Shipping & Delivery</h3>
              <ul>
                <li>Shipping rates & timelines</li>
                <li>Order tracking guide</li>
                <li>Delivery issues</li>
                <li>International shipping</li>
              </ul>
              <a href="#" className="help-link">Learn More <i className="bi bi-arrow-right"></i></a>
            </div>
            
            <div className="help-card">
              <div className="help-icon">
                <i className="bi bi-shield-check"></i>
              </div>
              <h3>Security & Privacy</h3>
              <ul>
                <li>Secure shopping guarantee</li>
                <li>Privacy policy overview</li>
                <li>Data protection</li>
                <li>Fraud prevention</li>
              </ul>
              <a href="#" className="help-link">Learn More <i className="bi bi-arrow-right"></i></a>
            </div>
          </div>
        </div>
      </section>

      {/* Returns & Exchanges Section */}
      <section className="returns-section">
        <div className="container">
          <div className="returns-header">
            <h2 className="section-title">Returns & Exchanges</h2>
            <div className="title-underline"></div>
            <p className="section-subtitle">Hassle-free returns and exchanges for your peace of mind</p>
          </div>
          
          <div className="returns-content">
            <div className="returns-policy">
              <div className="policy-card">
                <i className="bi bi-arrow-return-left"></i>
                <h3>30-Day Return Policy</h3>
                <p>We offer a 30-day return policy from the date of delivery. Items must be unused, unworn, and in original packaging with all tags attached.</p>
              </div>
              
              <div className="policy-card">
                <i className="bi bi-arrow-left-right"></i>
                <h3>Easy Exchanges</h3>
                <p>Not happy with your size? We offer free size exchanges within 15 days of delivery. Simply request an exchange through your account.</p>
              </div>
              
              <div className="policy-card">
                <i className="bi bi-cash-stack"></i>
                <h3>Quick Refunds</h3>
                <p>Refunds are processed within 7-10 business days after we receive and inspect your return. Money is credited to your original payment method.</p>
              </div>
              
              <div className="policy-card">
                <i className="bi bi-box-seam"></i>
                <h3>Free Pickup</h3>
                <p>We offer free return pickup for eligible items. Our courier partner will collect the item from your address at no extra cost.</p>
              </div>
            </div>
            
            <div className="return-steps">
              <h3>How to Return or Exchange</h3>
              <div className="steps-container">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Log into Your Account</h4>
                    <p>Go to 'My Orders' and select the item you wish to return or exchange</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Select Return Reason</h4>
                    <p>Choose the reason for return and add any additional comments</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Pack Your Item</h4>
                    <p>Pack the item securely in original packaging with all tags attached</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Schedule Pickup</h4>
                    <p>Choose a convenient date and time for return pickup</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">5</div>
                  <div className="step-content">
                    <h4>Track Return Status</h4>
                    <p>Monitor your return status in your account dashboard</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="return-conditions">
              <h3>Return Conditions</h3>
              <div className="conditions-grid">
                <div className="condition">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Items must be unused and unworn</span>
                </div>
                <div className="condition">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Original tags and packaging required</span>
                </div>
                <div className="condition">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Returns accepted within 30 days</span>
                </div>
                <div className="condition">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Exchanges accepted within 15 days</span>
                </div>
                <div className="condition">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Clearance items are final sale</span>
                </div>
                <div className="condition">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Customized items cannot be returned</span>
                </div>
              </div>
            </div>
            
            <div className="return-note">
              <i className="bi bi-info-circle-fill"></i>
              <p>For damaged or defective items, please contact our support team immediately. We'll arrange a replacement or refund at no extra cost.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Chat Section */}
      <section className="live-chat-section">
        <div className="container">
          <div className="chat-content">
            <i className="bi bi-chat-dots-fill"></i>
            <h3>Need Immediate Assistance?</h3>
            <p>Our customer support team is ready to help you with any questions</p>
            <button className="chat-btn">
              <i className="bi bi-messenger text-white"></i> Start Live Chat
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;